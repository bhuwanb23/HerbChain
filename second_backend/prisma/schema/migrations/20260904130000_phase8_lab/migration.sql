/*
  Warnings:

  - You are about to drop the `lab_reports` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lab_test_results` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN "lab_role" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "lab_reports";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "lab_test_results";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "lab_receipts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_id" TEXT NOT NULL,
    "lab_user_id" TEXT NOT NULL,
    "receiver_name" TEXT,
    "received_quantity_kg" REAL,
    "condition_status" TEXT NOT NULL DEFAULT 'good',
    "received_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lab_receipts_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sample_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sample_code" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "lab_user_id" TEXT NOT NULL,
    "sample_weight_kg" REAL,
    "collected_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sample_records_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lab_tests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_id" TEXT NOT NULL,
    "sample_id" TEXT NOT NULL,
    "lab_user_id" TEXT NOT NULL,
    "test_name" TEXT NOT NULL,
    "test_category" TEXT NOT NULL,
    "test_method" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "outcome" TEXT,
    "started_at" DATETIME,
    "completed_at" DATETIME,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "lab_tests_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lab_tests_sample_id_fkey" FOREIGN KEY ("sample_id") REFERENCES "sample_records" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "test_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "test_id" TEXT NOT NULL,
    "parameter_id" TEXT NOT NULL,
    "observed_value_numeric" REAL,
    "observed_text" TEXT,
    "unit" TEXT,
    "acceptable_range" TEXT,
    "result" TEXT NOT NULL DEFAULT 'na',
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "test_results_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "lab_tests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "test_results_parameter_id_fkey" FOREIGN KEY ("parameter_id") REFERENCES "test_parameters" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lab_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "test_id" TEXT NOT NULL,
    "reviewed_by_user_id" TEXT NOT NULL,
    "reviewer_role" TEXT NOT NULL,
    "review_status" TEXT NOT NULL,
    "review_notes" TEXT,
    "reviewed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lab_reviews_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "lab_tests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lab_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_id" TEXT NOT NULL,
    "test_id" TEXT,
    "document_type" TEXT NOT NULL,
    "document_url" TEXT,
    "document_asset_id" TEXT,
    "uploaded_by_user_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lab_documents_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "species_verification_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_id" TEXT NOT NULL,
    "farmer_species_id" TEXT NOT NULL,
    "farmer_species" TEXT NOT NULL,
    "ai_prediction_id" TEXT,
    "ai_prediction_code" TEXT,
    "lab_species_id" TEXT NOT NULL,
    "lab_species" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "verified_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "species_verification_logs_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "certificate_number" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "lab_user_id" TEXT NOT NULL,
    "lab_code" TEXT,
    "lab_name" TEXT,
    "species_id" TEXT NOT NULL,
    "species_code" TEXT NOT NULL,
    "sample_count" INTEGER NOT NULL DEFAULT 0,
    "test_count" INTEGER NOT NULL DEFAULT 0,
    "parameter_count" INTEGER NOT NULL DEFAULT 0,
    "pass_count" INTEGER NOT NULL DEFAULT 0,
    "fail_count" INTEGER NOT NULL DEFAULT 0,
    "test_summary_json" JSONB,
    "certificate_url" TEXT,
    "certificate_hash" TEXT NOT NULL,
    "issued_by_user_id" TEXT NOT NULL,
    "signed_by_user_id" TEXT,
    "digital_signature" TEXT,
    "issued_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiry_date" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "certifications_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "certifications_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "species" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rejection_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "action" TEXT NOT NULL DEFAULT 'hold_for_investigation',
    "rejected_by_user_id" TEXT NOT NULL,
    "rejected_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rejection_records_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "lab_receipts_batch_id_key" ON "lab_receipts"("batch_id");

-- CreateIndex
CREATE INDEX "lab_receipts_lab_user_id_idx" ON "lab_receipts"("lab_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sample_records_sample_code_key" ON "sample_records"("sample_code");

-- CreateIndex
CREATE INDEX "sample_records_batch_id_idx" ON "sample_records"("batch_id");

-- CreateIndex
CREATE INDEX "sample_records_lab_user_id_idx" ON "sample_records"("lab_user_id");

-- CreateIndex
CREATE INDEX "lab_tests_batch_id_status_idx" ON "lab_tests"("batch_id", "status");

-- CreateIndex
CREATE INDEX "lab_tests_sample_id_idx" ON "lab_tests"("sample_id");

-- CreateIndex
CREATE INDEX "lab_tests_lab_user_id_idx" ON "lab_tests"("lab_user_id");

-- CreateIndex
CREATE INDEX "test_results_parameter_id_idx" ON "test_results"("parameter_id");

-- CreateIndex
CREATE UNIQUE INDEX "test_results_test_id_parameter_id_key" ON "test_results"("test_id", "parameter_id");

-- CreateIndex
CREATE INDEX "lab_reviews_test_id_reviewed_at_idx" ON "lab_reviews"("test_id", "reviewed_at");

-- CreateIndex
CREATE INDEX "lab_reviews_reviewed_by_user_id_idx" ON "lab_reviews"("reviewed_by_user_id");

-- CreateIndex
CREATE INDEX "lab_documents_batch_id_idx" ON "lab_documents"("batch_id");

-- CreateIndex
CREATE INDEX "lab_documents_test_id_idx" ON "lab_documents"("test_id");

-- CreateIndex
CREATE INDEX "species_verification_logs_batch_id_idx" ON "species_verification_logs"("batch_id");

-- CreateIndex
CREATE INDEX "species_verification_logs_status_idx" ON "species_verification_logs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "certifications_certificate_number_key" ON "certifications"("certificate_number");

-- CreateIndex
CREATE UNIQUE INDEX "certifications_batch_id_key" ON "certifications"("batch_id");

-- CreateIndex
CREATE INDEX "certifications_lab_user_id_idx" ON "certifications"("lab_user_id");

-- CreateIndex
CREATE INDEX "certifications_issued_at_idx" ON "certifications"("issued_at");

-- CreateIndex
CREATE UNIQUE INDEX "rejection_records_batch_id_key" ON "rejection_records"("batch_id");

-- CreateIndex
CREATE INDEX "rejection_records_reason_idx" ON "rejection_records"("reason");

-- CreateIndex
CREATE INDEX "rejection_records_rejected_by_user_id_idx" ON "rejection_records"("rejected_by_user_id");
