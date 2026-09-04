-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "avatar_asset_id" TEXT,
    "email_verified_at" DATETIME,
    "phone_verified_at" DATETIME,
    "kyc_status" TEXT NOT NULL DEFAULT 'none',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "users_avatar_asset_id_fkey" FOREIGN KEY ("avatar_asset_id") REFERENCES "assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'registered',
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postal_code" TEXT,
    "country" TEXT NOT NULL DEFAULT 'IN',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "device_name" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" DATETIME,
    "expires_at" DATETIME NOT NULL,
    "revoked_at" DATETIME,
    CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "scopes" TEXT NOT NULL DEFAULT 'read',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" DATETIME,
    "expires_at" DATETIME,
    "revoked_at" DATETIME,
    CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actor_user_id" TEXT,
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "meta_json" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "owner_user_id" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'image',
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "storage_key" TEXT,
    "url" TEXT,
    "alt_text" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "assets_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "entity_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "asset_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "doc_kind" TEXT NOT NULL DEFAULT 'attachment',
    "created_by_user_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "entity_documents_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "species" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "common_name" TEXT NOT NULL,
    "scientific_name" TEXT NOT NULL,
    "family" TEXT,
    "genus" TEXT,
    "ayush_category" TEXT NOT NULL DEFAULT 'ayurveda',
    "image_asset_id" TEXT,
    "season_planting" TEXT,
    "season_harvest" TEXT,
    "default_unit_price_paise" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_user_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "species_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "species_synonyms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "species_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'hi',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "species_synonyms_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "species" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "species_content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "species_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "common_name_local" TEXT,
    "description" TEXT,
    "medicinal_uses_text" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "species_content_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "species" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "medicinal_uses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "species_medicinal_uses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "species_id" TEXT NOT NULL,
    "use_id" TEXT NOT NULL,
    CONSTRAINT "species_medicinal_uses_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "species" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "species_medicinal_uses_use_id_fkey" FOREIGN KEY ("use_id") REFERENCES "medicinal_uses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "farmer_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmer_id" TEXT NOT NULL,
    "farm_name" TEXT,
    "established_year" INTEGER,
    "land_size_acres" REAL,
    "soil_type" TEXT,
    "irrigation_type" TEXT,
    "farming_practices" TEXT,
    "default_address_id" TEXT,
    "gps_lat" REAL,
    "gps_lng" REAL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "farmer_profiles_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "farm_plots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profile_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "area_acres" REAL,
    "soil_type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "gps_lat" REAL,
    "gps_lng" REAL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "farm_plots_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "farmer_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "crop_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmer_id" TEXT NOT NULL,
    "species_id" TEXT NOT NULL,
    "plot_id" TEXT,
    "season_label" TEXT,
    "area_acres" REAL,
    "expected_yield_kg" REAL,
    "planting_date" DATETIME,
    "expected_harvest_date" DATETIME,
    "actual_harvest_date" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "crop_plans_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "crop_plans_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "species" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "crop_plans_plot_id_fkey" FOREIGN KEY ("plot_id") REFERENCES "farm_plots" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "farm_activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "crop_plan_id" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "performed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "inputs_json" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "farm_activities_crop_plan_id_fkey" FOREIGN KEY ("crop_plan_id") REFERENCES "crop_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "farm_activities_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transporter_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transporter_id" TEXT NOT NULL,
    "company_name" TEXT,
    "registration_no" TEXT,
    "fleet_summary" TEXT,
    "serviceable_regions" TEXT,
    "insurance_valid_until" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "transporter_profiles_transporter_id_fkey" FOREIGN KEY ("transporter_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "manufacturer_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "manufacturer_id" TEXT NOT NULL,
    "company_name" TEXT,
    "gstin" TEXT,
    "ayush_license_no" TEXT,
    "facility_city" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "manufacturer_profiles_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "distributor_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "distributor_id" TEXT NOT NULL,
    "company_name" TEXT,
    "gstin" TEXT,
    "region" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "distributor_profiles_distributor_id_fkey" FOREIGN KEY ("distributor_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "retailer_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "retailer_id" TEXT NOT NULL,
    "store_name" TEXT,
    "gstin" TEXT,
    "store_type" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "retailer_profiles_retailer_id_fkey" FOREIGN KEY ("retailer_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "owner_user_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'factory_godown',
    "name" TEXT NOT NULL,
    "address_id" TEXT,
    "gps_lat" REAL,
    "gps_lng" REAL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "warehouses_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "warehouse_id" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "ref_type" TEXT NOT NULL,
    "ref_id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "quantity_kg" REAL,
    "quantity_units" INTEGER,
    "reference_doc" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stock_movements_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "stock_movements_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stock_positions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "warehouse_id" TEXT NOT NULL,
    "ref_type" TEXT NOT NULL,
    "ref_id" TEXT NOT NULL,
    "quantity_kg" REAL NOT NULL DEFAULT 0,
    "quantity_units" INTEGER NOT NULL DEFAULT 0,
    "updated_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stock_positions_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lab_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lab_id" TEXT NOT NULL,
    "lab_name" TEXT,
    "nabl_accredited" BOOLEAN NOT NULL DEFAULT false,
    "accreditation_no" TEXT,
    "address_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "lab_profiles_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "test_parameters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT,
    "method" TEXT,
    "limit_standard" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "lab_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "lab_user_id" TEXT NOT NULL,
    "species_id" TEXT,
    "test_date" DATETIME NOT NULL,
    "outcome" TEXT NOT NULL DEFAULT 'pending',
    "summary" TEXT,
    "certification_level" TEXT,
    "report_asset_id" TEXT,
    "signed_by_user_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "lab_reports_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lab_reports_lab_user_id_fkey" FOREIGN KEY ("lab_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "lab_reports_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "species" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lab_test_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "report_id" TEXT NOT NULL,
    "parameter_id" TEXT NOT NULL,
    "value_numeric" REAL,
    "value_text" TEXT,
    "unit" TEXT,
    "result" TEXT NOT NULL DEFAULT 'na',
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lab_test_results_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "lab_reports" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lab_test_results_parameter_id_fkey" FOREIGN KEY ("parameter_id") REFERENCES "test_parameters" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "batches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "farmer_id" TEXT NOT NULL,
    "species_id" TEXT NOT NULL,
    "plot_id" TEXT,
    "crop_plan_id" TEXT,
    "parent_batch_id" TEXT,
    "harvest_date" DATETIME,
    "location" TEXT,
    "gps_lat" REAL,
    "gps_lng" REAL,
    "weight_kg" REAL NOT NULL,
    "notes" TEXT,
    "phase" TEXT NOT NULL DEFAULT 'with_farmer',
    "current_holder_user_id" TEXT NOT NULL,
    "test_status" TEXT NOT NULL DEFAULT 'pending',
    "qr_nonce" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "batches_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "batches_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "species" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "batches_plot_id_fkey" FOREIGN KEY ("plot_id") REFERENCES "farm_plots" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "batches_crop_plan_id_fkey" FOREIGN KEY ("crop_plan_id") REFERENCES "crop_plans" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "batches_parent_batch_id_fkey" FOREIGN KEY ("parent_batch_id") REFERENCES "batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "batches_current_holder_user_id_fkey" FOREIGN KEY ("current_holder_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "batch_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "from_user_id" TEXT,
    "to_user_id" TEXT,
    "phase_before" TEXT,
    "phase_after" TEXT,
    "location" TEXT,
    "gps_lat" REAL,
    "gps_lng" REAL,
    "payload_json" JSONB,
    "qr_token_hash" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "batch_events_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "batch_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "batch_events_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "batch_events_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "manufacturer_user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "products_manufacturer_user_id_fkey" FOREIGN KEY ("manufacturer_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_lots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity_units" INTEGER NOT NULL DEFAULT 0,
    "units_remaining" INTEGER NOT NULL DEFAULT 0,
    "phase" TEXT NOT NULL DEFAULT 'with_manufacturer',
    "current_holder_user_id" TEXT NOT NULL,
    "qr_nonce" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "product_lots_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_lots_current_holder_user_id_fkey" FOREIGN KEY ("current_holder_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_lot_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lot_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "from_user_id" TEXT,
    "to_user_id" TEXT,
    "phase_before" TEXT,
    "phase_after" TEXT,
    "location" TEXT,
    "gps_lat" REAL,
    "gps_lng" REAL,
    "payload_json" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_lot_events_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "product_lots" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_lot_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "product_lot_events_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "product_lot_events_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_lot_batch_links" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lot_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "quantity_kg" REAL NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_lot_batch_links_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "product_lots" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_lot_batch_links_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_no" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "buyer_user_id" TEXT NOT NULL,
    "seller_user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "subtotal_paise" INTEGER NOT NULL DEFAULT 0,
    "tax_paise" INTEGER NOT NULL DEFAULT 0,
    "shipping_paise" INTEGER NOT NULL DEFAULT 0,
    "total_paise" INTEGER NOT NULL DEFAULT 0,
    "shipping_address_id" TEXT,
    "notes" TEXT,
    "placed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "purchase_orders_buyer_user_id_fkey" FOREIGN KEY ("buyer_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "purchase_orders_seller_user_id_fkey" FOREIGN KEY ("seller_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_id" TEXT NOT NULL,
    "ref_type" TEXT NOT NULL,
    "ref_id" TEXT NOT NULL,
    "description" TEXT,
    "quantity_kg" REAL,
    "quantity_units" INTEGER,
    "unit_price_paise" INTEGER NOT NULL,
    "line_total_paise" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "fulfilled_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "purchase_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoice_no" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "buyer_user_id" TEXT NOT NULL,
    "seller_user_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "total_paise" INTEGER NOT NULL,
    "tax_paise" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'issued',
    "due_at" DATETIME,
    "issued_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "invoices_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "purchase_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoice_id" TEXT NOT NULL,
    "payer_user_id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "amount_paise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paid_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "balance_paise" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wallet_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "amount_paise" INTEGER NOT NULL,
    "balance_after_paise" INTEGER NOT NULL,
    "ref_type" TEXT,
    "ref_id" TEXT,
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "license_certs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "holder_user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "license_no" TEXT,
    "issuer" TEXT,
    "issued_at" DATETIME,
    "expires_at" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "license_certs_holder_user_id_fkey" FOREIGN KEY ("holder_user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inspections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspector_user_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "scheduled_at" DATETIME,
    "completed_at" DATETIME,
    "outcome" TEXT NOT NULL DEFAULT 'pending',
    "findings" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "inspections_inspector_user_id_fkey" FOREIGN KEY ("inspector_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "recalls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recall_no" TEXT NOT NULL,
    "ref_type" TEXT NOT NULL,
    "ref_id" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "issued_at" DATETIME,
    "resolved_at" DATETIME,
    "created_by_user_id" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "recall_scopes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recall_id" TEXT NOT NULL,
    "scope_type" TEXT NOT NULL,
    "scope_id" TEXT NOT NULL,
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recall_scopes_recall_id_fkey" FOREIGN KEY ("recall_id") REFERENCES "recalls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticket_no" TEXT NOT NULL,
    "requester_user_id" TEXT,
    "category" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "assignee_user_id" TEXT,
    "resolved_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "support_tickets_requester_user_id_fkey" FOREIGN KEY ("requester_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "support_tickets_assignee_user_id_fkey" FOREIGN KEY ("assignee_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channels" TEXT NOT NULL DEFAULT 'in_app',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipient_user_id" TEXT NOT NULL,
    "template_id" TEXT,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'in_app',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data_json" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" DATETIME,
    "sent_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notifications_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "notification_templates" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "device_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "last_seen_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" DATETIME,
    CONSTRAINT "device_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "price_quotes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "species_id" TEXT NOT NULL,
    "price_per_kg_paise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "market" TEXT NOT NULL DEFAULT 'local',
    "source" TEXT NOT NULL DEFAULT 'admin',
    "effective_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_by_user_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "price_quotes_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "species" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "price_quotes_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "weather_snapshots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gps_lat" REAL NOT NULL,
    "gps_lng" REAL NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'openweathermap',
    "payload_json" JSONB NOT NULL,
    "fetched_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_avatar_asset_id_key" ON "users"("avatar_asset_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "addresses_user_id_idx" ON "addresses"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_hash_key" ON "sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "api_keys_user_id_idx" ON "api_keys"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "assets_owner_user_id_idx" ON "assets"("owner_user_id");

-- CreateIndex
CREATE INDEX "entity_documents_entity_type_entity_id_idx" ON "entity_documents"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "entity_documents_asset_id_idx" ON "entity_documents"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "species_code_key" ON "species"("code");

-- CreateIndex
CREATE INDEX "species_common_name_idx" ON "species"("common_name");

-- CreateIndex
CREATE INDEX "species_scientific_name_idx" ON "species"("scientific_name");

-- CreateIndex
CREATE INDEX "species_ayush_category_idx" ON "species"("ayush_category");

-- CreateIndex
CREATE INDEX "species_is_active_idx" ON "species"("is_active");

-- CreateIndex
CREATE INDEX "species_synonyms_name_idx" ON "species_synonyms"("name");

-- CreateIndex
CREATE INDEX "species_synonyms_species_id_idx" ON "species_synonyms"("species_id");

-- CreateIndex
CREATE UNIQUE INDEX "species_content_species_id_locale_key" ON "species_content"("species_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "medicinal_uses_code_key" ON "medicinal_uses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "species_medicinal_uses_species_id_use_id_key" ON "species_medicinal_uses"("species_id", "use_id");

-- CreateIndex
CREATE UNIQUE INDEX "farmer_profiles_farmer_id_key" ON "farmer_profiles"("farmer_id");

-- CreateIndex
CREATE INDEX "farm_plots_profile_id_idx" ON "farm_plots"("profile_id");

-- CreateIndex
CREATE INDEX "farm_plots_status_idx" ON "farm_plots"("status");

-- CreateIndex
CREATE INDEX "crop_plans_farmer_id_idx" ON "crop_plans"("farmer_id");

-- CreateIndex
CREATE INDEX "crop_plans_species_id_idx" ON "crop_plans"("species_id");

-- CreateIndex
CREATE INDEX "crop_plans_plot_id_idx" ON "crop_plans"("plot_id");

-- CreateIndex
CREATE INDEX "crop_plans_status_idx" ON "crop_plans"("status");

-- CreateIndex
CREATE INDEX "farm_activities_crop_plan_id_idx" ON "farm_activities"("crop_plan_id");

-- CreateIndex
CREATE INDEX "farm_activities_type_idx" ON "farm_activities"("type");

-- CreateIndex
CREATE INDEX "farm_activities_performed_at_idx" ON "farm_activities"("performed_at");

-- CreateIndex
CREATE UNIQUE INDEX "transporter_profiles_transporter_id_key" ON "transporter_profiles"("transporter_id");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturer_profiles_manufacturer_id_key" ON "manufacturer_profiles"("manufacturer_id");

-- CreateIndex
CREATE UNIQUE INDEX "distributor_profiles_distributor_id_key" ON "distributor_profiles"("distributor_id");

-- CreateIndex
CREATE UNIQUE INDEX "retailer_profiles_retailer_id_key" ON "retailer_profiles"("retailer_id");

-- CreateIndex
CREATE INDEX "warehouses_owner_user_id_idx" ON "warehouses"("owner_user_id");

-- CreateIndex
CREATE INDEX "warehouses_kind_idx" ON "warehouses"("kind");

-- CreateIndex
CREATE INDEX "stock_movements_warehouse_id_idx" ON "stock_movements"("warehouse_id");

-- CreateIndex
CREATE INDEX "stock_movements_ref_type_ref_id_idx" ON "stock_movements"("ref_type", "ref_id");

-- CreateIndex
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "stock_positions_warehouse_id_ref_type_ref_id_key" ON "stock_positions"("warehouse_id", "ref_type", "ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "lab_profiles_lab_id_key" ON "lab_profiles"("lab_id");

-- CreateIndex
CREATE UNIQUE INDEX "test_parameters_code_key" ON "test_parameters"("code");

-- CreateIndex
CREATE INDEX "test_parameters_category_idx" ON "test_parameters"("category");

-- CreateIndex
CREATE UNIQUE INDEX "lab_reports_code_key" ON "lab_reports"("code");

-- CreateIndex
CREATE INDEX "lab_reports_batch_id_idx" ON "lab_reports"("batch_id");

-- CreateIndex
CREATE INDEX "lab_reports_lab_user_id_idx" ON "lab_reports"("lab_user_id");

-- CreateIndex
CREATE INDEX "lab_reports_outcome_idx" ON "lab_reports"("outcome");

-- CreateIndex
CREATE UNIQUE INDEX "lab_test_results_report_id_parameter_id_key" ON "lab_test_results"("report_id", "parameter_id");

-- CreateIndex
CREATE UNIQUE INDEX "batches_code_key" ON "batches"("code");

-- CreateIndex
CREATE INDEX "batches_code_idx" ON "batches"("code");

-- CreateIndex
CREATE INDEX "batches_farmer_id_idx" ON "batches"("farmer_id");

-- CreateIndex
CREATE INDEX "batches_species_id_idx" ON "batches"("species_id");

-- CreateIndex
CREATE INDEX "batches_phase_idx" ON "batches"("phase");

-- CreateIndex
CREATE INDEX "batches_current_holder_user_id_idx" ON "batches"("current_holder_user_id");

-- CreateIndex
CREATE INDEX "batches_parent_batch_id_idx" ON "batches"("parent_batch_id");

-- CreateIndex
CREATE INDEX "batches_created_at_idx" ON "batches"("created_at");

-- CreateIndex
CREATE INDEX "batch_events_batch_id_created_at_idx" ON "batch_events"("batch_id", "created_at");

-- CreateIndex
CREATE INDEX "batch_events_event_type_idx" ON "batch_events"("event_type");

-- CreateIndex
CREATE INDEX "batch_events_actor_user_id_idx" ON "batch_events"("actor_user_id");

-- CreateIndex
CREATE INDEX "batch_events_created_at_idx" ON "batch_events"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_manufacturer_user_id_idx" ON "products"("manufacturer_user_id");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE UNIQUE INDEX "product_lots_code_key" ON "product_lots"("code");

-- CreateIndex
CREATE INDEX "product_lots_code_idx" ON "product_lots"("code");

-- CreateIndex
CREATE INDEX "product_lots_product_id_idx" ON "product_lots"("product_id");

-- CreateIndex
CREATE INDEX "product_lots_phase_idx" ON "product_lots"("phase");

-- CreateIndex
CREATE INDEX "product_lots_current_holder_user_id_idx" ON "product_lots"("current_holder_user_id");

-- CreateIndex
CREATE INDEX "product_lots_created_at_idx" ON "product_lots"("created_at");

-- CreateIndex
CREATE INDEX "product_lot_events_lot_id_created_at_idx" ON "product_lot_events"("lot_id", "created_at");

-- CreateIndex
CREATE INDEX "product_lot_events_event_type_idx" ON "product_lot_events"("event_type");

-- CreateIndex
CREATE INDEX "product_lot_batch_links_batch_id_idx" ON "product_lot_batch_links"("batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_lot_batch_links_lot_id_batch_id_key" ON "product_lot_batch_links"("lot_id", "batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_order_no_key" ON "purchase_orders"("order_no");

-- CreateIndex
CREATE INDEX "purchase_orders_order_no_idx" ON "purchase_orders"("order_no");

-- CreateIndex
CREATE INDEX "purchase_orders_buyer_user_id_idx" ON "purchase_orders"("buyer_user_id");

-- CreateIndex
CREATE INDEX "purchase_orders_seller_user_id_idx" ON "purchase_orders"("seller_user_id");

-- CreateIndex
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");

-- CreateIndex
CREATE INDEX "purchase_orders_created_at_idx" ON "purchase_orders"("created_at");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_ref_type_ref_id_idx" ON "order_items"("ref_type", "ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_no_key" ON "invoices"("invoice_no");

-- CreateIndex
CREATE INDEX "invoices_invoice_no_idx" ON "invoices"("invoice_no");

-- CreateIndex
CREATE INDEX "invoices_buyer_user_id_idx" ON "invoices"("buyer_user_id");

-- CreateIndex
CREATE INDEX "invoices_seller_user_id_idx" ON "invoices"("seller_user_id");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "payments_invoice_id_idx" ON "payments"("invoice_id");

-- CreateIndex
CREATE INDEX "payments_payer_user_id_idx" ON "payments"("payer_user_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_wallet_id_created_at_idx" ON "wallet_transactions"("wallet_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "license_certs_license_no_key" ON "license_certs"("license_no");

-- CreateIndex
CREATE INDEX "license_certs_holder_user_id_idx" ON "license_certs"("holder_user_id");

-- CreateIndex
CREATE INDEX "license_certs_type_idx" ON "license_certs"("type");

-- CreateIndex
CREATE INDEX "license_certs_status_idx" ON "license_certs"("status");

-- CreateIndex
CREATE INDEX "inspections_inspector_user_id_idx" ON "inspections"("inspector_user_id");

-- CreateIndex
CREATE INDEX "inspections_target_type_target_id_idx" ON "inspections"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "inspections_outcome_idx" ON "inspections"("outcome");

-- CreateIndex
CREATE UNIQUE INDEX "recalls_recall_no_key" ON "recalls"("recall_no");

-- CreateIndex
CREATE INDEX "recalls_status_idx" ON "recalls"("status");

-- CreateIndex
CREATE INDEX "recalls_ref_type_ref_id_idx" ON "recalls"("ref_type", "ref_id");

-- CreateIndex
CREATE INDEX "recall_scopes_scope_type_scope_id_idx" ON "recall_scopes"("scope_type", "scope_id");

-- CreateIndex
CREATE UNIQUE INDEX "recall_scopes_recall_id_scope_type_scope_id_key" ON "recall_scopes"("recall_id", "scope_type", "scope_id");

-- CreateIndex
CREATE UNIQUE INDEX "support_tickets_ticket_no_key" ON "support_tickets"("ticket_no");

-- CreateIndex
CREATE INDEX "support_tickets_requester_user_id_idx" ON "support_tickets"("requester_user_id");

-- CreateIndex
CREATE INDEX "support_tickets_assignee_user_id_idx" ON "support_tickets"("assignee_user_id");

-- CreateIndex
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_code_key" ON "notification_templates"("code");

-- CreateIndex
CREATE INDEX "notifications_recipient_user_id_is_read_created_at_idx" ON "notifications"("recipient_user_id", "is_read", "created_at");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_token_key" ON "device_tokens"("token");

-- CreateIndex
CREATE INDEX "device_tokens_user_id_idx" ON "device_tokens"("user_id");

-- CreateIndex
CREATE INDEX "price_quotes_species_id_effective_at_idx" ON "price_quotes"("species_id", "effective_at");

-- CreateIndex
CREATE INDEX "price_quotes_market_idx" ON "price_quotes"("market");

-- CreateIndex
CREATE INDEX "price_quotes_created_at_idx" ON "price_quotes"("created_at");

-- CreateIndex
CREATE INDEX "weather_snapshots_gps_lat_gps_lng_fetched_at_idx" ON "weather_snapshots"("gps_lat", "gps_lng", "fetched_at");
