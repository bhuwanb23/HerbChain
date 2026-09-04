/**
 * Shipment & logistics API — Phase 7 (docs/phase_7.md).
 *
 * Ownership and shipment stay separate (spec Core Philosophy): every pickup /
 * delivery endpoint validates the logistics context (assignment, route,
 * geofence, photo) and then REQUIRES an already-approved two-party Phase-6
 * TransferRequest before running the governed custody hop through the QR
 * engine. A shipment can never move ownership by itself.
 *
 *   POST /api/v1/shipments              create a shipment request (lab /
 *                                       manufacturer / admin)
 *   GET  /api/v1/shipments              my shipments (admin: all) + filters
 *   GET  /api/v1/shipments/:id          detail + route + timeline
 *   GET  /api/v1/shipments/:id/timeline append-only event log
 *   POST /api/v1/shipments/:id/assign   requester/admin assigns a transporter
 *   POST /api/v1/shipments/:id/accept   transporter accepts the job
 *   POST /api/v1/shipments/:id/decline  transporter declines -> re-open
 *   POST /api/v1/shipments/:id/arrive   transporter arrives at origin
 *   POST /api/v1/shipments/:id/pickup   pickup = governed hop ORIGIN ->
 *                                       transporter (approved request + QR)
 *   POST /api/v1/shipments/:id/location GPS breadcrumb (offline-safe sync)
 *   POST /api/v1/shipments/:id/delay    reason + optional minutes
 *   POST /api/v1/shipments/:id/arrive-destination  arrived at destination
 *   POST /api/v1/shipments/:id/deliver  delivery = governed hop TRANSPORTER ->
 *                                       destination party inside the geofence
 *   POST /api/v1/shipments/:id/pod      proof-of-delivery (after delivered)
 *   POST /api/v1/shipments/:id/documents attach invoice / lab request / cert
 *   POST /api/v1/shipments/:id/fail     failure path (receiver/qc/damage)
 *   POST /api/v1/shipments/:id/cancel   pre-pickup cancellation
 */
const express = require("express");
const { z } = require("zod");
const { ok, error } = require("../../utils/responses");
const { requireAuth } = require("../../middleware/auth");
const { prisma } = require("../../db/client");
const { ApiError } = require("../../utils/errors");
const {
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
} = require("../../services/shipments");
const { serializeShipment, serializeShipmentEvent, serializePod } = require("./shipmentsSerializer");

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const lat = z.coerce.number().min(-90).max(90).optional();
const lng = z.coerce.number().min(-180).max(180).optional();
const optStr = (max) => z.string().trim().max(max).optional().nullable();

const createSchema = z.object({
  ref_type: z.string().optional().default("batch"),
  ref_id: z.string().min(1),
  shipment_type: z.string().trim().max(40).optional(),
  priority: z.string().trim().max(10).optional(),
  to_user_id: z.string().min(1).optional(), // admin-created shipments only
  origin_location: optStr(300),
  origin_gps_lat: lat,
  origin_gps_lng: lng,
  destination_location: optStr(300),
  destination_gps_lat: lat,
  destination_gps_lng: lng,
  geofence_radius_m: z.coerce.number().positive().optional(),
  quantity_kg: z.coerce.number().positive().optional(),
  scheduled_pickup_at: z.string().datetime().optional(),
  expected_delivery_at: z.string().datetime().optional(),
  notes: optStr(2000),
});

const assignSchema = z.object({ transporter_user_id: z.string().min(1) });
const reasonSchema = z.object({ reason: optStr(500) });
const gpsSchema = z.object({
  gps_lat: z.coerce.number().min(-90).max(90).optional().nullable(),
  gps_lng: z.coerce.number().min(-180).max(180).optional().nullable(),
  accuracy_m: z.coerce.number().nonnegative().optional().nullable(),
  remarks: optStr(1000),
});
const delaySchema = z.object({
  reason: z.string().trim().min(1),
  minutes: z.coerce.number().int().nonnegative().optional().nullable(),
  remarks: optStr(1000),
});
const trackingSchema = z.object({
  gps_lat: z.coerce.number().min(-90).max(90),
  gps_lng: z.coerce.number().min(-180).max(180),
  speed_kph: z.coerce.number().nonnegative().optional().nullable(),
  accuracy_m: z.coerce.number().nonnegative().optional().nullable(),
  captured_at: z.string().datetime().optional().nullable(),
  note: optStr(300),
});
const pickupSchema = gpsSchema.extend({
  token: z.string().min(10, "token looks truncated"),
  photo_asset_id: z.string().min(1).optional().nullable(),
  location: optStr(300),
});
const deliverSchema = gpsSchema.extend({
  token: z.string().min(10, "token looks truncated"),
  receiver_name: optStr(200),
  receiver_signature: optStr(1000),
  delivery_photo_asset_id: z.string().min(1).optional().nullable(),
  location: optStr(300),
});
const failSchema = z.object({
  reason: z.string().trim().min(1),
  remarks: optStr(1000),
  photo_asset_id: z.string().min(1).optional().nullable(),
});
const docSchema = z.object({
  document_type: z.string().trim().min(1),
  document_asset_id: z.string().min(1).optional().nullable(),
  document_url: optStr(1000),
});
const podSchema = z.object({
  receiver_name: optStr(200),
  receiver_signature: optStr(1000),
  receiver_photo_asset_id: z.string().min(1).optional().nullable(),
  remarks: optStr(2000),
});

function mountShipmentRoutes(app) {
  const router = express.Router();

  // ------------------------------------------------------------ create
  router.post(
    "/",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = createSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return error(res, "validation_error", "ref_id is required (shipment_type/priority/dates optional)", 400);
      }
      const shipment = await createShipment(req.user, parsed.data);
      return ok(res, { shipment: serializeShipment(shipment) }, 201);
    })
  );

  // -------------------------------------------------------------- list
  router.get(
    "/",
    requireAuth,
    wrap(async (req, res) => {
      const { status = null, role = null, limit, offset } = req.query;
      const { shipments, total } = await listShipments(req.user, { status, role, limit, offset });
      return ok(res, { shipments: shipments.map((s) => serializeShipment(s)), total });
    })
  );

  // ------------------------------------------------------------- detail
  router.get(
    "/:id",
    requireAuth,
    wrap(async (req, res) => {
      const shipment = await getShipmentRow(req.params.id, true);
      if (!canViewShipment(req.user, shipment)) {
        throw new ApiError("forbidden", "You are not a party to this shipment", 403);
      }
      const batch = shipment.ref_type === "batch"
        ? await prisma.batch.findUnique({
            where: { id: shipment.ref_id },
            select: { id: true, code: true, phase: true, test_status: true, species: true, current_holder_user_id: true },
          })
        : null;
      return ok(res, { shipment: serializeShipment(shipment, { batch }) });
    })
  );

  // ----------------------------------------------------------- timeline
  router.get(
    "/:id/timeline",
    requireAuth,
    wrap(async (req, res) => {
      const shipment = await getShipmentRow(req.params.id);
      if (!canViewShipment(req.user, shipment)) {
        throw new ApiError("forbidden", "You are not a party to this shipment", 403);
      }
      const timeline = await shipmentTimeline(shipment.id);
      return ok(res, { shipment_id: shipment.id, timeline: timeline.map(serializeShipmentEvent) });
    })
  );

  // ------------------------------------------------------------- assign
  router.post(
    "/:id/assign",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = assignSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "transporter_user_id is required", 400);
      const shipment = await assignTransporter(req.user, { shipment_id: req.params.id, ...parsed.data });
      return ok(res, { shipment: serializeShipment(shipment) });
    })
  );

  // ------------------------------------------------------------- accept
  router.post(
    "/:id/accept",
    requireAuth,
    wrap(async (req, res) => {
      const shipment = await acceptShipment(req.user, { shipment_id: req.params.id });
      return ok(res, { shipment: serializeShipment(shipment) });
    })
  );

  // ------------------------------------------------------------ decline
  router.post(
    "/:id/decline",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = reasonSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "Invalid payload", 400);
      const shipment = await declineShipment(req.user, { shipment_id: req.params.id, ...parsed.data });
      return ok(res, { shipment: serializeShipment(shipment) });
    })
  );

  // -------------------------------------------------------------- arrive
  router.post(
    "/:id/arrive",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = gpsSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "Invalid payload", 400);
      const shipment = await arriveForPickup(req.user, { shipment_id: req.params.id, ...parsed.data });
      return ok(res, { shipment: serializeShipment(shipment) });
    })
  );

  // -------------------------------------------------------------- pickup
  router.post(
    "/:id/pickup",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = pickupSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "token is required (gps/photo optional)", 400);
      const shipment = await recordPickup(req.user, { shipment_id: req.params.id, ...parsed.data });
      return ok(res, { shipment: serializeShipment(shipment) });
    })
  );

  // ------------------------------------------------------------ location
  router.post(
    "/:id/location",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = trackingSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "gps_lat and gps_lng are required", 400);
      const shipment = await addTrackingPoint(req.user, { shipment_id: req.params.id, ...parsed.data });
      return ok(res, { shipment: serializeShipment(shipment) });
    })
  );

  // --------------------------------------------------------------- delay
  router.post(
    "/:id/delay",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = delaySchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "reason is required", 400);
      const shipment = await recordDelay(req.user, { shipment_id: req.params.id, ...parsed.data });
      return ok(res, { shipment: serializeShipment(shipment) });
    })
  );

  // -------------------------------------------------- arrive-destination
  router.post(
    "/:id/arrive-destination",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = gpsSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "Invalid payload", 400);
      const shipment = await arriveDestination(req.user, { shipment_id: req.params.id, ...parsed.data });
      return ok(res, { shipment: serializeShipment(shipment) });
    })
  );

  // ------------------------------------------------------------- deliver
  router.post(
    "/:id/deliver",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = deliverSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "token is required (gps/photo optional)", 400);
      const shipment = await deliverShipment(req.user, { shipment_id: req.params.id, ...parsed.data });
      return ok(res, { shipment: serializeShipment(shipment) });
    })
  );

  // ---------------------------------------------------------------- pod
  router.post(
    "/:id/pod",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = podSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "Invalid payload", 400);
      const pod = await attachPod(req.user, { shipment_id: req.params.id, ...parsed.data });
      return ok(res, { pod: serializePod(pod) }, 201);
    })
  );

  // ---------------------------------------------------------- documents
  router.post(
    "/:id/documents",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = docSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "document_type and a url/asset are required", 400);
      const doc = await attachDocument(req.user, { shipment_id: req.params.id, ...parsed.data });
      return ok(res, { document: { id: doc.id, document_type: doc.document_type, document_url: doc.document_url, created_at: doc.created_at } }, 201);
    })
  );

  // --------------------------------------------------------------- fail
  router.post(
    "/:id/fail",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = failSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "reason is required", 400);
      const shipment = await failShipment(req.user, { shipment_id: req.params.id, ...parsed.data });
      return ok(res, { shipment: serializeShipment(shipment) });
    })
  );

  // ------------------------------------------------------------- cancel
  router.post(
    "/:id/cancel",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = reasonSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "Invalid payload", 400);
      const shipment = await cancelShipment(req.user, { shipment_id: req.params.id, ...parsed.data });
      return ok(res, { shipment: serializeShipment(shipment) });
    })
  );

  app.use("/api/v1/shipments", router);
}

module.exports = { mountShipmentRoutes };
