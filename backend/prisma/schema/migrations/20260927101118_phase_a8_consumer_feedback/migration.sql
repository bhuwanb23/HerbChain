-- CreateTable
CREATE TABLE "consumer_feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scan_id" TEXT,
    "product_id" TEXT,
    "batch_id" TEXT,
    "qr_token" TEXT,
    "type" TEXT NOT NULL DEFAULT 'feedback',
    "rating" INTEGER,
    "message" TEXT NOT NULL,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "admin_note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "consumer_feedback_type_status_idx" ON "consumer_feedback"("type", "status");

-- CreateIndex
CREATE INDEX "consumer_feedback_product_id_idx" ON "consumer_feedback"("product_id");

-- CreateIndex
CREATE INDEX "consumer_feedback_batch_id_idx" ON "consumer_feedback"("batch_id");

-- CreateIndex
CREATE INDEX "consumer_feedback_created_at_idx" ON "consumer_feedback"("created_at");
