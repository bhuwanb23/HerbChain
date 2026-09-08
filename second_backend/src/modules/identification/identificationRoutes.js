/**
 * Identification module — /api/v1/identifications (docs/phase_4.md APIs).
 *
 *   POST /detect              multipart image -> quality gate -> recognition
 *                             -> top-N predictions (pending identification)
 *   POST /:id/confirm         farmer accepts / changes species / rejects
 *   GET  /mine                farmer's identification history
 *   GET  /                    admin history (model audit / training data view)
 *   GET  /:id                 owner or admin detail
 *
 * Cloud providers are never reachable from the app: every call goes through
 * this backend (spec "AI Service Layer") — key security, rate limit, cache,
 * and the full ai_requests audit trail live here.
 */
const express = require("express");
const multer = require("multer");
const { ok, error } = require("../../utils/responses");
const { requireAuth, requirePermission } = require("../../middleware/auth");
const { env } = require("../../config/env");
const { resolveProvider } = require("../../services/identification/providers");
const { zodDetails } = require("../../validation/batchSchemas");
const { confirmSchema } = require("../../validation/identificationSchemas");
const { serializeIdentification } = require("./identificationSerializer");
const identification = require("../../services/identification/service");

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE, files: 1 },
});

/** Multipart parse with consistent envelope errors. */
function parseUpload(req, res, next) {
  upload.single("file")(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") return error(res, "bad_request", "File too large", 413);
    if (err.code === "LIMIT_FILE_COUNT") return error(res, "bad_request", "Only one file per request", 400);
    return error(res, "bad_request", `Upload failed: ${err.message}`, 400);
  });
}

function mountIdentificationRoutes(app) {
  const router = express.Router();

  // ------------------------------------------------------------ detect
  router.post(
    "/detect",
    requirePermission("identification.detect"),
    parseUpload,
    wrap(async (req, res) => {
      if (!req.file) return error(res, "bad_request", "file field is required (multipart/form-data)", 400);

      // The mock hint is a dev/test lever only — honoured when the active
      // provider is mock, ignored otherwise (never spoofs a cloud provider).
      const provider = resolveProvider();
      const mockHint = provider.key === "mock" && req.body.mock ? String(req.body.mock).trim() : null;

      const out = await identification.detectForUser(req.user, {
        buffer: req.file.buffer,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        metadataRaw: req.body.metadata || null,
        mockHint,
      });

      if (out.status === "quality_failed") {
        // Structured quality reasons — the client tells the farmer what to fix
        // ("too dark", "blurry", "too small") without a provider call.
        return error(res, "image_quality", "Image failed quality checks — please capture a clearer photo", 422, {
          quality: out.quality,
          asset: out.asset,
        });
      }
      return ok(res, {
        status: out.status, // ok | no_plant
        cached: out.cached,
        quality: out.quality,
        asset: out.asset,
        identification: serializeIdentification(out.identification),
      });
    })
  );

  // ----------------------------------------------------------- confirm
  router.post(
    "/:id/confirm",
    requirePermission("identification.detect"),
    wrap(async (req, res) => {
      const parsed = confirmSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return error(res, "validation_error", "Invalid confirmation", 400, zodDetails(parsed.error));
      }
      const row = await identification.confirmIdentification(req.user, req.params.id, parsed.data);
      return ok(res, { identification: serializeIdentification(row) });
    })
  );

  // ------------------------------------------------------------- mine
  router.get(
    "/mine",
    requirePermission("identification.detect"),
    wrap(async (req, res) => {
      const { offset = 0, limit = 50 } = req.query;
      const { rows, total } = await identification.listMine(req.user.id, {
        offset: Math.max(parseInt(offset, 10) || 0, 0),
        limit: Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100),
      });
      return ok(res, { identifications: rows.map(serializeIdentification), total });
    })
  );

  // ------------------------------------------------ admin history list
  router.get(
    "/",
    requireAuth,
    wrap(async (req, res) => {
      if (req.user.role !== "admin") {
        return error(res, "forbidden", "Admin access required", 403);
      }
      const { offset = 0, limit = 50, farmer_id = null, status = null } = req.query;
      const { rows, total } = await identification.adminList({
        farmerId: farmer_id || null,
        status: status || null,
        offset: Math.max(parseInt(offset, 10) || 0, 0),
        limit: Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100),
      });
      return ok(res, { identifications: rows.map(serializeIdentification), total });
    })
  );

  // ------------------------------------------------------------- detail
  router.get(
    "/:id",
    requirePermission("identification.detect"),
    wrap(async (req, res) => {
      const row = await identification.getByIdScoped(req.user, req.params.id);
      if (!row) return error(res, "not_found", "Identification not found", 404);
      return ok(res, { identification: serializeIdentification(row) });
    })
  );

  app.use("/api/v1/identifications", router);
}

module.exports = { mountIdentificationRoutes };
