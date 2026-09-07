/**
 * Shipment & logistics constants (docs/phase_7.md + docs/logistics/architecture.md).
 *
 * Spec lifecycle: requested -> assigned -> accepted -> arrived_for_pickup ->
 * picked_up -> in_transit -> arrived_destination -> delivered -> completed.
 * Failure paths: cancelled | failed | rejected.
 */
const SHIPMENT_TYPES = ["FARM_TO_LAB", "LAB_TO_MANUFACTURER", "MANUFACTURER_TO_WAREHOUSE", "CUSTOM"];
const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"];

const SHIPMENT_STATUSES = [
  "requested",
  "assigned",
  "accepted",
  "arrived_for_pickup",
  "picked_up",
  "in_transit",
  "arrived_destination",
  "delivered",
  "completed",
];

const FAILURE_STATUSES = ["cancelled", "failed", "rejected"];

/** Statuses where a transporter assignment can still be (re)decided. */
const ASSIGNMENT_OPEN_STATUSES = ["requested", "assigned", "rejected"];

const ASSIGNMENT_STATUSES = ["pending", "accepted", "declined", "cancelled"];

/** Timeline event codes (spec Shipment Timeline Engine). */
const EVENT_TYPES = [
  "REQUESTED",
  "ASSIGNED",
  "ACCEPTED",
  "DECLINED",
  "ARRIVED_FOR_PICKUP",
  "PICKED_UP",
  "STARTED",
  "STOPPED",
  "DELAYED",
  "ARRIVED_DESTINATION",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "FAILED",
  "REJECTED",
  "POD_UPLOADED",
  "DOCUMENT_ADDED",
  "GPS_UPDATED",
];

const DOC_TYPES = ["invoice", "lab_request", "transfer_document", "certificate", "other"];

const DELAY_REASONS = ["weather", "traffic", "vehicle_issue", "route_issue", "manual_delay"];

const FAIL_REASONS = ["receiver_unavailable", "wrong_batch", "qc_issue", "damaged", "other"];

/** Which statuses may be delivered (in-transit legs; arrival markers optional). */
const DELIVERABLE_STATUSES = ["picked_up", "in_transit", "arrived_destination"];

/**
 * Shipment leg code for the governed custody hop that a pickup must perform
 * (the ORIGIN holder hands to the assigned transporter). Mirrors the
 * batch-phase matrix: batch at the origin phase, transporter takes custody.
 */
const PICKUP_TRANSFER_TYPE = {
  // batch currently with the farmer/lab; a transporter picks up -> the
  // governed hop is FARMER_TO_TRANSPORTER / LAB_TO_TRANSPORTER.
  with_farmer: "FARMER_TO_TRANSPORTER",
  at_lab: "LAB_TO_TRANSPORTER",
  in_transit_to_lab: null, // cannot "pick up" cargo that already moved
  in_transit_to_manufacturer: null,
  with_manufacturer: null,
  consumed: null,
};

/** Delivery hop: the transporter (current holder in transit) hands to the destination party. */
const DELIVERY_TRANSFER_TYPE = {
  in_transit_to_lab: "TRANSPORTER_TO_LAB",
  in_transit_to_manufacturer: "TRANSPORTER_TO_MANUFACTURER",
  at_lab: "LAB_TO_MANUFACTURER", // manufacturer self-collect from the lab
  with_farmer: "FARMER_TO_LAB", // lab self-collect from the farm gate
};

module.exports = {
  SHIPMENT_TYPES,
  PRIORITIES,
  SHIPMENT_STATUSES,
  FAILURE_STATUSES,
  ASSIGNMENT_OPEN_STATUSES,
  ASSIGNMENT_STATUSES,
  EVENT_TYPES,
  DOC_TYPES,
  DELAY_REASONS,
  FAIL_REASONS,
  DELIVERABLE_STATUSES,
  PICKUP_TRANSFER_TYPE,
  DELIVERY_TRANSFER_TYPE,
};
