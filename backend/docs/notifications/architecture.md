# Notifications & Alerts (Phase 14) — Architecture

**Status: complete.** Scope: `docs/phase_14.md` — the communication layer that
wakes HerbChain up. Schema **105 → 110 models** (5 new in
`prisma/schema/90_notifications.prisma`). Tests: `tests/notifications/`
(14 scenarios over real HTTP), full regression **171/171** across 13 suites.
Live smoke: **19/19** over HTTP.

## 1. Core principle

**Business modules NEVER send notifications directly.** They `publish()` a
queue row inside their own transaction; the worker delivers later.

```
Batch Module            Notification Service             Channels
     │  publish() (queue row)                                    
     ▼                          │ processQueue()                  
  batch row ── same tx ──►  template render ──► in_app inbox row   
                            prefs check        sms stub / email / push
                            retry + backoff    per-channel delivery row
```

This is the exact decoupling of the Phase-12 blockchain queue: the domain
transaction is never slowed by (or failed by) a provider.

## 2. Schema (5 new models)

| Model | Table | Role |
|---|---|---|
| `NotificationTemplate` | `notification_templates` | Seeded event catalog — the app never hardcodes a message |
| `Notification` | `notifications` | In-app inbox row + outbound audit (now has `priority`, `category`, `entity_type/id`) |
| `NotificationQueue` | `notification_queue` | The decoupling boundary: pending → processing → sent/failed, attempts/backoff |
| `NotificationDelivery` | `notification_deliveries` | Per-channel receipt: sent/delivered/failed/read + `provider_ref` |
| `NotificationPreference` | `notification_preferences` | Per-user channel toggles (email/sms/push/in_app) |
| `DeviceToken` | `device_tokens` | Push registry (android/ios/web) |
| `ScheduledNotification` | `scheduled_notifications` | Future reminders + escalation hops |
| `NotificationMetric` | `notification_metrics` | Daily aggregates for analytics |

Migration: `20260905093956_phase14_notifications`.

## 3. Event catalog (`src/constants/notifications.js`)

21 templates across 8 categories — batch, shipment, ownership, lab,
manufacturer, recall, user, security — each with `{placeholder}` bodies, a
channel strategy (SMS for rural field events, email for official docs, push
for live workflow) and a priority (`LOW`…`CRITICAL`). `seedTemplates()` is
idempotent (seed + every suite seeds its own catalog).

## 4. Pipeline

1. **publish(tx, …)** — resolves the template, checks the recipient's
   preference and enqueues one queue row per allowed channel. **Fail-open**:
   a missing template can never break the business transaction.
2. **processQueue()** (worker tick) — claims due rows atomically, renders the
   body, writes the `Notification` inbox row (+ delivery), and for sms/email/
   push sends through `src/services/notification/providers.js` (stub
   providers capture messages in memory — Twilio/FCM/SMTP are swap-ins).
3. **Retry/backoff** — 1m/5m/15m/30m/1h then `FAILED`; `requeueFailed()`
   resets. Provider outages are simulated in tests via a failure seam.
4. **Inbox API** — list/unread/mark-read/mark-all/filter-by-category; device
   registration/revocation; per-user preferences.

## 5. Scheduled + reminder engine

- Pickup reminders ~24h before `Shipment.scheduled_pickup_at`.
- Certificate-expiry reminders 30d before `Certification.expiry_date`.
- Scans are idempotent (per-entity dedup — SQLite-safe, no JSON-path
  filters) and run on every worker tick.

## 6. Escalation ladder

A shipment past `expected_delivery_at` escalates: **transporter** (now) →
**destination lab/manufacturer** (after 4h) → **AYUSH admins** (after 12h,
CRITICAL `security_alert`). Each hop is a `ScheduledNotification` tagged
`hop0/1/2` so re-scans never double-book.

## 7. Analytics + admin center

`notification_metrics` aggregates sent/delivered/failed/read per
type + channel per day. `/admin/analytics` returns totals + channel usage +
read/delivery/failure rates; `/admin/center` surfaces CRITICAL alerts,
failed deliveries, security events, recall notices and the failed queue.
Broadcasts (`/send`) publish a template to every user of a role; both are
gated by `notifications.manage` (admin), while every authenticated role gets
`notifications.view` (own inbox).

## 8. Domain wiring (where publish() fires)

| Domain service | Event → recipients |
|---|---|
| `batches.js` | `batch_created` → farmer |
| `qrEngine.js` / `transfers.js` | `ownership_transferred` (old + new holder), `transfer_requested` → receiver, `transfer_rejected` → parties |
| `shipments.js` | `shipment_assigned` → transporter, `shipment_received` → destination |
| `lab.js` | `certificate_issued` → farmer + AYUSH admins, `batch_rejected` → farmer + AYUSH |
| `procurement.js` | `request_submitted` → holder (lab), `request_approved` → manufacturer |
| `products.js` | `product_created` → manufacturer + AYUSH |
| `adminPortal.js` | `recall_issued` CRITICAL → affected manufacturers + certifying labs + AYUSH |
| `verification.js` | `account_approved` → the user |

## 9. Verification

- **171/171** across all thirteen suites (14 new: queue pipeline + capture,
  template rendering, preference gates, provider outage → FAILED → requeue,
  inbox lifecycle, devices, scheduled + both reminder scans, the full
  escalation ladder, broadcast + analytics + RBAC, and end-to-end domain
  wiring for batch/transfer/certify/recall).
- **Live smoke 19/19** over HTTP: device register → prefs round-trip →
  batch → inbox notice + unread → mark-all-read → admin broadcast → recall →
  CRITICAL to manufacturer + admin → analytics → admin center → 403 gate →
  manual drain.

Two bugs the tests caught: (1) publish() originally threw on a missing
template, which broke every other suite's transactions on a fresh DB — made
fail-open per the core principle; (2) the escalation ladder's dedup key
collided hop0/hop1 (same event + entity) — hops are now tagged `hop{i}`.
