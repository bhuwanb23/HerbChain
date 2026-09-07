/**
 * Manufacturer procurement API — Phase 9 (docs/phase_9.md).
 *
 *   GET  /api/v1/manufacturer/certified-batches        marketplace: ONLY
 *                                                      certified + cert-valid
 *                                                      batches, with available qty
 *   GET  /api/v1/manufacturer/certified-batches/:batchId  traceability dossier
 *   POST /api/v1/manufacturer/request-batch            request a quantity
 *   GET  /api/v1/manufacturer/requests                 my requests (lab: held)
 *   POST /api/v1/manufacturer/requests/:id/approve     holder approves (full/
 *                                                      partial) -> allocation +
 *                                                      auto shipment
 *   POST /api/v1/manufacturer/requests/:id/reject      holder / admin rejects
 *   POST /api/v1/manufacturer/requests/:id/cancel      requester / holder cancels
 *   POST /api/v1/manufacturer/receive                  GRN after governed delivery
 *   GET  /api/v1/manufacturer/inventory                my inventory (derived state)
 *   GET  /api/v1/manufacturer/inventory/history        append-only ledger
 *   POST /api/v1/manufacturer/inventory/:id/reserve    lock for production
 *   POST /api/v1/manufacturer/inventory/:id/release    free a reservation
 *   POST /api/v1/manufacturer/inventory/:id/consume    use in production
 *   POST /api/v1/manufacturer/inventory/:id/discard    spoiled/damaged
 *   POST /api/v1/manufacturer/inventory/:id/adjust     recount
 *   POST /api/v1/manufacturer/quality-holds            quarantine a batch
 *   POST /api/v1/manufacturer/quality-holds/:id/resolve  lift the hold
 *   GET  /api/v1/manufacturer/dashboard                KPI panel
 *   GET  /api/v1/manufacturer/analytics                spec §14
 *   GET  /api/v1/manufacturer/recall/:batchId          recall readiness (§13)
 */
const express = require("express");
const { z } = require("zod");
const { ok, error } = require("../../utils/responses");
const { requireAuth, requirePermission } = require("../../middleware/auth");
const {
  listCertifiedBatches,
  certifiedBatchDetail,
  requestBatch,
  cancelRequest,
  approveRequest,
  rejectRequest,
  receiveBatch,
  listInventory,
  inventoryHistory,
  reserveInventory,
  releaseInventory,
  consumeInventory,
  discardInventory,
  adjustInventory,
  placeQualityHold,
  resolveQualityHold,
  dashboard,
  analytics,
  recallStatus,
  listRequests,
} = require("../../services/procurement");
const {
  serializeCertifiedBatch,
  serializeDossier,
  serializeRequest,
  serializeGrn,
  serializeInventoryItem,
  serializeTransaction,
  serializeHold,
} = require("./procurementSerializer");

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const optStr = (max) => z.string().trim().max(max).optional().nullable();
const optNum = z.coerce.number().optional().nullable();

const requestSchema = z.object({
  batch_id: z.string().min(1),
  requested_quantity_kg: z.coerce.number().positive(),
  notes: optStr(2000),
});
const approveSchema = z.object({
  approved_quantity_kg: optNum,
  note: optStr(2000),
});
const rejectSchema = z.object({ reason: optStr(2000) });
const receiveSchema = z.object({
  shipment_id: z.string().min(1),
  accepted_quantity_kg: optNum,
  rejected_quantity_kg: z.coerce.number().nonnegative().optional().default(0),
  rejection_reason: optStr(500),
});
const qtySchema = z.object({
  quantity_kg: z.coerce.number().positive(),
  reference_id: optStr(100),
  reason: optStr(500),
  notes: optStr(500),
});
const holdSchema = z.object({ batch_id: z.string().min(1), reason: z.string().trim().min(1).max(500) });
const resolveHoldSchema = z.object({ note: optStr(1000) });

function mountManufacturerRoutes(app) {
  const router = express.Router();

  // -------------------------------------------------- certified marketplace
  router.get(
    "/certified-batches",
    requireAuth,
    requirePermission("procurement.view"),
    wrap(async (req, res) => {
      const { species, batch_code, location, lab_user_id, farmer_id, harvest_from, harvest_to, min_available, limit, offset } = req.query;
      const { items, total } = await listCertifiedBatches(req.user, {
        species: species || null,
        batch_code: batch_code || null,
        location: location || null,
        lab_user_id: lab_user_id || null,
        farmer_id: farmer_id || null,
        harvest_from: harvest_from || null,
        harvest_to: harvest_to || null,
        min_available: min_available || null,
        limit,
        offset,
      });
      return ok(res, { batches: items.map(serializeCertifiedBatch), total });
    })
  );

  router.get(
    "/certified-batches/:batchId",
    requireAuth,
    requirePermission("procurement.view"),
    wrap(async (req, res) => {
      const dossier = await certifiedBatchDetail(req.user, req.params.batchId);
      return ok(res, { batch: serializeDossier(dossier) });
    })
  );

  // ------------------------------------------------------------- requests
  router.post(
    "/request-batch",
    requireAuth,
    requirePermission("procurement.request"),
    wrap(async (req, res) => {
      const parsed = requestSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "batch_id and requested_quantity_kg are required", 400);
      const request = await requestBatch(req.user, parsed.data);
      return ok(res, { request: serializeRequest(request) }, 201);
    })
  );

  router.get(
    "/requests",
    requireAuth,
    wrap(async (req, res) => {
      const { status = null, limit, offset } = req.query;
      const { requests, total } = await listRequests(req.user, { status, limit, offset });
      return ok(res, { requests: requests.map(serializeRequest), total });
    })
  );

  router.post(
    "/requests/:id/approve",
    requireAuth,
    requirePermission("procurement.approve"),
    wrap(async (req, res) => {
      const parsed = approveSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "Invalid payload", 400);
      const request = await approveRequest(req.user, { request_id: req.params.id, ...parsed.data });
      return ok(res, { request: serializeRequest(request) });
    })
  );

  router.post(
    "/requests/:id/reject",
    requireAuth,
    requirePermission("procurement.approve"),
    wrap(async (req, res) => {
      const parsed = rejectSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "Invalid payload", 400);
      const request = await rejectRequest(req.user, { request_id: req.params.id, ...parsed.data });
      return ok(res, { request: serializeRequest(request) });
    })
  );

  router.post(
    "/requests/:id/cancel",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = rejectSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "Invalid payload", 400);
      const request = await cancelRequest(req.user, { request_id: req.params.id, ...parsed.data });
      return ok(res, { request: serializeRequest(request) });
    })
  );

  // -------------------------------------------------------------- receive
  router.post(
    "/receive",
    requireAuth,
    requirePermission("procurement.receive"),
    wrap(async (req, res) => {
      const parsed = receiveSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "shipment_id is required", 400);
      const grn = await receiveBatch(req.user, parsed.data);
      return ok(res, { grn: serializeGrn(grn) }, 201);
    })
  );

  // ------------------------------------------------------------- inventory
  router.get(
    "/inventory",
    requireAuth,
    requirePermission("procurement.view"),
    wrap(async (req, res) => {
      const { status = null, limit, offset } = req.query;
      const { items, total } = await listInventory(req.user, { status, limit, offset });
      return ok(res, { inventory: items.map(serializeInventoryItem), total });
    })
  );

  router.get(
    "/inventory/history",
    requireAuth,
    requirePermission("procurement.view"),
    wrap(async (req, res) => {
      const { inventory_id = null, limit, offset } = req.query;
      const { item, transactions, total } = await inventoryHistory(req.user, { inventory_id, limit, offset });
      return ok(res, {
        inventory: item ? { id: item.id, batch_code: item.batch?.code ?? null } : null,
        transactions: transactions.map(serializeTransaction),
        total,
      });
    })
  );

  router.post(
    "/inventory/:id/reserve",
    requireAuth,
    requirePermission("procurement.inventory"),
    wrap(async (req, res) => {
      const parsed = qtySchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "quantity_kg is required", 400);
      const item = await reserveInventory(req.user, { inventory_id: req.params.id, ...parsed.data });
      return ok(res, { inventory: serializeInventoryItem(item) });
    })
  );

  router.post(
    "/inventory/:id/release",
    requireAuth,
    requirePermission("procurement.inventory"),
    wrap(async (req, res) => {
      const parsed = qtySchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "quantity_kg is required", 400);
      const item = await releaseInventory(req.user, { inventory_id: req.params.id, quantity_kg: parsed.data.quantity_kg });
      return ok(res, { inventory: serializeInventoryItem(item) });
    })
  );

  router.post(
    "/inventory/:id/consume",
    requireAuth,
    requirePermission("procurement.inventory"),
    wrap(async (req, res) => {
      const parsed = qtySchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "quantity_kg is required", 400);
      const item = await consumeInventory(req.user, { inventory_id: req.params.id, ...parsed.data });
      return ok(res, { inventory: serializeInventoryItem(item) });
    })
  );

  router.post(
    "/inventory/:id/discard",
    requireAuth,
    requirePermission("procurement.inventory"),
    wrap(async (req, res) => {
      const parsed = qtySchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "quantity_kg is required", 400);
      const item = await discardInventory(req.user, { inventory_id: req.params.id, ...parsed.data });
      return ok(res, { inventory: serializeInventoryItem(item) });
    })
  );

  router.post(
    "/inventory/:id/adjust",
    requireAuth,
    requirePermission("procurement.inventory"),
    wrap(async (req, res) => {
      const parsed = qtySchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "quantity_kg is required", 400);
      const item = await adjustInventory(req.user, { inventory_id: req.params.id, ...parsed.data });
      return ok(res, { inventory: serializeInventoryItem(item) });
    })
  );

  // --------------------------------------------------------- quality holds
  router.post(
    "/quality-holds",
    requireAuth,
    requirePermission("procurement.inventory"),
    wrap(async (req, res) => {
      const parsed = holdSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "batch_id and reason are required", 400);
      const hold = await placeQualityHold(req.user, parsed.data);
      return ok(res, { hold: serializeHold(hold) }, 201);
    })
  );

  router.post(
    "/quality-holds/:id/resolve",
    requireAuth,
    requirePermission("procurement.inventory"),
    wrap(async (req, res) => {
      const parsed = resolveHoldSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "Invalid payload", 400);
      const hold = await resolveQualityHold(req.user, { hold_id: req.params.id, ...parsed.data });
      return ok(res, { hold: serializeHold(hold) });
    })
  );

  // ------------------------------------------------------- dashboard etc.
  router.get(
    "/dashboard",
    requireAuth,
    requirePermission("procurement.view"),
    wrap(async (req, res) => {
      return ok(res, { dashboard: await dashboard(req.user) });
    })
  );

  router.get(
    "/analytics",
    requireAuth,
    requirePermission("procurement.view"),
    wrap(async (req, res) => {
      return ok(res, { analytics: await analytics(req.user) });
    })
  );

  router.get(
    "/recall/:batchId",
    requireAuth,
    requirePermission("procurement.view"),
    wrap(async (req, res) => {
      const status = await recallStatus(req.user, { batch_id: req.params.batchId });
      return ok(res, { recall: status });
    })
  );

  app.use("/api/v1/manufacturer", router);
}

module.exports = { mountManufacturerRoutes };