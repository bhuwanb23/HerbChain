-- CreateTable
CREATE TABLE "device_registrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "device_name" TEXT,
    "app_version" TEXT,
    "last_sync_at" DATETIME,
    "revoked_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "device_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "device_id" TEXT,
    "items_total" INTEGER NOT NULL DEFAULT 0,
    "items_applied" INTEGER NOT NULL DEFAULT 0,
    "items_conflicted" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    "duration_ms" INTEGER,
    CONSTRAINT "sync_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sync_logs_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device_registrations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sync_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sync_log_id" TEXT NOT NULL,
    "queue_ref" TEXT,
    "entity_type" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "server_entity_id" TEXT,
    "conflict_id" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 9,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sync_events_sync_log_id_fkey" FOREIGN KEY ("sync_log_id") REFERENCES "sync_logs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sync_conflicts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sync_log_id" TEXT,
    "queue_ref" TEXT,
    "user_id" TEXT NOT NULL,
    "device_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "conflict_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "payload_json" JSONB,
    "resolution" TEXT,
    "resolution_note" TEXT,
    "resolved_by_user_id" TEXT,
    "resolved_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sync_conflicts_sync_log_id_fkey" FOREIGN KEY ("sync_log_id") REFERENCES "sync_logs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "device_registrations_user_id_idx" ON "device_registrations"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "device_registrations_user_id_device_id_key" ON "device_registrations"("user_id", "device_id");

-- CreateIndex
CREATE INDEX "sync_logs_user_id_started_at_idx" ON "sync_logs"("user_id", "started_at");

-- CreateIndex
CREATE INDEX "sync_events_sync_log_id_idx" ON "sync_events"("sync_log_id");

-- CreateIndex
CREATE INDEX "sync_events_entity_type_status_idx" ON "sync_events"("entity_type", "status");

-- CreateIndex
CREATE INDEX "sync_events_created_at_idx" ON "sync_events"("created_at");

-- CreateIndex
CREATE INDEX "sync_conflicts_user_id_resolved_at_idx" ON "sync_conflicts"("user_id", "resolved_at");

-- CreateIndex
CREATE INDEX "sync_conflicts_conflict_type_idx" ON "sync_conflicts"("conflict_type");
