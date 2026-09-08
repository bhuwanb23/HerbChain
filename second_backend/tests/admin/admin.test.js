/**
 * Phase 13 admin portal tests (docs/phase_13.md).
 *
 * Verifies on an isolated DB (journey helpers shared with the blockchain
 * suite): dashboard KPIs, universal search, batch/product traceability
 * explorers, shipment risk alerts, failed-certification filters, the
 * compliance-alert rules engine, the recall center with auto-impact
 * discovery, investigations, compliance scores, notifications, CSV report
 * export, the ecosystem map and the admin-tier permission matrix
 * (auditor read-only / regulatory officer / state officer / non-admin 403).
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

async function makeUser(email, role, { verified = false, labRole = null, adminRole = null } = {}) {
  const user = await prisma.user.create({
    data: {
      name: role,
      email,
      password_hash: hashPassword("password1"),
      role,
      lab_role: labRole,
      admin_role: adminRole,
      kyc_status: verified ? "verified" : "pending",
      is_active: true,
    },
  });
  const login = await request(app).post("/api/v1/auth/login").send({ identifier: email, password: "password1" });
  assert.equal(login.status, 200, JSON.stringify(login.body));
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

/** Full lab run: create -> governed to lab -> certify. */
async function certifyBatch(qty = 20) {
  const batch = await createBatch(farmer.token, qty);
  await governedHop(transporter, farmer, transporter, batch.id);
  await governedHop(lab, transporter, lab, batch.id);
  const r = await request(app).post("/api/v1/labs/batches/receive").set("Authorization", `Bearer ${lab.token}`).send({ batch_id: batch.id, receiver_name: "Lab In-charge", condition_status: "good" });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const s = await request(app).post("/api/v1/labs/samples").set("Authorization", `Bearer ${lab.token}`).send({ batch_id: batch.id, sample_weight_kg: 0.5, remarks: "sample A" });
  assert.equal(s.status, 201, JSON.stringify(s.body));
  const sampleId = s.body.data.sample.id;
  for (const [category, name, code, observed, unit] of [
    ["physical", "Moisture content", "moisture", 7.2, "%"],
    ["safety", "Heavy metals screen", "lead", 0.4, "ppm"],
  ]) {
    const t = await request(app).post("/api/v1/labs/tests").set("Authorization", `Bearer ${lab.token}`).send({ sample_id: sampleId, test_category: category, test_name: name });
    assert.equal(t.status, 201, JSON.stringify(t.body));
    const id = t.body.data.test.id;
    const p = await request(app).post(`/api/v1/labs/tests/${id}/results`).set("Authorization", `Bearer ${lab.token}`).send({ parameter_code: code, observed_value: observed, unit, result: "pass" });
    assert.equal(p.status, 201, JSON.stringify(p.body));
    const sub = await request(app).post(`/api/v1/labs/tests/${id}/submit`).set("Authorization", `Bearer ${lab.token}`).send({});
    assert.equal(sub.status, 200, JSON.stringify(sub.body));
    const rv = await request(app).post("/api/v1/labs/reviews").set("Authorization", `Bearer ${supervisor.token}`).send({ test_id: id, review_status: "approved", notes: "ok" });
    assert.equal(rv.status, 200, JSON.stringify(rv.body));
  }
  const c = await request(app).post("/api/v1/labs/certificates").set("Authorization", `Bearer ${supervisor.token}`).send({ batch_id: batch.id });
  assert.equal(c.status, 201, JSON.stringify(c.body));
  return { batch, certification: c.body.data.certification };
}

/** A REJECTED batch (failed certification path) — supervisor rejects. */
async function rejectBatch(qty = 20, reason = "heavy_metal_failure") {
  const batch = await createBatch(farmer.token, qty);
  await governedHop(transporter, farmer, transporter, batch.id);
  await governedHop(lab, transporter, lab, batch.id);
  await request(app).post("/api/v1/labs/batches/receive").set("Authorization", `Bearer ${lab.token}`).send({ batch_id: batch.id, receiver_name: "Lab In-charge", condition_status: "good" });
  const r = await request(app).post("/api/v1/labs/reject").set("Authorization", `Bearer ${supervisor.token}`).send({ batch_id: batch.id, reason });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return { batch, rejection: r.body.data.rejection };
}

const assignShip = (token, id, body) => request(app).post(`/api/v1/shipments/${id}/assign`).set("Authorization", `Bearer ${token}`).send(body);
const acceptShip = (token, id) => request(app).post(`/api/v1/shipments/${id}/accept`).set("Authorization", `Bearer ${token}`).send({});
const arriveShip = (token, id, body) => request(app).post(`/api/v1/shipments/${id}/arrive`).set("Authorization", `Bearer ${token}`).send(body);
const pickupShip = (token, id, body) => request(app).post(`/api/v1/shipments/${id}/pickup`).set("Authorization", `Bearer ${token}`).send(body);
const locationShip = (token, id, body) => request(app).post(`/api/v1/shipments/${id}/location`).set("Authorization", `Bearer ${token}`).send(body);
const arrDestShip = (token, id, body) => request(app).post(`/api/v1/shipments/${id}/arrive-destination`).set("Authorization", `Bearer ${token}`).send(body);
const deliverShip = (token, id, body) => request(app).post(`/api/v1/shipments/${id}/deliver`).set("Authorization", `Bearer ${token}`).send(body);

const reqBatch = (token, body) => request(app).post("/api/v1/manufacturer/request-batch").set("Authorization", `Bearer ${token}`).send(body);
const approveReq = (token, id) => request(app).post(`/api/v1/manufacturer/requests/${id}/approve`).set("Authorization", `Bearer ${token}`).send({});
const receiveGrn = (token, body) => request(app).post("/api/v1/manufacturer/receive").set("Authorization", `Bearer ${token}`).send(body);

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

const createProductApi = (token, body) => request(app).post("/api/v1/products").set("Authorization", `Bearer ${token}`).send(body);
const addFormulaApi = (token, id, body) => request(app).post(`/api/v1/products/${id}/formulas`).set("Authorization", `Bearer ${token}`).send(body);
const createRunApi = (token, body) => request(app).post("/api/v1/manufacturing/batches").set("Authorization", `Bearer ${token}`).send(body);
const startRunApi = (token, id) => request(app).post(`/api/v1/manufacturing/batches/${id}/start`).set("Authorization", `Bearer ${token}`).send({});
const completeRunApi = (token, id) => request(app).post(`/api/v1/manufacturing/batches/${id}/complete`).set("Authorization", `Bearer ${token}`).send({});

/** Full journey: certified batch -> manufacturer stock -> finished lot. */
async function runToCompletion() {
  const { batch } = await receiveStock();
  const p = await createProductApi(manufacturer.token, { name: "Ashwagandha Capsules", category: "capsule", pack_size: "60 capsules", expiry_months: 24 });
  assert.equal(p.status, 201, JSON.stringify(p.body));
  const product = p.body.data.product;
  const f = await addFormulaApi(manufacturer.token, product.id, { species_code: "ashwagandha", standard_quantity: 10, unit: "kg" });
  assert.equal(f.status, 201, JSON.stringify(f.body));
  const run = await createRunApi(manufacturer.token, { product_id: product.id, planned_units: 500, ingredients: [{ batch_id: batch.id, quantity_kg: 5 }] });
  assert.equal(run.status, 201, JSON.stringify(run.body));
  await startRunApi(manufacturer.token, run.body.data.run.id);
  const done = await completeRunApi(manufacturer.token, run.body.data.run.id);
  assert.equal(done.status, 200, JSON.stringify(done.body));
  return { batch, product, run: done.body.data.run, lot: done.body.data.lot };
}

// admin portal helpers
const portal = (method, p, token, body = undefined) => {
  let req = request(app)[method](`/api/v1/admin/portal${p}`).set("Authorization", `Bearer ${token}`);
  if (body !== undefined) req = req.send(body);
  return req;
};

let farmer, transporter, lab, supervisor, manufacturer, superAdmin, auditor, regOfficer, stateOfficer;

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

  farmer = await makeUser("af@x.dev", "farmer");
  transporter = await makeUser("at@x.dev", "transporter", { verified: true });
  lab = await makeUser("al@x.dev", "lab", { verified: true });
  supervisor = await makeUser("as@x.dev", "lab", { verified: true, labRole: "supervisor" });
  manufacturer = await makeUser("am@x.dev", "manufacturer", { verified: true });
  superAdmin = await makeUser("asa@x.dev", "admin", { adminRole: "super_admin" });
  auditor = await makeUser("aud@x.dev", "admin", { adminRole: "auditor" });
  regOfficer = await makeUser("reg@x.dev", "admin", { adminRole: "regulatory_officer" });
  stateOfficer = await makeUser("so@x.dev", "admin", { adminRole: "state_officer" });
  await prisma.warehouse.create({ data: { owner_user_id: manufacturer.user.id, kind: "factory_godown", name: "Pune plant", gps_lat: PUNE_LAT, gps_lng: PUNE_LNG } });
  // A farm plot with GPS for the ecosystem map.
  const fp = await prisma.farmerProfile.create({ data: { farmer_id: farmer.user.id, farmer_code: "FRM-2026-0001", farm_name: "Kaveri Farm", gps_lat: FARM_LAT, gps_lng: FARM_LNG } });
  await prisma.farmPlot.create({ data: { profile_id: fp.id, name: "Kaveri Farm", gps_lat: FARM_LAT, gps_lng: FARM_LNG } });
});

after(async () => {
  await prisma.$disconnect();
  db.cleanup();
});

// ------------------------------------------------------------ dashboard

test("dashboard: KPIs + entity widgets reflect the live ecosystem", async () => {
  const { batch } = await runToCompletion();
  const res = await portal("get", "/dashboard", superAdmin.token);
  assert.equal(res.status, 200, JSON.stringify(res.body));
  const d = res.body.data.dashboard;
  assert.equal(d.kpis.total_farmers, 1);
  assert.equal(d.kpis.total_labs, 2);
  assert.equal(d.kpis.total_manufacturers, 1);
  assert.ok(d.kpis.active_batches >= 1);
  assert.ok(d.kpis.certified_batches >= 1);
  assert.ok(d.kpis.products_created >= 1);
  assert.ok(d.kpis.blockchain_transactions >= 0);
  assert.equal(d.widgets.farmers.registered, 1);
  assert.equal(d.widgets.labs.certification_count, 1);
  assert.ok(d.widgets.manufacturers.products_created >= 1);
  assert.ok(typeof d.compliance_surface.suspicious_activities === "number");
  assert.equal(batch.id.length > 0, true);
});

// ------------------------------------------------------------ universal search

test("universal search finds batches, products, certificates and users from one box", async () => {
  const { batch, product } = await runToCompletion();
  const cert = await prisma.certification.findFirst({ where: { batch_id: batch.id } });

  const byBatch = await portal("get", `/search?q=${encodeURIComponent(batch.code)}`, superAdmin.token);
  assert.equal(byBatch.status, 200, JSON.stringify(byBatch.body));
  assert.equal(byBatch.body.data.categories.batches, 1);
  assert.equal(byBatch.body.data.results[0].code, batch.code);

  const byProduct = await portal("get", `/search?q=${encodeURIComponent(product.code)}`, superAdmin.token);
  assert.equal(byProduct.status, 200, JSON.stringify(byProduct.body));
  assert.equal(byProduct.body.data.categories.products, 1);

  const byCert = await portal("get", `/search?q=${encodeURIComponent(cert.certificate_number)}`, superAdmin.token);
  assert.equal(byCert.status, 200, JSON.stringify(byCert.body));
  assert.equal(byCert.body.data.categories.certificates, 1);

  const byFarmer = await portal("get", "/search?q=af%40x.dev", superAdmin.token);
  assert.equal(byFarmer.status, 200, JSON.stringify(byFarmer.body));
  assert.ok(byFarmer.body.data.categories.users >= 1);

  // Geographic: batches within a GPS radius of the farm.
  const geo = await portal("get", `/search?radius_m=5000&lat=${FARM_LAT}&lng=${FARM_LNG}`, superAdmin.token);
  assert.equal(geo.status, 200, JSON.stringify(geo.body));
  assert.ok(geo.body.data.categories.geo_batches >= 1);
});

// ------------------------------------------------------------ traceability

test("batch traceability explorer: ownership, lab testing, certificates and forward products", async () => {
  const { batch, product } = await runToCompletion();
  const res = await portal("get", `/batches/${batch.id}`, superAdmin.token);
  assert.equal(res.status, 200, JSON.stringify(res.body));
  const t = res.body.data.batch_trace;
  assert.equal(t.batch.code, batch.code);
  assert.ok(t.ownership_history.some((e) => e.event_type === "CREATED"));
  assert.ok(t.ownership_history.some((e) => e.event_type === "TRANSFER"));
  assert.equal(t.lab_testing.length, 1);
  assert.equal(t.certificates.length, 1);
  assert.ok(t.certificates[0].active);
  assert.equal(t.products_using_batch.length, 1);
  assert.equal(t.products_using_batch[0].product.id, product.id);
});

test("product traceability explorer: formula, runs, ingredient batches + ownership chains", async () => {
  const { product, batch } = await runToCompletion();
  const res = await portal("get", `/products/${product.id}`, superAdmin.token);
  assert.equal(res.status, 200, JSON.stringify(res.body));
  const t = res.body.data.product_trace;
  assert.equal(t.product.code, product.code);
  assert.equal(t.formula.length, 1);
  assert.equal(t.formula[0].species.code, "ashwagandha");
  assert.equal(t.journey.length, 1);
  const ing = t.journey[0].ingredients[0];
  assert.equal(ing.batch.code, batch.code);
  assert.ok(ing.batch.certificate);
  assert.ok(ing.ownership_chain.some((e) => e.event_type === "CREATED"));
});

// ------------------------------------------------------------ shipments

test("shipments dashboard lists live logistics + flags delayed risk", async () => {
  await runToCompletion(); // creates a delivered shipment
  // A stalled shipment: assigned, expected delivery in the past, no movement.
  const batch = await createBatch(farmer.token);
  const ship = await prisma.shipment.create({
    data: {
      shipment_no: "SHIP-2026-999001",
      ref_type: "batch",
      ref_id: batch.id,
      shipment_type: "CUSTOM",
      requested_by_user_id: lab.user.id,
      from_user_id: farmer.user.id,
      to_user_id: lab.user.id,
      assigned_transporter_user_id: transporter.user.id,
      status: "in_transit",
      expected_delivery_at: new Date(Date.now() - 24 * 3600000),
    },
  });
  assert.ok(ship.id);

  const res = await portal("get", "/shipments", superAdmin.token);
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.ok(res.body.data.total >= 2);
  const flagged = res.body.data.shipments.find((s) => s.risk);
  assert.ok(flagged, "at least one shipment should carry a risk flag");
  assert.ok(["delayed", "inactive"].includes(flagged.risk.flag));

  const byRisk = await portal("get", "/shipments?risk=delayed", superAdmin.token);
  assert.equal(byRisk.status, 200, JSON.stringify(byRisk.body));
  assert.ok(byRisk.body.data.shipments.every((s) => s.risk.flag === "delayed"));
  assert.ok(byRisk.body.data.risk_summary.delayed >= 1);
});

// ------------------------------------------------------------ failed certifications

test("failed certifications: rejected batches with category filters", async () => {
  const { batch } = await rejectBatch(20, "heavy_metal_failure");
  const res = await portal("get", "/failed-certifications", superAdmin.token);
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.body.data.total, 1);
  assert.equal(res.body.data.failed[0].batch_code, batch.code);
  assert.equal(res.body.data.failed[0].category, "heavy_metals");
  assert.ok(res.body.data.by_category.heavy_metals >= 1);

  const filtered = await portal("get", "/failed-certifications?category=species_mismatch", superAdmin.token);
  assert.equal(filtered.status, 200, JSON.stringify(filtered.body));
  assert.equal(filtered.body.data.total, 0);
});

// ------------------------------------------------------------ compliance alerts

test("compliance alert center: rules engine, manual create and resolve", async () => {
  // Produce rule fodder: 3 rejected transfers + a species mismatch log.
  for (let i = 0; i < 3; i++) {
    const b = await createBatch(farmer.token);
    await prisma.transferRequest.create({
      data: { batch_id: b.id, from_user_id: farmer.user.id, from_role: "farmer", to_user_id: lab.user.id, to_role: "lab", type: "FARMER_TO_LAB", status: "rejected", created_by_user_id: farmer.user.id },
    });
  }
  await prisma.speciesVerificationLog.create({
    data: { batch_id: (await createBatch(farmer.token)).id, farmer_species_id: "x1", farmer_species: "ashwagandha", lab_species_id: "x2", lab_species: "tulsi", status: "mismatch" },
  });

  const rules = await portal("post", "/compliance-alerts/run-rules", superAdmin.token, {});
  assert.equal(rules.status, 200, JSON.stringify(rules.body));
  assert.ok(rules.body.data.created >= 2, JSON.stringify(rules.body.data));

  const list = await portal("get", "/compliance-alerts", superAdmin.token);
  assert.equal(list.status, 200, JSON.stringify(list.body));
  const types = list.body.data.alerts.map((a) => a.alert_type);
  assert.ok(types.includes("invalid_transfer"));
  assert.ok(types.includes("species_fraud"));

  const manual = await portal("post", "/compliance-alerts", superAdmin.token, { alert_type: "blacklisted_entity", severity: "CRITICAL", title: "Entity blacklisted", entity_type: "user", entity_id: farmer.user.id });
  assert.equal(manual.status, 201, JSON.stringify(manual.body));
  assert.equal(manual.body.data.alert.status, "open");

  const resolve = await portal("patch", `/compliance-alerts/${manual.body.data.alert.id}`, superAdmin.token, { status: "resolved" });
  assert.equal(resolve.status, 200, JSON.stringify(resolve.body));
  assert.equal(resolve.body.data.alert.status, "resolved");
});

// ------------------------------------------------------------ recall center

test("recall center: batch recall auto-discovers affected products, flips verification, resolves", async () => {
  const { batch, product, lot } = await runToCompletion();

  const issued = await portal("post", "/recalls", superAdmin.token, { ref_type: "batch", ref_id: batch.id, reason: "heavy metal contamination above limits", severity: "critical" });
  assert.equal(issued.status, 201, JSON.stringify(issued.body));
  assert.equal(issued.body.data.affected_count, 1);
  const recallNo = issued.body.data.recall.recall_no;
  assert.match(recallNo, /^REC-/);

  // Auto-impact: AffectedProduct row + product flipped + scope + alert + notification.
  const impacted = await prisma.affectedProduct.findFirst({ where: { batch_id: batch.id, product_id: product.id } });
  assert.ok(impacted);
  assert.equal(impacted.status, "open");
  const flipped = await prisma.product.findUnique({ where: { id: product.id } });
  assert.equal(flipped.status, "recalled");
  assert.equal(flipped.verification_status, "RECALLED");
  const scopes = await prisma.recallScope.count({ where: { recall_id: issued.body.data.recall.id } });
  assert.ok(scopes >= 1);
  const alert = await prisma.complianceAlert.findFirst({ where: { alert_type: "recall_event", entity_id: batch.id } });
  assert.ok(alert);
  const note = await prisma.adminNotification.findFirst({ where: { notification_type: "recall_event" } });
  assert.ok(note);

  const list = await portal("get", "/recalls", superAdmin.token);
  assert.equal(list.status, 200, JSON.stringify(list.body));
  assert.equal(list.body.data.recalls[0].recall_no, recallNo);

  const resolved = await portal("patch", `/recalls/${issued.body.data.recall.id}`, superAdmin.token, { status: "resolved" });
  assert.equal(resolved.status, 200, JSON.stringify(resolved.body));
  const impactedAfter = await prisma.affectedProduct.findUnique({ where: { id: impacted.id } });
  assert.equal(impactedAfter.status, "resolved");

  // Traceability now shows the recall impact.
  const trace = await portal("get", `/batches/${batch.id}`, superAdmin.token);
  assert.equal(trace.body.data.batch_trace.recall_impacts.length, 1);
  assert.ok(lot.id);
});

// ------------------------------------------------------------ investigations

test("investigations: open a case with entities, list, update to closed", async () => {
  const { batch, product } = await runToCompletion();
  const opened = await portal("post", "/investigations", regOfficer.token, {
    title: "Consumer complaint on Ashwagandha Capsules",
    case_type: "complaint",
    severity: "HIGH",
    summary: "Reported stomach discomfort",
    entities: [
      { entity_type: "batch", entity_id: batch.id, role: "subject" },
      { entity_type: "product", entity_id: product.id, role: "subject" },
    ],
  });
  assert.equal(opened.status, 201, JSON.stringify(opened.body));
  const caseRow = opened.body.data.investigation;
  assert.match(caseRow.case_no, /^INV-/);
  assert.equal(caseRow.entities.length, 2);

  const list = await portal("get", "/investigations", regOfficer.token);
  assert.equal(list.status, 200, JSON.stringify(list.body));
  assert.equal(list.body.data.total, 1);

  const detail = await portal("get", `/investigations/${caseRow.id}`, regOfficer.token);
  assert.equal(detail.status, 200, JSON.stringify(detail.body));
  assert.equal(detail.body.data.investigation.title, caseRow.title);

  const closed = await portal("patch", `/investigations/${caseRow.id}`, regOfficer.token, { status: "closed" });
  assert.equal(closed.status, 200, JSON.stringify(closed.body));
  assert.equal(closed.body.data.investigation.status, "closed");
});

// ------------------------------------------------------------ scores

test("compliance score engine computes 0-100 scores for every entity type", async () => {
  await runToCompletion();
  const res = await portal("post", "/scores/compute", superAdmin.token, {});
  assert.equal(res.status, 200, JSON.stringify(res.body));
  const types = new Set(res.body.data.scores.map((s) => s.entity_type));
  for (const t of ["farmer", "lab", "manufacturer", "transporter"]) {
    assert.ok(types.has(t), `missing ${t} score`);
  }
  const farmerScore = res.body.data.scores.find((s) => s.entity_type === "farmer" && s.entity_id === farmer.user.id);
  assert.ok(farmerScore.score >= 0 && farmerScore.score <= 100);
  assert.ok(farmerScore.grade);

  const list = await portal("get", "/scores?entity_type=farmer", superAdmin.token);
  assert.equal(list.status, 200, JSON.stringify(list.body));
  assert.ok(list.body.data.scores.length >= 1);
});

// ------------------------------------------------------------ notifications

test("notifications: recall broadcast lands in the AYUSH feed and can be marked read", async () => {
  await runToCompletion();
  const batch = await prisma.batch.findFirst({ orderBy: { created_at: "desc" } });
  await portal("post", "/recalls", superAdmin.token, { ref_type: "batch", ref_id: batch.id, reason: "labelling defect", severity: "warning" });

  const feed = await portal("get", "/notifications", superAdmin.token);
  assert.equal(feed.status, 200, JSON.stringify(feed.body));
  assert.ok(feed.body.data.notifications.some((n) => n.notification_type === "recall_event"));
  assert.ok(feed.body.data.unread >= 1);

  const target = feed.body.data.notifications.find((n) => n.notification_type === "recall_event");
  const read = await portal("post", `/notifications/${target.id}/read`, superAdmin.token, {});
  assert.equal(read.status, 200, JSON.stringify(read.body));
  assert.equal(read.body.data.notification.is_read, true);
});

// ------------------------------------------------------------ reports

test("reports: CSV export is ready with rows + download URL; jobs listed", async () => {
  await runToCompletion();
  const res = await portal("post", "/reports", superAdmin.token, { report_type: "farmer_registrations", format: "csv" });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  assert.equal(res.body.data.report.status, "ready");
  assert.ok(res.body.data.report.row_count >= 1);
  assert.match(res.body.data.download_url, /^\/uploads\/report-/);

  const trends = await portal("post", "/reports", superAdmin.token, { report_type: "certification_trends", format: "excel" });
  assert.equal(trends.status, 201, JSON.stringify(trends.body));
  assert.equal(trends.body.data.report.status, "queued");

  const list = await portal("get", "/reports", superAdmin.token);
  assert.equal(list.status, 200, JSON.stringify(list.body));
  assert.ok(list.body.data.reports.length >= 2);
});

// ------------------------------------------------------------ map

test("ecosystem map: farms, labs, manufacturers and shipment routes", async () => {
  await runToCompletion();
  const res = await portal("get", "/map", superAdmin.token);
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.ok(res.body.data.farms.length >= 1);
  assert.equal(res.body.data.farms[0].lat, FARM_LAT);
  assert.ok(res.body.data.labs.length >= 1);
  assert.ok(res.body.data.manufacturers.length >= 1);
  assert.ok(res.body.data.routes.length >= 1);
  assert.ok(res.body.data.routes.some((r) => r.destination && r.destination[0] === PUNE_LAT && r.destination[1] === PUNE_LNG));
});

// ------------------------------------------------------------ audit

test("audit log dashboard records every admin action", async () => {
  const { batch } = await runToCompletion();
  await portal("post", "/recalls", superAdmin.token, { ref_type: "batch", ref_id: batch.id, reason: "audit drill", severity: "warning" });
  const res = await portal("get", "/audit", superAdmin.token);
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.ok(res.body.data.logs.some((l) => l.action === "RECALL_ISSUED"));
  const byAction = await portal("get", "/audit?action=RECALL_ISSUED", superAdmin.token);
  assert.ok(byAction.body.data.total >= 1);
  assert.ok(byAction.body.data.logs.every((l) => l.action === "RECALL_ISSUED"));
});

// ------------------------------------------------------------ hierarchy

test("hierarchy: non-admins 403; auditor read-only; state officer scoped; regulatory officer writes", async () => {
  // Non-admins have no portal access.
  const farmerDash = await portal("get", "/dashboard", farmer.token);
  assert.equal(farmerDash.status, 403);
  const labDash = await portal("get", "/dashboard", lab.token);
  assert.equal(labDash.status, 403);

  // Auditor: reads OK, writes forbidden.
  const audDash = await portal("get", "/dashboard", auditor.token);
  assert.equal(audDash.status, 200, JSON.stringify(audDash.body));
  const audSearch = await portal("get", "/search?q=x", auditor.token);
  assert.equal(audSearch.status, 200, JSON.stringify(audSearch.body));
  const audRecall = await portal("post", "/recalls", auditor.token, { ref_type: "batch", ref_id: "nope", reason: "x" });
  assert.equal(audRecall.status, 403);
  const audAlert = await portal("post", "/compliance-alerts", auditor.token, { alert_type: "system", title: "nope" });
  assert.equal(audAlert.status, 403);
  const audReport = await portal("post", "/reports", auditor.token, { report_type: "failed_tests" });
  assert.equal(audReport.status, 201, JSON.stringify(audReport.body)); // auditor CAN export reports

  // State officer: dashboard + search + traceability yes; recalls no.
  const soDash = await portal("get", "/dashboard", stateOfficer.token);
  assert.equal(soDash.status, 200, JSON.stringify(soDash.body));
  const soRecall = await portal("post", "/recalls", stateOfficer.token, { ref_type: "batch", ref_id: "nope", reason: "x" });
  assert.equal(soRecall.status, 403);
  const soInvestigate = await portal("post", "/investigations", stateOfficer.token, { title: "x" });
  assert.equal(soInvestigate.status, 403);

  // Regulatory officer: writes allowed.
  const regRecall = await portal("post", "/recalls", regOfficer.token, { ref_type: "batch", ref_id: "nope", reason: "x" });
  assert.equal(regRecall.status, 404, JSON.stringify(regRecall.body)); // reaches the service (missing ref) — not 403
  const regInvestigate = await portal("post", "/investigations", regOfficer.token, { title: "fraud probe", entities: [{ entity_type: "user", entity_id: farmer.user.id }] });
  assert.equal(regInvestigate.status, 201, JSON.stringify(regInvestigate.body));

  // Super admin: everything.
  const saAlert = await portal("post", "/compliance-alerts", superAdmin.token, { alert_type: "blacklisted_entity", severity: "LOW", title: "test" });
  assert.equal(saAlert.status, 201, JSON.stringify(saAlert.body));
});