-- CreateTable
CREATE TABLE "transfer_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_id" TEXT NOT NULL,
    "from_user_id" TEXT NOT NULL,
    "from_role" TEXT NOT NULL,
    "to_user_id" TEXT NOT NULL,
    "to_role" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "rejection_reason" TEXT,
    "created_by_user_id" TEXT NOT NULL,
    "approved_by_user_id" TEXT,
    "decided_at" DATETIME,
    "completed_at" DATETIME,
    "batch_event_id" TEXT,
    "payload_json" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "transfer_requests_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transfer_requests_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transfer_requests_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transfer_requests_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transfer_requests_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transfer_requests_batch_event_id_fkey" FOREIGN KEY ("batch_event_id") REFERENCES "batch_events" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transfer_proofs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transfer_request_id" TEXT NOT NULL,
    "ownership_history_id" TEXT,
    "asset_id" TEXT,
    "photo_url" TEXT,
    "sender_signature" TEXT,
    "receiver_signature" TEXT,
    "remarks" TEXT,
    "created_by_user_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transfer_proofs_transfer_request_id_fkey" FOREIGN KEY ("transfer_request_id") REFERENCES "transfer_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transfer_proofs_ownership_history_id_fkey" FOREIGN KEY ("ownership_history_id") REFERENCES "batch_events" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transfer_proofs_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transfer_proofs_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "transfer_requests_batch_event_id_key" ON "transfer_requests"("batch_event_id");

-- CreateIndex
CREATE INDEX "transfer_requests_batch_id_status_idx" ON "transfer_requests"("batch_id", "status");

-- CreateIndex
CREATE INDEX "transfer_requests_from_user_id_idx" ON "transfer_requests"("from_user_id");

-- CreateIndex
CREATE INDEX "transfer_requests_to_user_id_idx" ON "transfer_requests"("to_user_id");

-- CreateIndex
CREATE INDEX "transfer_requests_created_by_user_id_idx" ON "transfer_requests"("created_by_user_id");

-- CreateIndex
CREATE INDEX "transfer_proofs_transfer_request_id_idx" ON "transfer_proofs"("transfer_request_id");

