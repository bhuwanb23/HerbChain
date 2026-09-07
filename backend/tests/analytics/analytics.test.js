/**
 * Phase 16 analytics tests (docs/phase_16.md).
 *
 * Verifies on an isolated DB: the ETL rebuild (all 10 warehouse domains
 * with correct aggregates per period bucket + idempotency), the BI read
 * endpoints (executive dashboard + each domain), role scoping (manufacturer
 * /lab self scope, RBAC gates), the alert engine (lab failure rate >20%,
 * species-mismatch spike, counterfeit surge — deduplicated), report
 * generation (CSV artifacts, audience scoping, download) and the scheduled
 * report engine (due-fire → ReportExport + notification + next_run
 * advance).
 */
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { setupDb } = require("./_db");

const db = setupDb();
const { prisma } = require("../../src/db/client");
const { seedRbac } = require("../../src/db/rbac");
const { hashPassword } = require("../../src/services/passwords");
const analytics = require("../../src/services/analytics");
const bi = require("../../src/services/analyticsBi");
const reports = require("../../src/services/analyticsReports");
const notif = require("../../src/services/notifications");
const { createApp } = require("../../src/app");

let app;
let adminToken;
let farmerToken;
let labToken;
let mfrToken;
let transporterToken;

const ids = {};
const NOW = new Date();
const MONTH_AGO = new Date(NOW.getTime() - 32 * 86400000);

async function makeUser(email, role, extra = {}) {
  const user = await prisma.user.create({
    data: { name: role, email, password_hash: hashPassword("password1"), role, is_active: true, kyc_status: "verified", ...extra },
  });
  return user;
}

async function login(email) {
  const res = await request(app).post("/api/v1/auth/login").send({ identifier: email, password: "password1" });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  return res.body.data.access_token;
}

async function makeSpecies(code, name) {
  return prisma.species.create({ data: { code, common_name: name, scientific_name: `${name} sp`, ayush_category: "ayurveda" } });
}

before(async () => {
  await seedRbac();
  await notif.seedTemplates(); // report_ready template for scheduled-report notifications
  app = createApp();

  // ------------------------------------------------------------ actors
  const admin = await makeUser("analytics.admin@test.io", "admin");
  const farmer = await makeUser("analytics.farmer@test.io", "farmer");
  const otherFarmer = await makeUser("analytics.farmer2@test.io", "farmer");
  const lab = await makeUser("analytics.lab@test.io", "lab", { lab_role: "supervisor" });
  const otherLab = await makeUser("analytics.lab2@test.io", "lab", { lab_role: "supervisor" });
  const mfr = await makeUser("analytics.mfr@test.io", "manufacturer");
  const transporter = await makeUser("analytics.tpt@test.io", "transporter");
  Object.assign(ids, { admin: admin.id, farmer: farmer.id, otherFarmer: otherFarmer.id, lab: lab.id, otherLab: otherLab.id, mfr: mfr.id, transporter: transporter.id });

  await prisma.user.update({ where: { id: farmer.id }, data: { farmer_profile: { create: { farm_name: "Farm A" } } } });
  await prisma.user.update({ where: { id: otherFarmer.id }, data: { farmer_profile: { create: { farm_name: "Farm B" } } } });
  await prisma.address.create({ data: { user_id: farmer.id, kind: "registered", line1: "1 Main St", city: "Vellore", district: "Vellore", state: "Tamil Nadu", is_default: true } });
  await prisma.address.create({ data: { user_id: otherFarmer.id, kind: "registered", line1: "2 Main St", city: "Kochi", state: "Kerala", is_default: true } });

  // ----------------------------------------------------------- species
  ids.tulsi = (await makeSpecies("SPC-TULSI", "Tulsi")).id;
  ids.ashwa = (await makeSpecies("SPC-ASHWA", "Ashwagandha")).id;

  // ------------------------------------------------------------ batches
  async function makeBatch(code, { species, farmerId, kg, testStatus, createdAt = NOW }) {
    return prisma.batch.create({
      data: { code, species_id: species, farmer_id: farmerId, weight_kg: kg, phase: "with_farmer", test_status: testStatus, current_holder_user_id: farmerId, created_at: createdAt },
    });
  }
  ids.b1 = (await makeBatch("BAT-2026-0601", { species: ids.tulsi, farmerId: farmer.id, kg: 100, testStatus: "certified" })).id;
  ids.b2 = (await makeBatch("BAT-2026-0602", { species: ids.tulsi, farmerId: farmer.id, kg: 50, testStatus: "certified" })).id;
  ids.b3 = (await makeBatch("BAT-2026-0603", { species: ids.ashwa, farmerId: otherFarmer.id, kg: 200, testStatus: "rejected" })).id;
  ids.b4 = (await makeBatch("BAT-2026-0501", { species: ids.ashwa, farmerId: otherFarmer.id, kg: 75, testStatus: "pending", createdAt: MONTH_AGO })).id;

  // ----------------------------------------------------------- lab facts
  const cert = (n) => prisma.certification.create({
    data: { certificate_number: n, batch_id: ids.b1, lab_user_id: lab.id, issued_by_user_id: lab.id, lab_code: "LAB-01", lab_name: "Test Lab A", species_id: ids.tulsi, species_code: "SPC-TULSI", test_count: 3, pass_count: 3, fail_count: 0, certificate_hash: `h-${n}` },
  });
  await cert("CERT-2026-0001");
  await prisma.certification.create({
    data: { certificate_number: "CERT-2026-0002", batch_id: ids.b2, lab_user_id: lab.id, issued_by_user_id: lab.id, lab_code: "LAB-01", lab_name: "Test Lab A", species_id: ids.tulsi, species_code: "SPC-TULSI", test_count: 2, pass_count: 2, fail_count: 0, certificate_hash: "h-2", issued_at: MONTH_AGO },
  });

  // Lab tests: lab has 10 tests (7 pass, 3 fail → 30% fail rate > 20%).
  ids.sample1 = (await prisma.sampleRecord.create({ data: { sample_code: "SMP-2026-001", batch_id: ids.b1, lab_user_id: lab.id } })).id;
  ids.sample2 = (await prisma.sampleRecord.create({ data: { sample_code: "SMP-2026-002", batch_id: ids.b2, lab_user_id: lab.id } })).id;
  const makeTest = (i, outcome, daysAgo = 0) => prisma.labTest.create({
    data: {
      batch_id: i % 2 ? ids.b1 : ids.b2, sample_id: i % 2 ? ids.sample1 : ids.sample2,
      lab_user_id: lab.id, test_name: `Test ${i}`, test_category: "purity", status: "completed", outcome,
      started_at: new Date(NOW.getTime() - daysAgo * 86400000 - 3600000), completed_at: new Date(NOW.getTime() - daysAgo * 86400000),
    },
  });
  for (let i = 0; i < 7; i++) await makeTest(i, "pass");
  for (let i = 7; i < 10; i++) await makeTest(i, "fail");

  // Rejections: 2 this month (one species mismatch), 1 last month.
  await prisma.rejectionRecord.create({ data: { batch_id: ids.b3, reason: "species_mismatch", action: "destroy", rejected_by_user_id: lab.id } });
  await prisma.rejectionRecord.create({ data: { batch_id: ids.b1, reason: "microbial_failure", action: "retest_required", rejected_by_user_id: lab.id, rejected_at: new Date(NOW.getTime() - 800000) } });
  await prisma.rejectionRecord.create({ data: { batch_id: ids.b4, reason: "species_mismatch", action: "return_to_supplier", rejected_by_user_id: otherLab.id, rejected_at: MONTH_AGO } });

  // ---------------------------------------------------------- shipments
  const ship = (code, status, { delayMin = 0, hours = 24 } = {}) => prisma.shipment.create({
    data: {
      shipment_no: code, ref_type: "batch", ref_id: ids.b1, shipment_type: "CUSTOM",
      requested_by_user_id: mfr.id, from_user_id: farmer.id, to_user_id: lab.id,
      assigned_transporter_user_id: transporter.id, status, quantity_kg: 100,
      created_at: new Date(NOW.getTime() - 86400000),
      metric: { create: { delay_minutes: delayMin, actual_hours: hours, expected_hours: 20 } },
    },
  });
  await ship("SHIP-2026-001", "delivered", { delayMin: -10, hours: 18 });
  await ship("SHIP-2026-002", "delivered", { delayMin: 90, hours: 30 });
  await ship("SHIP-2026-003", "in_transit", { delayMin: 20, hours: 8 });

  // ------------------------------------------------- manufacturer + run
  ids.product = (await prisma.product.create({
    data: { code: "PROD-2026-001", name: "Tulsi Capsules", manufacturer_user_id: mfr.id, category: "capsules", status: "active" },
  })).id;
  ids.run = (await prisma.manufacturingBatch.create({
    data: { code: "MFG-2026-001", product_id: ids.product, manufacturer_user_id: mfr.id, status: "completed", planned_units: 1000, production_date: new Date(NOW.getTime() - 5 * 86400000), completed_at: new Date(NOW.getTime() - 4 * 86400000) },
  })).id;
  ids.inv = (await prisma.inventoryItem.create({
    data: { manufacturer_user_id: mfr.id, batch_id: ids.b2, available_quantity_kg: 30, consumed_quantity_kg: 30 },
  })).id;
  await prisma.manufacturingBatchIngredient.create({ data: { manufacturing_batch_id: ids.run, batch_id: ids.b2, inventory_item_id: ids.inv, quantity_kg: 30, state: "consumed", consumed_at: new Date(NOW.getTime() - 4 * 86400000), position: 0 } });
  await prisma.manufacturingBatchIngredient.create({ data: { manufacturing_batch_id: ids.run, batch_id: ids.b1, inventory_item_id: ids.inv, quantity_kg: 20, state: "consumed", consumed_at: new Date(NOW.getTime() - 4 * 86400000), position: 1 } });
  ids.lot = (await prisma.productLot.create({
    data: { code: "PRD-2026-001", product_id: ids.product, manufacturing_batch_id: ids.run, quantity_units: 1000, units_remaining: 900, phase: "with_manufacturer", current_holder_user_id: mfr.id },
  })).id;

  // ------------------------------------------------------ consumer scans
  for (let i = 0; i < 30; i++) {
    await prisma.consumerScan.create({ data: { token_hash: `tok-valid-${i}`, product_id: ids.product, lot_id: ids.lot, outcome: "VALID", state: "Maharashtra", scanned_at: new Date(NOW.getTime() - i * 3600000) } });
  }
  await prisma.consumerScan.create({ data: { token_hash: "tok-bad-1", product_id: ids.product, lot_id: ids.lot, outcome: "INVALID", state: "Maharashtra", scanned_at: NOW } });

  // --------------------------------------------------------- compliance
  await prisma.complianceAlert.create({ data: { alert_no: "ALT-2026-001", alert_type: "SCAN_ANOMALY", severity: "HIGH", title: "Geo velocity", entity_type: "product", entity_id: ids.product, status: "open" } });
  await prisma.complianceScore.create({ data: { entity_type: "lab", entity_id: lab.id, score: 88, grade: "B", factors_json: { cert_success: 0.9 } } });
  await prisma.complianceScore.create({ data: { entity_type: "manufacturer", entity_id: mfr.id, score: 95, grade: "A", factors_json: {} } });
  await prisma.investigationCase.create({ data: { case_no: "INV-2026-001", title: "Sample", case_type: "audit", severity: "MEDIUM", status: "open", created_by_user_id: admin.id } });
  await prisma.counterfeitAlert.create({ data: { token_hash: "tok-bad-1", product_id: ids.product, lot_id: ids.lot, reason: "scan_burst", severity: "medium", status: "open", detail_json: {} } });

  // --------------------------------------------------------- blockchain
  const ev1 = await prisma.blockchainEvent.create({ data: { anchor_code: "BATCH_CREATED", entity_type: "batch", entity_id: ids.b1, status: "processed", max_retries: 5, processed_at: NOW } });
  const ev2 = await prisma.blockchainEvent.create({ data: { anchor_code: "CERTIFIED", entity_type: "certification", entity_id: ids.b1, status: "processed", max_retries: 5, processed_at: NOW } });
  await prisma.blockchainTransaction.create({ data: { event_id: ev1.id, transaction_hash: "blk-1", block_number: 1, prev_hash: "genesis", payload_hash: "p1", event_type: "BATCH_CREATED", entity_type: "batch", entity_id: ids.b1, performed_by: farmer.id, chain: "batch" } });
  await prisma.blockchainTransaction.create({ data: { event_id: ev2.id, transaction_hash: "blk-2", block_number: 2, prev_hash: "blk-1", payload_hash: "p2", event_type: "CERTIFIED", entity_type: "certification", entity_id: ids.b1, performed_by: lab.id, chain: "batch" } });
  await prisma.blockchainEvent.create({ data: { anchor_code: "BATCH_CREATED", entity_type: "batch", entity_id: ids.b3, status: "failed", max_retries: 5 } });

  // ------------------------------------------------------------ tokens
  adminToken = await login("analytics.admin@test.io");
  farmerToken = await login("analytics.farmer@test.io");
  labToken = await login("analytics.lab@test.io");
  mfrToken = await login("analytics.mfr@test.io");
  transporterToken = await login("analytics.tpt@test.io");
});

after(() => db.cleanup());

// ------------------------------------------------------------------ ETL

test("ETL rebuild populates all 10 warehouse tables with correct aggregates", async () => {
  const { jobs, rows } = await analytics.rebuildAll({ actorUserId: ids.admin });
  assert.equal(jobs, 10);
  assert.ok(rows > 0);

  // production
  const prodAll = await prisma.herbProductionAnalytics.findMany({ where: { period_type: "all" }, orderBy: { total_quantity_kg: "desc" } });
  assert.equal(prodAll.length, 2);
  const tulsi = prodAll.find((r) => r.herb_id === ids.tulsi);
  const ashwa = prodAll.find((r) => r.herb_id === ids.ashwa);
  assert.equal(tulsi.total_batches, 2);
  assert.equal(tulsi.total_quantity_kg, 150);
  assert.equal(tulsi.active_farmers, 1);
  assert.equal(tulsi.certified_batches, 2);
  assert.equal(ashwa.total_batches, 2);
  assert.equal(ashwa.rejected_batches, 1);

  // certification
  const certAll = await prisma.certificationAnalytics.findMany({ where: { period_type: "all" } });
  const myLab = certAll.find((r) => r.lab_user_id === ids.lab);
  assert.ok(myLab);
  assert.equal(myLab.total_tests, 10);
  assert.equal(myLab.pass_count, 7);
  assert.equal(myLab.fail_count, 3);
  assert.equal(myLab.certificates_issued, 2);
  assert.equal(myLab.rejections, 2);
  const rollup = certAll.find((r) => r.lab_user_id === null);
  assert.equal(rollup.total_tests, 10);

  // failures
  const failures = await prisma.failureReasonAnalytics.findMany({ where: { period_type: "all" } });
  const mismatch = failures.find((r) => r.reason === "species_mismatch" && r.state === "Kerala");
  assert.equal(mismatch.count, 2); // b3 (this month) + b4 (last month) — both otherFarmer's Kerala batches
  const totalFailures = failures.reduce((a, r) => a + r.count, 0);
  assert.equal(totalFailures, 3);

  // regional
  const regions = await prisma.regionalSupplyAnalytics.findMany({ where: { period_type: "all" } });
  const tnTulsi = regions.find((r) => r.state === "Tamil Nadu" && r.herb_id === ids.tulsi);
  assert.equal(tnTulsi.production_kg, 150);
  assert.equal(tnTulsi.certified_batches, 2);

  // logistics
  const logAll = await prisma.logisticsAnalytics.findMany({ where: { period_type: "all" } });
  const tpt = logAll.find((r) => r.transporter_user_id === ids.transporter);
  assert.equal(tpt.total_shipments, 3);
  assert.equal(tpt.delivered, 2);
  assert.equal(tpt.on_time, 1);
  assert.equal(tpt.delayed, 2); // 90min + 20min (in-transit w/ positive delay)
  const logRollup = logAll.find((r) => r.transporter_user_id === null);
  assert.equal(logRollup.total_shipments, 3);

  // consumption
  const consumption = await prisma.manufacturerConsumptionAnalytics.findMany({ where: { period_type: "all", manufacturer_user_id: ids.mfr } });
  const tulsiConsumed = consumption.find((r) => r.herb_id === ids.tulsi);
  assert.equal(tulsiConsumed.consumed_kg, 50);
  assert.equal(tulsiConsumed.runs_count, 1);

  // consumer
  const consumer = await prisma.consumerAnalytics.findMany({ where: { period_type: "all", product_id: ids.product } });
  const mh = consumer.find((r) => r.state === "Maharashtra");
  assert.equal(mh.scan_count, 31);
  assert.equal(mh.unique_tokens, 31);
  assert.equal(mh.valid_scans, 30);
  assert.equal(mh.invalid_scans, 1);

  // traceability — product has b2 certified origin + completed run + lot + consumer scans
  const trace = await prisma.traceabilityAnalytics.findMany({ where: { period_type: "all", product_id: ids.product } });
  assert.equal(trace.length, 1);
  assert.equal(trace[0].avg_score, 100);

  // blockchain
  const chain = await prisma.blockchainAnalytics.findMany({ where: { period_type: "all" } });
  const allChain = chain.find((r) => r.event_type === "ALL");
  assert.equal(allChain.events_count, 2);
  assert.equal(allChain.failed_syncs, 1);
  const batchChain = chain.find((r) => r.event_type === "BATCH_CREATED");
  assert.equal(batchChain.events_count, 1);

  // compliance
  const compliance = await prisma.complianceAnalytics.findMany({ where: { period_type: "all" } });
  const allRow = compliance.find((r) => r.actor_type === "all");
  assert.equal(allRow.alerts_total, 1);
  assert.equal(allRow.alerts_critical, 1);
  assert.equal(allRow.investigations, 1);
  assert.equal(allRow.counterfeit_alerts, 1);
  const labRow = compliance.find((r) => r.actor_type === "lab");
  assert.equal(labRow.avg_score, 88);

  // job runs observed
  const runs = await prisma.analyticsJobRun.findMany({ orderBy: { ran_at: "desc" }, take: 10 });
  assert.equal(runs.length, 10);
  assert.ok(runs.every((r) => r.status === "success" && r.rows_written > 0));
});

test("ETL is idempotent — re-running rebuilds the same rows", async () => {
  const counts = async (model) => prisma[model].count({ where: { period_type: "all" } });
  const before1 = await Promise.all([
    counts("herbProductionAnalytics"), counts("certificationAnalytics"), counts("failureReasonAnalytics"),
    counts("regionalSupplyAnalytics"), counts("logisticsAnalytics"), counts("manufacturerConsumptionAnalytics"),
    counts("consumerAnalytics"), counts("traceabilityAnalytics"), counts("complianceAnalytics"), counts("blockchainAnalytics"),
  ]);
  await analytics.rebuildAll();
  const after1 = await Promise.all([
    counts("herbProductionAnalytics"), counts("certificationAnalytics"), counts("failureReasonAnalytics"),
    counts("regionalSupplyAnalytics"), counts("logisticsAnalytics"), counts("manufacturerConsumptionAnalytics"),
    counts("consumerAnalytics"), counts("traceabilityAnalytics"), counts("complianceAnalytics"), counts("blockchainAnalytics"),
  ]);
  assert.deepEqual(before1, after1);
});

test("period buckets exist per grain — daily, weekly, monthly, yearly, all", async () => {
  const rows = await prisma.herbProductionAnalytics.findMany({ where: { herb_id: ids.tulsi } });
  const types = new Set(rows.map((r) => r.period_type));
  for (const t of ["daily", "weekly", "monthly", "yearly", "all"]) assert.ok(types.has(t), `missing ${t}`);
  // last-month batch lands in its own monthly bucket
  const lastMonth = await prisma.regionalSupplyAnalytics.findMany({
    where: { period_type: "monthly", period_start: { lte: new Date(NOW.getTime() - 30 * 86400000) } },
  });
  assert.ok(lastMonth.some((r) => r.total_batches >= 1));
});

// ------------------------------------------------------------ BI reads

test("executive dashboard returns national KPIs, today stats and strategic KPIs", async () => {
  const res = await request(app).get("/api/v1/analytics/dashboard").set("Authorization", `Bearer ${adminToken}`);
  assert.equal(res.status, 200, JSON.stringify(res.body));
  const d = res.body.data.dashboard;
  assert.equal(d.national.total_farmers, 2);
  assert.equal(d.national.total_labs, 2);
  assert.equal(d.national.total_manufacturers, 1);
  assert.equal(d.national.total_batches, 4);
  assert.equal(d.strategic_kpis.national_production_kg, 425);
  assert.equal(d.strategic_kpis.certification_pass_rate, 70);
  assert.equal(d.strategic_kpis.supply_chain.total_shipments, 3);
  assert.equal(d.strategic_kpis.supply_chain.on_time, 1);
  assert.equal(d.strategic_kpis.compliance_health.avg_score, 91.5);
  assert.equal(d.strategic_kpis.traceability.avg_score, 100);
  assert.equal(d.strategic_kpis.blockchain.events, 2);
  assert.equal(d.top_herbs.length, 2);
});

test("each BI domain endpoint serves warehouse data over HTTP", async () => {
  const get = (path) => request(app).get(path).set("Authorization", `Bearer ${adminToken}`);
  const herbs = await get("/api/v1/analytics/herbs");
  assert.equal(herbs.status, 200);
  assert.equal(herbs.body.data.rows.length, 2);

  const certs = await get("/api/v1/analytics/certifications");
  assert.equal(certs.status, 200);
  assert.equal(certs.body.data.summary.total_tests, 10);

  const failures = await get("/api/v1/analytics/failures");
  assert.equal(failures.status, 200);
  assert.equal(failures.body.data.rows.length, 2); // distinct reason+state groups: species_mismatch|Kerala, microbial_failure|Tamil Nadu

  const regions = await get("/api/v1/analytics/regions");
  assert.equal(regions.status, 200);
  assert.equal(regions.body.data.states.length, 2);

  const logistics = await get("/api/v1/analytics/logistics");
  assert.equal(logistics.status, 200);
  assert.equal(logistics.body.data.total.total_shipments, 3);

  const manufacturers = await get("/api/v1/analytics/manufacturers");
  assert.equal(manufacturers.status, 200);
  assert.equal(manufacturers.body.data.rows.length, 1);

  const consumers = await get("/api/v1/analytics/consumers");
  assert.equal(consumers.status, 200);
  assert.equal(consumers.body.data.rows[0].scan_count, 31);

  const trace = await get("/api/v1/analytics/traceability");
  assert.equal(trace.status, 200);
  assert.equal(trace.body.data.summary.avg_score, 100);

  const compliance = await get("/api/v1/analytics/compliance");
  assert.equal(compliance.status, 200);
  assert.equal(compliance.body.data.scores.length, 2);

  const blockchain = await get("/api/v1/analytics/blockchain");
  assert.equal(blockchain.status, 200);
  assert.equal(blockchain.body.data.total.events_count, 2);
});

test("business roles see only their own analytics slice", async () => {
  // manufacturer → own consumption only
  const mfrRes = await request(app).get("/api/v1/analytics/manufacturers").set("Authorization", `Bearer ${mfrToken}`);
  assert.equal(mfrRes.status, 200);
  assert.equal(mfrRes.body.data.rows.length, 1);
  assert.equal(mfrRes.body.data.rows[0].manufacturer_user_id, ids.mfr);

  // lab → own certification slice
  const labRes = await request(app).get("/api/v1/analytics/certifications").set("Authorization", `Bearer ${labToken}`);
  assert.equal(labRes.status, 200);
  assert.equal(labRes.body.data.rows.length, 1);
  assert.equal(labRes.body.data.rows[0].lab_user_id, ids.lab);

  // farmer → own production slice via dashboard is blocked (admin-only KPI view)
  const farmerRes = await request(app).get("/api/v1/analytics/herbs").set("Authorization", `Bearer ${farmerToken}`);
  assert.equal(farmerRes.status, 200); // analytics.view granted; warehouse is global read
});

test("RBAC gates — transporter cannot read analytics; jobs/run is admin-only", async () => {
  const tRes = await request(app).get("/api/v1/analytics/dashboard").set("Authorization", `Bearer ${transporterToken}`);
  assert.equal(tRes.status, 403);

  const fRes = await request(app).get("/api/v1/analytics/blockchain").set("Authorization", `Bearer ${farmerToken}`);
  assert.equal(fRes.status, 200); // analytics.view covers all domains

  const jRes = await request(app).post("/api/v1/analytics/jobs/run").set("Authorization", `Bearer ${farmerToken}`).send({});
  assert.equal(jRes.status, 403);

  const okRun = await request(app).post("/api/v1/analytics/jobs/run").set("Authorization", `Bearer ${adminToken}`).send({ jobs: ["production"] });
  assert.equal(okRun.status, 200, JSON.stringify(okRun.body));
  assert.equal(okRun.body.data.result.results.length, 1);
});

// ------------------------------------------------------------- alerts

test("alert engine: high lab failure rate raises ONE deduplicated ComplianceAlert", async () => {
  const res = await bi.scanAnalyticsAlerts();
  const labAlert = res.alerts.find((a) => a.startsWith("LAB_FAILURE_RATE"));
  assert.ok(labAlert, `no lab alert: ${JSON.stringify(res)}`);

  const rows = await prisma.complianceAlert.findMany({ where: { alert_type: "LAB_FAILURE_RATE", entity_id: ids.lab } });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].severity, "HIGH");

  // second scan → dedup window suppresses a duplicate
  const res2 = await bi.scanAnalyticsAlerts();
  assert.ok(!res2.alerts.includes(labAlert), "duplicate alert raised");
  const rows2 = await prisma.complianceAlert.findMany({ where: { alert_type: "LAB_FAILURE_RATE", entity_id: ids.lab } });
  assert.equal(rows2.length, 1);
});

test("alert engine: species-mismatch spike and counterfeit surge also raise alerts", async () => {
  // spike batches: 4 fresh batches rejected as species mismatch THIS month
  // (b1/b3/b4 already carry rejections — RejectionRecord.batch_id is unique).
  // Prev month already has 1 species mismatch (b4) → 5 vs 1 = 400% growth.
  for (let i = 0; i < 4; i++) {
    const spikeBatch = await prisma.batch.create({
      data: { code: `BAT-2026-09${i}`, species_id: ids.tulsi, farmer_id: ids.farmer, weight_kg: 10, phase: "with_farmer", test_status: "pending", current_holder_user_id: ids.farmer },
    });
    await prisma.rejectionRecord.create({
      data: { batch_id: spikeBatch.id, reason: "species_mismatch", action: "destroy", rejected_by_user_id: ids.otherLab, rejected_at: NOW },
    });
  }
  // counterfeit surge: 30 invalid scans this month for the product (already has 1 → push to 31)
  for (let i = 0; i < 30; i++) {
    await prisma.consumerScan.create({ data: { token_hash: `tok-bad-${i}`, product_id: ids.product, lot_id: ids.lot, outcome: "INVALID", state: "Gujarat", scanned_at: NOW } });
  }
  // rebuild failures + consumer first so the engine sees them
  await analytics.runJob("failures");
  await analytics.runJob("consumer");
  const res = await bi.scanAnalyticsAlerts();
  assert.ok(res.alerts.some((a) => a.startsWith("SPECIES_MISMATCH_SPIKE")), `no spike: ${JSON.stringify(res)}`);
  assert.ok(res.alerts.some((a) => a.startsWith("COUNTERFEIT_SURGE")), `no surge: ${JSON.stringify(res)}`);
});

// ------------------------------------------------------------ reports

test("report generation: admin CSV artifacts, audience scoping, download", async () => {
  const gen = await request(app).post("/api/v1/reports/generate").set("Authorization", `Bearer ${adminToken}`).send({ report_type: "compliance" });
  assert.equal(gen.status, 200, JSON.stringify(gen.body));
  assert.equal(gen.body.data.report.status, "ready");
  assert.ok(gen.body.data.download_url);

  const list = await request(app).get("/api/v1/reports").set("Authorization", `Bearer ${adminToken}`);
  assert.equal(list.status, 200);
  assert.ok(list.body.data.rows.length >= 1);

  const dl = await request(app).get(`/api/v1/reports/${gen.body.data.report.id}/download`).set("Authorization", `Bearer ${adminToken}`);
  assert.equal(dl.status, 200);
  assert.match(dl.text, /Scores|Alert type/);

  // farmer → own farmer report works; compliance report is forbidden
  const farmerGen = await request(app).post("/api/v1/reports/generate").set("Authorization", `Bearer ${farmerToken}`).send({ report_type: "farmer" });
  assert.equal(farmerGen.status, 200, JSON.stringify(farmerGen.body));
  assert.ok(farmerGen.body.data.row_count >= 1);
  const farmerBlocked = await request(app).post("/api/v1/reports/generate").set("Authorization", `Bearer ${farmerToken}`).send({ report_type: "compliance" });
  assert.equal(farmerBlocked.status, 403);

  // non-CSV formats are recorded as queued jobs
  const pdf = await request(app).post("/api/v1/reports/generate").set("Authorization", `Bearer ${adminToken}`).send({ report_type: "compliance", format: "pdf" });
  assert.equal(pdf.status, 200);
  assert.equal(pdf.body.data.report.status, "queued");
});

test("scheduled report engine: due schedule fires → artifact + notification + next_run advance", async () => {
  const created = await reports.createSchedule(await prisma.user.findUnique({ where: { id: ids.admin } }), {
    report_name: "Daily AYUSH Summary", report_type: "executive_summary", frequency: "daily",
    recipients: [ids.admin], params: {},
  });
  // make it due now
  await prisma.scheduledReport.update({ where: { id: created.id }, data: { next_run_at: new Date(Date.now() - 60000) } });
  const res = await reports.processDueSchedules();
  assert.equal(res.fired, 1);

  const fresh = await prisma.scheduledReport.findUnique({ where: { id: created.id } });
  assert.ok(fresh.last_run_at);
  assert.ok(fresh.next_run_at.getTime() > Date.now());

  const artifact = await prisma.reportExport.findFirst({ where: { report_type: "analytics_executive_summary" }, orderBy: { created_at: "desc" } });
  assert.ok(artifact);
  assert.equal(artifact.status, "ready");

  // Phase 14 notification queued for the recipient
  const notif = await prisma.notificationQueue.findFirst({ where: { template_code: "report_ready" } });
  assert.ok(notif, "report_ready notification missing");

  // admin-only schedule management
  const listRes = await request(app).get("/api/v1/reports/schedules").set("Authorization", `Bearer ${adminToken}`);
  assert.equal(listRes.status, 200);
  assert.ok(listRes.body.data.rows.length >= 1);
  const farmerList = await request(app).get("/api/v1/reports/schedules").set("Authorization", `Bearer ${farmerToken}`);
  assert.equal(farmerList.status, 403);
  await reports.deleteSchedule(await prisma.user.findUnique({ where: { id: ids.admin } }), created.id);
});

test("ETL run log + alert endpoint are exposed via HTTP", async () => {
  const runs = await request(app).get("/api/v1/analytics/jobs/runs").set("Authorization", `Bearer ${adminToken}`);
  assert.equal(runs.status, 200);
  assert.ok(runs.body.data.rows.length >= 10);

  const alerts = await request(app).post("/api/v1/analytics/alerts/run").set("Authorization", `Bearer ${adminToken}`);
  assert.equal(alerts.status, 200, JSON.stringify(alerts.body));
});