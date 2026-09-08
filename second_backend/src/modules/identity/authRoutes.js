/**
 * Identity module — /api/v1/auth routes (new architecture).
 * Wire envelope: {data:{...}} | {error:{code,message,details?}}.
 */
const express = require("express");
const { prisma } = require("../../db/client");
const { ok, error } = require("../../utils/responses");
const { ApiError } = require("../../utils/errors");
const { createRateLimiter } = require("../../utils/rateLimit");
const { requireAuth } = require("../../middleware/auth");
const { verifyPassword, hashPassword } = require("../../services/passwords");
const { mintAccessToken } = require("../../services/tokens");
const { openSession, rotateSession, revokeSession, revokeAllForUser, listSessions } = require("../../services/sessions");
const { isLocked, registerFailure, registerSuccess } = require("../../services/lockout");
const { writeAudit } = require("../../services/audit");
const { sendEmail, resetUrl } = require("../../services/mailer");
const { issueResetToken, consumeResetToken } = require("../../services/reset");
const { registerUser, findByIdentifier, getUserWithProfile, normalizePhone } = require("../../services/accounts");
const { serializeUser } = require("../../serializers/user");
const {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateMeSchema,
  zodDetails,
} = require("../../validation/authSchemas");

/** Express-4 async wrapper -> ApiError mapped by the app error handler. */
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function deviceCtx(req) {
  const body = req.body || {};
  return {
    deviceId: body.device_id || null,
    deviceName: body.device_name || null,
    userAgent: req.headers["user-agent"] || null,
    ip: req.ip || null,
  };
}

async function issueTokenPair(user, ctx) {
  const { sessionId, refreshToken } = await openSession(user.id, ctx);
  const access_token = mintAccessToken(user, { sessionId });
  return { access_token, refresh_token: refreshToken, token_type: "Bearer", sessionId };
}

function mountAuth(app) {
  const router = express.Router();

  const loginLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 10,
    keyFn: (req) => `${req.ip || "ip"}:${String((req.body || {}).identifier || "").toLowerCase()}`,
  });
  // Farmers may register in batches from shared rural gateways — keep per-IP headroom.
  const registerLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 30, keyFn: (req) => req.ip || "ip" });
  const forgotLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 5, keyFn: (req) => req.ip || "ip" });

  router.get("/", (req, res) => {
    ok(res, {
      endpoints: {
        register: "POST /api/v1/auth/register",
        login: "POST /api/v1/auth/login",
        refresh: "POST /api/v1/auth/refresh",
        logout: "POST /api/v1/auth/logout",
        me: "GET /api/v1/auth/me",
        change_password: "POST /api/v1/auth/change-password",
        sessions: "GET /api/v1/auth/sessions",
        forgot_password: "POST /api/v1/auth/forgot-password",
        reset_password: "POST /api/v1/auth/reset-password",
      },
    });
  });

  // ------------------------------------------------------------ register
  router.post(
    "/register",
    registerLimiter,
    wrap(async (req, res) => {
      const parsed = registerSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return error(res, "validation_error", "Invalid registration data", 400, zodDetails(parsed.error));
      }
      const d = parsed.data;
      const user = await registerUser({ name: d.name, email: d.email, phone: d.phone, password: d.password, role: d.role });
      const tokens = await issueTokenPair(user, deviceCtx(req));
      const { profile } = await getUserWithProfile(user.id);
      return ok(res, { user: serializeUser(user, profile), ...tokens }, 201);
    })
  );

  // --------------------------------------------------------------- login
  router.post(
    "/login",
    loginLimiter,
    wrap(async (req, res) => {
      const parsed = loginSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return error(res, "validation_error", "Invalid login data", 400, zodDetails(parsed.error));
      }
      const d = parsed.data;
      const ctx = deviceCtx(req);
      const user = await findByIdentifier(d.identifier);

      if (user && isLocked(user)) {
        await writeAudit({ actorUserId: user.id, action: "LOGIN_FAILED", targetType: "user", targetId: user.id, meta: { reason: "locked" } });
        return error(res, "account_locked", "Too many failed attempts — account temporarily locked", 403);
      }

      const passwordOk = user ? verifyPassword(d.password, user.password_hash) : false;
      if (!user || !passwordOk) {
        if (user) {
          await registerFailure(user);
          await writeAudit({ actorUserId: user.id, action: "LOGIN_FAILED", targetType: "user", targetId: user.id, meta: { reason: "bad_credentials" } });
        }
        return error(res, "invalid_credentials", "Email/phone or password is incorrect", 401);
      }

      await registerSuccess(user);
      if (!user.is_active) {
        return error(res, "forbidden", "User account is disabled", 403);
      }

      const tokens = await issueTokenPair(user, ctx);
      await prisma.user.update({ where: { id: user.id }, data: { last_login_at: new Date() } });
      await writeAudit({ actorUserId: user.id, action: "LOGIN", targetType: "user", targetId: user.id, meta: { device_id: ctx.deviceId } });
      const { profile } = await getUserWithProfile(user.id);
      return ok(res, { user: serializeUser(user, profile), ...tokens });
    })
  );

  // ------------------------------------------------------------- refresh
  router.post(
    "/refresh",
    wrap(async (req, res) => {
      const parsed = refreshSchema.safeParse(req.body ?? {});
      const token = parsed.success && parsed.data.refresh_token ? parsed.data.refresh_token : extractBearer(req);
      if (!token) return error(res, "unauthorized", "Missing refresh token", 401);

      const result = await rotateSession(token);
      if (result.kind === "reuse") {
        await writeAudit({ actorUserId: result.userId, action: "REFRESH_REUSE", targetType: "user", targetId: result.userId, meta: { detected: true } });
        return error(res, "unauthorized", "Refresh token reuse detected — all sessions were revoked", 401);
      }
      if (result.kind === "expired") return error(res, "token_expired", "Refresh token has expired", 401);
      if (result.kind === "invalid") return error(res, "unauthorized", "Invalid refresh token", 401);

      const user = await prisma.user.findUnique({ where: { id: result.session.user_id } });
      if (!user || !user.is_active) return error(res, "unauthorized", "Token references a missing or disabled user", 401);

      const access_token = mintAccessToken(user, { sessionId: result.session.id });
      await writeAudit({ actorUserId: user.id, action: "TOKEN_REFRESH", targetType: "user", targetId: user.id });
      return ok(res, { access_token, refresh_token: result.refreshToken, token_type: "Bearer" });
    })
  );

  // -------------------------------------------------------------- logout
  router.post(
    "/logout",
    requireAuth,
    wrap(async (req, res) => {
      if (req.sessionId) await revokeSession(req.sessionId);
      await writeAudit({ actorUserId: req.user.id, action: "LOGOUT", targetType: "user", targetId: req.user.id });
      return ok(res, { message: "Logged out" });
    })
  );

  // ------------------------------------------------------------------ me
  router.get(
    "/me",
    requireAuth,
    wrap(async (req, res) => {
      const { profile } = await getUserWithProfile(req.user.id);
      return ok(res, { user: serializeUser(req.user, profile) });
    })
  );

  router.patch(
    "/me",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = updateMeSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return error(res, "validation_error", "Invalid profile data", 400, zodDetails(parsed.error));
      }
      const d = parsed.data;
      const data = {};
      if (d.name) data.name = d.name;
      if (d.locale) data.locale = d.locale;
      if (d.phone !== undefined) {
        const phone = normalizePhone(d.phone);
        if (phone) {
          const clash = await prisma.user.findUnique({ where: { phone } });
          if (clash && clash.id !== req.user.id) throw new ApiError("phone_taken", "An account with this phone already exists", 409);
        }
        data.phone = phone;
      }
      const user = await prisma.user.update({ where: { id: req.user.id }, data });
      await writeAudit({ actorUserId: user.id, action: "PROFILE_UPDATE", targetType: "user", targetId: user.id, meta: { fields: Object.keys(data) } });
      const { profile } = await getUserWithProfile(user.id);
      return ok(res, { user: serializeUser(user, profile) });
    })
  );

  // ------------------------------------------------------ change password
  router.post(
    "/change-password",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = changePasswordSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return error(res, "validation_error", "Invalid password data", 400, zodDetails(parsed.error));
      }
      const { old_password, new_password } = parsed.data;
      if (!verifyPassword(old_password, req.user.password_hash)) {
        return error(res, "invalid_old_password", "Current password is incorrect", 400);
      }
      await prisma.user.update({ where: { id: req.user.id }, data: { password_hash: hashPassword(new_password), failed_login_count: 0, locked_until: null } });
      // Revoke every session except the current one.
      await prisma.session.updateMany({
        where: { user_id: req.user.id, revoked_at: null, ...(req.sessionId ? { id: { not: req.sessionId } } : {}) },
        data: { revoked_at: new Date() },
      });
      await writeAudit({ actorUserId: req.user.id, action: "PASSWORD_CHANGE", targetType: "user", targetId: req.user.id });
      return ok(res, { message: "Password updated" });
    })
  );

  // ------------------------------------------------------------ sessions
  router.get(
    "/sessions",
    requireAuth,
    wrap(async (req, res) => {
      const sessions = await listSessions(req.user.id);
      return ok(res, {
        sessions: sessions.map((s) => ({
          id: s.id,
          device_id: s.device_id,
          device_name: s.device_name,
          ip_address: s.ip_address,
          user_agent: s.user_agent,
          last_used_at: s.last_used_at,
          expires_at: s.expires_at,
          current: s.id === req.sessionId,
        })),
      });
    })
  );

  router.delete(
    "/sessions/:id",
    requireAuth,
    wrap(async (req, res) => {
      const row = await prisma.session.findFirst({ where: { id: req.params.id, user_id: req.user.id } });
      if (!row) return error(res, "not_found", "Session not found", 404);
      await revokeSession(row.id);
      return ok(res, { message: "Session revoked" });
    })
  );

  // ------------------------------------------------------ forgot / reset
  router.post(
    "/forgot-password",
    forgotLimiter,
    wrap(async (req, res) => {
      const parsed = forgotPasswordSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return error(res, "validation_error", "Invalid identifier", 400, zodDetails(parsed.error));
      }
      const user = await findByIdentifier(parsed.data.identifier);
      if (user && user.is_active) {
        const raw = await issueResetToken(user, { ipAddress: req.ip || null });
        await sendEmail({
          to: user.email,
          subject: "Reset your HerbChain password",
          body: `Use this link to reset your password (valid 30 minutes):\n${resetUrl(raw)}`,
        });
      }
      // No account enumeration: same response either way.
      return ok(res, { message: "If an account exists for that identifier, a reset link has been sent" });
    })
  );

  router.post(
    "/reset-password",
    wrap(async (req, res) => {
      const parsed = resetPasswordSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return error(res, "validation_error", "Invalid reset data", 400, zodDetails(parsed.error));
      }
      const { token, new_password } = parsed.data;
      await consumeResetToken(token, new_password, { ipAddress: req.ip || null });
      return ok(res, { message: "Password updated — please log in again" });
    })
  );

  app.use("/api/v1/auth", router);
}

function extractBearer(req) {
  const header = req.headers.authorization || "";
  const parts = header.split(" ");
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer" && parts[1]) return parts[1];
  return null;
}

module.exports = { mountAuth };
