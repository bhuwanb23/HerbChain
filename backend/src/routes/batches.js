/**
 * Batch (Herb) routes — port of routes/batches.py.
 *
 *   POST /api/v1/batches                       create batch (farmer)
 *   GET  /api/v1/batches/mine                  list my held/created batches
 *   GET  /api/v1/batches/<batch_id>            batch + state + holder info
 *   GET  /api/v1/batches/<batch_id>/qr         QR PNG (current holder only)
 *   POST /api/v1/batches/<batch_id>/transfer   scan-based transfer
 *   GET  /api/v1/batches/available/for-lab     batches awaiting any lab
 *   GET  /api/v1/batches/available/for-manufacturer  approved batches awaiting any manufacturer
 *   POST /api/v1/batches/<batch_id>/request-testing  lab intent (logged only)
 *   POST /api/v1/batches/<batch_id>/order      manufacturer intent (logged only)
 *   POST /api/v1/batches/<batch_id>/split      farmer-only N-way split
 *   GET  /api/v1/batches/<batch_id>/events     per-batch audit log
 */
const express = require("express");
const { prisma } = require("../db/client");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireAuth, requireRole } = require("../middleware/auth");
const { ok, error } = require("../utils/responses");
const { createBatchSchema, transferSchema, zodDetails } = require("../validation/schemas");
const {
  serializeHerb,
  serializeState,
  serializeUser,
  serializeEvent,
} = require("../serializers");
const qrService = require("../services/qrService");
const {
  createBatch,
  transferByScan,
  splitBatch,
  recordLabRequest,
  recordManufacturerOrder,
} = require("../services/transferService");

async function batchPayload(batchId) {
  const [herb, state] = await Promise.all([
    prisma.herb.findUnique({ where: { batch_id: batchId } }),
    prisma.batchState.findUnique({ where: { batch_id: batchId } }),
  ]);
  if (!herb || !state) return null;
  const [holder, farmer] = await Promise.all([
    prisma.user.findUnique({ where: { user_id: state.current_holder_id } }),
    prisma.user.findUnique({ where: { user_id: herb.farmer_id } }),
  ]);
  return {
    herb: serializeHerb(herb),
    state: serializeState(state),
    current_holder: serializeUser(holder, { includeEmail: false }),
    farmer: serializeUser(farmer, { includeEmail: false }),
  };
}

function mountBatches(app) {
  const router = express.Router();

  router.get("/", (req, res) => {
    ok(res, {
      endpoints: {
        create: "POST /api/v1/batches",
        list_mine: "GET /api/v1/batches/mine",
        get: "GET /api/v1/batches/<batch_id>",
        qr: "GET /api/v1/batches/<batch_id>/qr",
        transfer: "POST /api/v1/batches/<batch_id>/transfer",
        available_for_lab: "GET /api/v1/batches/available/for-lab",
        available_for_manufacturer: "GET /api/v1/batches/available/for-manufacturer",
        request_testing: "POST /api/v1/batches/<batch_id>/request-testing",
        place_order: "POST /api/v1/batches/<batch_id>/order",
      },
    });
  });

  // ----------------------------------------------------------- POST /

  router.post("/", requireRole("farmer"), asyncHandler(async (req, res) => {
    const parsed = createBatchSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return error(res, "validation_error", "Invalid batch data", 400, zodDetails(parsed.error));
    }
    const d = parsed.data;

    const { herb, state, token } = await createBatch({
      farmer: req.user,
      speciesName: d.species_name,
      harvestDate: d.harvest_date,
      location: d.location,
      weightKg: d.weight_kg,
      imageUrl: d.image_url ?? null,
      gpsLat: d.gps_lat ?? null,
      gpsLng: d.gps_lng ?? null,
      notes: d.notes ?? null,
    });

    return ok(
      res,
      {
        herb: serializeHerb(herb),
        state: serializeState(state),
        qr_token: token,
        qr_png: await qrService.renderPngDataUrl(token),
      },
      201
    );
  }));

  // ------------------------------------------------------- GET /mine

  router.get("/mine", requireAuth, asyncHandler(async (req, res) => {
    const user = req.user;
    const heldStates = await prisma.batchState.findMany({
      where: { current_holder_id: user.user_id },
    });
    const heldIds = heldStates.map((s) => s.batch_id);

    let createdIds = [];
    if (user.role === "farmer") {
      const created = await prisma.herb.findMany({ where: { farmer_id: user.user_id } });
      createdIds = created.map((h) => h.batch_id);
    }

    const allIds = [...new Set([...heldIds, ...createdIds])];
    const items = [];
    for (const id of allIds) {
      const p = await batchPayload(id);
      if (p) items.push(p);
    }
    items.sort((a, b) => String(b.state.updated_at).localeCompare(String(a.state.updated_at)));
    return ok(res, { batches: items, total: items.length });
  }));

  // ----------------------------------------- discovery endpoints (static
  // paths registered before /:batch_id so Express matches them first)

  router.get("/available/for-lab", requireRole("lab", "admin"), asyncHandler(async (req, res) => {
    const states = await prisma.batchState.findMany({
      where: { phase: { in: ["with_farmer", "in_transit_to_lab", "at_lab"] } },
    });
    const items = [];
    for (const s of states) {
      const p = await batchPayload(s.batch_id);
      if (p) items.push(p);
    }
    return ok(res, { batches: items, total: items.length });
  }));

  router.get("/available/for-manufacturer", requireRole("manufacturer", "admin"), asyncHandler(async (req, res) => {
    const states = await prisma.batchState.findMany({
      where: {
        test_result: "approved",
        phase: { in: ["at_lab", "in_transit_to_manufacturer", "with_manufacturer"] },
      },
    });
    const items = [];
    for (const s of states) {
      const p = await batchPayload(s.batch_id);
      if (p) items.push(p);
    }
    return ok(res, { batches: items, total: items.length });
  }));

  // --------------------------------------------------- GET /:batch_id

  router.get("/:batch_id", requireAuth, asyncHandler(async (req, res) => {
    const payload = await batchPayload(req.params.batch_id);
    if (!payload) return error(res, "not_found", `Batch '${req.params.batch_id}' not found`, 404);
    return ok(res, payload);
  }));

  // ------------------------------------------------ GET /:batch_id/qr

  router.get("/:batch_id/qr", requireAuth, asyncHandler(async (req, res) => {
    const batchId = req.params.batch_id;
    const state = await prisma.batchState.findUnique({ where: { batch_id: batchId } });
    if (!state) return error(res, "not_found", `Batch '${batchId}' not found`, 404);

    const user = req.user;
    const isHolder = state.current_holder_id === user.user_id;
    const herb = await prisma.herb.findUnique({ where: { batch_id: batchId } });
    const isFarmerOfRecord =
      user.role === "farmer" && herb !== null && herb.farmer_id === user.user_id;

    if (!(isHolder || isFarmerOfRecord)) {
      return error(res, "forbidden", "Only the current holder can fetch this QR", 403);
    }
    if (!state.current_qr_token) {
      return error(res, "not_available", "This batch has no active QR", 410);
    }

    return ok(res, {
      batch_id: batchId,
      phase: state.phase,
      current_holder_id: state.current_holder_id,
      qr_token: state.current_qr_token,
      qr_png: await qrService.renderPngDataUrl(state.current_qr_token),
    });
  }));

  // --------------------------------------------- POST /:batch_id/transfer

  router.post("/:batch_id/transfer", requireRole("transporter", "lab", "manufacturer"), asyncHandler(async (req, res) => {
    const parsed = transferSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return error(res, "validation_error", "Invalid transfer data", 400, zodDetails(parsed.error));
    }
    const d = parsed.data;

    const result = await transferByScan({
      batchId: req.params.batch_id,
      scanner: req.user,
      scannedQrToken: d.scanned_qr_token,
      location: d.location ?? null,
      gpsLat: d.gps_lat ?? null,
      gpsLng: d.gps_lng ?? null,
      notes: d.notes ?? null,
    });

    return ok(res, {
      transfer: {
        batch_id: result.batchId,
        from_phase: result.fromPhase,
        to_phase: result.toPhase,
        from_party_id: result.fromPartyId,
        to_party_id: result.toPartyId,
        occurred_at: result.occurredAt.toISOString(),
        event_id: result.eventId,
      },
      new_qr_token: result.newQrToken,
      new_qr_png: await qrService.renderPngDataUrl(result.newQrToken),
    });
  }));

  // -------------------------------------------- intent endpoints (logged)

  router.post("/:batch_id/request-testing", requireRole("lab"), asyncHandler(async (req, res) => {
    const event = await recordLabRequest(req.user, req.params.batch_id);
    return ok(res, { event: serializeEvent(event) }, 201);
  }));

  router.post("/:batch_id/order", requireRole("manufacturer"), asyncHandler(async (req, res) => {
    const event = await recordManufacturerOrder(req.user, req.params.batch_id);
    return ok(res, { event: serializeEvent(event) }, 201);
  }));

  // ------------------------------------------------ POST /:batch_id/split

  router.post("/:batch_id/split", requireRole("farmer"), asyncHandler(async (req, res) => {
    const body = req.body ?? {};
    const splits = body.splits;
    if (!Array.isArray(splits) || splits.length === 0) {
      return error(res, "validation_error", "splits must be a non-empty list", 400);
    }

    const normalized = [];
    for (const item of splits) {
      if (typeof item !== "object" || item === null) {
        return error(res, "validation_error", "Each split must be an object", 400);
      }
      const kg = Number(item.weight_kg);
      if (!Number.isFinite(kg)) {
        return error(res, "validation_error", "split weight_kg must be numeric", 400);
      }
      normalized.push({ weight_kg: kg, note: item.note ?? null });
    }

    const result = await splitBatch({
      parentBatchId: req.params.batch_id,
      actor: req.user,
      splits: normalized,
    });

    const children = [];
    for (const c of result.children) {
      children.push({
        batch_id: c.batchId,
        weight_kg: c.weightKg,
        qr_token: c.qrToken,
        qr_png: await qrService.renderPngDataUrl(c.qrToken),
        note: c.note,
      });
    }

    return ok(
      res,
      {
        parent_batch_id: result.parentBatchId,
        parent_remaining_kg: result.parentRemainingKg,
        parent_consumed: result.parentConsumed,
        children,
      },
      201
    );
  }));

  // ------------------------------------------------ GET /:batch_id/events

  router.get("/:batch_id/events", requireAuth, asyncHandler(async (req, res) => {
    const rows = await prisma.batchEvent.findMany({
      where: { batch_id: req.params.batch_id },
      orderBy: { created_at: "asc" },
    });

    // Load users once for expand_parties
    const userIds = new Set();
    for (const ev of rows) {
      if (ev.actor_id) userIds.add(ev.actor_id);
      if (ev.from_party_id) userIds.add(ev.from_party_id);
      if (ev.to_party_id) userIds.add(ev.to_party_id);
    }
    const users = {};
    if (userIds.size > 0) {
      const found = await prisma.user.findMany({ where: { user_id: { in: [...userIds] } } });
      for (const u of found) users[u.user_id] = u;
    }

    return ok(res, {
      events: rows.map((e) => serializeEvent(e, { expandParties: true, users })),
      total: rows.length,
    });
  }));

  app.use("/api/v1/batches", router);
}

module.exports = { mountBatches };