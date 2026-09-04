/**
 * Dynamic QR engine constants (docs/phase_5.md + docs/qr/architecture.md).
 *
 * A QR token represents CURRENT OWNERSHIP STATE, never the herb: one batch,
 * one current holder, one ACTIVE token. Every custody transfer / replacement
 * rotates the token (old -> transferred/revoked, next version -> active).
 */

// Token lifecycle states (spec QR States).
const QR_STATUSES = ["active", "transferred", "expired", "invalidated", "revoked"];

// Why a token stopped being the live QR.
const DEACTIVATION_REASONS = [
  "transfer", // rotated by an ownership transfer
  "expired", // token TTL passed naturally
  "replaced_lost", // holder lost the printed QR
  "replaced_damaged", // holder's QR is unreadable
  "admin_replacement", // admin forced a new token
  "invalidated", // fraud / duplicate / wrong QR
];

// Replacement-log reasons (spec QR Replacement Tracking).
const REPLACEMENT_REASONS = ["LOST", "DAMAGED", "EXPIRED", "ADMIN_REPLACEMENT"];

/**
 * Batch custody transition matrix — the only legal (phase, receiver role)
 * pairs for a scan-based transfer. Mirrors the spec's example journey
 * (farmer v1 -> transporter v2 -> lab v3 -> transporter v4 -> manufacturer v5)
 * plus direct self-collect legs (lab from farmer, manufacturer from lab).
 */
const TRANSITIONS = {
  with_farmer: {
    transporter: "in_transit_to_lab",
    lab: "at_lab", // lab self-collect from the farm gate
  },
  in_transit_to_lab: {
    lab: "at_lab",
  },
  at_lab: {
    transporter: "in_transit_to_manufacturer",
    manufacturer: "with_manufacturer", // manufacturer self-collect from the lab
  },
  in_transit_to_manufacturer: {
    manufacturer: "with_manufacturer",
  },
  with_manufacturer: {}, // terminal for batches — consumed into product lots (later phase)
  consumed: {},
};

/** Terminal phases can never transfer. */
const TERMINAL_PHASES = ["with_manufacturer", "consumed"];

function nextPhaseFor(phase, role) {
  const row = TRANSITIONS[phase];
  return row ? row[role] || null : null;
}

module.exports = {
  QR_STATUSES,
  DEACTIVATION_REASONS,
  REPLACEMENT_REASONS,
  TRANSITIONS,
  TERMINAL_PHASES,
  nextPhaseFor,
};
