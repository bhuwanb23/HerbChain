/*
  Warnings:

  - You are about to drop the `blockchain_events` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "blockchain_events";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "blockchain_event_queue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "anchor_code" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "payload_json" JSONB,
    "performed_by_user_id" TEXT,
    "chain" TEXT NOT NULL DEFAULT 'herbchain',
    "tx_hash" TEXT,
    "block_number" INTEGER,
    "block_time" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 5,
    "next_attempt_at" DATETIME,
    "last_error" TEXT,
    "processed_at" DATETIME,
    "recorded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "blockchain_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_id" TEXT NOT NULL,
    "transaction_hash" TEXT NOT NULL,
    "block_number" INTEGER NOT NULL,
    "prev_hash" TEXT,
    "event_type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "performed_by" TEXT,
    "chain" TEXT NOT NULL DEFAULT 'herbchain',
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "confirmed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blockchain_transactions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "blockchain_event_queue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "blockchain_nodes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "node_code" TEXT NOT NULL,
    "org_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "endpoint" TEXT,
    "role" TEXT NOT NULL DEFAULT 'validator',
    "status" TEXT NOT NULL DEFAULT 'active',
    "last_seen_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "smart_contract_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contract_name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT,
    "functions_json" JSONB,
    "rules_json" JSONB,
    "deployed_by_user_id" TEXT,
    "deployed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "blockchain_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_id" TEXT,
    "action" TEXT NOT NULL,
    "actor" TEXT,
    "detail_json" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_event_queue_tx_hash_key" ON "blockchain_event_queue"("tx_hash");

-- CreateIndex
CREATE INDEX "blockchain_event_queue_entity_type_entity_id_idx" ON "blockchain_event_queue"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "blockchain_event_queue_anchor_code_status_idx" ON "blockchain_event_queue"("anchor_code", "status");

-- CreateIndex
CREATE INDEX "blockchain_event_queue_status_next_attempt_at_idx" ON "blockchain_event_queue"("status", "next_attempt_at");

-- CreateIndex
CREATE INDEX "blockchain_event_queue_recorded_at_idx" ON "blockchain_event_queue"("recorded_at");

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_transactions_event_id_key" ON "blockchain_transactions"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_transactions_transaction_hash_key" ON "blockchain_transactions"("transaction_hash");

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_transactions_block_number_key" ON "blockchain_transactions"("block_number");

-- CreateIndex
CREATE INDEX "blockchain_transactions_entity_type_entity_id_idx" ON "blockchain_transactions"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "blockchain_transactions_event_type_idx" ON "blockchain_transactions"("event_type");

-- CreateIndex
CREATE INDEX "blockchain_transactions_block_number_idx" ON "blockchain_transactions"("block_number");

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_nodes_node_code_key" ON "blockchain_nodes"("node_code");

-- CreateIndex
CREATE INDEX "blockchain_nodes_org_type_idx" ON "blockchain_nodes"("org_type");

-- CreateIndex
CREATE INDEX "blockchain_nodes_status_idx" ON "blockchain_nodes"("status");

-- CreateIndex
CREATE INDEX "smart_contract_versions_contract_name_is_active_idx" ON "smart_contract_versions"("contract_name", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "smart_contract_versions_contract_name_version_key" ON "smart_contract_versions"("contract_name", "version");

-- CreateIndex
CREATE INDEX "blockchain_audit_logs_event_id_idx" ON "blockchain_audit_logs"("event_id");

-- CreateIndex
CREATE INDEX "blockchain_audit_logs_action_created_at_idx" ON "blockchain_audit_logs"("action", "created_at");
