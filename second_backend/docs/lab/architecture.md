# Lab Certification — Phase 8 Architecture

Status: **LIVE** (schema + service + API + tests + smoke). Implements
`docs/phase_8.md` end to end on top of the Phase 6 governed custody chain and
Phase 7 logistics. Source of truth for the lab domain is
`prisma/schema/40_quality.prisma` (supersedes the Phase-1 `LabReport` /
`LabTestResult` placeholders — see §5).

## 1. What Phase 8 adds

The lab is the **scientific validation layer** of the open traceability
system. It never mutates farmer data, ownership history, or transport
history — it only **appends** laboratory records and, at the end, flips
`Batch.test_status` to `certified | rejected`. Ownership is untouched:
custody `phase` stays `at_lab` through the entire lab process, exactly like
shipments never move custody by themselves.

The spec's four anchors, all enforced in code:

1. **Two-level review** (spec §8): analysts enter results; lab supervisors
   review tests and issue certificates. An analyst account can never certify
   its own work.
2. **Per-parameter results** (spec §6): one `LabTestResult` row per measured
   parameter per test — never a flattened blob column. A single test may hold
   20+ parameter rows.
3. **Hashed Certificate of Analysis** (spec §9/§10): `certificate_hash` is a
   SHA-256 over the canonical certificate payload, stored for tamper
   detection; the QR trace surfaces hash + URL.
4. **Three-way species check** (spec §12): farmer claim vs AI prediction vs
   the species the lab actually verified. A mismatch refuses certification and
   routes the batch to a species-mismatch rejection with an alert.

## 2. Domain model (`40_quality.prisma`)

```
Batch (test_status: pending -> received_by_lab -> sample_created
       -> under_testing -> certified | rejected)
  |-- 1:1 LabReceipt            (intake checklist: condition, qty, receiver)
  |-- 1:N SampleRecord          (SAMP-YYYY-NNNNNN; several per batch)
  |     |-- 1:N LabTest         (one run per sample per category)
  |           |-- 1:N LabTestResult  (one row per parameter)
  |           |-- 1:N LabReview      (supervisor approve/reject/rework)
  |-- 1:N LabDocument           (test reports, microscopy images, COA PDFs)
  |-- 1:N SpeciesVerificationLog (farmer vs AI vs lab — match|mismatch|unverified)
  |-- 0..1 Certification        (CERT-YYYY-NNNNNN; sha256; lab snapshot)
  |-- 0..1 RejectionRecord      (reason code + configured action)

User.lab_role: analyst | supervisor   (the two-level separation)
TestParameter  : vocabulary of measurable parameters (lead, moisture, ...)
```

### Certification substate on Batch

`Batch.test_status` carries the lab substate; `phase` remains `at_lab`
throughout. Values: `pending → received_by_lab → sample_created →
under_testing → certified | rejected`. Terminal states are immutable; a
revoked certificate keeps `test_status = certified` and the COA row flips to
`status = revoked` (schema-ready, service hook).

## 3. Service rules (`src/services/lab.js`)

| Operation | Rule |
|---|---|
| `receiveBatch` | Requires batch `at_lab` + one intake per batch (`batch_id` unique). Sets `received_by_lab`. |
| `createSample` | One batch → several samples; codes `SAMP-YYYY-NNNNNN`; sets `sample_created`. |
| `createTest` | On a sample of a batch the **analyst's own lab holds** (holder-bound writes). Status `pending`. |
| `enterResult` | One row per `(test, parameter)` — updates allowed until submit; unknown parameter → 400. Verdict must be `pass|fail|na`. |
| `submitTest` | Locks the test; outcome is results-driven (all pass → `pass`, else `fail`); requires ≥1 parameter row. |
| `reviewTest` | **Supervisor only** (`lab_role=supervisor`); a supervisor may review tests on batches held by *any* lab (oversight guard), but never one it analyzed itself. `approved|rejected|rework_required`. |
| `certify` | Supervisor only, batch held by the lab. Requires ≥1 approved test. Runs the three-way species check first: if the lab's own identity verdict contradicts the farmer claim → `species_conflict` 409 (refuses certification). Writes `Certification` (SHA-256 hash), `SpeciesVerificationLog`, `BATCH_CERTIFIED` event, blockchain anchor, `AiFeedback` for AI-enabled verifications. |
| `reject` | Supervisor only; one open `RejectionRecord` per batch; reason codes `heavy_metal_failure | species_mismatch | microbial_failure | contamination | adulteration | other`; action `destroy | return_to_supplier | retest_required | hold_for_investigation`. Writes `BATCH_REJECTED` event + audit + species verification log. |
| `addDocument` | `test_report | microscopy_image | certificate | analysis_report` per batch/test. |
| `analytics` | Lab-scoped: testing volume, certified/rejected counts, pass/fail rates, avg certification hours, species-mismatch %. |

### Who can act

- **Analyst writes** (samples, tests, results) are holder-bound: the acting
  lab must currently hold the batch.
- **Supervisor oversight** (review/certify/reject) is lab-scoped: any
  supervisor-lab may act on batches held by a lab (the supervisor account is
  a separate user, not the holder).
- **Reads** are role-aware: the certifying lab, admin, and verified
  manufacturers see certificates (buyer-side trust); `Batch.test_status`
  shows on the public trace.

## 4. API surface (`/api/v1/labs`)

```
POST   /labs/batches/receive          intake receipt (checklist)
POST   /labs/samples                  draw a sample
POST   /labs/tests                    create a test on a sample
POST   /labs/tests/:id/results        enter/update one parameter result
POST   /labs/tests/:id/submit         lock + compute results-driven outcome
POST   /labs/reviews                  supervisor review (approve/reject/rework)
POST   /labs/certificates             issue COA -> batch certified (sha256)
POST   /labs/reject                   reject batch (reason + action)
POST   /labs/documents                attach test report / microscopy / COA
GET    /labs/batches                  lab dashboard (filter by test_status)
GET    /labs/batches/:id              dossier (receipt, samples, tests, results,
                                      reviews, docs, verifications, cert/rej)
GET    /labs/certificates             COA list (batch_id filter)
GET    /labs/analytics                lab-scoped metrics
```

The batch side adds: `GET /batches/:id` now returns the lab dossier and the
`test_status` label; `Batch.test_status` transitions append to the immutable
`BatchEvent` timeline (`BATCH_RECEIVED`, `BATCH_CERTIFIED`, `BATCH_REJECTED`,
…) and are anchored via `BlockchainEvent` like every other custody fact.

## 5. Supersession notes

- **`LabReport` / `LabTestResult` (Phase-1 placeholders) are dropped.** The
  header + flat-result model could not express "one batch → several samples →
  several tests → many parameters each". The new spine is
  `LabReceipt → SampleRecord → LabTest → LabTestResult (per parameter) +
  LabReview`. `TestParameter` survives and now references the richer rows.
- **`Batch.test_status`** replaces the old `LabReport.outcome` as the single
  source of truth for the certification substate (batch-level, queryable,
  shown on the public trace).
- Only the **unmounted legacy** `src/routes/*` code referenced the old
  tables; no live module did, so the migration (`20260904130000_phase8_lab`)
  is a clean drop + add with no data loss risk.

## 6. Verification

- `npx prisma validate --schema prisma/schema` → valid ✅ (80 models).
- Migration `20260904130000_phase8_lab` applied; template DB regenerated
  (migrations-only, each suite self-bootstraps species/parameters).
- `npm test` → **109/109** across all seven suites (13 new lab cases:
  intake→samples→tests→results→submit→review→certify, reject path,
  analyst/supervisor separation, species mismatch, tamper-hash integrity,
  role/status guards, analytics scoping).
- Live smoke **21/21** over real HTTP: farmer batch → governed custody to the
  lab (QR v1→v2→v3) → intake → 2 samples → 3 tests (physical/safety/identity)
  → supervisor reviews → COA (sha256) → `certified`; second batch runs the
  tulsi-vs-ashwagandha mismatch → certification refused (`species_conflict`)
  → `rejected` with alert; dashboard, analytics, documents, and the
  immutable timeline all verified.