# Farmers Models

This directory contains all the database models for the farmers module in the HerbChain application.

## Models Overview

### 1. FarmerProfile (`farmer_profile.py`)
Stores farmer's personal and farm details.

**Fields:**
- `farmer_id` (PK) - Auto-incrementing primary key
- `name` - Farmer's full name
- `phone_number` (unique) - Used for login, must be unique
- `password_hash` - Hashed password for authentication
- `language_preference` - Local language support (en, hi, te, etc.)
- `address` - Village, district, state information
- `gps_location` - Latitude and longitude of farm
- `land_area` - Farm size in hectares/acre
- `farming_type` - organic / conventional
- `created_at` / `updated_at` - Timestamps

**Relationships:**
- One-to-many with HerbBatch
- One-to-many with Payment
- One-to-many with TrainingProgress

### 2. HerbBatch (`herb_batch.py`)
Stores details when farmer registers a new herb batch.

**Fields:**
- `batch_id` (PK) - UUID primary key
- `farmer_id` (FK) - Reference to FarmerProfile
- `species_detected` - AI/Google Lens detection result
- `species_entered` - Manual input, cross-checked with AI
- `image_url` - Uploaded herb image (cloud/IPFS link)
- `geo_location` - Collection location coordinates
- `timestamp` - When registered
- `harvest_season` - Auto-extracted from timestamp
- `qr_code` - Unique link to batch
- `status` - Registered, In Transit, Lab Validated, Processed, etc.
- `remarks` - Optional notes from farmer

**Relationships:**
- Many-to-one with FarmerProfile
- One-to-many with Payment

### 3. Payment (`payment.py`)
Keeps track of payments to farmers.

**Fields:**
- `payment_id` (PK) - Auto-incrementing primary key
- `farmer_id` (FK) - Reference to FarmerProfile
- `batch_id` (FK) - Reference to HerbBatch (optional)
- `amount` - Payment amount in currency
- `payment_type` - Incentive, Bonus, Base Price, Sustainability Credit
- `status` - Pending, Completed, Failed
- `payment_date` - When payment was made
- `transaction_reference` - UPI/Bank reference

**Relationships:**
- Many-to-one with FarmerProfile
- Many-to-one with HerbBatch

### 4. TrainingContent (`training_content.py`)
Training content and modules.

**Fields:**
- `training_id` (PK) - Auto-incrementing primary key
- `title` - Training module title
- `description` - Training description
- `content_url` - Video/PDF/text link
- `language` - Content language (en, hi, te, etc.)
- `content_type` - video, pdf, text, interactive
- `category` - farming_techniques, sustainability, etc.
- `difficulty_level` - beginner, intermediate, advanced
- `duration_minutes` - Estimated duration
- `is_active` - Whether content is available

**Relationships:**
- One-to-many with TrainingProgress

### 5. TrainingProgress (`training_progress.py`)
Farmer's training progress and completion status.

**Fields:**
- `progress_id` (PK) - Auto-incrementing primary key
- `farmer_id` (FK) - Reference to FarmerProfile
- `training_id` (FK) - Reference to TrainingContent
- `status` - Not Started, In Progress, Completed
- `score` - Optional quiz result
- `completion_percentage` - Progress percentage (0.0 to 100.0)
- `last_accessed` - Last access timestamp
- `started_at` - When training was started
- `completed_at` - When training was completed

**Relationships:**
- Many-to-one with FarmerProfile
- Many-to-one with TrainingContent

**Constraints:**
- Unique constraint on (farmer_id, training_id) to prevent duplicate progress records

## Usage

### Importing Models
```python
from models.farmers import (
    FarmerProfile,
    HerbBatch,
    Payment,
    TrainingContent,
    TrainingProgress
)
```

### Creating Records
```python
# Create a farmer
farmer = FarmerProfile.from_dict({
    'name': 'John Doe',
    'phone_number': '+1234567890',
    'password_hash': 'hashed_password',
    'language_preference': 'en',
    'address': 'Village, District, State',
    'land_area': 5.5,
    'farming_type': 'organic'
})
db.session.add(farmer)
db.session.commit()
```

### Querying Records
```python
# Get farmer by phone number
farmer = FarmerProfile.query.filter_by(phone_number='+1234567890').first()

# Get all active batches for a farmer
active_batches = HerbBatch.query.filter_by(
    farmer_id=farmer.farmer_id,
    status='Registered'
).all()

# Get farmer's total earnings
total_earnings = db.session.query(
    db.func.sum(Payment.amount)
).filter_by(
    farmer_id=farmer.farmer_id,
    status='Completed'
).scalar()
```

## Database Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Initialize database:
```bash
python init_db.py
```

3. For production, set environment variables:
```bash
export DATABASE_URL="postgresql://user:pass@localhost/herbchain"
export SECRET_KEY="your-secret-key"
```

## Migration Commands

```bash
# Initialize migrations
flask db init

# Create migration
flask db migrate -m "Initial migration"

# Apply migration
flask db upgrade
```
