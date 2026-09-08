/**
 * Batch domain constants (docs/batch/architecture.md).
 */
const CULTIVATION_TYPES = ["organic", "conventional", "wild_collection"];

// Original input units -> canonical kg (storage is always weight_kg).
const UNIT_TO_KG = { kg: 1, gram: 0.001, ton: 1000 };
const VALID_UNITS = Object.keys(UNIT_TO_KG);

const PHASES = ["with_farmer", "in_transit_to_lab", "at_lab", "in_transit_to_manufacturer", "with_manufacturer", "consumed"];

/** Duplicate-warning window: same farmer+species+harvest date within N hours. */
const DUP_WINDOW_HOURS = 48;
const DUP_WEIGHT_TOLERANCE_KG = 0.5; // within half a kilo counts as "same"

/**
 * Public status vocabulary for the wire (docs/phase_3.md lifecycle). Creation
 * is CREATED; later phases extend this map (requested/in_transit/certified/…).
 */
const PHASE_STATUS_LABEL = { with_farmer: "CREATED" };

function statusLabel(phase, testStatus = "pending") {
  if (testStatus === "rejected") return "FAILED";
  if (testStatus === "certified") return "CERTIFIED";
  if (PHASE_STATUS_LABEL[phase]) return PHASE_STATUS_LABEL[phase];
  return phase.toUpperCase();
}

function toKg(quantity, unit) {
  const factor = UNIT_TO_KG[unit];
  if (!factor) throw new Error(`Unknown unit '${unit}'`);
  return Math.round(quantity * factor * 1000) / 1000;
}

module.exports = { CULTIVATION_TYPES, UNIT_TO_KG, VALID_UNITS, PHASES, DUP_WINDOW_HOURS, DUP_WEIGHT_TOLERANCE_KG, statusLabel, toKg };
