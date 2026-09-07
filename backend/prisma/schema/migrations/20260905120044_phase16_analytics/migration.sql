-- CreateTable
CREATE TABLE "herb_production_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period_type" TEXT NOT NULL,
    "period_start" DATETIME NOT NULL,
    "period_end" DATETIME NOT NULL,
    "herb_id" TEXT NOT NULL,
    "herb_code" TEXT NOT NULL,
    "herb_name" TEXT NOT NULL,
    "total_batches" INTEGER NOT NULL DEFAULT 0,
    "total_quantity_kg" REAL NOT NULL DEFAULT 0,
    "active_farmers" INTEGER NOT NULL DEFAULT 0,
    "certified_batches" INTEGER NOT NULL DEFAULT 0,
    "rejected_batches" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "certification_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period_type" TEXT NOT NULL,
    "period_start" DATETIME NOT NULL,
    "period_end" DATETIME NOT NULL,
    "lab_user_id" TEXT,
    "lab_name" TEXT,
    "total_tests" INTEGER NOT NULL DEFAULT 0,
    "pass_count" INTEGER NOT NULL DEFAULT 0,
    "fail_count" INTEGER NOT NULL DEFAULT 0,
    "certificates_issued" INTEGER NOT NULL DEFAULT 0,
    "rejections" INTEGER NOT NULL DEFAULT 0,
    "avg_testing_days" REAL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "failure_reason_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period_type" TEXT NOT NULL,
    "period_start" DATETIME NOT NULL,
    "period_end" DATETIME NOT NULL,
    "reason" TEXT NOT NULL,
    "state" TEXT,
    "district" TEXT,
    "count" INTEGER NOT NULL DEFAULT 0,
    "percentage" REAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "regional_supply_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period_type" TEXT NOT NULL,
    "period_start" DATETIME NOT NULL,
    "period_end" DATETIME NOT NULL,
    "state" TEXT NOT NULL,
    "district" TEXT,
    "herb_id" TEXT NOT NULL,
    "herb_name" TEXT NOT NULL,
    "production_kg" REAL NOT NULL DEFAULT 0,
    "total_batches" INTEGER NOT NULL DEFAULT 0,
    "certified_batches" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "logistics_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period_type" TEXT NOT NULL,
    "period_start" DATETIME NOT NULL,
    "period_end" DATETIME NOT NULL,
    "transporter_user_id" TEXT,
    "total_shipments" INTEGER NOT NULL DEFAULT 0,
    "delivered" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "on_time" INTEGER NOT NULL DEFAULT 0,
    "delayed" INTEGER NOT NULL DEFAULT 0,
    "avg_transit_hours" REAL DEFAULT 0,
    "avg_delay_minutes" INTEGER DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "manufacturer_consumption_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period_type" TEXT NOT NULL,
    "period_start" DATETIME NOT NULL,
    "period_end" DATETIME NOT NULL,
    "manufacturer_user_id" TEXT NOT NULL,
    "herb_id" TEXT NOT NULL,
    "herb_name" TEXT NOT NULL,
    "consumed_kg" REAL NOT NULL DEFAULT 0,
    "runs_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "consumer_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period_type" TEXT NOT NULL,
    "period_start" DATETIME NOT NULL,
    "period_end" DATETIME NOT NULL,
    "product_id" TEXT,
    "product_name" TEXT,
    "state" TEXT,
    "scan_count" INTEGER NOT NULL DEFAULT 0,
    "unique_tokens" INTEGER NOT NULL DEFAULT 0,
    "valid_scans" INTEGER NOT NULL DEFAULT 0,
    "invalid_scans" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "traceability_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period_type" TEXT NOT NULL,
    "period_start" DATETIME NOT NULL,
    "period_end" DATETIME NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "traceable_products" INTEGER NOT NULL DEFAULT 0,
    "total_products" INTEGER NOT NULL DEFAULT 0,
    "avg_score" REAL NOT NULL DEFAULT 0,
    "fully_traceable_pct" REAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "compliance_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period_type" TEXT NOT NULL,
    "period_start" DATETIME NOT NULL,
    "period_end" DATETIME NOT NULL,
    "actor_type" TEXT NOT NULL,
    "avg_score" REAL DEFAULT 0,
    "alerts_total" INTEGER NOT NULL DEFAULT 0,
    "alerts_open" INTEGER NOT NULL DEFAULT 0,
    "alerts_critical" INTEGER NOT NULL DEFAULT 0,
    "investigations" INTEGER NOT NULL DEFAULT 0,
    "counterfeit_alerts" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "blockchain_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period_type" TEXT NOT NULL,
    "period_start" DATETIME NOT NULL,
    "period_end" DATETIME NOT NULL,
    "event_type" TEXT NOT NULL,
    "events_count" INTEGER NOT NULL DEFAULT 0,
    "verified_checks" INTEGER NOT NULL DEFAULT 0,
    "tampered_checks" INTEGER NOT NULL DEFAULT 0,
    "failed_syncs" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "scheduled_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "report_name" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'daily',
    "params_json" JSONB,
    "recipients_json" JSONB,
    "recipients_role" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_run_at" DATETIME,
    "next_run_at" DATETIME NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "analytics_job_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "job_name" TEXT NOT NULL,
    "period_type" TEXT NOT NULL,
    "rows_written" INTEGER NOT NULL DEFAULT 0,
    "duration_ms" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'success',
    "error_message" TEXT,
    "ran_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "herb_production_analytics_period_type_period_start_idx" ON "herb_production_analytics"("period_type", "period_start");

-- CreateIndex
CREATE INDEX "herb_production_analytics_herb_id_idx" ON "herb_production_analytics"("herb_id");

-- CreateIndex
CREATE UNIQUE INDEX "herb_production_analytics_period_type_period_start_herb_id_key" ON "herb_production_analytics"("period_type", "period_start", "herb_id");

-- CreateIndex
CREATE INDEX "certification_analytics_period_type_period_start_idx" ON "certification_analytics"("period_type", "period_start");

-- CreateIndex
CREATE INDEX "certification_analytics_lab_user_id_idx" ON "certification_analytics"("lab_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "certification_analytics_period_type_period_start_lab_user_id_key" ON "certification_analytics"("period_type", "period_start", "lab_user_id");

-- CreateIndex
CREATE INDEX "failure_reason_analytics_period_type_period_start_idx" ON "failure_reason_analytics"("period_type", "period_start");

-- CreateIndex
CREATE INDEX "failure_reason_analytics_reason_idx" ON "failure_reason_analytics"("reason");

-- CreateIndex
CREATE UNIQUE INDEX "failure_reason_analytics_period_type_period_start_reason_state_district_key" ON "failure_reason_analytics"("period_type", "period_start", "reason", "state", "district");

-- CreateIndex
CREATE INDEX "regional_supply_analytics_period_type_period_start_idx" ON "regional_supply_analytics"("period_type", "period_start");

-- CreateIndex
CREATE INDEX "regional_supply_analytics_state_idx" ON "regional_supply_analytics"("state");

-- CreateIndex
CREATE UNIQUE INDEX "regional_supply_analytics_period_type_period_start_state_district_herb_id_key" ON "regional_supply_analytics"("period_type", "period_start", "state", "district", "herb_id");

-- CreateIndex
CREATE INDEX "logistics_analytics_period_type_period_start_idx" ON "logistics_analytics"("period_type", "period_start");

-- CreateIndex
CREATE INDEX "logistics_analytics_transporter_user_id_idx" ON "logistics_analytics"("transporter_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "logistics_analytics_period_type_period_start_transporter_user_id_key" ON "logistics_analytics"("period_type", "period_start", "transporter_user_id");

-- CreateIndex
CREATE INDEX "manufacturer_consumption_analytics_period_type_period_start_idx" ON "manufacturer_consumption_analytics"("period_type", "period_start");

-- CreateIndex
CREATE INDEX "manufacturer_consumption_analytics_manufacturer_user_id_idx" ON "manufacturer_consumption_analytics"("manufacturer_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturer_consumption_analytics_period_type_period_start_manufacturer_user_id_herb_id_key" ON "manufacturer_consumption_analytics"("period_type", "period_start", "manufacturer_user_id", "herb_id");

-- CreateIndex
CREATE INDEX "consumer_analytics_period_type_period_start_idx" ON "consumer_analytics"("period_type", "period_start");

-- CreateIndex
CREATE INDEX "consumer_analytics_product_id_idx" ON "consumer_analytics"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "consumer_analytics_period_type_period_start_product_id_state_key" ON "consumer_analytics"("period_type", "period_start", "product_id", "state");

-- CreateIndex
CREATE INDEX "traceability_analytics_period_type_period_start_idx" ON "traceability_analytics"("period_type", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "traceability_analytics_period_type_period_start_product_id_key" ON "traceability_analytics"("period_type", "period_start", "product_id");

-- CreateIndex
CREATE INDEX "compliance_analytics_period_type_period_start_idx" ON "compliance_analytics"("period_type", "period_start");

-- CreateIndex
CREATE INDEX "compliance_analytics_actor_type_idx" ON "compliance_analytics"("actor_type");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_analytics_period_type_period_start_actor_type_key" ON "compliance_analytics"("period_type", "period_start", "actor_type");

-- CreateIndex
CREATE INDEX "blockchain_analytics_period_type_period_start_idx" ON "blockchain_analytics"("period_type", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_analytics_period_type_period_start_event_type_key" ON "blockchain_analytics"("period_type", "period_start", "event_type");

-- CreateIndex
CREATE INDEX "scheduled_reports_is_active_next_run_at_idx" ON "scheduled_reports"("is_active", "next_run_at");

-- CreateIndex
CREATE INDEX "scheduled_reports_report_type_idx" ON "scheduled_reports"("report_type");

-- CreateIndex
CREATE INDEX "analytics_job_runs_job_name_ran_at_idx" ON "analytics_job_runs"("job_name", "ran_at");

-- CreateIndex
CREATE INDEX "analytics_job_runs_ran_at_idx" ON "analytics_job_runs"("ran_at");
