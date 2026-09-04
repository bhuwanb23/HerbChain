# HerbChain — ER Diagram (Redesigned Schema)

Source of truth: `prisma/schema/` (15 files, 57 models). This file renders the
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
    USER o|--o{ SHIPMENT : "assigned transporter"
    SHIPMENT ||--o{ SHIPMENT_TRACKING : "GPS breadcrumbs"

    WAREHOUSE {
        string id PK
        string owner_user_id FK
        string kind
    }
    SHIPMENT {
        string id PK
        string shipment_no UK
        string ref_type
        string status
        string requested_by_user_id FK
        string assigned_transporter_user_id FK
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

    BATCH ||--o{ LAB_REPORT : "test runs"
    USER ||--o{ LAB_REPORT : "lab"
    LAB_REPORT ||--o{ LAB_TEST_RESULT : "one per parameter"
    TEST_PARAMETER ||--o{ LAB_TEST_RESULT : "vocabulary"

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
    LAB_REPORT {
        string id PK
        string code UK
        string batch_id FK
        string outcome
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
