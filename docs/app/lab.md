I assume by "ba" you mean Lab (Laboratory), which is the next major user after Transporter.

Laboratory User (Lab Certification System)
Role Overview

The Laboratory is the scientific verification authority in HerbChain.

A Lab is responsible for:

Receiving batches
Creating samples
Conducting tests
Recording results
Reviewing reports
Generating certificates
Approving or rejecting batches


Labs cannot:

Modify farmer data
Change ownership history
Edit shipment records
Create products
Change blockchain records

Laboratory App Structure

For production, I strongly recommend a Web Portal instead of mobile-only because labs deal with:

Reports
Certificates
PDFs
Testing Data
Large Forms
Analytics

Main Navigation
Dashboard
Batches
Samples
Testing
Certificates
Reports
Notifications
Profile

1. Login & Authentication
Login Screen

Features:

Email Login
Phone Login
Password Login
MFA Authentication
Forgot Password

Verification Status

Display:

Pending Verification
Approved
Suspended
Rejected

2. Laboratory Dashboard

This is the home page.

KPI Cards

Show:

Received Batches

Under Testing

Certified Batches

Rejected Batches

Certificates Issued


Example:

Received: 125

Testing: 30

Certified: 85

Rejected: 10

Quick Actions
Receive Batch
Create Sample
Create Test
Generate Certificate

Recent Activity
New Batch Received

Certification Completed

Batch Rejected

Test Approved

3. Batch Management Module

One of the most important sections.

Batch Listing Page

Filters:

All

Received

Sampling

Under Testing

Certified

Rejected

Search

Search by:

Batch ID

Herb Name

Farmer

Transporter

Date

Batch Card

Show:

Batch ID

Herb Name

Quantity

Received Date

Current Status

4. Batch Details Page

Complete information.

Basic Information
Batch ID

Herb Name

Quantity

Harvest Date

Farmer

Origin Information
District

State

GPS Location

Farm Name

Images

Display:

Original Plant Images

Harvest Images

Storage Images

Ownership Timeline
Farmer

↓

Transporter

↓

Laboratory

Shipment History
Pickup

Route

Delivery

5. Receive Batch Screen

When transporter arrives.

Actions:

Scan QR

Validate Shipment

Verify Quantity

Verify Packaging

Receive Checklist
Package Intact

Correct Batch

Quantity Match

No Visible Damage

Status Options
GOOD

PARTIAL

DAMAGED

REJECTED

Capture
Photos

Remarks

GPS

Timestamp

6. Sample Management Module

Labs rarely test directly on full batches.

They create samples.

Sample List

Display:

Sample ID

Batch ID

Created By

Date

Create Sample

Fields:

Sample Weight

Sample Unit

Collection Method

Remarks


Generated:

SAMP-2026-0001

7. Testing Module

The core laboratory workflow.

Create Test

Test Categories:

Identity

Physical

Chemical

Purity

Microbial

Heavy Metals

Example Tests
Species Verification

Moisture

Lead

Arsenic

Mercury

Microbial Count

8. Test Details Page

Display:

Test Name

Method

Analyst

Status

Status
Pending

In Progress

Completed

Failed

9. Result Entry Screen

Most important form.

Fields:

Parameter

Observed Value

Unit

Reference Value

Result


Example

Parameter:
Moisture

Observed:
7.2%

Limit:
<10%

Result:
PASS


Another Example

Lead

Observed:
0.3 ppm

Limit:
<0.5 ppm

Result:
PASS

10. Analyst Workbench

Used by lab analysts.

Features:

Assigned Tests

Pending Tests

Completed Tests

Draft Results


Actions:

Save Draft

Submit Results

11. Supervisor Review Module

Production-grade workflow.

Two-person approval process.

Review Page

Show:

Test Results

Analyst Notes

Supporting Documents


Actions:

Approve

Reject

Send Back


Reason Required:

Data Issue

Retest Required

Missing Information

12. Certificate Management

Most important business function.

Certificate List

Display:

Certificate Number

Batch ID

Issue Date

Status

Generate Certificate

Automatically populate:

Batch ID

Sample ID

Lab Name

Results Summary

Issue Date


Generated:

Certificate Of Analysis (COA)


PDF.

Certificate Actions
Generate

Download

View

Reissue

13. Batch Approval Module

When all tests pass.

Display:

Overall Status

Passed Tests

Failed Tests


Actions:

Approve Batch


Result:

Status = CERTIFIED

14. Batch Rejection Module

If critical tests fail.

Reasons:

Heavy Metal Failure

Species Mismatch

Contamination

Microbial Failure

Adulteration


Fields:

Reason

Description

Recommendations


Result:

Status = REJECTED

15. Species Verification Module

Very powerful HerbChain feature.

Show comparison:

Farmer Selection

AI Prediction

Lab Verification


Example

Farmer:
Ashwagandha

AI:
Ashwagandha

Lab:
Ashwagandha


Status:

MATCH


Example

Farmer:
Ashwagandha

AI:
Ashwagandha

Lab:
Tulsi


Status:

MISMATCH


Alert generated.

16. Documents Module

Upload:

Test Reports

Microscopy Images

Analysis Reports

Supporting Documents


Actions:

Upload

Preview

Download

Version History

17. Certificate Verification View

Show:

Certificate Number

Hash

Blockchain Status

Issue Date


Verification Status:

Verified

Not Verified

Pending Blockchain Sync

18. Reports & Analytics

Lab-specific analytics.

KPIs

Tests Completed

Pass Rate

Fail Rate

Average Test Time


Charts

Monthly Certifications

Monthly Rejections

Most Tested Herbs

Top Failure Reasons

19. Notifications

Types:

Batch Received

Test Assigned

Review Required

Certificate Generated

Batch Approved


Priority:

Normal

Important

Critical

20. Profile & Lab Settings

Display:

Lab Name

Lab Code

Accreditation Number

Address

Verification Status


Documents:

Accreditation Certificate

Lab License

Government Approval

21. Help & Support

Features:

Raise Support Ticket

Compliance Help

Training Material

Documentation

Laboratory User Flows
Flow 1: Receive Batch
Transporter Arrives
        ↓
Scan QR
        ↓
Validate Batch
        ↓
Verify Shipment
        ↓
Receive Batch
        ↓
Ownership = Lab

Flow 2: Testing
Create Sample
       ↓
Create Test
       ↓
Enter Results
       ↓
Supervisor Review

Flow 3: Certification
Review Approved
       ↓
Generate Certificate
       ↓
Approve Batch
       ↓
Blockchain Event
       ↓
Certificate Available

Flow 4: Rejection
Test Failure
      ↓
Supervisor Review
      ↓
Reject Batch
      ↓
Reason Recorded
      ↓
AYUSH Alert Generated

MVP Screens for Laboratory

Build in this order:

1. Login
2. Dashboard
3. Batch List
4. Batch Details
5. Receive Batch
6. Sample Management
7. Test List
8. Create Test
9. Result Entry
10. Supervisor Review
11. Certificate Generation
12. Certificate List
13. Rejection Screen
14. Notifications
15. Profile

Total MVP Screens
15 Core Screens


These 15 screens cover nearly 95% of the laboratory workflow and fully support everything from Phase 8 (Lab Certification) through Phase 12 (Blockchain Certification Events).