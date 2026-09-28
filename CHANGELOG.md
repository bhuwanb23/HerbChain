# Changelog

All notable changes to HerbChain are documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] — 2026-09-27

### Backend (17 phases — complete)

- **Phase 1–2** — Prisma schema (multi-file, 25 domain files), identity &
  auth: registration, login, JWT access/refresh, sessions, RBAC permission
  catalog, admin user management.
- **Phase 3** — Batch management: creation with GPS/photo provenance,
  per-role listing, history timeline.
- **Phase 4** — AI/ML species identification: image upload, provider
  abstraction (mock / Gemini / Azure Custom Vision), farmer confirmation,
  feedback loop.
- **Phase 5** — Dynamic QR engine: signed batch tokens (HS256), single active
  token per batch, validate / transfer / regenerate.
- **Phase 6** — Governed two-party ownership transfers: receiver-initiated
  requests, holder approval, admin recovery, transfer proofs.
- **Phase 7** — Shipments & logistics: assignment, pickup, GPS location
  pings, delays, delivery, proof-of-delivery, failure handling, timelines.
- **Phase 8** — Laboratory certification: receipt, samples, tests, two-level
  review, certificates (COA), rejection records, analytics.
- **Phase 9** — Manufacturer procurement: certified-batch marketplace,
  requests, GRN, inventory with allocations, quality holds.
- **Phase 10** — Products & lineage engine: product masters, formulas,
  manufacturing runs, lots, permanent product QR, backward/forward trace,
  recall impact analysis.
- **Phase 11** — Consumer verification: public `/verify` passport endpoints,
  scan analytics, counterfeit alerts, feedback & report-fake.
- **Phase 12** — Blockchain trust layer: event queue worker, governance
  dashboard, audit trail.
- **Phase 13** — AYUSH admin portal: dashboard, universal search, traceability
  explorers, compliance alerts, investigations, recalls, compliance scores,
  map, audit.
- **Phase 14** — Notifications: inbox, preferences, device tokens, broadcasts,
  queue worker with scheduled reminders/escalations.
- **Phase 15** — Documents: uploads, versions, integrity verification,
  sharing (public consumer passports), retention/archive worker.
- **Phase 16** — Analytics & reporting: 11 warehouse dashboards, report
  generation (CSV), schedules, ETL/threshold worker.
- **Phase 17** — Offline sync: device registration, queue replay, incremental
  pull, conflict detection & resolution, analytics.

### Mobile app (Expo / React Native)

- Role-based navigation for farmer, transporter, lab, manufacturer, admin,
  consumer with per-role bottom tabs.
- Farmer: batches, QR, transfer requests, smart registration (AI-assisted),
  catalogue, batch splitting, farm profile, crop calendar.
- Transporter: trips, shipment lifecycle, pickup/delivery capture, maps.
- Lab: queue, samples, tests, certificates, rejections.
- Manufacturer: marketplace, GRN, inventory, products, lineage, production
  runs, recall impacts.
- Consumer: QR verification and digital product passport.
- Hybrid AI recognition (on-device TFLite + backend re-rank), offline sync
  status bar, i18n scaffolding.

### Website (React + Vite + MUI)

- Admin portal pages: dashboard, users, traceability explorer, blockchain
  explorer, investigations, compliance, alerts & recalls, reports, settings,
  support, integrations, incentives.
- JWT auth with route guards.

### Project / infra

- Isolated-DB test harness (`node --test` + supertest, 18 suites).
- E2E golden-path journey script; live P17 offline-sync smoke tests.
- Demo bootstrap scripts (`scripts/demo.sh`, `scripts/demo.ps1`), Makefile.
- MIT license, contributing guide, security policy, CI.
