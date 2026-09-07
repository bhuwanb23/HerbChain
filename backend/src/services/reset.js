/**
 * Password reset (docs/auth/architecture.md §6/§7, phase_2 §20).
 * Single-use tokens, sha256 stored, 30-minute expiry. Reset revokes every
 * session. OTP/SMS delivery stays deferred — delivery is via the email stub.
 */
const { prisma } = require("../db/client");
const { ApiError } = require("../utils/errors");
const { mintRefreshToken, sha256 } = require("./tokens");
const { hashPassword, validatePasswordPolicy } = require("./passwords");
const { revokeAllForUser } = require("./sessions");
const { writeAudit } = require("./audit");

const RESET_TTL_MS = 30 * 60 * 1000;

/** Issue a reset token for a real, active user. Caller sends the email. */
async function issueResetToken(user, { ipAddress = null } = {}) {
  const raw = mintRefreshToken(); // 256-bit opaque — same strength as refresh
  // Invalidate any older unused tokens for this user (single active token).
  await prisma.passwordResetToken.updateMany({
    where: { user_id: user.id, used_at: null, expires_at: { gt: new Date() } },
    data: { used_at: new Date() }, // soft-consume; keeps the audit trail of issued tokens
  });
  const row = await prisma.passwordResetToken.create({
    data: {
      user_id: user.id,
      token_hash: sha256(raw),
      expires_at: new Date(Date.now() + RESET_TTL_MS),
      ip_address: ipAddress,
    },
  });
  await writeAudit({
    actorUserId: null,
    action: "PASSWORD_RESET_REQUESTED",
    targetType: "user",
    targetId: user.id,
    meta: { reset_id: row.id },
  });
  return raw;
}

/** Consume a reset token and set a new password. Revokes all sessions. */
async function consumeResetToken(rawToken, newPassword, { ipAddress = null } = {}) {
  const policy = validatePasswordPolicy(newPassword);
  if (!policy.ok) throw new ApiError("bad_request", policy.reason, 400);

  const row = await prisma.passwordResetToken.findUnique({ where: { token_hash: sha256(rawToken) } });
  if (!row) throw new ApiError("invalid_token", "Reset token is invalid", 400);
  if (row.used_at) throw new ApiError("invalid_token", "Reset token has already been used", 400);
  if (row.expires_at <= new Date()) throw new ApiError("token_expired", "Reset token has expired", 400);

  await prisma.$transaction([
    prisma.passwordResetToken.update({ where: { id: row.id }, data: { used_at: new Date(), ip_address: ipAddress } }),
    prisma.user.update({ where: { id: row.user_id }, data: { password_hash: hashPassword(newPassword), failed_login_count: 0, locked_until: null } }),
  ]);
  await revokeAllForUser(row.user_id);
  await writeAudit({
    actorUserId: null,
    action: "PASSWORD_RESET",
    targetType: "user",
    targetId: row.user_id,
    meta: { reset_id: row.id },
  });
  return { userId: row.user_id };
}

module.exports = { issueResetToken, consumeResetToken, RESET_TTL_MS };
