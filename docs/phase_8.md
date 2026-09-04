Phase 8: Laboratory Module (Lab Certification System)

This phase is where HerbChain establishes scientific trust.

Before this phase:

Farmer says:
"This is Ashwagandha."


After this phase:

Accredited Lab says:
"We tested it.
This batch passed certification."


This is the quality validation layer of HerbChain.

Goal of Phase 8

Enable laboratories to:

Receive Batches
      ↓
Create Samples
      ↓
Perform Tests
      ↓
Record Results
      ↓
Issue Certificates
      ↓
Approve / Reject Batch


while maintaining complete traceability back to:

Farmer
GPS Location
Harvest
Ownership History
Transport History

Core Principle

The lab never changes:

Farmer Data
Ownership History
Transport History


The lab only adds:

Scientific Validation

Laboratory Workflow
View Available Batch
        ↓
Request Batch
        ↓
Receive Batch
        ↓
Verify Batch
        ↓
Create Sample
        ↓
Run Tests
        ↓
Store Results
        ↓
Generate Certificate
        ↓
Approve / Reject

1. Laboratory Dashboard

Lab users should see:

Incoming Batches
Awaiting Delivery

Received Batches
Available For Testing

Under Testing
Tests In Progress

Certified Batches
Approved

Failed Batches
Rejected

Batch Status Extension

Add states:

AWAITING_LAB

RECEIVED_BY_LAB

SAMPLE_CREATED

UNDER_TESTING

CERTIFIED

REJECTED

2. View Requested Batches

Lab can search:

Batch ID

Species

Farmer

Location

Harvest Date

Quantity


Visible Data

Batch ID

Herb Name

Farmer

Harvest Date

Weight

Current Status

Transport Details

Images

Ownership History


Lab CANNOT edit these fields.

3. Receive Batch

When transporter reaches lab:

Transporter QR
        ↓
Lab Scan
        ↓
Ownership Transfer


After successful transfer:

Current Owner = Lab


Status:

RECEIVED_BY_LAB

Receive Batch Checklist

Lab personnel verifies:

Package Integrity

Physical Quantity

QR Match

Shipment Documents

Visible Quality

lab_receipts Table
id

batch_id

lab_id

receiver_name

received_quantity

received_at

remarks

condition_status


Condition:

GOOD

DAMAGED

PARTIAL

REJECTED

4. Sample Creation

A batch can generate multiple samples.

This is important.

Example:

Batch:
50 KG


Samples:

Sample A

Sample B

Sample C

sample_records
id

sample_id

batch_id

lab_id

sample_weight

sample_unit

collected_by

collected_at


Example:

SAMP-0001

Batch:
HERB-2026-000001

Why Separate Samples?

Because:

One Batch

↓

Several Tests

↓

Several Samples


This follows actual lab operations.

5. Test Management

Each sample can have many tests.

Testing Categories
Identity Tests
Species Verification

Morphological Analysis

Microscopy

Purity Tests
Foreign Matter

Purity %

Extractive Values

Physical Tests
Moisture Content

Color

Odor

Density

Chemical Tests
Chemical Markers

Active Constituents

Phytochemical Analysis

Safety Tests
Heavy Metals

Pesticides

Toxins

Adulterants

Microbiological Tests
Yeast

Mold

Bacteria

Pathogens

lab_tests Table
id

batch_id

sample_id

lab_id

test_name

test_category

test_method

analyst

started_at

completed_at

status


Status:

PENDING

IN_PROGRESS

COMPLETED

FAILED

6. Enter Test Results

Each test generates results.

test_results
id

test_id

parameter_name

observed_value

unit

acceptable_range

result


Example

Moisture

Observed:
7.2 %

Allowed:
<10%

PASS


Another Example

Lead

Observed:
0.6 ppm

Allowed:
0.5 ppm

FAIL

Multiple Results Support

One test may contain:

20+

Parameters


Do NOT store everything in one column.

7. Analyst Workflow

Lab User

Create Sample


↓

Create Test


↓

Enter Parameters


↓

Submit Results


↓

Supervisor Review


↓

Finalize

8. Review & Approval Workflow

Production systems should not allow:

Analyst → Direct Certification


Use two-level review.

Role Separation
Analyst

Can:

Enter Results

Lab Supervisor

Can:

Approve Results

Issue Certificate


This avoids fraud.

lab_reviews
id

test_id

reviewed_by

review_status

review_notes

reviewed_at


Status:

APPROVED

REJECTED

REWORK_REQUIRED

9. Certificate Generation

After successful review.

Generate:

Certificate Of Analysis


(COA)

Certificate Contains
Certificate Number

Batch ID

Sample ID

Species

Lab Name

Test Summary

Issue Date

Expiry Date

Digital Signature

certifications Table Enhancement
id

certificate_number

batch_id

lab_id

certificate_url

certificate_hash

issued_by

issued_at

expiry_date

status

Certificate Hash

Store:

SHA256 hash


Used for:

Tamper Detection

10. Approve Batch

If all mandatory tests pass:

Status:

CERTIFIED


Ownership:

Lab


remains unchanged until transfer.

Create records:

Certification

Audit Log

Blockchain Event

11. Reject Batch

If important tests fail:

Status:

REJECTED


Examples

Heavy Metal Failure

Species Mismatch

Microbial Failure

Contamination

rejection_records
id

batch_id

reason

description

rejected_by

rejected_at

Rejection Actions

Configurable.

Possible outcomes:

Destroy Batch

Return To Supplier

Retest Required

Hold For Investigation

12. Species Verification Logic

One powerful HerbChain feature.

Farmer Says:

Ashwagandha


AI Says:

Ashwagandha


Lab Says:

Ashwagandha


Then:

Verified


But:

Farmer:
Ashwagandha

Lab:
Not Ashwagandha


Create:

Species Mismatch Alert


for AYUSH.

species_verification_logs
id

batch_id

farmer_species

ai_prediction

lab_species

status


Status:

MATCH

MISMATCH

13. Attach Documents

Every test may upload:

PDF Reports

Microscope Images

Lab Photos

Supporting Documents

lab_documents
id

batch_id

document_type

document_url

uploaded_at

Document Types
TEST_REPORT

MICROSCOPY_IMAGE

CERTIFICATE

ANALYSIS_REPORT

14. Laboratory Analytics

Show:

Testing Volume

Pass Rate

Fail Rate

Top Herbs Tested

Average Certification Time

Species Mismatch %

15. Blockchain Events

After certification:

Create:

LAB_CERTIFIED


or

LAB_REJECTED


Example

{
  "event":"LAB_CERTIFIED",
  "batchId":"HERB-2026-000001",
  "certificate":"CERT-00045"
}

16. Consumer Impact

Certificates become available later for:

Manufacturer Verification

Consumer Product Passport

AYUSH Audits


Consumer should eventually see:

Lab:
ABC AYUSH Labs

Certificate:
Verified

Issue Date:
04 Sept 2026


without exposing sensitive internal data.

APIs Required
Lab Receives Batch
POST /labs/batches/receive

Create Sample
POST /labs/samples

Create Test
POST /labs/tests

Enter Results
POST /labs/results

Review Test
POST /labs/reviews

Generate Certificate
POST /labs/certificates

Approve Batch
POST /labs/approve

Reject Batch
POST /labs/reject

New Database Tables Added
lab_receipts

sample_records

test_results

lab_reviews

rejection_records

species_verification_logs

lab_documents

End-to-End Flow
Lab Requests Batch
        ↓
Batch Delivered
        ↓
Lab Receives Batch
        ↓
Ownership = Lab
        ↓
Create Samples
        ↓
Run Tests
        ↓
Record Parameters
        ↓
Supervisor Review
        ↓
Generate Certificate
        ↓
PASS ?
    ↙       ↘
 YES         NO
 ↓           ↓
CERTIFIED   REJECTED
 ↓           ↓
Certificate  Rejection Record
 ↓           ↓
Blockchain Event

Final Output of Phase 8

After completion, HerbChain supports:

✅ View Requested Batches

✅ Receive Batches

✅ Sample Management

✅ Multi-Test Support

✅ Test Result Recording

✅ Analyst & Supervisor Workflow

✅ Certificate Generation

✅ Certificate Storage

✅ Species Verification

✅ Batch Approval

✅ Batch Rejection

✅ Laboratory Documents

✅ Audit Logging

✅ Blockchain Certification Events

✅ Full Lab Certification System


This phase transforms a farmer-declared herb batch into a scientifically validated and certifiable raw material, making it trusted for manufacturers, regulators, and eventually consumers.