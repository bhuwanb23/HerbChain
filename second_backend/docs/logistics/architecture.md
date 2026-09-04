# Phase 7 — Shipment & Logistics Architecture

Status: **implemented end-to-end** (schema `20260904120000_phase7_logistics`).
Spec: `docs/phase_7.md`. Supersedes the phase-1 placeholder where `Shipment`
was a thin `requested → picked_up → in_transit → delivered` row.

## 1. Core philosophy (from the spec)

> Ownership and Shipment are separate concepts. Never mix logistics data with
> ownership data.

- **Ownership** (WHO holds the goods) lives on the custody chain built in
  phases 5–6: `Batch.current_holder_user_id` + `QrToken` (one ACTIVE version)
  + `TransferRequest` (two-party consent). GPS here is optional context.
- **Shipment** (WHERE the goods physically are + WHO carries them) lives in
  the logistics tables. It is *route evidence*, never a custody mechanism.

Consequence, enforced in code: pickup/delivery endpoints validate the
logistics context (assignment, route state, geofence, photo, QR) and then
**REQUIRE an already-approved two-party TransferRequest** before running the
governed hop through the Phase-6 QR engine. A shipment can never move
ownership by itself — the `transfer_not_requested` guard (`409`) proves it.

## 2. Data model (all in `30_logistics.prisma`)

The `Shipment` row carries the route snapshots + state machine:

```
requested → assigned → accepted → arrived_for_pickup → picked_up
         → in_transit → arrived_destination → delivered → completed
failure paths: cancelled | failed | rejected
```

| Table | Purpose |
|---|---|
| `Shipment` | Request/route/state row (`shipment_no SHIP-YYYY-000001`, type, priority, origin/destination parties + GPS, `geofence_radius_m`, schedule vs actual times) |
| `TransporterAssignment` | One pending job per shipment (`pending → accepted \| declined \| cancelled`); reassignment allowed after a decline |
| `ShipmentTrackingPoint` | Append-only GPS breadcrumbs (speed/accuracy, offline `captured_at` buffering) |
| `PickupEvent` | Evidence at handover: GPS + photo + remarks + transporter |
| `DeliveryEvent` | Receiver identity + role + GPS at the scan moment |
| `ProofOfDelivery` | 1:1 per shipment: receiver name/signature, receiver + delivery photos, remarks |
| `ShipmentEvent` | Append-only timeline (`REQUESTED`, `ASSIGNED`, …, `PICKED_UP`, `STARTED`, `GPS_UPDATED`, `DELAYED`, `DELIVERED`, `COMPLETED`, failure codes) with typed `event_data` JSON |
| `ShipmentDocument` | Invoice / lab request / transfer document / certificate |
| `ShipmentMetric` | Expected vs actual hours + `delay_minutes`/reason computed at completion |
| `FailedDeliveryLog` | Why a delivery failed (receiver unavailable / wrong batch / qc / damaged / other) + photo |

Origin/destination users are real FKs (`from_user_id`/`to_user_id`) with role
snapshots (`from_role`/`to_role`) so the audit trail survives re-roles.

## 3. Service layer (`src/services/shipments.js`)

Every mutation writes the shipment state **and** an append-only
`ShipmentEvent` + `AuditLog` row in one transaction.

| Call | Guards (beyond role) |
|---|---|
| `createShipment` | lab / manufacturer / admin only; batch must exist; destination = requester (admin may override); destination GPS falls back to the receiver's warehouse |
| `assignTransporter` | requester or admin; target is an active transporter; closes previous open assignments |
| `acceptShipment` / `declineShipment` | assigned transporter with a PENDING assignment |
| `arriveForPickup` | assigned transporter; shipment `accepted` |
| `recordPickup` | assigned transporter; shipment accepted/arrived; phase-leg sanity (`PICKUP_TRANSFER_TYPE`); photo belongs to transporter → **governed hop ORIGIN → transporter** (approved request + QR) → evidence rows |
| `addTrackingPoint` | assigned transporter; first breadcrumb after pickup flips `picked_up → in_transit` (+`STARTED`) |
| `recordDelay` | assigned transporter; coded reason |
| `arriveDestination` | assigned transporter; pre-delivery marker |
| `deliverShipment` | destination party only; **geofence check** (Haversine ≤ fence, admin override) → **governed hop TRANSPORTER → destination** → delivery event + POD upsert → auto-`completeShipment` |
| `completeShipment` | internal after `delivered`: computes expected vs actual hours + delay minutes, records `ShipmentMetric` |
| `attachDocument` / `attachPod` | any shipment party; POD only after delivered/completed |
| `failShipment` / `cancelShipment` | parties; coded reasons; terminal-state guards |

## 4. Pickup & delivery = Phase-6 orchestration

```text
pickup:  shipment ctx (assignment + route + photo) →
         executeTransfer(transporter, { token: farmer's ACTIVE QR })
         → TransferRequest(FARMER_TO_TRANSPORTER) completed atomically:
           batch holder → transporter, QR v1 dead, v2 born, TRANSFER event,
           audit + ledger anchor  (all inside the engine transaction)
deliver: receiver scans the transporter's ACTIVE QR inside the fence →
         executeTransfer(lab, { token }) → TransferRequest(TRANSPORTER_TO_LAB)
         completed → batch holder → lab, QR v2 dead, v3 born
```

The pre-approval sequence is unchanged from Phase 6: the receiving party
requests custody (`POST /transfers/request`), the current holder approves
(`POST /transfers/approve`), and only then can the shipment endpoint execute
the hop. Both requests are normally raised before the physical event: the
transporter requests the pickup leg (approved by the farmer), the destination
party requests the delivery leg once the goods are in transit (approved by
the transporter).

## 5. API surface (`/api/v1/shipments`)

```
POST   /shipments                    create (lab / manufacturer / admin)
GET    /shipments                    party-scoped list (?status= & role=)
GET    /shipments/:id                detail + route + full timeline
GET    /shipments/:id/timeline       append-only event log
POST   /shipments/:id/assign         requester/admin assigns transporter
POST   /shipments/:id/accept         transporter accepts
POST   /shipments/:id/decline        transporter declines -> re-open
POST   /shipments/:id/arrive         transporter at origin (GPS)
POST   /shipments/:id/pickup         governed hop ORIGIN -> transporter
POST   /shipments/:id/location       GPS breadcrumb (offline-safe sync)
POST   /shipments/:id/delay          reason (+ minutes / remarks)
POST   /shipments/:id/arrive-destination
POST   /shipments/:id/deliver        governed hop inside the geofence
POST   /shipments/:id/pod            proof of delivery (post-delivery)
POST   /shipments/:id/documents      invoice / lab request / certificate
POST   /shipments/:id/fail           failure path (coded reason + photo)
POST   /shipments/:id/cancel         pre-pickup cancellation
```

Role gates are inside the service (explicit party checks) rather than RBAC
grants, matching the transfers module; admin overrides are explicit.

## 6. Geo-fencing

Delivery is only accepted when the receiver's GPS is inside
`geofence_radius_m` (default `SHIPMENT_FENCE_RADIUS_M = 100 m`) of the
shipment's destination GPS (Haversine). Violations return
`geofence_violation` **before** any custody change; the approved transfer
request survives the refusal so an in-fence retry succeeds without
re-approval.

## 7. Offline support

Breadcrumbs buffer on the driver device and sync via `POST
/shipments/:id/location` with a past `captured_at`. The server treats GPS as
tracking evidence only — ownership still finalizes only after server-side
validation of an approved request + QR scan (spec: "Ownership should still
only finalize after server validation").

## 8. Verification

- Schema: 73 models at Phase 7 (80 after Phase 8, 87 after Phase 9); migration `20260904120000_phase7_logistics`
  applied on the scratch DB (data-preserving `RedefineTables` on `shipments`).
- Suites: **96/96** across auth, batches, identification, qr, transfers,
  shipments (13 new logistics cases: full journey, no-custody-without-request
  guard, geofence refusal + in-fence retry, transporter/destination role
  guards, status machine, decline/reassign, failure + cancellation, GPS route
  + offline sync, delay metrics, POD/docs, party-scoped reads, admin
  intervention).
- Live smoke: **29/29** over real HTTP — HERB-2026-000001: farmer → governed
  pickup (QR v1→v2) → breadcrumbs → delay → governed delivery in-fence
  (QR v2→v3) → lab custody, POD, documents, timeline, admin oversight.
