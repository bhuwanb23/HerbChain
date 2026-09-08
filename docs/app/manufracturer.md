Perfect. The Manufacturer is the most powerful business user in HerbChain because this is where certified herbs are transformed into finished AYUSH products.

Manufacturer functionality spans:

Procurement
Inventory
Production
Product Creation
Product Lineage
Traceability
Product QR Generation
Recall Support


This user mainly works on a Web Portal, although some screens can also be available in mobile apps.

Manufacturer Role Overview
Who is a Manufacturer?

Manufacturer is responsible for:

Procuring certified herb batches
Receiving materials
Managing inventory
Creating production batches
Creating products
Maintaining traceability
Generating product QR codes
Managing recalls


Manufacturer can:

Request certified herbs
Receive ownership
Manage stock
Create products
Link ingredient batches
View lineage


Manufacturer cannot:

Issue certifications
Modify lab reports
Modify ownership history
Edit farmer records
Approve users

Manufacturer Portal Structure
Authentication
Dashboard
Procurement
Incoming Shipments
Inventory
Production
Products
Traceability
Analytics
Notifications
Profile

Main Navigation
Dashboard
Procurement
Inventory
Production
Products
Traceability
Reports
Settings

1. Authentication Module
Login

Features:

Email Login
Phone Login
Password
MFA
Forgot Password

Company Verification Status

Display:

Pending
Approved
Suspended
Rejected

2. Manufacturer Dashboard

Main landing page.

KPI Cards
Inventory Batches

Active Products

Incoming Shipments

Procurement Requests

Products Manufactured


Example:

Inventory: 245

Products: 58

Incoming: 12

Requests: 8

Quick Actions
Request Herbs

Receive Shipment

Create Product

View Inventory

Recent Activity
Batch Received

Product Created

Inventory Reserved

Shipment Arriving

3. Certified Herb Marketplace

One of the most important screens.

Manufacturers discover certified material here.

Search Filters
Herb Name

Region

Lab

Farmer

Quantity

Certification Date

Batch Card

Display:

Batch ID

Herb Name

Available Quantity

Certification Status

Lab Name

Owner


Example:

HERB-2026-000451

Ashwagandha

150 KG

Certified

AYUSH Lab Chennai

4. Certified Batch Details

Complete traceability before procurement.

Batch Details

Display:

Batch ID

Herb Name

Harvest Date

Quantity

Cultivation Type

Farmer Details

Display:

Farmer Name

District

State

Certification Information

Display:

Certificate Number

Lab Name

Issue Date

Status

History

Show:

Ownership History

Shipment History

QR History

5. Procurement Request Module

Manufacturer requests material.

Request Form

Fields:

Batch

Requested Quantity

Purpose

Priority

Request Summary

Display:

Requested Quantity

Available Quantity

Expected Delivery


Actions:

Submit Request

6. Procurement Tracker

Track all requests.

Statuses
Pending

Approved

Partially Approved

Rejected

Fulfilled

Request Card

Display:

Request ID

Batch

Quantity

Current Status

7. Incoming Shipments

Tracks herbs coming to manufacturer.

Shipment List

Display:

Shipment ID

Transporter

Origin

ETA

Status

Filters
Assigned

In Transit

Delivered

8. Shipment Details

Display:

Batch

Quantity

Transporter

Current Location

ETA

Timeline
Assigned
↓
Picked Up
↓
In Transit
↓
Delivered

9. Goods Receipt Note (GRN)

Critical manufacturing process.

GRN Screen

Capture:

Received Quantity

Accepted Quantity

Rejected Quantity

Remarks


Example:

Delivered: 100 KG

Accepted: 98 KG

Rejected: 2 KG

Evidence

Upload:

Photos

Documents

Inspection Notes

10. Inventory Module

Core operational screen.

Inventory Dashboard

Show:

Available Stock

Reserved Stock

Consumed Stock

Blocked Stock

Inventory List

Display:

Batch ID

Herb

Available Quantity

Status

Filters
Herb Name

Status

Location

11. Inventory Detail

Display:

Batch Information

Certification

Available Quantity

Owner

Inventory History

Show:

Received

Reserved

Consumed

Adjusted

12. Quality Hold Module

Manufacturer can quarantine material.

Reasons:

Packaging Issue

Odor Issue

Visual Defect

Further Inspection Required


Statuses:

Active

Resolved

13. Production Module

The heart of manufacturing.

Production Dashboard

Display:

Planned Batches

In Progress

Completed

Create Production Batch

Fields:

Production Batch Number

Date

Product Type

Remarks


Generated:

MFG-2026-00001

14. Ingredient Selection Screen

One of the most important screens.

Manufacturer chooses:

HERB-001

HERB-014

HERB-027


For each batch:

Quantity Used


Example:

HERB-001 = 10 KG

HERB-014 = 5 KG

HERB-027 = 15 KG


System validates:

Certified

Available

Not Recalled

Not Expired

15. Product Creation Module

Create finished products.

Fields:

Product Name

Description

Category

Pack Size

SKU

Shelf Life


Example:

Ashwagandha Wellness Capsules

16. Product List

Display:

Product Name

SKU

Status

Manufacturing Date


Statuses:

Draft

Active

Discontinued

Recalled

17. Product Details

Display:

Product Information

Manufacturing Batch

Ingredients

Product QR

18. Product QR Module

Generate consumer-facing QR.

Display:

Product QR

Verification URL

Generation Date


Actions:

Download

Print

Share

19. Product Lineage Module

This is the biggest manufacturer feature.

Visualization:

PRODUCT-001
      ↓

HERB-001
HERB-014
HERB-027


Show:

Ingredient Batch

Farmer

Lab Certificate

Quantity Used

20. Backward Traceability

Given product:

Ashwagandha Capsules


Display:

Product
↓
Ingredients
↓
Batches
↓
Lab Reports
↓
Farmers

21. Recall Impact Module

Extremely important.

Example:

Batch HERB-014 Recalled


System shows:

Affected Products

Affected Inventory

Affected Production Runs

22. Product Analytics

KPIs:

Products Produced

Units Produced

Material Consumption

Production Efficiency


Charts:

Monthly Production

Material Usage

Top Products

23. Reports Module

Generate:

Production Reports

Inventory Reports

Consumption Reports

Traceability Reports


Export:

PDF

Excel

CSV

24. Notifications

Examples:

Request Approved

Shipment Arriving

Material Received

Recall Alert

Certificate Expiry

25. Profile & Company Settings

Display:

Company Name

GST

License Number

Address

Verification Status

Documents
Manufacturing License

GST Registration

Approvals

Manufacturer User Flows
Flow 1: Procurement
View Certified Batch
        ↓
Create Request
        ↓
Lab Approval
        ↓
Shipment Generated

Flow 2: Material Receipt
Shipment Arrives
        ↓
Inspect Material
        ↓
Create GRN
        ↓
Accept Batch
        ↓
Ownership Transfer
        ↓
Inventory Added

Flow 3: Product Creation
Create Production Batch
          ↓
Select Ingredient Batches
          ↓
Consume Inventory
          ↓
Create Product
          ↓
Generate Product QR

Flow 4: Product Traceability
Open Product
      ↓
View Ingredients
      ↓
View Certificates
      ↓
View Farmers
      ↓
View Complete History

Manufacturer MVP Screens

Build in this order:

1. Login
2. Dashboard
3. Certified Herb Marketplace
4. Batch Details
5. Procurement Request
6. Request Tracker
7. Incoming Shipments
8. GRN Screen
9. Inventory List
10. Inventory Details
11. Create Production Batch
12. Ingredient Selection
13. Product Creation
14. Product List
15. Product Details
16. Product QR
17. Product Lineage
18. Notifications
19. Reports
20. Profile

Total Manufacturer Screens
20 Core Screens


These screens fully support Phase 9 (Procurement), Phase 10 (Product Lineage Engine), Phase 11 (Consumer QR Preparation), and all traceability requirements of HerbChain.