# Phase 5: Dynamic QR Engine — Implementation

Status: **LIVE** — implemented, tested (75/75 across auth/batches/
identification/qr), live-smoked (18/18). Reconciles `docs/phase_5.md` against
the redesigned schema. Code lives in `backend` on the modular layout.

## 1. The core rule (spec)

A QR represents **current ownership state**, not the herb:

> One batch · one current owner · **one ACTIVE QR**.
> Ownership changes → old QR dies → new QR is born.

Every custody transfer therefore rotates the token inside the **same
transaction** — the owner and the live QR can never drift apart.

## 2. Supersession: stateless nonce → stateful tokens

The Phase-3 design (docs/batch/architecture.md §6, database doc §5b.2) used
stateless signed nonce tokens minted on demand (`Batch.qr_nonce`). The
phase-5 spec requires versioned, statused, expiring, replaceable DB tokens —
so the schema and engine were upgraded:

| Old (phase 3) | New (phase 5) |
|---|---|
| nothing stored; `GET /qr` minted a fresh JWT each time | `qr_tokens` rows: v1 minted **ACTIVE inside the batch-creation transaction**; same token re-prints until rotation |
| `Batch.qr_nonce` int | dropped — `version` lives on `QrToken`, `(batch_id, version)` unique |
| replay = signature + nonce check | DB status machine: `active → transferred/expired/revoked/invalidated`; old-token scans are `replay` |
| — | `qr_replacement_logs` for lost/damaged/expired/admin rotations |
| — | token **expiry** (env `QR_TOKEN_TTL_DAYS`, default 30) — expiry applies to the token, never to ownership |

## 3. Schema (one migration, 61 → 63 models): `51_qr.prisma`

- `QrToken` — one row per (batch, version): status, owner + role snapshot,
  generated_by, timestamps, `expiry_at`, deactivation reason. **Security:**
  the raw token never sits in the DB in plaintext — lookups use its SHA-256
  hash and a copy is kept AES-256-GCM-encrypted (key derived from the server
  secret) solely so the holder can **re-print the same active QR**.
- `QrReplacementLog` — old/new versions, reason (LOST/DAMAGED/EXPIRED/
  ADMIN_REPLACEMENT), who did it.
- **One-ACTIVE rule at the DB level**: partial unique index
  `qr_tokens_one_active_per_batch ON qr_tokens(batch_id) WHERE status='active'`
  (in addition to the transaction-level guard). Two ACTIVE tokens for a batch
  are physically impossible.
- `QrScanLog` (existing 50_trace) is the anomaly stream — `target_id` was made
  nullable so unknown-token scans are logged too.

## 4. Engine (src/services/qrEngine.js)

**Mint** — `mintInitialQr(tx, batch, holder)` creates v1 ACTIVE inside the
batch-create transaction (spec "Initial Batch Creation": v1 auto-created,
owner = farmer). Tokens are `hbc_` + 192 bits of `crypto.randomBytes`.

**Card** — `GET /api/v1/batches/:id/qr` (holder/admin) decrypts the stored
token and renders a **captioned PNG** (HerbChain header, batch code, version;
encoded payload = the token URL only — no farmer data, GPS, or quantity).
Rendered cards are memoized per (batch, version), so a printed QR never
changes between fetches and nothing re-mints.

**Validate** — `POST /api/v1/qr/validate` runs the spec checklist and logs
every attempt to `qr_scan_logs`:
| Check | Outcome |
|---|---|
| unknown hash | `not_found` (logged, target null) |
| ACTIVE but past TTL | lazily flipped `expired`; `expired` |
| transferred / revoked / invalidated | `replay` (copy of a dead QR stays dead) |
| ACTIVE + live | `success` → { batch, owner, version, status } |

**Transfer** — `POST /api/v1/qr/transfer` is the atomic engine, in ONE
transaction: guards → kill old token (`transferred`) → create next version
for the receiver → move `Batch.phase/current_holder` → append `TRANSFER`
event + scan log + audit + pending blockchain anchor. Any failure rolls
everything back.

> **Phase 6 supersession:** custody now requires a two-party agreement — this
> endpoint refuses to move anything without an APPROVED `TransferRequest`
> (`transfer_not_requested`). The governed lifecycle lives in
> `POST /api/v1/transfers/*` (request → approve → execute, docs/transfers/
> architecture.md); `/qr/transfer` remains the scan-and-execute entry that
> resolves the receiver's approved request. `qrRoutes.js` routes through the
> same executor as the transfers module, so there is one custody code path.

**Regenerate** — `POST /api/v1/qr/regenerate` (holder or admin; reason
LOST/DAMAGED/EXPIRED/ADMIN_REPLACEMENT) rotates **without** an ownership
change: old ACTIVE → `revoked`, next version → ACTIVE for the same holder,
`qr_replacement_logs` row, `QR_REPLACED` event + audit.

**History** — `GET /api/v1/batches/:id/qr/history` (holder/admin) returns all
versions with owners + the replacement log.

## 5. Custody transition matrix (src/constants/qr.js)

| Batch phase | Receiver role | Next phase |
|---|---|---|
| with_farmer | transporter | in_transit_to_lab |
| with_farmer | lab (self-collect) | at_lab |
| in_transit_to_lab | lab | at_lab |
| at_lab | transporter | in_transit_to_manufacturer |
| at_lab | manufacturer (self-collect) | with_manufacturer |
| in_transit_to_manufacturer | manufacturer | with_manufacturer |
| with_manufacturer / consumed | — | terminal (sealed) |

Guards: receiver must be the account in the matrix (wrong role → 409
`invalid_transition`, logged `unauthorized`), not already the holder
(`self_transfer`), AYUSH-verified when role-gated (403), and the batch cannot
be terminal. The spec's example journey is the first smoke: farmer v1 →
transporter v2 → lab v3 → transporter v4 → manufacturer v5.

## 6. Environment

```
QR_TOKEN_TTL_DAYS=30    # token TTL — NOT ownership expiry
QR_TOKEN_BYTES=24       # 192 bits of entropy per token
QR_TOKEN_PREFIX=hbc_    # human prefix
QR_SIGNING_KEY=…        # existing secret — derives the at-rest AES key
```

## 7. Verification

- 75/75 across the four active suites (`npm test`): auth, batches,
  identification, qr (7 new cases: birth/one-active, journey v1→v5 with
  atomic rotation, replay, guards, regeneration, DB-level one-ACTIVE guard).
- Live smoke 18/18 on a seeded server: full farm→…→factory journey with QR
  rotation, replay of the dead v1, terminal seal, version history, and a
  LOST replacement (v5 revoked → v6 same owner).
- `docs/database/architecture.md` §5b.2 + §5d updated (reversal recorded);
  `Batch.qr_nonce` dropped via the phase-5 migration.

## 8. Deferred / flagged

- **Consumer product QRs** (permanent, never rotate) and the public
  `/traceability` resolve belong to the products phase; ownership QRs here are
  internal custody tokens.
- **Shipment verification step** ("Verify Shipment" in the spec flow): the
  transfer matrix already encodes WHO may legally receive per phase; tying
  transfers to approved `Shipment`/intent rows lands with the logistics phase.
- Scheduled expiry sweep: expiry is lazy (checked on every scan/fetch); a
  nightly job to flip stale ACTIVE tokens is a later ops add-on.
- Monitoring metrics (active/expired QRs, invalid scans, fraud attempts) are
  all queryable from `qr_tokens`/`qr_scan_logs` — the AYUSH dashboard phase
  consumes them.
