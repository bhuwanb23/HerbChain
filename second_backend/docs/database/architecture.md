# HerbChain Database Architecture (Redesign)

Status: **BLUEPRINT** — the target schema lives in `prisma/schema/` (multi-file) and
has been validated, but is **not yet wired** into the running app. The active schema
remains `prisma/schema.prisma` until the migration step flips `package.json`'s
`prisma.schema` to the folder and the service layer is rewritten against it.

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

## 3. Domain map (14 files, 43 models)

| File | Domain | Models |
|---|---|---|
| `00_base.prisma` | generator/datasource + conventions | — |
| `01_identity.prisma` | Users & addresses | `User`, `Address` |
| `02_security.prisma` | Sessions, API keys, audit | `Session`, `ApiKey`, `AuditLog` |
| `03_assets.prisma` | Media/files registry | `Asset`, `EntityDocument` |
| `10_catalogue.prisma` | AYUSH species taxonomy | `Species`, `SpeciesSynonym`, `SpeciesContent`, `MedicinalUse`, `SpeciesMedicinalUse` |
| `20_agronomy.prisma` | Farmer operations | `FarmerProfile`, `FarmPlot`, `CropPlan`, `FarmActivity` |
| `30_logistics.prisma` | Transport/manufacture/distribution + stock | `TransporterProfile`, `ManufacturerProfile`, `DistributorProfile`, `RetailerProfile`, `Warehouse`, `StockMovement`, `StockPosition` |
| `40_quality.prisma` | Lab & structured tests | `LabProfile`, `TestParameter`, `LabReport`, `LabTestResult` |
| `50_trace.prisma` | Batches + event timeline | `Batch`, `BatchEvent` |
| `60_products.prisma` | Product master + custody-tracked lots | `Product`, `ProductLot`, `ProductLotEvent`, `ProductLotBatchLink` |
| `70_commerce.prisma` | Orders & money | `PurchaseOrder`, `OrderItem`, `Invoice`, `Payment`, `Wallet`, `WalletTransaction` |
| `80_compliance.prisma` | Licenses/recalls/support | `LicenseCert`, `Inspection`, `Recall`, `RecallScope`, `SupportTicket` |
| `90_notifications.prisma` | Messaging | `NotificationTemplate`, `Notification`, `DeviceToken` |
| `95_intel.prisma` | Prices & weather | `PriceQuote`, `WeatherSnapshot` |

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
Batch 1─N LabReport 1─N LabTestResult N─1 TestParameter

User 1─N Product ("manufactured")   User 1─N ProductLot ("held")
Product 1─N ProductLot 1─N ProductLotEvent (append-only timeline)
ProductLot N─M Batch (via ProductLotBatchLink, quantity_kg per link)
Lot chain: manufacturer -> distributor -> retailer -> sold

Recall 1─N RecallScope (product / product_lot / batch granularity)
PurchaseOrder 1─N OrderItem      (buyer/seller = User)
PurchaseOrder 1─N Invoice 1─N Payment
```

## 5. Old → new mapping (for the migration step)

| Old (prisma/schema.prisma) | New (prisma/schema/) | Notes |
|---|---|---|
| `User` | `User` | role set extended (+retailer, distributor); verification fields added |
| — | `FarmerProfile` | from `FarmProfile` (renamed + farmer_id → profile row) |
| `FarmProfile` | folded into `FarmerProfile` + new `FarmPlot` | org row stays 1:1 |
| `HerbCatalogue` | `Species` + `SpeciesSynonym` + `SpeciesContent` | synonyms JSON → rows; add medicinal-use M:N |
| `PriceQuote` | `PriceQuote` | money → paise; add market/source |
| `Herb` | `Batch` | code HERB-… → BAT-…; state columns merged in |
| `BatchState` | merged into `Batch` | phase/holder/test_status on the row |
| `BatchEvent` | `BatchEvent` | from/to renamed, token hash stored |
| `LabReport` | `LabReport` + `LabTestResult` + `TestParameter` | loose fields → parameter rows |
| `Product` | `Product` (master) + `ProductLot` + `ProductLotEvent` | product QR token moved to lot nonce; distribution custody added |
| `ProductBatchLink` | `ProductLotBatchLink` | composition is per manufactured run, not per product master |
| `CropPlan` | `CropPlan` + `FarmActivity` | dates → DateTime |
| `WeatherSnapshot` | `WeatherSnapshot` | unchanged shape |
| — (new) | security, assets, logistics, commerce, compliance, notifications domains | see §3 |

## 5b. Decisions locked (from architecture review)

1. **Traceability runs farm → consumer sale.** Batches end at the factory gate
   (consumed into a lot); ProductLots then carry custody manufacturer →
   distributor → retailer and terminate in a `SALE` event when a consumer
   buys. Consumer scan shows the lot journey + every source batch.
2. **QRs are stateless nonce tokens.** Signed claims embed a `qr_nonce` that
   increments on each transfer; replay is rejected by nonce mismatch. **No
   token material is stored** — `current_qr_token`/`qr_token_revoked_at` are
   gone from Batch; lots carry only their nonce; `GET /qr` mints on demand.
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

- `DATABASE_URL="file:./dev.db" npx prisma validate --schema prisma/schema` → valid ✅
- App + its 53 tests still run against the OLD `prisma/schema.prisma` (untouched)
- Migration step (next): flip `package.json` `prisma.schema` → folder, run
  `prisma migrate dev` against a scratch DB, then rewrite modules + seed + tests
  module by module, keeping the suite green at each step.
