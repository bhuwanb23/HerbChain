/**
 * Governed transfer API — Phase 6 (docs/phase_6.md).
 *
 *   POST /api/v1/transfers/request      receiver requests custody of a batch
 *   POST /api/v1/transfers/approve      current holder approves (two-party)
 *   POST /api/v1/transfers/reject       holder / admin rejects
 *   POST /api/v1/transfers/cancel       requestor (pending) / holder / admin
 *   POST /api/v1/transfers/execute      approved request + scanned QR -> atomic
 *                                       ownership change + QR rotation
 *   POST /api/v1/transfers/recover      admin-forced recovery (no holder consent)
 *   GET  /api/v1/transfers/requests     my requests (admin: all, filterable)
 *   GET  /api/v1/transfers/requests/:id detail incl. proofs
 *   POST /api/v1/transfers/requests/:id/proof   proof-of-handover after completion
 *
 * Batch sub-resources (mounted under /api/v1/batches):
 *   GET  /api/v1/batches/:id/owner             current ownership snapshot
 *   GET  /api/v1/batches/:id/ownership-history immutable custody timeline
 */
const express = require("express");
const { z } = require("zod");
const { ok, error } = require("../../utils/responses");
const { requireAuth } = require("../../middleware/auth");
const {
  requestTransfer,
  approveRequest,
  rejectRequest,
  cancelRequest,
  executeTransfer,
  adminRecovery,
  attachProof,
  listRequests,
  ownershipHistory,
  currentOwner,
} = require("../../services/transfers");
const { serializeRequest, serializeProof, serializeTransferResult } = require("./transfersSerializer");
const { prisma } = require("../../db/client");
const { ApiError } = require("../../utils/errors");

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const requestSchema = z.object({
  batch_id: z.string().min(1),
  type: z.string().trim().min(1).optional(),
  reason: z.string().trim().max(500).optional(),
});
const idSchema = z.object({ request_id: z.string().min(1) });
const rejectSchema = idSchema.extend({ reason: z.string().trim().max(500).optional() });
const executeSchema = z.object({ token: z.string().min(10, "token looks truncated"), request_id: z.string().min(1).optional() });
const recoverSchema = z.object({ batch_id: z.string().min(1), reason: z.string().trim().max(500).optional() });
const proofSchema = z.object({
  asset_id: z.string().min(1).optional(),
  sender_signature: z.string().trim().max(1000).optional(),
  receiver_signature: z.string().trim().max(1000).optional(),
  remarks: z.string().trim().max(2000).optional(),
});

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

function mountTransfersRoutes(app) {
  const router = express.Router();
  const ownership = express.Router();

  // ---------------------------------------------------------- request
  router.post(
    "/request",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = requestSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return error(res, "validation_error", "batch_id is required (type/reason optional)", 400);
      }
      const out = await requestTransfer(req.user, parsed.data);
      return ok(res, { request: serializeRequest(out) }, 201);
    })
  );

  // ---------------------------------------------------------- approve
  router.post(
    "/approve",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = idSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "request_id is required", 400);
      const out = await approveRequest(req.user, parsed.data);
      return ok(res, { request: serializeRequest(out) });
    })
  );

  // ----------------------------------------------------------- reject
  router.post(
    "/reject",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = rejectSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "request_id is required", 400);
      const out = await rejectRequest(req.user, parsed.data);
      return ok(res, { request: serializeRequest(out) });
    })
  );

  // ----------------------------------------------------------- cancel
  router.post(
    "/cancel",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = rejectSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "request_id is required", 400);
      const out = await cancelRequest(req.user, parsed.data);
      return ok(res, { request: serializeRequest(out) });
    })
  );

  // ---------------------------------------------------------- execute
  // Two-party completion: the receiving party presents the scanned holder QR
  // (the token) once their request is approved. Atomic with QR rotation.
  router.post(
    "/execute",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = executeSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return error(res, "validation_error", "token is required (request_id optional)", 400);
      }
      const out = await executeTransfer(req.user, { ...parsed.data, meta: scanMeta(req) });
      return ok(res, { transfer: serializeTransferResult(out) });
    })
  );

  // ---------------------------------------------------------- recover
  router.post(
    "/recover",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = recoverSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "batch_id is required", 400);
      const out = await adminRecovery(req.user, { ...parsed.data, meta: scanMeta(req) });
      return ok(res, { transfer: serializeTransferResult(out) });
    })
  );

  // ------------------------------------------------------------ list
  router.get(
    "/requests",
    requireAuth,
    wrap(async (req, res) => {
      const { batch_id = null, status = null, limit, offset } = req.query;
      const { requests, total } = await listRequests(req.user, { batch_id, status, limit, offset });
      return ok(res, { requests: requests.map(serializeRequest), total });
    })
  );

  // ----------------------------------------------------------- detail
  router.get(
    "/requests/:id",
    requireAuth,
    wrap(async (req, res) => {
      const out = await getRequestFor(req.user, req.params.id);
      return ok(res, { request: serializeRequest(out) });
    })
  );

  // ------------------------------------------------------------ proof
  router.post(
    "/requests/:id/proof",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = proofSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "Invalid proof payload", 400);
      const proof = await attachProof(req.user, { request_id: req.params.id, ...parsed.data });
      return ok(res, { proof: serializeProof(proof) }, 201);
    })
  );

  // ------------------------------------------------- batch ownership
  ownership.get(
    "/:id/owner",
    requireAuth,
    wrap(async (req, res) => {
      const batch = await prisma.batch.findUnique({ where: { id: req.params.id } });
      if (!batch) return error(res, "not_found", "Batch not found", 404);
      await assertCustodyViewer(req.user, batch);
      const owner = await currentOwner(batch.id);
      return ok(res, { ownership: owner });
    })
  );

  ownership.get(
    "/:id/ownership-history",
    requireAuth,
    wrap(async (req, res) => {
      const batch = await prisma.batch.findUnique({ where: { id: req.params.id } });
      if (!batch) return error(res, "not_found", "Batch not found", 404);
      await assertCustodyViewer(req.user, batch);
      const history = await ownershipHistory(batch.id);
      return ok(res, { batch_id: batch.id, code: batch.code, history });
    })
  );

  app.use("/api/v1/transfers", router);
  app.use("/api/v1/batches", ownership);
}

/**
 * Custody-read guard for /owner + /ownership-history: admin, the originating
 * farmer, the current holder, or anyone who has been a party to this batch's
 * custody (transfer request or TRANSFER event actor).
 */
async function assertCustodyViewer(user, batch) {
  if (user.role === "admin") return;
  if (batch.farmer_id === user.id || batch.current_holder_user_id === user.id) return;
  const [asRequestParty, asEventParty] = await Promise.all([
    prisma.transferRequest.findFirst({
      where: {
        batch_id: batch.id,
        OR: [{ from_user_id: user.id }, { to_user_id: user.id }, { created_by_user_id: user.id }],
      },
      select: { id: true },
    }),
    prisma.batchEvent.findFirst({
      where: {
        batch_id: batch.id,
        event_type: "TRANSFER",
        OR: [{ actor_user_id: user.id }, { from_user_id: user.id }, { to_user_id: user.id }],
      },
      select: { id: true },
    }),
  ]);
  if (!asRequestParty && !asEventParty) {
    throw new ApiError("forbidden", "You are not part of this batch's custody chain", 403);
  }
}

/** Fetch a request row + parties check (parties of the request or batch farmer or admin). */
async function getRequestFor(user, id) {
  const request = await prisma.transferRequest.findUnique({
    where: { id },
    include: {
      batch: { select: { id: true, code: true, phase: true, current_holder_user_id: true, farmer_id: true } },
      from_user: { select: { id: true, name: true, role: true } },
      to_user: { select: { id: true, name: true, role: true } },
      created_by: { select: { id: true, name: true, role: true } },
      approved_by: { select: { id: true, name: true, role: true } },
      proofs: {
        orderBy: { created_at: "asc" },
        include: {
          asset: { select: { id: true, url: true, filename: true } },
          created_by: { select: { id: true, name: true, role: true } },
        },
      },
    },
  });
  if (!request) throw new ApiError("not_found", "Transfer request not found", 404);
  if (user.role !== "admin") {
    const party =
      request.from_user_id === user.id ||
      request.to_user_id === user.id ||
      request.created_by_user_id === user.id ||
      request.batch.farmer_id === user.id ||
      request.batch.current_holder_user_id === user.id;
    if (!party) throw new ApiError("forbidden", "You are not a party to this transfer request", 403);
  }
  return request;
}

module.exports = { mountTransfersRoutes };
