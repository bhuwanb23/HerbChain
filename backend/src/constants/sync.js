// Phase 17 — offline sync constants (docs/phase_17.md).
//
// Sync status lifecycle mirrors the mobile-side sync_queue exactly:
//   PENDING  → client queued, not yet sent
//   SYNCING  → upload in flight
//   SYNCED   → server applied (receipt carries the server entity id)
//   FAILED   → transient failure (client retries with backoff)
//   CONFLICT → server refused (see CONFLICT_TYPES) — user must resolve

const SYNC_STATUSES = ["PENDING", "SYNCING", "SYNCED", "FAILED", "CONFLICT"];

// Queue item entity types — each maps to one server-side handler that
// replays the operation through the regular domain service.
const SYNC_ENTITY_TYPES = [
  "batch_create",     // farmer offline batch draft → official batch + QR
  "transfer_request", // offline scan → custody transfer REQUEST (never final)
  "transfer_execute", // offline scan executed as custody transfer (re-validated)
  "shipment_event",   // pickup / delivery / arrive confirmations
  "gps_points",       // transit GPS breadcrumbs (bulk)
  "media_upload",     // POD photos / evidence after reconnect
];

// Queue operations (docs/phase_17.md sync_queue.operation code list).
const SYNC_OPERATIONS = ["CREATE", "UPDATE", "TRANSFER", "UPLOAD", "DELETE"];

// Client-facing UX states (✅ synced / 🟡 pending / 🔴 failed / ⚠ conflict).
const CONFLICT_TYPES = {
  OWNERSHIP_CHANGED: "OWNERSHIP_CHANGED", // holder moved on before sync
  QR_EXPIRED: "QR_EXPIRED",               // token no longer active at sync time
  DUPLICATE_BATCH: "DUPLICATE_BATCH",     // same draft already registered
  SHIPMENT_CANCELLED: "SHIPMENT_CANCELLED",
  VALIDATION_ERROR: "VALIDATION_ERROR",   // payload/referenced entity invalid
};

// Retry backoff schedule for transient failures (minutes) — phase 17 table.
const RETRY_SCHEDULE_MIN = [1, 5, 15, 30, 60];

module.exports = { SYNC_STATUSES, SYNC_ENTITY_TYPES, SYNC_OPERATIONS, CONFLICT_TYPES, RETRY_SCHEDULE_MIN };
