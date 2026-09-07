# File Storage / Document Management (Phase 15) — Architecture

**Status: complete.** Scope: `docs/phase_15.md` — the evidence repository of
HerbChain. Schema **110 → 117 models** (7 new in
`prisma/schema/98_documents.prisma`). Tests: `tests/documents/` (9 scenarios
over real HTTP), full regression **180/180** across 14 suites. Live smoke:
**18/18** over HTTP.

## 1. Core philosophy

**Files never live in PostgreSQL.** Bytes go to the storage driver
(`src/services/storage.js` — local disk v1; S3/Azure behind the same
interface). The DB keeps the registry + lifecycle. Building on the existing
`Asset`/`EntityDocument` upload flow, Phase 15 adds the managed-document
layer: versioning, access control, integrity, retention, shares, audit and
blockchain hash anchoring.

## 2. Schema (7 new models)

| Model | Table | Role |
|---|---|---|
| `Document` | `documents` | Master file registry (per logical doc): category, entity ref, storage key, sha256, visibility, status |
| `DocumentVersion` | `document_versions` | **Never overwrite** — every upload of the same doc is a new version |
| `DocumentAccessLog` | `document_access_logs` | UPLOAD / VIEW / DOWNLOAD / VERIFY / SHARE audit |
| `DocumentShare` | `document_shares` | Consumer-safe PUBLIC short codes (revocable, expiring) |
| `DocumentRetentionRule` | `document_retention_rules` | Per-category retention (10y herbs, 15y certificates, permanent regulatory) |
| `CertificateDocument` | `certificate_documents` | certificate_number ↔ document + independent hash link |
| `StorageJob` | `storage_jobs` | Async pipeline: virus scan / archive / delete |

Migration: `20260905101712_phase15_documents`.

## 3. Storage categories & visibility

8 categories mirror the production folder layout (`herbs`, `laboratory`,
`certificates`, `shipments`, `products`, `compliance`, `investigations`,
`user`) with an entity-type allow-list per category. Visibility levels:
`PUBLIC` (consumer passport PDFs) · `RESTRICTED` (entity parties) ·
`CONFIDENTIAL` (raw lab reports) · `REGULATORY` (investigations — admin
only). The ACL resolves entity parties polymorphically (batch farmer/holder,
shipment parties, product manufacturer, certificate farmer+lab) so a farmer
can read their batch's certificate PDF but an unrelated manufacturer cannot.

## 4. Lifecycle

Upload → validation (mime allow-list + per-type size caps) → sha256 checksum
→ storage driver put → registry + version rows → optional virus-scan
`StorageJob` → access log → audit log → **blockchain anchor** for evidence
categories (certificates / compliance / investigations / laboratory). The
`document` blockchain entity hashes the file checksum — tampering the file
flips `verify()` to TAMPERED. Retention scans queue archive jobs; the worker
drains virus-scan + archive/delete jobs on a timer.

## 5. APIs (`/api/v1/documents`)

Upload/version, list (entity/category scoped), download (ACL + access log),
metadata, `verify` (INTACT / TAMPERED), share create/revoke,
`certificates/link`, access logs, admin overview + retention run + job drain,
and an **unauthenticated** `/shares/:code` for consumer passport documents.

## 6. Domain notes

- Versioning is append-only: `document_versions` keeps every byte set; the
  `Document` row points at the current version. Old versions stay readable.
- Certificate linking reuses the certificate's own `certificate_hash` and is
  audited (`CERTIFICATE_DOCUMENT_LINKED`).
- Fail-open uploads: RBAC `documents.upload/view/share/manage` mirrors the
  access matrix (farmer own batches, transporter assigned shipments, lab
  reports + certs, manufacturer products, admin everything + retention).

## 7. Verification

- **180/180** across all fourteen suites (9 new: upload validation +
  checksum + on-disk bytes, versioning with v1 preserved, INTACT → tamper →
  TAMPERED, ACL owner/party/other-403/admin/anonymous, PUBLIC share →
  consumer download → revoke, retention scan + worker archive, certificate
  link + blockchain anchor VALID, listing + admin overview + RBAC gates).
- **Live smoke 18/18** over HTTP: farmer herb upload → checksum + no
  `storage_key` leak → bad mime 400 → lab cert upload + certificate link →
  verify INTACT → v2 versioning → restricted report 403 for manufacturer /
  200 for lab + admin → PUBLIC share → anonymous consumer download →
  admin overview → consumer blocked from upload.

Bugs the tests caught: (1) zod's default `.parse()` silently strips extra
route params, so `DELETE /:id/shares/:shareId` sent `shareId: undefined` →
fixed with a two-param schema; (2) direct certification fixtures need a real
`Batch` row (FK) → the suite now creates batches through a helper.
