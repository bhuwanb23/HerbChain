/**
 * Laboratory certification constants (docs/phase_8.md + docs/lab/architecture.md).
 *
 * Certification is a SUBSTATE of custody: the batch's QR `phase` stays
 * `at_lab` while the lab validates; `Batch.test_status` carries the workflow:
 * pending -> received_by_lab -> sample_created -> under_testing ->
 * certified | rejected. The lab only ADDS scientific validation — farmer
 * data, ownership history and transport history are never edited.
 */

// Batch certification substate (stored on Batch.test_status; DB default
// 'pending' == not yet in the lab workflow).
const LAB_BATCH_STATUSES = [
  "pending", // default — batch not yet through lab intake
  "received_by_lab", // intake checklist recorded (lab_receipts)
  "sample_created", // first sample record exists
  "under_testing", // a test is in progress
  "certified", // COA issued (terminal for the lab stage)
  "rejected", // rejection record written (terminal for the lab stage)
];

// Lab intake condition (spec §3 Receive Batch Checklist).
const RECEIPT_CONDITIONS = ["good", "damaged", "partial", "rejected"];

/** Testing categories (spec §5). */
const TEST_CATEGORIES = ["identity", "purity", "physical", "chemical", "safety", "microbiological"];

/** Test lifecycle (spec §5 statuses PENDING / IN_PROGRESS / COMPLETED / FAILED). */
const TEST_STATUSES = ["pending", "in_progress", "completed", "failed"];

/** Two-level review statuses (spec §8). */
const REVIEW_STATUSES = ["approved", "rejected", "rework_required"];

/** Per-parameter verdict (spec §6 PASS / FAIL). */
const RESULT_VALUES = ["pass", "fail", "na"];

/** Rejection reasons (spec §11 examples). */
const REJECTION_REASONS = [
  "heavy_metal_failure",
  "species_mismatch",
  "microbial_failure",
  "contamination",
  "adulteration",
  "other",
];

/** Configurable rejection outcomes (spec §11 Rejection Actions). */
const REJECTION_ACTIONS = ["destroy", "return_to_supplier", "retest_required", "hold_for_investigation"];

/** Batch-level lab document types (spec §13). */
const LAB_DOC_TYPES = ["test_report", "microscopy_image", "certificate", "analysis_report"];

/** Three-way species verification status (spec §12). */
const SPECIES_VERIFICATION_STATUSES = ["match", "mismatch", "unverified"];

/**
 * Certification gate (spec workflow: tests -> reviews -> certificate).
 * A batch may be certified only when it has at least one completed test whose
 * review is APPROVED and whose results-driven outcome is PASS. Leave a failed
 * test unreviewed/not submitted and the batch cannot slip through.
 */
function certificationGate(batch) {
  const reasons = [];
  if (batch.phase !== "at_lab") {
    reasons.push(`batch must be at the lab (phase '${batch.phase}')`);
  }
  if (["certified", "rejected"].includes(batch.test_status)) {
    reasons.push(`batch is already '${batch.test_status}'`);
  }
  return reasons;
}

/** Lab role separation (spec §8): supervisor-only actions. */
function isLabSupervisor(user) {
  return user.role === "admin" || (user.role === "lab" && user.lab_role === "supervisor");
}

function isLabStaff(user) {
  return user.role === "lab" || user.role === "admin";
}

module.exports = {
  LAB_BATCH_STATUSES,
  RECEIPT_CONDITIONS,
  TEST_CATEGORIES,
  TEST_STATUSES,
  REVIEW_STATUSES,
  RESULT_VALUES,
  REJECTION_REASONS,
  REJECTION_ACTIONS,
  LAB_DOC_TYPES,
  SPECIES_VERIFICATION_STATUSES,
  certificationGate,
  isLabSupervisor,
  isLabStaff,
};
