/**
 * Phase 13 — AYUSH admin portal constants (docs/phase_13.md).
 *
 * Covers the administration hierarchy, compliance alert vocabulary, recall
 * center statuses, investigation types, compliance score grades, report
 * types/formats and notification kinds.
 */

// AYUSH administration hierarchy (User.admin_role). Tiers are additive:
// auditor < state_officer < regulatory_officer < super_admin. A legacy
// admin with a NULL admin_role is treated as super_admin.
const ADMIN_ROLES = ["super_admin", "regulatory_officer", "state_officer", "auditor"];

// Capability tiers per admin_role. Each entry is the SET of portal features
// the role may call. super_admin/legacy-admin implicitly passes everything.
const ADMIN_TIER_CAPABILITIES = {
  auditor: ["dashboard", "search", "traceability", "shipments", "failed_certifications", "compliance_alerts_read", "blockchain_verify", "reports", "map", "scores"],
  state_officer: ["dashboard", "search", "traceability", "shipments", "failed_certifications", "map"],
  regulatory_officer: ["dashboard", "search", "traceability", "shipments", "failed_certifications", "compliance_alerts_read", "compliance_alerts_write", "blockchain_verify", "investigations", "recalls", "scores", "notifications", "map"],
  super_admin: ["dashboard", "search", "traceability", "shipments", "failed_certifications", "compliance_alerts_read", "compliance_alerts_write", "blockchain_verify", "investigations", "recalls", "scores", "notifications", "reports", "map", "users", "audit"],
};

// Compliance alert vocabulary.
const ALERT_TYPES = [
  "repeated_batch_failures",
  "species_fraud",
  "invalid_transfer",
  "duplicate_registration",
  "suspicious_qr_scan",
  "recall_event",
  "certificate_expiry",
  "high_lab_pass_rate",
  "blacklisted_entity",
];

const ALERT_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const ALERT_STATUSES = ["open", "acknowledged", "resolved"];

// Recall center statuses (Recall.status extension — phase 13 code list).
const RECALL_STATUSES = ["draft", "issued", "active", "resolved", "closed"];
const RECALL_REF_TYPES = ["product", "batch", "product_lot"];

// Investigation vocabulary.
const CASE_TYPES = ["complaint", "fraud", "recall", "audit", "other"];
const CASE_STATUSES = ["open", "under_review", "closed"];
const ENTITY_ROLES = ["subject", "witness", "affected"];

// Compliance score grades.
const SCORE_GRADES = { A: 90, B: 75, C: 60, D: 0 }; // min score per grade

// Report export vocabulary.
const REPORT_TYPES = [
  "farmer_registrations",
  "certification_trends",
  "failed_tests",
  "popular_herbs",
  "manufacturing_trends",
  "shipment_performance",
];
const REPORT_FORMATS = ["csv", "pdf", "excel"];

// AYUSH notification feed kinds.
const NOTIFICATION_TYPES = [
  "new_lab_registration",
  "high_severity_alert",
  "recall_event",
  "audit_failure",
  "suspicious_transfer",
  "certificate_expiry",
  "system",
];

// Failed-certification reason categories (drives the filter chips).
const FAILURE_CATEGORIES = ["heavy_metals", "contamination", "species_mismatch", "microbial", "other"];

// Shipment risk flags (computed, not persisted).
const SHIPMENT_RISKS = ["delayed", "inactive", "route_deviation", "delivery_failure"];

module.exports = {
  ADMIN_ROLES,
  ADMIN_TIER_CAPABILITIES,
  ALERT_TYPES,
  ALERT_SEVERITIES,
  ALERT_STATUSES,
  RECALL_STATUSES,
  RECALL_REF_TYPES,
  CASE_TYPES,
  CASE_STATUSES,
  ENTITY_ROLES,
  SCORE_GRADES,
  REPORT_TYPES,
  REPORT_FORMATS,
  NOTIFICATION_TYPES,
  FAILURE_CATEGORIES,
  SHIPMENT_RISKS,
};