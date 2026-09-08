Phase 13: AYUSH Admin Portal (Regulatory Monitoring System)

This is the control tower of HerbChain.

All previous phases are operational:

Farmer → Transporter → Lab → Manufacturer → Consumer


Phase 13 gives AYUSH the ability to:

Monitor

Trace

Investigate

Audit

Govern

Enforce Compliance


This portal is not involved in ownership transfers.

AYUSH is never a batch owner.

AYUSH is the regulatory oversight authority.

Goal of Phase 13

Provide a centralized platform where AYUSH can:

Monitor Entire Ecosystem
          ↓
Search Any Entity
          ↓
View Full Traceability
          ↓
Identify Risks
          ↓
Investigate Issues
          ↓
Take Regulatory Actions

Core Philosophy

The AYUSH Portal should answer any question within seconds.

Examples:

Where did this product originate?

Which farmers supplied this product?

Which batches failed certification?

Which transporter handled this shipment?

Which products contain a recalled batch?

Which labs have unusual rejection rates?

AYUSH Admin Structure

Not every admin gets full access.

Create administration hierarchy.

Super Admin
System Governance

User Management

Policy Configuration

Regulatory Officer
Traceability

Compliance

Investigations

State Officer
State-Level Monitoring

Auditor
Read-Only Access

Reports

Blockchain Verification

RBAC for AYUSH

Additional permissions:

users.view
users.approve

labs.audit

manufacturers.audit

traceability.view

shipments.view

certificates.review

compliance.manage

reports.export

blockchain.audit

AYUSH Dashboard

The dashboard should immediately show ecosystem health.

Top KPI Cards
Total Farmers

Total Labs

Total Manufacturers

Total Active Batches

Active Shipments

Certified Batches

Rejected Batches

Products Created

Products Recalled

Additional KPIs
Blockchain Transactions

Failed Certifications

Pending Approvals

Compliance Alerts

Suspicious Activities

Dashboard Widgets
Farmers
Registered Farmers

Verified Farmers

New Registrations

Laboratories
Active Labs

Certification Count

Failure Rate

Manufacturers
Active Manufacturers

Products Created

Inventory Volume

Logistics
Shipments In Transit

Delayed Shipments

Successful Deliveries

Ecosystem Map

Powerful feature.

Display:

Farm Locations

Labs

Manufacturers

Transport Routes


on map.

Data Sources:

Farmer GPS

Shipment GPS

Facility Locations

Farmer Monitoring

AYUSH should browse all farmers.

Filter by:

State

District

Herb

Registration Date

Verification Status

Farmer Profile View
Farmer Information

Farm Location

Registered Batches

Certification Success %

Transport History

Compliance Flags

Farmer Risk Score

Optional.

Calculate:

Rejected Batches

Species Mismatches

Compliance Violations

Laboratory Monitoring

Monitor:

All Labs

Certification Metrics

Failure Rates

Audit History

Lab Dashboard
Total Tests

Pass %

Fail %

Species Mismatch %

Certificates Issued

Suspicious Lab Detection

Flag:

100% Pass Rate

Very High Pass Rate

Unusual Activity


for auditing.

Manufacturer Monitoring

Monitor:

Products Created

Raw Materials Consumed

Recall Incidents

Traceability Compliance

Manufacturer Profile

Display:

Incoming Batches

Inventory

Products

Certificates Used

Affected Recalls

Active Shipments Dashboard

Live logistics monitoring.

Display:

Shipment ID

Current Location

Transporter

Origin

Destination

Status


Statuses:

ASSIGNED

PICKED_UP

IN_TRANSIT

DELIVERED

FAILED

Shipment Risk Alerts

Show:

Delayed Shipments

Inactive Movements

Route Deviations

Delivery Failures

Failed Certifications Dashboard

Very important.

Display:

Batch ID

Farmer

Lab

Failure Reason

Date


Filter by:

Heavy Metals

Contamination

Species Mismatch

Microbial Failure

Compliance Alert Center

Centralized risk area.

Possible Alerts

Repeated Batch Failures

Species Fraud

Invalid Transfers

Duplicate Registrations

Suspicious QR Scans

Recall Events

Certificate Expiry

compliance_alerts
id

alert_type

severity

entity_type

entity_id

status

created_at


Severity:

LOW

MEDIUM

HIGH

CRITICAL

Product Traceability Explorer

One of the most important screens.

Search:

Product ID


Example:

PRODUCT-001


System reconstructs:

Product
 ↓
Manufacturing Batch
 ↓
Raw Herb Batches
 ↓
Lab Certificates
 ↓
Ownership Transfers
 ↓
Farmers


Result:

Full Product Journey


on one page.

Batch Traceability Explorer

Search:

Batch ID


Example:

HERB-2026-000001


System shows:

Creation

Ownership History

Lab Testing

Certificates

Products Using Batch

Universal Search Engine

AYUSH should be able to search:

Batch ID

Product ID

Certificate Number

Farmer Code

Manufacturer

Lab

Transporter

Shipment ID


from a single search box.

Search Result Categories
Batches

Products

Users

Shipments

Certificates

Geographic Search

Search by:

State

District

Region

GPS Radius


Example:

Show all Ashwagandha batches from Tamil Nadu

Investigation Module

Special feature.

AYUSH enters:

Product ID


System generates:

Timeline

Owners

Transfers

Labs

Tests

Certificates

Manufacturing Links


Useful during:

Complaints

Fraud

Recalls

Audits

Recall Management Center

Regulatory action module.

When AYUSH recalls:

Batch


System automatically finds:

Affected Products

Affected Manufacturers

Consumers (if available)

Current Inventory


Recall Statuses

ACTIVE

RESOLVED

CLOSED

recalls
id

entity_type

entity_id

reason

severity

status

created_by

created_at

Blockchain Audit Center

Phase 12 integration.

AYUSH can verify:

Batch Creation Hash

Transfer Hash

Certification Hash

Product Hash


Verification Flow

Database Record
       ↓
Generate Hash
       ↓
Blockchain Lookup
       ↓
Match Verification


Display:

✓ Verified

or

⚠ Integrity Mismatch

Analytics & Reporting

Generate reports for:

Farmer Registrations

Certification Trends

Failed Tests

Popular Herbs

Manufacturing Trends

Shipment Performance

Report Formats
PDF

Excel

CSV

Compliance Score Engine

Entity-level scoring.

For:

Farmers

Labs

Manufacturers

Transporters


Factors:

Certification Success

Timeliness

Audit Results

Violations


Example

Compliance Score

92/100

Notification Center

AYUSH receives:

New Lab Registrations

High-Severity Alerts

Recall Events

Audit Failures

Suspicious Transfers

Audit Logs Dashboard

Every admin action recorded.

Examples:

User Approved

Recall Issued

Lab Suspended

Product Investigated

Admin Actions

AYUSH can:

Approve User

Suspend User

Blacklist Entity

Issue Recall

Create Alert

Export Investigation Report

APIs Required
Dashboard
GET /admin/dashboard

Universal Search
GET /admin/search

Batch Traceability
GET /admin/batches/{id}

Product Traceability
GET /admin/products/{id}

Shipments
GET /admin/shipments

Failure Analysis
GET /admin/failed-certifications

Compliance Alerts
GET /admin/compliance-alerts

Blockchain Verification
GET /admin/blockchain/verify

Recall Creation
POST /admin/recalls

New Database Tables
compliance_alerts

recalls

investigation_cases

investigation_entities

compliance_scores

admin_notifications

report_exports

End-to-End Example
Consumer Complaint
        ↓
AYUSH Searches Product
        ↓
Product Traceability View
        ↓
View Ingredients
        ↓
Identify Batch
        ↓
View Lab Results
        ↓
View Ownership Chain
        ↓
Verify Blockchain Records
        ↓
Issue Recall
        ↓
Affected Products Identified
        ↓
Regulatory Action Taken

Final Output of Phase 13

After completion, HerbChain supports:

✅ Enterprise AYUSH Dashboard

✅ Farmer Monitoring

✅ Laboratory Monitoring

✅ Manufacturer Monitoring

✅ Transport Monitoring

✅ Active Shipment Tracking

✅ Failed Certification Analysis

✅ Universal Search Engine

✅ Batch Traceability Explorer

✅ Product Traceability Explorer

✅ Geographic Monitoring

✅ Investigation Management

✅ Recall Management

✅ Blockchain Verification

✅ Compliance Alerts

✅ Compliance Scoring

✅ Regulatory Reports

✅ Full Regulatory Monitoring System


This phase transforms HerbChain from a supply-chain application into a national-level regulatory platform, allowing AYUSH to monitor, investigate, audit, trace, and govern the entire herbal ecosystem from a single unified control center.