/**
 * Auth routes — port of routes/auth.py.
 *
 *   GET  /api/v1/auth/          endpoint map
 *   POST /api/v1/auth/register  create user + issue tokens
 *   POST /api/v1/auth/login     email/user_id + password -> tokens
 *   POST /api/v1/auth/refresh   refresh token -> new access token
 *   GET  /api/v1/auth/me        current user (requireAuth)
 */
const express = require("express");
const jwt = require("jsonwebtoken");
const { Prisma } = require("@prisma/client");
const { env } = require("../config/env");
const { prisma } = require("../db/client");
const { registerSchema, loginSchema, zodDetails } = require("../validation/schemas");
const { createUser, findByIdentifier, verifyPassword } = require("../services/users");
const {
  makeTokens,
  signToken,
  extractToken,
  handleJwtError,
  requireAuth,
} = require("../middleware/auth");
const { serializeUser } = require("../serializers");
const { newUserId } = require("../utils/ids");
const { ok, error } = require("../utils/responses");

function mountAuth(app) {
  const router = express.Router();

  router.get("/", (req, res) => {
    ok(res, {
      endpoints: {
        register: "POST /api/v1/auth/register",
        login: "POST /api/v1/auth/login",
        refresh: "POST /api/v1/auth/refresh",
        me: "GET /api/v1/auth/me",
      },
    });
  });

  router.post("/register", async (req, res) => {
    const parsed = registerSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return error(res, "validation_error", "Invalid registration data", 400, zodDetails(parsed.error));
    }
    const data = parsed.data;
    const email = data.email.toLowerCase().trim();

    if (await prisma.user.findUnique({ where: { email } })) {
      return error(res, "email_taken", "An account with this email already exists", 409);
    }

    try {
      const user = await createUser({
        user_id: newUserId(data.role),
        role: data.role,
        name: data.name.trim(),
        email,
        password: data.password,
        phone: data.phone ?? null,
        location: data.location ?? null,
        gps_lat: data.gps_lat ?? null,
        gps_lng: data.gps_lng ?? null,
        language_pref: data.language_pref || "en",
      });
      const tokens = makeTokens(user);
      return ok(res, { user: serializeUser(user), ...tokens }, 201);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return error(res, "email_taken", "An account with this email already exists", 409);
      }
      throw err;
    }
  });

  router.post("/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return error(res, "validation_error", "Invalid login data", 400, zodDetails(parsed.error));
    }
    const { identifier, password } = parsed.data;

    const user = await findByIdentifier(identifier);
    if (!user || !verifyPassword(user, password)) {
      return error(res, "invalid_credentials", "Email/user_id or password is incorrect", 401);
    }
    if (!user.is_active) {
      return error(res, "forbidden", "User account is disabled", 403);
    }

    const tokens = makeTokens(user);
    return ok(res, { user: serializeUser(user), ...tokens });
  });

  router.post("/refresh", async (req, res) => {
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

    // Flask: @jwt_required(refresh=True) — only refresh tokens pass.
    if (payload.type !== "refresh") {
      return error(res, "unauthorized", "Only refresh tokens are allowed", 401);
    }

    const user = await prisma.user.findUnique({ where: { user_id: payload.sub } });
    if (!user || !user.is_active) {
      return error(res, "unauthorized", "Token references a missing or disabled user", 401);
    }

    const access_token = signToken(user, "access", env.JWT_ACCESS_TOKEN_EXPIRES);
    return ok(res, { access_token, token_type: "Bearer" });
  });

  router.get("/me", requireAuth, (req, res) => {
    ok(res, { user: serializeUser(req.user) });
  });

  app.use("/api/v1/auth", router);
}

module.exports = { mountAuth };