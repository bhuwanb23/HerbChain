Phase 17: Offline Sync Module (Rural Connectivity Support)

This phase is extremely important because HerbChain targets:

Farmers
Transporters
Collection Centers
Remote Areas
Rural Networks


The reality is:

Internet will fail.

Mobile data will be unstable.

GPS may not always sync.

Users must continue working.


Without offline support:

No Network
    ↓
System Stops


With Phase 17:

No Network
    ↓
Continue Working
    ↓
Store Offline
    ↓
Sync Later


This makes HerbChain practical in the real world.

Goal of Phase 17

Allow users to perform critical operations when offline:

Offline QR Scan

Offline Batch Registration

Offline Pickup Confirmation

Offline Delivery Confirmation

Offline GPS Capture

Offline Proof Upload

Offline Transfer Requests


and automatically synchronize when connectivity returns.

Core Philosophy

Very important rule:

Offline Action
≠
Final Action


Example:

Transporter scans QR Offline


This means:

Pending Transfer


NOT

Ownership Changed


Ownership becomes final only after:

Server Validation
+
Successful Sync

Offline Architecture
Mobile App
      ↓

Local Database
      ↓

Offline Queue
      ↓

Network Available
      ↓

Sync Engine
      ↓

Backend Validation
      ↓

Commit Transaction

Local Mobile Database

Every mobile device should contain:

SQLite


or

Realm DB


Recommended:

SQLite


for simplicity.

What Must Be Available Offline?
Farmer
Create Batch Drafts

Capture Images

Store GPS

View Own Batches

Generate Registration Requests

Transporter
Scan QR

View Assigned Shipments

Record Pickup

Record Delivery

Capture GPS

Lab
Receive Shipment

Create Test Drafts

Create Sample Records

Manufacturer
View Inventory Cache

Create Production Drafts

Offline Storage Design

Create local storage collections.

offline_batches
local_id

batch_data

status

created_at

offline_scans
id

token

user_id

scan_time

sync_status

offline_shipments
id

shipment_id

event_data

sync_status

offline_transfers
id

batch_id

from_owner

to_owner

created_at

sync_status

Sync Status Values
PENDING

SYNCING

SYNCED

FAILED

CONFLICT

Offline Batch Registration
Scenario

Farmer is inside village.

No network.

Farmer performs:

Capture Herb Image

Capture GPS

Select Herb

Enter Quantity


System creates:

LOCAL_BATCH_001


stored locally.

Not yet a real batch.

Display:

Pending Synchronization


When internet returns:

Upload Batch
      ↓
Backend Validation
      ↓
Generate Official Batch ID
      ↓
Generate QR
      ↓
Sync Success

Offline QR Scanning

This is one of the hardest features.

Problem

QR validation normally requires:

Backend Check


Offline:

No Backend


Solution:

Mobile stores:

Recently Synced Active QRs


locally.

Offline Validation Levels
Level 1

Basic Local Validation

Check:

Known Token

Known Batch

Known Shipment


Result:

Probable Valid

Level 2

Server Validation

When online:

Official Validation


Never consider offline validation final.

Offline Ownership Transfer

Important design.

Wrong:

Scan Offline

Owner Changed


Correct:

Scan Offline

Transfer Request Created

Pending Sync


Example

Transporter receives batch offline.

Store:

Transfer Draft


Locally.

When online:

Sync Request


↓

Backend verifies:

QR Active?

Owner Correct?

Transfer Authorized?


↓

Then ownership changes.

Offline Shipment Tracking

Transporters may lose network during transit.

Allow storing:

GPS Coordinates

Timestamp

Speed

Route Events


locally.

Example

GPS Point 1

GPS Point 2

GPS Point 3


stored inside device.

Later:

Bulk Sync


to server.

Offline Proof of Delivery

Important.

Transporter reaches destination.

No network.

Must still record:

Photo

Signature

GPS

Timestamp


Store:

Delivery Draft


Locally.

Later:

Upload Evidence

Sync Engine

Core component of Phase 17.

Create dedicated:

SyncService


Responsibilities:

Detect Connectivity

Queue Processing

Conflict Resolution

Retry Logic

Partial Sync Recovery

Sync Queue

Every offline action enters queue.

sync_queue

(Local Mobile Table)

id

entity_type

operation

payload

priority

status

created_at


Operations

CREATE

UPDATE

TRANSFER

UPLOAD

DELETE

Queue Processing Order

Important.

Some actions depend on others.

Example

Batch Creation

↓

QR Generation

↓

Transfer


Sync order must be:

1. Batch

2. QR

3. Transfer


Not random.

Conflict Resolution Engine

One of the most important components.

Scenario

Transporter scans QR offline.

Meanwhile:

Batch already transferred online.


When sync occurs:

Backend detects:

QR No Longer Active


Result:

Conflict


Status:

CONFLICT


User sees:

Transaction could not be completed.

Common Conflict Scenarios
Ownership Conflict
Owner Changed


before sync.

QR Conflict
QR Expired


before sync.

Duplicate Batch
Same Batch Created Twice

Deleted Shipment
Shipment Cancelled


while offline.

Conflict Resolution Table
sync_conflicts
id

queue_id

conflict_type

description

resolved

created_at

Automatic Background Sync

When network available:

Reconnect
      ↓
Detect Pending Queue
      ↓
Start Sync
      ↓
Validate Records
      ↓
Upload Changes
      ↓
Update Status


No user action required.

Retry Logic

Failed syncs should retry automatically.

Schedule:

1 Minute

5 Minutes

15 Minutes

30 Minutes

1 Hour


Status:

FAILED


↓

Retry

↓

SYNCED

or

CONFLICT

Incremental Data Sync

Don't download everything.

Bad:

Download Entire Database


Good:

Changes Since Last Sync


Maintain:

last_sync_timestamp


for each device.

Data Caching

Store important operational data offline.

Examples:

Assigned Shipments

Owned Batches

Recent QRs

Master Herb List

User Profile

Media Upload Strategy

Images are large.

Store locally:

Photo

PDF

Document


Create upload job.

When online:

Upload File First

Get URL

Sync Record

Security in Offline Mode

Sensitive data stored locally must be protected.

Requirements:

Encrypted Local Storage

JWT Validation

Device Registration

Auto Logout


Do NOT store:

Passwords

Private Keys

Raw Credentials

Device Registration

Every device should have:

Device ID

User ID

Registration Time


If device lost:

Revoke Device


from server.

Offline Analytics

Track:

Pending Transactions

Average Sync Time

Conflict Rate

Offline Usage %


Useful for AYUSH adoption metrics.

User Experience Indicators

Users should clearly see status.

Examples:

✅ Synced

🟡 Pending Sync

🔴 Sync Failed

⚠ Conflict Detected

APIs Required
Sync Upload
POST /sync/upload

Sync Download
GET /sync/changes

Resolve Conflict
POST /sync/conflict

Device Registration
POST /devices/register

Sync Status
GET /sync/status

New Database Tables

Server Side:

device_registrations

sync_logs

sync_conflicts

sync_events


Mobile Side:

sync_queue

offline_batches

offline_transfers

offline_shipments

offline_scans

End-to-End Example
Farmer In Remote Village
          ↓
No Internet
          ↓
Registers Herb
          ↓
Saved Locally

Internet Restored
          ↓
Auto Sync
          ↓
Backend Validation
          ↓
Official Batch ID Generated
          ↓
QR Generated
          ↓
Ownership Created
          ↓
Sync Complete

Final Output of Phase 17

After completion, HerbChain supports:

✅ Offline Batch Registration

✅ Offline QR Scanning

✅ Offline Shipment Tracking

✅ Offline Pickup Confirmation

✅ Offline Delivery Confirmation

✅ Offline Proof Of Delivery

✅ Offline GPS Logging

✅ Local Mobile Database

✅ Transaction Queue

✅ Automatic Synchronization

✅ Conflict Detection

✅ Conflict Resolution

✅ Incremental Sync

✅ Retry Mechanism

✅ Device Registration

✅ Encrypted Local Storage

✅ Rural Connectivity Support


This phase makes HerbChain truly deployable across India's rural AYUSH ecosystem by ensuring that network availability never blocks field operations, while still preserving data integrity, ownership validation, traceability, and regulatory trust once synchronization occurs.