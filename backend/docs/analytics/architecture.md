# Phase 16 — Reporting & Analytics (BI Layer)

> `docs/phase_16.md` implemented. Turns HerbChain from a transaction system
> into an intelligence system: an ETL pipeline fills 10 pre-aggregated
> warehouse tables, the executive AYUSH dashboard and per-domain endpoints
> read ONLY those tables, alert-based analytics feed the Phase 13
> compliance engine, and audience-scoped reports are generated, exported
> and scheduled — all without ever running heavy analytics on production
> tables.

## Architecture

```
Operational tables ──(ETL jobs, worker cadence)──▶ Analytics warehouse (10 tables)
                                                          │
        ┌─────────────────────────────────────────────────┤
        ▼                                                 ▼
  BI read service (/api/v1/analytics/*)          Report engine (/api/v1/reports/*)
  - executive dashboard                          - generate (CSV artifact)
  - 10 domain endpoints                          - download (storage driver)
  - role-scoped slices                           - schedules (worker fires)
  - alert engine → ComplianceAlert               - report_ready notifications (Phase 14)
```

**Core rule (docs/phase_16.md):** dashboards never aggregate on page load.
`src/services/analytics.js` is the *only* writer of the warehouse tables;
`src/services/analyticsBi.js` is the *only* reader in the API layer.

## ETL (src/services/analytics.js)

Ten jobs — production, certification, failures, regional, logistics,
consumption, consumer, traceability, compliance, blockchain — each a full
rebuild of its period buckets (delete + recreate in one transaction):
deterministic, idempotent and race-free.

- **Periods:** current UTC day, ISO week, calendar month, year, lifetime
  `all` rollup — plus the *previous* monthly bucket for MoM trend
  comparisons (the alert engine's species-mismatch spike detector).
- **Rollups:** certification and logistics build a national row
  (`lab_user_id`/`transporter_user_id` null) that aggregates every
  per-entity row; the BI layer excludes it from sums to avoid
  double-counting.
- **Observability:** every run writes an `AnalyticsJobRun` row (rows
  written, duration, status, errors); admin can inspect via
  `GET /api/v1/analytics/jobs/runs` or trigger
  `POST /api/v1/analytics/jobs/run`.
- **Worker:** `analyticsWorker.js` runs the cadence (default 30 min) when
  `ANALYTICS_WORKER_ENABLED` — same pattern as the blockchain/notification
  workers.

## BI service (src/services/analyticsBi.js)

- `GET /api/v1/analytics/dashboard` — executive AYUSH overview: national
  totals (farmers, labs, manufacturers, batches), today stats and
  strategic KPIs (production kg, certification pass rate, supply chain
  on-time, compliance health, traceability, blockchain) + top herbs.
- Domain endpoints: `/herbs`, `/certifications`, `/failures`, `/regions`,
  `/logistics`, `/manufacturers`, `/consumers`, `/traceability`,
  `/compliance`, `/blockchain` — all reading warehouse `all` rows.
- **Role scoping:** admins/regulators see the national picture; farmer,
  lab and manufacturer tokens are automatically narrowed to their own
  slice (self scope). Transporters/retailers/distributors are blocked
  from analytics (`analytics.view` permission gate).
- **Alert engine** (`POST /analytics/alerts/run`, also on the worker):
  raises deduplicated `ComplianceAlert` rows when KPIs breach thresholds —
  lab failure rate > 20%, species-mismatch MoM spike ≥ +300%, counterfeit
  scan volume per product. `created_by_user_id` stays null (auto-raised),
  dedup window prevents alert storms.

## Reports (src/services/analyticsReports.js)

- **Generation** (`POST /api/v1/reports/generate`): CSV is the concrete
  artifact — rendered, stored via the storage driver, recorded as a
  `ReportExport` row (`analytics_*` type) with download URL. pdf/excel are
  accepted and recorded as queued export jobs (pipeline slots, same as
  Phase 13).
- **Audience scoping:** farmers/labs/manufacturers may generate only their
  own report type (`farmer`/`lab`/`manufacturer`, self-scoped); admin-only
  types (compliance, executive_summary, traceability, production,
  logistics, consumer) are 403 for business roles. The `reports.generate`
  permission gates the routes; farmers/labs/manufacturers were granted it
  in `rbac.js`.
- **Scheduled reports:** `POST /api/v1/reports/schedules` (admin-only) —
  daily/weekly/monthly cadence; the worker fires due schedules
  (`next_run_at`), generates the artifact as the owner, notifies
  recipients through the Phase 14 `report_ready` template and advances
  `next_run_at` by the frequency.
- **Download:** `GET /api/v1/reports/:id/download` streams the CSV from
  the storage driver (owner or admin only).

## API surface

| Method | Path | Gate |
|---|---|---|
| GET | `/api/v1/analytics/dashboard` | `analytics.view` |
| GET | `/api/v1/analytics/{herbs,certifications,failures,regions,logistics,manufacturers,consumers,traceability,compliance,blockchain}` | `analytics.view` (+ self scope) |
| POST | `/api/v1/analytics/jobs/run` | `analytics.manage` (admin) |
| GET | `/api/v1/analytics/jobs/runs` | `analytics.manage` (admin) |
| POST | `/api/v1/analytics/alerts/run` | `analytics.manage` (admin) |
| POST | `/api/v1/reports/generate` | `reports.generate` + audience rules |
| GET | `/api/v1/reports` | `reports.generate` |
| GET | `/api/v1/reports/:id/download` | `reports.generate` + owner/admin |
| POST/GET/DELETE | `/api/v1/reports/schedules[/:id]` | `analytics.manage` (admin) |

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `ANALYTICS_WORKER_ENABLED` | `true` | start the ETL worker in-process |
| `ANALYTICS_WORKER_INTERVAL_MS` | `30000` | ETL cadence |
| `ANALYTICS_JOBS_ENABLED` | all | comma-separated job subset |
| `ALERT_*` thresholds | see `constants/analytics.js` | alert-engine bounds |

## Verification

- **tests/analytics** (12 tests, isolated DB): ETL correctness across all
  10 tables + aggregates, idempotency, period grains (daily/weekly/
  monthly/yearly/previous-month/all), executive dashboard KPIs, every BI
  domain endpoint over HTTP, role scoping (own slice), RBAC gates,
  alert dedup (one alert per type/window), MoM spike + counterfeit surge,
  CSV report generation + download + audience scoping, scheduled-report
  firing (artifact + notification + next_run advance), job-run log.
- **Full regression:** 192 tests across 15 suites (one pre-existing
  timing-flake in the blockchain backoff test, passes in isolation).
- **Live smoke (19/19):** dashboard, all domains, scoping, RBAC, alerts,
  report generate/download/schedules over real HTTP.
