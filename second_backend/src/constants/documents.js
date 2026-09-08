/**
 * Phase 15 — document management constants (docs/phase_15.md).
 *
 * Storage categories mirror the production folder structure
 * (herbchain-storage/{herbs,laboratories,certificates,shipments,products,
 * compliance,investigations}). Visibility levels gate who may read a file:
 *   PUBLIC      — consumer-safe (certificate summaries, passport PDFs)
 *   RESTRICTED  — parties to the entity (owner, counterparties, admins)
 *   CONFIDENTIAL — internal reports (lab raw data, farmer docs)
 *   REGULATORY  — investigation / compliance documents (AYUSH only)
 */

const DOCUMENT_CATEGORIES = [
  "herbs", // herb/batch images
  "laboratory", // test reports, analysis files
  "certificates", // COA / lab certificates
  "shipments", // invoices, notes, route docs
  "products", // product images, labels, manufacturing reports
  "compliance", // licenses, approvals, audit reports
  "investigations", // investigation files (REGULATORY)
  "user", // kyc / profile documents
];

// entity_type values allowed per category (poly FK targets).
const CATEGORY_ENTITY_TYPES = {
  herbs: ["batch", "species"],
  laboratory: ["batch", "lab_report", "sample"],
  certificates: ["certificate", "batch"],
  shipments: ["shipment"],
  products: ["product", "product_lot"],
  compliance: ["license", "inspection", "user"],
  investigations: ["investigation"],
  user: ["user"],
};

const VISIBILITY = { PUBLIC: "PUBLIC", RESTRICTED: "RESTRICTED", CONFIDENTIAL: "CONFIDENTIAL", REGULATORY: "REGULATORY" };

const DOCUMENT_STATUS = { UPLOADED: "uploaded", VALIDATED: "validated", ARCHIVED: "archived", DELETED: "deleted" };

const STORAGE_JOB_KIND = { VIRUS_SCAN: "virus_scan", CHUNK_UPLOAD: "chunk_upload", ARCHIVE: "archive", DELETE: "delete" };
const STORAGE_JOB_STATUS = { QUEUED: "queued", PROCESSING: "processing", DONE: "done", FAILED: "failed" };

const ACCESS_ACTIONS = { UPLOAD: "UPLOAD", VIEW: "VIEW", DOWNLOAD: "DOWNLOAD", VERIFY: "VERIFY", SHARE: "SHARE", DELETE: "DELETE", ARCHIVE: "ARCHIVE" };

// Mime allow-list + per-category size caps (bytes).
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const FILE_TYPE_OF_MIME = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "application/pdf": "document",
  "application/msword": "document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
  "application/vnd.ms-excel": "spreadsheet",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "spreadsheet",
};

// Size caps: images 10MB, PDFs 25MB, reports 50MB (spec §Upload Validation).
const SIZE_CAPS_BYTES = {
  image: 10 * 1024 * 1024,
  document: 50 * 1024 * 1024,
  spreadsheet: 25 * 1024 * 1024,
};

// Default retention (docs/phase_14 "Retention Policies"); months, null = permanent.
const DEFAULT_RETENTION_RULES = [
  { category: "herbs", retention_months: 120 }, // 10 years
  { category: "laboratory", retention_months: null }, // raw evidence — permanent
  { category: "certificates", retention_months: 180 }, // 15 years
  { category: "shipments", retention_months: 120 }, // 10 years
  { category: "products", retention_months: 120 }, // 10 years
  { category: "compliance", retention_months: null }, // permanent
  { category: "investigations", retention_months: null }, // permanent
  { category: "user", retention_months: 120 },
];

// Categories that anchor their document hash on the blockchain.
const ANCHORABLE_CATEGORIES = ["certificates", "compliance", "investigations", "laboratory"];

// Blockchain anchor codes for document milestones.
const DOCUMENT_ANCHOR_CODES = {
  CERTIFICATE_UPLOADED: "CERTIFICATE_UPLOADED",
  DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",
};

module.exports = {
  DOCUMENT_CATEGORIES,
  CATEGORY_ENTITY_TYPES,
  VISIBILITY,
  DOCUMENT_STATUS,
  STORAGE_JOB_KIND,
  STORAGE_JOB_STATUS,
  ACCESS_ACTIONS,
  ALLOWED_MIME_TYPES,
  FILE_TYPE_OF_MIME,
  SIZE_CAPS_BYTES,
  DEFAULT_RETENTION_RULES,
  ANCHORABLE_CATEGORIES,
  DOCUMENT_ANCHOR_CODES,
};