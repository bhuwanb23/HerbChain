# HerbChain — ER Diagram (Redesigned Schema)

Source of truth: `prisma/schema/` (18 files, 80 models). This file renders the
same structure as Mermaid diagrams grouped by domain — the phase-1 "ER
Diagram" deliverable. Full conventions: `docs/database/architecture.md`.

Legend: `||` one, `o{` zero-or-many, `|{` exactly-one-many, `o|` zero-or-one.

Polymorphic references (plain columns, resolved in code — no FK/relation):
`EntityDocument.entity_*`, `StockMovement.ref_*`, `StockPosition.ref_*`,
`OrderItem.ref_*`, `Shipment.ref_*`, `QrScanLog.target_*`, `Recall.ref_*`,
`RecallScope.scope_*`, `Inspection.target_*`, `BlockchainEvent.entity_*`.

## 1. Identity & Security

```mermaid
erDiagram
    USER ||--o| FARMER_PROFILE : "1:1 (farmer)"
    USER ||--o| TRANSPORTER_PROFILE : "1:1 (transporter)"
    USER ||--o| LAB_PROFILE : "1:1 (lab)"
    USER ||--o| MANUFACTURER_PROFILE : "1:1 (manufacturer)"
    USER ||--o| DISTRIBUTOR_PROFILE : "1:1 (distributor)"
    USER ||--o| RETAILER_PROFILE : "1:1 (retailer)"
    USER ||--o{ ADDRESS : "owns"
    USER ||--o{ VERIFICATION_REQUEST : "subject"
    USER o|--o{ VERIFICATION_REQUEST : "reviewer"
    USER ||--o{ SESSION : "device sessions"
    USER ||--o{ PASSWORD_RESET_TOKEN : "reset tokens"
    USER ||--o{ API_KEY : "owns"
    USER ||--o{ AUDIT_LOG : "actor"
    USER ||--o{ ASSET : "owner"
    USER o|--o| ASSET : "avatar"
    PERMISSION ||--o{ ROLE_PERMISSION : "granted to roles"

    USER {
        string id PK
        string email UK
        string phone UK
        string role
        string kyc_status
        boolean is_active
        int failed_login_count
        datetime locked_until
        datetime deleted_at
    }
    SESSION {
        string id PK
        string user_id FK
        string refresh_token_hash UK
        string device_id
        datetime expires_at
        datetime revoked_at
    }
```

## 2. Catalogue & Agronomy

```mermaid
erDiagram
    SPECIES ||--o{ SPECIES_SYNONYM : ""
    SPECIES ||--o{ SPECIES_CONTENT : "per locale"
    SPECIES ||--o{ SPECIES_MEDICINAL_USE : ""
    MEDICINAL_USE ||--o{ SPECIES_MEDICINAL_USE : ""
    SPECIES ||--o{ BATCH : "harvested as"
    SPECIES ||--o{ CROP_PLAN : "planted as"
    SPECIES ||--o{ PRICE_QUOTE : "priced as"
    USER ||--o{ SPECIES : "curated by"

    FARMER_PROFILE ||--o{ FARM_PLOT : "has plots"
    FARM_PLOT ||--o{ CROP_PLAN : "planting cycles"
    USER ||--o{ CROP_PLAN : "farmer owns"
    SPECIES ||--o{ CROP_PLAN : ""
    CROP_PLAN ||--o{ FARM_ACTIVITY : "activity log"
    USER ||--o{ FARM_ACTIVITY : "actor"

    FARM_PLOT o|--o{ BATCH : "grown on plot"
    CROP_PLAN o|--o{ BATCH : "from crop plan"

    SPECIES {
        string id PK
        string code UK
        string common_name
        string scientific_name
    }
    FARMER_PROFILE {
        string id PK
        string farmer_id UK FK
        string farmer_code UK
        boolean organic_certified
    }
```

## 3. Logistics (transport, warehouses, stock, shipments)

```mermaid
erDiagram
    USER ||--o{ WAREHOUSE : "owner"
    WAREHOUSE ||--o{ STOCK_MOVEMENT : "ledger"
    WAREHOUSE ||--o{ STOCK_POSITION : "current state"
    USER ||--o{ STOCK_MOVEMENT : "actor"

    USER ||--o{ SHIPMENT : "requested_by"
    USER o|--o{ SHIPMENT : "origin / destination"
    USER o|--o{ SHIPMENT : "assigned transporter"
    SHIPMENT ||--o{ SHIPMENT_TRACKING : "GPS breadcrumbs"
    SHIPMENT ||--o{ TRANSPORTER_ASSIGNMENT : "one pending job"
    SHIPMENT ||--o{ PICKUP_EVENT : "evidence"
    SHIPMENT ||--o{ DELIVERY_EVENT : "receiver scans"
    SHIPMENT ||--o{ SHIPMENT_EVENT : "timeline"
    SHIPMENT ||--o{ SHIPMENT_DOCUMENT : "invoice / certs"
    SHIPMENT ||--o{ FAILED_DELIVERY_LOG : "why it failed"
    SHIPMENT |o--o| PROOF_OF_DELIVERY : "POD 1:1"
    SHIPMENT |o--o| SHIPMENT_METRIC : "expected vs actual"

    WAREHOUSE {
        string id PK
        string owner_user_id FK
        string kind
    }
    SHIPMENT {
        string id PK
        string shipment_no UK
        string ref_type
        string shipment_type
        string status
        string requested_by_user_id FK
        string from_user_id FK
        string to_user_id FK
        string assigned_transporter_user_id FK
        float geofence_radius_m
    }
    PICKUP_EVENT {
        string id PK
        string shipment_id FK
        float pickup_lat
        float pickup_lng
        string photo_url
        datetime pickup_time
    }
    DELIVERY_EVENT {
        string id PK
        string shipment_id FK
        string receiver_user_id FK
        string receiver_role
        float delivery_lat
        float delivery_lng
    }
    PROOF_OF_DELIVERY {
        string id PK
        string shipment_id FK UK
        string receiver_name
        string receiver_signature
        string receiver_photo_url
        string delivery_photo_url
        string remarks
    }
    SHIPMENT_EVENT {
        string id PK
        string shipment_id FK
        string event_type
        json event_data
        string created_by_user_id FK
        datetime created_at
    }
    SHIPMENT_METRIC {
        string id PK
        string shipment_id FK UK
        float expected_hours
        float actual_hours
        int delay_minutes
    }
```

## 4. Quality, Trace & the custody spine

```mermaid
erDiagram
    USER ||--o{ BATCH : "farmer created"
    USER ||--o{ BATCH : "current holder"
    SPECIES ||--o{ BATCH : ""
    BATCH ||--o{ BATCH_EVENT : "immutable timeline"
    USER ||--o{ BATCH_EVENT : "actor / from / to"

    BATCH |o--o| LAB_RECEIPT : "intake checklist"
    BATCH ||--o{ SAMPLE_RECORD : "samples drawn"
    SAMPLE_RECORD ||--o{ LAB_TEST : "test runs"
    LAB_TEST ||--o{ LAB_TEST_RESULT : "one per parameter"
    TEST_PARAMETER ||--o{ LAB_TEST_RESULT : "vocabulary"
    LAB_TEST ||--o{ LAB_REVIEW : "supervisor two-level review"
    BATCH ||--o{ LAB_DOCUMENT : "reports / COA PDFs"
    BATCH ||--o{ SPECIES_VERIFICATION_LOG : "farmer vs AI vs lab"
    BATCH |o--o| CERTIFICATION : "COA (sha256)"
    BATCH |o--o| REJECTION_RECORD : "why it failed"

    BATCH {
        string id PK
        string code UK
        string phase
        string test_status
        float weight_kg
        string current_holder_user_id FK
        string parent_batch_id FK
    }
    QR_TOKEN ||--o{ BATCH : "one ACTIVE per batch (51_qr)"
    QR_TOKEN ||--o{ USER : "owner"
    QR_TOKEN ||--o{ QR_REPLACEMENT_LOG : "old/new"
    BATCH ||--o{ TRANSFER_REQUEST : "governed handovers (52_transfer)"
    USER ||--o{ TRANSFER_REQUEST : "from (current holder at request)"
    USER ||--o{ TRANSFER_REQUEST : "to (receiver)"
    TRANSFER_REQUEST ||--o{ TRANSFER_PROOF : "handover evidence"
    TRANSFER_REQUEST }o--|| BATCH_EVENT : "completed by"
    TRANSFER_PROOF ||--o{ ASSET : "photo"
    BATCH_EVENT {
        string id PK
        string batch_id FK
        string event_type
        string actor_user_id FK
        datetime created_at
    }
    LAB_RECEIPT {
        string id PK
        string batch_id FK UK
        string condition_status
        float received_quantity_kg
    }
    SAMPLE_RECORD {
        string id PK
        string sample_code UK
        string batch_id FK
        float sample_weight_kg
    }
    LAB_TEST {
        string id PK
        string batch_id FK
        string sample_id FK
        string test_category
        string status
        string outcome
    }
    LAB_TEST_RESULT {
        string id PK
        string test_id FK
        string parameter_id FK
        float observed_value_numeric
        string result
    }
    LAB_REVIEW {
        string id PK
        string test_id FK
        string review_status
        string reviewed_by_user_id FK
    }
    CERTIFICATION {
        string id PK
        string certificate_number UK
        string batch_id FK UK
        string certificate_hash
        int pass_count
        string status
    }
    REJECTION_RECORD {
        string id PK
        string batch_id FK UK
        string reason
        string action
    }
```

## 5. Products, lots & commerce

```mermaid
erDiagram
    USER ||--o{ PRODUCT : "manufacturer"
    PRODUCT ||--o{ PRODUCT_LOT : "production runs"
    USER ||--o{ PRODUCT_LOT : "current holder"
    PRODUCT_LOT ||--o{ PRODUCT_LOT_EVENT : "custody + sale timeline"
    USER ||--o{ PRODUCT_LOT_EVENT : "actor / from / to"
    PRODUCT_LOT ||--o{ PRODUCT_LOT_BATCH_LINK : "composition"
    BATCH ||--o{ PRODUCT_LOT_BATCH_LINK : "source batches"

    USER ||--o{ PURCHASE_ORDER : "buyer"
    USER ||--o{ PURCHASE_ORDER : "seller"
    PURCHASE_ORDER ||--o{ ORDER_ITEM : "lines"
    PURCHASE_ORDER ||--o{ INVOICE : ""
    INVOICE ||--o{ PAYMENT : ""
    USER ||--o{ WALLET : "1:1"
    WALLET ||--o{ WALLET_TRANSACTION : "ledger"

    PRODUCT_LOT {
        string id PK
        string code UK
        string product_id FK
        int quantity_units
        int units_remaining
        string phase
        string current_holder_user_id FK
        int qr_nonce
    }
    PRODUCT_LOT_BATCH_LINK {
        string id PK
        string lot_id FK
        string batch_id FK
        float quantity_kg
    }
```

## 6. Compliance, notifications & intel

```mermaid
erDiagram
    USER ||--o{ LICENSE_CERT : "holder"
    USER ||--o{ INSPECTION : "inspector"
    RECALL ||--o{ RECALL_SCOPE : "lot-scoped targets"
    USER ||--o{ SUPPORT_TICKET : "requester / assignee"

    USER ||--o{ NOTIFICATION : "recipient"
    NOTIFICATION_TEMPLATE ||--o{ NOTIFICATION : ""
    USER ||--o{ DEVICE_TOKEN : "push targets"

    SPECIES ||--o{ PRICE_QUOTE : ""
    USER ||--o{ PRICE_QUOTE : "creator"
```

Standalone tables (no relations; polymorphic or event/feed rows):
`QrScanLog` (every QR scan — custody + consumer views), `WeatherSnapshot`
(cached provider payloads), `BlockchainEvent` (proof anchors for domain
events).
