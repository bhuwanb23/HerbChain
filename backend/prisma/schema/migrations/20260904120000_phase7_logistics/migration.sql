-- AlterTable
ALTER TABLE "shipment_tracking" ADD COLUMN "accuracy_m" REAL;
ALTER TABLE "shipment_tracking" ADD COLUMN "speed_kph" REAL;

-- CreateTable
CREATE TABLE "transporter_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipment_id" TEXT NOT NULL,
    "transporter_user_id" TEXT NOT NULL,
    "assigned_by_user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "assigned_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" DATETIME,
    "decline_reason" TEXT,
    CONSTRAINT "transporter_assignments_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pickup_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipment_id" TEXT NOT NULL,
    "transporter_user_id" TEXT NOT NULL,
    "pickup_lat" REAL,
    "pickup_lng" REAL,
    "accuracy_m" REAL,
    "photo_url" TEXT,
    "photo_asset_id" TEXT,
    "remarks" TEXT,
    "pickup_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pickup_events_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "delivery_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipment_id" TEXT NOT NULL,
    "receiver_user_id" TEXT NOT NULL,
    "receiver_role" TEXT NOT NULL,
    "delivery_lat" REAL,
    "delivery_lng" REAL,
    "accuracy_m" REAL,
    "remarks" TEXT,
    "delivered_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "delivery_events_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "proof_of_deliveries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipment_id" TEXT NOT NULL,
    "receiver_name" TEXT,
    "receiver_signature" TEXT,
    "receiver_photo_url" TEXT,
    "delivery_photo_url" TEXT,
    "remarks" TEXT,
    "uploaded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaded_by_user_id" TEXT,
    CONSTRAINT "proof_of_deliveries_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "shipment_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipment_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_data" JSONB,
    "created_by_user_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "shipment_events_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "shipment_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipment_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "document_url" TEXT,
    "document_asset_id" TEXT,
    "uploaded_by_user_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "shipment_documents_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "shipment_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipment_id" TEXT NOT NULL,
    "expected_hours" REAL,
    "actual_hours" REAL,
    "delay_minutes" INTEGER,
    "delay_reason" TEXT,
    "computed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "shipment_metrics_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "failed_delivery_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipment_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "photo_url" TEXT,
    "photo_asset_id" TEXT,
    "remarks" TEXT,
    "created_by_user_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "failed_delivery_logs_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    CONSTRAINT "shipments_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_shipments" ("actual_pickup_at", "assigned_transporter_user_id", "created_at", "delivered_at", "destination_gps_lat", "destination_gps_lng", "destination_location", "id", "notes", "origin_gps_lat", "origin_gps_lng", "origin_location", "quantity_kg", "quantity_units", "ref_id", "ref_type", "requested_by_user_id", "scheduled_pickup_at", "shipment_no", "status", "updated_at") SELECT "actual_pickup_at", "assigned_transporter_user_id", "created_at", "delivered_at", "destination_gps_lat", "destination_gps_lng", "destination_location", "id", "notes", "origin_gps_lat", "origin_gps_lng", "origin_location", "quantity_kg", "quantity_units", "ref_id", "ref_type", "requested_by_user_id", "scheduled_pickup_at", "shipment_no", "status", "updated_at" FROM "shipments";
DROP TABLE "shipments";
ALTER TABLE "new_shipments" RENAME TO "shipments";
CREATE UNIQUE INDEX "shipments_shipment_no_key" ON "shipments"("shipment_no");
CREATE INDEX "shipments_ref_type_ref_id_idx" ON "shipments"("ref_type", "ref_id");
CREATE INDEX "shipments_assigned_transporter_user_id_status_idx" ON "shipments"("assigned_transporter_user_id", "status");
CREATE INDEX "shipments_status_idx" ON "shipments"("status");
CREATE INDEX "shipments_requested_by_user_id_idx" ON "shipments"("requested_by_user_id");
CREATE INDEX "shipments_created_at_idx" ON "shipments"("created_at");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "transporter_assignments_shipment_id_status_idx" ON "transporter_assignments"("shipment_id", "status");

-- CreateIndex
CREATE INDEX "transporter_assignments_transporter_user_id_status_idx" ON "transporter_assignments"("transporter_user_id", "status");

-- CreateIndex
CREATE INDEX "pickup_events_shipment_id_idx" ON "pickup_events"("shipment_id");

-- CreateIndex
CREATE INDEX "delivery_events_shipment_id_idx" ON "delivery_events"("shipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "proof_of_deliveries_shipment_id_key" ON "proof_of_deliveries"("shipment_id");

-- CreateIndex
CREATE INDEX "shipment_events_shipment_id_created_at_idx" ON "shipment_events"("shipment_id", "created_at");

-- CreateIndex
CREATE INDEX "shipment_documents_shipment_id_idx" ON "shipment_documents"("shipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "shipment_metrics_shipment_id_key" ON "shipment_metrics"("shipment_id");

-- CreateIndex
CREATE INDEX "failed_delivery_logs_shipment_id_idx" ON "failed_delivery_logs"("shipment_id");
