/**
 * Rotating sessions (docs/auth/architecture.md §5).
 *
 * One Session row per device, rotated *in place*: every successful refresh
 * replaces the stored sha256 hash and slides expires_at. Presenting a token
 * whose hash no longer matches the row (already rotated or revoked) is
 * treated as theft: the whole account's sessions are revoked.
 */
const { prisma } = require("../db/client");
const { mintRefreshToken, sha256 } = require("./tokens");
const { parseDuration } = require("../utils/duration");
const { env } = require("../config/env");

const REFRESH_TTL_MS = () => parseDuration(env.JWT_REFRESH_TOKEN_EXPIRES, 30 * 24 * 60 * 60 * 1000);

/** Open a new device session at login. Returns the raw refresh token once. */
async function openSession(userId, ctx = {}) {
  const refreshToken = mintRefreshToken();
  const now = new Date();
  const session = await prisma.session.create({
    data: {
      user_id: userId,
      refresh_token_hash: sha256(refreshToken),
      user_agent: ctx.userAgent || null,
      ip_address: ctx.ip || null,
      device_name: ctx.deviceName || null,
      device_id: ctx.deviceId || null,
      expires_at: new Date(now.getTime() + REFRESH_TTL_MS()),
      last_used_at: now,
    },
  });
  return { sessionId: session.id, refreshToken, session };
}

/**
 * Rotate a refresh token.
 * @returns one of:
 *  { kind: "ok", session, refreshToken }            rotation succeeded
 *  { kind: "invalid" }                              token not issued by us
 *  { kind: "expired", session? }                    row expired (no rotation)
 *  { kind: "reuse", userId }                        old/revoked token reused -> all sessions revoked
 */
async function rotateSession(refreshToken) {
  const hash = sha256(refreshToken);
  const row = await prisma.session.findUnique({ where: { refresh_token_hash: hash } });

  if (!row) {
    // Current hash didn't match. Could be a never-issued token, or an old
    // token that was rotated out one step ago (stored in previous_token_hash).
    // The latter is the classic stolen-token replay -> revoke the account.
    const prev = await prisma.session.findFirst({
      where: { previous_token_hash: hash, revoked_at: null },
    });
    if (prev) {
      await revokeAllForUser(prev.user_id);
      return { kind: "reuse", userId: prev.user_id };
    }
    return { kind: "invalid" };
  }

  if (row.revoked_at) {
    // A logged-out session's token came back -> theft.
    await revokeAllForUser(row.user_id);
    return { kind: "reuse", userId: row.user_id };
  }

  if (row.expires_at && new Date(row.expires_at) <= new Date()) {
    return { kind: "expired", session: row };
  }

  const newToken = mintRefreshToken();
  const now = new Date();
  // Rotate in place: demote the current hash to the one-step fingerprint,
  // then install the fresh hash.
  const session = await prisma.session.update({
    where: { id: row.id },
    data: {
      previous_token_hash: row.refresh_token_hash,
      refresh_token_hash: sha256(newToken),
      last_used_at: now,
      expires_at: new Date(now.getTime() + REFRESH_TTL_MS()),
    },
  });
  return { kind: "ok", session, refreshToken: newToken };
}

/** True when the session row exists, unrevoked and unexpired (access-token sid guard). */
async function isSessionActive(sessionId) {
  if (!sessionId) return false;
  const row = await prisma.session.findUnique({ where: { id: sessionId } });
  return Boolean(row && !row.revoked_at && row.expires_at && new Date(row.expires_at) > new Date());
}

async function revokeSession(sessionId) {
  await prisma.session.updateMany({
    where: { id: sessionId, revoked_at: null },
    data: { revoked_at: new Date() },
  });
}

async function revokeAllForUser(userId) {
  await prisma.session.updateMany({
    where: { user_id: userId, revoked_at: null },
    data: { revoked_at: new Date() },
  });
}

/** Active (unrevoked, unexpired) sessions for the device list screen. */
async function listSessions(userId) {
  return prisma.session.findMany({
    where: { user_id: userId, revoked_at: null },
    orderBy: { last_used_at: "desc" },
  });
}

module.exports = {
  openSession,
  rotateSession,
  isSessionActive,
  revokeSession,
  revokeAllForUser,
  listSessions,
};
