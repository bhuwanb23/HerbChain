/**
 * Phase 16 — analytics constants (docs/phase_16.md).
 * Every KPI warehouse bucket + report type + schedule cadence lives here so
 * services, routes and the worker share one vocabulary.
 */

// Period buckets — every analytics row is keyed by one of these. `all` is
// the lifetime rollup the executive dashboard reads.
const PERIOD_TYPES = ["daily", "weekly", "monthly", "yearly", "all"];

// The 10 warehouse domains (spec "Analytics Data Warehouse Tables") + `all`
// (one invocation rebuilds everything).
const ANALYTICS_JOBS = [
  "production",
  "certification",
  "failures",
  "regional",
  "logistics",
  "consumption",
  "consumer",
  "traceability",
  "compliance",
  "blockchain",
  "all",
];

// RejectionRecord reason codes (40_quality.prisma) — failure breakdown.
const FAILURE_REASONS = [
  "heavy_metal_failure",
  "microbial_failure",
  "species_mismatch",
  "adulteration",
  "contamination",
  "other",
];

// Scheduled report frequencies.
const REPORT_FREQUENCIES = ["daily", "weekly", "monthly"];

// Report types the generation system supports (spec "Report Types").
const ANALYTICS_REPORT_TYPES = [
  "farmer",
  "lab",
  "manufacturer",
  "traceability",
  "compliance",
  "executive_summary",
  "production",
  "logistics",
  "consumer",
];

// Alert thresholds (spec "Alert-Based Analytics"): the analytics engine
// feeds ComplianceAlert rows when a KPI breaches a bound.
const ALERT_THRESHOLDS = {
  LAB_FAILURE_RATE: 20, // % — lab failure rate above this notifies AYUSH
  SPECIES_MISMATCH_SPIKE: 300, // % period-over-period growth
  COUNTERFEIT_SCANS: 25, // invalid consumer scans per period per product
};

// Schedule → next_run helper multipliers (days).
const FREQUENCY_DAYS = { daily: 1, weekly: 7, monthly: 30 };

module.exports = {
  PERIOD_TYPES,
  ANALYTICS_JOBS,
  FAILURE_REASONS,
  REPORT_FREQUENCIES,
  ANALYTICS_REPORT_TYPES,
  ALERT_THRESHOLDS,
  FREQUENCY_DAYS,
};
