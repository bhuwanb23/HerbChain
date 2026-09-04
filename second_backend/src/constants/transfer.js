/**
 * Governed transfer constants (docs/phase_6.md + docs/transfers/architecture.md).
 *
 * Phase 6 = two-party handover: the receiving party opens a TransferRequest,
 * the CURRENT HOLDER approves (or rejects/cancels), then the move executes
 * through the Phase-5 QR engine — request marked COMPLETED in the same
 * transaction as the ownership + QR rotation.
 */

// Transfer leg codes (spec "Supported Transfer Types" + self-collect legs).
const TRANSFER_TYPES = [
  "FARMER_TO_TRANSPORTER",
  "TRANSPORTER_TO_LAB",
  "LAB_TO_TRANSPORTER",
  "TRANSPORTER_TO_MANUFACTURER",
  "FARMER_TO_LAB", // lab self-collect from the farm gate
  "LAB_TO_MANUFACTURER", // manufacturer self-collect from the lab
  "ADMIN_RECOVERY", // admin-forced recovery (custody returned without holder consent)
];

// Batch phase + receiver role -> leg code (mirrors constants/qr.js matrix).
const LEG_CODES = {
  with_farmer: {
    transporter: "FARMER_TO_TRANSPORTER",
    lab: "FARMER_TO_LAB",
  },
  in_transit_to_lab: {
    lab: "TRANSPORTER_TO_LAB",
  },
  at_lab: {
    transporter: "LAB_TO_TRANSPORTER",
    manufacturer: "LAB_TO_MANUFACTURER",
  },
  in_transit_to_manufacturer: {
    manufacturer: "TRANSPORTER_TO_MANUFACTURER",
  },
};

// Request lifecycle (spec transfer_requests statuses).
const REQUEST_STATUSES = ["pending", "approved", "rejected", "completed", "cancelled"];

const ACTIVE_REQUEST_STATUSES = ["pending", "approved"];

/** Leg code for a (phase, receiver role) pair, or null when not allowed. */
function legCodeFor(phase, role) {
  const row = LEG_CODES[phase];
  return row ? row[role] || null : null;
}

module.exports = {
  TRANSFER_TYPES,
  LEG_CODES,
  REQUEST_STATUSES,
  ACTIVE_REQUEST_STATUSES,
  legCodeFor,
};
