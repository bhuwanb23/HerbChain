/**
 * Consumer verification constants (docs/phase_11.md +
 * docs/verification/architecture.md).
 *
 * Phase 11 = the public Digital Product Passport. A consumer scans the
 * permanent product QR (never the internal ownership QR) and the verification
 * engine renders VERIFIED | EXPIRED | RECALLED | UNDER_INVESTIGATION |
 * INVALID from live state: token -> product -> lineage -> certificates.
 */

// Engine verdicts (spec "Verification Engine"). "unverified" is the
// pre-first-scan default persisted on products.
const VERIFICATION_STATUSES = [
  "VERIFIED", // everything green: active product, valid QR, lineage + valid certs
  "EXPIRED", // authentic but ingredient certificates have lapsed
  "RECALLED", // product.status == recalled or an open AffectedProduct row
  "UNDER_INVESTIGATION", // open counterfeit alert — not yet recalled
  "INVALID", // unknown/revoked token or incomplete lineage (spec checks 1/3/4)
  "unverified", // never scanned yet
];

// Why a scan pattern is suspicious (spec "Counterfeit Detection").
const ALERT_REASONS = [
  "geo_velocity", // same token scanned from far-apart places within minutes
  "scan_burst", // same token scanned far too fast (bot / probe flood)
  "excessive_volume", // daily scan count far above normal demand
  "revoked_token_scan", // scan of a revoked/invalidated product QR
  "unknown_token_burst", // flood of unrecognised tokens (fake-QR probing)
];

const ALERT_SEVERITIES = ["low", "medium", "high", "critical"];

const ALERT_STATUSES = ["open", "investigating", "resolved"];

// Coarse device classification from the User-Agent (analytics dimension).
const DEVICE_TYPES = ["mobile", "tablet", "desktop", "unknown"];

// Passport journey stages, consumer-facing labels (spec §7). The timeline is
// derived from batch + lot events and mapped onto these human stages.
const JOURNEY_STAGES = [
  { key: "HARVESTED", label: "Harvested", icon: "🌱" },
  { key: "TRANSPORTED", label: "Transported", icon: "🚛" },
  { key: "LAB_TESTED", label: "Laboratory Tested", icon: "🔬" },
  { key: "CERTIFIED", label: "Certified", icon: "✅" },
  { key: "MANUFACTURED", label: "Manufactured", icon: "🏭" },
];

// Trust score weights (spec §9) — sum to 100.
const TRUST_SCORE_WEIGHTS = {
  lab_pass: 40, // every ingredient batch has an active, valid certificate
  traceability_complete: 30, // lineage snapshot + full journey on every batch
  licensed_manufacturer: 15, // manufacturer holds a verified AYUSH licence
  verified_supply_chain: 15, // every ingredient farmer is AYUSH-verified
};

function statusLabel(status) {
  if (!status) return null;
  // Title-case for the badge: "VERIFIED" -> "Verified",
  // "UNDER_INVESTIGATION" -> "Under Investigation".
  return String(status)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

module.exports = {
  VERIFICATION_STATUSES,
  ALERT_REASONS,
  ALERT_SEVERITIES,
  ALERT_STATUSES,
  DEVICE_TYPES,
  JOURNEY_STAGES,
  TRUST_SCORE_WEIGHTS,
  statusLabel,
};