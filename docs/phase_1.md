Phase 1: Production-Grade Database Design (HerbChain)

This phase is the foundation of the entire project.

A bad database will force rewrites later in:

Ownership Transfer
QR Engine
Blockchain Integration
Product Lineage
Analytics
AYUSH Monitoring

So we design for future scale, not just MVP.

1. Database Philosophy

Never design database around screens.

Design around:

WHO owns what?
WHERE did it come from?
WHO handled it?
WHAT happened?
WHEN did it happen?
CAN we reconstruct entire history?


Everything in HerbChain revolves around:

User
 ↓
Batch
 ↓
Ownership
 ↓
Transfer
 ↓
Testing
 ↓
Certification
 ↓
Product
 ↓
Consumer Verification

2. Main Database Domains

Split the database into logical domains.

1. Identity Domain
2. Batch Domain
3. QR Domain
4. Ownership Domain
5. Logistics Domain
6. Laboratory Domain
7. Manufacturing Domain
8. Product Lineage Domain
9. Blockchain Domain
10. Audit Domain
11. Notification Domain
12. Consumer Domain

3. Identity Domain
users

Master authentication table.

users


Fields:

id (UUID)

email
phone

password_hash

role

status

is_verified

created_at
updated_at


Role values:

FARMER
TRANSPORTER
LAB
MANUFACTURER
AYUSH_ADMIN

user_profiles

Common profile information.

user_profiles


Fields

id

user_id

full_name

address

district

state

country

latitude
longitude

profile_photo

created_at

4. Organization Domain

Instead of storing everything inside users.

Create independent organizations.

farmers
farmers


Fields

id

user_id

farmer_code

farm_name

farm_size

organic_certified

license_number

registration_date

transporters
transporters


Fields

id

user_id

transporter_code

vehicle_number

license_number

vehicle_type

active_status

laboratories
laboratories


Fields

id

user_id

lab_code

lab_name

accreditation_number

address

verification_status

manufacturers
id

user_id

manufacturer_code

company_name

gst_number

license_number

verification_status

5. Herb Master Data

Never hardcode herb names.

herbs
id

scientific_name

common_name

ayush_name

description

image_reference

active


Examples:

Ashwagandha

Tulsi

Neem

Giloy

6. Batch Domain

This is the heart of the system.

herb_batches

Each physical batch gets one record.

id

batch_id

herb_id

farmer_id

current_owner_id

current_owner_role

status

quantity

unit

harvest_date

cultivation_type

location_lat

location_long

farm_location

created_at


status:

CREATED

AVAILABLE

REQUESTED

IN_TRANSIT

UNDER_TESTING

CERTIFIED

FAILED

MANUFACTURING

CONSUMED

ARCHIVED

batch_images

A batch may contain many images.

id

batch_id

image_url

image_type

uploaded_at


image_type:

HERB_IMAGE

PACKAGING_IMAGE

TRANSPORT_IMAGE

7. Ownership Domain

Most critical table.

Never overwrite history.

ownership_history
id

batch_id

from_owner_id

from_role

to_owner_id

to_role

transfer_type

gps_lat

gps_long

timestamp


Examples

Farmer → Transporter

Transporter → Lab

Lab → Transporter

Transporter → Manufacturer

current_ownership

Fast lookup table.

id

batch_id

owner_id

owner_role

active_qr_token

updated_at


Instead of querying millions of transfer records.

8. QR Domain

Core innovation.

qr_tokens
id

batch_id

token

version

status

generated_at

activated_at

deactivated_at


status:

ACTIVE

EXPIRED

TRANSFERRED

INVALIDATED

qr_scan_logs

Every scan.

id

qr_token_id

scanned_by

location

ip_address

device_id

scan_result

timestamp


scan_result

SUCCESS

FAILED

UNAUTHORIZED

EXPIRED

9. Logistics Domain
shipment_requests
id

batch_id

requested_by

requested_role

assigned_transporter

pickup_location

destination_location

status

created_at


status:

REQUESTED

ASSIGNED

PICKED_UP

IN_TRANSIT

DELIVERED

FAILED

shipment_tracking
id

shipment_id

latitude

longitude

captured_at

10. Laboratory Domain
lab_requests
id

batch_id

lab_id

status

request_date

lab_tests

One batch can have many tests.

id

batch_id

lab_id

sample_id

test_name

test_type

analyst

test_date

result

remarks


Examples

Moisture

Heavy Metals

Microbial

Purity

certifications

Final certificate.

id

batch_id

lab_id

certificate_number

certificate_url

status

issued_at

expiry_date


status

PASSED

FAILED

11. Manufacturing Domain
manufacturing_batches

Represents a production event.

id

manufacturer_id

manufacturing_code

batch_size

unit

manufacturing_date

status

products

Finished product.

id

product_id

manufacturer_id

product_name

description

sku

quantity

product_qr

created_at

12. Product Lineage Domain

VERY IMPORTANT.

product_ingredients

Parent-child relationship.

id

product_id

herb_batch_id

quantity_used

unit


This allows:

Product
 ↓
All Raw Herb Batches
 ↓
All Farmers
 ↓
All Certifications
 ↓
All Transfers


This powers consumer traceability.

13. Blockchain Domain

Blockchain is not database.

Blockchain stores proof.

blockchain_events
id

event_type

entity_type

entity_id

transaction_hash

block_number

recorded_at


Examples:

BATCH_CREATED

TRANSFERRED

CERTIFIED

PRODUCT_CREATED

14. Audit Domain

Production systems require this.

audit_logs

Track everything.

id

user_id

action

entity_type

entity_id

old_value

new_value

created_at


Examples:

Batch Updated

Certificate Uploaded

Transfer Executed

15. Notifications Domain
notifications
id

recipient_id

title

message

type

status

created_at


type:

EMAIL

SMS

PUSH

16. Consumer Domain
consumer_scans

Track public scans.

id

product_id

location

device

timestamp


Useful for:

Counterfeit detection

Heatmaps

Demand analytics

17. File Storage Strategy

Do NOT store files inside PostgreSQL.

Database stores only:

url/path


Actual files go to:

Azure Blob Storage
or
AWS S3


Files:

Herb Images

Lab Reports

Certificates

Production Documents

Product Images

18. Relationships Overview
USER
 ├── FARMER
 ├── LAB
 ├── TRANSPORTER
 └── MANUFACTURER

HERB
  ↓
HERB_BATCH
  ↓
QR_TOKEN
  ↓
OWNERSHIP_HISTORY
  ↓
LAB_TEST
  ↓
CERTIFICATION
  ↓
PRODUCT_INGREDIENT
  ↓
PRODUCT

19. Database Choice
Primary Database
PostgreSQL


Why?

JSON support
GIS support
Strong transactions
Production-grade
Scalable
Audit-friendly

20. Future-Proof Tables You Will Thank Yourself For

Don't skip:

current_ownership
ownership_history

audit_logs

blockchain_events

product_ingredients

qr_scan_logs

consumer_scans


These six tables power almost every advanced feature later.

Final Database Scope
Total Core Tables
users
user_profiles

farmers
transporters
laboratories
manufacturers

herbs

herb_batches
batch_images

current_ownership
ownership_history

qr_tokens
qr_scan_logs

shipment_requests
shipment_tracking

lab_requests
lab_tests
certifications

manufacturing_batches
products
product_ingredients

blockchain_events

notifications

audit_logs

consumer_scans


Total: ~24 production-grade tables, enough to support AI identification, dynamic QR ownership, laboratory certification, transport tracking, blockchain proofs, product lineage, consumer verification, and AYUSH regulatory monitoring without requiring major redesign later.