Phase 9: Manufacturer Module (Raw Material Procurement System)

This phase is where certified herb batches become actual manufacturing inputs.

Up to now:

Farmer
 ↓
Transport
 ↓
Laboratory
 ↓
Certification


Phase 9 starts:

Certified Batch
 ↓
Manufacturer Procurement
 ↓
Inventory
 ↓
Production Ready Stock


This phase ensures manufacturers only procure:

Verified
Certified
Traceable
Available


raw materials.

Goal of Phase 9

Allow manufacturers to:

View Certified Herbs
       ↓
Request Required Batches
       ↓
Get Lab Approval
       ↓
Receive Goods
       ↓
Take Ownership
       ↓
Manage Inventory
       ↓
Reserve Herbs For Production

Core Philosophy

Manufacturer does NOT buy herbs directly from database records.

Manufacturer acquires:

Certified Batch + Ownership + Lab Certificate + Full History


Every batch entering manufacturing must remain traceable.

Manufacturing Workflow
View Certified Batches
         ↓
Select Batch
         ↓
Request Quantity
         ↓
Lab Approval
         ↓
Shipment Created
         ↓
Transport Assignment
         ↓
Receive Material
         ↓
Ownership Transfer
         ↓
Add To Inventory
         ↓
Available For Production

1. Manufacturer Dashboard

Main sections:

Available Certified Herbs

Requested Batches

Incoming Deliveries

Inventory

Reserved Materials

Consumed Materials

Reports

Dashboard KPIs

Show:

Available Inventory

Pending Requests

Incoming Shipments

Expiring Certificates

Consumed Materials

Active Products

2. View Certified Herbs

Manufacturer should only see:

CERTIFIED


batches.

Never show:

FAILED

UNDER_TESTING

REJECTED

Search Filters
Herb Name

Batch ID

Location

Lab

Farmer

Harvest Date

Certification Date

Quantity Available

Display Data
Batch ID

Herb Name

Quantity

Current Owner (Lab)

Certification Status

Lab Name

Certificate Number

Harvest Location

Harvest Date

Additional Traceability Data

Manufacturer can inspect:

Original Farmer

Transport History

Lab History

Certificate


before procurement.

3. Batch Request System

Manufacturer selects:

HERB-2026-000001


Request:

40 KG

request_batches
id

request_id

manufacturer_id

batch_id

requested_quantity

approved_quantity

status

requested_at


Status:

PENDING

APPROVED

PARTIALLY_APPROVED

REJECTED

FULFILLED

Partial Quantity Support

Critical requirement.

Example:

Batch Total:
100 KG


Manufacturer A:

40 KG


Manufacturer B:

30 KG


Remaining:

30 KG


Must be supported.

Inventory Splitting

Because batches may be partially consumed.

Create:

batch_inventory
id

batch_id

total_quantity

available_quantity

reserved_quantity

consumed_quantity

updated_at

Example
Batch:
100 KG

Available:
100 KG


Request:

40 KG


After reservation:

Available:
60 KG

Reserved:
40 KG

4. Request Approval Workflow

Manufacturer requests batch.

Request goes to:

Current Owner (Lab)

Lab Actions

Can:

Approve

Reject

Partially Approve


Example

Requested:

50 KG


Lab approves:

30 KG


System updates:

PARTIALLY_APPROVED

5. Procurement Allocation

After approval:

Allocate inventory.

Create:

inventory_allocations
id

batch_id

request_id

allocated_quantity

status

allocated_at


Status:

RESERVED

RELEASED

CANCELLED

Why Reservation Matters

Prevents:

100 KG Available

Manufacturer A Requests 100 KG

Manufacturer B Requests 100 KG

Both Approved


Reservation solves overselling.

6. Shipment Creation

After approval:

Automatically create:

Shipment


Flow:

Lab
 ↓
Transporter
 ↓
Manufacturer


Utilizes Phase 7 logistics engine.

7. Receive Batch

Manufacturer receives shipment.

Validation:

QR Active?

Transport Valid?

Assigned Shipment?

Correct Batch?


Upon success:

Ownership Transfer


from:

Transporter


to:

Manufacturer


Result:

Current Owner = Manufacturer

8. Goods Receipt Process

Production-grade systems require GRN.

(Goods Receipt Note)

Create:

goods_receipts
id

grn_number

manufacturer_id

batch_id

received_quantity

accepted_quantity

rejected_quantity

received_at

Example

Delivered:

50 KG


Accepted:

48 KG


Rejected:

2 KG


Reason:

Packaging Damage

9. Inventory Management

The most important part of this phase.

inventory_items
id

manufacturer_id

batch_id

available_quantity

reserved_quantity

consumed_quantity

unit

created_at

Inventory States
AVAILABLE

RESERVED

IN_PRODUCTION

CONSUMED

DISCARDED

Example

Received:

100 KG


Inventory:

Available = 100


Production reserves:

40 KG


Inventory:

Available = 60

Reserved = 40

10. Inventory Transactions

Never update inventory directly.

Create transaction logs.

inventory_transactions
id

inventory_id

transaction_type

quantity

reference_id

created_at


Transaction Types

RECEIVED

RESERVED

RELEASED

CONSUMED

ADJUSTED

DISCARDED

Example

Audit Trail:

100 KG Received

40 KG Reserved

40 KG Consumed

20 KG Remaining

11. Certificate Validation

Before inventory acceptance.

System checks:

Certificate Exists?

Certificate Valid?

Not Expired?

Batch Approved?


If:

Certificate Expired


Block procurement.

12. Quality Holds

Production feature.

Manufacturer may quarantine batch.

Example:

Packaging Issue

Unexpected Smell

Visual Difference

quality_holds
id

batch_id

manufacturer_id

reason

status

created_at


Status:

ACTIVE

RESOLVED


When active:

Batch cannot enter production.

13. Recall Readiness

Future-critical feature.

Track:

Which batches entered inventory


because later:

Certifications may be revoked.


Example

AYUSH says:

Recall Batch:
HERB-2026-000001


Manufacturer instantly knows:

Current Stock

Consumed Quantity

Products Affected

14. Manufacturer Analytics

Display:

Inventory Levels

Top Herbs

Monthly Consumption

Pending Deliveries

Supplier Sources

Certified Batch Count

Useful KPIs
Stock Value

Consumption Rate

Average Procurement Time

Batch Utilization %

Certification Success %

15. Audit Events

Create logs for:

REQUEST_CREATED

REQUEST_APPROVED

GRN_CREATED

INVENTORY_RECEIVED

INVENTORY_RESERVED

INVENTORY_CONSUMED

Blockchain Events

Store important events:

MATERIAL_RECEIVED

BATCH_ACCEPTED

INVENTORY_ENTERED

APIs Required
View Certified Batches
GET /manufacturer/certified-batches

Request Batch
POST /manufacturer/request-batch

Approve Request (Lab)
POST /lab/approve-request

Receive Batch
POST /manufacturer/receive

Inventory
GET /manufacturer/inventory

Inventory Transactions
GET /manufacturer/inventory/history

Place Quality Hold
POST /manufacturer/quality-hold

New Database Tables Added
request_batches

batch_inventory

inventory_allocations

goods_receipts

inventory_items

inventory_transactions

quality_holds

End-to-End Flow
Certified Batch Available
         ↓
Manufacturer Views Batch
         ↓
Request Created
         ↓
Lab Approves
         ↓
Inventory Reserved
         ↓
Shipment Created
         ↓
Transporter Delivery
         ↓
Manufacturer Receives
         ↓
Ownership Transfer
         ↓
GRN Created
         ↓
Inventory Added
         ↓
Ready For Production

Final Output of Phase 9

After completion, HerbChain supports:

✅ View Certified Herbs

✅ Batch Procurement Requests

✅ Full Approval Workflow

✅ Partial Quantity Procurement

✅ Inventory Reservation

✅ Shipment Integration

✅ Batch Receiving

✅ Goods Receipt Notes (GRN)

✅ Certificate Validation

✅ Inventory Management

✅ Inventory Transactions

✅ Quality Holds

✅ Recall Readiness

✅ Procurement Analytics

✅ Complete Raw Material Procurement System


This phase transforms a certified herb batch into a controlled manufacturing inventory asset, ensuring every gram entering production remains traceable, measurable, auditable, and linked to its original farmer, laboratory certification, and supply-chain history.