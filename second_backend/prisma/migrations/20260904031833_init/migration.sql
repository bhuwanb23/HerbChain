-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "location" TEXT,
    "gps_lat" REAL,
    "gps_lng" REAL,
    "language_pref" TEXT NOT NULL DEFAULT 'en',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "kyc_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "herb_catalogue" (
    "species_id" TEXT NOT NULL PRIMARY KEY,
    "common_name" TEXT NOT NULL,
    "scientific_name" TEXT NOT NULL,
    "ayush_category" TEXT NOT NULL DEFAULT 'ayurveda',
    "synonyms" JSONB NOT NULL,
    "description" TEXT,
    "medicinal_uses" TEXT,
    "image_url" TEXT,
    "season_planting" TEXT,
    "season_harvest" TEXT,
    "default_unit_price_inr" REAL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "price_quotes" (
    "quote_id" TEXT NOT NULL PRIMARY KEY,
    "species_id" TEXT NOT NULL,
    "price_per_kg_inr" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "source" TEXT NOT NULL DEFAULT 'admin',
    "effective_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_admin_id" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "price_quotes_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "herb_catalogue" ("species_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "price_quotes_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "herbs" (
    "batch_id" TEXT NOT NULL PRIMARY KEY,
    "farmer_id" TEXT NOT NULL,
    "species_id" TEXT,
    "species_name" TEXT NOT NULL,
    "image_url" TEXT,
    "harvest_date" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "gps_lat" REAL,
    "gps_lng" REAL,
    "weight_kg" REAL NOT NULL,
    "notes" TEXT,
    "parent_batch_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "herbs_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "herbs_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "herb_catalogue" ("species_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "herbs_parent_batch_id_fkey" FOREIGN KEY ("parent_batch_id") REFERENCES "herbs" ("batch_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "batch_states" (
    "batch_id" TEXT NOT NULL PRIMARY KEY,
    "current_holder_id" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "test_result" TEXT NOT NULL DEFAULT 'pending',
    "current_qr_token" TEXT NOT NULL DEFAULT '',
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "batch_states_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "herbs" ("batch_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "batch_states_current_holder_id_fkey" FOREIGN KEY ("current_holder_id") REFERENCES "users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "batch_events" (
    "event_id" TEXT NOT NULL PRIMARY KEY,
    "batch_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "from_party_id" TEXT,
    "to_party_id" TEXT,
    "phase_before" TEXT,
    "phase_after" TEXT,
    "location" TEXT,
    "gps_lat" REAL,
    "gps_lng" REAL,
    "payload_json" JSONB,
    "qr_token" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "batch_events_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "herbs" ("batch_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "batch_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "batch_events_from_party_id_fkey" FOREIGN KEY ("from_party_id") REFERENCES "users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "batch_events_to_party_id_fkey" FOREIGN KEY ("to_party_id") REFERENCES "users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lab_reports" (
    "report_id" TEXT NOT NULL PRIMARY KEY,
    "batch_id" TEXT NOT NULL,
    "lab_id" TEXT NOT NULL,
    "test_type" TEXT NOT NULL,
    "test_date" TEXT NOT NULL,
    "results_summary" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "certification_level" TEXT,
    "purity_percentage" REAL,
    "moisture_content" REAL,
    "ash_content" REAL,
    "heavy_metals_present" BOOLEAN,
    "pesticides_detected" BOOLEAN,
    "active_compounds" TEXT,
    "potency_rating" TEXT,
    "report_url" TEXT,
    "notes" TEXT,
    "recommendations" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "lab_reports_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "herbs" ("batch_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lab_reports_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "products" (
    "product_id" TEXT NOT NULL PRIMARY KEY,
    "manufacturer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "description" TEXT,
    "image_url" TEXT,
    "qr_token" TEXT NOT NULL DEFAULT '',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "products_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_batch_links" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "product_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "quantity_kg" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_batch_links_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("product_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_batch_links_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "herbs" ("batch_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "farm_profiles" (
    "farm_id" TEXT NOT NULL PRIMARY KEY,
    "farmer_id" TEXT NOT NULL,
    "farm_name" TEXT,
    "land_size_acres" REAL,
    "soil_type" TEXT,
    "irrigation_type" TEXT,
    "certifications" JSONB NOT NULL,
    "address" TEXT,
    "gps_lat" REAL,
    "gps_lng" REAL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "farm_profiles_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "crop_plans" (
    "plan_id" TEXT NOT NULL PRIMARY KEY,
    "farmer_id" TEXT NOT NULL,
    "species_id" TEXT NOT NULL,
    "area_acres" REAL,
    "planting_date" TEXT NOT NULL,
    "expected_harvest_date" TEXT NOT NULL,
    "actual_harvest_date" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "crop_plans_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "crop_plans_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "herb_catalogue" ("species_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "weather_snapshots" (
    "snapshot_id" TEXT NOT NULL PRIMARY KEY,
    "gps_lat" REAL NOT NULL,
    "gps_lng" REAL NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'openweathermap',
    "payload_json" JSONB NOT NULL,
    "fetched_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "herb_catalogue_common_name_idx" ON "herb_catalogue"("common_name");

-- CreateIndex
CREATE INDEX "herb_catalogue_scientific_name_idx" ON "herb_catalogue"("scientific_name");

-- CreateIndex
CREATE INDEX "price_quotes_species_id_idx" ON "price_quotes"("species_id");

-- CreateIndex
CREATE INDEX "price_quotes_effective_at_idx" ON "price_quotes"("effective_at");

-- CreateIndex
CREATE INDEX "herbs_farmer_id_idx" ON "herbs"("farmer_id");

-- CreateIndex
CREATE INDEX "herbs_species_id_idx" ON "herbs"("species_id");

-- CreateIndex
CREATE INDEX "herbs_parent_batch_id_idx" ON "herbs"("parent_batch_id");

-- CreateIndex
CREATE INDEX "batch_states_current_holder_id_idx" ON "batch_states"("current_holder_id");

-- CreateIndex
CREATE INDEX "batch_states_phase_idx" ON "batch_states"("phase");

-- CreateIndex
CREATE INDEX "batch_events_batch_id_idx" ON "batch_events"("batch_id");

-- CreateIndex
CREATE INDEX "batch_events_event_type_idx" ON "batch_events"("event_type");

-- CreateIndex
CREATE INDEX "batch_events_created_at_idx" ON "batch_events"("created_at");

-- CreateIndex
CREATE INDEX "lab_reports_batch_id_idx" ON "lab_reports"("batch_id");

-- CreateIndex
CREATE INDEX "products_manufacturer_id_idx" ON "products"("manufacturer_id");

-- CreateIndex
CREATE INDEX "products_sku_idx" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_batch_links_product_id_batch_id_key" ON "product_batch_links"("product_id", "batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "farm_profiles_farmer_id_key" ON "farm_profiles"("farmer_id");

-- CreateIndex
CREATE INDEX "crop_plans_farmer_id_idx" ON "crop_plans"("farmer_id");

-- CreateIndex
CREATE INDEX "crop_plans_species_id_idx" ON "crop_plans"("species_id");

-- CreateIndex
CREATE INDEX "crop_plans_status_idx" ON "crop_plans"("status");

-- CreateIndex
CREATE INDEX "weather_snapshots_gps_lat_idx" ON "weather_snapshots"("gps_lat");

-- CreateIndex
CREATE INDEX "weather_snapshots_gps_lng_idx" ON "weather_snapshots"("gps_lng");

-- CreateIndex
CREATE INDEX "weather_snapshots_fetched_at_idx" ON "weather_snapshots"("fetched_at");
