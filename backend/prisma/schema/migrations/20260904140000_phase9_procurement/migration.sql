-- CreateTable
CREATE TABLE "batch_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "request_no" TEXT NOT NULL,
    "manufacturer_user_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "requested_quantity_kg" REAL NOT NULL,
    "approved_quantity_kg" REAL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "decision_note" TEXT,
    "decided_by_user_id" TEXT,
    "requested_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "batch_requests_manufacturer_user_id_fkey" FOREIGN KEY ("manufacturer_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "batch_requests_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "batch_inventories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_id" TEXT NOT NULL,
    "total_quantity_kg" REAL NOT NULL,
    "available_quantity_kg" REAL NOT NULL DEFAULT 0,
    "reserved_quantity_kg" REAL NOT NULL DEFAULT 0,
    "consumed_quantity_kg" REAL NOT NULL DEFAULT 0,
    "updated_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "batch_inventories_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inventory_allocations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "allocated_quantity_kg" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'reserved',
    "allocated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" DATETIME,
    CONSTRAINT "inventory_allocations_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "inventory_allocations_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "batch_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "goods_receipts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grn_number" TEXT NOT NULL,
    "manufacturer_user_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "shipment_id" TEXT,
    "request_id" TEXT,
    "received_quantity_kg" REAL NOT NULL,
    "accepted_quantity_kg" REAL NOT NULL,
    "rejected_quantity_kg" REAL NOT NULL DEFAULT 0,
    "rejection_reason" TEXT,
    "received_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "goods_receipts_manufacturer_user_id_fkey" FOREIGN KEY ("manufacturer_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "goods_receipts_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "goods_receipts_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "goods_receipts_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "batch_requests" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "manufacturer_user_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "available_quantity_kg" REAL NOT NULL DEFAULT 0,
    "reserved_quantity_kg" REAL NOT NULL DEFAULT 0,
    "consumed_quantity_kg" REAL NOT NULL DEFAULT 0,
    "discarded_quantity_kg" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "inventory_items_manufacturer_user_id_fkey" FOREIGN KEY ("manufacturer_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "inventory_items_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inventory_id" TEXT NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "quantity_kg" REAL NOT NULL,
    "reference_id" TEXT,
    "notes" TEXT,
    "created_by_user_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_transactions_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventory_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quality_holds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_id" TEXT NOT NULL,
    "manufacturer_user_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_by_user_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" DATETIME,
    "resolution_note" TEXT,
    CONSTRAINT "quality_holds_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "quality_holds_manufacturer_user_id_fkey" FOREIGN KEY ("manufacturer_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_shipments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipment_no" TEXT NOT NULL,
    "ref_type" TEXT NOT NULL,
    "ref_id" TEXT NOT NULL,
    "shipment_type" TEXT NOT NULL DEFAULT 'CUSTOM',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "requested_by_user_id" TEXT NOT NULL,
    "from_user_id" TEXT,
    "from_role" TEXT,
    "to_user_id" TEXT,
    "to_role" TEXT,
    "assigned_transporter_user_id" TEXT,
    "procurement_request_id" TEXT,
    "origin_location" TEXT,
    "origin_gps_lat" REAL,
    "origin_gps_lng" REAL,
    "destination_location" TEXT,
    "destination_gps_lat" REAL,
    "destination_gps_lng" REAL,
    "geofence_radius_m" REAL DEFAULT 100,
    "quantity_kg" REAL,
    "quantity_units" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "scheduled_pickup_at" DATETIME,
    "expected_delivery_at" DATETIME,
    "actual_pickup_at" DATETIME,
    "arrived_destination_at" DATETIME,
    "delivered_at" DATETIME,
    "failure_reason" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "shipments_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "shipments_assigned_transporter_user_id_fkey" FOREIGN KEY ("assigned_transporter_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "shipments_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "shipments_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "shipments_procurement_request_id_fkey" FOREIGN KEY ("procurement_request_id") REFERENCES "batch_requests" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_shipments" ("actual_pickup_at", "arrived_destination_at", "assigned_transporter_user_id", "created_at", "delivered_at", "destination_gps_lat", "destination_gps_lng", "destination_location", "expected_delivery_at", "failure_reason", "from_role", "from_user_id", "geofence_radius_m", "id", "notes", "origin_gps_lat", "origin_gps_lng", "origin_location", "priority", "quantity_kg", "quantity_units", "ref_id", "ref_type", "requested_by_user_id", "scheduled_pickup_at", "shipment_no", "shipment_type", "status", "to_role", "to_user_id", "updated_at") SELECT "actual_pickup_at", "arrived_destination_at", "assigned_transporter_user_id", "created_at", "delivered_at", "destination_gps_lat", "destination_gps_lng", "destination_location", "expected_delivery_at", "failure_reason", "from_role", "from_user_id", "geofence_radius_m", "id", "notes", "origin_gps_lat", "origin_gps_lng", "origin_location", "priority", "quantity_kg", "quantity_units", "ref_id", "ref_type", "requested_by_user_id", "scheduled_pickup_at", "shipment_no", "shipment_type", "status", "to_role", "to_user_id", "updated_at" FROM "shipments";
DROP TABLE "shipments";
ALTER TABLE "new_shipments" RENAME TO "shipments";
CREATE UNIQUE INDEX "shipments_shipment_no_key" ON "shipments"("shipment_no");
CREATE UNIQUE INDEX "shipments_procurement_request_id_key" ON "shipments"("procurement_request_id");
CREATE INDEX "shipments_ref_type_ref_id_idx" ON "shipments"("ref_type", "ref_id");
CREATE INDEX "shipments_assigned_transporter_user_id_status_idx" ON "shipments"("assigned_transporter_user_id", "status");
CREATE INDEX "shipments_status_idx" ON "shipments"("status");
CREATE INDEX "shipments_requested_by_user_id_idx" ON "shipments"("requested_by_user_id");
CREATE INDEX "shipments_procurement_request_id_idx" ON "shipments"("procurement_request_id");
CREATE INDEX "shipments_created_at_idx" ON "shipments"("created_at");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "batch_requests_request_no_key" ON "batch_requests"("request_no");

-- CreateIndex
CREATE INDEX "batch_requests_manufacturer_user_id_status_idx" ON "batch_requests"("manufacturer_user_id", "status");

-- CreateIndex
CREATE INDEX "batch_requests_batch_id_status_idx" ON "batch_requests"("batch_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "batch_inventories_batch_id_key" ON "batch_inventories"("batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_allocations_request_id_key" ON "inventory_allocations"("request_id");

-- CreateIndex
CREATE INDEX "inventory_allocations_batch_id_status_idx" ON "inventory_allocations"("batch_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "goods_receipts_grn_number_key" ON "goods_receipts"("grn_number");

-- CreateIndex
CREATE INDEX "goods_receipts_manufacturer_user_id_idx" ON "goods_receipts"("manufacturer_user_id");

-- CreateIndex
CREATE INDEX "goods_receipts_batch_id_idx" ON "goods_receipts"("batch_id");

-- CreateIndex
CREATE INDEX "inventory_items_manufacturer_user_id_idx" ON "inventory_items"("manufacturer_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_manufacturer_user_id_batch_id_key" ON "inventory_items"("manufacturer_user_id", "batch_id");

-- CreateIndex
CREATE INDEX "inventory_transactions_inventory_id_created_at_idx" ON "inventory_transactions"("inventory_id", "created_at");

-- CreateIndex
CREATE INDEX "inventory_transactions_transaction_type_idx" ON "inventory_transactions"("transaction_type");

-- CreateIndex
CREATE INDEX "quality_holds_manufacturer_user_id_status_idx" ON "quality_holds"("manufacturer_user_id", "status");

-- CreateIndex
CREATE INDEX "quality_holds_batch_id_idx" ON "quality_holds"("batch_id");
