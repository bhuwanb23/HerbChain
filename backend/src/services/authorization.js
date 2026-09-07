/**
 * Authorization helpers (used by middleware + admin routes).
 *
 * DB-truth, not token-truth: grants are read from role_permissions on every
 * check, so a seed change (new role / new grant) applies immediately.
 */
const { prisma } = require("../db/client");
const { VERIFY_GATED_ROLES } = require("../constants/roles");

const ADMIN_ROLE = "admin";

/** Capabilities an unverified org account may still use (spec: farmer + consumer gates only apply to business keys). */
const UNGATED_KEYS = new Set(["profile.self", "trace.resolve"]);

async function userHasPermission(user, key) {
  if (!user) return false;
  if (user.role === ADMIN_ROLE) return true; // admin monitors everything
  const grant = await prisma.rolePermission.findFirst({
    where: { role: user.role, permission: { key } },
    select: { id: true },
  });
  return Boolean(grant);
}

/**
 * True when the account is an org role that must be AYUSH-verified before it
 * may use business capabilities (farmers are provisional-active — excluded).
 */
function isVerificationGated(user, key) {
  if (UNGATED_KEYS.has(key)) return false;
  return VERIFY_GATED_ROLES.includes(user.role) && user.kyc_status !== "verified";
}

module.exports = { ADMIN_ROLE, userHasPermission, isVerificationGated, UNGATED_KEYS };
