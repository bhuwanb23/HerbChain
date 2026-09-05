# Phase 12 — Permissioned Blockchain Trust Layer

Status: **LIVE** — the event queue + worker + hash-linked ledger are wired
into the server boot (`src/index.js` starts the worker), mounted at
`/api/v1/blockchain`, and part of `npm test`. `97_blockchain.prisma`
becomes the trust layer (queue + transactions + nodes + contracts +
audit); migration `20260904170000_phase12_blockchain`, schema
**95 → 99 models**. Tests: `tests/blockchain/` (7 scenarios over real
HTTP incl. tamper detection, failure/backoff and permissions), part of
`npm test` (142 cases total). A live smoke (71 checks) proved the full
journey: worker-drained anchors → dashboard → chains → VALID → tamper →
TAMPERED → restore → VALID.

Spec: `docs/phase_12.md`.

## 1. What this phase is

HerbChain's trust layer: a **permissioned blockchain** (AYUSH governance,
regional authorities, labs, manufacturers, an orderer) with an **event
queue**, deterministic hashing and a **verification engine**. The design
is deliberately **hybrid**: PostgreSQL stays the operational system of
record; the chain is a tamper-evident *witness* over the milestones that
matter (custody, certification, product lineage), never a duplicate of
operational data.

```
API → PostgreSQL → blockchain_event_queue (same transaction) → worker → ledger
                                                              ↘ BlockchainTransaction (hash chain)
```

## 2. Core philosophy (from the spec)

1. **The worker owns every submission.** REST handlers never touch the
   ledger. Domain services write a `pending` `BlockchainEvent` row inside
   their own transaction (all-or-nothing with the business write); the
   worker drains the queue with atomic per-row claims.
2. **Only trusted milestones go on-chain.** Batches, custody hops,
   lab certification/rejection, product creation and batch-to-product
   linkage (plus procurement intake) are anchored. Images, PDFs, GPS
   logs, profiles and inventory never do.
3. **Hashing is canonical + recomputable.** `hashMaterialFor` builds a
   stable SHA-256 payload from live DB facts (never whole records). At
   verify time the same bytes are recomputed and compared →
   `VALID | TAMPERED` (spec Verification Engine).
4. **Smart-contract rules 1–5 are a defense-in-depth gate** in the worker
   (the domain services remain the primary enforcement): batch must
   exist (1), transfers must be real two-party custody moves (2), linkage
   requires a certified, non-rejected batch (3), certification requires
   an approved test (4), and product creation requires an owner (5).
5. **Business operations never wait on the chain.** Failures retry with
   exponential backoff (base `BLOCKCHAIN_RETRY_BASE_MS`, ×1/5/15/30/60)
   until `max_retries` (5), then `failed` and requeueable by an admin.
6. **Chain integrity is frozen even when facts change.** Tampering a DB
   fact flips that event's verification to `TAMPERED` while
   `verifyChain()` (recomputed block hashes + `prev_hash` links) stays
   `valid` — the block itself is immutable.

## 3. The queue (`BlockchainEvent`)

Every anchored milestone is written `pending` inside the domain
transaction (`batches.js`, `qrEngine.js`, `lab.js`, `procurement.js`,
`products.js` all do this today). The row carries `anchor_code`,
`entity_type` + `entity_id` (batch_event | product_lot_event |
audit_log), optional `payload_json` metadata, `performed_by_user_id`
(when the domain knows it — otherwise the worker resolves the actor from
the event row) and `max_retries`.

`processQueue` (one tick) is deterministic and idempotent:

1. select due rows (`pending`, `next_attempt_at` null/≤ now), oldest
   first, capped by `BLOCKCHAIN_PROCESS_LIMIT`;
2. atomically claim `pending → processing` (`updateMany` with the status
   in the where — a concurrent tick or the interval worker can never
   double-process a row);
3. recompute the canonical payload hash, evaluate the contract rules;
4. submit the block through the ledger seam and persist
   `BlockchainTransaction` + receipt the queue row + audit, all in one
   transaction;
5. on any error: `handleFailure` (attempts + 1, backoff or terminal
   `failed`).

**Concurrency:** ledger submissions are serialized through a module-level
promise chain (`submitBlockSerialized`). Row claims stop double-processing
one event; serialization stops two concurrent ticks from minting the same
`block_number` from the same chain tip (a race the live smoke caught:
the interval worker + a manual `/process` could collide on the unique
`block_number`).

## 4. The ledger (`src/services/ledger/`)

- `ledger.js` — provider seam selected by `LEDGER_PROVIDER` (`mock`
  default). `fabric` is declared for the production network (spec
  recommendation); this repo ships the interface + validation and falls
  back to `mock`, so rows keep processing and the chain stays
  verifiable. `setProviderForTest` is the test seam.
- `mockLedger.js` — deterministic append-only hash chain persisted in
  `blockchain_transactions`. Each block links `prev_hash` and carries the
  `payload_hash` of canonical facts; `blockCanonical` is sorted and
  stable, so the same inputs always produce the same block hash and
  `verifyChain` can recompute every hash. Genesis is fixed
  (`herbchain-genesis`, block 0).

## 5. Verification engine

- `verifyEvent(id)` — recompute the current canonical hash of the event's
  facts vs. the anchored `payload_hash` → `VALID | TAMPERED`
  (`NOT_ANCHORED` if the row never completed). Every check is audited.
- `verifyTransactionHash(hash)` — same check looked up by the on-chain
  transaction hash (spec `GET /blockchain/verify/{hash}`), with
  `NOT_FOUND` for unknown hashes.
- `verifyChain()` — recompute every stored block hash and every
  `prev_hash` link; returns `valid`, block count, tip and the first bad
  block if any.
- `batchChain(batchId)` / `productChain(productId)` — the anchored
  milestones for one batch / one product, oldest first, with per-anchor
  receipts and chain integrity, exposed to labs / the owning manufacturer
  respectively.

## 6. Failure handling & ops

- Backoff: `next_attempt_at = now + base × [1, 5, 15, 30, 60]` (index by
  attempt). Not-due rows are skipped by later ticks.
- After `max_retries` the row is `failed` with `last_error`; an AYUSH
  admin can `requeueFailed` (reset attempts + clear error) — the
  recovered run then anchors normally.
- Every transition (queued → retried → failed → processed → requeued →
  verified → tampered → node heartbeat) is appended to
  `BlockchainAuditLog`.

## 7. Node model & permissions

`seedBlockchain()` bootstraps six nodes idempotently (AYUSH-GOV-01
governance, REG-01 regional observer, LAB-01/02 validators, MFR-01
validator, ORDERER-01) plus `Batch Contract` v1.0.0 (5 functions, rules
1–5). RBAC: `blockchain.view` (lab: any batch chain; manufacturer: own
product chains) and `blockchain.manage` (admin: dashboard, process,
requeue, verify-event, nodes ping, contracts, audit). Farmers and
transporters have no chain access — the backend stays their system.

## 8. API surface (`/api/v1/blockchain`)

| Method + path | Access | Purpose |
|---|---|---|
| `GET /dashboard` | manage | queue by status, transactions (total + by event type), chain integrity, network, recent, audit |
| `GET /events` · `GET /transactions` | manage | paged queue / ledger views |
| `POST /process` | manage | run one worker tick (deterministic drain) |
| `POST /requeue` | manage | reset failed rows (`ids` optional) |
| `POST /verify-event/:id` | manage | verification engine on one anchored event |
| `GET /batches/:batchId` | view | batch chain (lab / admin) |
| `GET /products/:productId` | view | product chain (owning manufacturer / admin; strangers 403) |
| `GET /verify/:hash` | view | verify by on-chain transaction hash |
| `GET /nodes` · `POST /nodes/:code/ping` · `GET /contracts` · `GET /audit` | manage | network ops + AYUSH audit trail |

## 9. Models (`97_blockchain.prisma`)

- `BlockchainEvent` — the queue (status, attempts, max_retries,
  next_attempt_at, last_error, performed_by_user_id, tx_hash,
  block_number, block_time, processed_at).
- `BlockchainTransaction` — the ledger block: `transaction_hash` (unique,
  = block hash), `block_number` (unique, monotonic), `prev_hash`,
  `payload_hash`, `event_type`, `entity_type/entity_id`, `performed_by`,
  `chain`, `confirmed_at`. `event_id` 1:1 back to the queue row.
- `BlockchainNode` — permissioned orgs (node_code, org_type, role,
  endpoint, status, last_seen_at).
- `SmartContractVersion` — contract name/version (unique pair), functions
  JSON, rules JSON, deployed_by, is_active.
- `BlockchainAuditLog` — event_id (nullable), action, actor, detail_json.

## 10. Supersession notes

- Phase 1–11 treated `blockchain_events` as a bare "pending anchor"
  table (tx_hash/status). Phase 12 **redefines it as the event queue**
  (attempts, backoff, performed_by) and adds the transaction ledger,
  nodes, contracts and audit — the old shape never shipped to production
  (all prior DBs rebuild from migrations, including the test template).
- The ledger is a *witness*, not a store: nothing on-chain is queried by
  the API for operational reads; the chain exists to prove facts were
  anchored when they were and to expose tampering.
- `docs/batch/architecture.md` and `docs/lab/architecture.md` now say
  "Phase-12 worker drains the queue" instead of "off-DB anchoring later".