Phase 4: AI Identification Module (Production-Grade)

This phase adds the AI-assisted herb recognition layer.

Important:

AI does NOT certify herbs.

AI only helps farmers register herbs faster and reduces manual mistakes.

The lab remains the final source of scientific validation.

Goal of Phase 4

Convert:

Herb Image
    ↓
AI Analysis
    ↓
Species Prediction
    ↓
Confidence Score
    ↓
Farmer Confirmation
    ↓
Batch Registration


into a reliable and production-ready workflow.

Core Objective

When a farmer uploads a herb image:

Image
 ↓
AI
 ↓
Top Predictions
 ↓
Farmer Confirmation
 ↓
Store Prediction
 ↓
Continue Registration


The AI should act like a knowledgeable assistant, not an authority.

Where AI Fits in the Flow

Current Flow:

Capture Image
 ↓
Fill Form
 ↓
Create Batch


New Flow:

Capture Image
 ↓
AI Detection
 ↓
Predictions
 ↓
Farmer Confirmation
 ↓
Fill Remaining Data
 ↓
Create Batch

AI Module Architecture
Mobile App
     ↓
Image Upload
     ↓
AI Service Layer
     ↓
Vision Model
     ↓
Predictions
     ↓
Backend
     ↓
Farmer Confirmation
     ↓
Batch Creation

MVP Recommendation

For MVP:

Option 1 (Recommended)
Gemini Vision

Advantages:

Fast setup

No model training initially

Can identify many herbs

Easy API integration

Good for hackathons/MVP

Option 2
Azure Custom Vision

Advantages:

Custom trained model

Higher accuracy later

AYUSH-specific herbs

Production upgrade path

Recommended Development Strategy
Stage 1

Use:

Gemini Vision


to get working detection.

Stage 2

Collect herb images from farmers.

Stage 3

Train:

Azure Custom Vision


with real AYUSH herb dataset.

Stage 4

Replace generic predictions with HerbChain-specific model.

AI Identification Workflow
Step 1: Farmer Uploads Image
Upload Herb Photo


Supported Formats:

jpg
jpeg
png
webp

Validation

Check:

Image Exists

Supported Format

Valid Size

Not Corrupted


Recommended:

Max Size:
10 MB


Minimum resolution:

1024x1024

Step 2: Store Image Temporarily

Store in:

temporary_uploads


Do NOT create batch yet.

Reason:

AI may fail

Farmer may cancel process

Step 3: Send Image to AI

Example flow:

Image
 ↓
AI Gateway
 ↓
Gemini/Azure
 ↓
Response

Expected AI Response

Never expect only one result.

Always request Top-N predictions.

Example:

{
  "predictions": [
    {
      "species": "Ashwagandha",
      "confidence": 94
    },
    {
      "species": "Tulsi",
      "confidence": 4
    },
    {
      "species": "Giloy",
      "confidence": 2
    }
  ]
}

Why Top Predictions Matter

Many medicinal plants look similar.

Example:

Neem
Melia
Curry Leaf


may confuse models.

Showing multiple candidates improves accuracy.

Confidence Scoring Rules
High Confidence
>= 90%


Display:

✅ Highly Likely: Ashwagandha

Medium Confidence
70-89%


Display:

⚠ Likely Match
Please Verify

Low Confidence
< 70%


Display:

❌ AI Not Confident

Please Select Manually

Farmer Confirmation Screen

Show:

Detected Species:
Ashwagandha

Confidence:
94%

Image:
[preview]


Options:

Accept

Change Species

Retry Image

If Farmer Accepts

Store:

Predicted Species

Confidence Score

Accepted = TRUE


Continue registration.

If Farmer Changes Species

Store:

AI Prediction

Farmer Selection

Mismatch Flag


Example:

AI:
Ashwagandha

Farmer:
Tulsi


This becomes valuable training data later.

AI Identification History

Create:

ai_identifications
id

image_id

predicted_species

confidence_score

selected_species

accepted

model_name

model_version

created_at

Model Metadata

Always store:

Model Name

Model Version

Provider


Example:

Gemini-Vision-2

Version 1.0


Why?

Later:

Accuracy Comparisons

Model Audits

Model Retraining

Herb Species Mapping

Never trust AI text directly.

Create mapping table.

herb_aliases
id

herb_id

alias_name


Example:

Ashwagandha

Withania somnifera

Indian Ginseng


AI outputs alias.

Backend maps to master herb.

Image Quality Validation

Before AI detection.

Blur Detection

Reject:

Very blurry images

Too Dark

Reject:

Poor lighting

Multiple Plants

Flag:

Multiple herbs detected

No Plant Found

Response:

No herb detected.
Please capture a clearer image.

AI Service Layer

Never connect app directly to Gemini.

Bad:

Mobile
 ↓
Gemini


Good:

Mobile
 ↓
Backend
 ↓
AI Service
 ↓
Gemini


Benefits:

API security

Rate limiting

Caching

Logging

AI Request Logging

Create:

ai_requests
id

user_id

image_url

provider

response_time

success

created_at

AI Response Caching

Prevent repeated calls.

Example:

Farmer retries registration

Same image

Same hash


Reuse prediction.

Create:

image_hashes
id

hash

ai_result

created_at

Failure Handling
AI Timeout

Response:

AI Service Unavailable

Please enter species manually


Farmer must still be able to continue.

AI API Failure
Do not block batch registration.


Important Production Rule:

AI is optional

Batch Creation is mandatory

Accuracy Feedback System

Later useful for training.

After lab certification:

AI Predicted Ashwagandha

Lab Confirmed Ashwagandha


Accuracy:

Correct


or

Incorrect


Store feedback.

AI Feedback Table
ai_feedback
id

batch_id

predicted_species

lab_verified_species

match_result

created_at

Future Custom Model Strategy

Over time:

AI Prediction

Lab Result

Human Corrections


become a massive training dataset.

Eventually:

HerbChain Model v2


can outperform generic models.

Security Considerations
Virus Scan Uploaded Images

Before processing.

Rate Limiting

Example:

50 AI requests/day/user

Image Tampering Detection

Store:

Image Hash


for integrity.

APIs Required
AI Detection
POST /ai/detect-herb


Input:

Image


Output:

{
  "predictions": [
    {
      "species": "Ashwagandha",
      "confidence": 94
    }
  ]
}

Confirmation
POST /ai/confirm


Input:

{
  "predictionId":"123",
  "selectedSpecies":"Ashwagandha",
  "accepted":true
}

Database Additions in Phase 4

New Tables:

ai_identifications

ai_requests

ai_feedback

image_hashes

herb_aliases

End-to-End Production Flow
Farmer Opens App
        ↓
Capture Herb Image
        ↓
Image Validation
        ↓
Temporary Storage
        ↓
Gemini Vision
        ↓
Top Species Predictions
        ↓
Confidence Score
        ↓
Farmer Confirms
        ↓
AI Record Stored
        ↓
Batch Creation Continues
        ↓
Ownership Assigned
        ↓
QR Generated

Final Output of Phase 4

After this phase, HerbChain supports:

✅ Herb Image Upload

✅ AI Species Detection

✅ Confidence Scoring

✅ Top-N Predictions

✅ Farmer Confirmation

✅ AI Result Storage

✅ Training Data Collection

✅ Model Auditing

✅ Future Custom Model Readiness

✅ AI Failure Recovery

✅ AI-Assisted Herb Registration


Most importantly, this phase creates a growing dataset where AI predictions + farmer corrections + lab validations continuously improve the intelligence of HerbChain over time.