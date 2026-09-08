# Phase A2 — Transporter Core Loop

**Goal:** the full custody-chain journey a transporter lives daily: see assigned shipments → accept → scan batch QR → pickup capture → ownership transfer confirmation → in-transit with GPS breadcrumbs → delivery + POD. This is the gate for the whole supply chain — every other role depends on custody moving.
**Status:** ⬜ not started
**Depends on:** A1
**Backend:** all ready (P5 transfers, P7 shipments + GPS + POD) — `shipments.test.js` 13/13.

---

## Screens (build/wire in this order)

| # | Screen | Existing file | Backend endpoints | Status |
|---|---|---|---|---|
| 1 | Shipments list (filters: assigned/in-transit/completed) | `pages/users/transporters/transporters.js` + `trips/active_trips/` | `GET /api/v1/shipments?status=…` | ⬜ |
| 2 | Shipment detail (legs, batch, owner, timeline) | new (reuse `trips/active_trips` components) | `GET /api/v1/shipments/:id` | ⬜ |
| 3 | Accept shipment | inside detail | `POST /api/v1/shipments/:id/accept` | ⬜ |
| 4 | QR Scanner (validate batch token) | `trips/batch_scan/` | `POST /api/v1/qr/validate` (verify at impl) | ⬜ |
| 5 | Pickup capture (photo + GPS + remarks) | new | `POST /api/v1/shipments/:id/pickup` + `POST /api/v1/uploads` | ⬜ |
| 6 | Transfer confirmation (old owner → new owner, new QR) | new | `POST /api/v1/transfers/:id/approve` (receiver side) | ⬜ |
| 7 | In-transit tracking (start journey, ETA) | new | `POST /api/v1/shipments/:id/start`, GPS `POST /api/v1/shipments/:id/track` | ⬜ |
| 8 | Delivery + POD (signature/photo/remarks) | `trips/delivery_confirm/` | `POST /api/v1/shipments/:id/deliver` + POD upload | ⬜ |
| 9 | Delivery failure flow | new | `POST /api/v1/shipments/:id/fail` (verify name) | ⬜ |
| 10 | Trip history | `trips/history/` | `GET /api/v1/shipments?mine=completed` | ⬜ |
| 11 | Transporter dashboard (counts) | `dashboard/dashboard.js` | `GET /api/v1/shipments` aggregate client-side or `/analytics` role-scoped | ⬜ |

## Steps

| # | Step | Detail | Status |
|---|---|---|---|
| 1 | Contracts module | Add `ShipmentsAPI` + `TransfersAPI` to `App/services/apiClient.js` from A0 with exact endpoint shapes verified against `src/modules/shipments/shipmentsRoutes.js` + `src/services/shipments.js`. | ⬜ |
| 2 | Shipments list + detail | Wire existing files; status chips, pull-to-refresh, filters. | ⬜ |
| 3 | Accept → scan → pickup flow | Camera (expo-camera) for QR; GPS via expo-location; photo upload via `UploadsAPI` then reference `asset_id`. | ⬜ |
| 4 | Transfer confirm screen | Show old/new owner + new QR; blocking until receiver approves (P5 semantics: custody moves only on approve). | ⬜ |
| 5 | Transit + GPS breadcrumb loop | Background-ish interval while trip active (foreground service out of scope; note limitation). | ⬜ |
| 6 | Delivery + POD | Signature capture (expo) or photo; upload as asset; attach to deliver call. | ⬜ |
| 7 | Failure + history | Failure reasons enum from backend; history list with POD thumbnails. | ⬜ |
| 8 | Smoke script | `App/scripts/smoke_transporter.md` checklist: create shipment as farmer→transporter in DB seed, run app flow, assert batch holder changed + POD row exists (via API check). | ⬜ |
| 9 | Commit | similarity groups: contracts / screens / smoke. | ⬜ |

## Acceptance criteria

- [ ] Full loop works on emulator: assign → accept → scan → pickup → approve → start → GPS points visible → deliver w/ POD → history shows trip.
- [ ] Batch `current_holder_user_id` moves only after transfer approval (verified via API).
- [ ] All 13 backend shipment tests still green (untouched backend).
- [ ] `master_plan.md` index updated: A2 ✅.

## Risks / notes

- Verify exact route paths at implementation (list above is from route-prefix scan; param names may differ).
- GPS interval drains battery — ship with 60s default, make configurable later.
- Offline queueing of pickup/POD belongs to A6 sync center, not here (online-only first).
