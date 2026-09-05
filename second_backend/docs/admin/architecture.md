# Phase 13 — AYUSH Admin Portal (Regulatory Monitoring System)

Status: **LIVE** — the control tower is mounted at `/api/v1/admin/portal`;
`74_regulatory.prisma` adds 6 models (`ComplianceAlert`,
`InvestigationCase`, `InvestigationEntity`, `ComplianceScore`,
`AdminNotification`, `ReportExport`) + `User.admin_role` + the extended
`Recall` statuses; migration `20260904180000_phase13_admin_portal`, schema
**99 → 105 models** (Phase 14 later takes the schema to 110). Tests: `tests/admin/` (15 scenarios over real HTTP),
part of `npm test` (157 cases total). A live smoke (94 checks) walked the
spec's end-to-end example: complaint → product search → traceability →
batch → lab results → ownership chain → blockchain verify → recall with
auto-impact → regulatory action.

Spec: `docs/phase_13.md`.

## 1. What this phase is

Phase 13 gives AYUSH a centralized regulatory control tower. AYUSH is
**never a batch owner** and the portal is **not involved in ownership
transfers** — it monitors the entire ecosystem, searches any entity, views
full traceability, identifies risks, investigates issues and takes
regulatory actions. Everything answers in seconds: where did this product
originate, which farmers supplied it, which batches failed certification,
which transporter handled a shipment, which products contain a recalled
batch, which labs have unusual rejection rates.

## 2. Core philosophy (from the spec)

1. **Read-heavy oversight, write-light enforcement.** The portal is
   primarily a query surface over the existing phases; writes are limited
   to regulatory actions (alerts, recalls, investigations, report jobs)
   and every one of them is audit-logged.
2. **Not every admin gets full access.** `User.admin_role` introduces the
   hierarchy: `super_admin` (system governance, users, policy) >
   `regulatory_officer` (traceability, compliance, investigations) >
   `state_officer` (state-level monitoring) > `auditor` (read-only,
   reports, blockchain verification). A legacy admin with a NULL
   `admin_role` counts as `super_admin`, so existing installs keep working.
3. **Risk is computed, not guessed.** The compliance-alert rules engine
   scans live data for the spec's alert catalogue (repeated batch
   failures, species fraud, invalid transfers, duplicate registrations,
   suspicious QR scans, recall events, certificate expiry, high lab pass
   rates) and dedupes by open alert per type+entity.
4. **Regulatory action is automatic where possible.** Issuing a batch
   recall discovers the blast radius itself: consuming runs → products →
   lots → `AffectedProduct` rows → `Product.verification_status =
   RECALLED` (so the public passport flips) + verification cache purge +
   `RecallScope` rows + a `recall_event` alert + an AYUSH notification —
   one transaction.

## 3. Administration hierarchy

Tiers are mapped in `src/constants/admin.js`
(`ADMIN_TIER_CAPABILITIES`) and enforced per-route by
`requireCapability` in `src/services/adminPortal.js`:

| Capability | auditor | state_officer | regulatory_officer | super_admin |
|---|---|---|---|---|
| dashboard / search / traceability / shipments / failed-certifications / map | ✅ | ✅ | ✅ | ✅ |
| compliance alerts (read) / scores | ✅ | — | ✅ | ✅ |
| compliance alerts (write) / investigations / recalls / notifications | — | — | ✅ | ✅ |
| reports / audit / users | ✅ (reports) | — | — | ✅ |

Non-admins get 403 on every portal route. RBAC also gained the
`labs.audit`, `manufacturers.audit`, `shipments.view`,
`certificates.review`, `compliance.manage`, `reports.export` and
`admin.search` permissions on the `admin` role.

## 4. Dashboard

`GET /admin/portal/dashboard` — `{ kpis, widgets, compliance_surface }`:

- **KPIs**: total farmers/labs/manufacturers/transporters, active
  batches, active shipments, certified/rejected batches, products created
  vs recalled, blockchain transactions, failed certifications, pending
  approvals, open compliance alerts.
- **Widgets**: farmers (registered / verified / new-30d, state-scoped via
  the farmer's registered Address), labs (active, certification count,
  failure rate %, species mismatches), manufacturers (active, products,
  inventory volume), logistics (in transit / delivered / failures).
- **Compliance surface**: suspicious activities (open HIGH/CRITICAL
  alerts) and certificates expiring within the warning window.
  Dashboard access also sweeps the alert rules (once a minute).

## 5. Universal search + geographic search

`GET /admin/portal/search` — one box across batches (code/id), products
(code/name/sku), users (name/email/phone), shipments (number), certificates
(number), species, recalls — categorized results with per-category counts.
Geographic mode (`radius_m` + `lat` + `lng`) returns batches within a GPS
radius (haversine).

## 6. Traceability explorers

- `GET /admin/portal/batches/:id` — creation + full ownership history
  (batch events with actors and from→to), lab testing (samples → tests →
  results → reviews), certificates (with active flag + issuer), rejection
  record, **forward products** (every run that consumed the batch + its
  product/lot), recall impacts and the farmer's compliance score.
- `GET /admin/portal/products/:id` — formula, manufacturing journey
  (runs → lots → holders), and for every ingredient herb batch: quantity
  used, certificate, farmer and the ownership chain — the spec's
  "product → manufacturing batch → raw herb batches → lab certificates →
  ownership transfers → farmers" reconstruction.

## 7. Shipments + risk alerts

`GET /admin/portal/shipments` — every shipment with transporter,
origin/destination parties, current location (last tracking point),
expected vs actual delivery and **computed risk flags**: `delayed`
(expected delivery passed), `inactive` (no movement in 24h),
`route_deviation` (>150 km off the origin→destination line),
`delivery_failure` (from `FailedDeliveryLog`). Filter by status or risk;
a per-flag summary is returned.

## 8. Failed certifications

`GET /admin/portal/failed-certifications` — every rejected batch with
farmer, species, reason, description, action and date; reason categories
(`heavy_metals`, `contamination`, `species_mismatch`, `microbial`,
`other`) mapped from the rejection vocabulary, with per-category counts
and category/state filters.

## 9. Compliance alerts + rules engine

- `GET/POST /admin/portal/compliance-alerts` (+ `PATCH /:id`) — list
  (status/severity/type filters, open-by-severity summary), manual alert
  creation and acknowledge/resolve. `POST .../run-rules` sweeps the rules
  engine explicitly.
- Rules engine (`runAlertRules`): repeated batch failures per farmer,
  species fraud (mismatch logs), invalid transfers (rejected/cancelled
  requests), duplicate registrations (shared phone), suspicious QR scans
  (INVALID consumer-scan floods), recall events (mirrored from active
  recalls), certificate expiry (warning window) and high lab pass rates
  (≥20 certifications, zero failures). Dedupe = one open alert per
  type + entity.

## 10. Recall management center

- `POST /admin/portal/recalls` — `{ ref_type: batch|product|product_lot,
  ref_id, reason, severity }`. The referenced entity must exist. A batch
  recall auto-discovers every consuming run's product and lot:
  `AffectedProduct` upserts (impact_type `regulatory`), `RecallScope`
  rows, `Product.status = recalled` + `verification_status = RECALLED`,
  passport-cache purge, a `RECALLED` lot event, a `recall_event` alert and
  a broadcast AYUSH notification — one transaction, plus `RECALL_ISSUED`
  in the audit log.
- `PATCH /recalls/:id` — advance status
  (`draft | issued | active | resolved | closed`); resolving a batch
  recall clears the open `AffectedProduct` rows.
- `GET /recalls` — paged list with scopes and the creator's name.

## 11. Investigations

`POST/GET /investigations` (+ `GET/PATCH /:id`) — `InvestigationCase`
(INV-…) with case_type (complaint | fraud | recall | audit | other),
severity, assignee and an ordered set of `InvestigationEntity` rows
(subject | witness | affected) per involved batch/product/user/shipment.
Opening a case is audit-logged (`INVESTIGATION_OPENED`).

## 12. Compliance scores

`POST /admin/portal/scores/compute` — computes (and upserts)
`ComplianceScore` for every farmer/lab/manufacturer/transporter:
farmers lose points for rejected batches, species mismatches and open
alerts; labs for failure rate, mismatches and alerts; manufacturers for
active recalls, open impacts and alerts; transporters for failed and
delayed jobs. Grades: A ≥90, B ≥75, C ≥60, D below. `GET /scores` lists
them (ascending score — worst first).

## 13. Notifications + reports

- `GET /admin/portal/notifications` (+ `POST /:id/read`) — the AYUSH
  feed. Broadcast rows (recipient null) surface for every admin; recall
  events, high-severity alerts and system notices land here
  automatically.
- `POST /admin/portal/reports` — `report_type` (farmer_registrations,
  certification_trends, failed_tests, popular_herbs,
  manufacturing_trends, shipment_performance) × format. **CSV is
  generated live** (RFC-4180 quoting) and stored through the storage
  driver with a ready `download_url`; pdf/excel are recorded as queued
  export jobs (pipeline slots). `GET /reports` lists the requester's
  jobs.

## 14. Ecosystem map + audit

- `GET /admin/portal/map` — farm plots (GPS), labs, manufacturers and
  shipment routes (origin/destination derived from tracking breadcrumbs
  when the row GPS columns are empty).
- `GET /admin/portal/audit` — the AYUSH audit trail filtered by action /
  target type: every admin action (ALERT_CREATED, RECALL_ISSUED,
  INVESTIGATION_OPENED, REPORT_EXPORTED, …) with actor, target and meta.

## 15. Models (`74_regulatory.prisma`)

`ComplianceAlert` (alert_no ALT-…, type, severity, status, polymorphic
entity refs, detail_json, resolver), `InvestigationCase` (case_no INV-…,
type, severity, status, assignee) + `InvestigationEntity` (case child,
role), `ComplianceScore` (unique per entity_type+entity_id, score,
grade, factors_json), `AdminNotification` (broadcast or per-admin feed),
`ReportExport` (type, format, status, file_url, row_count). All
polymorphic refs are plain columns — no relations, matching the
blockchain/verification convention. `User.admin_role` lives on
`01_identity.prisma`; `Recall.status` gained `active` and `resolved` on
`80_compliance.prisma`.

## 16. Supersession notes

- Recalls existed as a model since Phase 8 but were never written by a
  service; the Phase-13 recall center is the first consumer, extending
  the status code list without touching Phase-10's product-level recall
  flagging (`AffectedProduct` + `verification_status`).
- The old single-admin model (one `admin` role bypassing grants) still
  works: a legacy admin maps to `super_admin` automatically.
- Consumer counterfeit signals (Phase 11 `CounterfeitAlert`) feed the
  Phase-13 alert center through the suspicious-scan rule; the blockchain
  verification UI (Phase 12) is reached by admins through the existing
  `/api/v1/blockchain/verify/:hash` endpoint (`blockchain.view`).