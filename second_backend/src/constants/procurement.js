/**
 * Manufacturer procurement constants (docs/phase_9.md +
 * docs/procurement/architecture.md).
 *
 * Phase 9 = certified batches become manufacturing inventory. Only batches
 * with test_status=certified AND a valid (non-expired, active) certificate
 * are procurable. Request -> holder approves (full/partial) -> allocation
 * RESERVED -> shipment auto-created -> governed delivery -> GRN -> inventory.
 */

// Request lifecycle (spec request_batches statuses).
const REQUEST_STATUSES = [
  "pending", // opened by the manufacturer
  "approved", // holder approved the full requested qty
  "partially_approved", // holder approved less than requested
  "rejected", // holder refused
  "fulfilled", // goods receipt accepted qty >= approved
  "cancelled", // manufacturer / holder cancelled before fulfillment
];

// Allocation lifecycle (spec inventory_allocations statuses).
const ALLOCATION_STATUSES = [
  "reserved", // qty locked at approval (anti-oversell)
  "fulfilled", // GRN accepted -> qty consumed from the batch pool
  "cancelled", // qty released back to available before delivery
];

// Inventory transaction types (spec §10) — inventory NEVER updates directly.
const TX_TYPES = [
  "received", // GRN accepted into stock
  "reserved", // locked for a production run
  "released", // reservation cancelled -> back to available
  "consumed", // used in production
  "adjusted", // recount / correction
  "discarded", // spoiled / damaged / destroyed
];

// Quality hold lifecycle (spec §12).
const HOLD_STATUSES = ["active", "resolved"];

/** Derived wire state of an inventory item (spec Inventory States). */
function inventoryState(item) {
  const { available_quantity_kg: a, reserved_quantity_kg: r, consumed_quantity_kg: c, discarded_quantity_kg: d } = item;
  if (d > 0 && a === 0 && r === 0 && c === 0) return "DISCARDED";
  if (c > 0 && a === 0 && r === 0) return "CONSUMED";
  if (r > 0 && c > 0) return "IN_PRODUCTION";
  if (r > 0) return "RESERVED";
  if (a > 0) return "AVAILABLE";
  return "EMPTY";
}

module.exports = {
  REQUEST_STATUSES,
  ALLOCATION_STATUSES,
  TX_TYPES,
  HOLD_STATUSES,
  inventoryState,
};