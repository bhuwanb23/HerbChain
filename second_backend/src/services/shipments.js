/**
 * Shipment service (docs/phase_7.md + docs/logistics/architecture.md).
 *
 * The logistics layer sits ON TOP of the governed custody chain:
 *   - Shipment tracks WHERE cargo physically is + WHO carries it.
 *   - Batch/QR/TransferRequest track WHO OWNS it (phase 5/6 engines).
 *
 * Every physical handover runs through Phase 6: pickup and delivery validate
 * the shipment context (assignment, route, geofence, photo, QR) and then
 * REQUIRE an already-approved TransferRequest before executing the governed
 * hop through the QR engine. A shipment can never move custody by itself.
 *
 * Status machine (spec): requested -> assigned -> accepted ->
 *   arrived_for_pickup -> picked_up -> in_transit -> arrived_destination ->
 *   delivered -> completed; failure paths cancelled | failed | rejected.
 * TransporterAssignment: pending -> accepted | declined | cancelled.
 */
const { prisma } = require("../db/client");
const { ApiError } = require("../utils/errors");
const { env } = require("../config/env");
const {
  SHIPMENT_TYPES,
  PRIORITIES,
  SHIPMENT_STATUSES,
  FAILURE_STATUSES,
  ASSIGNMENT_OPEN_STATUSES,
  ASSIGNMENT_STATUSES,
  DOC_TYPES,
  DELAY_REASONS,
  FAIL_REASONS,
  DELIVERABLE_STATUSES,
  PICKUP_TRANSFER_TYPE,
  DELIVERY_TRANSFER_TYPE,
} = require("../constants/shipment");
const { executeTransfer, requestTransfer } = require("./transfers");
const { assertOwnedAssets } = require("./uploads");

const SHIPMENT_INCLUDE = {
  requested_by: { select: { id: true, name: true, role: true } },
  from_user: { select: { id: true, name: true, role: true } },
  to_user: { select: { id: true, name: true, role: true } },
  transporter: { select: { id: true, name: true, role: true } },
  assignments: { orderBy: { assigned_at: "desc" } },
  metric: true,
  proof: true,
};

// Roles that may raise a shipment request (destination party wants the goods).
const REQUESTER_ROLES = ["lab", "manufacturer"];

function canViewShipment(user, shipment) {
  if (user.role === "admin") return true;
  if (shipment.requested_by_user_id === user.id) return true;
  if (shipment.to_user_id === user.id) return true;
  if (shipment.from_user_id === user.id) return true;
  if (shipment.assigned_transporter_user_id === user.id) return true;
  // transporter is a party once assigned (even if declined later)
  const wasAssigned = shipment.assignments && shipment.assignments.some((a) => a.transporter_user_id === user.id);
  return Boolean(wasAssigned);
}

function assertCanActOnShipment(user, shipment) {
  if (user.role === "admin") return;
  if (!canViewShipment(user, shipment)) {
    throw new ApiError("forbidden", "You are not a party to this shipment", 403);
  }
}

async function writeTimeline(tx, shipmentId, eventType, { actorUserId = null, data = {} } = {}) {
  await tx.shipmentEvent.create({
    data: { shipment_id: shipmentId, event_type: eventType, event_data: data, created_by_user_id: actorUserId },
  });
}

async function writeAudit(tx, { actorUserId, action, shipmentId, meta = {} }) {
  await tx.auditLog.create({
    data: { actor_user_id: actorUserId, action, target_type: "shipment", target_id: shipmentId, meta_json: meta },
  });
}

async function getShipmentRow(id, includeExtra = false) {
  const include = includeExtra
    ? {
        ...SHIPMENT_INCLUDE,
        tracking: { orderBy: { captured_at: "desc" }, take: 20 },
        events: { orderBy: { created_at: "asc" } },
        pickup_events: { orderBy: { pickup_time: "asc" } },
        delivery_events: { orderBy: { delivered_at: "asc" } },
        documents: { orderBy: { created_at: "desc" } },
        failed_logs: { orderBy: { created_at: "desc" } },
      }
    : SHIPMENT_INCLUDE;
  const shipment = await prisma.shipment.findUnique({ where: { id }, include });
  if (!shipment) throw new ApiError("not_found", "Shipment not found", 404);
  return shipment;
}

/** Resolve the shipment's referenced batch (v1: batch legs only). */
async function resolveBatch(shipment) {
  if (shipment.ref_type !== "batch") {
    throw new ApiError("invalid_state", "Shipments over product lots arrive with the products phase", 409);
  }
  const batch = await prisma.batch.findUnique({ where: { id: shipment.ref_id } });
  if (!batch) throw new ApiError("not_found", "Shipment references a missing batch", 404);
  return batch;
}

/** Human code SHIP-YYYY-000001 — never the DB id (code gen inside the tx). */
async function nextShipmentCode(tx) {
  const year = new Date().getFullYear();
  const pre = `${env.SHIPMENT_CODE_PREFIX}-${year}-`;
  const count = await tx.shipment.count({ where: { shipment_no: { startsWith: pre } } });
  return `${pre}${String(count + 1).padStart(6, "0")}`;
}

// ------------------------------------------------------------------ create

/**
 * Create a shipment request (spec: lab requesting a batch / manufacturer
 * requesting a batch / admin intervention). The destination party is the
 * requester; origin = the batch's current holder snapshot.
 */
async function createShipment(user, input) {
  if (!REQUESTER_ROLES.includes(user.role) && user.role !== "admin") {
    throw new ApiError("forbidden", `A ${user.role} cannot raise a shipment request`, 403);
  }
  const shipmentType = input.shipment_type || "CUSTOM";
  if (!SHIPMENT_TYPES.includes(shipmentType)) {
    throw new ApiError("bad_request", `shipment_type must be one of: ${SHIPMENT_TYPES.join(", ")}`, 400);
  }
  if (input.priority && !PRIORITIES.includes(input.priority)) {
    throw new ApiError("bad_request", `priority must be one of: ${PRIORITIES.join(", ")}`, 400);
  }
  const refType = input.ref_type || "batch";
  if (refType !== "batch") {
    throw new ApiError("bad_request", "Phase-7 shipments move herb batches (ref_type=batch)", 400);
  }
  const batch = await prisma.batch.findUnique({ where: { id: input.ref_id } });
  if (!batch) throw new ApiError("not_found", "Batch not found", 404);

  // The requester is the destination party; origin = current holder snapshot.
  const origin = batch.current_holder_user_id;
  const toUser = user.role === "admin" && input.to_user_id ? input.to_user_id : user.id;
  const fromRole = (await prisma.user.findUnique({ where: { id: origin }, select: { role: true } })).role;
  const toRole = (await prisma.user.findUnique({ where: { id: toUser }, select: { role: true } })).role;

  // Destination GPS is required when the receiving party is a lab/manufacturer
  // (geo-fence validation at delivery). Fall back to the requester's warehouse
  // coordinates if not supplied.
  let destGps = { lat: input.destination_gps_lat ?? null, lng: input.destination_gps_lng ?? null };
  if (destGps.lat == null || destGps.lng == null) {
    const wh = await prisma.warehouse.findFirst({
      where: { owner_user_id: toUser, is_active: true },
      orderBy: { created_at: "asc" },
    });
    destGps = { lat: input.destination_gps_lat ?? wh?.gps_lat ?? null, lng: input.destination_gps_lng ?? wh?.gps_lng ?? null };
  }

  const shipment = await prisma.$transaction(async (tx) => {
    const code = await nextShipmentCode(tx);
    const row = await tx.shipment.create({
      data: {
        shipment_no: code,
        ref_type: refType,
        ref_id: batch.id,
        shipment_type: shipmentType,
        priority: input.priority || "NORMAL",
        requested_by_user_id: user.id,
        from_user_id: origin,
        from_role: fromRole,
        to_user_id: toUser,
        to_role: toRole,
        origin_location: batch.location || input.origin_location || null,
        origin_gps_lat: input.origin_gps_lat ?? batch.gps_lat ?? null,
        origin_gps_lng: input.origin_gps_lng ?? batch.gps_lng ?? null,
        destination_location: input.destination_location || null,
        destination_gps_lat: destGps.lat,
        destination_gps_lng: destGps.lng,
        geofence_radius_m: input.geofence_radius_m ?? env.SHIPMENT_FENCE_RADIUS_M,
        quantity_kg: input.quantity_kg ?? (refType === "batch" ? batch.weight_kg : null),
        status: "requested",
        scheduled_pickup_at: input.scheduled_pickup_at ? new Date(input.scheduled_pickup_at) : null,
        expected_delivery_at: input.expected_delivery_at ? new Date(input.expected_delivery_at) : null,
        notes: input.notes || null,
      },
    });
    await writeTimeline(tx, row.id, "REQUESTED", {
      actorUserId: user.id,
      data: { code, batch_code: batch.code, shipment_type: shipmentType },
    });
    await writeAudit(tx, { actorUserId: user.id, action: "SHIPMENT_REQUESTED", shipmentId: row.id, meta: { code, batch_id: batch.id, shipment_type: shipmentType } });
    return row;
  });

  return getShipmentRow(shipment.id);
}

// ------------------------------------------------------------ transporter

/**
 * Assign a transporter. Allowed for the requester (destination party) or
 * admin. Creates a PENDING assignment row + shipment -> assigned.
 */
async function assignTransporter(user, { shipment_id, transporter_user_id }) {
  const shipment = await getShipmentRow(shipment_id);
  if (shipment.status === "requested" || shipment.status === "rejected" || shipment.status === "assigned") {
    // reassignment allowed after a decline (rejected) or before acceptance
  } else {
    throw new ApiError("invalid_state", `Cannot assign a transporter while the shipment is '${shipment.status}'`, 409);
  }
  const isRequester = shipment.requested_by_user_id === user.id || shipment.to_user_id === user.id;
  if (!isRequester && user.role !== "admin") {
    throw new ApiError("forbidden", "Only the requester (or an admin) can assign a transporter", 403);
  }
  const transporter = await prisma.user.findUnique({ where: { id: transporter_user_id } });
  if (!transporter || transporter.role !== "transporter") {
    throw new ApiError("bad_request", "transporter_user_id must reference a transporter account", 400);
  }
  if (!transporter.is_active) throw new ApiError("forbidden", "That transporter account is disabled", 403);

  await prisma.$transaction(async (tx) => {
    // close any previous open assignment
    await tx.transporterAssignment.updateMany({
      where: { shipment_id, status: { in: ["pending", "accepted"] } },
      data: { status: "cancelled", decided_at: new Date() },
    });
    const assignment = await tx.transporterAssignment.create({
      data: {
        shipment_id,
        transporter_user_id,
        assigned_by_user_id: user.id,
        status: "pending",
      },
    });
    await tx.shipment.update({ where: { id: shipment_id }, data: { status: "assigned", assigned_transporter_user_id: transporter_user_id } });
    await writeTimeline(tx, shipment_id, "ASSIGNED", { actorUserId: user.id, data: { transporter_user_id } });
    await writeAudit(tx, { actorUserId: user.id, action: "SHIPMENT_ASSIGNED", shipmentId: shipment_id, meta: { transporter_user_id } });
  });
  return getShipmentRow(shipment_id);
}

/** The transporter accepts the job (assignment pending -> accepted). */
async function acceptShipment(user, { shipment_id }) {
  const shipment = await getShipmentRow(shipment_id);
  const assignment = await activeAssignment(shipment, user);
  if (shipment.status !== "assigned") {
    throw new ApiError("invalid_state", `Only an assigned shipment can be accepted (currently '${shipment.status}')`, 409);
  }

  await prisma.$transaction(async (tx) => {
    await tx.transporterAssignment.update({ where: { id: assignment.id }, data: { status: "accepted", decided_at: new Date() } });
    await tx.shipment.update({ where: { id: shipment_id }, data: { status: "accepted" } });
    await writeTimeline(tx, shipment_id, "ACCEPTED", { actorUserId: user.id, data: {} });
    await writeAudit(tx, { actorUserId: user.id, action: "SHIPMENT_ACCEPTED", shipmentId: shipment_id, meta: {} });
  });
  return getShipmentRow(shipment_id);
}

/** The transporter declines the job -> shipment returns to open for reassignment. */
async function declineShipment(user, { shipment_id, reason = null }) {
  const shipment = await getShipmentRow(shipment_id);
  const assignment = await activeAssignment(shipment, user);

  await prisma.$transaction(async (tx) => {
    await tx.transporterAssignment.update({ where: { id: assignment.id }, data: { status: "declined", decided_at: new Date(), decline_reason: reason } });
    await tx.shipment.update({
      where: { id: shipment_id },
      data: { status: "rejected", assigned_transporter_user_id: null, failure_reason: reason || "transporter declined" },
    });
    await writeTimeline(tx, shipment_id, "DECLINED", { actorUserId: user.id, data: { reason } });
    await writeAudit(tx, { actorUserId: user.id, action: "SHIPMENT_DECLINED", shipmentId: shipment_id, meta: { reason } });
  });
  return getShipmentRow(shipment_id);
}

async function activeAssignment(shipment, transporterUser) {
  const assignment = shipment.assignments.find(
    (a) => a.transporter_user_id === transporterUser.id && a.status === "pending"
  );
  if (!assignment) {
    throw new ApiError("forbidden", "You do not have a pending assignment for this shipment", 403);
  }
  return assignment;
}

/** Assigned transporter = the current assignment's transporter after accept. */
async function assertAssignedTransporter(shipment, user) {
  if (user.role === "admin") return;
  if (shipment.assigned_transporter_user_id !== user.id) {
    throw new ApiError("forbidden", "Only the assigned transporter can perform this action", 403);
  }
}

// --------------------------------------------------------------- tracking

/** Transporter reports arrival at the origin for pickup. */
async function arriveForPickup(user, { shipment_id, gps_lat, gps_lng, accuracy_m = null, remarks = null }) {
  const shipment = await getShipmentRow(shipment_id);
  await assertAssignedTransporter(shipment, user);
  if (shipment.status !== "accepted") {
    throw new ApiError("invalid_state", `Cannot arrive for pickup while '${shipment.status}'`, 409);
  }
  await prisma.$transaction(async (tx) => {
    await tx.shipment.update({ where: { id: shipment_id }, data: { status: "arrived_for_pickup" } });
    await tx.shipmentTrackingPoint.create({
      data: { shipment_id, gps_lat: gps_lat ?? 0, gps_lng: gps_lng ?? 0, accuracy_m, captured_by_user_id: user.id, note: remarks || "arrived for pickup" },
    });
    await writeTimeline(tx, shipment_id, "ARRIVED_FOR_PICKUP", { actorUserId: user.id, data: { gps_lat, gps_lng, remarks } });
  });
  return getShipmentRow(shipment_id);
}

/**
 * Pickup = the physical handover + the governed custody hop ORIGIN -> the
 * transporter. The transporter presents the holder's ACTIVE QR; the approved
 * Phase-6 TransferRequest must exist (the receiving party requested custody
 * and the current holder approved it) — the shipment refuses to move
 * otherwise. Photo + GPS are captured as logistics evidence.
 */
async function recordPickup(user, { shipment_id, token, gps_lat, gps_lng, accuracy_m = null, photo_asset_id = null, remarks = null, meta = {} }) {
  const shipment = await getShipmentRow(shipment_id);
  await assertAssignedTransporter(shipment, user);
  if (!["accepted", "arrived_for_pickup"].includes(shipment.status)) {
    throw new ApiError("invalid_state", `Pickup requires an accepted shipment (currently '${shipment.status}')`, 409);
  }
  const batch = await resolveBatch(shipment);
  const pickupType = PICKUP_TRANSFER_TYPE[batch.phase];
  if (!pickupType) {
    throw new ApiError("invalid_transition", `The batch is '${batch.phase}' — it cannot be picked up for this leg`, 409);
  }
  // The shipment type must describe this move (origin role -> transporter).
  const expectedFrom = batch.phase === "with_farmer" ? "farmer" : "lab";
  const originUser = await prisma.user.findUnique({ where: { id: batch.current_holder_user_id }, select: { role: true } });
  if (originUser.role !== expectedFrom) {
    throw new ApiError("invalid_state", `Shipment origin mismatch: batch is held by a ${originUser.role}, not a ${expectedFrom}`, 409);
  }

  // Photo evidence (optional but encouraged); asset must belong to the transporter.
  let photoUrl = null;
  if (photo_asset_id) {
    const [asset] = await assertOwnedAssets(user.id, [photo_asset_id]);
    photoUrl = asset.url;
  }

  // Two-party custody: the transporter must hold an APPROVED request from the
  // current holder. executeTransfer resolves it from the token's batch.
  const out = await executeTransfer(user, { token, meta: { ...meta, gpsLat: gps_lat, gpsLng: gps_lng, location: remarks } });

  await prisma.$transaction(async (tx) => {
    await tx.shipment.update({
      where: { id: shipment_id },
      data: { status: "picked_up", actual_pickup_at: new Date() },
    });
    await tx.pickupEvent.create({
      data: {
        shipment_id,
        transporter_user_id: user.id,
        pickup_lat: gps_lat ?? null,
        pickup_lng: gps_lng ?? null,
        accuracy_m,
        photo_url: photoUrl,
        photo_asset_id,
        remarks: remarks || null,
      },
    });
    await tx.shipmentTrackingPoint.create({
      data: {
        shipment_id,
        gps_lat: gps_lat ?? (shipment.origin_gps_lat ?? 0),
        gps_lng: gps_lng ?? (shipment.origin_gps_lng ?? 0),
        accuracy_m,
        captured_by_user_id: user.id,
        note: "pickup",
      },
    });
    await writeTimeline(tx, shipment_id, "PICKED_UP", { actorUserId: user.id, data: { qr_version: out.new_version, gps_lat, gps_lng } });
    await writeAudit(tx, { actorUserId: user.id, action: "SHIPMENT_PICKED_UP", shipmentId: shipment_id, meta: { batch_id: batch.id, qr_version: out.new_version } });
  });
  return getShipmentRow(shipment_id);
}

/** Offline-safe GPS breadcrumb: driver app syncs buffered points whenever online. */
async function addTrackingPoint(user, { shipment_id, gps_lat, gps_lng, speed_kph = null, accuracy_m = null, captured_at = null, note = null }) {
  const shipment = await getShipmentRow(shipment_id);
  await assertAssignedTransporter(shipment, user);
  if (!["picked_up", "in_transit", "arrived_destination", "arrived_for_pickup", "accepted"].includes(shipment.status)) {
    throw new ApiError("invalid_state", `Cannot record GPS while the shipment is '${shipment.status}'`, 409);
  }
  // First breadcrumb after pickup = the move has started.
  const nextStatus = shipment.status === "picked_up" ? "in_transit" : shipment.status;
  await prisma.$transaction(async (tx) => {
    if (nextStatus !== shipment.status) {
      await tx.shipment.update({ where: { id: shipment_id }, data: { status: nextStatus } });
      await writeTimeline(tx, shipment_id, "STARTED", { actorUserId: user.id, data: { gps_lat, gps_lng } });
    }
    await tx.shipmentTrackingPoint.create({
      data: { shipment_id, gps_lat, gps_lng, speed_kph, accuracy_m, captured_at: captured_at ? new Date(captured_at) : new Date(), captured_by_user_id: user.id, note },
    });
    await writeTimeline(tx, shipment_id, "GPS_UPDATED", { actorUserId: user.id, data: { gps_lat, gps_lng, speed_kph } });
  });
  return getShipmentRow(shipment_id);
}

/** Transporter records a delay with a reason (spec Delay Tracking). */
async function recordDelay(user, { shipment_id, reason, minutes = null, remarks = null }) {
  if (!DELAY_REASONS.includes(reason)) {
    throw new ApiError("bad_request", `reason must be one of: ${DELAY_REASONS.join(", ")}`, 400);
  }
  const shipment = await getShipmentRow(shipment_id);
  await assertAssignedTransporter(shipment, user);
  await prisma.$transaction(async (tx) => {
    await writeTimeline(tx, shipment_id, "DELAYED", { actorUserId: user.id, data: { reason, minutes, remarks } });
    await writeAudit(tx, { actorUserId: user.id, action: "SHIPMENT_DELAYED", shipmentId: shipment_id, meta: { reason, minutes } });
  });
  return getShipmentRow(shipment_id);
}

/** Transporter arrives at the destination (pre-delivery marker). */
async function arriveDestination(user, { shipment_id, gps_lat, gps_lng, accuracy_m = null, remarks = null }) {
  const shipment = await getShipmentRow(shipment_id);
  await assertAssignedTransporter(shipment, user);
  if (!["picked_up", "in_transit"].includes(shipment.status)) {
    throw new ApiError("invalid_state", `Cannot arrive at destination while '${shipment.status}'`, 409);
  }
  await prisma.$transaction(async (tx) => {
    await tx.shipment.update({ where: { id: shipment_id }, data: { status: "arrived_destination", arrived_destination_at: new Date() } });
    await tx.shipmentTrackingPoint.create({
      data: { shipment_id, gps_lat: gps_lat ?? 0, gps_lng: gps_lng ?? 0, accuracy_m, captured_by_user_id: user.id, note: remarks || "arrived at destination" },
    });
    await writeTimeline(tx, shipment_id, "ARRIVED_DESTINATION", { actorUserId: user.id, data: { gps_lat, gps_lng, remarks } });
  });
  return getShipmentRow(shipment_id);
}

// ----------------------------------------------------------------- deliver

/**
 * Geo-fence check (spec Geo-Fencing): the delivery scan must be inside the
 * destination fence. Haversine distance vs shipment destination GPS.
 */
function haversineM(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Delivery = receiver confirms arrival + the governed custody hop
 * TRANSPORTER -> the destination party. The receiver scans the transporter's
 * ACTIVE QR inside the destination geofence; the approved Phase-6 request
 * must exist. POD + metrics are recorded at completion.
 */
async function deliverShipment(user, { shipment_id, token, gps_lat, gps_lng, accuracy_m = null, receiver_name = null, receiver_signature = null, delivery_photo_asset_id = null, remarks = null, meta = {} }) {
  const shipment = await getShipmentRow(shipment_id);
  // Who confirms delivery? The destination party (the requester) scans the QR.
  const isDestination = shipment.to_user_id === user.id;
  if (!isDestination && user.role !== "admin") {
    throw new ApiError("forbidden", "Only the destination party can confirm delivery", 403);
  }
  if (!DELIVERABLE_STATUSES.includes(shipment.status)) {
    throw new ApiError("invalid_state", `Delivery requires an in-transit shipment (currently '${shipment.status}')`, 409);
  }
  const batch = await resolveBatch(shipment);
  const deliveryType = DELIVERY_TRANSFER_TYPE[batch.phase];
  if (!deliveryType) {
    throw new ApiError("invalid_transition", `The batch is '${batch.phase}' — it cannot be delivered on this leg`, 409);
  }

  // Geo-fence: must be inside the destination radius (unless admin override).
  if (gps_lat != null && gps_lng != null && shipment.destination_gps_lat != null && shipment.destination_gps_lng != null && user.role !== "admin") {
    const dist = haversineM(gps_lat, gps_lng, shipment.destination_gps_lat, shipment.destination_gps_lng);
    const radius = shipment.geofence_radius_m ?? env.SHIPMENT_FENCE_RADIUS_M;
    if (dist > radius) {
      throw new ApiError("geofence_violation", `Delivery GPS is ${Math.round(dist)}m from the destination (fence ${radius}m)`, 409);
    }
  }

  // Photo evidence (optional); asset must belong to the receiver.
  let photoUrl = null;
  if (delivery_photo_asset_id) {
    const [asset] = await assertOwnedAssets(user.id, [delivery_photo_asset_id]);
    photoUrl = asset.url;
  }

  // Two-party governed hop: transporter -> destination (approved request).
  const out = await executeTransfer(user, { token, meta: { ...meta, gpsLat: gps_lat, gpsLng: gps_lng, location: remarks } });

  const deliveredAt = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.shipment.update({
      where: { id: shipment_id },
      data: { status: "delivered", delivered_at: deliveredAt },
    });
    await tx.deliveryEvent.create({
      data: {
        shipment_id,
        receiver_user_id: user.id,
        receiver_role: user.role,
        delivery_lat: gps_lat ?? null,
        delivery_lng: gps_lng ?? null,
        accuracy_m,
        remarks: remarks || null,
      },
    });
    await tx.proofOfDelivery.upsert({
      where: { shipment_id },
      update: {
        receiver_name: receiver_name ?? undefined,
        receiver_signature: receiver_signature ?? undefined,
        delivery_photo_url: photoUrl ?? undefined,
        remarks: remarks ?? undefined,
        uploaded_by_user_id: user.id,
      },
      create: {
        shipment_id,
        receiver_name: receiver_name || null,
        receiver_signature: receiver_signature || null,
        delivery_photo_url: photoUrl || null,
        remarks: remarks || null,
        uploaded_by_user_id: user.id,
      },
    });
    await writeTimeline(tx, shipment_id, "DELIVERED", { actorUserId: user.id, data: { qr_version: out.new_version, gps_lat, gps_lng } });
    await writeAudit(tx, { actorUserId: user.id, action: "SHIPMENT_DELIVERED", shipmentId: shipment_id, meta: { batch_id: batch.id, qr_version: out.new_version } });
  });
  return completeShipment(user, { shipment_id });
}

/** Close the shipment: status completed + delay metrics (expected vs actual). */
async function completeShipment(user, { shipment_id }) {
  const shipment = await getShipmentRow(shipment_id);
  if (shipment.status !== "delivered") {
    throw new ApiError("invalid_state", `Only a delivered shipment can be completed (currently '${shipment.status}')`, 409);
  }
  const now = new Date();
  let expectedHours = null;
  let actualHours = null;
  let delayMinutes = null;
  let delayReason = null;

  if (shipment.scheduled_pickup_at && shipment.expected_delivery_at) {
    expectedHours = (shipment.expected_delivery_at - shipment.scheduled_pickup_at) / 3600000;
  }
  if (shipment.actual_pickup_at && shipment.delivered_at) {
    actualHours = (shipment.delivered_at - shipment.actual_pickup_at) / 3600000;
  }
  if (expectedHours != null && actualHours != null && actualHours > expectedHours) {
    delayMinutes = Math.round((actualHours - expectedHours) * 60);
  }
  const delayEvent = await prisma.shipmentEvent.findFirst({
    where: { shipment_id, event_type: "DELAYED" },
    orderBy: { created_at: "desc" },
  });
  delayReason = delayEvent?.event_data?.reason || null;

  await prisma.$transaction(async (tx) => {
    await tx.shipment.update({ where: { id: shipment_id }, data: { status: "completed" } });
    await tx.shipmentMetric.upsert({
      where: { shipment_id },
      update: { expected_hours: expectedHours, actual_hours: actualHours, delay_minutes: delayMinutes, delay_reason: delayReason, computed_at: now },
      create: { shipment_id, expected_hours: expectedHours, actual_hours: actualHours, delay_minutes: delayMinutes, delay_reason: delayReason },
    });
    await writeTimeline(tx, shipment_id, "COMPLETED", { actorUserId: user.id, data: { expected_hours: expectedHours, actual_hours: actualHours, delay_minutes: delayMinutes } });
    await writeAudit(tx, { actorUserId: user.id, action: "SHIPMENT_COMPLETED", shipmentId: shipment_id, meta: { expected_hours: expectedHours, actual_hours: actualHours, delay_minutes: delayMinutes } });
  });
  return getShipmentRow(shipment_id);
}

// ------------------------------------------------------------- documents

async function attachDocument(user, { shipment_id, document_type, document_asset_id, document_url = null }) {
  if (!DOC_TYPES.includes(document_type)) {
    throw new ApiError("bad_request", `document_type must be one of: ${DOC_TYPES.join(", ")}`, 400);
  }
  const shipment = await getShipmentRow(shipment_id);
  assertCanActOnShipment(user, shipment);
  let url = document_url;
  if (document_asset_id) {
    const [asset] = await assertOwnedAssets(user.id, [document_asset_id]);
    url = asset.url;
  }
  if (!url) throw new ApiError("bad_request", "document_asset_id or document_url is required", 400);

  const doc = await prisma.$transaction(async (tx) => {
    const row = await tx.shipmentDocument.create({
      data: { shipment_id, document_type, document_url: url, document_asset_id, uploaded_by_user_id: user.id },
    });
    await writeTimeline(tx, shipment_id, "DOCUMENT_ADDED", { actorUserId: user.id, data: { document_type, document_id: row.id } });
    return row;
  });
  return doc;
}

async function attachPod(user, { shipment_id, receiver_name = null, receiver_signature = null, receiver_photo_asset_id = null, remarks = null }) {
  const shipment = await getShipmentRow(shipment_id);
  assertCanActOnShipment(user, shipment);
  if (!["delivered", "completed"].includes(shipment.status)) {
    throw new ApiError("invalid_state", `POD can only be attached to a delivered/completed shipment (currently '${shipment.status}')`, 409);
  }
  let photoUrl = null;
  if (receiver_photo_asset_id) {
    const [asset] = await assertOwnedAssets(user.id, [receiver_photo_asset_id]);
    photoUrl = asset.url;
  }
  const pod = await prisma.$transaction(async (tx) => {
    const row = await tx.proofOfDelivery.upsert({
      where: { shipment_id },
      update: {
        receiver_name: receiver_name ?? undefined,
        receiver_signature: receiver_signature ?? undefined,
        receiver_photo_url: photoUrl ?? undefined,
        remarks: remarks ?? undefined,
        uploaded_by_user_id: user.id,
      },
      create: {
        shipment_id,
        receiver_name: receiver_name || null,
        receiver_signature: receiver_signature || null,
        receiver_photo_url: photoUrl || null,
        remarks: remarks || null,
        uploaded_by_user_id: user.id,
      },
    });
    await writeTimeline(tx, shipment_id, "POD_UPLOADED", { actorUserId: user.id, data: { has_photo: Boolean(photoUrl) } });
    return row;
  });
  return pod;
}

// ------------------------------------------------------------ failure paths

async function failShipment(user, { shipment_id, reason, remarks = null, photo_asset_id = null }) {
  if (!FAIL_REASONS.includes(reason)) {
    throw new ApiError("bad_request", `reason must be one of: ${FAIL_REASONS.join(", ")}`, 400);
  }
  const shipment = await getShipmentRow(shipment_id);
  assertCanActOnShipment(user, shipment);
  if (["completed", "delivered", "failed", "cancelled"].includes(shipment.status)) {
    throw new ApiError("invalid_state", `Cannot fail a '${shipment.status}' shipment`, 409);
  }
  let photoUrl = null;
  if (photo_asset_id) {
    const [asset] = await assertOwnedAssets(user.id, [photo_asset_id]);
    photoUrl = asset.url;
  }
  await prisma.$transaction(async (tx) => {
    await tx.shipment.update({ where: { id: shipment_id }, data: { status: "failed", failure_reason: remarks || reason } });
    await tx.failedDeliveryLog.create({
      data: { shipment_id, reason, photo_url: photoUrl, photo_asset_id, remarks, created_by_user_id: user.id },
    });
    await writeTimeline(tx, shipment_id, "FAILED", { actorUserId: user.id, data: { reason, remarks } });
    await writeAudit(tx, { actorUserId: user.id, action: "SHIPMENT_FAILED", shipmentId: shipment_id, meta: { reason, remarks } });
  });
  return getShipmentRow(shipment_id);
}

async function cancelShipment(user, { shipment_id, reason = null }) {
  const shipment = await getShipmentRow(shipment_id);
  const canCancel =
    shipment.requested_by_user_id === user.id ||
    shipment.from_user_id === user.id ||
    shipment.to_user_id === user.id ||
    user.role === "admin";
  if (!canCancel) throw new ApiError("forbidden", "Only the requester, origin, destination (or an admin) can cancel", 403);
  if (["picked_up", "in_transit", "arrived_destination", "delivered", "completed", "failed", "cancelled"].includes(shipment.status)) {
    throw new ApiError("invalid_state", `A '${shipment.status}' shipment cannot be cancelled`, 409);
  }
  await prisma.$transaction(async (tx) => {
    await tx.shipment.update({ where: { id: shipment_id }, data: { status: "cancelled", failure_reason: reason || "cancelled" } });
    await writeTimeline(tx, shipment_id, "CANCELLED", { actorUserId: user.id, data: { reason } });
    await writeAudit(tx, { actorUserId: user.id, action: "SHIPMENT_CANCELLED", shipmentId: shipment_id, meta: { reason } });
  });
  return getShipmentRow(shipment_id);
}

// ---------------------------------------------------------------- queries

async function listShipments(user, { status = null, role = null, limit = 50, offset = 0 } = {}) {
  const where = {};
  if (status) where.status = status;
  if (user.role !== "admin") {
    if (user.role === "transporter") {
      where.assigned_transporter_user_id = user.id;
    } else if (role === "incoming") {
      where.to_user_id = user.id;
    } else if (role === "outgoing") {
      where.from_user_id = user.id;
    } else {
      where.OR = [{ requested_by_user_id: user.id }, { from_user_id: user.id }, { to_user_id: user.id }, { assigned_transporter_user_id: user.id }];
    }
  }
  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: Math.max(parseInt(offset, 10) || 0, 0),
      take: Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100),
      include: SHIPMENT_INCLUDE,
    }),
    prisma.shipment.count({ where }),
  ]);
  return { shipments, total };
}

async function shipmentTimeline(shipmentId) {
  const shipment = await getShipmentRow(shipmentId);
  return prisma.shipmentEvent.findMany({
    where: { shipment_id: shipment.id },
    orderBy: { created_at: "asc" },
    include: { shipment: false },
  });
}

async function getShipmentTimeline(shipmentId) {
  return prisma.shipmentEvent.findMany({ where: { shipment_id: shipmentId }, orderBy: { created_at: "asc" } });
}

module.exports = {
  createShipment,
  assignTransporter,
  acceptShipment,
  declineShipment,
  arriveForPickup,
  recordPickup,
  addTrackingPoint,
  recordDelay,
  arriveDestination,
  deliverShipment,
  attachDocument,
  attachPod,
  failShipment,
  cancelShipment,
  listShipments,
  getShipmentRow,
  canViewShipment,
  shipmentTimeline,
  getShipmentTimeline,
  haversineM,
  nextShipmentCode,
};
