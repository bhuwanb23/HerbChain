/**
 * Governed transfer service (docs/phase_6.md + docs/transfers/architecture.md).
 *
 * Phase 6 = TWO-PARTY handover. Ownership never moves because one party scans
 * a QR — it moves only through an explicit TransferRequest from the receiving
 * party that the CURRENT HOLDER approves. The actual custody change + QR
 * rotation still runs through the Phase-5 QR engine (transferByToken) inside
 * one atomic transaction, which also marks the request COMPLETED.
 *
 * Lifecycle (spec statuses): pending -> approved -> completed
 *                                      |-> rejected     (holder / admin)
 *                           pending/approved -> cancelled (requestor / holder / admin)
 *
 * Request types (constants/transfer.js): the leg being represented
 * (FARMER_TO_TRANSPORTER, TRANSPORTER_TO_LAB, LAB_TO_TRANSPORTER,
 *  TRANSPORTER_TO_MANUFACTURER + self-collect legs) or ADMIN_RECOVERY.
 *
 * Every lifecycle transition writes an audit row (TRANSFER_INITIATED /
 * TRANSFER_APPROVED / TRANSFER_REJECTED / TRANSFER_CANCELLED /
 * TRANSFER_COMPLETED); the engine additionally writes the immutable
 * BatchEvent TRANSFER row, the scan log and the blockchain anchor.
 */
const { prisma } = require("../db/client");
const { ApiError } = require("../utils/errors");
const { legCodeFor, TRANSFER_TYPES } = require("../constants/transfer");
const { TERMINAL_PHASES } = require("../constants/qr");
const { transferByToken, hashToken, assertReceiverEligible } = require("./qrEngine");
const { assertOwnedAssets } = require("./uploads");

// Roles that may RECEIVE custody through a governed request (farmer originates
// batches and never requests custody; admin uses ADMIN_RECOVERY instead).
const RECEIVER_ROLES = ["transporter", "lab", "manufacturer"];

const REQUEST_INCLUDE = {
  batch: { select: { id: true, code: true, phase: true, current_holder_user_id: true } },
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
};

async function writeAudit(tx, { actorUserId, action, batchId, requestId = null, meta = {} }) {
  await tx.auditLog.create({
    data: {
      actor_user_id: actorUserId,
      action,
      target_type: requestId ? "transfer_request" : "batch",
      target_id: requestId || batchId,
      meta_json: meta,
    },
  });
}

/** Full request row with relations, or 404. */
async function getRequestRow(id) {
  const request = await prisma.transferRequest.findUnique({ where: { id }, include: REQUEST_INCLUDE });
  if (!request) throw new ApiError("not_found", "Transfer request not found", 404);
  return request;
}

/**
 * Create a governed request. Only the RECEIVING party may open one, and only
 * for a legal (phase, role) leg of the custody matrix.
 */
async function requestTransfer(user, { batch_id, type, reason = null }) {
  if (!RECEIVER_ROLES.includes(user.role)) {
    throw new ApiError("forbidden", `A ${user.role} cannot receive custody through a transfer request`, 403);
  }
  await assertReceiverEligible(user); // active + AYUSH-verified for org roles

  const batch = await prisma.batch.findUnique({ where: { id: batch_id } });
  if (!batch) throw new ApiError("not_found", "Batch not found", 404);
  if (TERMINAL_PHASES.includes(batch.phase)) {
    throw new ApiError("invalid_transition", `Batches in phase '${batch.phase}' cannot be transferred`, 409);
  }
  if (batch.current_holder_user_id === user.id) {
    throw new ApiError("self_transfer", "You already hold custody of this batch", 409);
  }

  // Type must be a legal leg for (phase, receiver role) — derive it when the
  // caller omits type, reject mismatches when provided.
  const expected = legCodeFor(batch.phase, user.role);
  if (!expected) {
    throw new ApiError(
      "invalid_transition",
      `A ${user.role} cannot request custody while the batch is '${batch.phase}'`,
      409
    );
  }
  if (type && type !== expected) {
    throw new ApiError("bad_request", `Transfer type for this move must be '${expected}'`, 400);
  }

  // One live (pending/approved) request per requester per batch. Requests
  // whose recorded holder is no longer the current holder are stale — cancel
  // them (audited) so the receiver can re-request from the real holder.
  const live = await prisma.transferRequest.findMany({
    where: { batch_id: batch.id, to_user_id: user.id, status: { in: ["pending", "approved"] } },
    select: { id: true, status: true, from_user_id: true },
  });
  const currentLive = live.find((r) => r.from_user_id === batch.current_holder_user_id);
  if (currentLive) {
    throw new ApiError("request_exists", `You already have a ${currentLive.status} transfer request for this batch`, 409);
  }
  if (live.length) {
    await prisma.$transaction(async (tx) => {
      for (const stale of live) {
        await tx.transferRequest.update({
          where: { id: stale.id },
          data: { status: "cancelled", rejection_reason: "holder changed — request superseded", decided_at: new Date() },
        });
        await writeAudit(tx, {
          actorUserId: user.id,
          action: "TRANSFER_CANCELLED",
          batchId: batch.id,
          requestId: stale.id,
          meta: { code: batch.code, reason: "holder changed — superseded by a new request", type: expected },
        });
      }
    });
  }

  const holder = await prisma.user.findUnique({
    where: { id: batch.current_holder_user_id },
    select: { id: true, role: true },
  });

  const request = await prisma.$transaction(async (tx) => {
    const row = await tx.transferRequest.create({
      data: {
        batch_id: batch.id,
        from_user_id: holder.id,
        from_role: holder.role,
        to_user_id: user.id,
        to_role: user.role,
        type: expected,
        reason,
        status: "pending",
        created_by_user_id: user.id,
      },
    });
    await writeAudit(tx, {
      actorUserId: user.id,
      action: "TRANSFER_INITIATED",
      batchId: batch.id,
      requestId: row.id,
      meta: { code: batch.code, type: expected, from_user_id: holder.id, to_user_id: user.id },
    });
    return row;
  });

  return getRequestRow(request.id);
}

/** Holder approves the handover (two-party gate). */
async function approveRequest(user, { request_id }) {
  const request = await getRequestRow(request_id);
  if (request.status !== "pending") {
    throw new ApiError("invalid_state", `Only a pending request can be approved (currently '${request.status}')`, 409);
  }
  const batch = await prisma.batch.findUnique({ where: { id: request.batch_id } });
  if (!batch) throw new ApiError("not_found", "Batch not found", 404);

  // Only the CURRENT holder approves a request that was addressed to them.
  if (request.from_user_id !== batch.current_holder_user_id) {
    throw new ApiError("stale_holder", "The batch holder changed since this request was made — the request is stale", 409);
  }
  if (batch.current_holder_user_id !== user.id) {
    throw new ApiError("forbidden", "Only the current holder can approve a transfer request", 403);
  }

  await prisma.$transaction(async (tx) => {
    await tx.transferRequest.update({
      where: { id: request.id },
      data: { status: "approved", approved_by_user_id: user.id, decided_at: new Date() },
    });
    await writeAudit(tx, {
      actorUserId: user.id,
      action: "TRANSFER_APPROVED",
      batchId: batch.id,
      requestId: request.id,
      meta: { code: batch.code, type: request.type, from_user_id: request.from_user_id, to_user_id: request.to_user_id },
    });
  });
  return getRequestRow(request.id);
}

/** Holder (or admin) rejects a pending request. */
async function rejectRequest(user, { request_id, reason = null }) {
  const request = await getRequestRow(request_id);
  if (request.status !== "pending") {
    throw new ApiError("invalid_state", `Only a pending request can be rejected (currently '${request.status}')`, 409);
  }
  const isHolder = request.from_user_id === user.id;
  if (!isHolder && user.role !== "admin") {
    throw new ApiError("forbidden", "Only the current holder (or an admin) can reject a transfer request", 403);
  }
  // Re-verify holder identity (holder may have changed since the request).
  if (isHolder) {
    const batch = await prisma.batch.findUnique({ where: { id: request.batch_id }, select: { current_holder_user_id: true } });
    if (!batch || batch.current_holder_user_id !== user.id) {
      throw new ApiError("stale_holder", "You are no longer the current holder — the request is stale", 409);
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.transferRequest.update({
      where: { id: request.id },
      data: { status: "rejected", rejection_reason: reason, decided_at: new Date() },
    });
    await writeAudit(tx, {
      actorUserId: user.id,
      action: "TRANSFER_REJECTED",
      batchId: request.batch_id,
      requestId: request.id,
      meta: { code: request.batch?.code || null, type: request.type, reason },
    });
  });
  return getRequestRow(request.id);
}

/**
 * Cancel: the requestor may cancel while pending; the holder (or admin) may
 * cancel pending OR approved requests before execution.
 */
async function cancelRequest(user, { request_id, reason = null }) {
  const request = await getRequestRow(request_id);
  if (!["pending", "approved"].includes(request.status)) {
    throw new ApiError("invalid_state", `A '${request.status}' request cannot be cancelled`, 409);
  }
  const isRequestor = request.created_by_user_id === user.id;
  const isHolder = request.from_user_id === user.id;
  if (!isRequestor && !isHolder && user.role !== "admin") {
    throw new ApiError("forbidden", "You cannot cancel this transfer request", 403);
  }
  if (request.status === "approved" && isRequestor && !isHolder && user.role !== "admin") {
    throw new ApiError("invalid_state", "Only the holder (or an admin) can cancel an approved request", 409);
  }

  await prisma.$transaction(async (tx) => {
    await tx.transferRequest.update({
      where: { id: request.id },
      data: { status: "cancelled", rejection_reason: reason || "cancelled", decided_at: new Date() },
    });
    await writeAudit(tx, {
      actorUserId: user.id,
      action: "TRANSFER_CANCELLED",
      batchId: request.batch_id,
      requestId: request.id,
      meta: { code: request.batch?.code || null, type: request.type, reason },
    });
  });
  return getRequestRow(request.id);
}

/**
 * Two-party execution: the approved request's receiver presents the scanned
 * QR token; ownership + QR rotation happen atomically in the engine.
 *
 * Resolves the request by id when given, otherwise the receiver's approved
 * request for the batch encoded in the token. The engine re-validates
 * everything (token active, owner sync, phase matrix, receiver eligibility)
 * inside its transaction and marks the request COMPLETED.
 */
async function executeTransfer(user, { token, request_id = null, meta = {} }) {
  const record = await prisma.qrToken.findUnique({ where: { token_hash: hashToken(token) } });
  if (!record) throw new ApiError("not_found", "QR token not recognised", 404);

  let request;
  if (request_id) {
    request = await getRequestRow(request_id);
    if (request.batch_id !== record.batch_id) {
      throw new ApiError("bad_request", "The request does not belong to this batch's QR", 400);
    }
    if (request.to_user_id !== user.id) {
      throw new ApiError("forbidden", "Only the receiving party can execute this transfer", 403);
    }
  } else {
    request = await prisma.transferRequest.findFirst({
      where: { batch_id: record.batch_id, to_user_id: user.id, status: "approved" },
      orderBy: { created_at: "desc" },
      include: REQUEST_INCLUDE,
    });
  }
  if (!request) {
    throw new ApiError("transfer_not_requested", "No approved transfer request for this batch — request custody and get the holder's approval first", 409);
  }
  if (request.status !== "approved") {
    throw new ApiError("not_approved", `This transfer request is '${request.status}' — it must be approved by the holder before executing`, 409);
  }

  const out = await transferByToken({ token, receiver: user, request, meta });

  await prisma.auditLog.create({
    data: {
      actor_user_id: user.id,
      action: "TRANSFER_COMPLETED",
      target_type: "transfer_request",
      target_id: request.id,
      meta_json: {
        batch_id: out.batch_id,
        code: out.code,
        type: request.type,
        from_user_id: out.from_user_id,
        to_user_id: out.to_user_id,
        old_version: out.old_version,
        new_version: out.new_version,
      },
    },
  });

  return { ...out, request: await getRequestRow(request.id) };
}

/**
 * Admin recovery: AYUSH forcibly returns a batch to system custody without the
 * holder's consent (fraud / abandonment / lost custody). The raw QR may be
 * lost, so the engine is handed the batch's ACTIVE token row directly; the
 * batch holder becomes the admin and the phase is preserved.
 */
async function adminRecovery(user, { batch_id, reason = null, meta = {} }) {
  if (user.role !== "admin") {
    throw new ApiError("forbidden", "Only an admin can run a custody recovery", 403);
  }
  const batch = await prisma.batch.findUnique({ where: { id: batch_id } });
  if (!batch) throw new ApiError("not_found", "Batch not found", 404);
  if (TERMINAL_PHASES.includes(batch.phase)) {
    throw new ApiError("invalid_transition", `Batches in phase '${batch.phase}' cannot be recovered`, 409);
  }

  const active = await prisma.qrToken.findFirst({
    where: { batch_id: batch.id, status: "active" },
    include: { batch: { select: { id: true, code: true, phase: true, current_holder_user_id: true } } },
  });
  if (!active) {
    throw new ApiError("qr_inactive", "No ACTIVE QR token exists for this batch — nothing to recover", 409);
  }

  // Open the ADMIN_RECOVERY request (approved by the admin who ordered it).
  const holder = await prisma.user.findUnique({ where: { id: batch.current_holder_user_id }, select: { role: true } });
  const request = await prisma.$transaction(async (tx) => {
    const row = await tx.transferRequest.create({
      data: {
        batch_id: batch.id,
        from_user_id: batch.current_holder_user_id,
        from_role: holder.role,
        to_user_id: user.id,
        to_role: user.role,
        type: "ADMIN_RECOVERY",
        reason: reason || "admin custody recovery",
        status: "approved",
        created_by_user_id: user.id,
        approved_by_user_id: user.id,
        decided_at: new Date(),
      },
    });
    await writeAudit(tx, {
      actorUserId: user.id,
      action: "TRANSFER_INITIATED",
      batchId: batch.id,
      requestId: row.id,
      meta: { code: batch.code, type: "ADMIN_RECOVERY", reason: reason || null },
    });
    return row;
  });

  const out = await transferByToken({ receiver: user, request, record: active, meta });

  await prisma.auditLog.create({
    data: {
      actor_user_id: user.id,
      action: "TRANSFER_COMPLETED",
      target_type: "transfer_request",
      target_id: request.id,
      meta_json: { batch_id: batch.id, code: batch.code, type: "ADMIN_RECOVERY", from_user_id: out.from_user_id, to_user_id: user.id, old_version: out.old_version, new_version: out.new_version },
    },
  });

  return { ...out, request: await getRequestRow(request.id) };
}

/**
 * Proof-of-handover attached AFTER a completed transfer: an uploaded photo
 * (asset) plus sender/receiver signatures and remarks. Parties to the request
 * (or admin) may attach; the proof links to the immutable TRANSFER event.
 */
async function attachProof(user, { request_id, asset_id = null, sender_signature = null, receiver_signature = null, remarks = null }) {
  const request = await getRequestRow(request_id);
  if (request.status !== "completed") {
    throw new ApiError("invalid_state", `Proof can only be attached to a completed transfer (currently '${request.status}')`, 409);
  }
  const isParty =
    request.from_user_id === user.id || request.to_user_id === user.id || request.created_by_user_id === user.id;
  if (!isParty && user.role !== "admin") {
    throw new ApiError("forbidden", "Only the parties to the transfer (or an admin) can attach proof", 403);
  }

  let asset = null;
  if (asset_id) {
    const owned = await assertOwnedAssets(user.id, [asset_id]);
    asset = owned[0];
  }

  const proof = await prisma.transferProof.create({
    data: {
      transfer_request_id: request.id,
      ownership_history_id: request.batch_event_id,
      asset_id: asset ? asset.id : null,
      photo_url: asset ? asset.url : null,
      sender_signature,
      receiver_signature,
      remarks,
      created_by_user_id: user.id,
    },
  });
  await prisma.auditLog.create({
    data: {
      actor_user_id: user.id,
      action: "TRANSFER_PROOF_ATTACHED",
      target_type: "transfer_request",
      target_id: request.id,
      meta_json: { code: request.batch?.code || null, proof_id: proof.id, has_photo: Boolean(asset) },
    },
  });

  return prisma.transferProof.findUnique({
    where: { id: proof.id },
    include: {
      asset: { select: { id: true, url: true, filename: true } },
      created_by: { select: { id: true, name: true, role: true } },
      request: { select: { id: true, status: true, type: true } },
    },
  });
}

// --------------------------------------------------------------- queries

/** Requests involving this user (or all, for admins). */
async function listRequests(user, { batch_id = null, status = null, limit = 50, offset = 0 } = {}) {
  const where = {};
  if (batch_id) where.batch_id = batch_id;
  if (status) where.status = status;
  if (user.role !== "admin") {
    where.OR = [{ from_user_id: user.id }, { to_user_id: user.id }, { created_by_user_id: user.id }];
  }
  const [requests, total] = await Promise.all([
    prisma.transferRequest.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: Math.max(parseInt(offset, 10) || 0, 0),
      take: Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100),
      include: REQUEST_INCLUDE,
    }),
    prisma.transferRequest.count({ where }),
  ]);
  return { requests, total };
}

/** Ownership history = the immutable custody timeline from BatchEvents. */
async function ownershipHistory(batchId) {
  const events = await prisma.batchEvent.findMany({
    where: { batch_id: batchId, event_type: { in: ["CREATED", "TRANSFER"] } },
    orderBy: { created_at: "asc" },
    include: {
      actor: { select: { id: true, name: true, role: true } },
      from_user: { select: { id: true, name: true, role: true } },
      to_user: { select: { id: true, name: true, role: true } },
    },
  });
  return events.map((e) => ({
    event_id: e.id,
    event_type: e.event_type,
    from: e.from_user,
    to: e.to_user,
    phase_before: e.phase_before,
    phase_after: e.phase_after,
    method: e.payload_json?.method || (e.event_type === "CREATED" ? "batch_creation" : "qr_transfer"),
    transfer_type: e.payload_json?.transfer_type || null,
    request_id: e.payload_json?.request_id || null,
    qr: e.payload_json?.token_version != null
      ? { from_version: e.payload_json.token_version, to_version: e.payload_json.new_token_version ?? null }
      : null,
    location: e.location,
    gps: e.gps_lat != null ? { lat: e.gps_lat, lng: e.gps_lng } : null,
    created_at: e.created_at,
  }));
}

/** Current ownership snapshot: holder, phase and the ACTIVE QR version. */
async function currentOwner(batchId) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      farmer: { select: { id: true, name: true, role: true } },
      species: { select: { code: true, common_name: true } },
    },
  });
  if (!batch) throw new ApiError("not_found", "Batch not found", 404);

  const [holder, activeToken] = await Promise.all([
    prisma.user.findUnique({ where: { id: batch.current_holder_user_id }, select: { id: true, name: true, role: true } }),
    prisma.qrToken.findFirst({
      where: { batch_id: batch.id, status: "active" },
      orderBy: { version: "desc" },
      select: { version: true, status: true, expiry_at: true },
    }),
  ]);
  const since = await prisma.batchEvent.findFirst({
    where: { batch_id: batch.id, event_type: { in: ["CREATED", "TRANSFER"] } },
    orderBy: { created_at: "desc" },
    select: { created_at: true, event_type: true },
  });

  return {
    batch_id: batch.id,
    code: batch.code,
    species: batch.species,
    phase: batch.phase,
    owner: holder || null,
    active_qr_version: activeToken && activeToken.expiry_at > new Date() ? activeToken.version : null,
    since: since ? { event: since.event_type, at: since.created_at } : null,
    farmer: batch.farmer,
  };
}

module.exports = {
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
};
