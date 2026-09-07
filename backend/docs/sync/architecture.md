# Phase 17 — Offline Sync Architecture

Rural connectivity support (`docs/phase_17.md`). Mobile clients keep a local
SQLite queue (`sync_queue`) and replay it through the server when connectivity
returns. The server is the **single source of truth**: it re-uses the exact
online domain services so offline work lands with the same validation, QR
minting, custody rules and audit trails as online work.

## Data model (`prisma/schema/100_sync.prisma`)

| Model | Purpose |
|---|---|
| `SyncDevice` | Registered field device per user (device_id unique per user, platform, app_version, last_seen_at, revoked_at) |
| `SyncLog` | One row per upload session (device, item counts, applied/conflicted/failed, duration_ms, client_app_version) |
| `SyncEvent` | Per-item outcome inside a session (local_id, entity_type, operation, status APPLIED/CONFLICT/FAILED, receipt JSON, error) |
| `SyncConflict` | Captured conflict awaiting resolution (conflict_type, server_state JSON, client_item JSON, resolved_at, resolution) |

## Upload engine (`src/services/syncService.js`)

- `POST /api/v1/sync/upload` — body `{ device_id, items: [...] }`. The device
  must be registered to the caller (`403 device_not_registered` otherwise).
- Items are processed **in priority order** (shipments → transfers → batches →
  scans → gps → media) with **per-item isolation**: one bad item never blocks
  the rest. Every item gets a `SyncEvent`; failures become `SyncConflict` rows
  with `server_state` + `client_item` snapshots.
- Handlers delegate to the real services: `createBatch` (with asset
  requirement + date normalization for offline clients that send date-only
  strings), `requestTransfer` (custody NEVER moves on an offline scan — the
  receiver must still approve online), `recordShipmentEvent` / POD,
  GPS `TrackingPoint` appends, and media uploads through the storage driver
  into `Asset`.
- Conflict types: `OWNERSHIP_CHANGED`, `VALIDATION_ERROR`, `NOT_FOUND`,
  `DUPLICATE_LOCAL_ID`, `STALE_VERSION`.
- Response: `{ sync_id, status, applied, conflicted, results: [{ local_id,
  status, receipt | conflict_id, conflict_type }] }` — receipts map
  `local_id` → server entity ids so the client can rewrite its queue.

## Incremental pull

`GET /api/v1/sync/changes?since=<iso>` — everything the device's user can see
that changed since the cursor: own batches, held transfers, shipments on
their legs, and **active QR tokens with the raw token** (decrypted server-side
via `qrEngine`) so offline scans can validate tokens without connectivity.

## Status, conflicts, analytics

- `GET /api/v1/sync/status` — device health + last sync summary.
- `GET /api/v1/sync/conflicts` (own scope) / `POST /api/v1/sync/conflicts/:id/resolve`
  (owner or admin) — resolution records who decided what.
- `GET /api/v1/sync/analytics` (admin) — sessions, device counts, conflict
  rate, per-entity-type breakdown.

## RBAC

`sync.use` granted to every business role (farmer, transporter, lab,
manufacturer, collection center, consumer-facing roles); `sync.manage`
admin-only (device revocation, conflict override, analytics).

## Verification

- Unit suite `tests/sync/sync.test.js` — 10/10 (registration, upload engine,
  isolation, conflicts, pull, status, resolution, analytics).
- Full regression: **202/202 across 16 suites**.
- Live smoke `live_p17_smoke.cjs` — **24/24 checks** over real HTTP:
  login → device register → unregistered-device 403 → offline batch draft
  (receipt maps local_id → HERB code) → no-image conflict → offline custody
  scan (request created, custody NOT moved) → mixed upload partial success →
  incremental pull with raw QR tokens → status → conflict resolution RBAC →
  admin analytics.
