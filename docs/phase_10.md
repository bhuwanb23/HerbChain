Phase 10: Product Lineage Engine (Batch-to-Product Traceability)

This is the second biggest innovation of HerbChain after Dynamic Ownership QR.

Up to Phase 9, HerbChain tracks:

One Herb Batch
        ↓
Chain of Custody
        ↓
Manufacturer Inventory


Phase 10 introduces:

Multiple Herb Batches
         ↓
Manufacturing Process
         ↓
Single Product
         ↓
Complete Backward Traceability


This is what enables a consumer, manufacturer, or AYUSH auditor to answer:

"Exactly which herb batches, farms, transport events, and lab certificates were used in this product?"

Goal of Phase 10

Build a lineage engine that supports:

Multiple Input Batches
         ↓
Manufacturing
         ↓
Finished Product
         ↓
Traceability View


Example:

HERB-001
HERB-014
HERB-027
HERB-031

      ↓

PRODUCT-001


And later:

PRODUCT-001
      ↓
HERB-001
      ↓
Farmer
      ↓
Lab Certificate

Core Philosophy

Never lose raw-material identity.

Most systems do:

Raw Material
       ↓
Production
       ↓
Lose Source Information


HerbChain must do:

Raw Material
       ↓
Production
       ↓
Identity Preserved Forever

Product Lineage Model

A product is a child.

Herb batches are parents.

Example:

HERB-001
HERB-002
HERB-003

        ↓

   PRODUCT-001


This creates a:

Parent → Child Relationship


which allows bidirectional tracing.

Lineage Types Supported
One-to-One
HERB-001
    ↓
PRODUCT-001

Many-to-One

Most common.

HERB-001
HERB-002
HERB-003
    ↓
PRODUCT-001

One-to-Many

Production batch split.

HERB-001
     ↓

PRODUCT-A
PRODUCT-B
PRODUCT-C


Should be supported.

Many-to-Many

Future manufacturing scenario.

HERB-001
HERB-002
HERB-003
      ↓

PRODUCT-A
PRODUCT-B


Design database for this from day one.

Manufacturing Workflow
Manufacturer Inventory
         ↓
Select Batches
         ↓
Reserve Materials
         ↓
Create Production Batch
         ↓
Consume Ingredients
         ↓
Generate Product
         ↓
Create Product QR
         ↓
Store Lineage

1. Production Batch

A production batch represents one manufacturing event.

Example:

Manufacturing Batch:

MFG-2026-00001


Not the product itself.

Think:

Production Run

manufacturing_batches

Enhanced table:

id

manufacturing_batch_id

manufacturer_id

product_name

product_type

status

production_date

expiry_date

created_at


Status:

PLANNED

IN_PROGRESS

COMPLETED

CANCELLED

Why Separate Manufacturing Batch?

Because one product can have multiple production runs.

Example:

Ashwagandha Capsules

Run 1

Run 2

Run 3


Each run may use different herb batches.

2. Product Creation

Manufacturer enters:

Product Name

Description

Formula

Pack Size

Category

Shelf Life


Example:

Ashwagandha Wellness Capsules

products

Enhanced structure:

id

product_id

manufacturer_id

product_name

description

category

sku

pack_size

expiry_months

status

created_at

Product Status
DRAFT

ACTIVE

DISCONTINUED

RECALLED

3. Ingredient Selection

Manufacturer chooses inventory batches.

Example:

HERB-001 → 10 KG

HERB-014 → 5 KG

HERB-027 → 20 KG


Validation:

Inventory Available?

Certified?

Not Recalled?

Not Expired?


Only then proceed.

4. Material Consumption

When production starts:

Inventory changes.

Before:

HERB-001

Available:
50 KG


Consumed:

10 KG


After:

Available:
40 KG

Consumed:
10 KG

inventory_transactions

Create:

CONSUMED_FOR_PRODUCTION


transaction.

Never directly edit inventory.

5. Parent-Child Mapping

This is the heart of Phase 10.

Create:

product_ingredients
id

product_id

manufacturing_batch_id

herb_batch_id

quantity_used

unit

consumed_at


Example

PRODUCT-001

contains

HERB-001

10 KG

PRODUCT-001

contains

HERB-014

5 KG

PRODUCT-001

contains

HERB-027

20 KG

Traceability Graph

Database must support:

Product
 ↓
All Ingredients


and

Ingredient
 ↓
All Products


This becomes critical for recalls.

6. Production Formula

Optional but highly recommended.

Create:

product_formulas
id

product_id

herb_id

standard_quantity

unit


Example:

Ashwagandha
10%

Tulsi
5%

Giloy
15%


This gives manufacturing consistency.

7. Product QR Generation

Finished products need their own QR.

Important:

Product QR != Ownership QR


Ownership QR:

Changes


Product QR:

Permanent

product_qr_tokens
id

product_id

token

generated_at


Example:

PRODUCT-001


gets:

PRD_x7akd82m91

What Product QR Shows

Consumer View:

Product Name

Manufacturer

Certification Status

Source Batches

Supply Journey

Verification Status


Not proprietary business details.

8. Backward Traceability Engine

Most important feature.

Given:

PRODUCT-001


System should reconstruct:

Product
 ↓
Manufacturing Batch
 ↓
Herb Batches
 ↓
Lab Certificates
 ↓
Transport History
 ↓
Farmers
 ↓
Origin Locations

Example Output
Product:
Ashwagandha Capsules

Ingredients:

HERB-001
Farmer: Raman
District: Salem

HERB-014
Farmer: Kumar
District: Madurai

Lab:
AYUSH Verified

9. Forward Traceability Engine

The reverse query.

Given:

HERB-001


Find:

All Products Using This Batch


Example:

HERB-001

↓

Products:

PRODUCT-A

PRODUCT-B

PRODUCT-C


Used during recalls.

10. Recall Management Support

Major production requirement.

Scenario:

Lab Revokes Certificate

Batch:
HERB-001


System immediately identifies:

Affected Products


Query:

HERB-001
 ↓
Products
 ↓
Manufacturing Batches
 ↓
Inventory

affected_products
id

batch_id

product_id

impact_type

created_at

11. Product Composition Audit

AYUSH must verify:

Which herbs were used?

How much?

Which certificates?

Which farmers?


Without manual investigation.

Create:

product_lineage_snapshots
id

product_id

snapshot_json

generated_at


Useful for:

Audit

Consumer View

Reporting

12. Product Certification Check

Before product creation:

Validate:

All Batches Certified?


Example

HERB-001 ✅

HERB-014 ✅

HERB-027 ❌


Block production.

Rule:

Rejected batches
cannot enter products.

13. Product Traceability API

Given:

PRODUCT-001


Return:

{
  "product":"Ashwagandha Capsules",
  "manufacturer":"ABC AYUSH",
  "ingredients":[
    {
      "batch":"HERB-001",
      "farmer":"Farmer A",
      "certificate":"CERT-001"
    }
  ]
}

14. Blockchain Events

Production completion should create:

PRODUCT_CREATED


Ingredient linkage creates:

BATCH_LINKED_TO_PRODUCT


Example:

{
  "event":"BATCH_LINKED_TO_PRODUCT",
  "productId":"PRODUCT-001",
  "batchId":"HERB-001"
}

15. Manufacturer Dashboard Additions
Production
Create Product

Create Production Run

Allocate Ingredients

Traceability
View Product Lineage

View Ingredient Sources

View Supplier History

Recalls
Affected Products

Recall Impact

APIs Required
Create Manufacturing Batch
POST /manufacturing/batches

Create Product
POST /products

Add Ingredients
POST /products/ingredients

Generate Product QR
POST /products/qr

Product Lineage
GET /products/{id}/lineage

Ingredient Usage
GET /batches/{id}/products

New Database Tables Added
product_formulas

product_qr_tokens

affected_products

product_lineage_snapshots


(Existing product_ingredients becomes a core table of this phase.)

End-to-End Flow
Manufacturer Inventory
         ↓
Select Certified Batches
         ↓
Reserve Inventory
         ↓
Create Production Batch
         ↓
Consume Materials
         ↓
Create Product
         ↓
Link Ingredients
         ↓
Generate Product QR
         ↓
Store Parent-Child Lineage
         ↓
Create Blockchain Records

Final Output of Phase 10

After completion, HerbChain supports:

✅ Product Creation

✅ Manufacturing Batches

✅ Multi-Batch Ingredient Linking

✅ Parent-Child Relationships

✅ Ingredient Consumption Tracking

✅ Product QR Generation

✅ Backward Traceability

✅ Forward Traceability

✅ Product Lineage Visualization

✅ Recall Management

✅ Product Audit Support

✅ AYUSH Compliance Tracking

✅ Blockchain Lineage Records

✅ Complete Batch-to-Product Traceability


This phase delivers HerbChain's second major differentiator:

Every finished AYUSH product permanently retains a verifiable relationship to every raw herb batch that contributed to it, allowing full farm-to-product and product-to-farm traceability.