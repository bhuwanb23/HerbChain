# Phase A4 — Lab Pipeline

**Goal:** the lab's full testing pipeline: queue → receive batch → create samples → run tests → enter results → supervisor review → issue certificate / reject with reason. Certification is what unlocks marketplace sales — this phase unblocks A5.
**Status:** ⬜ not started
**Depends on:** A1 (and A2/A3 for realistic data, not strictly)
**Backend:** all ready (P8) — `lab.test.js` 13/13.

---

## Screens

| # | Screen | Existing file | Backend endpoints | Status |
|---|---|---|---|---|
| 1 | Lab dashboard (received / in-testing / certified / rejected KPIs) | `labs/dashboard/` | `GET /api/v1/labs/...` queue + stats | ⬜ |
| 2 | Batch queue (awaiting/received/under-testing) | `labs/batches/` | `GET /api/v1/labs/batches?status=…` | ⬜ |
| 3 | Batch detail (images, farmer, origin, certs, history) | new | `GET /api/v1/batches/:id` | ⬜ |
| 4 | Receive batch | new | `POST /api/v1/labs/batches/:id/receive` (verify path) | ⬜ |
| 5 | Sample management (create sample, sample IDs) | new | `POST /api/v1/labs/batches/:id/samples` | ⬜ |
| 6 | Test list + create test (moisture/purity/metals/microbial) | `labs/testing/` | `POST /api/v1/labs/samples/:id/tests` | ⬜ |
| 7 | Result entry (parameter, observed, reference) | new | `PUT /api/v1/labs/tests/:id/results` | ⬜ |
| 8 | Supervisor review (approve/request changes/reject) | new | `POST /api/v1/labs/tests/:id/review` | ⬜ |
| 9 | Certificate generation (CoA, PDF upload) | new | `POST /api/v1/labs/batches/:id/certificate` + upload | ⬜ |
| 10 | Batch rejection (reason + remarks) | new | `POST /api/v1/labs/batches/:id/reject` | ⬜ |
| 11 | Species verification view | new | included in test results / batch detail | ⬜ |
| 12 | Documents (certificates, reports) | new | `GET /api/v1/documents` (P14) | ⬜ |
| 13 | Reports & analytics | `labs/reports/` | `GET /api/v1/analytics` role-scoped (P16) | ⬜ |

## Steps

| # | Step | Detail | Status |
|---|---|---|---|
| 1 | Contracts | `LabsAPI` namespace; verify every route against `src/modules/lab/labRoutes.js` before writing UI calls. | ⬜ |
| 2 | Queue + receive | Wire existing `batches/` files; receive action with condition notes. | ⬜ |
| 3 | Samples → tests → results | The analytical core; result entry form driven by test parameter definitions from backend. | ⬜ |
| 4 | Supervisor review | Separate reviewer role check (`lab_incharge` vs analyst — verify RBAC names in `src/db/rbac.js`). | ⬜ |
| 5 | Certificate / rejection | Generate CoA referencing test rows; upload PDF asset; rejection with structured reason. | ⬜ |
| 6 | Documents + reports | List certificates via documents module; analytics page consuming role-scoped P16 endpoint. | ⬜ |
| 7 | Smoke | Script: farmer batch → lab receives → sample → test → results → supervisor approve → certificate issued → batch shows certified. | ⬜ |
| 8 | Commit | similarity groups. | ⬜ |

## Acceptance criteria

- [ ] Full pipeline works end-to-end on emulator; certificate visible to farmer (cross-check in A3 screens).
- [ ] Supervisor gate enforced in UI (analyst can't self-approve).
- [ ] Rejected batch flows to farmer notifications.
- [ ] `master_plan.md` index updated: A4 ✅.

## Risks / notes

- Test parameter catalogs (moisture limits etc.) live in backend constants — render from API, don't hardcode.
- PDF generation: if backend only stores uploaded PDFs, mobile generates via simple HTML→PDF or defers to web; verify P8 capability first.
