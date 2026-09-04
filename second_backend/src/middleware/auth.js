/**
 * Auth middleware (new schema, docs/auth/architecture.md §4/§5).
 *
 * Identity is DB-truth: every request re-loads the user so role changes,
 * verification and deactivation apply on the next request. Access tokens
 * carry `sid` (Session.id); if that session has been revoked or expired the
 * request is rejected immediately — logout/password-change bite instantly.
 */
const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const { prisma } = require("../db/client");
const { error } = require("../utils/responses");
const { isSessionActive } = require("../services/sessions");
const { userHasPermission, isVerificationGated } = require("../services/authorization");

function extractToken(req) {
  const header = req.headers.authorization || "";
  const parts = header.split(" ");
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer" && parts[1]) {
    return parts[1];
  }
  return null;
}

/** Map jsonwebtoken failures onto the wire error codes. */
function handleJwtError(res, err) {
  if (err && err.name === "TokenExpiredError") {
    return error(res, "token_expired", "Token has expired", 401);
  }
  return error(res, "unauthorized", `Invalid token: ${err.message}`, 401);
}

/** Verify the access token in the Authorization header. Returns payload or null (responds on failure). */
function readAccessToken(req, res) {
  const token = extractToken(req);
  if (!token) {
    error(res, "unauthorized", "Missing or invalid token", 401);
    return null;
  }
  try {
    return jwt.verify(token, env.JWT_SECRET_KEY, { algorithms: ["HS256"] });
  } catch (err) {
    handleJwtError(res, err);
    return null;
  }
}

/** Load the fresh user; sets req.user + req.sessionId. Responds with 401/403 on failure. */
async function authenticate(req, res) {
  const payload = readAccessToken(req, res);
  if (!payload) return null;
  if (payload.type !== "access") {
    error(res, "unauthorized", "Only access tokens are allowed", 401);
    return null;
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    error(res, "unauthorized", "Token references a missing user", 401);
    return null;
  }
  if (!user.is_active) {
    error(res, "forbidden", "User account is disabled", 403);
    return null;
  }

  if (payload.sid) {
    const active = await isSessionActive(payload.sid);
    if (!active) {
      error(res, "unauthorized", "Session has been revoked or expired", 401);
      return null;
    }
  }

  req.user = user;
  req.sessionId = payload.sid || null;
  return payload;
}

/** Require a valid access token; sets req.user. */
async function requireAuth(req, res, next) {
  const payload = await authenticate(req, res);
  if (!payload) return; // authenticate already responded
  return next();
}

/**
 * Require auth + a granted permission (DB rows). Also enforces the AYUSH
 * verification gate for org roles (docs/auth/architecture.md §4).
 */
function requirePermission(key) {
  return async (req, res, next) => {
    const payload = await authenticate(req, res);
    if (!payload) return;

    if (isVerificationGated(req.user, key)) {
      return error(
        res,
        "account_not_verified",
        "Account is pending AYUSH verification — this action is unavailable until approved",
        403
      );
    }

    const allowed = await userHasPermission(req.user, key);
    if (!allowed) {
      return error(res, "forbidden", "You do not have permission to perform this action", 403);
    }
    return next();
  };
}

/** Coarse role gate (kept for parity; prefer requirePermission for new code). */
function requireRole(...roles) {
  const allowed = new Set(roles);
  return async (req, res, next) => {
    const payload = await authenticate(req, res);
    if (!payload) return;
    if (!allowed.has(req.user.role)) {
      return error(
        res,
        "forbidden",
        `This endpoint requires one of roles: ${[...allowed].sort()}`,
        403
      );
    }
    return next();
  };
}

module.exports = {
  extractToken,
  handleJwtError,
  authenticate,
  requireAuth,
  requirePermission,
  requireRole,
};
