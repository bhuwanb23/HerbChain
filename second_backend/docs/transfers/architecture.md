# Phase 6 — Governed Ownership-Transfer Engine (architecture)

> Source spec: `docs/phase_6.md`. Built on the Phase 5 dynamic QR engine
> (`docs/qr/architecture.md`) and the DB-truth identity/auth stack.

## 1. The problem Phase 6 closes

Phase 5 made **QR rotation atomic with custody moves** — but any eligible
receiver could grab custody by scanning the holder's QR. No consent was
required from the party handing the herb over. For an AYUSH anti-diversion
system that is exactly the wrong default: the point is that **nobody moves a
batch without an explicit, audited two-party agreement**.

Phase 6 makes every handover:

| Property | Enforced by |
|---|---|
| Requested by the receiver | `TransferRequest` row (type = the legal leg) |
| Approved by the current holder | `approveRequest` (holder-only, re-verified at decision AND execution time) |
| Validated | QR engine re-checks token active / owner sync / phase matrix / receiver eligibility |
| Audited | audit rows `TRANSFER_INITIATED/APPROVED/REJECTED/CANCELLED/COMPLETED` + immutable `BatchEvent TRANSFER` + scan log |
| Immutable | ownership history is never edited or deleted — reconstructed from `BatchEvent` |
| Atomically rotated | one transaction: batch move + old QR dead + next QR born + request COMPLETED + anchor |

## 2. Ownership truth stays where Phase 5 put it

- **Current ownership** → `Batch.current_holder_user_id` + `Batch.phase` (single
  source of truth, never hand-edited).
- **Historical ownership** → `BatchEvent` (`CREATED` + `TRANSFER` rows; never
  deleted). `GET /api/v1/batches/:id/ownership-history` reconstructs the
  timeline: system → farmer → transporter → lab → transporter → manufacturer.
- **The QR is current ownership made scannable** — one ACTIVE token per batch,
  rotated on every custody change.

The Phase 6 tables (`transfer_requests`, `transfer_proofs`) are the
**consent + evidence layer** on top — they do not duplicate ownership state.

## 3. Lifecycle

```
                ┌──────────┐
 receiver ────► │  pending │ ◄── created by the RECEIVER (leg from matrix)
                └────┬─────┘
        holder approves / rejects / cancels
                     │ approved
                     ▼
                ┌──────────┐   receiver scans holder QR
                │ approved │ ──────────────────────────┐
                └────┬─────┘                           │ execute
                     │ holder/admin cancel             ▼
                     ▼                          ┌────────────┐
                ┌──────────┐                    │ completed  │ ◄─ engine tx:
                │ cancelled│                    │            │   batch move + QR
                └──────────┘                    │            │   rotation + event
                     rejected ◄─────────────────┘            │   + anchor, all
                                                └────────────┘   atomic
```

- **One live (pending/approved) request per receiver per batch.** Re-requesting
  is blocked while one lives; stale requests (recorded holder is no longer the
  current holder) are auto-cancelled so the receiver can re-request from the
  real holder.
- **Approve is holder-only**, and only for a request addressed to the *current*
  holder — a former holder approving a stale request gets `stale_holder`; any
  stranger gets `forbidden`.
- **Execute is receiver-only.** The approved request's `to_user` presents the
  scanned holder QR; the engine re-verifies everything inside its transaction
  and marks the request `COMPLETED` with a link to the immutable TRANSFER event.

## 4. Request types (leg codes)

Derived from the Phase 5 custody matrix — never free-form:

| Batch phase | Receiver role | Type |
|---|---|---|
| `with_farmer` | transporter | `FARMER_TO_TRANSPORTER` |
| `with_farmer` | lab (self-collect) | `FARMER_TO_LAB` |
| `in_transit_to_lab` | lab | `TRANSPORTER_TO_LAB` |
| `at_lab` | transporter | `LAB_TO_TRANSPORTER` |
| `at_lab` | manufacturer (self-collect) | `LAB_TO_MANUFACTURER` |
| `in_transit_to_manufacturer` | manufacturer | `TRANSPORTER_TO_MANUFACTURER` |
| any (admin only) | — | `ADMIN_RECOVERY` |

`OWNER_REPLACEMENT` (spec enum) is *not* a custody handover — losing/damaging a
QR rotates it without an ownership change via Phase 5's `/qr/regenerate`
(`qr_replacement_logs`), which already existed and needs no counterparty.

## 5. API surface

`POST /api/v1/transfers/…`

| Route | Who | Effect |
|---|---|---|
| `request` `{batch_id, reason?}` | receiver (transporter/lab/manufacturer, AYUSH-verified) | creates `pending` request, type auto-derived from matrix |
| `approve` `{request_id}` | current holder | `pending → approved` |
| `reject` `{request_id, reason?}` | holder / admin | `pending → rejected` |
| `cancel` `{request_id, reason?}` | requestor (pending) / holder / admin | `pending|approved → cancelled` |
| `execute` `{token, request_id?}` | receiver with approved request | atomic transfer via QR engine |
| `recover` `{batch_id, reason?}` | admin | `ADMIN_RECOVERY` — batch pulled into AYUSH custody, phase preserved |
| `GET requests` | me (admin: all) | involvement-scoped list, filter by `batch_id`/`status` |
| `GET requests/:id` | parties / batch farmer / admin | detail incl. proofs |
| `POST requests/:id/proof` | parties / admin | proof-of-handover after completion |

Batch sub-resources:

| Route | Scope |
|---|---|
| `GET /api/v1/batches/:id/owner` | admin, farmer, current holder, custody parties |
| `GET /api/v1/batches/:id/ownership-history` | same |

The Phase 5 `POST /api/v1/qr/transfer` endpoint now routes through the same
executor — scanning a QR alone no longer moves anything without an approved
request (`transfer_not_requested`).

## 6. Proof-of-handover

Attached **after** the transfer is `completed`: an uploaded photo (Asset,
already GPS/device-captured by the uploads service), optional sender/receiver
signatures and remarks. The proof row links `ownership_history_id` to the exact
immutable TRANSFER `BatchEvent`. Only the parties (or admin) may attach.

## 7. Admin recovery (`ADMIN_RECOVERY`)

When custody is contested (fraud / abandonment / unresponsive holder), an admin
pulls the batch into AYUSH custody:

- opens an `ADMIN_RECOVERY` request (approved by the ordering admin),
- runs the engine with the batch's **ACTIVE token record** supplied directly —
  the raw QR may be lost, so no scan is needed,
- batch holder → admin, **phase preserved**, QR rotated to the admin's token.

A regular governed request can then route the batch onward from AYUSH custody.

## 8. Deferred (later phases)

- Shipment-assignment checks (spec "Assigned Transporter?") — the shipment
  module is not built; the two-party request/approval is the consent layer.
- Lab certification gating on `LAB_TO_TRANSPORTER` (spec "Batch Certified?") —
  arrives with the lab module. The Phase 5 matrix already blocks illegal legs.
- Public consumer trace view — comes with the consumer journey phase.

## 9. Verification

- `npm test`: **83/83** across auth, batches, identification, qr, transfers.
- Live HTTP smoke: **17/17** — governed journey farmer→transporter→lab→
  transporter→manufacturer with proofs, ownership history reconstruction,
  replay/dead-token handling, unapproved-transfer blocking, admin recovery,
  terminal-phase sealing.
