/*
  Warnings:

  - You are about to drop the `product_lot_batch_links` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `qr_nonce` on the `product_lots` table. All the data in the column will be lost.
  - Added the required column `manufacturing_batch_id` to the `product_lots` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "product_lot_batch_links_lot_id_batch_id_key";

-- DropIndex
DROP INDEX "product_lot_batch_links_batch_id_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "product_lot_batch_links";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "product_formulas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL,
    "species_id" TEXT NOT NULL,
    "standard_quantity" REAL,
    "unit" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_formulas_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_formulas_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "species" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "manufacturing_batches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "manufacturer_user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "planned_units" INTEGER NOT NULL DEFAULT 0,
    "production_date" DATETIME,
    "completed_at" DATETIME,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "manufacturing_batches_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "manufacturing_batches_manufacturer_user_id_fkey" FOREIGN KEY ("manufacturer_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "manufacturing_batch_ingredients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "manufacturing_batch_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "inventory_item_id" TEXT NOT NULL,
    "quantity_kg" REAL NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "position" INTEGER NOT NULL DEFAULT 0,
    "state" TEXT NOT NULL DEFAULT 'reserved',
    "consumed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "manufacturing_batch_ingredients_manufacturing_batch_id_fkey" FOREIGN KEY ("manufacturing_batch_id") REFERENCES "manufacturing_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "manufacturing_batch_ingredients_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_qr_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL,
    "lot_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "token_cipher" TEXT NOT NULL,
    "token_prefix" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "minted_by_user_id" TEXT NOT NULL,
    "minted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" DATETIME,
    "revocation_reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_qr_tokens_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "product_lots" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_qr_tokens_minted_by_user_id_fkey" FOREIGN KEY ("minted_by_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_lineage_snapshots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL,
    "manufacturing_batch_id" TEXT NOT NULL,
    "lot_id" TEXT,
    "snapshot_json" JSONB NOT NULL,
    "generated_by_user_id" TEXT,
    "generated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_lineage_snapshots_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "affected_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "manufacturing_batch_id" TEXT NOT NULL,
    "lot_id" TEXT,
    "impact_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "notes" TEXT,
    "detected_by_user_id" TEXT,
    "detected_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "affected_products_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "affected_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_product_lots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "manufacturing_batch_id" TEXT NOT NULL,
    "quantity_units" INTEGER NOT NULL DEFAULT 0,
    "units_remaining" INTEGER NOT NULL DEFAULT 0,
    "phase" TEXT NOT NULL DEFAULT 'with_manufacturer',
    "current_holder_user_id" TEXT NOT NULL,
    "expiry_date" DATETIME,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "product_lots_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_lots_manufacturing_batch_id_fkey" FOREIGN KEY ("manufacturing_batch_id") REFERENCES "manufacturing_batches" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "product_lots_current_holder_user_id_fkey" FOREIGN KEY ("current_holder_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_product_lots" ("code", "created_at", "current_holder_user_id", "id", "notes", "phase", "product_id", "quantity_units", "units_remaining", "updated_at") SELECT "code", "created_at", "current_holder_user_id", "id", "notes", "phase", "product_id", "quantity_units", "units_remaining", "updated_at" FROM "product_lots";
DROP TABLE "product_lots";
ALTER TABLE "new_product_lots" RENAME TO "product_lots";
CREATE UNIQUE INDEX "product_lots_code_key" ON "product_lots"("code");
CREATE UNIQUE INDEX "product_lots_manufacturing_batch_id_key" ON "product_lots"("manufacturing_batch_id");
CREATE INDEX "product_lots_code_idx" ON "product_lots"("code");
CREATE INDEX "product_lots_product_id_idx" ON "product_lots"("product_id");
CREATE INDEX "product_lots_phase_idx" ON "product_lots"("phase");
CREATE INDEX "product_lots_current_holder_user_id_idx" ON "product_lots"("current_holder_user_id");
CREATE INDEX "product_lots_manufacturing_batch_id_idx" ON "product_lots"("manufacturing_batch_id");
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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "products_manufacturer_user_id_fkey" FOREIGN KEY ("manufacturer_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_products" ("code", "created_at", "deleted_at", "description", "id", "manufacturer_user_id", "name", "sku", "status", "updated_at") SELECT "code", "created_at", "deleted_at", "description", "id", "manufacturer_user_id", "name", "sku", "status", "updated_at" FROM "products";
DROP TABLE "products";
ALTER TABLE "new_products" RENAME TO "products";
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");
CREATE INDEX "products_manufacturer_user_id_idx" ON "products"("manufacturer_user_id");
CREATE INDEX "products_status_idx" ON "products"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "product_formulas_species_id_idx" ON "product_formulas"("species_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_formulas_product_id_species_id_key" ON "product_formulas"("product_id", "species_id");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturing_batches_code_key" ON "manufacturing_batches"("code");

-- CreateIndex
CREATE INDEX "manufacturing_batches_code_idx" ON "manufacturing_batches"("code");

-- CreateIndex
CREATE INDEX "manufacturing_batches_product_id_idx" ON "manufacturing_batches"("product_id");

-- CreateIndex
CREATE INDEX "manufacturing_batches_manufacturer_user_id_status_idx" ON "manufacturing_batches"("manufacturer_user_id", "status");

-- CreateIndex
CREATE INDEX "manufacturing_batches_status_idx" ON "manufacturing_batches"("status");

-- CreateIndex
CREATE INDEX "manufacturing_batch_ingredients_batch_id_idx" ON "manufacturing_batch_ingredients"("batch_id");

-- CreateIndex
CREATE INDEX "manufacturing_batch_ingredients_state_idx" ON "manufacturing_batch_ingredients"("state");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturing_batch_ingredients_manufacturing_batch_id_batch_id_key" ON "manufacturing_batch_ingredients"("manufacturing_batch_id", "batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_qr_tokens_lot_id_key" ON "product_qr_tokens"("lot_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_qr_tokens_token_hash_key" ON "product_qr_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "product_qr_tokens_product_id_idx" ON "product_qr_tokens"("product_id");

-- CreateIndex
CREATE INDEX "product_qr_tokens_status_idx" ON "product_qr_tokens"("status");

-- CreateIndex
CREATE INDEX "product_lineage_snapshots_product_id_generated_at_idx" ON "product_lineage_snapshots"("product_id", "generated_at");

-- CreateIndex
CREATE INDEX "product_lineage_snapshots_manufacturing_batch_id_idx" ON "product_lineage_snapshots"("manufacturing_batch_id");

-- CreateIndex
CREATE INDEX "affected_products_batch_id_idx" ON "affected_products"("batch_id");

-- CreateIndex
CREATE INDEX "affected_products_product_id_status_idx" ON "affected_products"("product_id", "status");

-- CreateIndex
CREATE INDEX "affected_products_status_idx" ON "affected_products"("status");
