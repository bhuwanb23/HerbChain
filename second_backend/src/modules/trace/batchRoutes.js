/**
 * Trace module — /api/v1/batches (docs/batch/architecture.md §7).
 */
const express = require("express");
const { ok, error } = require("../../utils/responses");
const { requireAuth, requirePermission } = require("../../middleware/auth");
const { createBatch, listOwn, getById, getEvents, assertCanView, assertCanMint } = require("../../services/batches");
const { qrCard, qrHistory } = require("../../services/qrEngine");
const { batchCreateSchema, zodDetails } = require("../../validation/batchSchemas");
const { serializeBatch, serializeEvent } = require("./batchSerializer");

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

  // -------------------------------------------------- active QR card
  // Phase 5 dynamic QR engine: returns the ACTIVE ownership token + a
  // captioned PNG (batch code + version). Same token re-prints until rotation.
  router.get(
    "/:id/qr",
    requirePermission("batch.view"),
    wrap(async (req, res) => {
      const batch = await getById(req.params.id);
      if (!batch) return error(res, "not_found", "Batch not found", 404);
      assertCanMint(req.user, batch); // holder or admin
      const card = await qrCard(batch, req.user);
      return ok(res, card);
    })
  );

  // ---------------------------------------------------- QR history
  router.get(
    "/:id/qr/history",
    requirePermission("batch.view"),
    wrap(async (req, res) => {
      const batch = await getById(req.params.id);
      if (!batch) return error(res, "not_found", "Batch not found", 404);
      assertCanMint(req.user, batch); // holder or admin
      const history = await qrHistory(batch.id);
      return ok(res, { batch_id: batch.id, code: batch.code, ...history });
    })
  );

  app.use("/api/v1/batches", router);
}

module.exports = { mountBatchRoutes };
