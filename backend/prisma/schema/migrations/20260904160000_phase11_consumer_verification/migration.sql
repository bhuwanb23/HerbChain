-- CreateTable
CREATE TABLE "consumer_scans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token_hash" TEXT NOT NULL,
    "product_id" TEXT,
    "lot_id" TEXT,
    "outcome" TEXT NOT NULL DEFAULT 'INVALID',
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "device_type" TEXT NOT NULL DEFAULT 'unknown',
    "ip_address" TEXT,
    "user_agent" TEXT,
    "scanned_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "consumer_scans_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "consumer_scans_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "product_lots" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "counterfeit_alerts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token_hash" TEXT NOT NULL,
    "product_id" TEXT,
    "lot_id" TEXT,
    "reason" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "detail_json" JSONB,
    "detected_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_by_user_id" TEXT,
    "resolved_at" DATETIME,
    "resolution_note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "counterfeit_alerts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "counterfeit_alerts_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "product_lots" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_verification_cache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token_hash" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "lot_id" TEXT NOT NULL,
    "verification_status" TEXT NOT NULL,
    "passport_json" JSONB NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "product_verification_cache_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "manufacturer_user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'other',
    "pack_size" TEXT,
    "expiry_months" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "verification_status" TEXT NOT NULL DEFAULT 'unverified',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "products_manufacturer_user_id_fkey" FOREIGN KEY ("manufacturer_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_products" ("category", "code", "created_at", "deleted_at", "description", "expiry_months", "id", "manufacturer_user_id", "name", "pack_size", "sku", "status", "updated_at") SELECT "category", "code", "created_at", "deleted_at", "description", "expiry_months", "id", "manufacturer_user_id", "name", "pack_size", "sku", "status", "updated_at" FROM "products";
DROP TABLE "products";
ALTER TABLE "new_products" RENAME TO "products";
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");
CREATE INDEX "products_manufacturer_user_id_idx" ON "products"("manufacturer_user_id");
CREATE INDEX "products_status_idx" ON "products"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "consumer_scans_product_id_scanned_at_idx" ON "consumer_scans"("product_id", "scanned_at");

-- CreateIndex
CREATE INDEX "consumer_scans_token_hash_scanned_at_idx" ON "consumer_scans"("token_hash", "scanned_at");

-- CreateIndex
CREATE INDEX "consumer_scans_state_scanned_at_idx" ON "consumer_scans"("state", "scanned_at");

-- CreateIndex
CREATE INDEX "consumer_scans_device_type_idx" ON "consumer_scans"("device_type");

-- CreateIndex
CREATE INDEX "consumer_scans_outcome_scanned_at_idx" ON "consumer_scans"("outcome", "scanned_at");

-- CreateIndex
CREATE INDEX "counterfeit_alerts_product_id_status_idx" ON "counterfeit_alerts"("product_id", "status");

-- CreateIndex
CREATE INDEX "counterfeit_alerts_token_hash_status_idx" ON "counterfeit_alerts"("token_hash", "status");

-- CreateIndex
CREATE INDEX "counterfeit_alerts_status_severity_idx" ON "counterfeit_alerts"("status", "severity");

-- CreateIndex
CREATE INDEX "counterfeit_alerts_reason_detected_at_idx" ON "counterfeit_alerts"("reason", "detected_at");

-- CreateIndex
CREATE UNIQUE INDEX "product_verification_cache_token_hash_key" ON "product_verification_cache"("token_hash");

-- CreateIndex
CREATE INDEX "product_verification_cache_product_id_idx" ON "product_verification_cache"("product_id");

-- CreateIndex
CREATE INDEX "product_verification_cache_expires_at_idx" ON "product_verification_cache"("expires_at");
