Perfect. If you're starting app development, Farmer is the first and most important user, because every batch originates from a farmer.

Farmer Role Overview
Who is a Farmer?

A farmer is the originator of the supply chain.

Responsibilities:

Register Herbs
Create Herb Batches
Upload Evidence
Transfer Batches
Track Certification
Track Ownership
View Product Usage


Farmer CANNOT:

Perform Lab Tests
Issue Certificates
Create Products
Access Other Farmers Data
Access AYUSH Portal

Farmer App Structure
Authentication
Dashboard
Batch Management
Transfer Management
Certificates
History & Tracking
Notifications
Profile
Settings
Support

1. Authentication Module
Login Screen

Features:

Phone Number Login
Email Login
Password Login
Forgot Password


Actions:

Login
Reset Password

Registration Screen

Fields:

Full Name
Phone Number
Email
Address
State
District
Village

Farm Name
Farm Size

Government ID
Profile Photo

Password
Confirm Password


Documents:

Aadhaar
Farmer ID
Agriculture Certificate (Optional)

Account Verification Screen

Status:

Pending Verification

Approved

Rejected

2. Farmer Dashboard

This is the main landing page.

Top Cards
Total Batches

Certified Batches

Pending Certification

Rejected Batches


Example:

Total Batches: 25

Certified: 18

Testing: 5

Rejected: 2

Quick Actions

Buttons:

+ Register New Herb

My Batches

Transfer Requests

Certificates

Recent Activities

Show:

Batch Created

Certification Received

Transfer Completed

Shipment Assigned

Notifications Preview

Recent:

Lab Approved Batch

Transporter Assigned

Ownership Changed

3. Register New Herb Batch

This is the most important screen.

Step 1: Capture Images

Upload:

Plant Image

Harvest Image

Storage Image


Features:

Open Camera

Upload From Gallery

Image Preview

Delete Image

Step 2: AI Identification

Show:

Detected Herb

Confidence Score


Example:

Ashwagandha

94% Confidence


Options:

Accept

Retry

Select Manually

Step 3: GPS Capture

Auto Fetch:

Latitude

Longitude

Village

District

State

Step 4: Batch Details Form

Fields:

Herb Name

Quantity

Unit

Harvest Date

Cultivation Method

Remarks


Cultivation:

Organic

Conventional

Wild Collection

Step 5: Batch Summary

Review screen:

Images

Location

Quantity

Date


Actions:

Submit Batch
Edit Batch

Step 6: Success Screen

Show:

Batch ID

Batch QR

Status


Example:

HERB-2026-000045

Status: Created

4. My Batches

List all farmer batches.

Filters
All

Created

In Transit

Testing

Certified

Rejected

Batch Card

Show:

Batch ID

Herb

Quantity

Status

Current Owner


Example

HERB-2026-000045

Ashwagandha

50 KG

Status:
Certified

5. Batch Details Page

Detailed batch view.

Batch Information
Batch ID

Herb Name

Quantity

Harvest Date

Creation Date

Cultivation Type

Images Section

Display:

All Uploaded Images

Ownership Section

Current:

Current Owner

Owner Type


Example:

Transporter

QR Section

Show:

QR Image

Version

Status

Shipment Section

Show:

Pickup

Transit

Delivered

Certification Section

Show:

Lab Status

Certificate Number

6. Transfer Requests

Used when transporter requests pickup.

Incoming Requests

Show:

Transporter Name

Request Date

Batch ID


Actions:

Approve

Reject

Request Details

Show:

Batch

Transporter

Shipment

Destination

7. Active QR Screen

Farmer's current active QR.

Display:

QR Code

Version

Owner

Created Date


Actions:

Share QR

Download QR

Regenerate QR

8. Batch Timeline

End-to-end visibility.

Example:

Batch Created

↓

Transferred To Transporter

↓

Reached Lab

↓

Certified

↓

Transferred To Manufacturer


Each event shows:

Date

Time

User

Status

9. Certifications

Central certificate repository.

Certificate List

Show:

Certificate Number

Batch ID

Issue Date

Status

Details

Show:

Lab Name

Certificate PDF

Result


Actions:

View PDF

Download PDF

10. Shipment Tracking

Track movement.

Show:

Shipment Status

Current Location

Estimated Arrival


Map View:

Origin

Current Position

Destination

11. Alerts & Notifications

Categories:

Transfers

Certification

Shipments

Approvals

System Alerts


Example:

✅ Batch Certified

✅ Shipment Assigned

✅ Ownership Transfer Complete

12. Product Usage (Advanced)

One unique and powerful farmer feature.

Farmer can see:

Which products used my herbs?


Example:

Batch:
HERB-2026-000045

Used In:

Ashwagandha Capsules

Herbal Immunity Powder


This creates trust and engagement.

13. Profile

Display:

Farmer Name

Farm Name

Location

Verification Status

Registration Date

Documents

Show:

Aadhaar

Farmer License

Certificates

Farm Information
Farm Area

Primary Crops

Organic Status

14. Settings

Options:

Change Password

Notification Preferences

Language Selection

Dark Mode

Privacy Settings


Recommended Languages:

English
Tamil
Hindi
Telugu
Kannada
Malayalam

15. Help & Support

Features:

Raise Ticket

Contact Support

FAQ

Tutorial Videos

16. Offline Sync Center

Required because of Phase 17.

Show:

Pending Actions

Pending Uploads

Failed Syncs

Last Sync Time


Status Examples:

✅ Synced

🟡 Pending

🔴 Failed

⚠ Conflict

Farmer App MVP Screens (Build First)

Priority order:

1. Login
2. Register
3. Dashboard
4. Register Batch
5. AI Detection
6. My Batches
7. Batch Detail
8. QR View
9. Transfer Requests
10. Notifications
11. Profile


Total MVP Farmer Screens: 11

Build these first, and you'll cover roughly 80% of all farmer workflows in HerbChain.