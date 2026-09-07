/**
 * Role codes + derived account status.
 *
 * Single role per user (User.role). Farmers are *provisional-active* (D2 in
 * docs/auth/architecture.md): they can create batches immediately while their
 * kyc_status is still recorded as pending for AYUSH bookkeeping. The other
 * org roles are hard-gated until kyc_status = verified.
 */
const CONSUMER_ROLE = "consumer";
const ADMIN_ROLE = "admin";

const ROLES = [
  CONSUMER_ROLE,
  "farmer",
  "transporter",
  "lab",
  "manufacturer",
  "distributor",
  "retailer",
  ADMIN_ROLE,
];

const ORG_ROLES = ["farmer", "transporter", "lab", "manufacturer", "distributor", "retailer"];

/** Org roles whose business capabilities require AYUSH verification. */
const VERIFY_GATED_ROLES = ["transporter", "lab", "manufacturer", "distributor", "retailer"];

const KYC_STATES = ["none", "pending", "verified", "rejected"];

function isOrgRole(role) {
  return ORG_ROLES.includes(role);
}

/**
 * Wire vocabulary for User account state — maps docs/phase_2.md §3 states:
 * ACTIVE | PENDING | SUSPENDED | REJECTED | DEACTIVATED
 */
function deriveAccountStatus(user) {
  if (!user) return "DEACTIVATED";
  if (user.deleted_at) return "DEACTIVATED";
  if (!user.is_active) return "SUSPENDED";
  if (user.locked_until && new Date(user.locked_until) > new Date()) return "SUSPENDED";
  if (user.kyc_status === "rejected") return "REJECTED";
  if (VERIFY_GATED_ROLES.includes(user.role) && user.kyc_status === "pending") {
    return "PENDING";
  }
  return "ACTIVE";
}

module.exports = {
  ROLES,
  ORG_ROLES,
  VERIFY_GATED_ROLES,
  KYC_STATES,
  CONSUMER_ROLE,
  ADMIN_ROLE,
  isOrgRole,
  deriveAccountStatus,
};
