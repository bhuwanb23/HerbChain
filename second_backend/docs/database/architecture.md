# HerbChain Database Architecture (Redesign)

Status: **LIVE** — `package.json` points at `prisma/schema/` (18 files, 80
models). Migrations are applied on the scratch DB and the backend is built
phase by phase against these models: Phase 2 auth → Phase 3 batches →
Phase 4 identification → Phase 5 dynamic QR → Phase 6 governed transfers →
Phase 7 logistics/shipments → Phase 8 lab certification
are live (see docs/auth, docs/batch, docs/identification, docs/qr,
docs/transfers, docs/logistics, docs/lab). The legacy `schema.legacy.prisma`
+ `migrations.legacy/` + old routes/tests are kept as the porting reference.

## 1. Why a redesign

The current schema is a 1:1 port of the Flask demo models (12 tables). It was
correct for a demo but has production gaps:

| Gap today | Fix in the redesign |
|---|---|
| Roles are one string on a flat `users` table — a farm with 2 farmers means 2 rows | Hybrid actor model: `User` (account) + optional 1:1 per-role profile rows (`FarmerProfile`, `TransporterProfile`, `LabProfile`, `ManufacturerProfile`) |
| Synonyms stored as a JSON blob; medicinal uses as free text | Normalized `SpeciesSynonym` rows + `MedicinalUse` many-to-many |
| Lab results are loose free-text columns | `TestParameter` vocabulary + one `LabTestResult` row per measured value |
| Batch data and mutable state in two tables; events mixed in | Phase/holder/test-status live on `Batch` (single source of truth); every change appended to the immutable `BatchEvent` timeline |
| No orders/invoices/payments | Full commerce domain (paise-based money, wallets) |
| No notifications, sessions, API keys, audit log, licenses, recalls, warehouses, plots/crop-plan activity | Dedicated domains below |
| Money as Float | Integer minor units (`*_paise`) — no float rounding bugs |
| Human-readable IDs doubled as PKs | Surrogate `cuid()` PKs; business keys (codes, SKUs, order numbers) are separate UNIQUE columns |

## 2. Conventions (applied everywhere)

1. **PKs**: `id String @id @default(cuid())` on every table. Business keys are
   separate UNIQUE columns (`code`, `order_no`, `sku`, …) so they stay
   renameable and never leak into FKs.
2. **Timestamps**: `created_at` on everything; `updated_at` on mutable rows only.
   Append-only records (BatchEvent, StockMovement, Payment, WalletTransaction,
   AuditLog, FarmActivity) deliberately have **no** `updated_at`.
3. **Soft delete**: `deleted_at` on mutable master data only (User, Species,
   Product, CropPlan). Supply-chain records are immutable; deleting a batch is
   never allowed.
4. **Enums**: TEXT columns + a single constants module + zod validation (SQLite
   has no native enums under Prisma). Allowed values are commented above each
   column. Real vocabulary that the product extends (test parameters) is a
   lookup table instead.
5. **Money**: integer minor units (`price_per_kg_paise`, `total_paise`, …).
   Serializers convert to decimal rupees for the wire. Per-column ceiling
   ≈ ₹21.4M (Int) — fine for quotes/lines; if a total ever needs more, that
   column becomes BigInt in the same migration.
6. **Dates**: `DateTime` UTC in the DB; date-only business values are formatted
   at the serializer layer (wire stays `YYYY-MM-DD`).
7. **Polymorphic refs** (`ref_type`/`ref_id`, `entity_type`/`entity_id`) are
   plain columns — no Prisma relation. The app layer resolves them. See
   EntityDocument, StockMovement, OrderItem, Recall, Inspection, AuditLog.
8. **FK naming**: `<target>_id`, e.g. `buyer_user_id`. Relations are named when
   a model has more than one FK to the same target.
9. **Email uniqueness** is on the lowercased value — normalize at write time.

## 3. Domain map (18 files, 80 models)

| File | Domain | Models |
|---|---|---|
| `00_base.prisma` | generator/datasource + conventions | — |
| `01_identity.prisma` | Users & addresses | `User`, `Address` |
| `02_security.prisma` | Sessions, API keys, audit | `Session`, `ApiKey`, `AuditLog` |
| `03_assets.prisma` | Media/files registry | `Asset`, `EntityDocument` |
| `10_catalogue.prisma` | AYUSH species taxonomy | `Species`, `SpeciesSynonym`, `SpeciesContent`, `MedicinalUse`, `SpeciesMedicinalUse` |
| `20_agronomy.prisma` | Farmer operations | `FarmerProfile`, `FarmPlot`, `CropPlan`, `FarmActivity` |
| `30_logistics.prisma` | Transport/manufacture/distribution + stock + shipments + Phase-7 logistics execution | `TransporterProfile`, `ManufacturerProfile`, `DistributorProfile`, `RetailerProfile`, `Warehouse`, `StockMovement`, `StockPosition`, `Shipment`, `ShipmentTrackingPoint`, `TransporterAssignment`, `PickupEvent`, `DeliveryEvent`, `ProofOfDelivery`, `ShipmentEvent`, `ShipmentDocument`, `ShipmentMetric`, `FailedDeliveryLog` |
| `40_quality.prisma` | Lab certification (Phase 8) | `LabProfile`, `TestParameter`, `LabReceipt`, `SampleRecord`, `LabTest`, `LabTestResult`, `LabReview`, `LabDocument`, `SpeciesVerificationLog`, `Certification`, `RejectionRecord` |
| `50_trace.prisma` | Batches + event timeline + QR scan stream | `Batch`, `BatchEvent`, `QrScanLog` |
| `51_qr.prisma` | Phase-5 dynamic QR custody tokens | `QrToken`, `QrReplacementLog` |
| `52_transfer.prisma` | Phase-6 governed two-party transfers | `TransferRequest`, `TransferProof` |
| `60_products.prisma` | Product master + custody-tracked lots | `Product`, `ProductLot`, `ProductLotEvent`, `ProductLotBatchLink` |
| `70_commerce.prisma` | Orders & money | `PurchaseOrder`, `OrderItem`, `Invoice`, `Payment`, `Wallet`, `WalletTransaction` |
| `80_compliance.prisma` | Licenses/recalls/support | `LicenseCert`, `Inspection`, `Recall`, `RecallScope`, `SupportTicket` |
| `90_notifications.prisma` | Messaging | `NotificationTemplate`, `Notification`, `DeviceToken` |
| `95_intel.prisma` | Prices & weather | `PriceQuote`, `WeatherSnapshot` |
| `96_identification.prisma` | Phase-4 AI/ML recognition | `AiRequest`, `AiIdentification`, `ImageHashCache`, `AiFeedback` |
| `97_blockchain.prisma` | Blockchain proof anchors | `BlockchainEvent` |

## 4. Relationship spine

```
User 1─1 FarmerProfile 1─N FarmPlot 1─N CropPlan 1─N FarmActivity
                        CropPlan N─1 Species
User 1─1 {Lab|Transporter|Manufacturer}Profile
User 1─N Address / Asset / LicenseCert / Session / ApiKey / DeviceToken / Notification
User 1─N Wallet 1─N WalletTransaction

Species 1─N SpeciesSynonym / SpeciesContent
Species N─M MedicinalUse
Species 1─N PriceQuote

User 1─N Batch ("created")         User 1─N Batch ("held")
Batch N─1 Species / FarmPlot? / CropPlan? / Batch(self, split)
Batch 1─N BatchEvent (append-only timeline)
Batch 1─1 LabReceipt        (intake checklist)
Batch 1─N SampleRecord 1─N LabTest 1─N LabTestResult N─1 TestParameter
LabTest 1─N LabReview (supervisor two-level review)
Batch 1─N LabDocument / SpeciesVerificationLog (farmer vs AI vs lab)
Batch 0─1 Certification | RejectionRecord (terminal outcome)

User 1─N Product ("manufactured")   User 1─N ProductLot ("held")
Product 1─N ProductLot 1─N ProductLotEvent (append-only timeline)
ProductLot N─M Batch (via ProductLotBatchLink, quantity_kg per link)
Lot chain: manufacturer -> distributor -> retailer -> sold

Recall 1─N RecallScope (product / product_lot / batch granularity)
PurchaseOrder 1─N OrderItem      (buyer/seller = User)
PurchaseOrder 1─N Invoice 1─N Payment

Shipment (refs batch | product_lot; requester + transporter = User)
Shipment 1─N ShipmentTrackingPoint (GPS breadcrumbs)
QrScanLog (refs batch | product_lot | product; plain actor col) — one scan stream
BlockchainEvent (refs batch_event | product_lot_event | audit_log) — proof anchors
```

## 5. Old → new mapping (for the migration step)

| Old (prisma/schema.prisma) | New (prisma/schema/) | Notes |
|---|---|---|
| `User` | `User` | role set extended (+retailer, distributor); verification fields added |
| — | `FarmerProfile` | from `FarmProfile` (renamed + farmer_id → profile row) |
| `FarmProfile` | folded into `FarmerProfile` + new `FarmPlot` | org row stays 1:1 |
| `HerbCatalogue` | `Species` + `SpeciesSynonym` + `SpeciesContent` | synonyms JSON → rows; add medicinal-use M:N |
| `PriceQuote` | `PriceQuote` | money → paise; add market/source |
| `Herb` | `Batch` | code `HERB-YYYY-NNNNNN` (unique business key; docs/phase_3.md spec); state columns merged in |
| `BatchState` | merged into `Batch` | phase/holder/test_status on the row |
| `BatchEvent` | `BatchEvent` | from/to renamed, token hash stored |
| `LabReport` | `LabReceipt` + `SampleRecord` + `LabTest` + `LabTestResult` + `LabReview` + `TestParameter` | Phase-8 redesign (docs/lab/architecture.md §5): header+flat results → sample/test/parameter spine; old tables dropped |
| `Product` | `Product` (master) + `ProductLot` + `ProductLotEvent` | product QR token moved to lot nonce; distribution custody added |
| `ProductBatchLink` | `ProductLotBatchLink` | composition is per manufactured run, not per product master |
| `CropPlan` | `CropPlan` + `FarmActivity` | dates → DateTime |
| `WeatherSnapshot` | `WeatherSnapshot` | unchanged shape |
| — (new) | security, assets, logistics (warehouses, stock, **shipments**), commerce, compliance, notifications, intel, **blockchain anchors** | see §3 |

## 5b. Decisions locked (from architecture review)

1. **Traceability runs farm → consumer sale.** Batches end at the factory gate
   (consumed into a lot); ProductLots then carry custody manufacturer →
   distributor → retailer and terminate in a `SALE` event when a consumer
   buys. Consumer scan shows the lot journey + every source batch.
2. **Batch QRs are stateful, versioned custody tokens (Phase 5).**
   `docs/phase_5.md` superseded the earlier stateless-nonce idea: every batch
   mints `QrToken` v1 ACTIVE at creation, and each custody transfer rotates it
   inside the same transaction (old → transferred, next version → active for
   the new holder). Raw tokens are stored AES-256-GCM-encrypted and looked up
   by SHA-256; "one ACTIVE QR per batch" is enforced in the transaction AND
   by a partial unique index. Product lots (60_products) keep their stateless
   nonce design until the products phase (docs/qr/architecture.md).
3. **Recalls are lot-scoped.** `RecallScope` rows can target specific batches /
   lots inside a product; empty scopes = product-wide. Resolve endpoints will
   surface active recalls on scans.
4. **Roles extended** with `distributor` + `retailer`; both get org profile
   rows (DistributorProfile / RetailerProfile) because they now hold custody.
5. **Stock has a current-state view.** `StockPosition` (per warehouse/ref) is
   updated transactionally with each `StockMovement`; movements carry no
   balances. `LicenseCert.license_no` is unique.

## 5c. Product-lot custody rules (locked before build)

Decisions: transporter optional (self-pickup allowed), strictly sequential
(no skipped legs), sale recorded by retailer POS with a units counter,
splits/returns deferred.

Transfer = the next party scans the current holder's QR. Each successful
scan verifies signature -> checks the nonce -> writes a `TRANSFER` event ->
moves phase -> increments `qr_nonce` (all previously printed QRs die). No
QR token material is ever stored (stateless nonce claims).

Transition matrix — code-level `(from_phase, scanner_role)` table:

| from phase | scanner role | to phase |
|---|---|---|
| with_manufacturer | transporter | in_transit_to_distributor |
| with_manufacturer | distributor (self-collect) | with_distributor |
| in_transit_to_distributor | distributor (receive) | with_distributor |
| with_distributor | transporter | in_transit_to_retailer |
| with_distributor | retailer (self-collect) | with_retailer |
| in_transit_to_retailer | retailer (receive) | with_retailer |
| with_retailer | retailer (POS sale) | sold — only when units_remaining hits 0 |

Rules:
- `ProductLot.units_remaining` starts = `quantity_units` at LOT_CREATED;
  each `SALE` event decrements it (payload `units_sold`, optional
  `consumer_user_id` on consent). Partial sales keep phase `with_retailer`.
- Guards: scanner must not already be the holder (self-transfer); the
  scanner's role must match the matrix; a lot with no remaining units cannot
  be sold again; `sold` is terminal and immutable.
- Event types: LOT_CREATED | TRANSFER | SALE (payload may carry order_no to
  cross-link commerce).
- QR minting (`GET /lots/:id/qr`) allowed for current holder, manufacturer
  and admin; journeys are public via /traceability. One QR per lot — per-pack
  serialization is a later extension.
- Split (child lots) and return (reverse custody) are schema-ready but NOT in
  v1.

## 5d. Phase-1 (docs/phase_1.md) coverage audit

Every core table from the phase-1 spec is present — direct, merged by
redesign, or added in the coverage pass below. ✅ = direct match, ⬆ =
superset/normalized upgrade, 🔀 = merged/redesigned (mapping column), ➕ =
added because it was missing.

| Phase-1 table | Status | Model / mapping |
|---|---|---|
| `users` | ✅ | `User` (role set extended: +consumer/retailer/distributor/admin) |
| `user_profiles` | 🔀 | `User` fields + `Address` rows (district added) + per-role profile rows |
| `farmers` | ✅ | `FarmerProfile` (+`farmer_code`, `organic_certified`); licenses → `LicenseCert` |
| `transporters` | ✅ | `TransporterProfile` (+`transporter_code`, `vehicle_number`/`vehicle_type`, `is_active`) |
| `laboratories` | ✅ | `LabProfile` (+`lab_code`, `verification_status`) |
| `manufacturers` | ✅ | `ManufacturerProfile` (+`manufacturer_code`, `verification_status`) |
| `herbs` | ⬆ | `Species` + `SpeciesSynonym` + `SpeciesContent` + `MedicinalUse` (M:N) |
| `herb_batches` | ✅ | `Batch` (phase/test_status on the row; weight in kg; GPS) |
| `batch_images` | 🔀 | `Asset` + `EntityDocument` (`entity_type=batch`, `doc_kind=herb_image`\|`packaging_image`\|`transport_image`) |
| `current_ownership` | 🔀 | `Batch.current_holder_user_id` + `phase` + `qr_nonce`; `ProductLot` mirror |
| `ownership_history` | ✅ | `BatchEvent` (+ `ProductLotEvent` on the product side) |
| `qr_tokens` | ⬆ | `QrToken` — versioned custody tokens (v1 ACTIVE at batch birth; rotated by transfers/replacements; raw token encrypted at rest, lookup by SHA-256) |
| `qr_scan_logs` | ➕ | `QrScanLog` — every scan: custody, checks AND anonymous consumer views |
| `transfer_requests` | ➕ | `TransferRequest` — Phase-6 two-party consent: receiver requests, current holder approves; completed inside the transfer transaction |
| `transfer_proofs` | ➕ | `TransferProof` — handover evidence (photo asset, signatures, remarks) tied to the TRANSFER BatchEvent |
| `shipment_requests` | 🔀 | `Shipment` Phase-7 machine: `requested → assigned → accepted → arrived_for_pickup → picked_up → in_transit → arrived_destination → delivered → completed` \| `cancelled` \| `failed` \| `rejected`; type/priority/route snapshots + geofence; pickup & delivery **orchestrate** a governed Phase-6 custody hop |
| `shipment_tracking` | ➕ | `ShipmentTrackingPoint` (GPS breadcrumbs per shipment; speed/accuracy; offline buffered sync) |
| `transporter_assignments` | ➕ | `TransporterAssignment` — one PENDING attempt per job; `pending → accepted \| declined \| cancelled`, reassignment after a decline |
| `pickup_events` | ➕ | `PickupEvent` — evidence at handover (GPS, photo, remarks, transporter) |
| `delivery_events` | ➕ | `DeliveryEvent` — receiver identity + role + GPS at the scan moment |
| `proof_of_delivery` | ➕ | `ProofOfDelivery` — 1:1 per shipment: receiver name/signature/photos, remarks, uploaded_at |
| `shipment_events` | ➕ | `ShipmentEvent` — append-only logistics timeline (REQUESTED…COMPLETED, GPS_UPDATED, DELAYED…) |
| `shipment_documents` | ➕ | `ShipmentDocument` — invoice / lab request / transfer doc / certificate |
| `shipment_metrics` | ➕ | `ShipmentMetric` — expected vs actual hours + delay minutes/reason at completion |
| `failed_delivery_logs` | ➕ | `FailedDeliveryLog` — receiver unavailable / wrong batch / qc / damaged + photo |
| `lab_requests` | 🔀 | `BatchEvent` `INTENT_LAB_REQUEST` + phase `at_lab` (event-driven queue; revisit if a stateful queue is wanted) |
| `lab_tests` | ⬆ | `LabTest` (per sample, per category) → `LabTestResult` (one row per parameter) + `TestParameter` vocabulary; `LabReceipt` intake + `SampleRecord` + `LabReview` two-level review (Phase 8) |
| `certifications` | 🔀 | `Certification` (COA: sha256 hash, lab snapshot, sample/test/parameter counts, `active\|revoked`) + `RejectionRecord` (reason + action); org licenses in `LicenseCert` |
| `manufacturing_batches` | 🔀 | `ProductLot` — each run of a `Product` with own custody chain |
| `products` | ✅ | `Product` (master) |
| `product_ingredients` | ✅ | `ProductLotBatchLink` (composition per run, `quantity_kg` per link) |
| `blockchain_events` | ➕ | `BlockchainEvent` (proof anchors: tx_hash, block_number, chain, status) |
| `notifications` | ✅ | `Notification` (+ `NotificationTemplate`, `DeviceToken`) |
| `audit_logs` | ✅ | `AuditLog` (admin/system) + domain timelines (`BatchEvent`, `ProductLotEvent`) |
| `consumer_scans` | 🔀 | merged into `QrScanLog` (`purpose=consumer_view`, anonymous actor) — one tamper signal stream |

Design notes:
- `qr_scan_logs` + `consumer_scans` are one table on purpose: failed/
  unauthorized/replay custody scans and post-sale consumer views are the same
  **anomaly stream** an AYUSH monitor needs for diversion/counterfeit signal
  detection, and a single stream is filterable by `target_type`/`purpose`.
- Batch-status values from phase-1 (CREATED…ARCHIVED) map onto `phase` +
  `test_status` + `qr` minting rules; `ARCHIVED` will be a soft terminal state
  at the service layer.
- GPS appears wherever custody facts land: batch, events, shipments,
  tracking points, scan logs, plots, profiles — so "where was it, who handled
  it" is queryable end to end.

## 6. Planned codebase architecture (next steps after schema sign-off)

The `src/` tree will mirror the domains so files stay small and ownership is
clear:

```
src/
  config/ env.js logging.js db.js
  constants/ enums.js codes.js
  middleware/ auth.js validate.js errors.js
  modules/
    identity/    (auth routes, sessions, profile routes)
    catalogue/
    agronomy/
    logistics/
    quality/
    trace/       (batches, transfer state machine, events, QR)
    products/
    commerce/
    compliance/
    notifications/
    intel/       (prices, weather)
    system/      (admin, health)
  services/      (cross-cutting: qr, transfer, notifications dispatch)
  utils/ serializers/ validation/
scripts/ (seed)  tests/
```

Each module = routes + service + serializers + zod schema, colocated.

## 7. Review findings applied

1. **Commerce** covers B2B batch orders (farmer → manufacturer) **and** product
   orders (manufacturer → distributor/retailer). Orders are bookkeeping + drive
   stock movements/notifications; custody itself stays QR-scan driven (batch &
   lot chains are independent of order status, linked via reference numbers).
2. **Warehouse/stock**: `StockPosition` gives O(1) current stock; ledger stays
   append-only. No SKU-per-warehouse master — extend if full WMS is wanted.
3. **QR**: see §5b.2 (nonce tokens).
4. **Recall**: lot-scoped via `RecallScope`; fan-out through notifications;
   scans surface active recalls (service layer).
5. **Support tickets**: no SLA/queue machinery; attachments ride on
   `EntityDocument` (`support_ticket` code).
6. **Certifications**: `LicenseCert` replaces FarmProfile's certifications;
   `license_no` unique. Seeds will create demo licenses.

## 8. Verification

- `npx prisma validate --schema prisma/schema` → valid ✅ (18 files, 80 models)
- Migrations applied on the scratch DB (`prisma/scratch_new.db`), `migrate
  status` clean; Prisma client regenerated per phase
- Active test suites green: auth, batches, identification, qr, transfers,
  shipments, lab (109 cases)
