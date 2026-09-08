-- CreateTable
CREATE TABLE "ai_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "asset_id" TEXT,
    "provider" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "model_version" TEXT NOT NULL,
    "image_hash" TEXT,
    "response_time_ms" INTEGER,
    "http_status" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error_code" TEXT,
    "is_cached" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ai_requests_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "image_hashes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "image_hash" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "model_version" TEXT NOT NULL,
    "result_json" JSONB NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_hit_at" DATETIME
);

-- CreateTable
CREATE TABLE "ai_identifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "asset_id" TEXT,
    "request_id" TEXT,
    "image_hash" TEXT,
    "quality_json" JSONB,
    "predictions_json" JSONB NOT NULL,
    "top_species_id" TEXT,
    "confidence" REAL,
    "verdict" TEXT NOT NULL DEFAULT 'manual',
    "provider" TEXT,
    "model_name" TEXT,
    "model_version" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "accepted" BOOLEAN,
    "selected_species_id" TEXT,
    "mismatch" BOOLEAN,
    "rejected_reason" TEXT,
    "batch_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" DATETIME,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ai_identifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ai_identifications_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ai_identifications_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "ai_requests" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ai_identifications_top_species_id_fkey" FOREIGN KEY ("top_species_id") REFERENCES "species" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ai_identifications_selected_species_id_fkey" FOREIGN KEY ("selected_species_id") REFERENCES "species" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ai_identifications_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identification_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "predicted_species_id" TEXT,
    "lab_species_id" TEXT,
    "match" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_feedback_identification_id_fkey" FOREIGN KEY ("identification_id") REFERENCES "ai_identifications" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ai_feedback_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ai_feedback_predicted_species_id_fkey" FOREIGN KEY ("predicted_species_id") REFERENCES "species" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ai_feedback_lab_species_id_fkey" FOREIGN KEY ("lab_species_id") REFERENCES "species" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ai_requests_user_id_created_at_idx" ON "ai_requests"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_requests_provider_created_at_idx" ON "ai_requests"("provider", "created_at");

-- CreateIndex
CREATE INDEX "ai_requests_image_hash_idx" ON "ai_requests"("image_hash");

-- CreateIndex
CREATE INDEX "ai_requests_success_idx" ON "ai_requests"("success");

-- CreateIndex
CREATE INDEX "image_hashes_expires_at_idx" ON "image_hashes"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "image_hashes_image_hash_provider_model_name_model_version_key" ON "image_hashes"("image_hash", "provider", "model_name", "model_version");

-- CreateIndex
CREATE UNIQUE INDEX "ai_identifications_request_id_key" ON "ai_identifications"("request_id");

-- CreateIndex
CREATE INDEX "ai_identifications_user_id_created_at_idx" ON "ai_identifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_identifications_status_idx" ON "ai_identifications"("status");

-- CreateIndex
CREATE INDEX "ai_identifications_created_at_idx" ON "ai_identifications"("created_at");

-- CreateIndex
CREATE INDEX "ai_identifications_batch_id_idx" ON "ai_identifications"("batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_feedback_identification_id_key" ON "ai_feedback"("identification_id");

-- CreateIndex
CREATE INDEX "ai_feedback_batch_id_idx" ON "ai_feedback"("batch_id");

-- CreateIndex
CREATE INDEX "ai_feedback_match_idx" ON "ai_feedback"("match");

