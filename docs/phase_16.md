Phase 16: Reporting & Analytics (BI Dashboard)

This phase turns HerbChain from a transaction system into an intelligence system.

Up to Phase 15, HerbChain can answer:

What happened?
Who did it?
When did it happen?


Phase 16 answers:

What trends are emerging?
Which regions perform best?
Which labs fail most often?
Which herbs are growing fastest?
Which manufacturers consume the most materials?
Where are compliance risks increasing?


This phase provides decision-making intelligence for:

AYUSH

Farmers

Labs

Manufacturers

Regional Authorities

Goal of Phase 16

Build a Business Intelligence (BI) Layer that provides:

Operational Reports
+
Analytics
+
Forecasting Readiness
+
Regulatory Insights


through dashboards, charts, metrics, and exports.

Analytics Architecture
Operational Database
        ↓
Analytics Pipeline
        ↓
Analytics Database / Warehouse
        ↓
BI Services
        ↓
Dashboards & Reports

Important Architecture Decision

Do NOT run analytics directly on production tables.

Bad:

Dashboard
      ↓
Complex Query
      ↓
Production Database


This becomes slow.

Recommended:

PostgreSQL
      ↓
ETL Jobs
      ↓
Analytics Tables
      ↓
Dashboard

Analytics Domains

Create separate analytics modules:

1. Herb Production Analytics

2. Certification Analytics

3. Supply Chain Analytics

4. Inventory Analytics

5. Manufacturing Analytics

6. Traceability Analytics

7. Compliance Analytics

8. Regional Analytics

9. User Analytics

10. Executive Dashboard

1. Herb Production Analytics

Track overall herb ecosystem production.

Dashboard Metrics
Total Herb Production

Total Active Batches

Top Herbs

Farmers Participating

Harvest Volume

Example KPIs
Ashwagandha

2,450 Tons

Tulsi

1,820 Tons

Giloy

950 Tons

Production Trends

Show:

Daily

Weekly

Monthly

Yearly


production charts.

Visualizations:

Line Charts

Area Charts

Bar Charts

herb_production_analytics

Aggregate:

herb_id

period

total_batches

total_quantity

active_farmers

2. Certification Analytics

One of the most important AYUSH dashboards.

KPIs
Total Tests

Pass Rate

Failure Rate

Certificates Issued

Average Testing Time


Example:

Pass Rate

92.6%

Certification Trends

Track:

Monthly Certifications

Monthly Rejections

Pass Percentage

Lab Performance Ranking
Top Performing Labs

Slowest Labs

Highest Rejection Labs

certification_analytics
lab_id

total_tests

pass_count

fail_count

avg_testing_days

3. Failed Test Analytics

Critical for regulators.

Failure Breakdown

Track:

Heavy Metals

Microbial Failure

Species Mismatch

Adulteration

Contamination


Chart Example

Microbial Failure -> 35%

Heavy Metals -> 25%

Species Mismatch -> 15%

Heat Maps

Identify:

High Failure Regions


Example:

District A

18% Failure Rate

failure_reason_analytics
region

failure_reason

count

percentage

4. Regional Supply Analytics

Very important for AYUSH.

Region Dashboard

Track:

State

District

Village


level production.

Example:

Tamil Nadu

Ashwagandha:
1200 Tons


Visuals:

India Map

State Map

District Heat Maps

Regional KPIs
Production Volume

Certification Rate

Transport Volume

Manufacturers Served

regional_supply_analytics
state

district

herb_id

production

certified_batches

5. Logistics Analytics

Built from Phase 7.

Metrics
Total Shipments

On-Time Deliveries

Average Transit Time

Delayed Deliveries

Distance Traveled

Transporter Performance

Rank transporters by:

Success Rate

Delay %

Average Delivery Time

Route Analytics

Identify:

Most Active Routes

Bottlenecks

High Delay Regions

logistics_analytics
transporter_id

shipments

success_rate

avg_delivery_time

6. Manufacturer Consumption Analytics

One of the requested core modules.

KPIs
Raw Material Consumption

Top Consumed Herbs

Inventory Turnover

Production Volume

Example
Manufacturer ABC

Ashwagandha:
450 KG / Month

Tulsi:
230 KG / Month

Consumption Dashboard

Track:

Per Product

Per Herb

Per Month

Per Manufacturer

manufacturer_consumption
manufacturer_id

herb_id

consumed_qty

period

Product Demand Analytics

Track:

Most Produced Products

Most Verified Products

Consumer Scan Volume

Example
Ashwagandha Capsules

12,500 Units

7. Consumer Analytics

Built from Phase 11.

KPIs
Total Product Scans

Unique Consumers

Top Regions

Verification Rate

Consumer Insights

Identify:

Most Scanned Products

Most Trusted Manufacturers

Regions With Highest Demand

consumer_analytics
product_id

scan_count

region

period

8. Traceability Analytics

Unique HerbChain analytics.

Track:

Average Traceability Completion

Traceable Products %

Missing Records %

Lineage Completeness


Example:

98% Products Fully Traceable

Traceability Quality Score

Each product gets:

Traceability Score


Example:

100/100


means:

Origin

Transport

Lab

Manufacturer

All Recorded

9. Compliance Analytics

Built for AYUSH.

Metrics
Compliance Violations

Repeat Offenders

Failed Audits

Suspicious Activity

Compliance Scorecard

For:

Farmers

Labs

Manufacturers

Transporters


Example:

Lab A

Score: 96

10. Blockchain Analytics

Built from Phase 12.

Metrics
Blockchain Events

Failed Syncs

Event Types

Hash Verifications

Example
Transfers:
120,000

Certifications:
25,000

Products:
14,000

Executive Dashboard (AYUSH)

This will be the primary homepage.

National Overview
Total Farmers

Total Labs

Total Manufacturers

Total Products

Total Transactions

Active Shipments

Real-Time Stats
Today's Batches

Today's Certifications

Active Shipments

Pending Approvals

Strategic KPIs
National Production

Certification Success

Supply Chain Efficiency

Compliance Health

Report Generation System

Users can generate reports.

Report Types
Farmer Reports

Lab Reports

Manufacturer Reports

Traceability Reports

Compliance Reports

Filters
Date Range

Herb

Region

Lab

Manufacturer

Export Options
PDF

Excel

CSV

Scheduled Reports

Auto-generate.

Examples:

Daily AYUSH Summary

Weekly Compliance Report

Monthly Production Report

scheduled_reports
id

report_name

frequency

recipient

next_run

Analytics Data Warehouse Tables

Create aggregated tables:

herb_production_analytics

certification_analytics

failure_reason_analytics

regional_supply_analytics

logistics_analytics

manufacturer_consumption

consumer_analytics

traceability_analytics

compliance_analytics

blockchain_analytics

KPI Calculation Jobs

Run scheduled jobs:

Hourly

Daily

Weekly

Monthly


to calculate aggregates.

Never calculate huge analytics on page load.

Alert-Based Analytics

Analytics should generate alerts.

Example:

Species Mismatch +300%


↓

Compliance Alert


Example:

Lab Failure Rate >20%


↓

AYUSH Notification

APIs Required
Dashboard
GET /analytics/dashboard

Herb Production
GET /analytics/herbs

Certifications
GET /analytics/certifications

Failures
GET /analytics/failures

Manufacturers
GET /analytics/manufacturers

Regions
GET /analytics/regions

Consumer Analytics
GET /analytics/consumers

Reports
POST /reports/generate

End-to-End Flow
Farmer Registers Batch
          ↓
Lab Certifies Batch
          ↓
Manufacturer Consumes Batch
          ↓
Consumer Scans Product
          ↓
Analytics Pipeline Updates
          ↓
Aggregated Metrics Generated
          ↓
BI Dashboards Updated
          ↓
AYUSH Views National Trends

Final Output of Phase 16

After completion, HerbChain supports:

✅ Herb Production Analytics

✅ Certification Analytics

✅ Failed Test Analytics

✅ Regional Supply Analytics

✅ Logistics Analytics

✅ Manufacturer Consumption Analytics

✅ Consumer Analytics

✅ Traceability Analytics

✅ Compliance Analytics

✅ Blockchain Analytics

✅ Executive AYUSH Dashboard

✅ Scheduled Reports

✅ PDF/Excel/CSV Exports

✅ Heat Maps & Trend Analysis

✅ KPI Tracking

✅ Automated Intelligence Layer

✅ Complete BI Dashboard


This phase transforms HerbChain from a traceability platform into a data intelligence platform, enabling AYUSH, manufacturers, laboratories, and policymakers to make evidence-based decisions using production trends, certification quality, regional performance, supply-chain efficiency, and consumption analytics gathered across the entire herbal ecosystem.