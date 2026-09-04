Phase 5: Dynamic QR Engine (Production-Grade)

This is the core innovation of HerbChain.

Most traceability systems generate a QR once and never change it.

HerbChain is different:

Ownership Changes
        ↓
Old QR Dies
        ↓
Ownership Changes
        ↓
New QR Born


At any moment:

One Batch
One Current Owner
One Active QR


This phase creates the digital chain-of-custody mechanism that powers the entire platform.

Goal of Phase 5

Create a QR lifecycle where:

Batch Created
      ↓
QR v1 Generated
      ↓
Transfer Ownership
      ↓
QR v1 Deactivated
      ↓
QR v2 Generated
      ↓
Transfer Ownership
      ↓
QR v2 Deactivated
      ↓
QR v3 Generated


Thus ownership and QR always stay synchronized.

Core Business Principle

A QR does NOT represent the herb.

A QR represents:

Current Ownership State


Example:

Batch:
HERB-2026-000001

Owner:
Farmer

QR:
v1


After transfer:

Batch:
HERB-2026-000001

Owner:
Transporter

QR:
v2


The batch remains the same.

Only ownership state changes.

QR Lifecycle
GENERATED
    ↓
ACTIVE
    ↓
SCANNED
    ↓
TRANSFERRED
    ↓
DEACTIVATED


or

GENERATED
    ↓
ACTIVE
    ↓
EXPIRED

QR Design

Never store full metadata inside QR.

❌ Wrong

Farmer Name
Batch Details
GPS
Weight


✅ Correct

Secure Token


Example:

hbc_d9fa72e871cd4f9aa65


or

https://herbchain.app/verify/hbc_d9fa72e871cd4f9aa65

Database Design
qr_tokens
id

batch_id

token

version

status

owner_id

owner_role

generated_by

generated_at

activated_at

deactivated_at

expiry_at

reason

QR States
ACTIVE

TRANSFERRED

EXPIRED

INVALIDATED

REVOKED

Meaning of States
ACTIVE

Current valid QR.

Can be scanned
Can transfer ownership

TRANSFERRED

Used successfully.

No longer valid

EXPIRED

Expired naturally.

Cannot transfer

INVALIDATED

System invalidated.

Example:

Wrong QR

Duplicate Issue

Fraud Investigation

REVOKED

Admin forced cancellation.

Versioning System

Every ownership transfer creates new version.

Example:

Batch:
HERB-2026-000001


QR History

v1 Farmer

v2 Transporter

v3 Lab

v4 Transporter

v5 Manufacturer


All previous versions remain stored permanently.

Only One Active QR Rule

Critical Rule.

At database level:

One ACTIVE QR
Per Batch


Never:

2 Active QR

3 Active QR


for same batch.

Example

Valid

Batch A

QR v1 = TRANSFERRED

QR v2 = ACTIVE


Invalid

Batch A

QR v1 = ACTIVE

QR v2 = ACTIVE


Must never happen.

QR Generation Service

Create dedicated service.

QR Service


Responsibilities:

Generate Token

Generate QR Image

Store Metadata

Activate QR

Deactivate Previous QR


Never spread logic across modules.

Token Generation

Must be cryptographically random.

Example:

uuid + random bytes + hashing


Result:

hbc_92kDj71LpQ2A...


Requirements:

Unique

Unpredictable

Non-sequential

QR Image Design

Visual QR contains:

QR

Batch ID

Current Version

HerbChain Logo


Example:

Batch:
HERB-2026-000001

QR Version:
5


But scanning only reveals token.

Initial Batch Creation

When farmer creates batch:

System automatically creates:

QR Version:
1


Status:

ACTIVE


Owner:

Farmer

QR Validation Engine

Every scan must go through backend.

Flow:

Scan QR
     ↓
Extract Token
     ↓
API Call
     ↓
Find Token
     ↓
Validate
     ↓
Return Result

Validation Checklist
Check 1

QR exists?

YES


Else:

INVALID_QR

Check 2

QR active?

ACTIVE


Else:

QR_EXPIRED

Check 3

Batch exists?

Check 4

Ownership record exists?

Check 5

Authorized transfer?

Check 6

User allowed to receive batch?

Only then continue.

QR Scan API
POST /qr/validate


Input:

{
  "token":"hbc_xxxxx"
}


Output:

{
  "valid":true,
  "batchId":"HERB-2026-000001",
  "owner":"Farmer",
  "status":"ACTIVE"
}

Scan Logging

Every scan must be logged.

qr_scan_logs
id

qr_token_id

user_id

device_id

latitude

longitude

scan_result

created_at

Scan Results
SUCCESS

FAILED

EXPIRED

UNAUTHORIZED

INVALID_TOKEN

Transfer-Aware QR Engine

The most important part.

Current State:

Batch
 ↓
Farmer
 ↓
QR v1 ACTIVE


Transporter arrives.

Scans QR.

System verifies ownership.

After approval:

QR v1
 ↓
TRANSFERRED


Then:

QR v2
 ↓
ACTIVE


Owner:

Transporter

Ownership Transfer Flow
Scan QR
      ↓
Validate
      ↓
Verify Ownership
      ↓
Verify Shipment
      ↓
Transfer Owner
      ↓
Deactivate Current QR
      ↓
Generate New QR
      ↓
Activate New QR
      ↓
Commit Audit

Atomic Transaction Rule

Critical.

Ownership transfer and QR change must occur together.

Never:

Owner Changed

But QR Not Updated


or

QR Updated

But Owner Not Changed


Database transaction:

BEGIN

Transfer Ownership

Deactivate QR

Create New QR

Insert History

Audit Log

COMMIT


or

ROLLBACK

QR Expiry Strategy

Recommended.

Not ownership expiry.

QR token expiry.

Example:

QR Generated

Valid For:
30 Days


If shipment not completed:

Expired


Requires regeneration.

Expiry Scenarios
Missed Pickup

Farmer generates QR.

Transport never arrives.

After:

30 Days


QR expires.

Stale Ownership Token

Lost paperwork.

Inactive transaction.

Expire token.

Auto Regeneration

Owner can request:

Generate Replacement QR


Conditions:

Still Current Owner

No Pending Transfers


Then:

Old QR → REVOKED

New QR → ACTIVE

Lost QR Scenario

Farmer loses printed QR.

Flow:

Open Batch
 ↓
Request New QR
 ↓
Verify Identity
 ↓
Generate New Version


Example:

v1 ACTIVE

Lost

↓

v1 REVOKED

v2 ACTIVE


Ownership unchanged.

Fraud Protection

Scenario:

Someone photocopies QR


Problem?

No.

Because:

QR Validity Checked Live


After transfer:

Original QR Dead


Copy also dead.

Replay Attack Protection

Scenario:

Old QR scanned again


System checks:

Status = TRANSFERRED


Response:

QR no longer active.

QR Replacement Tracking

Add:

qr_replacement_logs
id

batch_id

old_qr

new_qr

reason

created_by

created_at


Reasons:

LOST

DAMAGED

EXPIRED

ADMIN_REPLACEMENT

Consumer QR vs Ownership QR

Important distinction.

Ownership QR

Used internally.

Farmer
Transporter
Lab
Manufacturer


Changes frequently.

Product QR

Used by consumers.

Permanent


Never changes.

APIs Required
Generate QR
POST /qr/generate

Validate QR
POST /qr/validate

Regenerate QR
POST /qr/regenerate

Get Active QR
GET /batch/:id/qr

QR History
GET /batch/:id/qr/history

New Database Additions
qr_replacement_logs
QR replacement history

qr_versions (Optional)

If large scale.

Store version history separately.

Monitoring Metrics

Track:

Total Active QR

Expired QR

Invalid Scans

Successful Transfers

Fraud Attempts

Replacement Requests


Useful for AYUSH Dashboard later.

End-to-End Dynamic QR Flow
Batch Created
      ↓
QR v1 Active
      ↓
Transporter Pickup
      ↓
Validate QR
      ↓
Transfer Approved
      ↓
QR v1 Deactivated
      ↓
QR v2 Generated
      ↓
Transporter Owner
      ↓
Lab Scan
      ↓
QR v2 Deactivated
      ↓
QR v3 Generated
      ↓
Lab Owner

Final Output of Phase 5

After completion, HerbChain supports:

✅ Secure QR Generation

✅ Cryptographically Random Tokens

✅ QR Validation Engine

✅ Active/Inactive States

✅ One Active QR Per Batch

✅ Automatic QR Rotation

✅ QR Versioning

✅ QR Expiry

✅ QR Replacement

✅ Scan Logging

✅ Fraud Protection

✅ Replay Protection

✅ Transfer-Linked QR Lifecycle

✅ Dynamic Ownership QR System


This phase delivers the single biggest differentiator of HerbChain:

A batch's QR is not permanent. It evolves with ownership, creating a live, verifiable chain-of-custody where only the current legitimate holder possesses the active QR.