/**
 * Accounts service — registration lifecycle + admin governance.
 *
 * Role lifecycle (docs/auth/architecture.md D1/D2):
 *  consumer -> kyc_status none, ACTIVE immediately
 *  farmer   -> kyc_status pending (recorded), but PROVISIONAL-ACTIVE (D2)
 *  other org roles -> kyc_status pending, hard-gated until admin approves
 *  admin    -> never created here (bootstrap seed only)
 *
 * Every org account gets an empty 1:1 profile row at registration and a
 * VerificationRequest the admin resolves on approve/reject.
 */
const { prisma } = require("../db/client");
const { ApiError } = require("../utils/errors");
const { ROLES, ADMIN_ROLE, CONSUMER_ROLE, ORG_ROLES, VERIFY_GATED_ROLES } = require("../constants/roles");
const { hashPassword, validatePasswordPolicy } = require("./passwords");
const { writeAudit } = require("./audit");

const ORG_CODE_PREFIX = {
  farmer: "FRM",
  transporter: "TRP",
  lab: "LAB",
  manufacturer: "MFR",
  distributor: "DST",
  retailer: "RTL",
};

/** role -> prisma model name for the 1:1 profile row. */
const PROFILE_MODEL = {
  farmer: "farmerProfile",
  transporter: "transporterProfile",
  lab: "labProfile",
  manufacturer: "manufacturerProfile",
  distributor: "distributorProfile",
  retailer: "retailerProfile",
};

/** role -> profile FK column (the @unique 1:1 back to User). */
const PROFILE_FK = {
  farmer: "farmer_id",
  transporter: "transporter_id",
  lab: "lab_id",
  manufacturer: "manufacturer_id",
  distributor: "distributor_id",
  retailer: "retailer_id",
};

/** role -> org-code column on the profile (null until approved). */
const PROFILE_CODE_FIELD = {
  farmer: "farmer_code",
  transporter: "transporter_code",
  lab: "lab_code",
  manufacturer: "manufacturer_code",
  distributor: "distributor_code",
  retailer: "retailer_code",
};

/** Roles whose profiles carry a verification_status column. */
const PROFILE_VERIFY_FIELD = { lab: "verification_status", manufacturer: "verification_status" };

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function normalizePhone(phone) {
  const p = String(phone ?? "").trim();
  // Keep it simple for now: strip spaces/dashes; E.164 "+91…" passes through.
  return p ? p.replace(/[\s-]/g, "") : null;
}

/** Find a user by email (case-insensitive) or phone. */
async function findByIdentifier(identifier) {
  const raw = String(identifier ?? "").trim();
  const email = normalizeEmail(raw);
  const phone = normalizePhone(raw);
  return (
    (await prisma.user.findUnique({ where: { email } })) ||
    (phone && (await prisma.user.findUnique({ where: { phone } }))) ||
    null
  );
}

/**
 * Register an account with role-specific side effects.
 * Returns the created user. Caller issues tokens / opens sessions.
 */
async function registerUser({ name, email, phone = null, password, role }) {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) throw new ApiError("bad_request", "Email is required", 400);
  const cleanRole = String(role ?? "").trim();
  if (!ROLES.includes(cleanRole)) {
    throw new ApiError("bad_request", `Invalid role '${cleanRole}'`, 400);
  }
  if (cleanRole === ADMIN_ROLE) {
    throw new ApiError("bad_request", "Admin accounts are created by the system, not registration", 400);
  }

  const cleanName = String(name ?? "").trim();
  if (!cleanName || cleanName.length > 120) {
    throw new ApiError("bad_request", "Name must be between 1 and 120 characters", 400);
  }

  const policy = validatePasswordPolicy(password);
  if (!policy.ok) throw new ApiError("bad_request", policy.reason, 400);

  const existingEmail = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (existingEmail) throw new ApiError("email_taken", "An account with this email already exists", 409);

  const cleanPhone = normalizePhone(phone);
  if (cleanPhone) {
    const existingPhone = await prisma.user.findUnique({ where: { phone: cleanPhone } });
    if (existingPhone) throw new ApiError("phone_taken", "An account with this phone already exists", 409);
  }

  const isOrg = ORG_ROLES.includes(cleanRole);
  const kyc_status = cleanRole === CONSUMER_ROLE ? "none" : "pending";

  const user = await prisma.user.create({
    data: {
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password_hash: hashPassword(password),
      role: cleanRole,
      kyc_status,
    },
  });

  if (isOrg) {
    const model = PROFILE_MODEL[cleanRole];
    await prisma[model].create({
      data: { [PROFILE_FK[cleanRole]]: user.id },
    });
    // Farmer is provisional-active but still gets a request row so AYUSH has
    // one queue; gating only applies to VERIFY_GATED_ROLES.
    await prisma.verificationRequest.create({
      data: { user_id: user.id, req_type: "org_registration" },
    });
  }

  await writeAudit({
    actorUserId: null,
    action: "REGISTER",
    targetType: "user",
    targetId: user.id,
    meta: { role: cleanRole, kyc_status },
  });

  return user;
}

/** Load a user with their org profile (when the role has one). */
async function getUserWithProfile(id) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;
  const model = PROFILE_MODEL[user.role];
  const profile = model ? await prisma[model].findUnique({ where: { [PROFILE_FK[user.role]]: user.id } }) : null;
  return { user, profile };
}

/** Next candidate org code for a role prefix, e.g. FRM-2026-0004. Callers own the update + collision retry. */
async function generateOrgCode(role, tx = prisma) {
  const prefix = ORG_CODE_PREFIX[role];
  if (!prefix) throw new ApiError("bad_request", `Role '${role}' has no org code`, 400);
  const field = PROFILE_CODE_FIELD[role];
  const year = new Date().getFullYear();
  const count = await tx[PROFILE_MODEL[role]].count({ where: { [field]: { startsWith: `${prefix}-${year}-` } } });
  return `${prefix}-${year}-${String(count + 1).padStart(4, "0")}`;
}

module.exports = {
  ORG_CODE_PREFIX,
  PROFILE_MODEL,
  PROFILE_FK,
  PROFILE_CODE_FIELD,
  PROFILE_VERIFY_FIELD,
  normalizeEmail,
  normalizePhone,
  findByIdentifier,
  registerUser,
  getUserWithProfile,
  generateOrgCode,
};
