-- CreateTable
CREATE TABLE "qr_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "token_cipher" TEXT NOT NULL,
    "token_prefix" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "owner_user_id" TEXT NOT NULL,
    "owner_role" TEXT NOT NULL,
    "generated_by_user_id" TEXT NOT NULL,
    "generated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activated_at" DATETIME,
    "deactivated_at" DATETIME,
    "expiry_at" DATETIME NOT NULL,
    "deactivation_reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "qr_tokens_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "qr_tokens_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "qr_tokens_generated_by_user_id_fkey" FOREIGN KEY ("generated_by_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "qr_replacement_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_id" TEXT NOT NULL,
    "old_token_id" TEXT,
    "new_token_id" TEXT,
    "old_version" INTEGER,
    "new_version" INTEGER,
    "reason" TEXT NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "qr_replacement_logs_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "qr_replacement_logs_old_token_id_fkey" FOREIGN KEY ("old_token_id") REFERENCES "qr_tokens" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "qr_replacement_logs_new_token_id_fkey" FOREIGN KEY ("new_token_id") REFERENCES "qr_tokens" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "qr_replacement_logs_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_batches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "farmer_id" TEXT NOT NULL,
    "species_id" TEXT NOT NULL,
    "plot_id" TEXT,
    "crop_plan_id" TEXT,
    "parent_batch_id" TEXT,
    "harvest_date" DATETIME,
    "location" TEXT,
    "gps_lat" REAL,
    "gps_lng" REAL,
    "gps_accuracy_m" REAL,
    "weight_kg" REAL NOT NULL,
    "cultivation_type" TEXT,
    "attributes_json" JSONB,
    "notes" TEXT,
    "phase" TEXT NOT NULL DEFAULT 'with_farmer',
    "current_holder_user_id" TEXT NOT NULL,
    "test_status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "batches_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "batches_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "species" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "batches_plot_id_fkey" FOREIGN KEY ("plot_id") REFERENCES "farm_plots" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "batches_crop_plan_id_fkey" FOREIGN KEY ("crop_plan_id") REFERENCES "crop_plans" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "batches_parent_batch_id_fkey" FOREIGN KEY ("parent_batch_id") REFERENCES "batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "batches_current_holder_user_id_fkey" FOREIGN KEY ("current_holder_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_batches" ("attributes_json", "code", "created_at", "crop_plan_id", "cultivation_type", "current_holder_user_id", "farmer_id", "gps_accuracy_m", "gps_lat", "gps_lng", "harvest_date", "id", "location", "notes", "parent_batch_id", "phase", "plot_id", "species_id", "test_status", "updated_at", "weight_kg") SELECT "attributes_json", "code", "created_at", "crop_plan_id", "cultivation_type", "current_holder_user_id", "farmer_id", "gps_accuracy_m", "gps_lat", "gps_lng", "harvest_date", "id", "location", "notes", "parent_batch_id", "phase", "plot_id", "species_id", "test_status", "updated_at", "weight_kg" FROM "batches";
DROP TABLE "batches";
ALTER TABLE "new_batches" RENAME TO "batches";
CREATE UNIQUE INDEX "batches_code_key" ON "batches"("code");
CREATE INDEX "batches_code_idx" ON "batches"("code");
CREATE INDEX "batches_farmer_id_idx" ON "batches"("farmer_id");
CREATE INDEX "batches_species_id_idx" ON "batches"("species_id");
CREATE INDEX "batches_phase_idx" ON "batches"("phase");
CREATE INDEX "batches_current_holder_user_id_idx" ON "batches"("current_holder_user_id");
CREATE INDEX "batches_parent_batch_id_idx" ON "batches"("parent_batch_id");
CREATE INDEX "batches_created_at_idx" ON "batches"("created_at");
CREATE TABLE "new_qr_scan_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
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
INSERT INTO "new_qr_scan_logs" ("actor_user_id", "created_at", "device_id", "failure_reason", "gps_lat", "gps_lng", "id", "ip_address", "location", "outcome", "purpose", "target_id", "target_type") SELECT "actor_user_id", "created_at", "device_id", "failure_reason", "gps_lat", "gps_lng", "id", "ip_address", "location", "outcome", "purpose", "target_id", "target_type" FROM "qr_scan_logs";
DROP TABLE "qr_scan_logs";
ALTER TABLE "new_qr_scan_logs" RENAME TO "qr_scan_logs";
CREATE INDEX "qr_scan_logs_target_type_target_id_created_at_idx" ON "qr_scan_logs"("target_type", "target_id", "created_at");
CREATE INDEX "qr_scan_logs_purpose_created_at_idx" ON "qr_scan_logs"("purpose", "created_at");
CREATE INDEX "qr_scan_logs_outcome_idx" ON "qr_scan_logs"("outcome");
CREATE INDEX "qr_scan_logs_actor_user_id_idx" ON "qr_scan_logs"("actor_user_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "qr_tokens_token_hash_key" ON "qr_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "qr_tokens_batch_id_status_idx" ON "qr_tokens"("batch_id", "status");

-- CreateIndex
CREATE INDEX "qr_tokens_owner_user_id_idx" ON "qr_tokens"("owner_user_id");

-- CreateIndex
CREATE INDEX "qr_tokens_status_expiry_at_idx" ON "qr_tokens"("status", "expiry_at");

-- CreateIndex
CREATE UNIQUE INDEX "qr_tokens_batch_id_version_key" ON "qr_tokens"("batch_id", "version");

-- CreateIndex
CREATE INDEX "qr_replacement_logs_batch_id_created_at_idx" ON "qr_replacement_logs"("batch_id", "created_at");


-- Phase 5 "One Active QR Per Batch" rule enforced at the DB level.
CREATE UNIQUE INDEX "qr_tokens_one_active_per_batch" ON "qr_tokens"("batch_id") WHERE "status" = 'active';
