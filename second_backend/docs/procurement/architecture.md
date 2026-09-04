# Phase 9 — Manufacturer Procurement (Raw Material Intake)

Status: **LIVE** — `/api/v1/manufacturer/*` mounted, 7 new models
(`53_procurement.prisma`), migration `20260904140000_phase9_procurement`,
schema **80 → 87 models**. Tests: `tests/procurement/` (6 suites-cases… 6
scenarios over real HTTP), part of `npm test` (115 cases total).

Spec: `docs/phase_9.md`.

## 1. What this phase is

Certified herb batches become manufacturing inputs. Everything upstream is
already governed: farmers create batches (Phase 3), custody moves only via
approved two-party transfers + QR rotation (Phase 5/6), shipments are
logistics records that orchestrate those hops (Phase 7), and the lab adds a
certificate of analysis (Phase 8). Phase 9 is the **marketplace + intake**
layer: a manufacturer views only certified, cert-valid batches still held by
a lab, requests a quantity, the lab (current holder) approves full or
partial, the system locks the quantity (reservation), auto-creates the
`LAB_TO_MANUFACTURER` shipment, and after the governed delivery the
manufacturer records a Goods Receipt Note (GRN) that opens its inventory.

## 2. Core philosophy (from the spec)

1. **A manufacturer never buys a database record.** It acquires
   *certified batch + ownership + certificate + full history* — every gram
   entering manufacturing stays traceable to its farmer, lab certificate and
   custody chain (`docs/phase_9.md`).
2. **Only certified material is procurable.** The gate is
   `Batch.test_status = certified` **and** an active, non-expired
   `Certification`. Expiry blocks both *requesting* and *approving*
   (`certificate_expired` 409).
3. **Procurement never moves custody by itself.** Request → approval locks
   quantity and creates the shipment, but the physical handover runs through
   the Phase-7 delivery engine with an approved Phase-6 TransferRequest +
   QR rotation — exactly like Phase 7 pickup/delivery. Ownership changes only
   when the manufacturer scans at delivery.
4. **Reservation prevents overselling.** One `BatchInventory` availability
   pool per batch (created lazily from the certified quantity). Approval
   decrements available → reserved inside a transaction with the allocation
   row; a second manufacturer can never approve more than remains, and
   partial approvals are first-class (`partially_approved`).
5. **Inventory never changes directly.** Every movement (received, reserved,
   released, consumed, adjusted, discarded) is an append-only
   `InventoryTransaction` row; states on the wire are *derived*.

## 3. Domain flow

```
Certified batch (held by lab)          test_status=certified + valid COA
        │  manufacturer views marketplace (available qty from pool)
        ▼
BatchRequest  REQ-YYYY-000001          pending → approved | partially_approved
        │  holder (lab) approves          | rejected | cancelled → fulfilled
        ▼
InventoryAllocation  RESERVED           pool: available −qty / reserved +qty
        │  + Shipment auto-created      LAB_TO_MANUFACTURER (lab → manufacturer),
        │                                 requested_by = manufacturer (origin lab)
        ▼
Phase-7 shipment journey                assign → accept → arrive → pickup (QR hop
        │                                 lab→transporter) → in_transit →
        │                                 arrive-destination → deliver (QR hop
        │                                 transporter→manufacturer, inside geofence)
        ▼
GoodsReceipt (GRN)  GRN-YYYY-000001     accepted qty → InventoryItem + RECEIVED row
        │                                 rejected qty returns to the pool;
        │                                 request/allocation → fulfilled
        ▼
InventoryItem  (per manufacturer, batch)  available/reserved/consumed/discarded
        │                                 reserve → release → consume → discard → adjust
        ▼
Ready for production                     recall-readiness: stock + consumed + products
```

## 4. Models (`53_procurement.prisma`)

| Model | Table | Role |
|---|---|---|
| `BatchRequest` | `batch_requests` | Manufacturer's quantity request; statuses `pending → approved \| partially_approved \| rejected \| cancelled → fulfilled` |
| `BatchInventory` | `batch_inventories` | One availability pool per batch at the holder: total/available/reserved/consumed |
| `InventoryAllocation` | `inventory_allocations` | Qty locked for one approved request: `reserved → fulfilled \| cancelled` |
| `GoodsReceipt` | `goods_receipts` | GRN: received vs accepted vs rejected qty (+ reason), links batch/shipment/request |
| `InventoryItem` | `inventory_items` | Manufacturer-side stock of a batch (unique per manufacturer+batch) |
| `InventoryTransaction` | `inventory_transactions` | Append-only ledger: received/reserved/released/consumed/adjusted/discarded |
| `QualityHold` | `quality_holds` | Quarantine (`active → resolved`); while active no reserve/consume |

`Shipment.procurement_request_id` (1:1, unique) links the auto-created
shipment back to the request. Back-relations were added on `Batch`
(`batch_requests`, `batch_inventory`, `inventory_allocations`,
`goods_receipts`, `inventory_items`, `quality_holds`) and on `User`
(manufacturer sides of requests/receipts/items/holds).

## 5. Rules baked into the service (`src/services/procurement.js`)

### Marketplace (`listCertifiedBatches`, `certifiedBatchDetail`)
- Only `test_status=certified`, `phase=at_lab`, with an **active**,
  non-expired certificate, in `certifications` (latest COA) — filters:
  species / batch code / location / lab / farmer / harvest date /
  minimum available.
- Each listing computes the batch pool lazily
  (`ensureBatchInventory`: total = lab receipt qty, else batch weight) and
  shows remaining available.
- Dossier gives the full traceability history (farmer, custody timeline,
  lab receipt, species verifications, shipments) *before* procurement.

### Request → approval
- `requestBatch`: manufacturers only (`forbidden` otherwise); positive qty;
  certificate gate; refuses with `no_stock` when the pool has nothing left.
  Writes `REQUEST_CREATED` audit.
- `approveRequest`: only the **current holder** (lab) or admin approves.
  Approved qty = min(requested, available) → `approved` vs
  `partially_approved`; clamps over-requests automatically.
  Inside one transaction: allocation `reserved`, pool available−/reserved+,
  request decided, `REQUEST_APPROVED` audit — then auto-creates the shipment
  through `createShipment(…, { requesterUserId })` (origin = lab snapshot,
  destination + requester = the manufacturer; destination GPS falls back to
  the manufacturer's active warehouse for geo-fencing).
- `rejectRequest` (holder/admin), `cancelRequest` (requester/holder/admin
  while nothing is in transit) — cancelling returns the reservation to the
  pool and closes a still-open auto-shipment.

### GRN (`receiveBatch`)
Preconditions, in order: manufacturer (or admin) → shipment exists, is a
batch shipment → caller is the destination party → shipment `delivered`/
`completed` → batch certificate still valid.
Delivered qty = shipment load; accepted defaults to received minus rejected
(partial acceptance with reason is supported). Inside the transaction:
GRN row + code, allocation → `fulfilled`, pool reserved→consumed(accepted),
rejected qty → available, request → `fulfilled`, InventoryItem upsert +
`received` ledger row, then the traceability layer:
`MATERIAL_RECEIVED` BatchEvent, `GRN_CREATED` + `INVENTORY_RECEIVED`
audits, blockchain anchors `MATERIAL_RECEIVED` / `BATCH_ACCEPTED` /
`INVENTORY_ENTERED` (spec §15).

### Inventory operations (`listInventory`, `reserve/release/consume/discard/adjust`)
- Ownership of the item is enforced (only the holding manufacturer writes).
- `reserve`: available → reserved (`insufficient_stock` if short).
- `release`: reserved → available.
- `consume`: reserved first, then available (falls back); used in
  production. Both blocked while an `active` QualityHold exists
  (`quality_hold` 409).
- `discard`: available → discarded (spoilage/damage with reason).
- `adjust`: recount — sets observed available, logging the signed delta.
- Every op appends its `InventoryTransaction` + audit row. Wire state is
  derived (`constants/procurement.js inventoryState`):
  AVAILABLE / RESERVED / IN_PRODUCTION / CONSUMED / DISCARDED / EMPTY.

### Quality holds (`placeQualityHold`, `resolveQualityHold`)
Manufacturer quarantines a batch it holds (reason required, one active hold
per batch+manufacturer, `hold_exists` on duplicates). While active, reserve
and consume refuse with `quality_hold`. Resolution is audited.

### Oversight reads
- `listRequests`: manufacturers see their own; labs see requests for
  batches they currently hold; admin sees all; other roles 403.
- `dashboard`: available/consumed inventory, open requests (pending +
  approved), incoming shipments, active holds, expiring certificates
  (within `CERT_EXPIRY_WARNING_DAYS`).
- `analytics`: inventory levels, top herbs, 6-month consumption, supplier
  labs/farmers, certification success, consumption/utilization KPIs,
  avg procurement time.
- `recallStatus(batch)`: where a batch sits today (stock + receipts +
  request count + products that consumed it via `ProductLotBatchLink`) so
  an AYUSH recall can be answered instantly (spec §13).

## 6. API surface (`src/modules/procurement/`, mount `/api/v1/manufacturer`)

- `GET /certified-batches` (+`?species=&batch_code=&location=&lab_user_id=&farmer_id=&harvest_from=&harvest_to=&min_available=`) — marketplace
- `GET /certified-batches/:batchId` — traceability dossier
- `POST /request-batch` · `GET /requests` (role-scoped)
- `POST /requests/:id/approve` · `POST /requests/:id/reject` ·
  `POST /requests/:id/cancel`
- `POST /receive` — GRN
- `GET /inventory` · `GET /inventory/history` (`?inventory_id=`)
- `POST /inventory/:id/reserve|release|consume|discard|adjust`
- `POST /quality-holds` · `POST /quality-holds/:id/resolve`
- `GET /dashboard` · `GET /analytics` · `GET /recall/:batchId`

Permissions (RBAC seed): manufacturer →
`procurement.view/request/receive/inventory`; lab → `procurement.approve`;
admin bypasses grants. Routes only carry `requireAuth` +
`requirePermission`; all role/scope rules are re-verified in the service.

## 7. Verification

- `npm test` → **115/115** across eight suites; the procurement suite
  (`tests/procurement/`, isolated DB per file) covers: full journey
  marketplace → request → approval → auto-shipment → governed pickup and
  delivery (incl. geo-fence refusal with a surviving approved request) →
  partial GRN → inventory/ledger; partial approval + reservation
  (two manufacturers share one pool, cancellation releases it); certificate
  expiry blocking request **and** approval; quality-hold quarantine +
  production ops ledger; role/scope guards; dashboard/analytics/recall.
- Live smoke over real HTTP (**38/38**): seeded DB → HERB-2026-000001
  farmer → lab certify → manufacturer request/approve → assigned transport
  → QR pickup/delivery (rotation to v5) → GRN (11 accepted / 1 rejected) →
  inventory AVAILABLE → reserve/release/consume → hold/resolve →
  dashboard/analytics/recall all read coherently.
- The test template DB stays migration-only (each suite bootstraps its own
  users/species/parameters); the smoke seeds its own copy.
