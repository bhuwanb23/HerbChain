# HerbChain App — Master Plan: Full App Working

**Date:** 2026-09-07 · **Status:** PLANNING (execution tracked per phase file)
**Companion docs:** [`AUDIT_REPORT.md`](./AUDIT_REPORT.md) (findings), `docs/app/overview.md` + 6 role specs (source of truth for screens).

---

## 1. Situation (one paragraph)

The **backend is done**: `backend/` covers Phases 1–17 (auth/RBAC, batches+QR, transfers, shipments, lab, procurement, products/lineage, consumer verify, admin portal, documents, notifications, blockchain, analytics, offline sync) with 202/202 tests green and live smoke passing. The **front-end is not**: the mobile app (`App/`) has ~60 screen files but only 16 wired routes and a client layer (`services/apiClient.js`) still speaking the dead Flask contract; the web portal (`website/`) has 12 pages wired but calls old `/admin/api/*` endpoints that no longer exist. **The plan: cut over both front-ends to `backend`, wire everything that already exists, then build the missing screens in dependency order.**

## 2. Strategy (agreed direction)

1. **Cutover first** — point `App/` and `website/` at `backend` (port 5000, same as before; only the routes change).
2. **Wire existing before building new** — most orphaned screens need routing + contract rewrite, not a rewrite from scratch.
3. **Dependency order for new screens** — Transporter loop gates everything (custody chain), then Farmer lifecycle, Lab pipeline, Manufacturer chain, shared screens, Admin web upgrade, Consumer portal.
4. **One phase = one file = one PR-sized chunk** — each phase has its own plan file with steps, endpoints, screens, acceptance criteria, and a status table we update as we go.
5. **Backend gaps are called out explicitly** — only 3 small ones (consumer feedback/report-fake, prices, weather). Everything else ships UI against tested endpoints.

## 3. Phase index

| Phase | File | Scope | New screens | Depends on | Status |
|---|---|---|---|---|---|
| **A0** | [`plan/phase_A0_cutover.md`](./plan/phase_A0_cutover.md) | Backend cutover: both front-ends → `backend`; rewrite `apiClient.js` (both); auth context parity; smoke login end-to-end | 0 | — | ✅ completed |
| **A1** | [`plan/phase_A1_navigation.md`](./plan/phase_A1_navigation.md) | Navigation un-orphaning: wire all 60 existing screens into role navigators (tabs/stacks per `overview.md`), route guards per role | 0 | A0 | ✅ completed |
| **A2** | [`plan/phase_A2_transporter.md`](./plan/phase_A2_transporter.md) | Transporter core loop: shipments list/detail/accept → QR scan → pickup → transfer confirm → transit+GPS → delivery+POD → history | ~8 | A1 | ✅ completed |
| **A3** | [`plan/phase_A3_farmer.md`](./plan/phase_A3_farmer.md) | Farmer lifecycle: dashboard, my batches, batch details, timeline, QR view, transfer requests, certifications, notifications, profile | ~6 | A1 | ✅ completed |
| **A4** | [`plan/phase_A4_lab.md`](./plan/phase_A4_lab.md) | Lab pipeline: receive → samples → tests → result entry → supervisor review → certificates → rejection → documents | ~7 | A1 | ⬜ not started |
| **A5** | [`plan/phase_A5_manufacturer.md`](./plan/phase_A5_manufacturer.md) | Manufacturer chain: marketplace → procurement → GRN → inventory → production → products → product QR → lineage → recall impact | ~10 | A1, A2 (shipments) | ⬜ not started |
| **A6** | [`plan/phase_A6_shared.md`](./plan/phase_A6_shared.md) | Shared screens (all roles): notifications center, help & support, settings, documents center, **offline sync center** | 5 | A1 | ⬜ not started |
| **A7** | [`plan/phase_A7_admin_web.md`](./plan/phase_A7_admin_web.md) | Admin web portal upgrade: consume P16 analytics, admin portal endpoints, blockchain explorer, monitors, investigation, recall | ~8 (web) | A0 | ⬜ not started |
| **A8** | [`plan/phase_A8_consumer.md`](./plan/phase_A8_consumer.md) | Consumer portal: product passport, traceability, authenticity score, recall alerts, counterfeit, share; + small backend addition (feedback/report-fake) | ~6 | A0 | ⬜ not started |
| **A9** | [`plan/phase_A9_cleanup.md`](./plan/phase_A9_cleanup.md) | Scope decisions & cleanup: prices/weather/crop modules (build-or-cut), old `backend/` Flask retirement, E2E regression harness | 0 | A2–A8 | ⬜ not started |

**Suggested execution order:** A0 → A1 → A2 → A3 → A4 → A5 → A6 → A7 → A8 → A9 (A6 can run parallel to A3–A5; A7 parallel after A0).

## 4. What "done" means (global acceptance criteria)

- Every screen in `docs/app/overview.md` exists, is routed, and talks to `backend` over the real contract.
- Both front-ends have **zero** calls to dead prefixes (`/herbs/*`, `/crop*`, `/catalogue`, `/admin/api/*`, `/traceability/*`, `/farm/me`, `/prices`, `/weather`, `/recognition/herbs`).
- Each role's full documented journey works end-to-end over HTTP against a running backend (smoke scripts per phase).
- Full backend regression stays green (202/202) throughout — no backend changes except the 3 small additions called out in A8/A9.
- Every phase committed in similarity groups, no co-author lines.

## 5. How we track

- Each phase file has a **Steps table** with `Status` column (⬜/🟨/✅) we update in-session as work completes.
- Each phase ends with: smoke verification + docs update + commits.
- `master_plan.md` phase index `Status` column is the single glance-view.

## 6. Known backend deltas required (only these)

| Gap | Where handled | Size |
|---|---|---|
| Consumer feedback / report-fake endpoint | A8 | ~1 endpoint + 1 model |
| Prices module (mandi price feed) | A9 decision | module or cut |
| Weather module | A9 decision | module or cut |

Everything else — auth incl. OTP/reset, batches, QR, transfers, shipments+GPS+POD, lab full pipeline, procurement/GRN/inventory, manufacturing/products/lineage, verify/consumer, admin portal (21 endpoints), documents, notifications, blockchain, analytics (10 domains + alerts), sync (upload/pull/conflicts) — is **already built and tested**.
