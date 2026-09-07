/**
 * Phase 11 consumer verification tests (docs/phase_11.md).
 *
 * Verifies on an isolated DB (env tuned so the suite never trips the public
 * rate limiter and counterfeit thresholds are deterministic):
 *  - public passport: scan -> VERIFIED passport with all nine sections
 *  - privacy: no emails / phones / internal ids / PII on the public wire
 *  - GET passport / journey / certificate views (side-effect free)
 *  - cache: fast path + expiry + purge on recall
 *  - recall: product recalled -> RECALLED passport + do-not-consume notice
 *  - under investigation: open counterfeit alert -> UNDER_INVESTIGATION
 *  - invalid: unknown token -> INVALID not_found; revoked QR -> INVALID
 *  - counterfeit detection: scan burst + geo velocity + revoked-token alerts
 *  - analytics: AYUSH totals + manufacturer scoping + farmer denied
 */
process.env.PUBLIC_VERIFY_RATE_LIMIT = "10000";
process.env.COUNTERFEIT_BURST_COUNT = "10";
process.env.COUNTERFEIT_DAILY_VOLUME = "1000";
process.env.COUNTERFEIT_UNKNOWN_BURST = "50";

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { setupDb } = require("./_db");

const db = setupDb();
const { prisma } = require("../../src/db/client");
const { seedRbac } = require("../../src/db/rbac");
const { hashPassword } = require("../../src/services/passwords");
const { createApp } = require("../../src/app");

const FARM_LAT = 10.1234;
const FARM_LNG = 78.1234;
const LAB_LAT = 13.0827;
const LAB_LNG = 80.2707;
const PUNE_LAT = 18.5204;
const PUNE_LNG = 73.8567;

let app;

async function makeUser(email, role, { verified = false, labRole = null } = {}) {
  const user = await prisma.user.create({
    data: {
      name: role,
      email,
      password_hash: hashPassword("password1"),
      role,
      lab_role: labRole,
      kyc_status: verified ? "verified" : "pending",
      is_active: true,
    },
  });
  const login = await request(app).post("/api/v1/auth/login").send({ identifier: email, password: "password1" });
  return { user, token: login.body.data.access_token };
}

async function uploadAsset(token) {
  const up = await request(app)
    .post("/api/v1/uploads")
    .set("Authorization", `Bearer ${token}`)
    .attach("file", Buffer.from("fake-image-bytes"), { filename: "h.jpg", contentType: "image/jpeg" });
  assert.equal(up.status, 201, JSON.stringify(up.body));
  return up.body.data.asset;
}

async function createBatch(farmerToken, qty = 20) {
  const asset = await uploadAsset(farmerToken);
  const res = await request(app)
    .post("/api/v1/batches")
    .set("Authorization", `Bearer ${farmerToken}`)
    .send({
      species_code: "ashwagandha",
      quantity: qty,
      unit: "kg",
      harvest_date: "2026-09-04",
      cultivation_type: "organic",
      gps_lat: FARM_LAT,
      gps_lng: FARM_LNG,
      asset_ids: [asset.id],
    });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body.data.batch;
}

async function tokenOf(batchId, holderToken) {
  const res = await request(app).get(`/api/v1/batches/${batchId}/qr`).set("Authorization", `Bearer ${holderToken}`);
  assert.equal(res.status, 200, JSON.stringify(res.body));
  return res.body.data.qr.url.split("/qr/")[1];
}

// ---- governed custody (Phase 6 API) ----
const tr = (token, body) => request(app).post("/api/v1/transfers/request").set("Authorization", `Bearer ${token}`).send(body);
const ta = (token, body) => request(app).post("/api/v1/transfers/approve").set("Authorization", `Bearer ${token}`).send(body);

async function governedHop(requester, approver, executor, batchId) {
  const r = await tr(requester.token, { batch_id: batchId });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const a = await ta(approver.token, { request_id: r.body.data.request.id });
  assert.equal(a.status, 200, JSON.stringify(a.body));
  const e = await request(app)
    .post("/api/v1/transfers/execute")
    .set("Authorization", `Bearer ${executor.token}`)
    .send({ token: await tokenOf(batchId, approver.token) });
  assert.equal(e.status, 200, JSON.stringify(e.body));
  return r.body.data.request;
}

// ---- lab certification helpers (Phase 8 API) ----
const labsReceive = (token, body) => request(app).post("/api/v1/labs/batches/receive").set("Authorization", `Bearer ${token}`).send(body);
const labsSamples = (token, body) => request(app).post("/api/v1/labs/samples").set("Authorization", `Bearer ${token}`).send(body);
const labsTests = (token, body) => request(app).post("/api/v1/labs/tests").set("Authorization", `Bearer ${token}`).send(body);
const labsResults = (token, testId, body) => request(app).post(`/api/v1/labs/tests/${testId}/results`).set("Authorization", `Bearer ${token}`).send(body);
const labsSubmit = (token, testId) => request(app).post(`/api/v1/labs/tests/${testId}/submit`).set("Authorization", `Bearer ${token}`).send({});
const labsReview = (token, body) => request(app).post("/api/v1/labs/reviews").set("Authorization", `Bearer ${token}`).send(body);
const labsCertify = (token, body) => request(app).post("/api/v1/labs/certificates").set("Authorization", `Bearer ${token}`).send(body);

/** Full lab run on a fresh farmer batch: create -> governed to lab -> certify. */
async function certifyBatch(qty = 20) {
  const batch = await createBatch(farmer.token, qty);
  await governedHop(transporter, farmer, transporter, batch.id);
  await governedHop(lab, transporter, lab, batch.id);

  const r = await labsReceive(lab.token, { batch_id: batch.id, receiver_name: "Lab In-charge", condition_status: "good" });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const s = await labsSamples(lab.token, { batch_id: batch.id, sample_weight_kg: 0.5, remarks: "sample A" });
  assert.equal(s.status, 201, JSON.stringify(s.body));
  const sampleId = s.body.data.sample.id;

  const testIds = [];
  for (const [category, name, code, observed] of [
    ["physical", "Moisture content", "moisture", 7.2],
    ["safety", "Heavy metals screen", "lead", 0.4],
  ]) {
    const t = await labsTests(lab.token, { sample_id: sampleId, test_category: category, test_name: name });
    assert.equal(t.status, 201, JSON.stringify(t.body));
    const id = t.body.data.test.id;
    const p = await labsResults(lab.token, id, { parameter_code: code, observed_value: observed, unit: code === "moisture" ? "%" : "ppm", result: "pass" });
    assert.equal(p.status, 201, JSON.stringify(p.body));
    const sub = await labsSubmit(lab.token, id);
    assert.equal(sub.status, 200, JSON.stringify(sub.body));
    testIds.push(id);
  }
  for (const id of testIds) {
    const rv = await labsReview(supervisor.token, { test_id: id, review_status: "approved", notes: "ok" });
    assert.equal(rv.status, 200, JSON.stringify(rv.body));
  }
  const c = await labsCertify(supervisor.token, { batch_id: batch.id });
  assert.equal(c.status, 201, JSON.stringify(c.body));
  return { batch, certification: c.body.data.certification };
}

// ---- shipment API helpers (Phase 7 engine) ----
const assignShip = (token, id, body) => request(app).post(`/api/v1/shipments/${id}/assign`).set("Authorization", `Bearer ${token}`).send(body);
const acceptShip = (token, id) => request(app).post(`/api/v1/shipments/${id}/accept`).set("Authorization", `Bearer ${token}`).send({});
const arriveShip = (token, id, body) => request(app).post(`/api/v1/shipments/${id}/arrive`).set("Authorization", `Bearer ${token}`).send(body);
const pickupShip = (token, id, body) => request(app).post(`/api/v1/shipments/${id}/pickup`).set("Authorization", `Bearer ${token}`).send(body);
const locationShip = (token, id, body) => request(app).post(`/api/v1/shipments/${id}/location`).set("Authorization", `Bearer ${token}`).send(body);
const arrDestShip = (token, id, body) => request(app).post(`/api/v1/shipments/${id}/arrive-destination`).set("Authorization", `Bearer ${token}`).send(body);
const deliverShip = (token, id, body) => request(app).post(`/api/v1/shipments/${id}/deliver`).set("Authorization", `Bearer ${token}`).send(body);

// ---- procurement API helpers (Phase 9) ----
const reqBatch = (token, body) => request(app).post("/api/v1/manufacturer/request-batch").set("Authorization", `Bearer ${token}`).send(body);
const approveReq = (token, id) => request(app).post(`/api/v1/manufacturer/requests/${id}/approve`).set("Authorization", `Bearer ${token}`).send({});
const receiveGrn = (token, body) => request(app).post("/api/v1/manufacturer/receive").set("Authorization", `Bearer ${token}`).send(body);

/** Runs the auto-created LAB_TO_MANUFACTURER shipment to a DELIVERED state. */
async function runShipmentDelivered({ request: req, dest }) {
  const shipmentId = req.shipment.id;
  const batchId = req.batch.id;

  const pickupReq = await tr(transporter.token, { batch_id: batchId });
  assert.equal(pickupReq.status, 201, JSON.stringify(pickupReq.body));
  const pickupApprove = await ta(lab.token, { request_id: pickupReq.body.data.request.id });
  assert.equal(pickupApprove.status, 200, JSON.stringify(pickupApprove.body));

  const asg = await assignShip(dest.token, shipmentId, { transporter_user_id: transporter.user.id });
  assert.equal(asg.status, 200, JSON.stringify(asg.body));
  const acc = await acceptShip(transporter.token, shipmentId);
  assert.equal(acc.status, 200, JSON.stringify(acc.body));
  const arr = await arriveShip(transporter.token, shipmentId, { gps_lat: LAB_LAT, gps_lng: LAB_LNG });
  assert.equal(arr.status, 200, JSON.stringify(arr.body));
  const pk = await pickupShip(transporter.token, shipmentId, { token: await tokenOf(batchId, lab.token), gps_lat: LAB_LAT, gps_lng: LAB_LNG });
  assert.equal(pk.status, 200, JSON.stringify(pk.body));
  const mv = await locationShip(transporter.token, shipmentId, { gps_lat: 16.0, gps_lng: 76.5 });
  assert.equal(mv.status, 200, JSON.stringify(mv.body));
  const ad = await arrDestShip(transporter.token, shipmentId, { gps_lat: PUNE_LAT, gps_lng: PUNE_LNG });
  assert.equal(ad.status, 200, JSON.stringify(ad.body));

  const delReq = await tr(dest.token, { batch_id: batchId });
  assert.equal(delReq.status, 201, JSON.stringify(delReq.body));
  const delApprove = await ta(transporter.token, { request_id: delReq.body.data.request.id });
  assert.equal(delApprove.status, 200, JSON.stringify(delApprove.body));
  const d = await deliverShip(dest.token, shipmentId, {
    token: await tokenOf(batchId, transporter.token),
    gps_lat: PUNE_LAT,
    gps_lng: PUNE_LNG,
    receiver_name: "Stores in-charge",
    receiver_signature: "S. Kumar (stores)",
  });
  assert.equal(d.status, 200, JSON.stringify(d.body));
  return d.body.data.shipment;
}

/** Full procurement journey for one certified batch: request -> approve -> deliver -> GRN. */
async function receiveStock({ qty = 20, dest = manufacturer } = {}) {
  const { batch } = await certifyBatch(qty);
  const req = await reqBatch(dest.token, { batch_id: batch.id, requested_quantity_kg: qty });
  assert.equal(req.status, 201, JSON.stringify(req.body));
  const ap = await approveReq(lab.token, req.body.data.request.id);
  assert.equal(ap.status, 200, JSON.stringify(ap.body));
  const shipped = await runShipmentDelivered({ request: ap.body.data.request, dest });
  const grn = await receiveGrn(dest.token, { shipment_id: shipped.id, accepted_quantity_kg: qty });
  assert.equal(grn.status, 201, JSON.stringify(grn.body));
  return { batch, request: ap.body.data.request, grn: grn.body.data.grn };
}

let farmer, transporter, lab, supervisor, manufacturer, manufacturer2, admin;

before(async () => {
  await seedRbac();
  await prisma.species.createMany({
    data: [
      { code: "ashwagandha", common_name: "Ashwagandha", scientific_name: "Withania somnifera", is_active: true },
      { code: "tulsi", common_name: "Tulsi", scientific_name: "Ocimum sanctum", is_active: true },
    ],
  });
  await prisma.testParameter.createMany({
    data: [
      { code: "moisture", name: "Moisture content", category: "physical", unit: "%", is_active: true },
      { code: "lead", name: "Lead (Pb)", category: "safety", unit: "ppm", is_active: true },
    ],
  });
  app = createApp();

  farmer = await makeUser("vf@x.dev", "farmer", { verified: true });
  transporter = await makeUser("vt@x.dev", "transporter", { verified: true });
  lab = await makeUser("vl@x.dev", "lab", { verified: true });
  supervisor = await makeUser("vs@x.dev", "lab", { verified: true, labRole: "supervisor" });
  manufacturer = await makeUser("vm1@x.dev", "manufacturer", { verified: true });
  manufacturer2 = await makeUser("vm2@x.dev", "manufacturer", { verified: true });
  admin = await makeUser("va@x.dev", "admin");
  await prisma.warehouse.create({
    data: { owner_user_id: manufacturer.user.id, kind: "factory_godown", name: "Pune plant", gps_lat: PUNE_LAT, gps_lng: PUNE_LNG },
  });
  // AYUSH-licensed manufacturer (passport §3 + trust score).
  await prisma.manufacturerProfile.create({
    data: {
      manufacturer_id: manufacturer.user.id,
      company_name: "ABC Ayurveda Pvt Ltd",
      ayush_license_no: "AYUSH-LIC-001",
      facility_city: "Pune",
      verification_status: "verified",
    },
  });
  // Farmer default address -> passport origin section (privacy-safe subset).
  await prisma.address.create({
    data: {
      user_id: farmer.user.id,
      kind: "registered",
      line1: "1, Farm Road",
      city: "Salem",
      district: "Salem",
      state: "Tamil Nadu",
      is_default: true,
    },
  });
});

after(async () => {
  await prisma.$disconnect();
  db.cleanup();
});

// ---- product API helpers (Phase 10) ----
const createProductApi = (token, body) => request(app).post("/api/v1/products").set("Authorization", `Bearer ${token}`).send(body);
const addFormulaApi = (token, id, body) => request(app).post(`/api/v1/products/${id}/formulas`).set("Authorization", `Bearer ${token}`).send(body);
const createRunApi = (token, body) => request(app).post("/api/v1/manufacturing/batches").set("Authorization", `Bearer ${token}`).send(body);
const startRunApi = (token, id) => request(app).post(`/api/v1/manufacturing/batches/${id}/start`).set("Authorization", `Bearer ${token}`).send({});
const completeRunApi = (token, id, body = {}) => request(app).post(`/api/v1/manufacturing/batches/${id}/complete`).set("Authorization", `Bearer ${token}`).send(body);
const flagImpactApi = (token, body) => request(app).post("/api/v1/manufacturing/impacts").set("Authorization", `Bearer ${token}`).send(body);

// ---- public verify helpers ----
const scanApi = (body) => request(app).post("/verify/scan").send(body);
const passportApi = (token) => request(app).get(`/verify/product/${encodeURIComponent(token)}`);
const journeyApi = (token) => request(app).get(`/verify/product/${encodeURIComponent(token)}/journey`);
const certApi = (token) => request(app).get(`/verify/product/${encodeURIComponent(token)}/certificate`);

/** Full journey: certified batch -> manufacturer stock -> finished lot + QR. */
async function runToCompletion(over = {}) {
  const { batch } = await receiveStock(over);
  const p = await createProductApi(manufacturer.token, {
    name: "Ashwagandha Capsules",
    category: "capsule",
    pack_size: "60 capsules",
    expiry_months: 24,
  });
  assert.equal(p.status, 201, JSON.stringify(p.body));
  const product = p.body.data.product;
  const f = await addFormulaApi(manufacturer.token, product.id, { species_code: "ashwagandha", standard_quantity: 10, unit: "kg" });
  assert.equal(f.status, 201, JSON.stringify(f.body));
  const run = await createRunApi(manufacturer.token, {
    product_id: product.id,
    planned_units: 500,
    ingredients: [{ batch_id: batch.id, quantity_kg: over.consumeKg ?? 5 }],
  });
  assert.equal(run.status, 201, JSON.stringify(run.body));
  await startRunApi(manufacturer.token, run.body.data.run.id);
  const done = await completeRunApi(manufacturer.token, run.body.data.run.id);
  assert.equal(done.status, 200, JSON.stringify(done.body));
  return { batch, product, run: done.body.data.run, lot: done.body.data.lot, qr: done.body.data.qr };
}

// ------------------------------------------------------------ passport

test("public passport: scan -> VERIFIED passport with all nine sections, privacy-safe", async () => {
  const { batch, product, lot, qr } = await runToCompletion();

  const res = await scanApi({
    token: qr.raw,
    country: "IN",
    state: "Tamil Nadu",
    city: "Salem",
    device_type: "mobile",
    gps_lat: FARM_LAT,
    gps_lng: FARM_LNG,
  });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  const p = res.body.data;
  assert.equal(p.verified, true);
  assert.equal(p.verification_status, "VERIFIED");
  assert.equal(p.reason, null);
  assert.equal(p.badge.tone, "success");
  assert.equal(p.badge.label, "Verified");

  // §1 identity
  assert.equal(p.product.name, "Ashwagandha Capsules");
  assert.equal(p.product.pack_size, "60 capsules");
  assert.equal(p.product.category, "capsule");
  assert.equal(p.product.lot_code, lot.code);
  // §2 authenticity
  assert.equal(p.verified, true);
  // §3 manufacturer (licensed + location + dates)
  assert.equal(p.manufacturer.name, "ABC Ayurveda Pvt Ltd");
  assert.equal(p.manufacturer.license.number, "AYUSH-LIC-001");
  assert.equal(p.manufacturer.license.status, "active");
  assert.equal(p.manufacturer.location, "Pune"); // facility city from the manufacturer profile
  assert.ok(p.manufacturer.production_date);
  assert.ok(p.manufacturer.expiry_date);
  // §4 ingredients (consumer-friendly species names)
  assert.ok(p.ingredients.some((i) => i.species === "Ashwagandha" && i.quantity_kg === 5));
  // §5 origin farms — name + district only
  assert.equal(p.origin.farm_count, 1);
  assert.equal(p.origin.regions[0], "Tamil Nadu");
  assert.equal(p.origin.farms[0].farmer, "farmer");
  assert.equal(p.origin.farms[0].district, "Salem");
  assert.equal(p.origin.farms[0].batch_code, batch.code);
  // §6 lab certification
  assert.equal(p.certificates.length, 1);
  assert.equal(p.certificates[0].status, "PASS");
  assert.ok(p.certificates[0].certificate_number);
  assert.ok(p.certificates[0].issued_at);
  // §7 journey stages
  const stages = p.journey.map((j) => j.stage);
  assert.ok(stages.includes("HARVESTED"));
  assert.ok(stages.includes("TRANSPORTED"));
  assert.ok(stages.includes("CERTIFIED"));
  assert.ok(stages.includes("MANUFACTURED"));
  // §8 sustainability
  assert.ok(p.sustainability.cultivation_types.includes("organic"));
  // §9 trust score — 100 when everything green (verified farmer + licensed)
  assert.equal(p.trust_score.score, 100);
  assert.equal(p.trust_score.breakdown.lab_pass + p.trust_score.breakdown.traceability_complete + p.trust_score.breakdown.licensed_manufacturer + p.trust_score.breakdown.verified_supply_chain, 100);
  // scan facet
  assert.equal(p.scan.device_type, "mobile");
  assert.equal(p.scan.state, "Tamil Nadu");

  // Privacy: the raw body must not leak PII or internal ids.
  const raw = JSON.stringify(res.body);
  assert.ok(!raw.includes("vf@x.dev"));
  assert.ok(!raw.includes("vm1@x.dev"));
  assert.ok(!raw.includes("phone"));
  assert.ok(!raw.includes("password_hash"));
  assert.ok(!raw.includes("farmer_id"));
  assert.ok(!raw.includes("manufacturer_user_id"));
  assert.ok(!raw.includes("1, Farm Road")); // full address line hidden
  assert.ok(!/\+?[0-9]{10,}/.test(raw.replace(/20\d{2}/g, ""))); // no phone-shaped digits

  // Persistence: scan row + forensic log + verdict + cache.
  const scan = await prisma.consumerScan.findFirst({ where: { product_id: product.id }, orderBy: { scanned_at: "desc" } });
  assert.ok(scan);
  assert.equal(scan.outcome, "VERIFIED");
  assert.equal(scan.device_type, "mobile");
  const qrLog = await prisma.qrScanLog.findFirst({ where: { target_id: lot.id, purpose: "consumer_view" } });
  assert.ok(qrLog);
  assert.equal(qrLog.outcome, "success");
  const prod = await prisma.product.findUnique({ where: { id: product.id } });
  assert.equal(prod.verification_status, "VERIFIED");
  const cache = await prisma.productVerificationCache.findUnique({ where: { token_hash: require("../../src/services/qrEngine").hashToken(qr.raw) } });
  assert.ok(cache);
  assert.equal(cache.verification_status, "VERIFIED");
});

test("GET passport is side-effect free (no scan row) but populates the cache", async () => {
  const { qr, product } = await runToCompletion();
  const beforeCount = await prisma.consumerScan.count();

  const res = await passportApi(qr.raw);
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.body.data.verified, true);
  assert.equal(res.body.data.verification_status, "VERIFIED");
  assert.equal(res.body.data.scan, undefined); // no scan facet on GET

  const afterCount = await prisma.consumerScan.count();
  assert.equal(afterCount, beforeCount); // GET never records

  const cache = await prisma.productVerificationCache.findUnique({
    where: { token_hash: require("../../src/services/qrEngine").hashToken(qr.raw) },
  });
  assert.ok(cache);
  assert.equal(cache.product_id, product.id);
});

test("journey + certificate public views", async () => {
  const { qr, batch, lot } = await runToCompletion();

  const j = await journeyApi(qr.raw);
  assert.equal(j.status, 200, JSON.stringify(j.body));
  assert.equal(j.body.data.found, true);
  assert.equal(j.body.data.product.lot_code, lot.code);
  const stageKeys = j.body.data.stages.map((s) => s.stage);
  assert.deepEqual(stageKeys, ["HARVESTED", "TRANSPORTED", "LAB_TESTED", "CERTIFIED", "MANUFACTURED"]);
  const transport = j.body.data.stages.find((s) => s.stage === "TRANSPORTED");
  // Full journey has four custody legs: farm->transporter->lab + lab->transporter->plant.
  assert.equal(transport.detail, "4 legs");
  assert.ok(j.body.data.stages.every((s) => s.date && s.label && s.icon));

  const c = await certApi(qr.raw);
  assert.equal(c.status, 200, JSON.stringify(c.body));
  assert.equal(c.body.data.found, true);
  assert.equal(c.body.data.summary.all_pass, true);
  assert.equal(c.body.data.certificates.length, 1);
  assert.match(c.body.data.certificates[0].certificate_number, /^CERT-/);
  assert.equal(c.body.data.certificates[0].species, "Ashwagandha");

  // Unknown token -> not found on both views.
  const badJ = await journeyApi("prd_bogusbogusbogus");
  assert.equal(badJ.body.data.found, false);
  const badC = await certApi("prd_bogusbogusbogus");
  assert.equal(badC.body.data.found, false);
});

// ------------------------------------------------------------ cache

test("cache: fast path serves the frozen passport; expiry regenerates; recall purges", async () => {
  const { qr, product, batch } = await runToCompletion();

  await scanApi({ token: qr.raw });
  const row = await prisma.productVerificationCache.findUnique({
    where: { token_hash: require("../../src/services/qrEngine").hashToken(qr.raw) },
  });
  assert.ok(row);

  // Second scan served from cache (passport identical, no lineage re-read).
  const again = await scanApi({ token: qr.raw });
  assert.equal(again.status, 200);
  assert.equal(again.body.data.verification_status, "VERIFIED");
  const scans = await prisma.consumerScan.count({ where: { product_id: product.id } });
  assert.equal(scans, 2); // tracked, but served fast

  // Expired cache -> regenerated.
  await prisma.productVerificationCache.update({
    where: { token_hash: require("../../src/services/qrEngine").hashToken(qr.raw) },
    data: { expires_at: new Date(Date.now() - 1000) },
  });
  const fresh = await scanApi({ token: qr.raw, state: "Karnataka" });
  assert.equal(fresh.body.data.verification_status, "VERIFIED");

  // Recall purges the cache and flips the verdict.
  const flag = await flagImpactApi(manufacturer.token, { batch_id: batch.id, impact_type: "contamination", notes: "recall drill" });
  assert.equal(flag.status, 201, JSON.stringify(flag.body));
  const afterRecall = await prisma.productVerificationCache.count({ where: { product_id: product.id } });
  assert.equal(afterRecall, 0);

  const recalledScan = await scanApi({ token: qr.raw });
  assert.equal(recalledScan.status, 200);
  assert.equal(recalledScan.body.data.verified, false);
  assert.equal(recalledScan.body.data.verification_status, "RECALLED");
  assert.ok(recalledScan.body.data.notices.includes("do_not_consume"));
  assert.equal(recalledScan.body.data.badge.tone, "danger");
});

// ------------------------------------------------------------ engine

test("recall: passport shows RECALLED with do-not-consume notice", async () => {
  const { qr, product, batch } = await runToCompletion();

  const flag = await flagImpactApi(manufacturer.token, { batch_id: batch.id, impact_type: "regulatory", notes: "AYUSH directive" });
  assert.equal(flag.status, 201, JSON.stringify(flag.body));
  const prod = await prisma.product.findUnique({ where: { id: product.id } });
  assert.equal(prod.verification_status, "RECALLED"); // persisted verdict

  const res = await scanApi({ token: qr.raw });
  assert.equal(res.body.data.verification_status, "RECALLED");
  assert.equal(res.body.data.verified, false);
  assert.equal(res.body.data.badge.label, "Recalled");
  assert.match(res.body.data.message, /recalled/i);
});

test("under investigation: an open counterfeit alert withholds verification", async () => {
  const { qr, lot, product } = await runToCompletion();
  const tokenHash = require("../../src/services/qrEngine").hashToken(qr.raw);
  await prisma.counterfeitAlert.create({
    data: { token_hash: tokenHash, product_id: product.id, lot_id: lot.id, reason: "scan_burst", severity: "medium", status: "open" },
  });

  const res = await scanApi({ token: qr.raw });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.verification_status, "UNDER_INVESTIGATION");
  assert.equal(res.body.data.verified, false);
  assert.equal(res.body.data.badge.tone, "warning");
});

test("invalid: unknown token -> INVALID not_found; revoked QR -> INVALID revoked + alert", async () => {
  const { qr, lot, product } = await runToCompletion();

  const bogus = await scanApi({ token: "prd_bogusbogusbogusbogus" });
  assert.equal(bogus.status, 200);
  assert.equal(bogus.body.data.verified, false);
  assert.equal(bogus.body.data.verification_status, "INVALID");
  assert.equal(bogus.body.data.reason, "not_found");
  const notFound = await prisma.consumerScan.findFirst({ where: { outcome: "INVALID", product_id: null } });
  assert.ok(notFound);
  assert.equal(notFound.token_hash.length, 64); // sha256 of the bogus token

  // Revoke the QR -> INVALID + revoked_token_scan alert.
  await prisma.productQrToken.update({
    where: { lot_id: lot.id },
    data: { status: "revoked", revoked_at: new Date(), revocation_reason: "QA" },
  });
  const revoked = await scanApi({ token: qr.raw });
  assert.equal(revoked.status, 200);
  assert.equal(revoked.body.data.verification_status, "INVALID");
  assert.equal(revoked.body.data.reason, "revoked");
  const alert = await prisma.counterfeitAlert.findFirst({ where: { token_hash: require("../../src/services/qrEngine").hashToken(qr.raw), reason: "revoked_token_scan", status: "open" } });
  assert.ok(alert);
  assert.equal(alert.product_id, product.id);
});

// ------------------------------------------------------ counterfeit engine

test("counterfeit: scan burst raises a medium alert (deduped)", async () => {
  const { qr, product } = await runToCompletion();
  for (let i = 0; i < 11; i++) {
    const res = await scanApi({ token: qr.raw });
    assert.equal(res.status, 200, `scan ${i}: ${JSON.stringify(res.body)}`);
  }
  const alerts = await prisma.counterfeitAlert.findMany({
    where: { product_id: product.id, reason: "scan_burst", status: "open" },
  });
  assert.equal(alerts.length, 1); // deduped
  assert.equal(alerts[0].severity, "medium");
  assert.ok(alerts[0].detail_json.scans_in_window >= 10);
});

test("counterfeit: geo velocity raises a high alert when GPS jumps continents", async () => {
  const { qr, product } = await runToCompletion();
  await scanApi({ token: qr.raw, gps_lat: FARM_LAT, gps_lng: FARM_LNG }); // Salem
  const second = await scanApi({ token: qr.raw, gps_lat: 28.6139, gps_lng: 77.209 }); // Delhi ~1,900 km
  assert.equal(second.status, 200);
  const alerts = await prisma.counterfeitAlert.findMany({
    where: { product_id: product.id, reason: "geo_velocity", status: "open" },
  });
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].severity, "high");
  assert.ok(alerts[0].detail_json.distance_km > 500);
});

// ----------------------------------------------------------- analytics

test("analytics: AYUSH totals + geo demand + top products; manufacturer scoped; farmer denied", async () => {
  const a = await runToCompletion();
  await scanApi({ token: a.qr.raw, state: "Tamil Nadu", city: "Salem", device_type: "mobile" });
  await scanApi({ token: a.qr.raw, state: "Karnataka", city: "Bengaluru", device_type: "desktop" });

  const adminRes = await request(app).get("/api/v1/verify/analytics").set("Authorization", `Bearer ${admin.token}`);
  assert.equal(adminRes.status, 200, JSON.stringify(adminRes.body));
  const az = adminRes.body.data.analytics;
  assert.ok(az.scans.total >= 2);
  assert.ok(az.scans.by_outcome.VERIFIED >= 2);
  assert.ok(az.most_scanned_products.some((p) => p.product.id === a.product.id && p.scan_count >= 2));
  assert.ok(az.geo_demand.some((g) => g.state === "Tamil Nadu" || g.state === "Karnataka"));
  assert.ok(az.devices.some((d) => d.device_type === "mobile"));
  assert.ok(az.trend.length === 14);

  // Scans list + alert list endpoints.
  const scans = await request(app).get("/api/v1/verify/scans").set("Authorization", `Bearer ${admin.token}`);
  assert.equal(scans.status, 200);
  assert.ok(scans.body.data.total >= 2);
  const alerts = await request(app).get("/api/v1/verify/alerts").set("Authorization", `Bearer ${admin.token}`);
  assert.equal(alerts.status, 200);

  // Manufacturer analytics are scoped to its own products only.
  const mfgRes = await request(app).get("/api/v1/verify/analytics").set("Authorization", `Bearer ${manufacturer.token}`);
  assert.equal(mfgRes.status, 200);
  const mine = await prisma.product.findMany({ where: { manufacturer_user_id: manufacturer.user.id }, select: { id: true } });
  const mineIds = new Set(mine.map((p) => p.id));
  assert.ok(mfgRes.body.data.analytics.most_scanned_products.every((p) => mineIds.has(p.product.id)));
  assert.ok(mfgRes.body.data.analytics.most_scanned_products.some((p) => p.product.id === a.product.id));

  // Farmer has no permission.
  const denied = await request(app).get("/api/v1/verify/analytics").set("Authorization", `Bearer ${farmer.token}`);
  assert.equal(denied.status, 403);
});