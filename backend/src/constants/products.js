/**
 * Products & manufacturing constants (docs/phase_10.md +
 * docs/products/architecture.md).
 *
 * Phase 10 = the batch-to-product lineage engine. A `Product` is the master
 * record; every manufacturing event is a `ManufacturingBatch` (production
 * run, MFG-…) that reserves/consumes manufacturer inventory and, when it
 * COMPLETES, emits one finished `ProductLot` (PRD-…) carrying the permanent
 * product QR. Composition lives on `ManufacturingBatchIngredient`.
 */

// Product master lifecycle (spec §2).
const PRODUCT_STATUSES = [
  "draft", // created but not yet sellable
  "active", // published / sellable
  "discontinued", // retired from sale
  "recalled", // terminal — set by recall/impact flow
];

// Product categories (open vocabulary, validated against this list).
const PRODUCT_CATEGORIES = ["capsule", "tablet", "churna", "powder", "oil", "syrup", "other"];

// Manufacturing run lifecycle (spec §1): planned -> in_progress ->
// completed | cancelled.
const RUN_STATUSES = [
  "planned", // created, ingredients RESERVED from inventory
  "in_progress", // production started (production_date set)
  "completed", // consumed ingredients + finished lot emitted + lineage stored
  "cancelled", // never consumed — reservations released
];

// Ingredient lifecycle — mirrors the inventory reservation it rides on.
// state: reserved (run planned) -> consumed (run completed) | released
// (run cancelled).
const INGREDIENT_STATES = ["reserved", "consumed", "released"];

// ProductLot distribution custody machine (Phase 11+, schema comment). Phase
// 10 only ever sets with_manufacturer at lot creation.
const LOT_PHASES = [
  "with_manufacturer",
  "in_transit_to_distributor",
  "with_distributor",
  "in_transit_to_retailer",
  "with_retailer",
  "sold",
];

// Permanent product QR lifecycle — unlike the batch ownership QR it never
// rotates; minted once at lot creation, revoked only via recall/QA.
const PRODUCT_QR_STATUSES = ["active", "revoked"];

// Why a herb batch is flagged (spec §10 recall management).
const IMPACT_TYPES = ["certificate_revoked", "contamination", "quality_hold", "regulatory"];

const AFFECTED_STATUSES = ["open", "resolved"];

/** Wire label helpers for statuses. */
function statusLabel(kind, value) {
  if (!value) return null;
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

module.exports = {
  PRODUCT_STATUSES,
  PRODUCT_CATEGORIES,
  RUN_STATUSES,
  INGREDIENT_STATES,
  LOT_PHASES,
  PRODUCT_QR_STATUSES,
  IMPACT_TYPES,
  AFFECTED_STATUSES,
  statusLabel,
};
