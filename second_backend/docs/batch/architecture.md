# Batch Management — Phase 3 Implementation Plan (new backend)

Status: **IMPLEMENTED** (Phase 3 live — batches, uploads, species, initial
QR). Supersession note: the QR parts of this doc (§6/§8 — the interim
stateless nonce design, `Batch.qr_nonce`, `GET /batches/:id/qr` minting on
demand, `POST /batches/:id/qr/verify`) were replaced by the **Phase 5 dynamic
QR engine**: `docs/qr/architecture.md` + `prisma/schema/51_qr.prisma`.
Kept here as the phase-3 build record.

## 1. Scope (from docs/phase_3.md)

Turn a physical harvest into a trusted digital asset: farmer registers a batch
(species, harvest date, quantity, cultivation type, GPS, 1–10 photos with
metadata) → unique batch code → initial ownership → mintable QR → immutable
history → audit → blockchain-ready event — all inside one transaction.

## 2. How the spec maps onto the 57-model schema

| Phase-3 concept | Schema / design | Note |
|---|---|---|
| `herb_batches` row | `Batch` | created with `phase = with_farmer`, `test_status = pending` |
| Unique batch id `HERB-2026-000001` | `Batch.code @unique` | `HERB-YYYY-NNNNNN`, generated in code — never the DB id. (Architecture doc §5 still says BAT-…; this plan adopts the spec's `HERB-` prefix — flag to reconcile there) |
| `current_ownership` (owner = farmer) | `Batch.current_holder_user_id` + `phase` | single-row source of truth (design D) — no separate ownership table |
| `ownership_history` (`SYSTEM → Farmer`, `INITIAL_CREATION`) | `BatchEvent` `CREATED`, `from = null`, `to = farmer`, payload `{ quantity_kg, cultivation_type, images }` | append-only timeline |
| `qr_tokens` row (token, version=1, ACTIVE) | **Stateless nonce QR** (locked decision §5b.2) | QR stores only a signed token embedding `{ batch code, qr_nonce }`; no token material in the DB; `GET /batches/:id/qr` mints on demand; transfer increments the nonce later (Phase 5/6) |
| `batch_images` (1–10, with filename/timestamp/GPS/device/uploader metadata) | `Asset` (+ `metadata_json`, `filename`) + `EntityDocument` (`entity_type=batch`, `doc_kind=herb_image`) + `is_primary` | two-step: upload → asset, then attach at batch create |
| `audit_logs` `BATCH_CREATED` | `AuditLog` row in the same transaction | account/admin stream |
| `blockchain_event_queue` (PENDING, BATCH_CREATED) | `BlockchainEvent` row `{ status: pending, anchor_code: BATCH_CREATED, entity_type: batch_event }` | off-DB anchoring later; creation never waits on a chain |
| One transaction, all-or-nothing | `prisma.$transaction` | batch + events + docs + audit + blockchain row commit together |
| AI suggestion (accept/change/manual) | **Deferred hook** — species list drives a client-side suggestion; the recognition endpoint (`POST /recognition/identify`) arrives with the AI phase | "AI suggests, farmer confirms" contract preserved; real inference later |

## 3. Small schema deltas Phase 3 needs (one migration)

No new tables — every phase-3 concept already has a home. Three additive
columns only:

- **TB1 — `Batch`**: `cultivation_type String?` (`organic | conventional | wild_collection`),
  `attributes_json Json?` (optional quality facts: color/odor/moisture/notes),
  `gps_accuracy_m Float?` (raw GPS accuracy from the device).
- **TB2 — `Asset`**: `filename String?`, `metadata_json Json?` (capture
  timestamp, GPS, device_id, uploader — the audit metadata the spec wants).
- **TB3 — `EntityDocument`**: `is_primary Boolean @default(false)` — marks the
  primary/hero image of the batch.

Weight: the spec accepts KG/GRAM/TON. **Canonical storage stays `weight_kg`
Float** (all downstream math — splits, stock, lab samples, product links — is
kg); the API accepts `quantity` + `unit` and normalizes (gram/ton → kg),
echoing the original unit back in the response.

## 4. Batch creation flow (one transaction)

```
POST /api/v1/batches            (requireAuth + requirePermission("batch.create"))
  validate: species active + exists, harvest_date, quantity > 0,
            cultivation_type in list, GPS lat+lng present, 1 <= images <= 10
  duplicate check: same farmer + species + harvest_date (+ same kg) in window
                   -> response carries a warning, creation proceeds (spec)
  prisma.$transaction:
    1. code = HERB-<year>-<6-digit>          (unique, retry on race)
    2. Batch.create   { farmer, species, harvest_date, weight_kg, cultivation,
                        gps(+accuracy), location text, phase=with_farmer,
                        current_holder_user_id=farmer, test_status=pending }
    3. EntityDocument rows for each asset (herb_image; is_primary on the hero)
    4. BatchEvent CREATED   (actor=farmer, to=farmer, phase_after=with_farmer,
                             payload incl. quantity_kg + images count)
    5. AuditLog BATCH_CREATED
    6. BlockchainEvent pending (anchor_code BATCH_CREATED,
                                entity_type=batch_event)   [no chain call]
  return { batch (serialized), status: "CREATED", qr: { mint url },
           duplicate_warning? }
```

Guards that come free from Phase 2: only farmers hold `batch.create`; the
verification gate deliberately excludes farmers (provisional-active D2), so a
just-registered farmer can create — transporter/lab etc. get 403
`forbidden`/`account_not_verified` from the same middleware.

**Immutable origin (spec Rule 2):** `farmer_id`, `species_id`, `harvest_date`
and `location` are never updatable after creation. No update route exposes
them; corrections go through an audit trail later (see §8). Quantity is only
ever adjusted by stock movements (splits arrive in Phase 6).

## 5. File uploads (spec §File storage)

- **Storage driver interface** (`storage.put(key, stream) → { url }`); v1 driver
  = local disk under `UPLOAD_DIR` (gitignored) served by `express.static` in
  dev. S3/Azure driver slots in behind the same interface when deployed.
- `POST /api/v1/uploads` (auth): multipart (multer), one file → `Asset` row with
  `filename`, `kind=mime`, `metadata_json` (client may send capture GPS /
  device id / timestamp) → `{ asset_id, url }`. Min/max image sizes enforced.
- Attach at batch create by `asset_id[]` (1–10). Orphan/unattached assets are
  cleanup fodder (admin sweep, later phase).

## 6. QR mint (stateless, spec §QR)

- `GET /api/v1/batches/:id/qr` (holder farmer / admin) → mints a signed token
  `{ typ: "batch_qr", sub: batch.id, code: HERB-…, nonce: batch.qr_nonce }`
  (HS256, `QR_SIGNING_KEY`) and returns `{ url, png }` where
  `url = {FRONTEND_URL}/qr/<token>` and `png` is a QR data-URL (qrcode lib,
  already a dependency).
- The token contains **no farmer data, location, or quantity** (spec: never
  expose internal data). Every mint/verify is a nonce check; replay protection
  arrives with the transfer engine (Phase 5/6) when nonces start incrementing.
- A minimal `POST /api/v1/batches/:id/qr/verify` (owner/trusted) exists now so
  clients can prove a QR is current — the full scan/transfer + public resolve
  portal belong to later phases.

## 7. API surface (module `trace`, mounted under existing conventions)

| Route | Auth / permission | Behavior |
|---|---|---|
| `POST /api/v1/batches` | farmer (`batch.create`) | §4 flow; 201 batch + CREATED status + qr mint info + optional duplicate warning |
| `GET /api/v1/batches/mine` | farmer (`batch.view`) | own batches, paged, newest first |
| `GET /api/v1/batches/:id` | `batch.view` + scope | full detail: origin facts (never editable), holder, phase/test_status, images, current QR nonce |
| `GET /api/v1/batches/:id/history` | `batch.view` + scope | `BatchEvent` timeline (serialized, newest last) |
| `GET /api/v1/batches/:id/qr` | holder farmer / admin | mint (see §6) |
| `POST /api/v1/batches/:id/qr/verify` | holder / admin | validate a presented token + nonce |
| `POST /api/v1/uploads` | any authenticated user | create an `Asset` (auth'd uploads) |
| `GET /api/v1/species` · `GET /api/v1/species/:code` | public read | species master needed to create batches (see §9) |

Scope rules (ownership checks): a farmer sees only their own batches for
`view`; the transfer phases later widen this per the custody matrix. Admin has
`admin.trace.view` oversight.

## 8. Spec edge cases — what lands in Phase 3 vs later

| Spec item | Phase 3 | Later |
|---|---|---|
| Duplicate-registration flag (same farmer+species+date+qty) | ✅ pre-create check → response `duplicate_warning` | |
| Mandatory 1 image, max 10, upload metadata | ✅ enforced | |
| Wrong-species / origin corrections (audited) | — | dedicated `batch amendment` flow with admin approval (trace module later) |
| Quantity adjustment log | — | with splits/stock (Phase 6 + logistics) |
| AI identification | stub interface only | AI phase (recognition module) |
| Ownership *transfer* engine | — | Phase 5/6 (QR engine + custody) |
| Public consumer resolve | — | consumer portal phase |

## 9. Species master dependency

Batch creation needs a species list. Phase 3 ships the **read path only**:
seed the 25-species AYUSH catalogue (port of the legacy
`src/scripts/ayushCatalogue.js` data) into `Species` (+ basic synonym rows)
and expose `GET /api/v1/species` / `/:code` (active only, public). Full
catalogue management (admin CRUD, content/uses, images) is its own phase.

## 10. Codebase layout

```
src/services/storage.js        # driver interface + local-disk driver (UPLOAD_DIR)
src/services/uploads.js        # create Asset w/ metadata (multer wired in routes)
src/services/batches.js        # createBatch (code gen + dup check + one txn),
                               # listOwn, getOne, getHistory
src/services/batchCodes.js     # HERB-YYYY-NNNNNN generator (unique, race-safe)
src/services/qrMint.js         # sign token {sub, code, nonce} -> url + png data-url
src/constants/batch.js         # cultivation types, phase codes, dup-window config
src/modules/trace/batchRoutes.js    # POST/GET batches, qr, history (+ serializer/schemas)
src/modules/catalogue/speciesRoutes.js  # GET /api/v1/species read path
src/modules/uploads/uploadsRoutes.js    # POST /api/v1/uploads
src/app.js                     # mount /api/v1/batches, /api/v1/species, /api/v1/uploads
src/scripts/seed.js            # += 25 AYUSH species (+ a couple synonyms)
tests/batches/*.test.js        # isolated-DB suite
```

## 11. Test plan (isolated DBs, supertest, migrations applied)

- Code generator: format, uniqueness across creates, year rollover
- Validations: unauthenticated 401, non-farmer 403, unknown/inactive species
  404, qty <= 0, missing GPS, 0 images / 11 images, bad cultivation type
- Happy path: one txn → 1 batch + ≥1 docs + 1 CREATED event + 1 audit +
  1 blockchain `pending` row; farmer is holder; phase `with_farmer`
- Immutability: PATCH-less origin (no route mutates farmer/species/harvest/GPS);
  origin fields absent from any update path
- Duplicate warning fires; non-duplicate doesn't
- Unit conversion: GRAM/TON normalize to kg and echo original unit
- QR: mint url/png; token verifies with current nonce; tampered token 401;
  serialized QR contains no origin data (claims checked)
- Upload: asset created + metadata persisted; size/type limits
- Permissions: consumer/transporter denied `batch.create`; farmer sees only
  own batches (`mine` scoping)

## 12. Build order (each step green)

1. Schema deltas TB1–TB3 migration + `prisma generate`
2. Seed: 25 AYUSH species + read-only species routes
3. `batchCodes` + `storage`/`uploads` services (+ upload route)
4. `batches` service: create transaction + dup check + list/get/history
5. `qrMint` + batch QR mint/verify endpoints
6. Batch routes + serializers + app wiring
7. Full batch test suite green; live smoke: farmer register → login → upload
   photo → create batch → verify rows → mint QR → decode token

## 13. Assumptions for review

- Batch code prefix `HERB-` per docs/phase_3.md (architecture.md §5 says BAT-… —
  will update the mapping row when the code lands). Changeable via one constant.
- Quantity stored canonically as `weight_kg`; API accepts kg/gram/ton and
  echoes the original unit.
- Local-disk upload driver for dev; S3/Azure behind the same interface later.
- GPS capture is client-provided (lat/lng + accuracy) with an optional
  readable location string; reverse geocoding is a later convenience, not a
  backend dependency.
- Duplicate detection warns, never blocks (spec's "show warning").
- AI suggestion ships as a client/recognition stub hook; real inference is the
  AI phase.
