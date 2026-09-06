Perfect. The Transporter App is the operational backbone of HerbChain. Unlike farmers who create batches, transporters are responsible for maintaining the integrity of the chain of custody and physical movement of goods.

Transporter Role Overview
Who is a Transporter?

A transporter is responsible for:

Receiving shipment assignments
Picking up herb batches
Scanning and validating QR codes
Executing ownership transfers
Tracking shipments
Delivering batches
Submitting proof of delivery


Transporter CANNOT:

Create batches
Edit batch information
Issue certifications
Create products
Access AYUSH controls

Transporter App Structure
Authentication
Dashboard
Shipments
QR Scanner
Pickup Management
Tracking
Delivery Management
Transfer History
Notifications
Profile
Offline Sync

Main Navigation
Home
Shipments
Scanner
Notifications
Profile


Bottom navigation recommended:

Home | Shipments | Scan | Notifications | Profile

1. Authentication Module
Login Screen

Features:

Phone Number Login
Email Login
Password Login
Forgot Password
OTP Verification

Registration Screen

Fields:

Full Name
Phone Number
Email

Vehicle Number
Vehicle Type

Driving License Number
Transport License Number

Government ID

Password


Uploads:

Driving License
Vehicle RC
Transport Permit
Identity Proof


Status:

Pending Approval
Verified
Rejected
Suspended

2. Transporter Dashboard

The operational control center.

KPI Cards
Assigned Shipments

Pending Pickups

In Transit

Completed Deliveries


Example:

Assigned: 12

Pending Pickup: 3

In Transit: 5

Completed: 145

Quick Actions
Scan QR

View Shipments

Start Pickup

View Deliveries

Active Shipment Widget

Display:

Shipment ID

Batch ID

Pickup Location

Destination

Current Status

Today's Tasks
Pickup - 10:00 AM

Delivery - 2:00 PM

Lab Transfer - 5:00 PM

3. Shipment Management Module

Most used section.

Shipment List

Tabs:

Assigned

Accepted

Pickup Pending

In Transit

Completed

Failed

Shipment Card

Display:

Shipment ID

Batch ID

Herb Name

Origin

Destination

Status


Example:

SHIP-2026-00154

HERB-2026-000451

Ashwagandha

Madurai → Chennai

Status: Assigned

4. Shipment Detail Page

Full shipment information.

Basic Details
Shipment ID

Batch ID

Herb Type

Quantity

Current Owner

Status

Pickup Details
Farmer Name

Farm Location

GPS Coordinates

Contact Information

Destination Details
Lab Name

Manufacturer Name

Address

GPS Location

Timeline
Assigned

Accepted

Picked Up

In Transit

Delivered

5. Shipment Acceptance Flow

Transporter receives assignment.

Actions:

Accept Shipment

Reject Shipment


If rejected:

Mandatory reason:

Vehicle Unavailable

Distance Too Far

Emergency

Other

6. QR Scanner Module

Core screen of transporter.

This is one of the most important screens.

Features
Camera Scan

Manual QR Entry

Flashlight

History

After Scan

Display:

Batch ID

Current Owner

Status

Location

Transfer Eligibility

Validation Results
Valid
✓ Active QR

✓ Ownership Verified

✓ Transfer Allowed

Invalid
QR Expired

QR Already Transferred

Unauthorized Shipment

Owner Mismatch

7. Pickup Management Module

Transporter reaches source location.

Pickup Verification Screen

Display:

Batch Details

Farmer Details

Assigned Shipment


Actions:

Capture GPS

Take Pickup Photo

Scan QR

Confirm Pickup

GPS Capture

Store:

Latitude

Longitude

Accuracy

Timestamp

Pickup Photos

Recommended:

Package Photo

Loading Photo

Pickup Confirmation

Show:

Batch ID

Farmer

Transporter

Timestamp

8. Ownership Transfer Screen

After successful scan.

Display:

Current Owner

New Owner

Batch

Location


Example:

Farmer
↓
Transporter


Confirmation:

CONFIRM TRANSFER


Result:

Ownership Updated

New QR Generated

9. In Transit Module

After pickup.

Status:

In Transit

Transit Screen

Display:

Origin

Current Route

Destination

ETA

Route Map

Show:

Current Position

Route Path

Destination Marker

Route Events

Add:

Break

Vehicle Issue

Traffic Delay

Weather Delay

10. GPS Tracking Module

Background operation.

Capture:

Latitude

Longitude

Speed

Timestamp


Every:

5 Minutes


or

2 KM Movement

Driver Visibility

Show:

Tracking Active

11. Delivery Module

Second most important workflow.

Delivery Preparation

Display:

Destination

Receiver

Expected Quantity

Delivery Verification

Actions:

Scan QR

Capture GPS

Take Delivery Photo

Collect Signature

Receiving Parties

Could be:

Laboratory

Manufacturer

12. Proof of Delivery (POD)

Mandatory.

POD Screen

Capture:

Receiver Name

Digital Signature

Delivery Photo

Remarks

Evidence
Timestamp

Location

Receiver ID

Completion Summary

Display:

Delivered Successfully

Ownership Transferred

POD Uploaded

13. Delivery Failure Screen

Possible situations:

Location Closed

Receiver Missing

Damaged Shipment

Quantity Mismatch

Rejected By Receiver


Transporter selects:

Failure Reason


Uploads:

Photo Evidence

14. Shipment History

Archive of transporter activity.

Filters:

Date

Status

Batch

Destination


Details:

Total Delivered

Total Distance

Success Rate

15. Notifications

Types:

Shipment Assigned

Pickup Reminder

Delivery Reminder

Transfer Completed

Delivery Failed


Priority labels:

Normal
Important
Critical

16. Offline Sync Center

Extremely important.

Transporters will often lose connectivity.

Display:

Pending Pickups

Pending Deliveries

Pending GPS Logs

Pending Transfers


Status Indicators:

✅ Synced

🟡 Waiting

🔴 Failed

⚠ Conflict


Actions:

Retry Sync

View Conflicts

17. Profile Module

Display:

Name

Transporter Code

Vehicle Information

Verification Status

Vehicle Management
Vehicle Number

Vehicle Type

Capacity

License Expiry

Documents
Driving License

Transport Permit

Identity Proof

18. Performance & Analytics

Useful for transporters.

Show:

Completed Deliveries

Success Rate

Total Distance

Average Delivery Time

On-Time Rate


Example:

Completed: 520

Success Rate: 98.2%

Average Delivery Time: 6.4 Hours

19. Help & Support

Features:

Raise Ticket

Emergency Contact

FAQ

Shipment Assistance

Transporter App User Flows
Flow 1: Pickup
Assignment Received
      ↓
Accept Shipment
      ↓
Reach Farm
      ↓
Scan QR
      ↓
Capture GPS
      ↓
Take Photo
      ↓
Confirm Pickup
      ↓
Ownership Transfer
      ↓
New QR Generated

Flow 2: Delivery to Lab
Reach Lab
      ↓
Lab Receives Batch
      ↓
Scan QR
      ↓
Capture Signature
      ↓
Transfer Ownership
      ↓
Upload POD
      ↓
Delivery Complete

Flow 3: Delivery to Manufacturer
Reach Manufacturer
      ↓
Scan QR
      ↓
Manufacturer Accepts
      ↓
Ownership Transfer
      ↓
POD Uploaded
      ↓
Shipment Closed

MVP Screens for Transporter

Build in this exact order:

1. Login
2. Dashboard
3. Shipment List
4. Shipment Details
5. QR Scanner
6. Pickup Screen
7. Transfer Confirmation
8. Transit Tracking
9. Delivery Screen
10. POD Upload
11. Notifications
12. Profile
13. Offline Sync

Total MVP Screens
13 Core Screens


These 13 screens cover roughly 90% of all transporter workflows in HerbChain and are sufficient for a production-ready Phase 6 + Phase 7 implementation.