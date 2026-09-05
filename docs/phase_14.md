Phase 14: Notifications & Alerts (Communication Layer)

This phase acts as the nervous system of HerbChain.

Without notifications, users constantly need to open the app and check status updates.

With this phase:

Event Happens
      ↓
Notification Generated
      ↓
Delivered To Right User
      ↓
User Takes Action


This ensures every stakeholder is informed in real-time.

Goal of Phase 14

Create a centralized communication system for:

SMS

Email

Push Notifications

In-App Notifications


that automatically reacts to business events across HerbChain.

Communication Architecture
Business Event
      ↓
Notification Engine
      ↓
Notification Queue
      ↓
Channel Selection
      ↓
SMS / Email / Push / In-App
      ↓
Delivery Tracking

Core Principle

Business modules should NEVER send notifications directly.

❌ Bad

Batch Module
     ↓
Send SMS


✅ Good

Batch Module
     ↓
Publish Event
     ↓
Notification Service
     ↓
Send Message


This keeps modules decoupled.

Notification Types
1. In-App Notifications

Fastest and cheapest.

Examples:

New Batch Request

Certification Completed

Shipment Assigned

2. Push Notifications

For mobile users.

Examples:

Pickup Assigned

Batch Received

Transfer Approved

3. Email Notifications

For official communications.

Examples:

Certificate Issued

Recall Notice

Account Approved

4. SMS Notifications

For farmers and field workers.

Examples:

Pickup Tomorrow

Batch Approved

Ownership Transferred

Notification Engine

Create dedicated service:

Notification Service


Responsibilities:

Template Management

Queue Management

Channel Selection

Delivery Tracking

Retry Logic

Notification Event Catalog

Every important system event should trigger notifications.

Batch Events
Batch Created

Recipient:

Farmer


Message:

Batch HERB-2026-000001 successfully registered.

Batch Requested

Recipient:

Farmer


Message:

Laboratory XYZ has requested your batch.

Shipment Events
Pickup Assigned

Recipient:

Transporter


Message:

Shipment SHIP-001 assigned.

Pickup Scheduled

Recipient:

Farmer


Message:

Transporter will arrive today.

Shipment Delayed

Recipient:

Lab
Manufacturer
AYUSH


Message:

Shipment SHIP-001 delayed by 4 hours.

Ownership Events
Ownership Transferred

Recipients:

Previous Owner

New Owner


Message:

Ownership transferred successfully.

Batch:
HERB-2026-000001

Transfer Rejected

Recipients:

Sender

Receiver

Laboratory Events
Batch Received

Recipient:

Lab

Testing Started

Recipient:

Farmer (optional)

Certification Completed

Recipients:

Farmer

Manufacturer

AYUSH

Batch Rejected

Recipients:

Farmer

AYUSH


Message:

Batch failed testing due to heavy metal contamination.

Manufacturer Events
Request Submitted

Recipient:

Lab

Request Approved

Recipient:

Manufacturer

Product Created

Recipient:

Manufacturer

AYUSH

Recall Events

Most critical notifications.

Recipients:

AYUSH

Manufacturer

Lab


Priority:

CRITICAL

User Management Events
Registration Approved

Recipient:

User

Account Suspended

Recipient:

User

Password Changed

Recipient:

User

Notification Priority Levels
LOW
Informational Updates

MEDIUM
Workflow Actions

HIGH
Ownership Transfers

Certification Events

CRITICAL
Recalls

Fraud Alerts

Compliance Violations

Notification Preferences

Users should control what they receive.

notification_preferences
id

user_id

email_enabled

sms_enabled

push_enabled

in_app_enabled

created_at


Example:

Farmer

SMS = ON
Email = OFF
Push = ON

Notification Templates

Never hardcode messages.

Create:

notification_templates
id

event_type

channel

subject

template_body

active


Example

Event:

OWNERSHIP_TRANSFERRED


Template:

Ownership for {batchId}
has been transferred to {newOwner}.

Notification Queue

All notifications should enter queue first.

notification_queue
id

event_type

recipient_id

channel

payload

status

created_at


Status:

PENDING

PROCESSING

SENT

FAILED

Why Queue?

Without queue:

Transfer
 ↓
SMS Slow
 ↓
API Slow


With queue:

Transfer
 ↓
Queue Event
 ↓
User Continues
 ↓
Background Send

Delivery Tracking

Create:

notification_deliveries
id

notification_id

channel

status

sent_at

delivered_at

failure_reason


Status:

SENT

DELIVERED

FAILED

READ

Push Notification Tokens

For mobile devices.

device_tokens
id

user_id

device_id

platform

token

last_active


Platform:

ANDROID

IOS

In-App Notification Center

Every user should have a notification inbox.

user_notifications
id

user_id

title

message

priority

is_read

created_at


Features:

Mark Read

Mark All Read

Filter By Type

SMS Strategy

Use SMS mainly for rural users.

Recommended events:

Pickup Assigned

Pickup Reminder

Transfer Complete

Certification Result


Avoid sending every event through SMS.

Email Strategy

Use Email for:

Certificates

Reports

Account Activity

Recall Notices

Push Strategy

Use Push for:

Live Workflow Events


Examples:

Shipment Assigned

Receive Batch

Approve Request

Scheduled Notifications

Not all notifications are immediate.

Examples:

Certificate Expiry Reminder

Shipment Reminder

Pending Approval Reminder

scheduled_notifications
id

notification_type

scheduled_time

recipient_id

status

Reminder Engine

Examples:

Pickup Reminder
24 hours before pickup

Certificate Expiry
30 days before expiry

Inventory Expiry
Before stock expires

Fraud & Security Alerts

Important for AYUSH.

Examples:

Repeated Failed Scans

Suspicious QR Activity

Duplicate Registrations

Unauthorized Access Attempts


Priority:

CRITICAL

Escalation System

Example:

Shipment Delayed


Notify:

Transporter


After 4 Hours:

Lab


After 12 Hours:

AYUSH

Notification Analytics

Track:

Sent

Delivered

Failed

Read Rate

SMS Usage

Email Engagement

notification_metrics
id

notification_type

sent_count

delivery_rate

failure_rate

generated_at

Admin Notification Center

AYUSH should see:

Critical Alerts

Pending Issues

Failed Deliveries

Security Events

Recall Notifications

APIs Required
Send Notification
POST /notifications/send

User Notifications
GET /notifications

Mark Read
PUT /notifications/read

Preferences
PUT /notifications/preferences

Device Registration
POST /notifications/device

New Database Tables
notification_templates

notification_queue

notification_deliveries

notification_preferences

device_tokens

user_notifications

scheduled_notifications

notification_metrics

End-to-End Example
Manufacturer Requests Batch
            ↓
Event Created
            ↓
Notification Queue
            ↓
Lab Receives Push Notification

Lab Approves Request
            ↓
Notification Queue
            ↓
Manufacturer Gets Push + Email

Transport Assigned
            ↓
Transporter Gets SMS + Push

Batch Certified
            ↓
Farmer Gets SMS
Manufacturer Gets Email
AYUSH Gets In-App Alert

Final Output of Phase 14

After completion, HerbChain supports:

✅ In-App Notifications

✅ Push Notifications

✅ SMS Notifications

✅ Email Notifications

✅ Notification Preferences

✅ Template-Based Messaging

✅ Notification Queue

✅ Delivery Tracking

✅ Read Receipts

✅ Scheduled Notifications

✅ Reminder Engine

✅ Security Alerts

✅ Escalation Rules

✅ Communication Analytics

✅ Centralized Communication Layer


This phase ensures that every important event in HerbChain, from batch registration to certification, ownership transfer, shipment movement, product creation, recalls, and compliance alerts, is communicated to the right stakeholder through the right channel at the right time.