Phase 15: File Storage System (Document Management)

This phase becomes the evidence repository of HerbChain.

Until now, databases store structured data:

Batch IDs
Users
Ownership
Certificates Metadata
Inventory
Products


But real-world supply chain verification depends heavily on files:

Herb Images
Lab Reports
Certificates
Shipment Photos
Proof of Delivery
Product Images
Investigation Documents


This phase creates a scalable, secure, auditable document management system.

Goal of Phase 15

Build a centralized storage system to manage:

Herb Images

Lab Reports

Certificates

Shipment Documents

Proof Of Delivery

Product Images

Compliance Documents

Investigation Files


with:

Versioning
Access Control
Auditability
Integrity Validation
Retention Policies

Core Philosophy

Never store files inside PostgreSQL.

❌ Bad

Store PDF inside DB
Store Images inside DB
Store Reports inside DB


✅ Correct

Files → Cloud Storage

Metadata → PostgreSQL

Recommended Architecture
Mobile App
      ↓

Backend API
      ↓

File Service
      ↓

Azure Blob Storage
      ↓

Metadata Database


Alternative:

AWS S3

Storage Architecture
Users
   ↓

Upload File
   ↓

Validation
   ↓

Virus Scan
   ↓

Cloud Storage
   ↓

Metadata Record
   ↓

Access Control

Storage Categories

Create logical containers.

1. Herb Images

Used during:

AI Identification

Farmer Registration

Audits


Examples:

Plant Image

Harvest Image

Storage Image

2. Laboratory Documents

Examples:

Test Reports

Analysis Files

Microscopy Reports

Supporting Documents

3. Certificates

Examples:

Certificate Of Analysis

Lab Certificates

Compliance Certificates

4. Shipment Documents

Examples:

Invoices

Shipment Notes

Transfer Documents

Route Documents

5. Proof Of Delivery

Examples:

Receiver Signature

Package Photo

Delivery Images

6. Product Documents

Examples:

Product Images

Product Labels

Manufacturing Reports

Packaging Files

7. Compliance Documents

Examples:

Licenses

Approvals

Government Documents

Audit Reports

Storage Folder Structure

A production-friendly approach.

herbchain-storage

│

├── herbs
│    └── batch-id
│
├── laboratories
│    └── batch-id
│
├── certificates
│    └── certificate-id
│
├── shipments
│    └── shipment-id
│
├── products
│    └── product-id
│
├── compliance
│
└── investigations


Example:

herbs/HERB-2026-000001/image1.jpg

certificates/CERT-00045/report.pdf

products/PRODUCT-001/label.png

Master File Registry

Every uploaded file must have a metadata record.

documents
id

document_id

file_name

storage_path

public_url

file_type

entity_type

entity_id

uploaded_by

upload_time

file_size

mime_type

status

checksum

Entity Types
HERB_BATCH

LAB_REPORT

CERTIFICATE

SHIPMENT

PRODUCT

USER

COMPLIANCE

INVESTIGATION

Why One Master Registry?

Allows:

Single File Search

Audit Trail

Access Control

Retention Management

File Versioning

Critical feature.

Never overwrite files.

Example:

Certificate v1

Certificate v2

Certificate v3


Store:

document_versions

document_versions
id

document_id

version

storage_path

uploaded_by

uploaded_at

Example
CERT-00045

Version 1

Version 2

Version 3


Old versions remain available.

Access Control

Most important security feature.

Users must not access unauthorized files.

Access Matrix
Farmer

Can Access:

Own Batch Images

Own Certificates

Own Reports

Transporter

Can Access:

Assigned Shipment Documents

POD Documents

Lab

Can Access:

Lab Reports

Certificates

Received Batch Files

Manufacturer

Can Access:

Product Documents

Procured Batch Certificates

AYUSH

Can Access:

Everything


based on permissions.

File Visibility Levels

Create:

PUBLIC

RESTRICTED

CONFIDENTIAL

REGULATORY

PUBLIC

Example:

Consumer Certificate Summary

RESTRICTED
Manufacturer Documents

CONFIDENTIAL
Internal Reports

REGULATORY
Investigation Documents

File Integrity Verification

Critical for trust.

Every file receives:

SHA256 Checksum


Store:

checksum


in database.

Example:

lab-report.pdf


↓

SHA256 HASH


↓

Store hash.

If file changes:

Hash mismatch


Tampering detected.

Blockchain Integration

Important files should be anchored.

Do NOT store file on blockchain.

Store:

Document Hash


Blockchain Event:

CERTIFICATE_UPLOADED

LAB_REPORT_UPLOADED

COMPLIANCE_DOCUMENT_UPLOADED

Upload Validation

Before storing.

Validate Type

Allowed:

jpg

jpeg

png

pdf

docx

xlsx

Validate Size

Examples:

Images:
10 MB

PDF:
25 MB

Reports:
50 MB

Malware Scan

Every upload:

Virus Scan

Malware Detection


before storage.

Large File Handling

Use:

Chunk Upload


for large reports.

Example:

100 MB report


upload in pieces.

Document Lifecycle
Created
      ↓
Uploaded
      ↓
Validated
      ↓
Stored
      ↓
Accessed
      ↓
Archived
      ↓
Deleted (Policy Based)

Retention Policies

Not all files should live forever.

Herb Images
10 Years

Lab Certificates
15 Years

Regulatory Documents
Permanent

Investigation Documents
Permanent

File Auditing

Every access should be logged.

document_access_logs
id

document_id

user_id

action

ip_address

timestamp


Actions:

VIEW

DOWNLOAD

UPLOAD

DELETE

SHARE

Certificate Management

Special module.

certificate_documents
id

certificate_number

document_id

certificate_hash

issued_by

issued_at


Allows:

Certificate Verification

Consumer Access

Audit Verification

Consumer Safe Documents

Some documents may be public.

Examples:

Certificate Summary

Product Validation Report


Consumer should NOT access:

Internal Lab Reports

Farmer Documents

Investigation Files

Search & Retrieval

Users should search documents by:

Batch ID

Product ID

Certificate Number

Shipment ID

Farmer

Manufacturer

CDN Layer

For performance.

Use:

Azure CDN

CloudFront


for:

Images

Certificates

Product Assets

Backup Strategy

Critical requirement.

Primary Storage:

Azure Blob


Backup Storage:

Secondary Region


Protection:

Daily Backups

Geo Replication

Disaster Recovery

If storage region fails:

Secondary Storage


takes over.

Important for:

Certificates

Audit Files

Regulatory Documents

APIs Required
Upload File
POST /documents/upload

Download File
GET /documents/{id}

List Documents
GET /documents/entity/{id}

Create Version
POST /documents/version

File Metadata
GET /documents/{id}/metadata

Verify Checksum
GET /documents/{id}/verify

New Database Tables
documents

document_versions

document_access_logs

certificate_documents

document_retention_rules

document_shares

storage_jobs

End-to-End Example
Farmer Uploads Herb Images
           ↓
Images Stored
           ↓
Metadata Registered

Lab Uploads Report
           ↓
Virus Scan
           ↓
Storage
           ↓
Checksum Generated
           ↓
Hash Stored

Certificate Created
           ↓
PDF Uploaded
           ↓
Certificate Linked
           ↓
Blockchain Hash Anchored

Consumer Opens Product Passport
           ↓
Certificate Summary Retrieved
           ↓
Verified Product Displayed

Final Output of Phase 15

After completion, HerbChain supports:

✅ Herb Image Storage

✅ Laboratory Report Storage

✅ Certificate Management

✅ Product Document Storage

✅ Shipment Document Storage

✅ Proof Of Delivery Storage

✅ Version Control

✅ Role-Based Document Access

✅ File Integrity Verification

✅ Malware Scanning

✅ Document Search

✅ Audit Logging

✅ Blockchain Hash Anchoring

✅ Backup & Disaster Recovery

✅ Retention Policies

✅ Enterprise Document Management System


This phase makes HerbChain capable of handling all digital evidence generated throughout the supply chain, ensuring every image, report, certificate, proof, and compliance document remains secure, searchable, verifiable, auditable, and regulator-ready for years to come.