/**
 * User serializer — wire shape for /auth/me, login, register and admin views.
 * `account_status` is derived (docs/auth/architecture.md §3).
 */
const { deriveAccountStatus } = require("../constants/roles");
const {
  PROFILE_CODE_FIELD,
  PROFILE_VERIFY_FIELD,
} = require("../services/accounts");

function serializeUser(user, profile = null) {
  const out = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || null,
    role: user.role,
    kyc_status: user.kyc_status,
    account_status: deriveAccountStatus(user),
    is_active: user.is_active,
    created_at: user.created_at,
  };
  if (profile) {
    const codeField = PROFILE_CODE_FIELD[user.role];
    if (codeField) out.org_code = profile[codeField] || null;
    const verifyField = PROFILE_VERIFY_FIELD[user.role];
    if (verifyField) out.verification_status = profile[verifyField] || null;
  }
  return out;
}

module.exports = { serializeUser };
