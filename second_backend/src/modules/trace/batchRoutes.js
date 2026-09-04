/**
 * Trace module — /api/v1/batches (docs/batch/architecture.md §7).
 */
const express = require("express");
const { ok, error } = require("../../utils/responses");
const { requireAuth, requirePermission } = require("../../middleware/auth");
const { createBatch, listOwn, getById, getEvents, resolveSpecies, assertCanView, assertCanMint } = require("../../services/batches");
const { mintBatchQr, verifyBatchQrToken, tokenMatchesBatch } = require("../../services/qrMint");
const { batchCreateSchema, qrVerifySchema, zodDetails } = require("../../validation/batchSchemas");
const { serializeBatch, serializeEvent } = require("./batchSerializer");
const { writeAudit } = require("../../services/audit");

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function mountBatchRoutes(app) {
  const router = express.Router();

  // ------------------------------------------------------------- create
  router.post(
    "/",
    requirePermission("batch.create"),
    wrap(async (req, res) => {
      const parsed = batchCreateSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return error(res, "validation_error", "Invalid batch data", 400, zodDetails(parsed.error));
      }
      const result = await createBatch(req.user, parsed.data);
      const payload = { batch: serializeBatch(result.batch) };
      if (result.duplicate_warning) {
        payload.duplicate_warning = "A similar batch (same species, harvest date and quantity) was registered recently";
      }
      return ok(res, payload, 201);
    })
  );

  // -------------------------------------------------------------- mine
  router.get(
    "/mine",
    requirePermission("batch.view"),
    wrap(async (req, res) => {
      const { offset = 0, limit = 50 } = req.query;
      const { batches, total } = await listOwn(req.user.id, {
        offset: Math.max(parseInt(offset, 10) || 0, 0),
        limit: Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100),
      });
      return ok(res, { batches: batches.map(serializeBatch), total });
    })
  );

  // ------------------------------------------------------------- detail
  router.get(
    "/:id",
    requirePermission("batch.view"),
    wrap(async (req, res) => {
      const batch = await getById(req.params.id);
      if (!batch) return error(res, "not_found", "Batch not found", 404);
      assertCanView(req.user, batch);
      return ok(res, { batch: serializeBatch(batch) });
    })
  );

  // ------------------------------------------------------------ history
  router.get(
    "/:id/history",
    requirePermission("batch.view"),
    wrap(async (req, res) => {
      const batch = await getById(req.params.id);
      if (!batch) return error(res, "not_found", "Batch not found", 404);
      assertCanView(req.user, batch);
      const events = await getEvents(batch.id);
      return ok(res, { batch_id: batch.id, events: events.map(serializeEvent) });
    })
  );

  // ----------------------------------------------------------- QR mint
  router.get(
    "/:id/qr",
    requirePermission("batch.view"),
    wrap(async (req, res) => {
      const batch = await getById(req.params.id);
      if (!batch) return error(res, "not_found", "Batch not found", 404);
      assertCanMint(req.user, batch);
      const qr = await mintBatchQr(batch);
      return ok(res, { batch_id: batch.id, code: qr.code, url: qr.url, png: qr.png, version: qr.version });
    })
  );

  // ------------------------------------------------------ QR verify
  router.post(
    "/:id/qr/verify",
    requirePermission("batch.view"),
    wrap(async (req, res) => {
      const parsed = qrVerifySchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return error(res, "validation_error", "token is required", 400);
      }
      const batch = await getById(req.params.id);
      if (!batch) return error(res, "not_found", "Batch not found", 404);
      assertCanMint(req.user, batch);

      let payload;
      try {
        payload = verifyBatchQrToken(parsed.data.token);
      } catch {
        return ok(res, { valid: false, reason: "invalid_signature" });
      }
      const valid = tokenMatchesBatch(payload, batch);
      if (valid) await writeAudit({ actorUserId: req.user.id, action: "QR_VERIFIED", targetType: "batch", targetId: batch.id, meta: { code: batch.code } });
      return ok(res, { valid, batch_id: batch.id, code: batch.code, nonce_current: batch.qr_nonce, nonce_in_token: payload.nonce });
    })
  );

  app.use("/api/v1/batches", router);
}

module.exports = { mountBatchRoutes };
