Phase 3: Core Batch Management (Production-Grade)

This phase creates the first digital identity in HerbChain.

Everything later depends on this:

Ownership Transfer
Lab Testing
Certification
Manufacturing
Blockchain
Consumer Traceability


If Batch Creation is wrong, the complete chain becomes unreliable.

Goal of Phase 3

Convert a physical herb harvest into a trusted digital asset.

Physical Herb
      ↓
Farmer Registration
      ↓
Digital Batch
      ↓
Unique Batch ID
      ↓
QR Generated
      ↓
Ownership Assigned
      ↓
Blockchain Event Ready

Business Rules
Rule 1

One physical harvest batch = One Batch Record

Example:

Farmer Harvests

50 KG Ashwagandha
02 Sept 2026

↓

HERB-2026-000001

Rule 2

A Batch can never change its origin.

Cannot modify:

Farmer
Harvest Date
Origin Location
Species


after creation.

Only corrective amendments via audit workflow.

Rule 3

Every Batch must have:

Owner
QR
History
Location
Images


No exceptions.

Farmer Workflow
Step 1: Open Register Herb

Farmer Dashboard

+ Register New Herb Batch

Step 2: Capture Images

Farmer uploads images.

Recommended:

Plant Image

Harvested Herb Image

Storage Image


Minimum:

1 image mandatory


Maximum:

10 images

Image Metadata Captured

Automatically:

Filename

Timestamp

GPS Coordinates

Device ID

Upload User


Useful later for audits.

Step 3: AI Identification

Farmer captures image.

System sends image to AI.

Response:

Detected Species:

Ashwagandha

Confidence: 94%


Farmer Options:

Accept

Change Species

Manual Entry


Important:

AI suggests

Farmer confirms


AI should never become source of truth.

Step 4: GPS Capture

Automatically capture:

Latitude

Longitude

Accuracy


Example

Latitude:
13.0827

Longitude:
80.2707


Store:

Raw GPS

Readable Address


Example:

Village
Taluk
District
State
Country

Step 5: Farmer Enters Batch Details
Required Fields
Species

Harvest Date

Quantity

Unit

Cultivation Type

Location

Primary Image

Recommended Data Model
Basic Information
Species

Common Name

Scientific Name

Harvest Information
Harvest Date

Harvest Season

Cultivation Method


Values:

ORGANIC

CONVENTIONAL

WILD_COLLECTION

Quantity Information
Weight

Unit


Units:

KG

GRAM

TON

Quality Information
Color

Odor

Moisture Level

Farmer Remarks


Optional.

API Flow
POST /batch/create


Payload:

{
  "herbId": "uuid",
  "quantity": 50,
  "unit": "KG",
  "harvestDate": "2026-09-02",
  "cultivationType": "ORGANIC",
  "latitude": 13.0827,
  "longitude": 80.2707
}

Backend Validation

Before creation.

Check 1

Authenticated Farmer?

YES


Else:

401

Check 2

Farmer Active?

ACTIVE


Else:

403

Check 3

Herb Exists?

Ashwagandha exists?

Check 4

Quantity > 0 ?

Check 5

Images Uploaded?

Check 6

GPS Present?

Only then proceed.

Batch ID Generation

Critical design.

Never use database ID.

Bad:

1
2
3
4


Good:

HERB-2026-000001
HERB-2026-000002
HERB-2026-000003


Format:

PREFIX-YEAR-SEQUENCE

Unique Constraints
batch_id UNIQUE

NOT NULL


No duplicates possible.

Batch Status

Upon creation:

CREATED


Lifecycle:

CREATED

AVAILABLE

REQUESTED

IN_TRANSIT

UNDER_TESTING

CERTIFIED

FAILED

MANUFACTURING

CONSUMED

ARCHIVED

Ownership Creation

Immediately after batch creation.

Insert into:

current_ownership

Owner:
Farmer


Create history record.

ownership_history


Record:

System → Farmer


Transfer Type:

INITIAL_CREATION

QR Generation

Immediately after ownership assignment.

QR Design

QR must NOT store:

Farmer Data

Batch Details

Location

Quantity


Never expose internal data.

QR stores only:

Secure Token


Example:

hbc_8xH3KpL91A72a...


Database Entry

qr_tokens

token

batch_id

version = 1

status = ACTIVE


QR URL Format

https://herbchain.com/qr/hbc_8xH3KpL91A72a


When scanned:

Token
↓
Backend Lookup
↓
Permission Validation
↓
Authorized Response

Ownership Assignment

Automatically:

Current Owner

Farmer-001


Insert:

current_ownership

batch_id

owner_id

owner_role

Audit Record

Every batch creation must be logged.

Insert:

audit_logs


Action:

BATCH_CREATED


Example

User:
Farmer-001

Entity:
HERB-2026-000001

Timestamp:
2026-09-04 11:45

Blockchain Event Queue

Do NOT directly call blockchain.

Instead:

Batch Created
      ↓
Event Queue
      ↓
Blockchain Service


Create record:

PENDING


Event:

BATCH_CREATED


This prevents slow blockchain responses from affecting users.

File Storage Design

Images stored in:

Azure Blob

or

AWS S3


Database stores:

image_url


Only.

Example

https://storage/herb_batches/HERB-2026-000001/img1.jpg

Database Records Created During Batch Creation

A single successful registration creates records in:

herb_batches
1 row

batch_images
1..10 rows

current_ownership
1 row

ownership_history
1 row

qr_tokens
1 row

audit_logs
1 row

blockchain_event_queue
1 row

Transaction Management

All operations must run inside one database transaction.

Create Batch
      +
Create Ownership
      +
Create QR
      +
Create Audit
      +
Create Blockchain Event


Either:

ALL SUCCESS


or

ALL ROLLBACK


Never partial data.

Failure Handling
Image Upload Failed
Batch not created

QR Generation Failed
Rollback

Ownership Creation Failed
Rollback

Database Failure
Rollback

APIs Required
Farmer APIs
POST /batch/create

GET /batch/my-batches

GET /batch/:batchId

GET /batch/:batchId/history

GET /batch/:batchId/qr

Internal APIs
POST /internal/generate-batch-id

POST /internal/create-qr

POST /internal/create-ownership

Batch Creation Response
{
  "success": true,
  "batchId": "HERB-2026-000001",
  "status": "CREATED",
  "owner": "Farmer-001",
  "qrVersion": 1,
  "message": "Batch registered successfully"
}

Production-Level Edge Cases
Same Farmer Creates Multiple Harvests
Ashwagandha
50 KG

↓

Batch A

Ashwagandha
60 KG

↓

Batch B


Separate batches.

Wrong Species Selected

Cannot directly edit.

Use:

Correction Request Workflow


to preserve auditability.

Quantity Correction

Allowed only through:

Inventory Adjustment Log


Never overwrite original quantity.

Duplicate Registration

Flag if:

Same Farmer
Same Herb
Same Harvest Date
Same Quantity


within a short time window.

Show warning.

Final Output of Phase 3

After completion, HerbChain should support:

✅ Farmer Registration Validation

✅ Herb Image Upload

✅ GPS Capture

✅ AI Species Suggestion

✅ Batch Metadata Storage

✅ Unique Batch ID Generation

✅ Secure QR Generation

✅ Ownership Assignment

✅ Ownership History Creation

✅ Audit Logging

✅ Blockchain Event Creation

✅ Transaction Safety

✅ Complete Digital Birth of a Herb Batch


This phase creates the first trusted digital asset in HerbChain. Every later phase (QR transfers, lab certification, manufacturing, product lineage, consumer traceability, and blockchain proofs) will build on this batch identity.