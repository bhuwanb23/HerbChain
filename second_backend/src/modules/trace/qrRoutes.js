/**
 * QR engine API — /api/v1/qr (docs/phase_5.md APIs).
 *
 *   POST /validate     scan a token -> live custody check (every scan logged)
 *   POST /transfer     receiver presents the holder's token -> atomic custody
 *                      transfer + QR rotation (old dies, next version born)
 *   POST /regenerate   holder/admin rotate without ownership change
 *                      (lost / damaged / expired / admin replacement)
 *
 * The active QR lives on GET /api/v1/batches/:id/qr (holder/admin) with its
 * version history on GET /api/v1/batches/:id/qr/history.
 */
const express = require("express");
const { z } = require("zod");
const { ok, error } = require("../../utils/responses");
const { requireAuth } = require("../../middleware/auth");
const { validateToken, transferByToken, regenerateQr } = require("../../services/qrEngine");

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const tokenSchema = z.object({ token: z.string().min(10, "token looks truncated") });
const regenSchema = z.object({ batch_id: z.string().min(1), reason: z.string().trim().min(1) });

/** Optional scan context (device / GPS) from headers + body. */
function scanMeta(req) {
  const b = req.body || {};
  return {
    deviceId: req.headers["x-device-id"] || null,
    ip: req.ip || null,
    gpsLat: b.gps_lat ?? null,
    gpsLng: b.gps_lng ?? null,
    location: b.location || null,
  };
}

function mountQrRoutes(app) {
  const router = express.Router();

  // ---------------------------------------------------------- validate
  router.post(
    "/validate",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = tokenSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return error(res, "validation_error", "token is required", 400);
      }
      const out = await validateToken({ token: parsed.data.token, actor: req.user, meta: scanMeta(req) });
      return ok(res, out);
    })
  );

  // ---------------------------------------------------------- transfer
  router.post(
    "/transfer",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = tokenSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return error(res, "validation_error", "token is required", 400);
      }
      const out = await transferByToken({ token: parsed.data.token, receiver: req.user, meta: scanMeta(req) });
      return ok(res, out);
    })
  );

  // -------------------------------------------------------- regenerate
  router.post(
    "/regenerate",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = regenSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return error(res, "validation_error", "batch_id and reason are required", 400);
      }
      const out = await regenerateQr({
        batchId: parsed.data.batch_id,
        actor: req.user,
        reason: parsed.data.reason,
        isAdmin: req.user.role === "admin",
      });
      return ok(res, out);
    })
  );

  app.use("/api/v1/qr", router);
}

module.exports = { mountQrRoutes };
