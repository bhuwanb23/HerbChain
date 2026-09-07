# Phase A3 — Farmer Lifecycle

**Goal:** farmer's daily loop: dashboard stats → my batches → batch detail (history/lab/QR) → register batch (rewrite onto new contract) → transfer requests (approve pickup) → certifications → notifications.
**Status:** ⬜ not started
**Depends on:** A1
**Backend:** all ready (P3 batches, P4 identification, P5 transfers, P6 QR) — `batches.test.js` 10/10, `qr.test.js` 7/7.

---

## Screens

| # | Screen | Existing file | Backend endpoints | Status |
|---|---|---|---|---|
| 1 | Dashboard (totals, recent activity) | `farmers/dashboard/` | `GET /api/v1/batches/mine` (aggregate client-side) | ⬜ |
| 2 | My Batches (list + certified/pending/rejected filters) | new list screen | `GET /api/v1/batches/mine` | ⬜ |
| 3 | Batch Details (images, ownership, shipment, lab, QR) | new | `GET /api/v1/batches/:id` + `/:id/events` | ⬜ |
| 4 | Batch Timeline | new | `GET /api/v1/batches/:id/events` | ⬜ |
| 5 | Register Herb Batch (rewrite) | `herb_register/` | `POST /api/v1/uploads` → `POST /api/v1/batches` (+ AI detect via `/identifications`) | ⬜ |
| 6 | AI Detection wiring | `herb_register/components/AIRecognition.js` | `POST /api/v1/identifications` detect → confirm | ⬜ |
| 7 | Transfer Requests (approve/reject pickup) | new | `GET /api/v1/transfers?mine=…`, `POST /api/v1/transfers/:id/approve|reject` | ⬜ |
| 8 | Active QR screen (view, version, regenerate) | new | `GET /api/v1/batches/:id/qr`, regenerate route in `/qr` | ⬜ |
| 9 | Certifications view | new | batch detail includes lab results/certs | ⬜ |
| 10 | Notifications | `farmers/notifications/` | `GET /api/v1/notifications`, mark-read | ⬜ |
| 11 | Profile | `farmers/profile/` | `GET /api/v1/auth/me` (+ profile update if exposed) | ⬜ |

## Steps

| # | Step | Detail | Status |
|---|---|---|---|
| 1 | Contracts | `TransfersAPI` farmer-side methods; fix `BatchesAPI` payloads to new schema (species_id, quantity+unit, harvest_date ISO, cultivation_type, asset_ids). | ⬜ |
| 2 | Register flow rewrite | herb_register screens → new contract; keep tflite on-device first-pass, then server confirm. Upload images first to get `asset_ids`. | ⬜ |
| 3 | Batch list + detail + timeline | Reuse dashboard components (StatsCards, ActivityFeed) where possible. | ⬜ |
| 4 | Transfer requests | Incoming requests list; approve/reject with reason; show resulting custody + QR change. | ⬜ |
| 5 | QR screen | Render QR image from backend payload; version badge; regenerate button. | ⬜ |
| 6 | Certifications + notifications + profile | Mostly read-only views. | ⬜ |
| 7 | Smoke | Script: login farmer → register batch (with asset) → QR visible → create transfer as transporter → farmer approves → holder changed. | ⬜ |
| 8 | Commit | similarity groups. | ⬜ |

## Acceptance criteria

- [ ] Farmer can register a batch end-to-end (upload → create → QR) on the new contract.
- [ ] Transfer request approve/reject works; custody + QR update reflected in app.
- [ ] Dashboard stats match `/batches/mine` reality.
- [ ] `master_plan.md` index updated: A3 ✅.

## Risks / notes

- Old register flow posted to `/api/v1/herbs` with different field names — full payload rewrite, not a rename.
- `harvest_date` must be full ISO datetime (backend rejects date-only).
