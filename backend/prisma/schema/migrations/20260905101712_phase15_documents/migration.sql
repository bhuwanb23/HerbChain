-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "document_no" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "file_name" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "public_url" TEXT,
    "file_type" TEXT NOT NULL DEFAULT 'image',
    "mime_type" TEXT,
    "file_size" INTEGER NOT NULL,
    "checksum_sha256" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'RESTRICTED',
    "status" TEXT NOT NULL DEFAULT 'validated',
    "uploaded_by_user_id" TEXT NOT NULL,
    "uploaded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" DATETIME,
    "deleted_at" DATETIME
);

-- CreateTable
CREATE TABLE "document_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "document_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "checksum_sha256" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "uploaded_by_user_id" TEXT NOT NULL,
    "uploaded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "document_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "document_access_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "document_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "ip_address" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "document_access_logs_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "document_shares" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "document_id" TEXT NOT NULL,
    "share_code" TEXT NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "expires_at" DATETIME,
    "revoked_at" DATETIME,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "document_shares_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "document_retention_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "retention_months" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "certificate_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "certificate_number" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "certificate_hash" TEXT,
    "issued_by_user_id" TEXT,
    "issued_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "certificate_documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "storage_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "document_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "payload_json" JSONB,
    "last_error" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "completed_at" DATETIME,
    CONSTRAINT "storage_jobs_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "documents_document_no_key" ON "documents"("document_no");

-- CreateIndex
CREATE INDEX "documents_category_status_idx" ON "documents"("category", "status");

-- CreateIndex
CREATE INDEX "documents_entity_type_entity_id_idx" ON "documents"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "documents_uploaded_by_user_id_idx" ON "documents"("uploaded_by_user_id");

-- CreateIndex
CREATE INDEX "documents_uploaded_at_idx" ON "documents"("uploaded_at");

-- CreateIndex
CREATE UNIQUE INDEX "document_versions_document_id_version_key" ON "document_versions"("document_id", "version");

-- CreateIndex
CREATE INDEX "document_access_logs_document_id_created_at_idx" ON "document_access_logs"("document_id", "created_at");

-- CreateIndex
CREATE INDEX "document_access_logs_user_id_idx" ON "document_access_logs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_shares_share_code_key" ON "document_shares"("share_code");

-- CreateIndex
CREATE INDEX "document_shares_document_id_idx" ON "document_shares"("document_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_retention_rules_category_key" ON "document_retention_rules"("category");

-- CreateIndex
CREATE INDEX "certificate_documents_certificate_number_idx" ON "certificate_documents"("certificate_number");

-- CreateIndex
CREATE INDEX "certificate_documents_document_id_idx" ON "certificate_documents"("document_id");

-- CreateIndex
CREATE INDEX "storage_jobs_status_created_at_idx" ON "storage_jobs"("status", "created_at");

-- CreateIndex
CREATE INDEX "storage_jobs_kind_idx" ON "storage_jobs"("kind");
