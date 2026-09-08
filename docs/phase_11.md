Phase 11: Consumer Verification Portal (Digital Product Passport)

This phase is the public face of HerbChain.

Everything built from Phase 1 to Phase 10 culminates here.

Until now, the system was for:

Farmers
Transporters
Labs
Manufacturers
AYUSH


Phase 11 is for:

Consumers
Retailers
Distributors
Inspectors
Public Users


The objective is simple:

A consumer scans a product QR and instantly verifies authenticity, origin, certification, and traceability without needing an account.

Goal of Phase 11

Transform:

Finished Product
      ↓
QR Scan
      ↓
Public Verification
      ↓
Product Passport


into a trustworthy experience.

Core Principle

Consumer QR is NOT ownership QR.

Ownership QR
Internal

Changes after transfer

Used by supply chain

Product QR
Public

Permanent

Used by consumers


Never expose internal operational data directly.

Consumer Journey
Consumer Buys Product
          ↓
Scans QR
          ↓
HerbChain Portal Opens
          ↓
Verification Engine Runs
          ↓
Digital Passport Displays


No login.

No registration.

No app required.

Product QR Structure

QR contains:

https://verify.herbchain.com/p/PRD_89AK27182


or

PRD_TOKEN


Backend then fetches actual record.

Public Verification Flow
Scan QR
     ↓
Extract Token
     ↓
Lookup Product
     ↓
Validate Product
     ↓
Build Passport
     ↓
Display Result

Verification Checks

Before showing data:

Check 1

Product Exists?

YES


Else:

Product Not Found

Check 2

Product Active?

ACTIVE


Else:

Product Recalled

Check 3

Product QR Valid?

VALID


Else:

Invalid Product

Check 4

Lineage Exists?

YES


Else:

Product Data Incomplete

Consumer Passport Layout

The portal should be extremely simple.

Consumers are not auditors.

Show trust signals first.

Section 1: Product Identity

Display:

Product Name

Product Image

Manufacturer

Category

Package Size

Verification Status


Example:

Ashwagandha Wellness Capsules

Manufacturer:
ABC Ayurveda Pvt Ltd

Status:
✓ Verified Product

Section 2: Authenticity Status

Most important section.

Large badge:

✅ VERIFIED


or

⚠ UNDER REVIEW


or

❌ RECALL ACTIVE


or

❌ INVALID PRODUCT

Verification Engine

Create:

verification_status

Possible values:

VERIFIED

EXPIRED

RECALLED

UNDER_INVESTIGATION

INVALID

Section 3: Manufacturer Information

Display:

Manufacturer Name

License Status

Location

Production Date

Expiry Date


Example:

ABC Ayurveda Pvt Ltd

Tamil Nadu

Produced:
01 Aug 2026

Expiry:
01 Aug 2028

Section 4: Ingredient Summary

Consumer-friendly version.

Show:

Ingredients Used


Example:

Ashwagandha

Tulsi

Giloy


Do not overwhelm consumers with batch IDs initially.

Provide:

View Details


option.

Section 5: Origin Information

Show source information.

Example:

Origin Farms

3 Verified Farms

Tamil Nadu
Karnataka
Kerala


Detailed View:

Batch:
HERB-001

Farmer:
Raman

District:
Salem

Harvest:
02 Aug 2026


Sensitive farmer data hidden.

Privacy Rules

Consumer should NOT see:

Phone Numbers

Email

Exact Address

Government IDs

Financial Data


Only verification-related information.

Section 6: Laboratory Certification

Show:

Lab Name

Certification Status

Certificate Number

Issue Date


Example:

AYUSH Certified Lab

Certificate:
CERT-00045

Status:
PASS

View Certificate Option

Consumer can open:

Certificate PDF


or

Certificate Summary


depending on business requirements.

Section 7: Supply Chain Journey

This is HerbChain's differentiator.

Visual Timeline:

🌱 Farmer
    ↓
🚛 Transporter
    ↓
🔬 Lab
    ↓
🚛 Transporter
    ↓
🏭 Manufacturer


Consumer sees:

Harvested

Transported

Laboratory Tested

Certified

Manufactured


Not internal operational details.

Interactive Timeline

Example:

Harvested
02 Aug 2026

↓

Lab Certified
15 Aug 2026

↓

Manufactured
20 Aug 2026

Section 8: Sustainability Information

Optional but powerful.

Display:

Organic Cultivation

Region

Certification Type

Cultivation Method


Example:

Organic Certified

Wild Collection

Sustainable Farming

Section 9: Product Trust Score

Optional feature.

Calculated from:

Lab Pass

Traceability Complete

Licensed Manufacturer

Verified Supply Chain


Example:

Trust Score

97/100

Consumer Scan Tracking

Store every scan.

consumer_scans
id

product_id

country

state

city

device_type

ip_address

scanned_at

Why Track Scans?

Helps:

Counterfeit Detection

Demand Analytics

Market Intelligence

Fake Product Detection

Scenario:

Same Product QR

Scanned

Chennai

Mumbai

Delhi

within minutes


System generates:

Suspicious Activity Alert

counterfeit_alerts
id

product_id

reason

severity

created_at

Product Recall Support

If AYUSH recalls product:

Consumer immediately sees:

⚠ PRODUCT RECALLED


and

Do Not Consume

Contact Manufacturer

Product Passport API
Public Endpoint
GET /verify/product/{token}


No authentication.

Returns:

{
  "verified": true,
  "product":"Ashwagandha Capsules",
  "manufacturer":"ABC Ayurveda",
  "certificate":"CERT-00045"
}

Public Security Controls

Even though portal is public:

Rate Limiting

Example:

100 requests per minute

Bot Protection
Captcha

Traffic Monitoring

Hidden Internal IDs

Never expose:

Database IDs

User IDs

Ownership IDs


Only public-safe identifiers.

Product Passport Cache

Popular products may receive thousands of scans.

Use caching.

Redis


Cache:

Product Passport Data


for fast responses.

Mobile-Friendly Design

Most scans happen on phones.

Portal should prioritize:

Fast Loading

Readable Cards

Simple Timeline

Large Verification Badge

Consumer Screens
Screen 1
✅ Verified Product

Screen 2
Product Details

Screen 3
Origin Information

Screen 4
Lab Certification

Screen 5
Supply Chain Journey

AYUSH Visibility

Consumer scans should appear in AYUSH analytics.

Examples:

Most Scanned Products

Geographic Demand

Counterfeit Alerts

APIs Required
Product Verification
GET /verify/product/{token}

Product Journey
GET /verify/product/{token}/journey

Product Certificate
GET /verify/product/{token}/certificate

Scan Event
POST /verify/scan

New Database Tables
counterfeit_alerts

verification_statuses

product_verification_cache


(Optional if using Redis for caching.)

End-to-End Flow
Manufacturer Creates Product
          ↓
Product QR Generated
          ↓
Consumer Purchases Product
          ↓
Scan QR
          ↓
Verification Engine
          ↓
Retrieve Lineage
          ↓
Retrieve Certificates
          ↓
Retrieve Manufacturer Data
          ↓
Build Product Passport
          ↓
Display Verification Status
          ↓
Show Product Journey

Final Output of Phase 11

After completion, HerbChain supports:

✅ Public Product Verification

✅ QR-Based Product Authentication

✅ Digital Product Passport

✅ Product Details View

✅ Origin Farm Visibility

✅ Lab Certification Visibility

✅ Manufacturer Verification

✅ Supply Chain Timeline

✅ Product Recall Notifications

✅ Counterfeit Detection

✅ Consumer Scan Analytics

✅ Mobile-Friendly Verification Portal

✅ No Login Required Access


This phase delivers the ultimate HerbChain promise:

A consumer can scan a single QR code and instantly verify where the product came from, which farms supplied it, which laboratory certified it, who manufactured it, and whether it is an authentic and trusted AYUSH product.