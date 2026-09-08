/**
 * Admin governance service (docs/phase_2.md §17, auth architecture §6).
 * Every mutation is audited with before/after state and a reason.
 */
const { prisma } = require("../db/client");
const { ApiError } = require("../utils/errors");
const { ADMIN_ROLE, ORG_ROLES, VERIFY_GATED_ROLES } = require("../constants/roles");
const { publish, publishDirect } = require("./notifications"); // phase 14: publish, never send
const { writeAudit } = require("./audit");
const {
  PROFILE_MODEL,
  PROFILE_FK,
  PROFILE_CODE_FIELD,
  PROFILE_VERIFY_FIELD,
  getUserWithProfile,
  generateOrgCode,
} = require("./accounts");

async function getOrgTarget(id) {
  const found = await getUserWithProfile(id);
  if (!found || !found.user) throw new ApiError("not_found", "User not found", 404);
  return found;
}

async function resolveVerificationRequest(userId, reviewerId, status, notes) {
  const open = await prisma.verificationRequest.findFirst({
    where: { user_id: userId, status: "pending" },
    orderBy: { created_at: "desc" },
  });
  if (open) {
    await prisma.verificationRequest.update({
      where: { id: open.id },
      data: { status, verified_by_user_id: reviewerId, verified_at: new Date(), notes },
    });
  }
}

/** Approve an org account: kyc verified + org code + profile verification_status. */
async function approveUser(actor, targetId, { orgCode = null, notes = null } = {}) {
  const { user, profile } = await getOrgTarget(targetId);
  if (user.role === ADMIN_ROLE || user.role === "consumer") {
    throw new ApiError("bad_request", "Only organization accounts can be approved", 400);
  }
  if (!ORG_ROLES.includes(user.role)) {
    throw new ApiError("bad_request", `Role '${user.role}' is not approvable`, 400);
  }

  if (!profile) throw new ApiError("bad_request", "Org account has no profile row yet", 400);

  const field = PROFILE_CODE_FIELD[user.role];
  // Prefer an explicit code; else generate. Retry once on generated-code race.
  const code = orgCode || (await generateOrgCode(user.role));
  try {
    const data = { [field]: code };
    if (PROFILE_VERIFY_FIELD[user.role]) data[PROFILE_VERIFY_FIELD[user.role]] = "verified";
    await prisma[PROFILE_MODEL[user.role]].update({
      where: { id: profile.id },
      data,
    });
  } catch (err) {
    if (err.code === "P2002" && !orgCode) {
      // Generated code collided (concurrent approval) — one retry.
      const data = { [field]: await generateOrgCode(user.role) };
      if (PROFILE_VERIFY_FIELD[user.role]) data[PROFILE_VERIFY_FIELD[user.role]] = "verified";
      await prisma[PROFILE_MODEL[user.role]].update({ where: { id: profile.id }, data });
    } else {
      throw err;
    }
  }

  await prisma.user.update({ where: { id: user.id }, data: { kyc_status: "verified" } });
  await resolveVerificationRequest(user.id, actor.id, "approved", notes);

  await writeAudit({
    actorUserId: actor.id,
    action: "USER_VERIFIED",
    targetType: "user",
    targetId: user.id,
    meta: { role: user.role, org_code: code, notes },
  });

  // Phase 14: tell the user their account was approved.
  await publishDirect({
    code: "account_approved",
    recipientUserId: user.id,
    data: { role: user.role, entity: { type: "user", id: user.id } },
  });
  return { user: await prisma.user.findUnique({ where: { id: user.id } }), org_code: code };
}

/** Reject an org account's verification. */
async function rejectUser(actor, targetId, { notes = null } = {}) {
  const { user } = await getOrgTarget(targetId);
  await prisma.user.update({ where: { id: user.id }, data: { kyc_status: "rejected" } });
  await resolveVerificationRequest(user.id, actor.id, "rejected", notes);
  await writeAudit({
    actorUserId: actor.id,
    action: "USER_REJECTED",
    targetType: "user",
    targetId: user.id,
    meta: { role: user.role, notes },
  });
  return prisma.user.findUnique({ where: { id: user.id } });
}

/** Suspend (is_active=false) or activate (is_active=true). */
async function setUserActive(actor, targetId, isActive, { notes = null } = {}) {
  const { user } = await getOrgTarget(targetId);
  if (user.role === ADMIN_ROLE) throw new ApiError("bad_request", "Admin accounts cannot be suspended via this API", 400);
  const updated = await prisma.user.update({ where: { id: user.id }, data: { is_active: isActive } });
  await writeAudit({
    actorUserId: actor.id,
    action: isActive ? "USER_ACTIVATED" : "USER_SUSPENDED",
    targetType: "user",
    targetId: user.id,
    meta: { from: user.is_active, to: isActive, notes },
  });
  return updated;
}

/**
 * Change a user's role. Guarded: cannot change admin accounts, cannot make
 * someone admin, and a farmer with farm plots cannot be demoted (deleting the
 * profile would cascade-delete their plots).
 */
async function changeUserRole(actor, targetId, newRole) {
  const { user, profile } = await getOrgTarget(targetId);
  const role = String(newRole ?? "").trim();
  if (![...ORG_ROLES, "consumer"].includes(role)) {
    throw new ApiError("bad_request", `Invalid target role '${role}'`, 400);
  }
  if (user.role === ADMIN_ROLE || role === ADMIN_ROLE) {
    throw new ApiError("bad_request", "Admin role cannot be changed through this API", 400);
  }
  if (role === user.role) return user; // idempotent

  const wasOrg = ORG_ROLES.includes(user.role);
  const toOrg = ORG_ROLES.includes(role);

  // Remove the old profile row when leaving an org role.
  if (wasOrg && !toOrg && profile) {
    if (user.role === "farmer") {
      const plots = await prisma.farmPlot.count({ where: { profile_id: profile.id } });
      if (plots > 0) {
        throw new ApiError("role_blocked", "Farmer has farm plots — archive the profile before changing roles", 409);
      }
    }
    await prisma[PROFILE_MODEL[user.role]].delete({ where: { id: profile.id } });
  }

  const kyc_status = toOrg ? "pending" : "none";
  const updated = await prisma.user.update({ where: { id: user.id }, data: { role, kyc_status } });

  if (toOrg) {
    const model = PROFILE_MODEL[role];
    const existing = await prisma[model].findUnique({ where: { [PROFILE_FK[role]]: user.id } });
    if (!existing) {
      await prisma[model].create({ data: { [PROFILE_FK[role]]: user.id } });
    }
  }

  await writeAudit({
    actorUserId: actor.id,
    action: "ROLE_CHANGE",
    targetType: "user",
    targetId: user.id,
    meta: { from: user.role, to: role, kyc_status },
  });
  return updated;
}

/** Pending + full user listing for the admin queue. */
async function listUsers({ role = null, status = null, offset = 0, limit = 50 } = {}) {
  const where = {};
  if (role) where.role = role;
  if (status) {
    if (status === "pending") {
      where.kyc_status = "pending";
    } else if (["verified", "rejected", "none"].includes(status)) {
      where.kyc_status = status;
    } else if (status === "suspended") {
      where.is_active = false;
    } else if (status === "active") {
      where.is_active = true;
    }
  }
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy: { created_at: "desc" }, skip: offset, take: limit }),
    prisma.user.count({ where }),
  ]);
  return { users, total };
}

/** Full dossier: user + profile + addresses + verification requests. */
async function getUserDossier(id) {
  const { user, profile } = await getOrgTarget(id);
  const [addresses, verificationRequests] = await Promise.all([
    prisma.address.findMany({ where: { user_id: id } }),
    prisma.verificationRequest.findMany({ where: { user_id: id }, orderBy: { created_at: "desc" } }),
  ]);
  return { user, profile, addresses, verification_requests: verificationRequests };
}

module.exports = {
  approveUser,
  rejectUser,
  setUserActive,
  changeUserRole,
  listUsers,
  getUserDossier,
  getOrgTarget,
};
