Phase 12: Blockchain Layer (Permissioned Blockchain Network)

This is the trust layer of HerbChain.

Many projects make a huge mistake:

Everything → Blockchain


Result:

Slow
Expensive
Complex
Hard to Scale


HerbChain should follow a Hybrid Architecture:

Mobile Apps
      ↓
Backend APIs
      ↓
PostgreSQL
      ↓
Blockchain Event Service
      ↓
Permissioned Blockchain


The database remains the operational system.

The blockchain becomes the:

Source of Trust
Source of Proof
Source of Auditability

Phase Goal

Create a permissioned blockchain network that stores only:

Critical Business Events


and allows anyone with proper access to verify:

Who created a batch?

Who owned it?

Who certified it?

Which product used it?

Was any record altered?

Core Philosophy

Blockchain stores:

✅ Proof

✅ Event Hashes

✅ Ownership Events

✅ Certifications

✅ Product Lineage

Blockchain DOES NOT store:

❌ Images

❌ Lab PDFs

❌ GPS Logs

❌ Product Details

❌ User Profiles

❌ Inventory Data

❌ Large Documents

Those remain in PostgreSQL and Storage.

Hybrid Architecture
                   HERBCHAIN

                    USERS
                      │
                      ▼

                API BACKEND
                      │
          ┌───────────┴───────────┐
          ▼                       ▼

      PostgreSQL           Blockchain Service
          │                       │
          ▼                       ▼

 Operational Data      Permissioned Blockchain

What Goes to Blockchain?

Only trusted milestones.

Batch Creation
Farmer Creates Batch


Store Proof:

Batch ID

Farmer ID

Timestamp

Hash


Event:

BATCH_CREATED

Ownership Transfer

Every transfer.

Example:

Farmer → Transporter


Event:

OWNERSHIP_TRANSFERRED


Contains:

Batch ID

From Owner

To Owner

Timestamp

Lab Certification

Event:

LAB_CERTIFIED


Contains:

Batch ID

Certificate Number

Lab ID

Timestamp

Batch Rejection

Event:

BATCH_REJECTED


Contains:

Reason

Certificate Reference

Timestamp

Product Creation

Event:

PRODUCT_CREATED


Contains:

Product ID

Manufacturer

Timestamp

Ingredient Linking

Event:

BATCH_LINKED_TO_PRODUCT


Contains:

Product ID

Batch ID

Timestamp

Permissioned Blockchain Choice

For HerbChain:

Recommended
Hyperledger Fabric


because:

Permissioned

Enterprise Ready

Private Data

Rich Access Control

No Cryptocurrency

No Gas Fees

Good Auditability

Network Participants

Every major stakeholder may have nodes.

AYUSH Node
Primary Governance Node

Laboratory Nodes
Certification Verification

Manufacturer Nodes
Product Production Verification

Regional Authority Nodes

Future Scaling

State AYUSH Boards


Network Example:

                 AYUSH

                   │

       ┌───────────┼───────────┐

       ▼           ▼           ▼

      LAB A      LAB B      MANUFACTURER

                   │

                   ▼

             ORDERER NODE

Blockchain Data Model

Every blockchain record should follow a common structure.

Blockchain Transaction
{
  "eventType": "BATCH_CREATED",
  "entityId": "HERB-2026-000001",
  "timestamp": "2026-09-05T10:30:00",
  "performedBy": "Farmer-001",
  "hash": "a73c8f9..."
}

Blockchain Event Types

Important enum.

BATCH_CREATED

OWNERSHIP_TRANSFERRED

LAB_CERTIFIED

LAB_REJECTED

PRODUCT_CREATED

BATCH_LINKED_TO_PRODUCT

PRODUCT_RECALLED

USER_VERIFIED

COMPLIANCE_FLAGGED

Smart Contract Design

Create one primary contract.

Batch Contract

Handles:

Batch Creation

Ownership

Certification

Linkage

Contract Function 1
createBatch()

Called after Phase 3.

Input:

Batch ID

Farmer ID

Timestamp


Output:

Transaction Hash

Contract Function 2
transferOwnership()

Called after Phase 6.

Input:

Batch ID

Old Owner

New Owner

Transfer Type


Validation:

Current Owner Correct?

Authorized Transfer?

Valid State?


Output:

Ownership Recorded

Contract Function 3
certifyBatch()

Called after Phase 8.

Input:

Batch ID

Certificate Number

Lab ID

Result


Output:

Certification Proof

Contract Function 4
createProduct()

Called after Phase 10.

Input:

Product ID

Manufacturer

Date


Output:

Product Blockchain Record

Contract Function 5
linkBatchToProduct()

Most important function.

Links:

Batch
       ↓
Product


Input:

Batch ID

Product ID


Output:

Immutable Lineage Record

Event Queue Architecture

Never call blockchain directly from REST APIs.

Bad:

API
 ↓
Blockchain


If blockchain slows down:

App becomes slow


Recommended:

API
 ↓
PostgreSQL
 ↓
Blockchain Queue
 ↓
Blockchain Worker
 ↓
Blockchain

Blockchain Event Queue

Create:

blockchain_event_queue
id

event_type

entity_type

entity_id

payload

status

retry_count

created_at


Status:

PENDING

PROCESSING

COMPLETED

FAILED

Flow Example

Batch Creation:

Farmer Creates Batch
      ↓
DB Commit
      ↓
Queue Event
      ↓
Background Worker
      ↓
Blockchain Transaction
      ↓
Transaction Hash Stored


User never waits.

Blockchain Record Table
blockchain_transactions
id

event_id

transaction_hash

block_number

event_type

status

created_at

Hashing Strategy

Never store entire records on chain.

Create hash of business data.

Example:

Batch Metadata


↓

SHA256 HASH


↓

Store Hash On Chain


If someone modifies database:

Current Hash
        ≠
Blockchain Hash


Tampering detected.

Batch Hash Example

Input:

Batch ID

Farmer ID

Harvest Date

Quantity


Generate:

SHA256


Result:

A72KD9B83JK...


Store on blockchain.

Verification Engine

AYUSH can verify:

Database Record
       ↓
Generate Hash
       ↓
Compare With Blockchain
       ↓
Match?


Result:

VALID


or

TAMPERED

Product Traceability on Blockchain

Example:

PRODUCT-001


Linked:

HERB-001

HERB-014

HERB-027


On chain:

PRODUCT_CREATED

BATCH_LINKED

BATCH_LINKED

BATCH_LINKED


Creates immutable lineage.

Recall Verification

Future scenario:

Batch Recalled


AYUSH can instantly verify:

Affected Products

Affected Manufacturers

Affected Regions


through immutable lineage records.

Node Permissions

Not every node can do everything.

AYUSH
Read
Write
Audit
Governance

Laboratory
Certification Events
Read Access

Manufacturer
Product Events
Read Access

Transporters
No Blockchain Access

Use Backend Only


Important optimization.

Consensus Model

Since network is permissioned:

Use:

RAFT


instead of Proof-of-Work.

Benefits:

Fast

Energy Efficient

Enterprise Friendly

Blockchain Audit Dashboard

AYUSH should see:

Total Transactions

Failed Transactions

Latest Certifications

Ownership Transfers

Product Creations

Smart Contract Activity

Smart Contract Security Rules
Rule 1

Cannot certify non-existing batch.

Rule 2

Cannot transfer ownership if already transferred.

Rule 3

Cannot link rejected batch to product.

Rule 4

Cannot create duplicate product ID.

Rule 5

Cannot modify historical event.

Blockchain Failure Handling

If blockchain unavailable:

Business Operation Completes


because DB is source of operation.

Queue status:

PENDING


Later:

Retry


until success.

Retry Strategy
1 Minute

5 Minutes

15 Minutes

30 Minutes

1 Hour


after failures.

APIs

Most blockchain operations should be internal.

Public/Internal Reads
GET /blockchain/batch/{id}

GET /blockchain/product/{id}

GET /blockchain/verify/{hash}

Internal Writes
POST /blockchain/create-batch

POST /blockchain/transfer

POST /blockchain/certify

POST /blockchain/create-product

POST /blockchain/link


Usually only called by backend workers.

Additional Tables Required
blockchain_event_queue

blockchain_transactions

blockchain_nodes

smart_contract_versions

blockchain_audit_logs

End-to-End Example
Farmer Creates Batch
        ↓
Batch Saved
        ↓
BATCH_CREATED Queued
        ↓
Smart Contract createBatch()
        ↓
Hash Stored On Chain
        ↓

Transport Transfer
        ↓
TRANSFERRED Queued
        ↓
transferOwnership()
        ↓
Ownership Proof Stored
        ↓

Lab Certification
        ↓
CERTIFIED Queued
        ↓
certifyBatch()
        ↓
Certificate Proof Stored
        ↓

Manufacturer Creates Product
        ↓
PRODUCT_CREATED
        ↓
createProduct()
        ↓

Ingredient Linking
        ↓
linkBatchToProduct()
        ↓
Immutable Product Lineage

Final Output of Phase 12

After completion, HerbChain supports:

✅ Permissioned Blockchain Network

✅ Hyperledger Fabric Architecture

✅ Trusted Event Recording

✅ Blockchain Event Queue

✅ Smart Contracts

✅ Batch Creation Proofs

✅ Ownership Transfer Proofs

✅ Certification Proofs

✅ Product Creation Proofs

✅ Product Lineage Proofs

✅ Tamper Detection

✅ Hash Verification

✅ Immutable Audit Trail

✅ Enterprise Access Control

✅ AYUSH Governance Layer

✅ Blockchain-Based Traceability Verification


This phase completes HerbChain's trust architecture.

The database tells the system what happened, while the blockchain proves that what happened has not been altered, creating a supply chain that is not only traceable, but cryptographically verifiable, auditable, and regulator-grade trustworthy.