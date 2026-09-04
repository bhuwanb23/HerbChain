/**
 * Manufacturer procurement service (docs/phase_9.md +
 * docs/procurement/architecture.md).
 *
 * Phase 9 turns certified batches into manufacturing inventory. The rules
 * baked in:
 *  - ONLY test_status=certified batches with a valid (active, non-expired)
 *    certificate are procurable; a rejected/under_testing/expired batch is
 *    never visible or requestable.
 *  - Requests go to the CURRENT HOLDER (the lab) who approves full or
 *    partial quantities; approval locks an InventoryAllocation RESERVED
 *    against the batch pool (anti-oversell across manufacturers) and
 *    auto-creates the Phase-7 LAB_TO_MANUFACTURER shipment.
 *  - The governed custody hop runs through the Phase-7 delivery engine
 *    (approved Phase-6 TransferRequest + QR rotation); procurement NEVER
 *    moves custody by itself.
 *  - Receiving = Goods Receipt Note (GRN): accepted qty enters the
 *    manufacturer's InventoryItem; the batch pool moves reserved -> consumed
 *    (rejected qty returns to available); the allocation + request are
 *    fulfilled. Every inventory change is an append-only transaction row.
 *  - Quality holds quarantine a batch — while ACTIVE it cannot be reserved or
 *    consumed for production.
 */
const { prisma } = require("../db/client");
const { ApiError } = require("../utils/errors");
const { env } = require("../config/env");
const { REQUEST_STATUSES, ALLOCATION_STATUSES, TX_TYPES, HOLD_STATUSES, inventoryState } = require("../constants/procurement");
const { createShipment } = require("./shipments");

// ------------------------------------------------------------ code gen

/** REQ-YYYY-000001 — never the DB id (code gen inside a tx). */
async function nextRequestCode(tx) {
  const year = new Date().getFullYear();
  const pre = `${env.REQUEST_CODE_PREFIX}-${year}-`;
  const count = await tx.batchRequest.count({ where: { request_no: { startsWith: pre } } });
  return `${pre}${String(count + 1).padStart(6, "0")}`;
}

/** GRN-YYYY-000001 — never the DB id (code gen inside a tx). */
async function nextGrnCode(tx) {
  const year = new Date().getFullYear();
  const pre = `${env.GRN_CODE_PREFIX}-${year}-`;
  const count = await tx.goodsReceipt.count({ where: { grn_number: { startsWith: pre } } });
  return `${pre}${String(count + 1).padStart(6, "0")}`;
}

// ------------------------------------------------------------ validation

/** The batch's valid certificate (active + not expired + certified) or null. */
async function validCertificate(batch) {
  if (batch.test_status !== "certified") return null;
  const cert = await prisma.certification.findUnique({
    where: { batch_id: batch.id },
    include: { species: { select: { code: true, common_name: true } } },
  });
  if (!cert || cert.status !== "active") return null;
  if (cert.expiry_date && cert.expiry_date <= new Date()) return null;
  return cert;
}

/** Throws unless the batch carries a valid certificate (spec §11 gate). */
async function assertCertifiedAndValid(batch) {
  const cert = await validCertificate(batch);
  if (!cert) {
    if (batch.test_status !== "certified") {
      throw new ApiError("not_certified", `Batch is '${batch.test_status}' — only certified batches are procurable`, 409);
    }
    const existing = await prisma.certification.findUnique({ where: { batch_id: batch.id } });
    if (!existing) throw new ApiError("no_certificate", "Batch has no certificate of analysis", 409);
    throw new ApiError("certificate_expired", "The batch's certificate has expired — procurement is blocked", 409);
  }
  return cert;
}

/** The batch's availability pool; lazily created from certified qty. */
async function ensureBatchInventory(batch) {
  const receipt = await prisma.labReceipt.findUnique({ where: { batch_id: batch.id } });
  const total = receipt?.received_quantity_kg ?? batch.weight_kg ?? 0;
  const existing = await prisma.batchInventory.findUnique({ where: { batch_id: batch.id } });
  if (existing) return existing;
  return prisma.batchInventory.create({
    data: { batch_id: batch.id, total_quantity_kg: total, available_quantity_kg: total },
  });
}

async function getRequestRow(id) {
  const request = await prisma.batchRequest.findUnique({
    where: { id },
    include: {
      manufacturer: { select: { id: true, name: true, role: true } },
      batch: {
        select: {
          id: true,
          code: true,
          phase: true,
          test_status: true,
          weight_kg: true,
          current_holder_user_id: true,
          species: { select: { code: true, common_name: true } },
        },
      },
      allocation: true,
      shipment: { select: { id: true, shipment_no: true, status: true } },
    },
  });
  if (!request) throw new ApiError("not_found", "Procurement request not found", 404);
  return request;
}

async function writeAudit(tx, { actorUserId, action, targetType = "batch_request", targetId, meta = {} }) {
  await tx.auditLog.create({
    data: { actor_user_id: actorUserId, action, target_type: targetType, target_id: targetId, meta_json: meta },
  });
}

/** Write a BatchEvent timeline row (traceability for the manufacturer leg). */
async function writeBatchEvent(tx, { batchId, eventType, actorUserId, payload = {} }) {
  await tx.batchEvent.create({
    data: { batch_id: batchId, event_type: eventType, actor_user_id: actorUserId, payload_json: payload },
  });
}

/** Anchor a high-value procurement fact to the ledger (spec §15). */
async function anchorBlockchain(tx, { anchorCode, entityType = "audit_log", entityId }) {
  await tx.blockchainEvent.create({
    data: { anchor_code: anchorCode, entity_type: entityType, entity_id: entityId, status: "pending" },
  });
}

// ------------------------------------------------------------ certified view

/**
 * Certified-batch marketplace (spec §2): manufacturers see ONLY certified,
 * cert-valid, currently-held-by-a-lab batches with their available qty.
 * Filters: species / batch code / location / lab / farmer / harvest date /
 * certification date / min available.
 */
async function listCertifiedBatches(user, filters = {}) {
  const { species = null, batch_code = null, location = null, lab_user_id = null, farmer_id = null, harvest_from = null, harvest_to = null, min_available = null, limit = 50, offset = 0 } = filters;

  const where = { test_status: "certified", phase: "at_lab" };
  if (species) where.species = { common_name: { contains: species } };
  if (batch_code) where.code = { contains: batch_code };
  if (location) where.location = { contains: location };
  if (lab_user_id) where.current_holder_user_id = lab_user_id;
  if (farmer_id) where.farmer_id = farmer_id;
  if (harvest_from || harvest_to) {
    where.harvest_date = {};
    if (harvest_from) where.harvest_date.gte = new Date(harvest_from);
    if (harvest_to) where.harvest_date.lte = new Date(harvest_to);
  }

  const batches = await prisma.batch.findMany({
    where,
    orderBy: { created_at: "desc" },
    skip: Math.max(parseInt(offset, 10) || 0, 0),
    take: Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100),
    include: {
      species: { select: { id: true, code: true, common_name: true } },
      farmer: { select: { id: true, name: true } },
      current_holder: { select: { id: true, name: true, role: true } },
      certifications: { orderBy: { issued_at: "desc" }, take: 1 },
      lab_receipts: { select: { received_quantity_kg: true } },
    },
  });

  const out = [];
  for (const batch of batches) {
    const cert = batch.certifications[0];
    if (!cert || cert.status !== "active" || (cert.expiry_date && cert.expiry_date <= new Date())) continue;
    const inv = await ensureBatchInventory(batch);
    if (min_available != null && inv.available_quantity_kg < parseFloat(min_available)) continue;
    out.push({ batch, cert, inventory: inv });
  }
  return { items: out, total: out.length };
}

/** Full traceability dossier for one certified batch (spec §2, before procurement). */
async function certifiedBatchDetail(user, batchId) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      species: { select: { id: true, code: true, common_name: true, scientific_name: true } },
      farmer: { select: { id: true, name: true, role: true } },
      current_holder: { select: { id: true, name: true, role: true } },
      certifications: { orderBy: { issued_at: "desc" }, take: 1 },
      lab_receipts: true,
      species_verifications: { orderBy: { verified_at: "desc" } },
      rejection_records: true,
      events: {
        where: { event_type: { in: ["CREATED", "TRANSFER", "LAB_CERTIFIED"] } },
        orderBy: { created_at: "asc" },
        include: {
          actor: { select: { id: true, name: true, role: true } },
          from_user: { select: { id: true, name: true, role: true } },
          to_user: { select: { id: true, name: true, role: true } },
        },
      },
    },
  });
  if (!batch) throw new ApiError("not_found", "Batch not found", 404);
  const cert = await validCertificate(batch);
  if (!cert) throw new ApiError("not_procurable", "This batch is not procurable (not certified / certificate invalid)", 409);
  const inventory = await ensureBatchInventory(batch);
  const shipments = await prisma.shipment.findMany({
    where: { ref_type: "batch", ref_id: batch.id },
    orderBy: { created_at: "desc" },
    take: 20,
    include: { transporter: { select: { id: true, name: true } } },
  });
  return { batch, cert, inventory, shipments };
}

// ------------------------------------------------------------ request

/** Manufacturer opens a request for a quantity of a certified batch. */
async function requestBatch(user, { batch_id, requested_quantity_kg, notes = null }) {
  if (user.role !== "manufacturer") {
    throw new ApiError("forbidden", "Only manufacturers can request batch quantities", 403);
  }
  const qty = parseFloat(requested_quantity_kg);
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new ApiError("bad_request", "requested_quantity_kg must be a positive number", 400);
  }
  const batch = await prisma.batch.findUnique({ where: { id: batch_id } });
  if (!batch) throw new ApiError("not_found", "Batch not found", 404);
  await assertCertifiedAndValid(batch);
  const inventory = await ensureBatchInventory(batch);
  if (inventory.available_quantity_kg <= 0) {
    throw new ApiError("no_stock", "No available quantity remains for this batch", 409);
  }

  const request = await prisma.$transaction(async (tx) => {
    const code = await nextRequestCode(tx);
    const row = await tx.batchRequest.create({
      data: {
        request_no: code,
        manufacturer_user_id: user.id,
        batch_id: batch.id,
        requested_quantity_kg: qty,
        status: "pending",
        decision_note: notes || null,
      },
    });
    await writeAudit(tx, {
      actorUserId: user.id,
      action: "REQUEST_CREATED",
      targetType: "batch_request",
      targetId: row.id,
      meta: { request_no: code, batch_id: batch.id, batch_code: batch.code, qty },
    });
    return row;
  });
  return getRequestRow(request.id);
}

/** Manufacturer cancels a pending request (nothing reserved yet). */
async function cancelRequest(user, { request_id, reason = null }) {
  const request = await getRequestRow(request_id);
  const isRequester = request.manufacturer_user_id === user.id;
  const isHolder = request.batch.current_holder_user_id === user.id;
  if (!isRequester && !isHolder && user.role !== "admin") {
    throw new ApiError("forbidden", "You cannot cancel this request", 403);
  }
  if (!["pending", "approved", "partially_approved"].includes(request.status)) {
    throw new ApiError("invalid_state", `A '${request.status}' request cannot be cancelled`, 409);
  }
  if (request.status !== "pending" && request.shipment && ["picked_up", "in_transit", "arrived_destination", "delivered", "completed"].includes(request.shipment.status)) {
    throw new ApiError("invalid_state", "Goods are in transit — the request cannot be cancelled anymore", 409);
  }

  await prisma.$transaction(async (tx) => {
    if (request.allocation) {
      await tx.inventoryAllocation.update({
        where: { id: request.allocation.id },
        data: { status: "cancelled", resolved_at: new Date() },
      });
      await tx.batchInventory.update({
        where: { batch_id: request.batch_id },
        data: {
          available_quantity_kg: { increment: request.allocation.allocated_quantity_kg },
          reserved_quantity_kg: { decrement: request.allocation.allocated_quantity_kg },
        },
      });
      // Close the auto-created shipment if still open (pre-pickup only).
      if (request.shipment && ["requested", "assigned", "accepted", "arrived_for_pickup", "rejected"].includes(request.shipment.status)) {
        await tx.shipment.update({ where: { id: request.shipment.id }, data: { status: "cancelled", failure_reason: reason || "request cancelled" } });
        await tx.shipmentEvent.create({
          data: { shipment_id: request.shipment.id, event_type: "CANCELLED", event_data: { reason: reason || "request cancelled" }, created_by_user_id: user.id },
        });
      }
    }
    await tx.batchRequest.update({ where: { id: request.id }, data: { status: "cancelled", decision_note: reason || null, decided_by_user_id: user.id, decided_at: new Date() } });
    await writeAudit(tx, { actorUserId: user.id, action: "REQUEST_CANCELLED", targetId: request.id, meta: { request_no: request.request_no, reason } });
  });
  return getRequestRow(request.id);
}

// ------------------------------------------------------------ approve

/**
 * Holder (the lab) approves / partially approves / rejects. Approval:
 *  - clamps the approved qty to the batch's available pool (anti-oversell),
 *  - locks an InventoryAllocation RESERVED,
 *  - auto-creates the Phase-7 LAB_TO_MANUFACTURER shipment (request -> assign
 *    -> pickup -> deliver), linked back to the request.
 * A partial approval (approved < requested) sets partially_approved.
 */
async function approveRequest(user, { request_id, approved_quantity_kg = null, note = null }) {
  const request = await getRequestRow(request_id);
  if (request.status !== "pending") {
    throw new ApiError("invalid_state", `Only a pending request can be approved (currently '${request.status}')`, 409);
  }
  const batch = await prisma.batch.findUnique({ where: { id: request.batch_id } });
  if (!batch) throw new ApiError("not_found", "Batch not found", 404);
  // Only the CURRENT holder approves (the lab). Re-verify holder identity.
  if (batch.current_holder_user_id !== user.id && user.role !== "admin") {
    throw new ApiError("forbidden", "Only the current holder (the lab) can approve a procurement request", 403);
  }
  const cert = await assertCertifiedAndValid(batch);
  const inventory = await ensureBatchInventory(batch);

  const approvedQty = approved_quantity_kg == null ? Math.min(request.requested_quantity_kg, inventory.available_quantity_kg) : Math.min(parseFloat(approved_quantity_kg), inventory.available_quantity_kg);
  if (!Number.isFinite(approvedQty) || approvedQty <= 0) {
    throw new ApiError("no_stock", `No available quantity to approve (available ${inventory.available_quantity_kg} kg)`, 409);
  }
  const status = approvedQty >= request.requested_quantity_kg ? "approved" : "partially_approved";

  // Auto-create the Phase-7 shipment (LAB_TO_MANUFACTURER, lab -> manufacturer).
  // The governed custody hop at pickup/delivery runs through the QR engine.
  const shipment = await createShipment(user, {
    ref_type: "batch",
    ref_id: batch.id,
    shipment_type: "LAB_TO_MANUFACTURER",
    quantity_kg: approvedQty,
    notes: note || `procurement ${request.request_no}`,
  }, { requesterUserId: request.manufacturer_user_id });
  await prisma.$transaction(async (tx) => {
    await tx.shipment.update({ where: { id: shipment.id }, data: { procurement_request_id: request.id } });
    const allocation = await tx.inventoryAllocation.create({
      data: { batch_id: batch.id, request_id: request.id, allocated_quantity_kg: approvedQty, status: "reserved" },
    });
    await tx.batchInventory.update({
      where: { batch_id: batch.id },
      data: {
        available_quantity_kg: { decrement: approvedQty },
        reserved_quantity_kg: { increment: approvedQty },
      },
    });
    await tx.batchRequest.update({
      where: { id: request.id },
      data: { status, approved_quantity_kg: approvedQty, decision_note: note || null, decided_by_user_id: user.id, decided_at: new Date() },
    });
    await writeAudit(tx, {
      actorUserId: user.id,
      action: "REQUEST_APPROVED",
      targetId: request.id,
      meta: { request_no: request.request_no, batch_code: batch.code, requested: request.requested_quantity_kg, approved: approvedQty, status, shipment_no: shipment.shipment_no, cert: cert.certificate_number },
    });
  });
  return getRequestRow(request.id);
}

/** Holder / admin rejects a pending request. */
async function rejectRequest(user, { request_id, reason = null }) {
  const request = await getRequestRow(request_id);
  if (request.status !== "pending") {
    throw new ApiError("invalid_state", `Only a pending request can be rejected (currently '${request.status}')`, 409);
  }
  const batch = await prisma.batch.findUnique({ where: { id: request.batch_id } });
  const isHolder = batch?.current_holder_user_id === user.id;
  if (!isHolder && user.role !== "admin") {
    throw new ApiError("forbidden", "Only the current holder (or an admin) can reject a request", 403);
  }
  await prisma.$transaction(async (tx) => {
    await tx.batchRequest.update({
      where: { id: request.id },
      data: { status: "rejected", decision_note: reason || null, decided_by_user_id: user.id, decided_at: new Date() },
    });
    await writeAudit(tx, { actorUserId: user.id, action: "REQUEST_REJECTED", targetId: request.id, meta: { request_no: request.request_no, reason } });
  });
  return getRequestRow(request.id);
}

// ------------------------------------------------------------ receive (GRN)

/**
 * Manufacturer receives the delivered shipment: GRN + inventory intake.
 * Preconditions: the shipment is delivered/completed (the governed custody
 * hop transporter -> manufacturer already ran at delivery), the batch's
 * certificate is valid, and this user is the destination party.
 * accepted qty enters inventory; rejected qty returns to the batch pool.
 */
async function receiveBatch(user, { shipment_id, accepted_quantity_kg = null, rejected_quantity_kg = 0, rejection_reason = null }) {
  if (user.role !== "manufacturer" && user.role !== "admin") {
    throw new ApiError("forbidden", "Only the receiving manufacturer can record a GRN", 403);
  }
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipment_id },
    include: { to_user: { select: { id: true, name: true, role: true } } },
  });
  if (!shipment) throw new ApiError("not_found", "Shipment not found", 404);
  if (shipment.ref_type !== "batch") throw new ApiError("invalid_state", "Only batch shipments can be received into inventory", 409);
  if (shipment.to_user_id !== user.id && user.role !== "admin") {
    throw new ApiError("forbidden", "You are not the destination of this shipment", 403);
  }
  if (!["delivered", "completed"].includes(shipment.status)) {
    throw new ApiError("invalid_state", `Goods can be received only after delivery (shipment is '${shipment.status}')`, 409);
  }
  const batch = await prisma.batch.findUnique({ where: { id: shipment.ref_id } });
  if (!batch) throw new ApiError("not_found", "Batch not found", 404);
  const cert = await assertCertifiedAndValid(batch);

  const request = shipment.procurement_request_id
    ? await getRequestRow(shipment.procurement_request_id)
    : await prisma.batchRequest.findFirst({ where: { batch_id: batch.id, manufacturer_user_id: user.id }, orderBy: { created_at: "desc" }, include: { allocation: true } });

  const receivedQty = shipment.quantity_kg ?? batch.weight_kg ?? 0;
  const acceptedQty = accepted_quantity_kg == null ? receivedQty - rejected_quantity_kg : parseFloat(accepted_quantity_kg);
  const rejectedQty = Math.max(0, receivedQty - acceptedQty);
  if (!Number.isFinite(acceptedQty) || acceptedQty < 0) {
    throw new ApiError("bad_request", "accepted_quantity_kg must be a non-negative number", 400);
  }

  const grn = await prisma.$transaction(async (tx) => {
    const code = await nextGrnCode(tx);
    const row = await tx.goodsReceipt.create({
      data: {
        grn_number: code,
        manufacturer_user_id: user.id,
        batch_id: batch.id,
        shipment_id: shipment.id,
        request_id: request?.id ?? null,
        received_quantity_kg: receivedQty,
        accepted_quantity_kg: acceptedQty,
        rejected_quantity_kg: rejectedQty,
        rejection_reason: rejection_reason || (rejectedQty > 0 ? "rejected at GRN" : null),
      },
    });

    // Batch pool: reserved -> consumed (accepted); rejected back to available.
    if (request?.allocation) {
      const allocated = request.allocation.allocated_quantity_kg;
      await tx.inventoryAllocation.update({
        where: { id: request.allocation.id },
        data: { status: "fulfilled", resolved_at: new Date() },
      });
      await tx.batchInventory.update({
        where: { batch_id: batch.id },
        data: {
          reserved_quantity_kg: { decrement: allocated },
          consumed_quantity_kg: { increment: acceptedQty },
          available_quantity_kg: { increment: rejectedQty },
        },
      });
      await tx.batchRequest.update({ where: { id: request.id }, data: { status: "fulfilled" } });
    }

    // Manufacturer inventory: upsert item + append RECEIVED transaction.
    const item = await tx.inventoryItem.upsert({
      where: { manufacturer_user_id_batch_id: { manufacturer_user_id: user.id, batch_id: batch.id } },
      update: { available_quantity_kg: { increment: acceptedQty } },
      create: { manufacturer_user_id: user.id, batch_id: batch.id, available_quantity_kg: acceptedQty, unit: "kg" },
    });
    await tx.inventoryTransaction.create({
      data: { inventory_id: item.id, transaction_type: "received", quantity_kg: acceptedQty, reference_id: row.id, notes: `GRN ${code}`, created_by_user_id: user.id },
    });

    // Traceability + audit + blockchain anchors (spec §15).
    await writeBatchEvent(tx, {
      batchId: batch.id,
      eventType: "MATERIAL_RECEIVED",
      actorUserId: user.id,
      payload: { grn_number: code, shipment_no: shipment.shipment_no, accepted_kg: acceptedQty, rejected_kg: rejectedQty, manufacturer_id: user.id },
    });
    const audit = await tx.auditLog.create({
      data: {
        actor_user_id: user.id,
        action: "GRN_CREATED",
        target_type: "goods_receipt",
        target_id: row.id,
        meta_json: { grn_number: code, batch_id: batch.id, batch_code: batch.code, accepted_kg: acceptedQty, rejected_kg: rejectedQty },
      },
    });
    await writeAudit(tx, { actorUserId: user.id, action: "INVENTORY_RECEIVED", targetType: "inventory_item", targetId: item.id, meta: { grn_number: code, qty: acceptedQty } });
    await anchorBlockchain(tx, { anchorCode: "MATERIAL_RECEIVED", entityId: audit.id });
    await anchorBlockchain(tx, { anchorCode: "BATCH_ACCEPTED", entityId: audit.id });
    await anchorBlockchain(tx, { anchorCode: "INVENTORY_ENTERED", entityId: audit.id });
    return row;
  });

  return prisma.goodsReceipt.findUnique({
    where: { id: grn.id },
    include: {
      manufacturer: { select: { id: true, name: true, role: true } },
      batch: { select: { id: true, code: true, species: { select: { code: true, common_name: true } } } },
      shipment: { select: { id: true, shipment_no: true, status: true } },
    },
  });
}

// ------------------------------------------------------------ inventory

/** Manufacturer's inventory items with derived state. */
async function listInventory(user, { status = null, limit = 100, offset = 0 } = {}) {
  const where = { manufacturer_user_id: user.id };
  const items = await prisma.inventoryItem.findMany({
    where,
    orderBy: { updated_at: "desc" },
    skip: Math.max(parseInt(offset, 10) || 0, 0),
    take: Math.min(Math.max(parseInt(limit, 10) || 100, 1), 200),
    include: {
      batch: {
        select: {
          id: true,
          code: true,
          species: { select: { code: true, common_name: true } },
          certifications: { orderBy: { issued_at: "desc" }, take: 1 },
        },
      },
      transactions: { orderBy: { created_at: "desc" }, take: 1 },
    },
  });
  // Active quality holds attach per (manufacturer, batch) — QualityHold has
  // no FK to InventoryItem, so resolve them in a single second query.
  const batchIds = items.map((i) => i.batch_id);
  const holds = batchIds.length
    ? await prisma.qualityHold.findMany({
        where: { manufacturer_user_id: user.id, status: "active", batch_id: { in: batchIds } },
        orderBy: { created_at: "desc" },
      })
    : [];
  const holdsByBatch = new Map();
  for (const h of holds) {
    const list = holdsByBatch.get(h.batch_id) || [];
    list.push(h);
    holdsByBatch.set(h.batch_id, list);
  }
  let out = items.map((it) => ({
    ...it,
    holds: holdsByBatch.get(it.batch_id) || [],
    state: inventoryState(it),
  }));
  if (status) out = out.filter((it) => it.state === status.toUpperCase());
  return { items: out, total: out.length };
}

/** Append-only history for one inventory item. */
async function inventoryHistory(user, { inventory_id = null, limit = 100, offset = 0 } = {}) {
  const where = inventory_id ? { id: inventory_id } : { manufacturer_user_id: user.id };
  const item = inventory_id
    ? await prisma.inventoryItem.findUnique({ where: { id: inventory_id }, include: { batch: { select: { code: true } } } })
    : null;
  if (inventory_id && !item) throw new ApiError("not_found", "Inventory item not found", 404);
  if (item && item.manufacturer_user_id !== user.id && user.role !== "admin") {
    throw new ApiError("forbidden", "This inventory belongs to another manufacturer", 403);
  }
  const [transactions, total] = await Promise.all([
    prisma.inventoryTransaction.findMany({
      where: { inventory_id: inventory_id || undefined, inventory: inventory_id ? undefined : { manufacturer_user_id: user.id } },
      orderBy: { created_at: "desc" },
      skip: Math.max(parseInt(offset, 10) || 0, 0),
      take: Math.min(Math.max(parseInt(limit, 10) || 100, 1), 200),
    }),
    prisma.inventoryTransaction.count({
      where: { inventory_id: inventory_id || undefined, inventory: inventory_id ? undefined : { manufacturer_user_id: user.id } },
    }),
  ]);
  return { item, transactions, total };
}

/** Quarantine check: an ACTIVE hold blocks production ops on that batch. */
async function assertNoActiveHold(user, inventoryId) {
  const item = await prisma.inventoryItem.findUnique({ where: { id: inventoryId } });
  if (!item || item.manufacturer_user_id !== user.id) {
    throw new ApiError("forbidden", "You do not own this inventory item", 403);
  }
  const hold = await prisma.qualityHold.findFirst({
    where: { batch_id: item.batch_id, manufacturer_user_id: user.id, status: "active" },
  });
  if (hold) {
    throw new ApiError("quality_hold", `Batch is under a quality hold: ${hold.reason}`, 409);
  }
  return item;
}

/** Reserve qty for a production run (available -> reserved). */
async function reserveInventory(user, { inventory_id, quantity_kg, reference_id = null }) {
  const qty = parseFloat(quantity_kg);
  if (!Number.isFinite(qty) || qty <= 0) throw new ApiError("bad_request", "quantity_kg must be positive", 400);
  const item = await assertNoActiveHold(user, inventory_id);
  if (item.available_quantity_kg < qty) {
    throw new ApiError("insufficient_stock", `Only ${item.available_quantity_kg} kg available to reserve`, 409);
  }
  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.inventoryItem.update({
      where: { id: item.id },
      data: { available_quantity_kg: { decrement: qty }, reserved_quantity_kg: { increment: qty } },
    });
    await tx.inventoryTransaction.create({
      data: { inventory_id: item.id, transaction_type: "reserved", quantity_kg: qty, reference_id, notes: "production reservation", created_by_user_id: user.id },
    });
    await writeAudit(tx, { actorUserId: user.id, action: "INVENTORY_RESERVED", targetType: "inventory_item", targetId: item.id, meta: { qty, reference_id } });
    return updated;
  });
  return prisma.inventoryItem.findUnique({ where: { id: row.id }, include: { batch: { select: { id: true, code: true } } } });
}

/** Release a reservation back to available. */
async function releaseInventory(user, { inventory_id, quantity_kg }) {
  const qty = parseFloat(quantity_kg);
  if (!Number.isFinite(qty) || qty <= 0) throw new ApiError("bad_request", "quantity_kg must be positive", 400);
  const item = await prisma.inventoryItem.findUnique({ where: { id: inventory_id } });
  if (!item || item.manufacturer_user_id !== user.id) throw new ApiError("forbidden", "You do not own this inventory item", 403);
  if (item.reserved_quantity_kg < qty) {
    throw new ApiError("invalid_state", `Only ${item.reserved_quantity_kg} kg are reserved`, 409);
  }
  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.inventoryItem.update({
      where: { id: item.id },
      data: { available_quantity_kg: { increment: qty }, reserved_quantity_kg: { decrement: qty } },
    });
    await tx.inventoryTransaction.create({
      data: { inventory_id: item.id, transaction_type: "released", quantity_kg: qty, notes: "reservation released", created_by_user_id: user.id },
    });
    await writeAudit(tx, { actorUserId: user.id, action: "INVENTORY_RELEASED", targetType: "inventory_item", targetId: item.id, meta: { qty } });
    return updated;
  });
  return prisma.inventoryItem.findUnique({ where: { id: row.id }, include: { batch: { select: { id: true, code: true } } } });
}

/** Consume qty into production (reserved -> consumed; falls back to available). */
async function consumeInventory(user, { inventory_id, quantity_kg, reference_id = null }) {
  const qty = parseFloat(quantity_kg);
  if (!Number.isFinite(qty) || qty <= 0) throw new ApiError("bad_request", "quantity_kg must be positive", 400);
  const item = await assertNoActiveHold(user, inventory_id);
  const reservable = item.reserved_quantity_kg + item.available_quantity_kg;
  if (reservable < qty) throw new ApiError("insufficient_stock", `Only ${reservable} kg available to consume`, 409);

  const fromReserved = Math.min(item.reserved_quantity_kg, qty);
  const fromAvailable = qty - fromReserved;
  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.inventoryItem.update({
      where: { id: item.id },
      data: {
        reserved_quantity_kg: { decrement: fromReserved },
        available_quantity_kg: { decrement: fromAvailable },
        consumed_quantity_kg: { increment: qty },
      },
    });
    await tx.inventoryTransaction.create({
      data: { inventory_id: item.id, transaction_type: "consumed", quantity_kg: qty, reference_id, notes: "production consumption", created_by_user_id: user.id },
    });
    await writeAudit(tx, { actorUserId: user.id, action: "INVENTORY_CONSUMED", targetType: "inventory_item", targetId: item.id, meta: { qty, reference_id } });
    return updated;
  });
  return prisma.inventoryItem.findUnique({ where: { id: row.id }, include: { batch: { select: { id: true, code: true } } } });
}

/** Discard spoiled/damaged qty (available -> discarded). */
async function discardInventory(user, { inventory_id, quantity_kg, reason = null }) {
  const qty = parseFloat(quantity_kg);
  if (!Number.isFinite(qty) || qty <= 0) throw new ApiError("bad_request", "quantity_kg must be positive", 400);
  const item = await assertNoActiveHold(user, inventory_id);
  if (item.available_quantity_kg < qty) throw new ApiError("insufficient_stock", `Only ${item.available_quantity_kg} kg available to discard`, 409);
  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.inventoryItem.update({
      where: { id: item.id },
      data: { available_quantity_kg: { decrement: qty }, discarded_quantity_kg: { increment: qty } },
    });
    await tx.inventoryTransaction.create({
      data: { inventory_id: item.id, transaction_type: "discarded", quantity_kg: qty, notes: reason || "discarded", created_by_user_id: user.id },
    });
    await writeAudit(tx, { actorUserId: user.id, action: "INVENTORY_DISCARDED", targetType: "inventory_item", targetId: item.id, meta: { qty, reason } });
    return updated;
  });
  return prisma.inventoryItem.findUnique({ where: { id: row.id }, include: { batch: { select: { id: true, code: true } } } });
}

/** Adjust (recount): set available to an observed value, log the delta. */
async function adjustInventory(user, { inventory_id, quantity_kg, notes = null }) {
  const qty = parseFloat(quantity_kg);
  if (!Number.isFinite(qty) || qty < 0) throw new ApiError("bad_request", "quantity_kg must be a non-negative number", 400);
  const item = await prisma.inventoryItem.findUnique({ where: { id: inventory_id } });
  if (!item || item.manufacturer_user_id !== user.id) throw new ApiError("forbidden", "You do not own this inventory item", 403);
  const delta = qty - item.available_quantity_kg;
  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.inventoryItem.update({ where: { id: item.id }, data: { available_quantity_kg: qty } });
    await tx.inventoryTransaction.create({
      data: { inventory_id: item.id, transaction_type: "adjusted", quantity_kg: delta, notes: notes || "inventory recount", created_by_user_id: user.id },
    });
    await writeAudit(tx, { actorUserId: user.id, action: "INVENTORY_ADJUSTED", targetType: "inventory_item", targetId: item.id, meta: { delta, notes } });
    return updated;
  });
  return prisma.inventoryItem.findUnique({ where: { id: row.id }, include: { batch: { select: { id: true, code: true } } } });
}

// ------------------------------------------------------------ quality holds

/** Manufacturer quarantines a batch it holds (spec §12). */
async function placeQualityHold(user, { batch_id, reason }) {
  if (user.role !== "manufacturer" && user.role !== "admin") {
    throw new ApiError("forbidden", "Only the holding manufacturer can place a quality hold", 403);
  }
  if (!reason || !reason.trim()) throw new ApiError("bad_request", "reason is required", 400);
  const item = await prisma.inventoryItem.findUnique({
    where: { manufacturer_user_id_batch_id: { manufacturer_user_id: user.id, batch_id } },
  });
  if (!item && user.role !== "admin") {
    throw new ApiError("not_found", "This batch is not in your inventory", 404);
  }
  const existing = await prisma.qualityHold.findFirst({
    where: { batch_id, manufacturer_user_id: user.id, status: "active" },
  });
  if (existing) throw new ApiError("hold_exists", "A quality hold is already active for this batch", 409);

  const hold = await prisma.$transaction(async (tx) => {
    const row = await tx.qualityHold.create({
      data: { batch_id, manufacturer_user_id: user.id, reason, created_by_user_id: user.id },
    });
    await writeAudit(tx, { actorUserId: user.id, action: "QUALITY_HOLD_PLACED", targetType: "quality_hold", targetId: row.id, meta: { batch_id, reason } });
    return row;
  });
  return hold;
}

/** Resolve a hold, unblocking production. */
async function resolveQualityHold(user, { hold_id, note = null }) {
  const hold = await prisma.qualityHold.findUnique({ where: { id: hold_id } });
  if (!hold) throw new ApiError("not_found", "Quality hold not found", 404);
  if (hold.manufacturer_user_id !== user.id && user.role !== "admin") {
    throw new ApiError("forbidden", "Only the manufacturer who placed the hold can resolve it", 403);
  }
  if (hold.status !== "active") throw new ApiError("invalid_state", "This hold is not active", 409);
  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.qualityHold.update({
      where: { id: hold.id },
      data: { status: "resolved", resolved_at: new Date(), resolution_note: note || null },
    });
    await writeAudit(tx, { actorUserId: user.id, action: "QUALITY_HOLD_RESOLVED", targetType: "quality_hold", targetId: hold.id, meta: { batch_id: hold.batch_id, note } });
    return updated;
  });
  return row;
}

// ------------------------------------------------------------ dashboard

/** Manufacturer dashboard KPIs (spec §1). */
async function dashboard(user) {
  const [items, requests, incoming, holds] = await Promise.all([
    prisma.inventoryItem.findMany({ where: { manufacturer_user_id: user.id } }),
    prisma.batchRequest.findMany({ where: { manufacturer_user_id: user.id, status: { in: ["pending", "approved", "partially_approved"] } } }),
    prisma.shipment.findMany({
      where: { to_user_id: user.id, status: { in: ["requested", "assigned", "accepted", "arrived_for_pickup", "picked_up", "in_transit", "arrived_destination"] } },
    }),
    prisma.qualityHold.findMany({ where: { manufacturer_user_id: user.id, status: "active" } }),
  ]);

  // Expiring certificates among the manufacturer's inventory batches.
  const expiryWindow = new Date();
  expiryWindow.setDate(expiryWindow.getDate() + env.CERT_EXPIRY_WARNING_DAYS);
  const batchIds = items.map((i) => i.batch_id);
  const expiringCerts = batchIds.length
    ? await prisma.certification.findMany({
        where: { batch_id: { in: batchIds }, status: "active", OR: [{ expiry_date: { lte: expiryWindow } }, { expiry_date: null }] },
        include: { batch: { select: { code: true } } },
      })
    : [];

  const available = items.reduce((s, i) => s + i.available_quantity_kg, 0);
  const consumed = items.reduce((s, i) => s + i.consumed_quantity_kg, 0);
  return {
    available_inventory_kg: Math.round(available * 1000) / 1000,
    consumed_materials_kg: Math.round(consumed * 1000) / 1000,
    pending_requests: requests.length,
    incoming_shipments: incoming.length,
    expiring_certificates: expiringCerts.map((c) => ({ certificate_number: c.certificate_number, batch_code: c.batch.code, expiry_date: c.expiry_date })),
    active_holds: holds.length,
    inventory_batches: items.length,
  };
}

// ------------------------------------------------------------ analytics

/** Manufacturer analytics (spec §14) + recall readiness (spec §13). */
async function analytics(user) {
  const items = await prisma.inventoryItem.findMany({
    where: { manufacturer_user_id: user.id },
    include: {
      batch: {
        select: {
          code: true,
          species: { select: { code: true, common_name: true } },
          certifications: { orderBy: { issued_at: "desc" }, take: 1 },
        },
      },
    },
  });
  const requests = await prisma.batchRequest.findMany({
    where: { manufacturer_user_id: user.id },
    orderBy: { requested_at: "asc" },
    select: { id: true, requested_at: true, decided_at: true, status: true, approved_quantity_kg: true },
  });
  const shipments = await prisma.shipment.findMany({
    where: { to_user_id: user.id, ref_type: "batch" },
    select: { id: true, status: true, delivered_at: true },
  });
  const transactions = await prisma.inventoryTransaction.findMany({
    where: { inventory: { manufacturer_user_id: user.id }, transaction_type: { in: ["received", "consumed", "discarded"] } },
    select: { transaction_type: true, quantity_kg: true, created_at: true },
  });

  // Top herbs by total inventory + consumption.
  const herbTotals = new Map();
  for (const it of items) {
    const name = it.batch.species?.common_name || it.batch.code;
    const cur = herbTotals.get(name) || { held: 0, consumed: 0 };
    cur.held += it.available_quantity_kg + it.reserved_quantity_kg;
    cur.consumed += it.consumed_quantity_kg;
    herbTotals.set(name, cur);
  }
  const top_herbs = [...herbTotals.entries()]
    .map(([name, v]) => ({ species: name, held_kg: v.held, consumed_kg: v.consumed }))
    .sort((a, b) => b.held_kg - a.held_kg)
    .slice(0, 10);

  // Monthly consumption (last 6 months).
  const monthly = new Map();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthly.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
  }
  for (const t of transactions) {
    if (!["consumed", "discarded"].includes(t.transaction_type)) continue;
    const key = `${t.created_at.getFullYear()}-${String(t.created_at.getMonth() + 1).padStart(2, "0")}`;
    if (monthly.has(key)) monthly.set(key, monthly.get(key) + t.quantity_kg);
  }

  // Supplier sources: distinct labs/farmers behind my inventory batches.
  const supplierLabs = new Set(items.map((i) => i.batch.certifications[0]?.lab_code).filter(Boolean));
  const farmers = await prisma.batch.findMany({
    where: { id: { in: items.map((i) => i.batch_id) } },
    select: { farmer: { select: { id: true, name: true } } },
  });
  const farmerSources = new Map();
  for (const b of farmers) {
    if (b.farmer) farmerSources.set(b.farmer.id, b.farmer.name);
  }

  // KPIs
  const availableKg = items.reduce((s, i) => s + i.available_quantity_kg, 0);
  const consumedKg = items.reduce((s, i) => s + i.consumed_quantity_kg, 0);
  const heldKg = items.reduce((s, i) => s + i.available_quantity_kg + i.reserved_quantity_kg, 0);
  const totalReceived = items.reduce((s, i) => s + i.available_quantity_kg + i.reserved_quantity_kg + i.consumed_quantity_kg + i.discarded_quantity_kg, 0);
  const procured = requests.filter((r) => r.status === "fulfilled");
  const avgProcurementHours = procured.length
    ? procured.reduce((s, r) => s + (r.decided_at ? (r.decided_at - r.requested_at) / 3600000 : 0), 0) / procured.length
    : null;

  return {
    inventory_levels_kg: { available: availableKg, reserved: items.reduce((s, i) => s + i.reserved_quantity_kg, 0), consumed: consumedKg, discarded: items.reduce((s, i) => s + i.discarded_quantity_kg, 0) },
    top_herbs,
    monthly_consumption_kg: [...monthly.entries()].map(([month, kg]) => ({ month, kg })),
    pending_deliveries: shipments.filter((s) => !["delivered", "completed", "cancelled", "failed"].includes(s.status)).length,
    supplier_labs: [...supplierLabs],
    supplier_farmers: [...farmerSources.values()],
    certified_batch_count: items.filter((i) => i.batch.certifications[0]?.status === "active").length,
    kpis: {
      consumption_rate_pct: totalReceived > 0 ? Math.round((consumedKg / totalReceived) * 1000) / 10 : 0,
      avg_procurement_hours: avgProcurementHours == null ? null : Math.round(avgProcurementHours * 10) / 10,
      batch_utilization_pct: heldKg + consumedKg > 0 ? Math.round((consumedKg / (heldKg + consumedKg)) * 1000) / 10 : 0,
      certification_success_pct: requests.length ? Math.round((requests.filter((r) => r.status === "fulfilled").length / requests.length) * 1000) / 10 : 0,
    },
  };
}

/** Recall readiness (spec §13): where a batch is, how much is left/consumed. */
async function recallStatus(user, { batch_id }) {
  const batch = await prisma.batch.findUnique({
    where: { id: batch_id },
    include: { species: { select: { code: true, common_name: true } }, certifications: { orderBy: { issued_at: "desc" }, take: 1 } },
  });
  if (!batch) throw new ApiError("not_found", "Batch not found", 404);
  const [item, receipts, requests] = await Promise.all([
    prisma.inventoryItem.findUnique({ where: { manufacturer_user_id_batch_id: { manufacturer_user_id: user.id, batch_id } } }),
    prisma.goodsReceipt.findMany({ where: { batch_id } }),
    prisma.batchRequest.findMany({ where: { batch_id } }),
  ]);
  // Product lots that consumed this batch (products phase links them).
  const productLinks = await prisma.productLotBatchLink.findMany({
    where: { batch_id },
    include: { lot: { select: { id: true, code: true, product: { select: { id: true, name: true } }, current_holder_user_id: true } } },
  });
  return {
    batch: { id: batch.id, code: batch.code, species: batch.species },
    certificate: batch.certifications[0] ? { certificate_number: batch.certifications[0].certificate_number, status: batch.certifications[0].status, expiry_date: batch.certifications[0].expiry_date } : null,
    inventory: item ? { available_kg: item.available_quantity_kg, reserved_kg: item.reserved_quantity_kg, consumed_kg: item.consumed_quantity_kg, discarded_kg: item.discarded_quantity_kg } : null,
    goods_receipts: receipts.map((r) => ({ grn_number: r.grn_number, accepted_kg: r.accepted_quantity_kg, rejected_kg: r.rejected_quantity_kg, received_at: r.received_at })),
    request_count: requests.length,
    products_affected: productLinks.map((l) => ({ lot_id: l.lot.id, lot_code: l.lot.code, product_id: l.lot.product.id, product_name: l.lot.product.name, holder_user_id: l.lot.current_holder_user_id })),
  };
}

// ------------------------------------------------------------ queries

/** Requests the manufacturer made (admin: all; lab: requests for batches it holds). */
async function listRequests(user, { status = null, limit = 50, offset = 0 } = {}) {
  const where = {};
  if (status) where.status = status;
  if (user.role === "manufacturer") {
    where.manufacturer_user_id = user.id;
  } else if (user.role === "lab") {
    where.batch = { current_holder_user_id: user.id };
  } else if (user.role !== "admin") {
    throw new ApiError("forbidden", "You cannot view procurement requests", 403);
  }
  const [requests, total] = await Promise.all([
    prisma.batchRequest.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: Math.max(parseInt(offset, 10) || 0, 0),
      take: Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100),
      include: {
        manufacturer: { select: { id: true, name: true, role: true } },
        batch: { select: { id: true, code: true, phase: true, test_status: true, current_holder_user_id: true, species: { select: { code: true, common_name: true } } } },
        allocation: true,
        shipment: { select: { id: true, shipment_no: true, status: true } },
      },
    }),
    prisma.batchRequest.count({ where }),
  ]);
  return { requests, total };
}

module.exports = {
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
  validCertificate,
  ensureBatchInventory,
  nextRequestCode,
  nextGrnCode,
};