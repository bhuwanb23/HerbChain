Phase 7: Shipment & Logistics Module (Production-Grade)

This phase manages the physical movement of herb batches.

Phase 6 answered:

Who owns the batch?

Phase 7 answers:

Where is the batch currently?

Who is transporting it?

Has it been picked up?

Has it been delivered?

Can we prove the delivery happened?

This becomes the transportation backbone of HerbChain.

Goal of Phase 7

Create a logistics system that manages:

Pickup Request
       ↓
Transport Assignment
       ↓
Pickup Confirmation
       ↓
GPS Tracking
       ↓
In Transit
       ↓
Delivery Confirmation
       ↓
Proof of Delivery

Core Philosophy

Ownership and Shipment are separate concepts.

Example:

Ownership = Transporter

Shipment = Active


or

Ownership = Manufacturer

Shipment = Closed


Never mix logistics data with ownership data.

Shipment Lifecycle
REQUESTED
     ↓
ASSIGNED
     ↓
ACCEPTED
     ↓
ARRIVED_FOR_PICKUP
     ↓
PICKED_UP
     ↓
IN_TRANSIT
     ↓
ARRIVED_DESTINATION
     ↓
DELIVERED
     ↓
COMPLETED


Failure paths:

CANCELLED

FAILED

REJECTED

1. Shipment Creation

Shipment can be created by:

Lab Requesting Batch

Manufacturer Requesting Batch

Admin Intervention

Example

Lab requests:

HERB-2026-000001


System creates:

Shipment:
SHIP-2026-000001

shipment_requests Table
id

shipment_id

batch_id

from_entity_id

from_role

to_entity_id

to_role

requested_by

shipment_type

status

priority

created_at

Shipment Types
FARM_TO_LAB

LAB_TO_MANUFACTURER

MANUFACTURER_TO_WAREHOUSE

CUSTOM

Priority Levels
LOW

NORMAL

HIGH

URGENT

2. Transport Assignment

Transporter assignment can be:

Automatic
Nearest Available Transporter

Manual
Admin Assigns

Marketplace (Future)
Transporters Accept Jobs

transporter_assignments
id

shipment_id

transporter_id

assigned_by

assigned_at

status


Status:

PENDING

ACCEPTED

DECLINED

CANCELLED

Transporter Workflow

Receives:

New Shipment


Can:

Accept

Reject

3. Pickup Management

Before pickup:

Batch Owner = Farmer


Transporter reaches location.

System captures:

GPS

Timestamp

Photo

QR Scan

Pickup Validation

Checks:

Shipment Exists?

Assigned Transporter?

Active QR?

Correct Batch?

Current Owner Valid?


If valid:

Pickup Confirmed

pickup_events
id

shipment_id

batch_id

transporter_id

pickup_latitude

pickup_longitude

pickup_photo

pickup_time

remarks

4. GPS Tracking

Major production feature.

While transport is active:

Track shipment movement

Tracking Frequency

Recommended:

Every 5 Minutes


or

Every 2 KM

shipment_tracking
id

shipment_id

latitude

longitude

speed

accuracy

captured_at

Benefits

AYUSH can see:

Current Position

Movement Route

Travel Timeline

Example Route
Farmer
 ↓
Madurai
 ↓
Dindigul
 ↓
Trichy
 ↓
Lab


Entire route stored.

5. Shipment Timeline Engine

Build real-time timeline.

Example:

08:00 Assigned

09:30 Accepted

11:00 Pickup

12:00 In Transit

16:30 Delivered

shipment_events
id

shipment_id

event_type

event_data

created_by

created_at

Event Types
ASSIGNED

ACCEPTED

PICKED_UP

STARTED

STOPPED

DELAYED

DELIVERED

FAILED

6. Geo-Fencing (Production Feature)

Prevent fake deliveries.

Example:

Lab Location:

13.0827
80.2707


Allowed Radius:

100 meters


Delivery accepted only if:

Transporter inside radius

Delivery Validation

Check:

GPS Match

Destination Match

Assigned Shipment

Assigned Transporter

Active QR

7. Delivery Management

Arrival at destination.

Example:

Transporter → Lab


or

Transporter → Manufacturer


Receiver scans QR.

System validates.

Then:

Ownership Transfer Triggered


This connects with Phase 6.

delivery_events
id

shipment_id

receiver_id

receiver_role

delivery_time

latitude

longitude

remarks

8. Proof of Delivery (POD)

Critical for audits.

Every delivery should have evidence.

Required POD Data
Receiver Confirmation

QR Scan

GPS

Timestamp

Optional POD Data
Photo

Digital Signature

Seal Verification

Remarks

proof_of_delivery
id

shipment_id

receiver_signature

receiver_photo

delivery_photo

remarks

uploaded_at

Example
Delivered To:
ABC Laboratory

Received By:
Dr. Kumar

Time:
16:42

GPS:
13.0827, 80.2707

9. Shipment Delays

Important for analytics.

Track:

Expected Delivery Time


vs

Actual Delivery Time

shipment_metrics
id

shipment_id

expected_hours

actual_hours

delay_minutes

Delay Reasons
Weather

Traffic

Vehicle Issue

Route Issue

Manual Delay

10. Failed Deliveries

Possible scenarios:

Receiver Unavailable

Wrong Batch

QC Issue

Damaged Shipment


Status:

FAILED

failed_delivery_logs
id

shipment_id

reason

photo_url

remarks

created_at

11. Shipment Documents

Every shipment may contain:

Invoice

Lab Request

Transfer Document

Certificates

shipment_documents
id

shipment_id

document_type

document_url

uploaded_at

12. Logistics Dashboard
For Transporter

Show:

Assigned Shipments

Active Deliveries

Completed Deliveries

Route History

For Lab

Show:

Incoming Shipments

Pending Deliveries

Received Shipments

For Manufacturer

Show:

Expected Herbs

Delivery Dates

Shipment Tracking

For AYUSH

Show:

Active Shipments

Delayed Shipments

Delivery Success %

Regions

13. Offline Tracking Support

Transporter may lose internet.

Allow:

Capture GPS

Capture Delivery

Store Locally


Then:

Sync When Online


Ownership should still only finalize after server validation.

14. APIs Required
Create Shipment
POST /shipments

Assign Transporter
POST /shipments/assign

Accept Shipment
POST /shipments/accept

Record Pickup
POST /shipments/pickup

Update GPS
POST /shipments/location

Deliver Shipment
POST /shipments/deliver

Upload POD
POST /shipments/pod

Shipment Timeline
GET /shipments/{id}/timeline

New Database Tables Added
transporter_assignments

pickup_events

delivery_events

proof_of_delivery

shipment_events

shipment_documents

shipment_metrics

failed_delivery_logs

End-to-End Flow
Lab Requests Batch
        ↓
Shipment Created
        ↓
Transporter Assigned
        ↓
Transporter Accepts
        ↓
Arrives At Farmer
        ↓
GPS Captured
        ↓
Pickup Photo
        ↓
QR Scan
        ↓
Ownership Transfer
        ↓
Shipment Starts
        ↓
GPS Tracking
        ↓
Arrives At Lab
        ↓
Receiver Scans QR
        ↓
Proof Of Delivery
        ↓
Shipment Completed

Final Output of Phase 7

After completion, HerbChain supports:

✅ Pickup Requests

✅ Delivery Requests

✅ Transporter Assignment

✅ Shipment Lifecycle Management

✅ GPS Tracking

✅ Route History

✅ Geo-Fencing Validation

✅ Pickup Confirmation

✅ Delivery Confirmation

✅ Proof Of Delivery

✅ Delay Tracking

✅ Shipment Documents

✅ Offline Shipment Support

✅ Logistics Analytics

✅ Complete Transport Management System


This phase makes HerbChain capable of proving not only who owned a batch, but also how, when, and through which route it physically moved across the AYUSH supply chain.