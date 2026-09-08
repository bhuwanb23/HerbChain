# Phase A7 — Admin Web Portal Upgrade

**Goal:** the AYUSH web portal (`website/`) becomes the real control tower: consume the P13 admin-portal endpoints (21 routes) and P16 analytics (10 domains + alert engine), fix the dead `/admin/api/*` calls, and add the missing monitor/explorer screens.
**Status:** ✅ completed
**Depends on:** A0 (can run parallel to A2–A5)
**Backend:** all ready — `admin.test.js` 15/15, `analytics.test.js` 12/12.

---

## Current web state

- Wired routes: `/` (dashboard), `/trace`, `/compliance`, `/reports`, `/users`, `/settings`, `/recall`, `/login`.
- Dead calls: `AdminAPI` → `/admin/api/stats|users|batches|events|products|lab-reports|health` (Flask-era).
- Unwired pages: `alerts_recall/`, `incentives/`, `integrations/`, `support/`.

## Work items

| # | Item | Pages | Backend endpoints | Status |
|---|---|---|---|---|
| 1 | apiClient rewrite (from A0) | `services/apiClient.js` | see A0 mapping table | ⬜ |
| 2 | National dashboard → P16 | `dashboard/` | `GET /api/v1/analytics/dashboard` (exec KPIs) + domain endpoints | ⬜ |
| 3 | User management upgrade | `users/` | `GET /api/v1/admin/users`, `POST /:id/approve|suspend|activate|reject|role` | ⬜ |
| 4 | Batch explorer | `trace/` | `GET /api/v1/admin/portal/search`, `/batches/:id` | ⬜ |
| 5 | Shipment monitor (map view) | new page | `GET /api/v1/admin/portal/map`, `/shipments` | ⬜ |
| 6 | Certification monitor | new | `GET /api/v1/admin/portal/failed-certifications`, analytics certification domain | ⬜ |
| 7 | Product/traceability explorer | new | `GET /api/v1/admin/portal/products/:id` | ⬜ |
| 8 | Compliance center | `compliance/` + `alerts_recall/` | `GET/POST /api/v1/admin/portal/compliance-alerts`, `/run-rules` | ⬜ |
| 9 | Investigation module | new | `GET/POST /api/v1/admin/portal/investigations` | ⬜ |
| 10 | Recall center | `recall` (in App.jsx but shallow) | `GET/POST /api/v1/admin/portal/recalls` | ⬜ |
| 11 | Blockchain audit center | new | `GET /api/v1/blockchain/...` | ⬜ |
| 12 | Analytics & BI dashboard | new page | all 10 `GET /api/v1/analytics/*` domains + alerts | ⬜ |
| 13 | Reports center | `reports/` | `GET /api/v1/reports`, `POST /generate`, schedules | ⬜ |
| 14 | Security & audit center | new | `GET /api/v1/admin/portal/audit` | ⬜ |
| 15 | Notification center | new | `GET /api/v1/admin/portal/notifications` | ⬜ |
| 16 | Trust scores | fold into monitoring pages | `GET /api/v1/admin/portal/scores`, `/scores/compute` | ⬜ |
| 17 | Wire unwired pages | `incentives/`, `integrations/`, `support/` | P15 support; incentives = reports domain | ⬜ |

## Steps

| # | Step | Detail | Status |
|---|---|---|---|
| 1 | apiClient rewrite + auth guard | A0 deliverable; verify admin RBAC (`admin.view`, etc.) gates routes client-side too. | ⬜ |
| 2 | Dashboard → P16 KPIs | Replace Flask stats with executive dashboard payload; keep existing chart components. | ⬜ |
| 3 | Monitors (shipments/certification) | Table + filter + detail drawer pattern reused across monitors. | ⬜ |
| 4 | Compliance + investigation + recall | Alert list → detail → action (investigate/recall); run-rules button. | ⬜ |
| 5 | Analytics BI page | 10 domain tabs reading warehouse endpoints; MoM deltas included in P16 payloads. | ⬜ |
| 6 | Blockchain explorer | Transaction list + verification status; link from batch/product pages. | ⬜ |
| 7 | Reports center | Generate/download CSV artifacts; schedule management. | ⬜ |
| 8 | Smoke | Script: login admin → dashboard KPIs real → run compliance rules → raise investigation → issue recall → download report CSV. | ⬜ |
| 9 | Commit | similarity groups. | ⬜ |

## Acceptance criteria

- [ ] Zero `/admin/api/*` calls remain.
- [ ] All 21 portal endpoints consumed somewhere sensible.
- [ ] P16 dashboard + ≥5 domain pages render real warehouse data.
- [ ] `master_plan.md` index updated: A7 ✅.

## Risks / notes

- Web pages were built against Flask response shapes — expect per-page payload adaptation (map in client, keep components).
- Map view: use existing chart/lib dependency already in `package.json` if any; don't add heavy map libs without checking.
