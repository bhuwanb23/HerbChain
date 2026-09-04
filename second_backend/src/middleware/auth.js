/**
 * Auth middleware — ports of utils/auth.py.
 *
 * Identity always comes from the JWT subject (`sub`), which we set to the
 * user's `user_id` when issuing tokens (same as Flask-JWT-Extended).
 */
const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const { prisma } = require("../db/client");
const { error } = require("../utils/responses");

/** Issue an access/refresh token for a user (matches routes/auth.py _make_tokens). */
function signToken(user, type, expiresIn) {
  return jwt.sign(
    { role: user.role, name: user.name, type },
    env.JWT_SECRET_KEY,
    { subject: user.user_id, expiresIn }
  );
}

function makeTokens(user) {
  return {
    access_token: signToken(user, "access", env.JWT_ACCESS_TOKEN_EXPIRES),
    refresh_token: signToken(user, "refresh", env.JWT_REFRESH_TOKEN_EXPIRES),
    token_type: "Bearer",
  };
}

function extractToken(req) {
  const header = req.headers.authorization || "";
  const parts = header.split(" ");
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer" && parts[1]) {
    return parts[1];
  }
  return null;
}

/** Map jsonwebtoken failures onto the Flask-JWT-Extended error codes. */
function handleJwtError(res, err) {
  if (err && err.name === "TokenExpiredError") {
    return error(res, "token_expired", "Token has expired", 401);
  }
  return error(res, "unauthorized", `Invalid token: ${err.message}`, 401);
}

/** Require a valid JWT; loads req.user for the handler. */
async function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return error(res, "unauthorized", "Missing or invalid token", 401);
  }

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET_KEY, { algorithms: ["HS256"] });
  } catch (err) {
    return handleJwtError(res, err);
  }

  const user = await prisma.user.findUnique({ where: { user_id: payload.sub } });
  if (!user) {
    return error(res, "unauthorized", "Token references a missing user", 401);
  }
  if (!user.is_active) {
    return error(res, "forbidden", "User account is disabled", 403);
  }

  req.user = user;
  return next();
}

/** Require a valid JWT AND that the user's role is one of `roles`. */
function requireRole(...roles) {
  const allowed = new Set(roles);
  return async (req, res, next) => {
    const token = extractToken(req);
    if (!token) {
      return error(res, "unauthorized", "Missing or invalid token", 401);
    }

    let payload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET_KEY, { algorithms: ["HS256"] });
    } catch (err) {
      return handleJwtError(res, err);
    }

    const user = await prisma.user.findUnique({ where: { user_id: payload.sub } });
    if (!user) {
      return error(res, "unauthorized", "Token references a missing user", 401);
    }
    if (!user.is_active) {
      return error(res, "forbidden", "User account is disabled", 403);
    }
    if (!allowed.has(user.role)) {
      return error(
        res,
        "forbidden",
        `This endpoint requires one of roles: ${[...allowed].sort()}`,
        403
      );
    }

    req.user = user;
    return next();
  };
}

module.exports = {
  makeTokens,
  signToken,
  extractToken,
  handleJwtError,
  requireAuth,
  requireRole,
};