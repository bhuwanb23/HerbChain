-- AlterTable
ALTER TABLE "assets" ADD COLUMN "filename" TEXT;
ALTER TABLE "assets" ADD COLUMN "metadata_json" JSONB;

-- AlterTable
ALTER TABLE "batches" ADD COLUMN "attributes_json" JSONB;
ALTER TABLE "batches" ADD COLUMN "cultivation_type" TEXT;
ALTER TABLE "batches" ADD COLUMN "gps_accuracy_m" REAL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_entity_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "asset_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "doc_kind" TEXT NOT NULL DEFAULT 'attachment',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_by_user_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "entity_documents_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_entity_documents" ("asset_id", "created_at", "created_by_user_id", "doc_kind", "entity_id", "entity_type", "id") SELECT "asset_id", "created_at", "created_by_user_id", "doc_kind", "entity_id", "entity_type", "id" FROM "entity_documents";
DROP TABLE "entity_documents";
ALTER TABLE "new_entity_documents" RENAME TO "entity_documents";
CREATE INDEX "entity_documents_entity_type_entity_id_idx" ON "entity_documents"("entity_type", "entity_id");
CREATE INDEX "entity_documents_asset_id_idx" ON "entity_documents"("asset_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

