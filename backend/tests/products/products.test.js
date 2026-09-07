/**
 * Phase 10 products & lineage tests (docs/phase_10.md).
 *
 * Verifies on an isolated DB:
 *  - product master: create (PROD codes), list, detail, lifecycle statuses
 *  - formulas: standard recipe lines (product x species), dup guards
 *  - manufacturing runs: create (planned + RESERVED inventory + ingredient
 *    edges), start, complete -> consumed_for_production ledger + finished
 *    lot (PRD code) + permanent product QR + LOT_CREATED + per-batch
 *    BATCH_LINKED_TO_PRODUCT events + PRODUCT_CREATED/LINKED anchors +
 *    lineage snapshot; cancel releases reservations
 *  - ingredient gates: certified + valid cert + inventory + available qty;
 *    stranger manufacturers locked out; recalled product can't run
 *  - lineage: backward product trace + forward batch trace both walk the
 *    ingredient edges; QR verify returns product + lot; lot QR reprint
 *  - recall impact: flagged batch -> AffectedProduct rows + product recalled
 *  - batch exhaustion: fully consumed batches become terminal (consumed)
 *  - production dashboard KPIs
 */
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
async function runShipmentDelivered({ request, dest }) {
  const shipmentId = request.shipment.id;
  const batchId = request.batch.id;

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

  farmer = await makeUser("gf@x.dev", "farmer");
  transporter = await makeUser("gt@x.dev", "transporter", { verified: true });
  lab = await makeUser("gl@x.dev", "lab", { verified: true });
  supervisor = await makeUser("gs@x.dev", "lab", { verified: true, labRole: "supervisor" });
  manufacturer = await makeUser("gm1@x.dev", "manufacturer", { verified: true });
  manufacturer2 = await makeUser("gm2@x.dev", "manufacturer", { verified: true });
  admin = await makeUser("ga@x.dev", "admin");
  await prisma.warehouse.create({
    data: { owner_user_id: manufacturer.user.id, kind: "factory_godown", name: "Pune plant", gps_lat: PUNE_LAT, gps_lng: PUNE_LNG },
  });
});

after(async () => {
  await prisma.$disconnect();
  db.cleanup();
});

// ---- products API helpers ----
const createProductApi = (token, body) => request(app).post("/api/v1/products").set("Authorization", `Bearer ${token}`).send(body);
const listProductsApi = (token, qs = "") => request(app).get(`/api/v1/products${qs}`).set("Authorization", `Bearer ${token}`);
const getProductApi = (token, id) => request(app).get(`/api/v1/products/${id}`).set("Authorization", `Bearer ${token}`);
const patchProductApi = (token, id, body) => request(app).patch(`/api/v1/products/${id}`).set("Authorization", `Bearer ${token}`).send(body);
const addFormulaApi = (token, id, body) => request(app).post(`/api/v1/products/${id}/formulas`).set("Authorization", `Bearer ${token}`).send(body);
const delFormulaApi = (token, id, fid) => request(app).delete(`/api/v1/products/${id}/formulas/${fid}`).set("Authorization", `Bearer ${token}`);
const lineageApi = (token, id) => request(app).get(`/api/v1/products/${id}/lineage`).set("Authorization", `Bearer ${token}`);
const verifyQrApi = (token, body) => request(app).post("/api/v1/products/qr/verify").set("Authorization", `Bearer ${token}`).send(body);
const createRunApi = (token, body) => request(app).post("/api/v1/manufacturing/batches").set("Authorization", `Bearer ${token}`).send(body);
const listRunsApi = (token, qs = "") => request(app).get(`/api/v1/manufacturing/batches${qs}`).set("Authorization", `Bearer ${token}`);
const getRunApi = (token, id) => request(app).get(`/api/v1/manufacturing/batches/${id}`).set("Authorization", `Bearer ${token}`);
const startRunApi = (token, id) => request(app).post(`/api/v1/manufacturing/batches/${id}/start`).set("Authorization", `Bearer ${token}`).send({});
const completeRunApi = (token, id, body = {}) => request(app).post(`/api/v1/manufacturing/batches/${id}/complete`).set("Authorization", `Bearer ${token}`).send(body);
const cancelRunApi = (token, id, body = {}) => request(app).post(`/api/v1/manufacturing/batches/${id}/cancel`).set("Authorization", `Bearer ${token}`).send(body);
const listLotsApi = (token, qs = "") => request(app).get(`/api/v1/manufacturing/lots${qs}`).set("Authorization", `Bearer ${token}`);
const getLotApi = (token, id) => request(app).get(`/api/v1/manufacturing/lots/${id}`).set("Authorization", `Bearer ${token}`);
const lotQrApi = (token, id) => request(app).get(`/api/v1/manufacturing/lots/${id}/qr`).set("Authorization", `Bearer ${token}`);
const dashboardApi = (token) => request(app).get("/api/v1/manufacturing/dashboard").set("Authorization", `Bearer ${token}`);
const listImpactsApi = (token, qs = "") => request(app).get(`/api/v1/manufacturing/impacts${qs}`).set("Authorization", `Bearer ${token}`);
const flagImpactApi = (token, body) => request(app).post("/api/v1/manufacturing/impacts").set("Authorization", `Bearer ${token}`).send(body);
const resolveImpactApi = (token, id) => request(app).post(`/api/v1/manufacturing/impacts/${id}/resolve`).set("Authorization", `Bearer ${token}`).send({});
const forwardTraceApi = (token, batchId) => request(app).get(`/api/v1/batches/${batchId}/products`).set("Authorization", `Bearer ${token}`);

/** Seed a product with one stocked ingredient batch ready to run. */
async function seedProduct(over = {}) {
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
  return { batch, product };
}

/** Full single-batch run to a completed lot. */
async function runToCompletion(over = {}) {
  const { batch, product } = await seedProduct(over);
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

// --------------------------------------------------------- product master

test("product master: create with PROD codes; lifecycle + list scoping", async () => {
  // Non-manufacturer cannot create.
  const farmerCreate = await createProductApi(farmer.token, { name: "Nope" });
  assert.equal(farmerCreate.status, 403);

  const p = await createProductApi(manufacturer.token, {
    name: "Tulsi Churna",
    category: "churna",
    pack_size: "200g tin",
    expiry_months: 18,
    sku: "TUL-200",
    description: "Standardised tulsi powder",
  });
  assert.equal(p.status, 201, JSON.stringify(p.body));
  assert.match(p.body.data.product.code, /^PROD-\d{4}-\d{6}$/);
  assert.equal(p.body.data.product.status, "draft");

  // Bad category rejected.
  const bad = await createProductApi(manufacturer.token, { name: "X", category: "rocket" });
  assert.equal(bad.status, 400);

  // Detail + formulas + list scoping.
  const detail = await getProductApi(manufacturer.token, p.body.data.product.id);
  assert.equal(detail.status, 200);
  assert.equal(detail.body.data.product.code, p.body.data.product.code);

  // Lifecycle: draft -> active -> discontinued.
  const act = await patchProductApi(manufacturer.token, p.body.data.product.id, { status: "active" });
  assert.equal(act.status, 200, JSON.stringify(act.body));
  assert.equal(act.body.data.product.status, "active");
  const toRecalled = await patchProductApi(manufacturer.token, p.body.data.product.id, { status: "recalled" });
  assert.equal(toRecalled.status, 409); // recall flow only
  const skip = await patchProductApi(manufacturer.token, p.body.data.product.id, { status: "active" });
  assert.equal(skip.status, 200); // no-op same status ok

  // Stranger manufacturer cannot read/patch.
  const strangerGet = await getProductApi(manufacturer2.token, p.body.data.product.id);
  assert.equal(strangerGet.status, 403);
  const strangerPatch = await patchProductApi(manufacturer2.token, p.body.data.product.id, { name: "Hijack" });
  assert.equal(strangerPatch.status, 403);

  // List scoping: M1 sees only its own.
  const list = await listProductsApi(manufacturer.token);
  assert.equal(list.status, 200);
  assert.ok(list.body.data.products.some((x) => x.id === p.body.data.product.id));
  assert.equal(list.body.data.products.every((x) => x.manufacturer.id === manufacturer.user.id), true);
});

// ------------------------------------------------------------ formulas

test("formulas: standard recipe lines with dup + stranger guards", async () => {
  const { product } = await seedProduct();
  const f2 = await addFormulaApi(manufacturer.token, product.id, { species_code: "tulsi", standard_quantity: 5, unit: "kg" });
  assert.equal(f2.status, 201, JSON.stringify(f2.body));
  const dup = await addFormulaApi(manufacturer.token, product.id, { species_code: "ashwagandha", standard_quantity: 99 });
  assert.equal(dup.status, 409);

  const stranger = await addFormulaApi(manufacturer2.token, product.id, { species_code: "tulsi" });
  assert.equal(stranger.status, 403);

  const detail = await getProductApi(manufacturer.token, product.id);
  assert.equal(detail.body.data.product.formulas.length, 2);

  const rm = await delFormulaApi(manufacturer.token, product.id, f2.body.data.formula.id);
  assert.equal(rm.status, 200);
  const after = await getProductApi(manufacturer.token, product.id);
  assert.equal(after.body.data.product.formulas.length, 1);
});

// ------------------------------------------------------------ run lifecycle

test("run lifecycle: planned reserves inventory -> start -> complete -> lot + QR + ledger + anchors + snapshot", async () => {
  const { batch, product } = await seedProduct({ qty: 20 });
  const itemBefore = await prisma.inventoryItem.findUnique({
    where: { manufacturer_user_id_batch_id: { manufacturer_user_id: manufacturer.user.id, batch_id: batch.id } },
  });
  assert.equal(itemBefore.available_quantity_kg, 20);

  // Guard: only manufacturers run; stranger manufacturer blocked on product.
  const farmerRun = await createRunApi(farmer.token, { product_id: product.id, planned_units: 10, ingredients: [{ batch_id: batch.id, quantity_kg: 1 }] });
  assert.equal(farmerRun.status, 403);
  const strangerRun = await createRunApi(manufacturer2.token, { product_id: product.id, planned_units: 10, ingredients: [{ batch_id: batch.id, quantity_kg: 1 }] });
  assert.equal(strangerRun.status, 403);

  // Understock refused.
  const overdraw = await createRunApi(manufacturer.token, {
    product_id: product.id,
    planned_units: 10,
    ingredients: [{ batch_id: batch.id, quantity_kg: 50 }],
  });
  assert.equal(overdraw.status, 409);
  assert.equal(overdraw.body.error.code, "insufficient_stock");

  // Create run -> planned + reservations.
  const run = await createRunApi(manufacturer.token, {
    product_id: product.id,
    planned_units: 500,
    ingredients: [{ batch_id: batch.id, quantity_kg: 6 }],
  });
  assert.equal(run.status, 201, JSON.stringify(run.body));
  const runId = run.body.data.run.id;
  assert.match(run.body.data.run.code, /^MFG-\d{4}-\d{6}$/);
  assert.equal(run.body.data.run.status, "planned");
  assert.equal(run.body.data.run.ingredients.length, 1);

  const itemReserved = await prisma.inventoryItem.findUnique({ where: { id: itemBefore.id } });
  assert.equal(itemReserved.available_quantity_kg, 14);
  assert.equal(itemReserved.reserved_quantity_kg, 6);
  const ledger = await prisma.inventoryTransaction.findMany({
    where: { inventory_id: itemBefore.id, transaction_type: "reserved" },
  });
  assert.equal(ledger.length, 1);

  // Ingredient edges exist.
  const edges = await prisma.manufacturingBatchIngredient.count({ where: { manufacturing_batch_id: runId, state: "reserved" } });
  assert.equal(edges, 1);

  // Cannot complete a planned run — must start first.
  const earlyComplete = await completeRunApi(manufacturer.token, runId);
  assert.equal(earlyComplete.status, 409);

  // Start.
  const started = await startRunApi(manufacturer.token, runId);
  assert.equal(started.status, 200, JSON.stringify(started.body));
  assert.equal(started.body.data.run.status, "in_progress");
  assert.ok(started.body.data.run.production_date);

  // Complete -> lot + QR.
  const done = await completeRunApi(manufacturer.token, runId, { produced_units: 480 });
  assert.equal(done.status, 200, JSON.stringify(done.body));
  const lot = done.body.data.lot;
  assert.match(lot.code, /^PRD-\d{4}-\d{6}$/);
  assert.equal(lot.quantity_units, 480);
  assert.equal(lot.units_remaining, 480);
  assert.ok(lot.expiry_date); // 24-month shelf life
  assert.equal(lot.phase, "with_manufacturer");
  assert.equal(done.body.data.qr.token_prefix.slice(0, 4), "prd_");
  assert.ok(done.body.data.qr.raw);

  // Inventory: consumed_for_production ledger.
  const itemConsumed = await prisma.inventoryItem.findUnique({ where: { id: itemBefore.id } });
  assert.equal(itemConsumed.reserved_quantity_kg, 0);
  assert.equal(itemConsumed.consumed_quantity_kg, 6);
  const prodTx = await prisma.inventoryTransaction.findFirst({
    where: { inventory_id: itemBefore.id, transaction_type: "consumed_for_production" },
  });
  assert.ok(prodTx);
  assert.equal(prodTx.reference_id, runId);

  // Events + anchors.
  const lotEvent = await prisma.productLotEvent.findFirst({ where: { lot_id: lot.id, event_type: "LOT_CREATED" } });
  assert.ok(lotEvent);
  const createdAnchor = await prisma.blockchainEvent.findFirst({ where: { entity_id: lotEvent.id, anchor_code: "PRODUCT_CREATED" } });
  assert.ok(createdAnchor);
  const linkEvent = await prisma.batchEvent.findFirst({ where: { batch_id: batch.id, event_type: "PRODUCT_LINK" } });
  assert.ok(linkEvent);
  assert.equal(linkEvent.payload_json.product_code, product.code);
  assert.equal(linkEvent.payload_json.lot_code, lot.code);
  const linkAnchor = await prisma.blockchainEvent.findFirst({ where: { entity_id: linkEvent.id, anchor_code: "LINKED" } });
  assert.ok(linkAnchor);

  // Lineage snapshot frozen.
  const snap = await prisma.productLineageSnapshot.findFirst({ where: { product_id: product.id, manufacturing_batch_id: runId } });
  assert.ok(snap);
  assert.equal(snap.snapshot_json.product.code, product.code);
  assert.equal(snap.snapshot_json.ingredients.length, 1);
  assert.equal(snap.snapshot_json.ingredients[0].batch.code, batch.code);
  assert.ok(snap.snapshot_json.ingredients[0].certificate);
  assert.ok(snap.snapshot_json.ingredients[0].journey.length >= 3); // CREATED + transfers

  // Ingredient row consumed.
  const edge = await prisma.manufacturingBatchIngredient.findFirst({ where: { manufacturing_batch_id: runId } });
  assert.equal(edge.state, "consumed");
  assert.ok(edge.consumed_at);

  // Double-complete refused.
  const again = await completeRunApi(manufacturer.token, runId);
  assert.equal(again.status, 409);
});

test("cancel: a planned run releases reservations back to available", async () => {
  const { batch, product } = await seedProduct({ qty: 20 });
  const item = await prisma.inventoryItem.findUnique({
    where: { manufacturer_user_id_batch_id: { manufacturer_user_id: manufacturer.user.id, batch_id: batch.id } },
  });

  const run = await createRunApi(manufacturer.token, {
    product_id: product.id,
    planned_units: 100,
    ingredients: [{ batch_id: batch.id, quantity_kg: 8 }],
  });
  const runId = run.body.data.run.id;

  const cx = await cancelRunApi(manufacturer.token, runId, { reason: "spec change" });
  assert.equal(cx.status, 200, JSON.stringify(cx.body));
  assert.equal(cx.body.data.run.status, "cancelled");

  const itemAfter = await prisma.inventoryItem.findUnique({ where: { id: item.id } });
  assert.equal(itemAfter.available_quantity_kg, 20);
  assert.equal(itemAfter.reserved_quantity_kg, 0);
  const edge = await prisma.manufacturingBatchIngredient.findFirst({ where: { manufacturing_batch_id: runId } });
  assert.equal(edge.state, "released");
});

// ------------------------------------------------------------ lineage

test("backward + forward lineage: product -> batches and batch -> products", async () => {
  const { batch, product, lot } = await runToCompletion({ qty: 20, consumeKg: 4 });

  // Backward: product lineage resolves the herb batch, farmer, cert + journey.
  const lineage = await lineageApi(manufacturer.token, product.id);
  assert.equal(lineage.status, 200, JSON.stringify(lineage.body));
  assert.equal(lineage.body.data.product.code, product.code);
  const ing = lineage.body.data.runs[0].ingredients[0];
  assert.equal(ing.batch.code, batch.code);
  assert.equal(ing.certificate.certificate_number.length > 0, true);
  assert.ok(ing.journey.length >= 3);
  assert.equal(lineage.body.data.snapshots.length >= 1, true);

  // Stranger manufacturer cannot read the lineage.
  const denied = await lineageApi(manufacturer2.token, product.id);
  assert.equal(denied.status, 403);

  // Forward: the herb batch's products (spec §9).
  const forward = await forwardTraceApi(manufacturer.token, batch.id);
  assert.equal(forward.status, 200, JSON.stringify(forward.body));
  assert.equal(forward.body.data.batch.code, batch.code);
  assert.ok(forward.body.data.usage.some((u) => u.run.product.code === product.code && u.run.lots[0].code === lot.code));

  // The farmer who grew the batch can forward-trace it too.
  const farmerForward = await forwardTraceApi(farmer.token, batch.id);
  assert.equal(farmerForward.status, 200);
});

// ------------------------------------------------------------ product QR

test("product QR: verify returns product + lot; per-run tokens are distinct; unknown token rejected", async () => {
  const a = await runToCompletion({ qty: 20, consumeKg: 4 }); // PRD lot 1
  const b = await runToCompletion({ qty: 20, consumeKg: 4 }); // PRD lot 2

  // Raw token from the completion response resolves.
  const v = await verifyQrApi(manufacturer.token, { token: a.qr.raw });
  assert.equal(v.status, 200, JSON.stringify(v.body));
  assert.equal(v.body.data.valid, true);
  assert.equal(v.body.data.product.code, a.product.code);
  assert.equal(v.body.data.lot.code, a.lot.code);

  // Per-finished-run QR: each lot has its own token.
  const other = await verifyQrApi(manufacturer.token, { token: b.qr.raw });
  assert.equal(other.body.data.lot.code, b.lot.code);
  assert.notEqual(other.body.data.lot.id, a.lot.id);

  // QR card reprint (permanent — same token as minted).
  const card = await lotQrApi(manufacturer.token, a.lot.id);
  assert.equal(card.status, 200, JSON.stringify(card.body));
  assert.equal(card.body.data.lot_code, a.lot.code);
  assert.match(card.body.data.url, /\/qr\/prd_/);
  assert.match(card.body.data.png, /^data:image\/png;base64,/);

  // Stranger cannot see the QR card.
  const denied = await lotQrApi(manufacturer2.token, a.lot.id);
  assert.equal(denied.status, 403);

  // Unknown token -> not_found outcome logged.
  const bogus = await verifyQrApi(manufacturer.token, { token: "prd_bogusbogusbogusbogus" });
  assert.equal(bogus.body.data.valid, false);
  assert.equal(bogus.body.data.reason, "not_found");
  const scan = await prisma.qrScanLog.findFirst({ where: { purpose: "consumer_view", outcome: "not_found" } });
  assert.ok(scan);
});

// ------------------------------------------------------------ recall

test("recall impact: flagging a consumed batch marks its products affected + recalled", async () => {
  const { batch, product, lot } = await runToCompletion({ qty: 20, consumeKg: 4 });

  // Nothing open yet.
  const empty = await listImpactsApi(manufacturer.token);
  assert.equal(empty.body.data.total, 0);

  const flag = await flagImpactApi(manufacturer.token, { batch_id: batch.id, impact_type: "contamination", notes: "test sample failed recheck" });
  assert.equal(flag.status, 201, JSON.stringify(flag.body));
  assert.equal(flag.body.data.affected_count, 1);
  assert.equal(flag.body.data.impacts[0].product.id, product.id);

  // Product flipped to recalled (terminal for production).
  const prod = await getProductApi(manufacturer.token, product.id);
  assert.equal(prod.body.data.product.status, "recalled");
  // Can't start a new run of a recalled product.
  const blocked = await createRunApi(manufacturer.token, { product_id: product.id, planned_units: 10, ingredients: [{ batch_id: batch.id, quantity_kg: 1 }] });
  assert.equal(blocked.status, 409);

  // Forward trace exposes the affected rows.
  const forward = await forwardTraceApi(manufacturer.token, batch.id);
  assert.equal(forward.body.data.affected.length, 1);

  // Bad impact type refused.
  const bad = await flagImpactApi(manufacturer.token, { batch_id: batch.id, impact_type: "alien" });
  assert.equal(bad.status, 400);

  // Resolve closes it.
  const resolved = await resolveImpactApi(manufacturer.token, flag.body.data.impacts[0].id);
  assert.equal(resolved.status, 200, JSON.stringify(resolved.body));
  assert.equal(resolved.body.data.impact.status, "resolved");
  const open = await listImpactsApi(manufacturer.token);
  assert.equal(open.body.data.total, 0);

  // Lot QR now still active (impact is recorded at product level; revocation
  // of the token itself is a separate QA action) — but for completeness the
  // impacted lot detail remains visible to the owner.
  const lotDetail = await getLotApi(manufacturer.token, lot.id);
  assert.equal(lotDetail.status, 200);
});

// ------------------------------------------------------ batch exhaustion

test("batch exhaustion: fully consumed herb batches reach the terminal consumed phase", async () => {
  // A 3kg batch — entirely consumed by one run.
  const { batch, product } = await seedProduct({ qty: 3 });
  const run = await createRunApi(manufacturer.token, {
    product_id: product.id,
    planned_units: 200,
    ingredients: [{ batch_id: batch.id, quantity_kg: 3 }],
  });
  assert.equal(run.status, 201, JSON.stringify(run.body));
  await startRunApi(manufacturer.token, run.body.data.run.id);
  const done = await completeRunApi(manufacturer.token, run.body.data.run.id);
  assert.equal(done.status, 200, JSON.stringify(done.body));

  const batchRow = await prisma.batch.findUnique({ where: { id: batch.id } });
  assert.equal(batchRow.phase, "consumed");
  const ev = await prisma.batchEvent.findFirst({ where: { batch_id: batch.id, event_type: "BATCH_EXHAUSTED" } });
  assert.ok(ev);
});

// ----------------------------------------------------------- dashboard

test("production dashboard: KPIs reflect runs, units, remaining lots and open impacts", async () => {
  await runToCompletion({ qty: 20, consumeKg: 4 });
  const d = await dashboardApi(manufacturer.token);
  assert.equal(d.status, 200, JSON.stringify(d.body));
  assert.ok(d.body.data.dashboard.products >= 1);
  assert.ok(d.body.data.dashboard.runs.completed >= 1);
  assert.ok(d.body.data.dashboard.units_produced >= 500);
  assert.ok(d.body.data.dashboard.units_remaining >= 500);

  // Non-manufacturer cannot read.
  const denied = await dashboardApi(farmer.token);
  assert.equal(denied.status, 403);
});
