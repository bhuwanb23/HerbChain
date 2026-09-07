-- AlterTable
ALTER TABLE "addresses" ADD COLUMN "district" TEXT;

-- AlterTable
ALTER TABLE "distributor_profiles" ADD COLUMN "distributor_code" TEXT;

-- AlterTable
ALTER TABLE "retailer_profiles" ADD COLUMN "retailer_code" TEXT;

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipment_no" TEXT NOT NULL,
    "ref_type" TEXT NOT NULL,
    "ref_id" TEXT NOT NULL,
    "requested_by_user_id" TEXT NOT NULL,
    "assigned_transporter_user_id" TEXT,
    "origin_location" TEXT,
    "origin_gps_lat" REAL,
    "origin_gps_lng" REAL,
    "destination_location" TEXT,
    "destination_gps_lat" REAL,
    "destination_gps_lng" REAL,
    "quantity_kg" REAL,
    "quantity_units" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "scheduled_pickup_at" DATETIME,
    "actual_pickup_at" DATETIME,
    "delivered_at" DATETIME,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "shipments_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "shipments_assigned_transporter_user_id_fkey" FOREIGN KEY ("assigned_transporter_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "shipment_tracking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipment_id" TEXT NOT NULL,
    "gps_lat" REAL NOT NULL,
    "gps_lng" REAL NOT NULL,
    "captured_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "captured_by_user_id" TEXT,
    "note" TEXT,
    CONSTRAINT "shipment_tracking_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "qr_scan_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'custody_transfer',
    "actor_user_id" TEXT,
    "device_id" TEXT,
    "ip_address" TEXT,
    "location" TEXT,
    "gps_lat" REAL,
    "gps_lng" REAL,
    "outcome" TEXT NOT NULL,
    "failure_reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "blockchain_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "anchor_code" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "chain" TEXT NOT NULL DEFAULT 'polygon',
    "tx_hash" TEXT,
    "block_number" INTEGER,
    "block_time" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "recorded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_farmer_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmer_id" TEXT NOT NULL,
    "farmer_code" TEXT,
    "farm_name" TEXT,
    "established_year" INTEGER,
    "land_size_acres" REAL,
    "soil_type" TEXT,
    "irrigation_type" TEXT,
    "farming_practices" TEXT,
    "organic_certified" BOOLEAN NOT NULL DEFAULT false,
    "default_address_id" TEXT,
    "gps_lat" REAL,
    "gps_lng" REAL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "farmer_profiles_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_farmer_profiles" ("created_at", "default_address_id", "established_year", "farm_name", "farmer_id", "farming_practices", "gps_lat", "gps_lng", "id", "irrigation_type", "land_size_acres", "notes", "soil_type", "updated_at") SELECT "created_at", "default_address_id", "established_year", "farm_name", "farmer_id", "farming_practices", "gps_lat", "gps_lng", "id", "irrigation_type", "land_size_acres", "notes", "soil_type", "updated_at" FROM "farmer_profiles";
DROP TABLE "farmer_profiles";
ALTER TABLE "new_farmer_profiles" RENAME TO "farmer_profiles";
CREATE UNIQUE INDEX "farmer_profiles_farmer_id_key" ON "farmer_profiles"("farmer_id");
CREATE UNIQUE INDEX "farmer_profiles_farmer_code_key" ON "farmer_profiles"("farmer_code");
CREATE TABLE "new_lab_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lab_id" TEXT NOT NULL,
    "lab_code" TEXT,
    "lab_name" TEXT,
    "nabl_accredited" BOOLEAN NOT NULL DEFAULT false,
    "accreditation_no" TEXT,
    "address_id" TEXT,
    "verification_status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "lab_profiles_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_lab_profiles" ("accreditation_no", "address_id", "created_at", "id", "lab_id", "lab_name", "nabl_accredited", "updated_at") SELECT "accreditation_no", "address_id", "created_at", "id", "lab_id", "lab_name", "nabl_accredited", "updated_at" FROM "lab_profiles";
DROP TABLE "lab_profiles";
ALTER TABLE "new_lab_profiles" RENAME TO "lab_profiles";
CREATE UNIQUE INDEX "lab_profiles_lab_id_key" ON "lab_profiles"("lab_id");
CREATE UNIQUE INDEX "lab_profiles_lab_code_key" ON "lab_profiles"("lab_code");
CREATE TABLE "new_manufacturer_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "manufacturer_id" TEXT NOT NULL,
    "manufacturer_code" TEXT,
    "company_name" TEXT,
    "gstin" TEXT,
    "ayush_license_no" TEXT,
    "facility_city" TEXT,
    "verification_status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "manufacturer_profiles_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_manufacturer_profiles" ("ayush_license_no", "company_name", "created_at", "facility_city", "gstin", "id", "manufacturer_id", "updated_at") SELECT "ayush_license_no", "company_name", "created_at", "facility_city", "gstin", "id", "manufacturer_id", "updated_at" FROM "manufacturer_profiles";
DROP TABLE "manufacturer_profiles";
ALTER TABLE "new_manufacturer_profiles" RENAME TO "manufacturer_profiles";
CREATE UNIQUE INDEX "manufacturer_profiles_manufacturer_id_key" ON "manufacturer_profiles"("manufacturer_id");
CREATE UNIQUE INDEX "manufacturer_profiles_manufacturer_code_key" ON "manufacturer_profiles"("manufacturer_code");
CREATE TABLE "new_transporter_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transporter_id" TEXT NOT NULL,
    "transporter_code" TEXT,
    "company_name" TEXT,
    "registration_no" TEXT,
    "fleet_summary" TEXT,
    "vehicle_number" TEXT,
    "vehicle_type" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "serviceable_regions" TEXT,
    "insurance_valid_until" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "transporter_profiles_transporter_id_fkey" FOREIGN KEY ("transporter_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_transporter_profiles" ("company_name", "created_at", "fleet_summary", "id", "insurance_valid_until", "registration_no", "serviceable_regions", "transporter_id", "updated_at") SELECT "company_name", "created_at", "fleet_summary", "id", "insurance_valid_until", "registration_no", "serviceable_regions", "transporter_id", "updated_at" FROM "transporter_profiles";
DROP TABLE "transporter_profiles";
ALTER TABLE "new_transporter_profiles" RENAME TO "transporter_profiles";
CREATE UNIQUE INDEX "transporter_profiles_transporter_id_key" ON "transporter_profiles"("transporter_id");
CREATE UNIQUE INDEX "transporter_profiles_transporter_code_key" ON "transporter_profiles"("transporter_code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "shipments_shipment_no_key" ON "shipments"("shipment_no");

-- CreateIndex
CREATE INDEX "shipments_ref_type_ref_id_idx" ON "shipments"("ref_type", "ref_id");

-- CreateIndex
CREATE INDEX "shipments_assigned_transporter_user_id_status_idx" ON "shipments"("assigned_transporter_user_id", "status");

-- CreateIndex
CREATE INDEX "shipments_status_idx" ON "shipments"("status");

-- CreateIndex
CREATE INDEX "shipments_created_at_idx" ON "shipments"("created_at");

-- CreateIndex
CREATE INDEX "shipment_tracking_shipment_id_captured_at_idx" ON "shipment_tracking"("shipment_id", "captured_at");

-- CreateIndex
CREATE INDEX "qr_scan_logs_target_type_target_id_created_at_idx" ON "qr_scan_logs"("target_type", "target_id", "created_at");

-- CreateIndex
CREATE INDEX "qr_scan_logs_purpose_created_at_idx" ON "qr_scan_logs"("purpose", "created_at");

-- CreateIndex
CREATE INDEX "qr_scan_logs_outcome_idx" ON "qr_scan_logs"("outcome");

-- CreateIndex
CREATE INDEX "qr_scan_logs_actor_user_id_idx" ON "qr_scan_logs"("actor_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_events_tx_hash_key" ON "blockchain_events"("tx_hash");

-- CreateIndex
CREATE INDEX "blockchain_events_entity_type_entity_id_idx" ON "blockchain_events"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "blockchain_events_status_idx" ON "blockchain_events"("status");

-- CreateIndex
CREATE INDEX "blockchain_events_recorded_at_idx" ON "blockchain_events"("recorded_at");

-- CreateIndex
CREATE UNIQUE INDEX "distributor_profiles_distributor_code_key" ON "distributor_profiles"("distributor_code");

-- CreateIndex
CREATE UNIQUE INDEX "retailer_profiles_retailer_code_key" ON "retailer_profiles"("retailer_code");

