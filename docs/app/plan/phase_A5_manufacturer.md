# Phase A5 — Manufacturer Chain

**Goal:** manufacturer's value chain: browse certified marketplace → procurement request → receive + GRN → inventory → production run → product creation → product QR → lineage → recall impact.
**Status:** ⬜ not started
**Depends on:** A1, A2 (shipments deliver inventory), A4 (certified stock exists)
**Backend:** all ready (P9 procurement, P10 products/lineage) — `procurement.test.js` 6/6, `products.test.js` 9/9.

---

## Screens

| # | Screen | Existing file | Backend endpoints | Status |
|---|---|---|---|---|
| 1 | Dashboard (inventory, active products, incoming) | `manufacturers/dashboard/` | `GET /api/v1/manufacturer/...` summary | ⬜ |
| 2 | Certified Herb Marketplace (search/filters) | new | `GET /api/v1/manufacturer/marketplace` (verify) | ⬜ |
| 3 | Certified batch detail (farmer, certs, ownership) | new | `GET /api/v1/batches/:id` | ⬜ |
| 4 | Procurement request (select qty, submit) | new | `POST /api/v1/manufacturer/requests` | ⬜ |
| 5 | Procurement tracker (REQ-YYYY-NNNNNN) | new | `GET /api/v1/manufacturer/requests` | ⬜ |
| 6 | Incoming shipments | new | `GET /api/v1/shipments?direction=incoming` | ⬜ |
| 7 | GRN (received/accepted/rejected qty) | new | `POST /api/v1/manufacturer/grn` | ⬜ |
| 8 | Inventory list + detail (available/reserved/consumed) | new | `GET /api/v1/manufacturer/inventory` | ⬜ |
| 9 | Quality hold | new | `POST /api/v1/manufacturer/inventory/:id/hold` | ⬜ |
| 10 | Production run (start/complete) | `manufacturers/production/` | `POST /api/v1/manufacturing/batches`, `/start`, `/complete` | ⬜ |
| 11 | Ingredient selection | new | part of production create payload | ⬜ |
| 12 | Product creation + list + detail | new | `POST /api/v1/products`, `GET /api/v1/products/mine` | ⬜ |
| 13 | Product QR (consumer QR) | new | `GET /api/v1/products/:id/qr` | ⬜ |
| 14 | Product lineage + backward trace | new | `GET /api/v1/products/:id` (lineage included) | ⬜ |
| 15 | Recall impact | new | `GET /api/v1/products/:id/recall-impact` (verify) | ⬜ |
| 16 | Reports | `manufacturers/reports/` | `GET /api/v1/analytics` role-scoped | ⬜ |

## Steps

| # | Step | Detail | Status |
|---|---|---|---|
| 1 | Contracts | `ManufacturerAPI` + `ManufacturingAPI` namespaces; verify against `src/modules/procurement/procurementRoutes.js` + `src/modules/products/productRoutes.js`. | ⬜ |
| 2 | Marketplace + procurement | Search certified stock, request flow with quantity validation. | ⬜ |
| 3 | GRN + inventory | Receipt capture (accept/partial/reject) → inventory rows appear. | ⬜ |
| 4 | Production + products | Ingredient selection from inventory; manufacturing run; product creation with pack/category; product QR screen. | ⬜ |
| 5 | Lineage views | Tree/list view: product → manufacturing batch → ingredient batches → farmers. | ⬜ |
| 6 | Recall impact + reports | What-lot analysis for a product; analytics consumption. | ⬜ |
| 7 | Smoke | Script: certified batch exists → request → approve → ship → deliver → GRN → inventory → production → product → lineage shows farmer. | ⬜ |
| 8 | Commit | similarity groups. | ⬜ |

## Acceptance criteria

- [ ] End-to-end: certified batch → procured → GRN → consumed in production → product with consumer QR → lineage resolves back to farm.
- [ ] Inventory counts (available/reserved/consumed) match backend after each step.
- [ ] `master_plan.md` index updated: A5 ✅.

## Risks / notes

- This is the biggest phase (~16 screens) — split commits per group of 3–4 screens.
- GRN quantity reconciliation rules (accepted vs rejected) come from P9 service — mirror its validation messages.
