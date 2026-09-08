HerbChain Development Roadmap (Phase-wise)
Phase 0: Requirements & Architecture
Finalize business workflow
Define roles (Farmer, Transporter, Lab, Manufacturer, AYUSH Admin, Consumer)
Define ownership transfer rules
Define blockchain events
Create system architecture diagrams

Output: Complete SRS + Architecture Document

Phase 1: Database Design

Design all core entities.

Main Tables
Users
Roles
Farmers
Transporters
Laboratories
Manufacturers
Herb Batches
Ownership History
QR Tokens
Lab Tests
Certifications
Products
Product Ingredients (Batch ↔ Product Linking)
Shipments
Notifications
Audit Logs

Output: ER Diagram + PostgreSQL Schema

Phase 2: Authentication & Authorization
User Registration
Login
JWT Authentication
RBAC (Role-Based Access Control)
Roles
Farmer
Transporter
Lab
Manufacturer
AYUSH Admin

Output: Secure Auth System

Phase 3: Core Batch Management
Farmer Module
Register Herb
Upload Images
GPS Capture
Create Batch
System
Generate Batch ID
Store Metadata
Generate Initial QR
Assign Ownership to Farmer

Output: Batch Creation Flow

Phase 4: AI Identification Module
Herb Image Upload
AI Species Detection
Confidence Score
Farmer Confirmation
MVP
Azure Custom Vision / Gemini Vision

Output: AI-assisted Herb Registration

Phase 5: Dynamic QR Engine

Core innovation of HerbChain.

Features
QR Generation
QR Validation
QR Expiry
QR Deactivation
New QR Creation
Rules
Only one active QR per batch
Transfer automatically invalidates old QR

Output: Dynamic Ownership QR System

Phase 6: Ownership Transfer Engine
Flow

Farmer → Transporter Transporter → Lab Lab → Transporter Transporter → Manufacturer

Features
Scan QR
Verify Owner
Verify Authorization
Transfer Ownership
Create Audit Record
Generate New QR

Output: Chain-of-Custody Module

Phase 7: Shipment & Logistics Module
Pickup Requests
Delivery Requests
Shipment Tracking
GPS Logs
Proof of Delivery

Output: Transport Management

Phase 8: Laboratory Module
Features
View Requested Batches
Receive Batch
Create Sample
Enter Test Results
Upload Certificates
Approve / Reject Batch

Output: Lab Certification System

Phase 9: Manufacturer Module
Features
View Certified Herbs
Request Batches
Receive Batches
Inventory Management

Output: Raw Material Procurement System

Phase 10: Product Lineage Engine

The second major innovation.

Features
Create Product
Link Multiple Herb Batches
Parent-Child Relationships
Ingredient Tracking

Example:

HERB-001
HERB-014
HERB-027
     ↓
 PRODUCT-001


Output: Batch-to-Product Traceability

Phase 11: Consumer Verification Portal
QR Scan

Displays:

Product Details
Origin Farm
Lab Certification
Manufacturer
Supply Chain Journey
Public Access

No login required.

Output: Digital Product Passport

Phase 12: Blockchain Layer

Store only trusted events.

Smart Contracts
createBatch()
transferOwnership()
certifyBatch()
createProduct()
linkBatchToProduct()

Blockchain Events
BATCH_CREATED
TRANSFERRED
CERTIFIED
REJECTED
PRODUCT_CREATED
LINKED


Output: Permissioned Blockchain Network

Phase 13: AYUSH Admin Portal
Dashboard
Farmers
Labs
Manufacturers
Active Shipments
Failed Certifications
Product Traceability
Search
Batch ID
Product ID
User
Location

Output: Regulatory Monitoring System

Phase 14: Notifications & Alerts
SMS
Email
Push Notifications

Examples:

Batch Requested
Pickup Assigned
Certification Complete
Ownership Transferred

Output: Communication Layer

Phase 15: File Storage System

Store:

Herb Images
Lab Reports
Certificates
Product Documents

Output: Document Management

Phase 16: Reporting & Analytics
Analytics
Herb Production
Certification Rate
Failed Tests
Regional Supply Trends
Manufacturer Consumption

Output: BI Dashboard

Phase 17: Offline Sync Module
Mobile Features
Offline QR Scan
Offline Registrations
Transaction Queue
Auto Sync

Output: Rural Connectivity Support

Phase 18: Security & Audit
RBAC
Audit Logs
Data Encryption
QR Tamper Protection
API Security

Output: Production Security Layer

Phase 19: Deployment & DevOps
Backend Deployment
Database Deployment
Blockchain Nodes
Monitoring
CI/CD

Output: Production Environment

Recommended Build Order (Actual Development Sequence)
1. Architecture
2. Database Design
3. Authentication
4. Batch Management
5. Dynamic QR Engine
6. Ownership Transfer
7. Lab Module
8. Manufacturer Module
9. Product Lineage
10. Consumer Portal
11. AYUSH Dashboard
12. AI Integration
13. Blockchain Integration
14. Notifications
15. Analytics
16. Offline Sync
17. Security Hardening
18. Deployment

MVP (Hackathon / First Version)

Build only:

✅ Auth
✅ Database
✅ Batch Creation
✅ QR Generation
✅ Ownership Transfer
✅ Lab Certification
✅ Product Creation
✅ Product Lineage
✅ Consumer Verification
✅ AYUSH Dashboard


This MVP alone demonstrates 90% of the HerbChain innovation, while AI, blockchain, analytics, notifications, and offline sync can be added afterward.