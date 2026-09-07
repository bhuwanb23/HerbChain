# Phase A6 — Shared Screens (all roles)

**Goal:** the five screens every logged-in role shares per `overview.md`: Notifications center, Help & Support, Settings, Documents center, and the **Offline Sync Center** — the UI half of Phase 17 that makes the rural-connectivity promise real.
**Status:** ⬜ not started
**Depends on:** A1 (stubs exist), parallelizable with A3–A5
**Backend:** all ready (P14 documents, P15 notifications/support/settings, P17 sync) — `notifications.test.js` 14/14, `sync.test.js` 10/10.

---

## Screens

| # | Screen | Existing file | Backend endpoints | Status |
|---|---|---|---|---|
| 1 | Notifications center (unread/read/critical tabs) | A1 stub → build out | `GET /api/v1/notifications`, `PUT /:id/read`, preferences `GET/PUT /api/v1/notifications/preferences` | ⬜ |
| 2 | Help & Support (raise ticket, FAQ) | A1 stub | P15 support endpoints (`src/services/support.js` — verify paths) | ⬜ |
| 3 | Settings (language, password, notification prefs) | A1 stub | password change (P2), prefs (P15), language client-side | ⬜ |
| 4 | Documents center (list, download, share) | A1 stub | `GET /api/v1/documents`, download via storage URL | ⬜ |
| 5 | **Offline Sync Center** (pending/failed/conflicts) | A1 stub | `POST /api/v1/devices/register`, `POST /api/v1/sync/upload`, `GET /api/v1/sync/changes?since=`, `GET /api/v1/sync/status`, `GET /api/v1/sync/conflicts`, `POST /api/v1/sync/conflicts/:id/resolve` | ⬜ |

## Offline sync design (the meat of this phase)

| # | Step | Detail | Status |
|---|---|---|---|
| 1 | Local queue store | `App/services/offlineQueue.js` — SQLite (expo-sqlite) table `sync_queue(local_id, entity_type, operation, payload, status, attempts, created_at)` mirroring backend `SYNC_STATUSES`. | ⬜ |
| 2 | Queue writers | Domain actions (batch create, pickup, GPS, POD) get offline-first wrappers: enqueue when network down, fire when up. | ⬜ |
| 3 | Upload engine client | On connectivity (NetInfo): register/verify device → `POST /sync/upload` in priority order → apply receipts (map `local_id` → server id) → mark SYNCED/CONFLICT/FAILED. | ⬜ |
| 4 | Incremental pull | `GET /sync/changes?since=last_cursor` → update local cache incl. raw QR tokens for offline scan validation. | ⬜ |
| 5 | Conflict resolution UI | List conflicts with server_state vs client_item side-by-side; resolve via `POST /sync/conflicts/:id/resolve`. | ⬜ |
| 6 | Sync Center screen | Status header (last sync, pending/failed counts), queue list, conflict tab, manual "Sync now". | ⬜ |
| 7 | Device management | Register this device on first login; show in Settings with revoke option. | ⬜ |

## Other screens' steps

| # | Step | Detail | Status |
|---|---|---|---|
| 8 | Notifications center | Tabs unread/read/critical; mark-read; deep-link to entity (batch/shipment). Preferences sub-screen. | ⬜ |
| 9 | Support | Ticket list + raise form + FAQ static content. | ⬜ |
| 10 | Settings | Language picker (existing i18n), password change form (P2 policy), notification prefs. | ⬜ |
| 11 | Documents | Role-scoped list, preview (PDF viewer), download/share. | ⬜ |
| 12 | Commit | similarity groups: offline engine / sync center / shared screens. | ⬜ |

## Acceptance criteria

- [ ] Airplane-mode test: register batch offline → queue shows PENDING → back online → SYNCED with real batch code; receipt mapping correct.
- [ ] Forced conflict (batch custody changed while offline) → appears in conflict center → resolvable.
- [ ] Notifications reflect backend events (e.g. transfer request → farmer sees notification).
- [ ] `master_plan.md` index updated: A6 ✅.

## Risks / notes

- expo-sqlite + NetInfo are new deps — verify they're allowed in the project before adding.
- Never auto-resolve conflicts server-side from client; always user decision (matches P17 philosophy).
