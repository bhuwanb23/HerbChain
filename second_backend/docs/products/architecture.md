# Phase 10 — Products, Manufacturing & Lineage

Status: **LIVE** — `/api/v1/products` + `/api/v1/manufacturing` +
`/api/v1/batches/:id/products` mounted, `60_products.prisma` rewritten (7 new
models, 1 dropped), migration `20260904150000_phase10_products`, schema
**87 → 92 models**. Tests: `tests/products/` (9 scenarios over real HTTP),
part of `npm test` (124 cases total).

Spec: `docs/phase_10.md`.

## 1. What this phase is

Certified herb batches became manufacturing inputs in Phase 9 (inventory +
ledger). Phase 10 turns that stock into **finished goods with an unbroken
lineage**: a manufacturer registers `Product` masters, and every production
event is an explicit `ManufacturingBatch` run (MFG-…) that reserves inventory
ingredients at creation, consumes them at completion, and emits exactly one
sellable `ProductLot` (PRD-…) carrying a **permanent product QR**. Herb
batches consumed into products stay traceable both ways — product → source
herb batch (backward lineage) and herb batch → finished products (forward
trace) — and the recall machinery can answer "what did this batch go into"
instantly.

## 2. Core philosophy (from the spec)

1. **An explicit run per production event.** Each `ManufacturingBatch`
   (planned → in_progress → completed | cancelled) is its own governed
   record; composition lives on `ManufacturingBatchIngredient` edges, never
   on a free-form lot-to-batch link.
2. **Inventory only moves through the Phase-9 ledger.** Run creation calls
   the same reserve kernel as procurement reservations; completion consumes
   through `consumed_for_production` `InventoryTransaction` rows inside the
   run's own transaction (no nested transactions).
3. **A run is atomic.** In ONE transaction: consume every reserved
   ingredient → emit the finished lot → mint the permanent product QR → write
   `LOT_CREATED` + per-ingredient `BATCH_LINKED_TO_PRODUCT` events + ledger
   anchors → freeze the lineage snapshot. Either the whole run happened or
   none of it did.
4. **Product QRs are permanent, unlike batch QRs.** Batch custody tokens
   rotate on every transfer (Phase 5). A lot's QR is minted **once** at
   `LOT_CREATED` — raw token never stored (SHA-256 hash lookup + AES-GCM
   cipher), one `ProductQrToken` per lot (`lot_id` unique), status
   `active → revoked` only via recall/QA.
5. **One finished lot per completed run** (spec §1 decision). Quantity flows
   from `planned_units` (override with `produced_units` at completion);
   `units_remaining` starts equal and is decremented by Phase-11 sales.
6. **Spent herb batches become terminal.** When every manufacturer
   inventory item of a batch is consumed, the batch's custody phase moves
   `with_manufacturer → consumed` with a `BATCH_EXHAUSTED` event — the herb
   side of the chain closes cleanly.
7. **Manufacturers own their data.** Runs, lots, formulas, products and
   dashboards are scoped to the acting manufacturer (admin sees all);
   stranger manufacturers get 403 everywhere.

## 3. Domain flow

```
Product master (PROD-YYYY-NNNNNN)       name / sku / category / pack / expiry_months
        │  + ProductFormula lines       standard recipe: species_code + quantity
        ▼
ManufacturingBatch (MFG)  planned       ingredients RESERVED via Phase-9 kernel
        │                                (batch_id + inventory_item_id + qty_kg)
        ▼  start                         in_progress (production_date)
        ▼  complete (ONE transaction)
        │   ├─ consume ingredients      InventoryTransaction consumed_for_production
        │   ├─ ProductLot (PRD)         quantity_units / units_remaining
        │   ├─ ProductQrToken           permanent (hash + cipher, active)
        │   ├─ LOT_CREATED event        + PRODUCT_CREATED blockchain anchor
        │   ├─ per-ingredient events    BATCH_LINKED_TO_PRODUCT + LINKED anchor
        │   └─ lineage snapshot         ProductLineageSnapshot (tamper-evident)
        ▼  post-completion              fully spent herb batches -> phase consumed
Product lineage (backward)              product -> runs -> ingredient batches (+cert)
Batch forward trace                     herb batch -> runs -> lots (owner can see)
Recall impact (flag a batch)            AffectedProduct rows -> product recalled
```

## 4. Models (`60_products.prisma`)

| Model | Table | Role |
|---|---|---|
| `Product` | `products` | Master record (manufacturer-owned); status `draft → active → discontinued \| recalled`; `expiry_months` drives lot expiry |
| `ProductFormula` | `product_formulas` | Standard recipe line (product × species, quantity + unit) — the *expected* composition used by QA |
| `ManufacturingBatch` | `manufacturing_batches` | The production run; `planned → in_progress → completed \| cancelled`; MFG-… code |
| `ManufacturingBatchIngredient` | `manufacturing_batch_ingredients` | Run composition edge: source `batch_id` + reserved `inventory_item_id` + `quantity_kg`; `reserved → consumed \| released` |
| `ProductLot` | `product_lots` | One finished, sellable lot per completed run (PRD-…); custody phase starts `with_manufacturer` |
| `ProductQrToken` | `product_qr_tokens` | Permanent product QR (hash + cipher, `active → revoked`); `lot_id` unique |
| `ProductLotEvent` | `product_lot_events` | Append-only lot timeline (`LOT_CREATED` now; `TRANSFER`/`SALE` in Phase 11) |
| `ProductLineageSnapshot` | `product_lineage_snapshots` | Frozen, tamper-evident copy of product → runs → ingredient batches at completion |
| `AffectedProduct` | `affected_products` | Recall blast radius (batch × product, `open → resolved`) |

Dropped: `ProductLotBatchLink` (phase-1 placeholder — composition is now the
run-ingredient edge). Back-relations added on `Batch` (consuming runs /
affected products), `User` (product/manufacturing/lot ownership sides) and
`Species` (formula lines).

## 5. Verification

- `npx prisma validate --schema prisma/schema` → valid ✅ (99 models — 92
  at Phase 10, +3 Phase 11 verification, +4 Phase 12 blockchain).
- Migration `20260904150000_phase10_products` applied; template DB rebuilt
  from all 12 migrations; Prisma client regenerated.
- `npm test` → **124/124** across all nine suites (9 new products cases:
  master/formula CRUD, full run lifecycle to lot + QR, cancel releases
  reservations, multi-batch lineage both directions, QR verify + card
  reprint, recall impact + resolve, batch exhaustion, production dashboard,
  stranger-manufacturer and state-machine guards).
- Live smoke over real HTTP (`HERB` farmer → lab certify → manufacturer
  receive → product + formula → 2 runs → 2 lots + QRs → verify → lineage →
  forward trace → herb batch `consumed` → recall drill → dashboard):
  **20/20 checks passed**.

## 6. Supersession notes

- The phase-1 mapping `manufacturing_batches → ProductLot` is superseded:
  a `ManufacturingBatch` is the run record; `ProductLot` is the *output* of a
  completed run (see `docs/database/architecture.md` §5/§5d).
- `ProductLotBatchLink` is gone; consumers were Phase-9 `recallStatus`
  (now walks `ManufacturingBatchIngredient`), now feeding `AffectedProduct`.
- The phase-1 "lot nonce" idea for product QRs never shipped; batch QR
  rotation rules (docs/qr) are unchanged. Product lots carry the permanent
  `ProductQrToken` described above.
- `ProductLot` custody phases beyond `with_manufacturer`
  (distributor/retailer/sold) remain a later phase — schema-ready
  (`LOT_PHASES`), enforced by the distribution module.
- **Phase 11 (docs/verification/architecture.md) superseded the auth-gated
  consumer surface**: the permanent `ProductQrToken` now feeds the PUBLIC
  digital passport (`POST /verify/scan` + `GET /verify/product/:token`)
  with zero login. The Phase-10 `/api/v1/products/qr/verify` endpoint stays
  for authenticated internal checks; the public portal is the consumer
  entry point. `Product.verification_status` (new in Phase 11) is the
  persisted engine verdict written on every public scan and on recall.
