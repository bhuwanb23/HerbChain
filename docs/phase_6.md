Phase 6: Ownership Transfer Engine (Chain-of-Custody Module)

This is the most critical business engine in HerbChain.

Phase 5 created Dynamic QRs.

Phase 6 gives those QRs meaning.

Without this phase:

QR exists
Ownership exists

BUT

No trusted handover process exists.


This phase guarantees:

"At any point in time, HerbChain can prove exactly who owns a batch and who owned it before."

Goal of Phase 6

Create a secure ownership transfer workflow:

Farmer
 ↓
Transporter
 ↓
Lab
 ↓
Transporter
 ↓
Manufacturer


where every handover is:

Authenticated
Authorized
Validated
Audited
Traceable
Immutable

Core Principle

Ownership cannot be manually edited.

❌ Never:

UPDATE owner = Lab


✅ Always:

Transfer Event
        ↓
Validation
        ↓
Ownership History
        ↓
Current Ownership Update
        ↓
QR Rotation
        ↓
Audit Record

Ownership Transfer Lifecycle

Every transfer follows the exact same engine.

Request Transfer
      ↓
Scan QR
      ↓
Validate QR
      ↓
Verify Current Owner
      ↓
Verify Receiver
      ↓
Verify Authorization
      ↓
Transfer Ownership
      ↓
Deactivate QR
      ↓
Generate New QR
      ↓
Create Audit Record
      ↓
Create Blockchain Event

Supported Transfer Types

Create enum:

FARMER_TO_TRANSPORTER

TRANSPORTER_TO_LAB

LAB_TO_TRANSPORTER

TRANSPORTER_TO_MANUFACTURER

OWNER_REPLACEMENT

ADMIN_RECOVERY

Ownership State Model

Every batch has:

Historical Owner

Stored in:

ownership_history

Current Owner

Stored in:

current_ownership


Example

History
Farmer

Transporter

Lab

Transporter

Current
Manufacturer

Transfer Scenario 1
Farmer → Transporter
Current State
Batch:
HERB-2026-000001

Owner:
Farmer

QR:
v1 ACTIVE

Pickup Begins

Transporter opens app.

Scan Batch

QR Scan

Transporter scans Farmer's QR.

QR v1

Backend Validation Sequence
Validation 1

QR Exists?

YES

Validation 2

QR Active?

ACTIVE

Validation 3

Owner Matches QR?

Farmer

Validation 4

Transporter Assigned?

Check shipment assignment.

YES

Validation 5

Transfer Allowed?

Farmer → Transporter


Valid.

Validation 6

Batch Status

Must be:

AVAILABLE

or

REQUESTED

Ownership Transfer

Inside single transaction:

BEGIN

Update Current Owner
Farmer

↓

Transporter

Create History

Insert:

ownership_history


Record:

FROM Farmer

TO Transporter

TYPE Pickup

GPS

Timestamp

Deactivate QR
v1 ACTIVE

↓

v1 TRANSFERRED

Generate New QR
v2 ACTIVE


Owner:

Transporter

Create Audit
TRANSFER_COMPLETED

Create Blockchain Event
OWNERSHIP_TRANSFERRED

COMMIT

Result
Owner:
Transporter

QR:
v2

Transfer Scenario 2
Transporter → Lab

Same engine.

Before

Owner:
Transporter

QR:
v2 ACTIVE


Lab scans.

Validation:

Transporter Owner?

YES

Assigned Lab?

YES

Correct Shipment?

YES


After

Owner:
Lab

QR:
v3 ACTIVE


History:

Farmer → Transporter

Transporter → Lab

Transfer Scenario 3
Lab → Transporter

After certification.

Before:

Owner:
Lab


Transporter scans.

Validation:

Batch Certified?

YES

Manufacturer Request Exists?

YES

Lab Approval Exists?

YES


After:

Owner:
Transporter

QR:
v4

Transfer Scenario 4
Transporter → Manufacturer

Final raw material transfer.

Before:

Owner:
Transporter

QR:
v4


Validation:

Manufacturer Approved?

YES

Shipment Exists?

YES


After:

Owner:
Manufacturer

QR:
v5

Ownership Validation Engine

Build dedicated service:

OwnershipService


Responsibilities:

Current Owner Lookup

Ownership Verification

Transfer Validation

History Management

Transfer Execution


Never place ownership logic in controllers.

Ownership Rules Matrix
From	To	AllowedFarmer	Transporter	✅
Transporter	Lab	✅
Lab	Transporter	✅
Transporter	Manufacturer	✅
Farmer	Manufacturer	❌
Lab	Farmer	❌
Manufacturer	Lab	❌
Authorization Checks

Even valid QR is not enough.

Example:

Transporter scans batch


Checks:

Assigned Transporter

OR

System Authorized?


Not just:

Logged In

GPS Verification

Every transfer captures:

Latitude

Longitude

Timestamp


Store inside:

ownership_history


Example

Farmer Transfer

Location:
Madurai

Time:
09:45

Proof of Handover

Add transfer proof.

transfer_proofs
id

ownership_history_id

photo_url

receiver_signature

sender_signature

remarks

created_at


Possible Proofs

Photo

Digital Signature

QR Scan Evidence

Two-Party Confirmation (Production Feature)

Recommended.

Instead of:

Transporter scans


Use:

Transporter scans

AND

Farmer confirms


Flow

Transporter Requests Pickup
          ↓
Farmer Confirms
          ↓
Ownership Transfer


Prevents fraud.

Transfer Request Layer

Before ownership changes.

Create:

transfer_requests
id

batch_id

from_owner

to_owner

status

created_at


Status:

PENDING

APPROVED

REJECTED

COMPLETED

CANCELLED


Example

Lab Requests Batch


Creates:

Transfer Request


Only after approval:

Transfer occurs

Failed Transfer Handling

Examples:

QR Expired
Transfer Blocked

Wrong Owner
Transfer Blocked

Not Assigned Transporter
Transfer Blocked

Batch Already Transferred
Transfer Blocked

Batch Under Investigation
Transfer Blocked

Ownership History Design

Never delete records.

Example

Sequence 1

System → Farmer


Sequence 2

Farmer → Transporter


Sequence 3

Transporter → Lab


Sequence 4

Lab → Transporter


Sequence 5

Transporter → Manufacturer


Even after 10 years:

History remains available.

Audit Events

Create records for:

TRANSFER_INITIATED

TRANSFER_APPROVED

TRANSFER_REJECTED

TRANSFER_COMPLETED

TRANSFER_CANCELLED

Blockchain Events

Send after successful transfer.

OWNERSHIP_TRANSFERRED


Payload:

{
  "batchId":"HERB-2026-000001",
  "from":"Farmer",
  "to":"Transporter",
  "timestamp":"2026-09-04T12:00:00Z"
}

APIs Required
Create Transfer Request
POST /transfers/request

Approve Transfer
POST /transfers/approve

Reject Transfer
POST /transfers/reject

Execute Transfer
POST /transfers/execute

Ownership History
GET /batch/{id}/ownership-history

Current Ownership
GET /batch/{id}/owner

New Tables Added in Phase 6
transfer_requests
Transfer workflow

transfer_proofs
Transfer evidence

End-to-End Example
Farmer Creates Batch
        ↓
Owner = Farmer
        ↓
QR v1
        ↓
Transporter Assigned
        ↓
Scan QR
        ↓
Ownership Verified
        ↓
Farmer → Transporter
        ↓
QR v1 Deactivated
        ↓
QR v2 Created
        ↓
Transporter → Lab
        ↓
QR v2 Deactivated
        ↓
QR v3 Created
        ↓
Lab → Transporter
        ↓
QR v3 Deactivated
        ↓
QR v4 Created
        ↓
Transporter → Manufacturer
        ↓
QR v4 Deactivated
        ↓
QR v5 Created

Final Output of Phase 6

After completion, HerbChain supports:

✅ Transfer Requests

✅ Ownership Validation

✅ QR-Based Handover

✅ Authorized Transfers

✅ GPS-Based Transfer Records

✅ Current Ownership Tracking

✅ Complete Ownership History

✅ Proof of Handover

✅ Automatic QR Rotation

✅ Audit Logging

✅ Blockchain Event Generation

✅ Chain-of-Custody Reconstruction

✅ End-to-End Ownership Transfer Engine


This phase completes HerbChain's chain-of-custody foundation, making it possible to answer, at any point in time:

"Who currently owns this herb batch, who owned it before, when was it transferred, where was it transferred, and can that evidence be verified?"