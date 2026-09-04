/**
 * Seed the local SQLite database with a complete demo dataset.
 * Port of backend/server/scripts/seed_demo.py.
 *
 * Usage (from second_backend/):
 *   npm run seed             idempotent: re-uses existing users
 *   npm run seed:fresh       wipe DB first then seed
 *
 * After running, these credentials are valid:
 *   farmer1@herbchain.local / farmerpass      transporter1@herbchain.local / transpass
 *   lab1@herbchain.local / labpass            manufacturer1@herbchain.local / mfgpass
 *   consumer1@herbchain.local / conspass      admin@herbchain.local / adminpass
 */
const bcrypt = require("bcryptjs");
const { prisma } = require("../db/client");
const qrService = require("../services/qrService");
const transferService = require("../services/transferService");
const { AYUSH_SPECIES } = require("./ayushCatalogue");

const DEMO_USERS = [
  {
    user_id: "FARMER001",
    role: "farmer",
    name: "Demo Farmer",
    email: "farmer1@herbchain.local",
    password: "farmerpass",
    location: "Bengaluru, KA",
    gps_lat: 12.9716,
    gps_lng: 77.5946,
    kyc_verified: true,
  },
  {
    user_id: "TRANS001",
    role: "transporter",
    name: "Demo Transporter",
    email: "transporter1@herbchain.local",
    password: "transpass",
    location: "Bengaluru, KA",
    kyc_verified: true,
  },
  {
    user_id: "LAB001",
    role: "lab",
    name: "AYUSH Test Lab",
    email: "lab1@herbchain.local",
    password: "labpass",
    location: "Bengaluru, KA",
    kyc_verified: true,
  },
  {
    user_id: "MFG001",
    role: "manufacturer",
    name: "Demo Manufacturer",
    email: "manufacturer1@herbchain.local",
    password: "mfgpass",
    location: "Mysuru, KA",
    kyc_verified: true,
  },
  {
    user_id: "CONS001",
    role: "consumer",
    name: "Demo Consumer",
    email: "consumer1@herbchain.local",
    password: "conspass",
  },
  {
    user_id: "ADMIN001",
    role: "admin",
    name: "System Admin",
    email: "admin@herbchain.local",
    password: "adminpass",
  },
];

// ---------------------------------------------------------------- helpers

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDaysISO(base, days) {
  const d = new Date(`${base}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function wipe() {
  console.log("Wiping existing data…");
  const order = [
    prisma.batchEvent.deleteMany(),
    prisma.productBatchLink.deleteMany(),
    prisma.product.deleteMany(),
    prisma.labReport.deleteMany(),
    prisma.batchState.deleteMany(),
    prisma.herb.deleteMany(),
    prisma.cropPlan.deleteMany(),
    prisma.farmProfile.deleteMany(),
    prisma.priceQuote.deleteMany(),
    prisma.herbCatalogue.deleteMany(),
    prisma.weatherSnapshot.deleteMany(),
    prisma.user.deleteMany(),
  ];
  const results = await prisma.$transaction(order);
  const names = ["batch_events", "product_batch_links", "products", "lab_reports", "batch_states", "herbs", "crop_plans", "farm_profiles", "price_quotes", "herb_catalogue", "weather_snapshots", "users"];
  results.forEach((count, i) => console.log(`  ${names[i]}: ${count} rows`));
}

async function seedCatalogue(admin) {
  let inserted = 0;
  for (const spec of AYUSH_SPECIES) {
    const existing = await prisma.herbCatalogue.findUnique({ where: { species_id: spec.species_id } });
    if (existing) {
      // keep latest details fresh on re-seed
      await prisma.herbCatalogue.update({
        where: { species_id: spec.species_id },
        data: {
          common_name: spec.common_name,
          scientific_name: spec.scientific_name,
          synonyms: spec.synonyms || [],
          description: spec.description ?? null,
          medicinal_uses: spec.medicinal_uses ?? null,
          image_url: spec.image_url ?? null,
          season_planting: spec.season_planting ?? null,
          season_harvest: spec.season_harvest ?? null,
          default_unit_price_inr: spec.default_unit_price_inr ?? null,
        },
      });
      continue;
    }
    await prisma.herbCatalogue.create({
      data: {
        species_id: spec.species_id,
        common_name: spec.common_name,
        scientific_name: spec.scientific_name,
        ayush_category: spec.ayush_category || "ayurveda",
        synonyms: spec.synonyms || [],
        description: spec.description ?? null,
        medicinal_uses: spec.medicinal_uses ?? null,
        image_url: spec.image_url ?? null,
        season_planting: spec.season_planting ?? null,
        season_harvest: spec.season_harvest ?? null,
        default_unit_price_inr: spec.default_unit_price_inr ?? null,
        is_active: true,
      },
    });
    inserted += 1;

    if (spec.default_unit_price_inr != null) {
      await prisma.priceQuote.create({
        data: {
          quote_id: `PQ-${spec.species_id.slice(0, 8).toUpperCase()}-INIT`,
          species_id: spec.species_id,
          price_per_kg_inr: spec.default_unit_price_inr,
          currency: "INR",
          source: "seed",
          created_by_admin_id: admin.user_id,
          notes: "Initial seed quote (admin reference).",
        },
      });
    }
  }
  const total = await prisma.herbCatalogue.count();
  console.log(`  herb_catalogue: +${inserted} species (total ${total})`);
  return inserted;
}

async function seedFarmAndPlans(farmer) {
  const farm = await prisma.farmProfile.findUnique({ where: { farmer_id: farmer.user_id } });
  if (!farm) {
    await prisma.farmProfile.create({
      data: {
        farm_id: `FARM-${farmer.user_id.slice(-6)}`,
        farmer_id: farmer.user_id,
        farm_name: "Green Valley Demo Farm",
        land_size_acres: 4.5,
        soil_type: "loamy",
        irrigation_type: "drip",
        certifications: ["organic", "good_agri_practices"],
        address: farmer.location || "Bengaluru, KA",
        gps_lat: farmer.gps_lat,
        gps_lng: farmer.gps_lng,
        notes: "Seeded demo farm — replace with your real farm.",
      },
    });
  }

  const today = todayISO();
  const samples = [
    { species_id: "ashwagandha", area: 1.0, planting_offset: -120, harvest_offset: 30, status: "growing" },
    { species_id: "tulsi", area: 0.5, planting_offset: -200, harvest_offset: -20, status: "harvested" },
    { species_id: "moringa", area: 1.0, planting_offset: 14, harvest_offset: 120, status: "planned" },
  ];
  for (const spec of samples) {
    const existing = await prisma.cropPlan.findFirst({
      where: { farmer_id: farmer.user_id, species_id: spec.species_id },
    });
    if (existing) continue;
    await prisma.cropPlan.create({
      data: {
        plan_id: `PLAN-${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
        farmer_id: farmer.user_id,
        species_id: spec.species_id,
        area_acres: spec.area,
        planting_date: addDaysISO(today, spec.planting_offset),
        expected_harvest_date: addDaysISO(today, spec.harvest_offset),
        actual_harvest_date: spec.status === "harvested" ? addDaysISO(today, spec.harvest_offset) : null,
        status: spec.status,
        notes: `Seeded demo plan: ${spec.species_id}`,
      },
    });
  }
}

async function getOrCreateUsers() {
  const out = {};
  for (const spec of DEMO_USERS) {
    const existing = await prisma.user.findUnique({ where: { user_id: spec.user_id } });
    if (existing) {
      // always re-hash the password so demo creds stay known
      await prisma.user.update({
        where: { user_id: spec.user_id },
        data: { password_hash: bcrypt.hashSync(spec.password, 10), is_active: true },
      });
      out[spec.role] = existing;
      continue;
    }
    const user = await prisma.user.create({
      data: {
        user_id: spec.user_id,
        role: spec.role,
        name: spec.name,
        email: spec.email,
        password_hash: bcrypt.hashSync(spec.password, 10),
        location: spec.location ?? null,
        gps_lat: spec.gps_lat ?? null,
        gps_lng: spec.gps_lng ?? null,
        language_pref: "en",
        is_active: true,
        kyc_verified: Boolean(spec.kyc_verified),
      },
    });
    out[spec.role] = user;
  }
  return out;
}

async function newBatch(farmer, species, weight, location) {
  const { herb } = await transferService.createBatch({
    farmer,
    speciesName: species,
    harvestDate: addDaysISO(todayISO(), -3),
    location,
    weightKg: weight,
    gpsLat: farmer.gps_lat,
    gpsLng: farmer.gps_lng,
    notes: "Seeded demo batch",
  });
  console.log(`  created ${herb.batch_id} (${species}) — phase=with_farmer`);
  return herb;
}

async function transfer(batchId, scanner, location = null) {
  const state = await prisma.batchState.findUnique({ where: { batch_id: batchId } });
  if (!state) throw new Error(`No state for ${batchId}`);
  const result = await transferService.transferByScan({
    batchId,
    scanner,
    scannedQrToken: state.current_qr_token,
    location: location || scanner.location,
  });
  console.log(
    `  transfer ${batchId}: ${result.fromPhase} -> ${result.toPhase} (now held by ${scanner.role}:${scanner.user_id})`
  );
  return result;
}

async function fileLabReport(batchId, lab, outcome = "approved") {
  const state = await prisma.batchState.findUnique({ where: { batch_id: batchId } });
  const reportId = `REPORT-${Math.random().toString(16).slice(2, 12).toUpperCase()}`;
  await prisma.labReport.create({
    data: {
      report_id: reportId,
      batch_id: batchId,
      lab_id: lab.user_id,
      test_type: "full_panel",
      test_date: todayISO(),
      results_summary: "Demo seed lab report — all metrics nominal.",
      outcome,
      certification_level: outcome === "approved" ? "A" : null,
      purity_percentage: outcome === "approved" ? 98.5 : 62.0,
      moisture_content: 8.4,
      ash_content: 4.1,
      heavy_metals_present: false,
      pesticides_detected: false,
    },
  });
  await prisma.batchState.update({
    where: { batch_id: batchId },
    data: { test_result: outcome, updated_at: new Date() },
  });
  await prisma.batchEvent.create({
    data: {
      event_id: `EVT-${Math.random().toString(16).slice(2, 14).toUpperCase()}`,
      batch_id: batchId,
      event_type: "LAB_REPORT",
      actor_id: lab.user_id,
      from_party_id: null,
      to_party_id: lab.user_id,
      phase_before: state.phase,
      phase_after: state.phase,
      location: lab.location,
      payload_json: { report_id: reportId, outcome },
    },
  });
  console.log(`  lab report filed for ${batchId}: outcome=${outcome}`);
}

async function createProduct(manufacturer, name, batchIds) {
  const productId = `PROD-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
  const token = qrService.issueProductQr(productId);
  await prisma.product.create({
    data: {
      product_id: productId,
      manufacturer_id: manufacturer.user_id,
      name,
      sku: `DEMO-${productId.slice(-4)}`,
      qr_token: token,
      description: "Demo seed product",
    },
  });
  for (const bid of batchIds) {
    await prisma.productBatchLink.create({
      data: { product_id: productId, batch_id: bid, quantity_kg: 1.0 },
    });
    const state = await prisma.batchState.findUnique({ where: { batch_id: bid } });
    if (state && state.phase === "with_manufacturer") {
      await prisma.batchState.update({
        where: { batch_id: bid },
        data: { phase: "consumed", updated_at: new Date() },
      });
    }
    await prisma.batchEvent.create({
      data: {
        event_id: `EVT-${Math.random().toString(16).slice(2, 14).toUpperCase()}`,
        batch_id: bid,
        event_type: "PRODUCT_LINK",
        actor_id: manufacturer.user_id,
        from_party_id: null,
        to_party_id: manufacturer.user_id,
        phase_before: "with_manufacturer",
        phase_after: "consumed",
        payload_json: { product_id: productId, quantity_kg: 1.0 },
      },
    });
  }
  console.log(`  product ${productId} (${name}) linked to ${batchIds.length} batches`);
  return { productId };
}

async function summary() {
  const count = (model) => prisma[model].count();
  console.log("\n=== Seed summary ===");
  console.log(`Users:     ${await count("user")}`);
  console.log(`Catalogue: ${await count("herbCatalogue")}`);
  console.log(`Prices:    ${await count("priceQuote")}`);
  console.log(`Farms:     ${await count("farmProfile")}`);
  console.log(`CropPlans: ${await count("cropPlan")}`);
  console.log(`Batches:   ${await count("herb")}`);
  console.log(`Events:    ${await count("batchEvent")}`);
  console.log(`Reports:   ${await count("labReport")}`);
  console.log(`Products:  ${await count("product")}`);
  console.log("\nLogin credentials (identifier / password):");
  for (const u of DEMO_USERS) {
    console.log(`  ${u.email.padEnd(35)} / ${u.password}   (${u.role})`);
  }
  console.log("\nDone. Start the backend with `npm run dev` or `npm start`.");
}

async function seed(fresh = false) {
  if (fresh) await wipe();

  console.log("Creating demo users…");
  const users = await getOrCreateUsers();
  const { farmer, transporter, lab, manufacturer, admin } = users;

  console.log("\nSeeding AYUSH herb catalogue…");
  await seedCatalogue(admin);

  console.log("\nSeeding farm profile + crop plans for FARMER001…");
  await seedFarmAndPlans(farmer);

  const existingBatches = await prisma.herb.count();
  if (existingBatches >= 3 && !fresh) {
    console.log(
      `Found ${existingBatches} existing batches — skipping batch seeding. Use --fresh to re-seed.`
    );
    await summary();
    return;
  }

  console.log("\nSeeding batches at different phases…");
  const b1 = await newBatch(farmer, "Ashwagandha", 10.0, farmer.location);
  const b2 = await newBatch(farmer, "Tulsi", 7.5, farmer.location);
  const b3 = await newBatch(farmer, "Brahmi", 5.0, farmer.location);
  const b4 = await newBatch(farmer, "Moringa", 12.0, farmer.location);

  // Batch 2 -> in transit to lab
  await transfer(b2.batch_id, transporter);

  // Batch 3 -> full chain -> product
  await transfer(b3.batch_id, transporter);
  await transfer(b3.batch_id, lab);
  await fileLabReport(b3.batch_id, lab, "approved");
  await transfer(b3.batch_id, transporter);
  await transfer(b3.batch_id, manufacturer);
  await createProduct(manufacturer, "Demo Triphala Mix", [b3.batch_id]);

  // Batch 4: parent -> 2 children split (demonstrates BATCH_SPLIT)
  console.log("\nSplitting batch 4 into two child batches…");
  const splitResult = await transferService.splitBatch({
    parentBatchId: b4.batch_id,
    actor: farmer,
    splits: [
      { weight_kg: 7.0, note: "For Lab partner A" },
      { weight_kg: 5.0, note: "For Lab partner B" },
    ],
  });
  for (const child of splitResult.children) {
    console.log(`  child ${child.batchId} (${child.weightKg} kg)${child.note ? ` note=${child.note}` : ""}`);
  }

  await summary();
}

const fresh = process.argv.includes("--fresh");
seed(fresh)
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });