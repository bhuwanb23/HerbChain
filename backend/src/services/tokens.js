/**
 * Token primitives (docs/auth/architecture.md §5).
 *
 * Access  : short-lived HS256 JWT — claims sub=User.id, sid=Session.id,
 *           role, name, type=access, jti.
 * Refresh : opaque 256-bit random; only sha256(token) is ever stored.
 */
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

/** @returns signed access token; pass options.expiresIn to override the env default (tests). */
function mintAccessToken(user, { sessionId = null, jti = null, expiresIn = null } = {}) {
  return jwt.sign(
    {
      role: user.role,
      name: user.name,
      type: "access",
      ...(sessionId ? { sid: sessionId } : {}),
    },
    env.JWT_SECRET_KEY,
    {
      subject: user.id,
      expiresIn: expiresIn || env.JWT_ACCESS_TOKEN_EXPIRES,
      ...(jti ? { jwtid: jti } : {}),
    }
  );
}

/** Verify + decode an access token. Throws jsonwebtoken errors for the caller. */
function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET_KEY, { algorithms: ["HS256"] });
}

/** Opaque refresh token — never persisted raw. */
function mintRefreshToken() {
  return crypto.randomBytes(32).toString("base64url");
}

/** Hex sha256 used for refresh-token and reset-token storage. */
function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

module.exports = { mintAccessToken, verifyAccessToken, mintRefreshToken, sha256 };
