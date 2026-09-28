/**
 * Seed/bootstrap for the redesigned backend (docs/auth/architecture.md §11).
 *
 *   node src/scripts/seed.js          idempotent bootstrap
 *   node src/scripts/seed.js --fresh  delete demo accounts, then bootstrap
 *
 * Creates: the RBAC catalog (Permission/RolePermission), the AYUSH admin
 * (never self-registrable), and one verified demo account per role.
 * Passwords: env ADMIN_PASSWORD (default Admin@123456), DEMO_PASSWORD
 * (default Demo@123456). Targets DATABASE_URL from .env by default.
 */
const { prisma } = require("../db/client");
const { seedRbac } = require("../db/rbac");
const { registerUser, PROFILE_MODEL, PROFILE_FK, PROFILE_CODE_FIELD } = require("../services/accounts");
const { approveUser } = require("../services/verification");
const { seedBlockchain } = require("../services/blockchain");
const { hashPassword } = require("../services/passwords");
const { getLogger } = require("../config/logging");
const { AYUSH_SPECIES } = require("./ayushCatalogue");

const logger = getLogger("seed");

const ADMIN_EMAIL = "admin@herbchain.in";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123456";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "Demo@123456";

const DEMO_ACCOUNTS = [
  { key: "consumer", role: "consumer", name: "Demo Consumer", email: "consumer@herbchain.in" },
  { key: "farmer", role: "farmer", name: "Demo Farmer", email: "farmer@herbchain.in" },
  { key: "transporter", role: "transporter", name: "Demo Transporter", email: "transporter@herbchain.in" },
  { key: "lab", role: "lab", name: "Demo Laboratory", email: "lab@herbchain.in" },
  { key: "manufacturer", role: "manufacturer", name: "Demo Manufacturer", email: "manufacturer@herbchain.in" },
  { key: "distributor", role: "distributor", name: "Demo Distributor", email: "distributor@herbchain.in" },
  { key: "retailer", role: "retailer", name: "Demo Retailer", email: "retailer@herbchain.in" },
];

async function upsertAdmin() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      name: "AYUSH Admin",
      email: ADMIN_EMAIL,
      password_hash: hashPassword(ADMIN_PASSWORD),
      role: "admin",
      kyc_status: "none",
    },
  });
}

async function orgCodePresent(user) {
  const model = PROFILE_MODEL[user.role];
  if (!model) return true;
  const profile = await prisma[model].findUnique({ where: { [PROFILE_FK[user.role]]: user.id } });
  const field = PROFILE_CODE_FIELD[user.role];
  return Boolean(profile && field && profile[field]);
}

async function ensureDemoAccount(def, admin) {
  let user = await prisma.user.findUnique({ where: { email: def.email } });
  if (!user) {
    user = await registerUser({
      name: def.name,
      email: def.email,
      phone: null,
      password: DEMO_PASSWORD,
      role: def.role,
    });
    logger.info(`  + ${def.role.padEnd(12)} ${def.email}`);
  }
  const isOrg = user.role !== "consumer";
  if (isOrg && (user.kyc_status !== "verified" || !(await orgCodePresent(user)))) {
    await approveUser(admin, user.id, { notes: "seeded demo account" });
    user = await prisma.user.findUnique({ where: { id: user.id } });
    logger.info(`  ~ ${def.role.padEnd(12)} verified + org code`);
  }
  return user;
}

/** Upsert the 25-species AYUSH catalogue (idempotent). */
async function seedSpecies() {
  let created = 0;
  for (const s of AYUSH_SPECIES) {
    const code = s.species_id; // lowercase slug codes (e.g. "tulsi", "aloe-vera")
    const species = await prisma.species.upsert({
      where: { code },
      update: {
        common_name: s.common_name,
        scientific_name: s.scientific_name,
        ayush_category: "ayurveda",
        season_planting: s.season_planting,
        season_harvest: s.season_harvest,
        is_active: true,
      },
      create: {
        code,
        common_name: s.common_name,
        scientific_name: s.scientific_name,
        family: null,
        ayush_category: "ayurveda",
        season_planting: s.season_planting,
        season_harvest: s.season_harvest,
        is_active: true,
      },
    });
    created += 1;
    for (const name of s.synonyms || []) {
      const exists = await prisma.speciesSynonym.findFirst({ where: { species_id: species.id, name } });
      if (!exists) {
        await prisma.speciesSynonym.create({ data: { species_id: species.id, name, language: "en" } });
      }
    }
  }
  return { species: created, synonyms: AYUSH_SPECIES.reduce((n, s) => n + (s.synonyms || []).length, 0) };
}

/**
 * Quality-test vocabulary (AYUSH/WHO pharmacopoeia limits) used by the lab
 * testing UI. Upserted by unique `code` so re-running the seed is safe.
 */
const TEST_PARAMETERS = [
  { code: "moisture", name: "Moisture", category: "physical", unit: "%", method: "LOD/oven", limit_standard: "≤ 10%" },
  { code: "pesticide", name: "pesticide", category: "pesticide", unit: "mg/kg", method: "GC-MS", limit_standard: "≤ 0.1" },
  { code: "phytochemical", name: "active", category: "active", unit: "mg/g", method: "HPLC", limit_standard: null },
  { code: "purity_percentage", name: "purity", category: "purity", unit: "%", method: "visual/organoleptic", limit_standard: "≥ 95%" },
  { code: "heavy_metals_present", name: "heavy_metal", category: "heavy_metal", unit: null, method: "AAS/ICP-MS", limit_standard: "Absent" },
  { code: "pesticides_detected", name: "pesticide", category: "pesticide", unit: null, method: "GC-MS", limit_standard: "None detected" },
  { code: "ash_content", name: "purity", category: "purity", unit: "%", method: "muffle furnace", limit_standard: "≤ 5%" },
  { code: "active_compounds", name: "active", category: "active", unit: null, method: null, limit_standard: null },
  { code: "potency_rating", name: "other", category: "other", unit: null, method: null, limit_standard: null },
  { code: "certification", name: "other", category: "other", unit: null, method: null, limit_standard: null },
  { code: "certification_level", name: "other", category: "other", unit: null, method: null, limit_standard: null },
];

/** Upsert the quality-test parameter vocabulary (idempotent). */
async function seedTestParameters() {
  for (const p of TEST_PARAMETERS) {
    await prisma.testParameter.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        category: p.category,
        unit: p.unit,
        method: p.method,
        limit_standard: p.limit_standard,
        is_active: true,
      },
      create: { ...p, is_active: true },
    });
  }
  return TEST_PARAMETERS.length;
}

const DEMO_BATCH_CODE = "HERB-2026-900001";

/**
 * One demo batch already checked in at the demo lab so the lab queue has a
 * testable row (receive is idempotent on an already-received batch). Upserted by
 * unique `code`.
 */
async function seedDemoBatches(usersByRole) {
  const farmer = usersByRole.farmer;
  const lab = usersByRole.lab;
  const species = await prisma.species.findUnique({ where: { code: "tulsi" } });
  if (!farmer || !lab || !species) {
    logger.warn("Skipping demo batch: farmer/lab user or tulsi species missing");
    return 0;
  }
  await prisma.batch.upsert({
    where: { code: DEMO_BATCH_CODE },
    update: {
      current_holder_user_id: lab.id,
      phase: "at_lab",
      test_status: "pending",
    },
    create: {
      code: DEMO_BATCH_CODE,
      farmer_id: farmer.id,
      species_id: species.id,
      harvest_date: new Date(),
      weight_kg: 25,
      location: "Demo Farm, Kerala",
      cultivation_type: "organic",
      phase: "at_lab",
      test_status: "pending",
      current_holder_user_id: lab.id,
    },
  });
  return 1;
}

async function main() {
  const fresh = process.argv.includes("--fresh");
  if (fresh) {
    const emails = DEMO_ACCOUNTS.map((d) => d.email);
    const deleted = await prisma.user.deleteMany({ where: { email: { in: emails } } });
    logger.info(`--fresh: removed ${deleted.count} demo account(s)`);
  }

  const rbac = await seedRbac();
  logger.info(`RBAC catalog: ${rbac.permissions} permissions, ${rbac.grants} role grants`);

  const catalogue = await seedSpecies();
  logger.info(`Species catalogue: ${catalogue.species} species, ${catalogue.synonyms} synonyms`);

  const parameters = await seedTestParameters();
  logger.info(`Test parameters: ${parameters} active`);

  const admin = await upsertAdmin();
  logger.info(`Admin ready: ${ADMIN_EMAIL}`);

  const chain = await seedBlockchain();
  logger.info(`Blockchain network: ${chain.nodes} nodes, ${chain.contracts} contract version`);

  // Phase 14: notification template catalog (docs/phase_14.md).
  const { seedTemplates } = require("../services/notifications");
  const templates = await seedTemplates();
  logger.info(`Notification templates: ${templates} seeded`);

  // Phase 15: document retention rules (docs/phase_15.md "Retention Policies").
  const { seedRetentionRules } = require("../services/documents");
  const retention = await seedRetentionRules();
  logger.info(`Document retention rules: ${retention} seeded`);

  const usersByRole = {};
  for (const def of DEMO_ACCOUNTS) {
    usersByRole[def.role] = await ensureDemoAccount(def, admin);
  }

  // The demo lab account doubles as the supervisor so the lab UI's analyst +
  // supervisor actions are both exercisable in development.
  if (usersByRole.lab && usersByRole.lab.lab_role !== "supervisor") {
    usersByRole.lab = await prisma.user.update({
      where: { id: usersByRole.lab.id },
      data: { lab_role: "supervisor" },
    });
    logger.info(`  ~ lab           lab_role=supervisor (${usersByRole.lab.email})`);
  }

  const demoBatches = await seedDemoBatches(usersByRole);
  logger.info(`Demo batches: ${demoBatches} lab-queue batch(es)`);

  const byRole = await prisma.user.groupBy({ by: ["role"], _count: true });
  logger.info("Users by role: " + byRole.map((r) => `${r.role}=${r._count}`).join(", "));
  logger.info("Seed complete ✅");
  await prisma.$disconnect();
}

main().catch(async (err) => {
  logger.error(`Seed failed: ${err.stack || err}`);
  await prisma.$disconnect();
  process.exit(1);
});
