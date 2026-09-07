-- AlterTable
ALTER TABLE "users" ADD COLUMN "admin_role" TEXT;

-- CreateTable
CREATE TABLE "compliance_alerts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alert_no" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "detail_json" JSONB,
    "created_by_user_id" TEXT,
    "resolved_by_user_id" TEXT,
    "resolved_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "investigation_cases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "case_no" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "case_type" TEXT NOT NULL DEFAULT 'complaint',
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'open',
    "summary" TEXT,
    "assigned_to_user_id" TEXT,
    "created_by_user_id" TEXT NOT NULL,
    "opened_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "investigation_entities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "case_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'subject',
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "investigation_entities_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "investigation_cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "compliance_scores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "grade" TEXT NOT NULL DEFAULT 'B',
    "factors_json" JSONB NOT NULL,
    "computed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "admin_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notification_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "recipient_user_id" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "report_exports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "report_type" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'csv',
    "title" TEXT NOT NULL,
    "params_json" JSONB,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "file_url" TEXT,
    "row_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "requested_by_user_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "compliance_alerts_alert_no_key" ON "compliance_alerts"("alert_no");

-- CreateIndex
CREATE INDEX "compliance_alerts_status_idx" ON "compliance_alerts"("status");

-- CreateIndex
CREATE INDEX "compliance_alerts_severity_idx" ON "compliance_alerts"("severity");

-- CreateIndex
CREATE INDEX "compliance_alerts_alert_type_idx" ON "compliance_alerts"("alert_type");

-- CreateIndex
CREATE INDEX "compliance_alerts_entity_type_entity_id_idx" ON "compliance_alerts"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "compliance_alerts_created_at_idx" ON "compliance_alerts"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "investigation_cases_case_no_key" ON "investigation_cases"("case_no");

-- CreateIndex
CREATE INDEX "investigation_cases_status_idx" ON "investigation_cases"("status");

-- CreateIndex
CREATE INDEX "investigation_cases_case_type_idx" ON "investigation_cases"("case_type");

-- CreateIndex
CREATE INDEX "investigation_cases_assigned_to_user_id_idx" ON "investigation_cases"("assigned_to_user_id");

-- CreateIndex
CREATE INDEX "investigation_entities_entity_type_entity_id_idx" ON "investigation_entities"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "investigation_entities_case_id_entity_type_entity_id_key" ON "investigation_entities"("case_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "compliance_scores_entity_type_score_idx" ON "compliance_scores"("entity_type", "score");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_scores_entity_type_entity_id_key" ON "compliance_scores"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "admin_notifications_recipient_user_id_idx" ON "admin_notifications"("recipient_user_id");

-- CreateIndex
CREATE INDEX "admin_notifications_is_read_idx" ON "admin_notifications"("is_read");

-- CreateIndex
CREATE INDEX "admin_notifications_created_at_idx" ON "admin_notifications"("created_at");

-- CreateIndex
CREATE INDEX "report_exports_status_idx" ON "report_exports"("status");

-- CreateIndex
CREATE INDEX "report_exports_report_type_idx" ON "report_exports"("report_type");

-- CreateIndex
CREATE INDEX "report_exports_requested_by_user_id_idx" ON "report_exports"("requested_by_user_id");
