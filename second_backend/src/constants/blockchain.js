/**
 * Blockchain layer constants (docs/phase_12.md +
 * docs/blockchain/architecture.md).
 *
 * Phase 12 = the permissioned trust layer. Only trusted milestones are
 * queued (blockchain_event_queue), hashed from live DB facts and anchored
 * (blockchain_transactions). The DB stays the system of record; the chain is
 * the source of proof and tamper detection.
 */

// Queue lifecycle (spec status list + worker semantics).
const QUEUE_STATUSES = ["pending", "processing", "completed", "failed"];

// Receipt lifecycle.
const TXN_STATUSES = ["submitted", "confirmed"];

// Trusted milestone event kinds (spec enum). Existing anchor codes map onto
// the spec vocabulary: TRANSFERRED ≈ OWNERSHIP_TRANSFERRED, CERTIFIED ≈
// LAB_CERTIFIED, REJECTED ≈ LAB_REJECTED, LINKED ≈ BATCH_LINKED_TO_PRODUCT.
const BLOCKCHAIN_EVENT_TYPES = [
  "BATCH_CREATED", // a harvest batch entered the chain
  "TRANSFERRED", // custody moved (≈ OWNERSHIP_TRANSFERRED)
  "CERTIFIED", // lab certificate issued (≈ LAB_CERTIFIED)
  "REJECTED", // batch rejected on testing (≈ LAB_REJECTED)
  "PRODUCT_CREATED", // finished lot emitted
  "LINKED", // batch consumed into a product (≈ BATCH_LINKED_TO_PRODUCT)
  "PRODUCT_RECALLED", // product flagged for recall
  "USER_VERIFIED", // org account approved by AYUSH
  "COMPLIANCE_FLAGGED", // compliance inspection flag
  // procurement facts (phase 9) ride the same queue:
  "MATERIAL_RECEIVED",
  "BATCH_ACCEPTED",
  "INVENTORY_ENTERED",
  "REQUESTED",
  "ALLOCATED",
];

// Permissioned network participant kinds (spec "Network Participants").
const NODE_ORG_TYPES = ["ayush", "lab", "manufacturer", "regional_authority", "orderer"];

// Node roles on the network.
const NODE_ROLES = ["governance", "validator", "orderer", "observer"];

const NODE_STATUSES = ["active", "inactive"];

// Retry strategy (spec): 1m, 5m, 15m, 30m, 1h after failures, then FAILED
// after BLOCKCHAIN_MAX_RETRIES attempts. Env-scaled for tests.
const RETRY_BACKOFF_MINUTES = [1, 5, 15, 30, 60];

// Smart contract functions (spec "Smart Contract Design").
const CONTRACT_FUNCTIONS = [
  { name: "createBatch", description: "Anchor a batch creation (called after Phase 3)", input: ["batchId", "farmerId", "timestamp"] },
  { name: "transferOwnership", description: "Anchor a custody transfer (after Phase 6)", input: ["batchId", "oldOwner", "newOwner", "transferType"] },
  { name: "certifyBatch", description: "Anchor a lab certification (after Phase 8)", input: ["batchId", "certificateNumber", "labId", "result"] },
  { name: "createProduct", description: "Anchor a finished product/lot (after Phase 10)", input: ["productId", "manufacturer", "date"] },
  { name: "linkBatchToProduct", description: "Anchor an immutable lineage edge (most important)", input: ["batchId", "productId"] },
];

// Smart contract security rules (spec Rule 1–5) — enforced by the contract
// gate in the worker (defense-in-depth; the domain services remain the
// primary enforcement).
const CONTRACT_RULES = [
  { id: 1, rule: "Cannot certify a non-existing batch", code: "certify_non_existing_batch" },
  { id: 2, rule: "Cannot transfer ownership if already transferred", code: "transfer_after_transfer" },
  { id: 3, rule: "Cannot link a rejected batch to a product", code: "link_rejected_batch" },
  { id: 4, rule: "Cannot create a duplicate product id", code: "duplicate_product" },
  { id: 5, rule: "Cannot modify a historical event (anchors are immutable)", code: "modify_history" },
];

// Which contract function gates each event kind (rule evaluation).
const EVENT_CONTRACT_FN = {
  BATCH_CREATED: "createBatch",
  TRANSFERRED: "transferOwnership",
  CERTIFIED: "certifyBatch",
  REJECTED: "certifyBatch",
  PRODUCT_CREATED: "createProduct",
  LINKED: "linkBatchToProduct",
};

/** Human label for queue/status codes. */
function label(value) {
  if (!value) return null;
  return String(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

module.exports = {
  QUEUE_STATUSES,
  TXN_STATUSES,
  BLOCKCHAIN_EVENT_TYPES,
  NODE_ORG_TYPES,
  NODE_ROLES,
  NODE_STATUSES,
  RETRY_BACKOFF_MINUTES,
  CONTRACT_FUNCTIONS,
  CONTRACT_RULES,
  EVENT_CONTRACT_FN,
  label,
};