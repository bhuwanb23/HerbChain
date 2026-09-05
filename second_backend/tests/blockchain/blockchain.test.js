/**
 * Phase 12 blockchain tests (docs/phase_12.md).
 *
 * Verifies on an isolated DB (fast retry backoff for the failure path):
 *  - queue: domain milestones write pending queue rows; the worker hashes
 *    canonical facts, anchors them (block hash + monotonic block number),
 *    receipts them and audits every step
 *  - chain integrity: prev_hash links + recomputed block hashes hold
 *  - tamper detection: mutate a DB fact -> verifyEvent flips to TAMPERED
 *    while the frozen chain stays valid
 *  - failure handling: provider outage -> retried with backoff (not due
 *    rows are skipped) -> FAILED after max retries -> requeue -> anchored
 *  - smart-contract gate: LINKED on a rejected/uncertified batch is refused
 *  - node permissions: farmer/transporter no chain access; lab reads batch
 *    chains; manufacturer reads own product chains; admin governs all
 *  - AYUSH dashboard + nodes + contract version (rules 1–5) seeded
 */
process.env.BLOCKCHAIN_RETRY_BASE_MS = "1000";
process.env.BLOCKCHAIN_MAX_RETRIES = "3";

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { setupDb } = require("./_db");

const db = setupDb();
const { prisma } = require("../../src/db/client");
const { seedRbac } = require("../../src/db/rbac");
const { seedBlockchain, processQueue, verifyEvent, verifyChain, validateContract, setProviderForTest, payloadHashOf, hashMaterialFor } = require("../../src/services/blockchain");
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

const labsReceive = (token, body) => request(app).post("/api/v1/labs/batches/receive").set("Authorization", `Bearer ${token}`).send(body);
const labsSamples = (token, body) => request(app).post("/api/v1/labs/samples").set("Authorization", `Bearer ${token}`).send(body);
const labsTests = (token, body) => request(app).post("/api/v1/labs/tests").set("Authorization", `Bearer ${token}`).send(body);
const labsResults = (token, testId, body) => request(app).post(`/api/v1/labs/tests/${testId}/results`).set("Authorization", `Bearer ${token}`).send(body);
const labsSubmit = (token, testId) => request(app).post(`/api/v1/labs/tests/${testId}/submit`).set("Authorization", `Bearer ${token}`).send({});
const labsReview = (token, body) => request(app).post("/api/v1/labs/reviews").set("Authorization", `Bearer ${token}`).send(body);
const labsCertify = (token, body) => request(app).post("/api/v1/labs/certificates").set("Authorization", `Bearer ${token}`).send(body);

/** Full lab run: create -> governed to lab -> certify (returns batch + cert). */
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

let farmer, transporter, lab, supervisor, manufacturer, manufacturer2, admin;

before(async () => {
  await seedRbac();
  await seedBlockchain();
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

  farmer = await makeUser("bf@x.dev", "farmer");
  transporter = await makeUser("bt@x.dev", "transporter", { verified: true });
  lab = await makeUser("bl@x.dev", "lab", { verified: true });
  supervisor = await makeUser("bs@x.dev", "lab", { verified: true, labRole: "supervisor" });
  manufacturer = await makeUser("bm1@x.dev", "manufacturer", { verified: true });
  manufacturer2 = await makeUser("bm2@x.dev", "manufacturer", { verified: true });
  admin = await makeUser("ba@x.dev", "admin");
  await prisma.warehouse.create({
    data: { owner_user_id: manufacturer.user.id, kind: "factory_godown", name: "Pune plant", gps_lat: PUNE_LAT, gps_lng: PUNE_LNG },
  });
});

after(async () => {
  setProviderForTest(null);
  await prisma.$disconnect();
  db.cleanup();
});

// ---- product API helpers (Phase 10) ----
const createProductApi = (token, body) => request(app).post("/api/v1/products").set("Authorization", `Bearer ${token}`).send(body);
const addFormulaApi = (token, id, body) => request(app).post(`/api/v1/products/${id}/formulas`).set("Authorization", `Bearer ${token}`).send(body);
const createRunApi = (token, body) => request(app).post("/api/v1/manufacturing/batches").set("Authorization", `Bearer ${token}`).send(body);
const startRunApi = (token, id) => request(app).post(`/api/v1/manufacturing/batches/${id}/start`).set("Authorization", `Bearer ${token}`).send({});
const completeRunApi = (token, id, body = {}) => request(app).post(`/api/v1/manufacturing/batches/${id}/complete`).set("Authorization", `Bearer ${token}`).send(body);

/** Full journey: certified batch -> manufacturer stock -> finished lot (leaves queue rows pending). */
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

// ------------------------------------------------------------ queue + worker

test("queue: BATCH_CREATED is queued; the worker hashes, anchors, receipts and audits it", async () => {
  const { batch } = await runToCompletion({ qty: 20, consumeKg: 5 });

  // Queue rows written by the domain services (all milestones pending).
  const pending = await prisma.blockchainEvent.findMany({ where: { status: "pending" }, orderBy: { recorded_at: "asc" } });
  const codes = pending.map((p) => p.anchor_code);
  for (const expected of ["BATCH_CREATED", "TRANSFERRED", "RECEIVED", "CERTIFIED", "PRODUCT_CREATED", "LINKED"]) {
    assert.ok(codes.includes(expected), `missing ${expected} in ${codes.join(",")}`);
  }

  const out = await processQueue({ actor: "test" });
  assert.equal(out.processed, pending.length, JSON.stringify(out.results));

  const batchAnchor = await prisma.blockchainEvent.findFirst({ where: { anchor_code: "BATCH_CREATED", entity_type: "batch_event" } });
  assert.equal(batchAnchor.status, "completed");
  assert.ok(batchAnchor.tx_hash);
  assert.equal(batchAnchor.block_number, 1); // first block after genesis
  assert.ok(batchAnchor.processed_at);

  const txn = await prisma.blockchainTransaction.findUnique({ where: { event_id: batchAnchor.id } });
  assert.equal(txn.transaction_hash, batchAnchor.tx_hash);
  assert.equal(txn.event_type, "BATCH_CREATED");
  // payload hash == recomputed canonical hash of the creation facts.
  const material = await hashMaterialFor({ anchor_code: "BATCH_CREATED", entity_type: "batch_event", entity_id: batchAnchor.entity_id });
  assert.equal(txn.payload_hash, payloadHashOf(material));
  assert.equal(txn.performed_by, farmer.user.id);
  assert.equal(txn.block_number, 1);

  const audit = await prisma.blockchainAuditLog.findFirst({ where: { event_id: batchAnchor.id, action: "processed" } });
  assert.ok(audit);
  assert.equal(audit.actor, "test");

  // Idempotent: a second tick anchors nothing new.
  const again = await processQueue({ actor: "test" });
  assert.equal(again.processed, 0);
  const txns = await prisma.blockchainTransaction.count();
  assert.equal(txns, pending.length);
});

// ------------------------------------------------------------ chain views

test("batch + product chain views list every anchored milestone in order with intact prev_hash chain", async () => {
  const { batch, product, lot } = await runToCompletion({ qty: 20, consumeKg: 5 });
  await processQueue({ actor: "test" });

  // Batch chain: every batch event anchor, oldest first.
  const batchChain = await require("../../src/services/blockchain").batchChain(batch.id);
  assert.equal(batchChain.batch.code, batch.code);
  const batchCodes = batchChain.anchored.map((a) => a.anchor_code);
  assert.ok(batchCodes.includes("BATCH_CREATED"));
  assert.ok(batchCodes.includes("TRANSFERRED"));
  assert.ok(batchCodes.includes("RECEIVED"));
  assert.ok(batchCodes.includes("CERTIFIED"));
  assert.equal(batchChain.integrity.valid, true);
  assert.ok(batchChain.anchored.every((a) => a.status === "completed" && a.transaction));

  // Product chain: PRODUCT_CREATED + LINKED for the finished lot.
  const productChain = await require("../../src/services/blockchain").productChain(product.id);
  assert.equal(productChain.product.code, product.code);
  const prodCodes = productChain.anchored.map((a) => a.anchor_code);
  assert.ok(prodCodes.includes("PRODUCT_CREATED"));
  assert.ok(prodCodes.includes("LINKED"));
  assert.equal(prodCodes.filter((c) => c === "PRODUCT_CREATED").length, 1);
  assert.equal(productChain.anchored.length, 2);

  // Blocks: monotonic, contiguous, hash-linked.
  const txns = await prisma.blockchainTransaction.findMany({ orderBy: { block_number: "asc" } });
  assert.equal(txns[0].block_number, 1);
  txns.forEach((t, i) => {
    assert.equal(t.block_number, i + 1);
    if (i > 0) assert.equal(t.prev_hash, (() => {
      const prev = txns[i - 1];
      const { blockCanonical, sha256 } = require("../../src/services/ledger/mockLedger");
      return sha256(blockCanonical({ ...prev, timestamp: prev.confirmed_at, performed_by: prev.performed_by, chain: prev.chain }));
    })());
  });

  const integrity = await verifyChain();
  assert.equal(integrity.valid, true);
  assert.equal(integrity.blocks, txns.length);
});

// ------------------------------------------------------------ tamper detection

test("verification: recomputed hash matches -> VALID; mutating a DB fact -> TAMPERED; frozen chain stays valid", async () => {
  const { batch } = await runToCompletion({ qty: 20, consumeKg: 5 });
  await processQueue({ actor: "test" });
  const anchor = await prisma.blockchainEvent.findFirst({ where: { anchor_code: "BATCH_CREATED", entity_type: "batch_event" }, orderBy: { recorded_at: "desc" } });

  const clean = await verifyEvent(anchor.id, { actor: "audit" });
  assert.equal(clean.verification, "VALID");
  assert.equal(clean.anchored_hash, clean.current_hash);

  // Tamper: change the batch's recorded weight (part of the anchored facts).
  await prisma.batch.update({ where: { id: batch.id }, data: { weight_kg: 999 } });
  const tampered = await verifyEvent(anchor.id, { actor: "audit" });
  assert.equal(tampered.verification, "TAMPERED");
  assert.notEqual(tampered.current_hash, tampered.anchored_hash);
  const tamperAudit = await prisma.blockchainAuditLog.findFirst({ where: { event_id: anchor.id, action: "tampered" } });
  assert.ok(tamperAudit);

  // The block itself is frozen — chain integrity is untouched.
  const integrity = await verifyChain();
  assert.equal(integrity.valid, true);

  // Restore -> VALID again.
  await prisma.batch.update({ where: { id: batch.id }, data: { weight_kg: 20 } });
  const restored = await verifyEvent(anchor.id, { actor: "audit" });
  assert.equal(restored.verification, "VALID");

  // Transaction-hash verify endpoint shape.
  const byHash = await require("../../src/services/blockchain").verifyTransactionHash(anchor.tx_hash);
  assert.equal(byHash.found, true);
  assert.equal(byHash.verification, "VALID");
  const bogus = await require("../../src/services/blockchain").verifyTransactionHash("deadbeef".repeat(8));
  assert.equal(bogus.found, false);
  assert.equal(bogus.verification, "NOT_FOUND");
});

// ------------------------------------------------------------ failure handling

test("failure handling: provider outage -> retried with backoff (due-only), FAILED after max retries, requeue recovers", async () => {
  const { batch } = await runToCompletion({ qty: 20, consumeKg: 5 });
  const anchor = await prisma.blockchainEvent.findFirst({ where: { anchor_code: "BATCH_CREATED", entity_type: "batch_event" }, orderBy: { recorded_at: "desc" } });

  // Outage: a throwing ledger provider via the test seam.
  setProviderForTest({ name: "faulty", submitBlock: async () => { throw new Error("chain unreachable"); } });

  const r1 = await processQueue({ actor: "worker" });
  const fail1 = r1.results.find((x) => x.id === anchor.id);
  assert.equal(fail1.status, "failed");
  const row1 = await prisma.blockchainEvent.findUnique({ where: { id: anchor.id } });
  assert.equal(row1.status, "pending"); // not terminal yet (1 < 5)
  assert.equal(row1.attempts, 1);
  assert.match(row1.last_error, /chain unreachable/);
  assert.ok(row1.next_attempt_at > new Date(Date.now() + 50)); // backoff scheduled
  const retriedAudit = await prisma.blockchainAuditLog.findFirst({ where: { event_id: anchor.id, action: "retried" } });
  assert.ok(retriedAudit);

  // Not due -> skipped.
  const skip = await processQueue({ actor: "worker" });
  assert.equal(skip.processed, 0);

  // Four more forced runs (each made due first) exhaust the budget -> FAILED.
  for (let i = 0; i < 4; i++) {
    await prisma.blockchainEvent.update({ where: { id: anchor.id }, data: { next_attempt_at: new Date(Date.now() - 1000) } });
    await processQueue({ actor: "worker" });
  }
  const failed = await prisma.blockchainEvent.findUnique({ where: { id: anchor.id } });
  assert.equal(failed.status, "failed");
  assert.equal(failed.attempts, 5);
  const failedAudit = await prisma.blockchainAuditLog.findFirst({ where: { event_id: anchor.id, action: "failed" } });
  assert.ok(failedAudit);

  // Requeue resets the budget; with the provider restored it anchors.
  setProviderForTest(null);
  const requeued = await require("../../src/services/blockchain").requeueFailed({ actor: "admin" });
  assert.equal(requeued.requeued, 1);
  const reset = await prisma.blockchainEvent.findUnique({ where: { id: anchor.id } });
  assert.equal(reset.status, "pending");
  assert.equal(reset.attempts, 0);

  const r2 = await processQueue({ actor: "worker" });
  const done2 = r2.results.find((x) => x.id === anchor.id);
  assert.equal(done2.status, "completed");
  const completed = await prisma.blockchainEvent.findUnique({ where: { id: anchor.id } });
  assert.equal(completed.status, "completed");
  assert.ok(completed.tx_hash);
});

// ------------------------------------------------------------ contract gate

test("smart-contract gate: LINKED on an uncertified/rejected batch is refused (rule 3)", async () => {
  // An uncertified batch with a dummy PRODUCT_LINK event.
  const batch = await createBatch(farmer.token);
  const ev = await prisma.batchEvent.create({
    data: {
      batch_id: batch.id,
      event_type: "PRODUCT_LINK",
      actor_user_id: manufacturer.user.id,
      payload_json: { product_code: "PROD-X", lot_code: "PRD-X", run_code: "MFG-X", quantity_kg: 1 },
    },
  });
  const denied = await validateContract({ anchor_code: "LINKED", entity_type: "batch_event", entity_id: ev.id });
  assert.equal(denied.valid, false);
  assert.equal(denied.rule, 3);

  // Same batch REJECTED explicitly -> still rule 3.
  await prisma.batch.update({ where: { id: batch.id }, data: { test_status: "rejected" } });
  const deniedRejected = await validateContract({ anchor_code: "LINKED", entity_type: "batch_event", entity_id: ev.id });
  assert.equal(deniedRejected.valid, false);
  assert.equal(deniedRejected.reason, "link_rejected_batch");

  // TRANSFERRED self-transfer -> rule 2.
  const selfEv = await prisma.batchEvent.create({
    data: { batch_id: batch.id, event_type: "TRANSFER", actor_user_id: farmer.user.id, from_user_id: farmer.user.id, to_user_id: farmer.user.id, phase_before: "with_farmer", phase_after: "with_farmer" },
  });
  const selfDenied = await validateContract({ anchor_code: "TRANSFERRED", entity_type: "batch_event", entity_id: selfEv.id });
  assert.equal(selfDenied.valid, false);
  assert.equal(selfDenied.rule, 2);
});

// ------------------------------------------------------------ permissions + dashboard

test("node permissions: farmer/transporter no chain access; lab reads batches; manufacturer own products; admin governs", async () => {
  setProviderForTest(null); // defensive: a failed earlier test must not leak a faulty provider
  const { batch, product } = await runToCompletion({ qty: 20, consumeKg: 5 });
  await processQueue({ actor: "test" });

  // Farmers / transporters have no chain access (backend only).
  for (const actor of [farmer, transporter]) {
    const d = await request(app).get("/api/v1/blockchain/dashboard").set("Authorization", `Bearer ${actor.token}`);
    assert.equal(d.status, 403);
    const b = await request(app).get(`/api/v1/blockchain/batches/${batch.id}`).set("Authorization", `Bearer ${actor.token}`);
    assert.equal(b.status, 403);
  }

  // Lab can read the batch chain (certification events) but not govern.
  const labChain = await request(app).get(`/api/v1/blockchain/batches/${batch.id}`).set("Authorization", `Bearer ${lab.token}`);
  assert.equal(labChain.status, 200);
  assert.ok(labChain.body.data.anchored.some((a) => a.anchor_code === "CERTIFIED"));
  const labDash = await request(app).get("/api/v1/blockchain/dashboard").set("Authorization", `Bearer ${lab.token}`);
  assert.equal(labDash.status, 403);

  // Manufacturer: own product chain OK, stranger's product forbidden.
  const mfgChain = await request(app).get(`/api/v1/blockchain/products/${product.id}`).set("Authorization", `Bearer ${manufacturer.token}`);
  assert.equal(mfgChain.status, 200);
  assert.ok(mfgChain.body.data.anchored.some((a) => a.anchor_code === "LINKED"));
  const strangerProduct = await createProductApi(manufacturer2.token, { name: "Stranger Product", category: "tablet", pack_size: "30", expiry_months: 12 });
  const denied = await request(app).get(`/api/v1/blockchain/products/${strangerProduct.body.data.product.id}`).set("Authorization", `Bearer ${manufacturer.token}`);
  assert.equal(denied.status, 403);

  // Hash verify via API (lab/manufacturer can read).
  const anchor = await prisma.blockchainEvent.findFirst({ where: { anchor_code: "CERTIFIED" }, orderBy: { recorded_at: "desc" } });
  const hashRes = await request(app).get(`/api/v1/blockchain/verify/${anchor.tx_hash}`).set("Authorization", `Bearer ${lab.token}`);
  assert.equal(hashRes.status, 200);
  assert.equal(hashRes.body.data.verification, "VALID");

  // Admin governs: dashboard + process + requeue + nodes + contracts.
  const dash = await request(app).get("/api/v1/blockchain/dashboard").set("Authorization", `Bearer ${admin.token}`);
  assert.equal(dash.status, 200);
  assert.ok(dash.body.data.dashboard.transactions.total >= 6);
  assert.equal(dash.body.data.dashboard.chain.valid, true);
  assert.equal(dash.body.data.dashboard.network.nodes, 6);

  const processApi = await request(app).post("/api/v1/blockchain/process").set("Authorization", `Bearer ${admin.token}`).send({});
  assert.equal(processApi.status, 200);
  assert.equal(processApi.body.data.processed, 0); // drained already

  const nodes = await request(app).get("/api/v1/blockchain/nodes").set("Authorization", `Bearer ${admin.token}`);
  assert.equal(nodes.status, 200);
  assert.equal(nodes.body.data.nodes.length, 6);
  const ayushNode = nodes.body.data.nodes.find((n) => n.node_code === "AYUSH-GOV-01");
  assert.equal(ayushNode.role, "governance");

  const ping = await request(app).post("/api/v1/blockchain/nodes/ORDERER-01/ping").set("Authorization", `Bearer ${admin.token}`).send({});
  assert.equal(ping.status, 200);
  assert.ok(ping.body.data.node.last_seen_at);

  const contracts = await request(app).get("/api/v1/blockchain/contracts").set("Authorization", `Bearer ${admin.token}`);
  assert.equal(contracts.status, 200);
  assert.equal(contracts.body.data.contracts.length, 1);
  assert.equal(contracts.body.data.contracts[0].rules.length, 5); // security rules 1-5
  assert.ok(contracts.body.data.contracts[0].functions.some((f) => f.name === "linkBatchToProduct"));

  const audit = await request(app).get("/api/v1/blockchain/audit").set("Authorization", `Bearer ${admin.token}`);
  assert.equal(audit.status, 200);
  assert.ok(audit.body.data.audit.some((a) => a.action === "processed"));
});

test("seedBlockchain is idempotent", async () => {
  const before2 = await prisma.blockchainNode.count();
  const out = await seedBlockchain();
  assert.equal(out.nodes, 6);
  const after2 = await prisma.blockchainNode.count();
  assert.equal(after2, before2);
});