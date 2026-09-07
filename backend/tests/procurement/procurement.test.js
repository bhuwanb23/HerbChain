/**
 * Phase 9 manufacturer procurement tests (docs/phase_9.md).
 *
 * Verifies on an isolated DB:
 *  - marketplace: ONLY certified batches with a valid certificate are listed
 *    (expired certs disappear), with the availability pool; dossier detail
 *  - full journey: request -> holder approval -> InventoryAllocation RESERVED
 *    -> auto LAB_TO_MANUFACTURER shipment -> governed pickup/delivery custody
 *    hops -> GRN -> inventory ready for production
 *  - GRN partial acceptance (accepted vs rejected qty + reason) and its
 *    effect on the batch pool + manufacturer inventory + ledger
 *  - partial approval + reservation: two manufacturers cannot both fully
 *    reserve the same pool (anti-oversell); cancellation returns qty
 *  - certificate expiry blocks request AND approval (spec §11)
 *  - quality holds quarantine a batch: reserve/consume refused while ACTIVE,
 *    resolved after lift; inventory ledger records every movement
 *  - role guards: only manufacturers request; only the holder (lab) approves;
 *    receiving requires a delivered shipment + destination party
 *  - dashboard KPIs + analytics + recall readiness
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

async function createBatch(farmerToken, quantity = 20) {
  const asset = await uploadAsset(farmerToken);
  const res = await request(app)
    .post("/api/v1/batches")
    .set("Authorization", `Bearer ${farmerToken}`)
    .send({
      species_code: "ashwagandha",
      quantity,
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
async function certifyBatch() {
  const batch = await createBatch(farmer.token);
  // farmer -> transporter -> lab (governed hops)
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

  const row = await prisma.batch.findUnique({ where: { id: batch.id } });
  assert.equal(row.test_status, "certified");
  assert.equal(row.phase, "at_lab");
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

// ---- procurement API helpers ----
const certifiedList = (token, qs = "") => request(app).get(`/api/v1/manufacturer/certified-batches${qs}`).set("Authorization", `Bearer ${token}`);
const certifiedDossier = (token, id) => request(app).get(`/api/v1/manufacturer/certified-batches/${id}`).set("Authorization", `Bearer ${token}`);
const reqBatch = (token, body) => request(app).post("/api/v1/manufacturer/request-batch").set("Authorization", `Bearer ${token}`).send(body);
const listReqs = (token, qs = "") => request(app).get(`/api/v1/manufacturer/requests${qs}`).set("Authorization", `Bearer ${token}`);
const approveReq = (token, id, body = {}) => request(app).post(`/api/v1/manufacturer/requests/${id}/approve`).set("Authorization", `Bearer ${token}`).send(body);
const cancelReq = (token, id, body = {}) => request(app).post(`/api/v1/manufacturer/requests/${id}/cancel`).set("Authorization", `Bearer ${token}`).send(body);
const receive = (token, body) => request(app).post("/api/v1/manufacturer/receive").set("Authorization", `Bearer ${token}`).send(body);
const inventory = (token, qs = "") => request(app).get(`/api/v1/manufacturer/inventory${qs}`).set("Authorization", `Bearer ${token}`);
const history = (token, qs = "") => request(app).get(`/api/v1/manufacturer/inventory/history${qs}`).set("Authorization", `Bearer ${token}`);
const reserve = (token, id, body) => request(app).post(`/api/v1/manufacturer/inventory/${id}/reserve`).set("Authorization", `Bearer ${token}`).send(body);
const release = (token, id, body) => request(app).post(`/api/v1/manufacturer/inventory/${id}/release`).set("Authorization", `Bearer ${token}`).send(body);
const consume = (token, id, body) => request(app).post(`/api/v1/manufacturer/inventory/${id}/consume`).set("Authorization", `Bearer ${token}`).send(body);
const discard = (token, id, body) => request(app).post(`/api/v1/manufacturer/inventory/${id}/discard`).set("Authorization", `Bearer ${token}`).send(body);
const adjust = (token, id, body) => request(app).post(`/api/v1/manufacturer/inventory/${id}/adjust`).set("Authorization", `Bearer ${token}`).send(body);
const placeHold = (token, body) => request(app).post("/api/v1/manufacturer/quality-holds").set("Authorization", `Bearer ${token}`).send(body);
const resolveHold = (token, id, body = {}) => request(app).post(`/api/v1/manufacturer/quality-holds/${id}/resolve`).set("Authorization", `Bearer ${token}`).send(body);
const dashboard = (token) => request(app).get("/api/v1/manufacturer/dashboard").set("Authorization", `Bearer ${token}`);
const analytics = (token) => request(app).get("/api/v1/manufacturer/analytics").set("Authorization", `Bearer ${token}`);
const recall = (token, batchId) => request(app).get(`/api/v1/manufacturer/recall/${batchId}`).set("Authorization", `Bearer ${token}`);

let farmer, transporter, lab, supervisor, manufacturer, manufacturer2, admin;

async function poolOf(batchId) {
  return prisma.batchInventory.findUnique({ where: { batch_id: batchId } });
}

/**
 * Runs the auto-created LAB_TO_MANUFACTURER shipment to a DELIVERED state for
 * `dest` (the requesting manufacturer): governed pickup at the lab ->
 * breadcrumbs -> arrival -> governed delivery inside the Pune geofence.
 */
async function runShipmentDelivered({ request, dest, deliverInside = true }) {
  const shipmentId = request.shipment.id;
  const batchId = request.batch.id;

  // Pickup custody: transporter takes the batch from the lab.
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
  const pk = await pickupShip(transporter.token, shipmentId, {
    token: await tokenOf(batchId, lab.token),
    gps_lat: LAB_LAT,
    gps_lng: LAB_LNG,
  });
  assert.equal(pk.status, 200, JSON.stringify(pk.body));
  assert.equal(pk.body.data.shipment.status, "picked_up");

  const mv = await locationShip(transporter.token, shipmentId, { gps_lat: 16.0, gps_lng: 76.5, note: "NH-48 south" });
  assert.equal(mv.status, 200, JSON.stringify(mv.body));
  assert.equal(mv.body.data.shipment.status, "in_transit");
  const ad = await arrDestShip(transporter.token, shipmentId, { gps_lat: PUNE_LAT, gps_lng: PUNE_LNG });
  assert.equal(ad.status, 200, JSON.stringify(ad.body));

  // Delivery custody: the manufacturer requests from the (transporter) holder.
  const delReq = await tr(dest.token, { batch_id: batchId });
  assert.equal(delReq.status, 201, JSON.stringify(delReq.body));
  const delApprove = await ta(transporter.token, { request_id: delReq.body.data.request.id });
  assert.equal(delApprove.status, 200, JSON.stringify(delApprove.body));

  if (!deliverInside) {
    const far = await deliverShip(dest.token, shipmentId, {
      token: await tokenOf(batchId, transporter.token),
      gps_lat: PUNE_LAT + 0.5, // ~55km away
      gps_lng: PUNE_LNG,
    });
    assert.equal(far.status, 409, JSON.stringify(far.body));
    assert.equal(far.body.error.code, "geofence_violation");
  }
  const d = await deliverShip(dest.token, shipmentId, {
    token: await tokenOf(batchId, transporter.token),
    gps_lat: PUNE_LAT,
    gps_lng: PUNE_LNG,
    receiver_name: "Stores in-charge",
    receiver_signature: "S. Kumar (stores)",
    remarks: "sealed crates",
  });
  assert.equal(d.status, 200, JSON.stringify(d.body));
  assert.equal(d.body.data.shipment.status, "completed");
  return d.body.data.shipment;
}

/** Full procurement journey for one certified batch: request -> approve -> deliver -> GRN. */
async function receiveStock({ qty = 20, accepted = null, dest = manufacturer, rejectReason = null } = {}) {
  const { batch } = await certifyBatch();
  const req = await reqBatch(dest.token, { batch_id: batch.id, requested_quantity_kg: qty, notes: "procurement run" });
  assert.equal(req.status, 201, JSON.stringify(req.body));
  const ap = await approveReq(lab.token, req.body.data.request.id);
  assert.equal(ap.status, 200, JSON.stringify(ap.body));
  const shipped = await runShipmentDelivered({ request: ap.body.data.request, dest });
  const grn = await receive(dest.token, {
    shipment_id: shipped.id,
    accepted_quantity_kg: accepted ?? qty,
    rejection_reason: rejectReason || undefined,
  });
  assert.equal(grn.status, 201, JSON.stringify(grn.body));
  return { batch, request: ap.body.data.request, shipment: shipped, grn: grn.body.data.grn };
}

before(async () => {
  await seedRbac();
  await prisma.species.createMany({
    data: [{ code: "ashwagandha", common_name: "Ashwagandha", scientific_name: "Withania somnifera", is_active: true }],
  });
  await prisma.testParameter.createMany({
    data: [
      { code: "moisture", name: "Moisture content", category: "physical", unit: "%", is_active: true },
      { code: "lead", name: "Lead (Pb)", category: "safety", unit: "ppm", is_active: true },
    ],
  });
  app = createApp();

  farmer = await makeUser("pf@x.dev", "farmer");
  transporter = await makeUser("pt@x.dev", "transporter", { verified: true });
  lab = await makeUser("pl@x.dev", "lab", { verified: true });
  supervisor = await makeUser("ps@x.dev", "lab", { verified: true, labRole: "supervisor" });
  manufacturer = await makeUser("pm1@x.dev", "manufacturer", { verified: true });
  manufacturer2 = await makeUser("pm2@x.dev", "manufacturer", { verified: true });
  admin = await makeUser("pa@x.dev", "admin");
  // The manufacturer's godown becomes the shipment's destination geofence.
  await prisma.warehouse.create({
    data: { owner_user_id: manufacturer.user.id, kind: "factory_godown", name: "Pune plant", gps_lat: PUNE_LAT, gps_lng: PUNE_LNG },
  });
});

after(async () => {
  await prisma.$disconnect();
  db.cleanup();
});

// --------------------------------------------------------- full journey

test("marketplace -> request -> holder approval -> governed shipment -> GRN -> inventory", async () => {
  // Nothing procurable yet.
  const empty = await certifiedList(manufacturer.token);
  assert.equal(empty.status, 200);
  assert.equal(empty.body.data.total, 0);

  const { batch, certification } = await certifyBatch();
  assert.match(certification.certificate_number, /^CERT-2026-\d{6}$/);

  // Only the certified batch is now listed, with its available pool.
  const list = await certifiedList(manufacturer.token);
  assert.equal(list.status, 200);
  const listed = list.body.data.batches.find((b) => b.batch.id === batch.id);
  assert.ok(listed, "certified batch missing from the marketplace");
  assert.equal(listed.batch.test_status, "certified");
  assert.equal(listed.inventory.available_quantity_kg, 20);
  assert.equal(listed.certificate.certificate_number, certification.certificate_number);
  assert.equal(listed.batch.current_holder.role, "lab");
  assert.ok(listed.batch.farmer);

  // Full traceability dossier before procurement.
  const dossier = await certifiedDossier(manufacturer.token, batch.id);
  assert.equal(dossier.status, 200, JSON.stringify(dossier.body));
  assert.equal(dossier.body.data.batch.batch.code, batch.code);
  assert.equal(dossier.body.data.batch.batch.test_status, "certified");
  assert.equal(dossier.body.data.batch.certificate.certificate_number, certification.certificate_number);
  assert.ok(dossier.body.data.batch.batch.timeline.length >= 3); // CREATED + 2 governed TRANSFER events

  // Role guards: farmer can't view or request.
  assert.equal((await certifiedList(farmer.token)).status, 403);
  const farmerReq = await reqBatch(farmer.token, { batch_id: batch.id, requested_quantity_kg: 5 });
  assert.equal(farmerReq.status, 403);

  // Request + validation.
  const bad = await reqBatch(manufacturer.token, { batch_id: batch.id, requested_quantity_kg: -3 });
  assert.equal(bad.status, 400);
  const req = await reqBatch(manufacturer.token, { batch_id: batch.id, requested_quantity_kg: 12, notes: "needed for lot A" });
  assert.equal(req.status, 201, JSON.stringify(req.body));
  assert.match(req.body.data.request.request_no, /^REQ-2026-\d{6}$/);
  assert.equal(req.body.data.request.status, "pending");
  assert.equal(req.body.data.request.requested_quantity_kg, 12);

  // Only the holder (lab) can approve — not the manufacturer, not another lab.
  const mApprove = await approveReq(manufacturer.token, req.body.data.request.id);
  assert.equal(mApprove.status, 403);
  const strangerLab = await makeUser("plx@x.dev", "lab", { verified: true });
  const sApprove = await approveReq(strangerLab.token, req.body.data.request.id);
  assert.equal(sApprove.status, 403);

  // Approval locks the allocation + auto-creates the LAB_TO_MANUFACTURER shipment.
  const ap = await approveReq(lab.token, req.body.data.request.id);
  assert.equal(ap.status, 200, JSON.stringify(ap.body));
  assert.equal(ap.body.data.request.status, "approved");
  assert.equal(ap.body.data.request.approved_quantity_kg, 12);
  assert.equal(ap.body.data.request.allocation.status, "reserved");
  assert.equal(ap.body.data.request.allocation.allocated_quantity_kg, 12);
  assert.ok(ap.body.data.request.shipment, "approval must auto-create the shipment");
  const shipmentRow = await prisma.shipment.findUnique({ where: { id: ap.body.data.request.shipment.id } });
  assert.equal(shipmentRow.shipment_type, "LAB_TO_MANUFACTURER");
  assert.equal(shipmentRow.from_user_id, lab.user.id);
  assert.equal(shipmentRow.to_user_id, manufacturer.user.id);
  assert.equal(shipmentRow.requested_by_user_id, manufacturer.user.id);
  assert.equal(shipmentRow.procurement_request_id, req.body.data.request.id);
  assert.equal(shipmentRow.quantity_kg, 12);

  // Pool after reservation.
  const reserved = await poolOf(batch.id);
  assert.equal(reserved.available_quantity_kg, 8);
  assert.equal(reserved.reserved_quantity_kg, 12);

  // Governed delivery: geofence refusal first (approved request survives), then success.
  const shipped = await runShipmentDelivered({ request: ap.body.data.request, dest: manufacturer, deliverInside: false });
  assert.equal(shipped.status, "completed");

  // Ownership moved to the manufacturer through the QR engine (never via DB writes).
  const held = await prisma.batch.findUnique({ where: { id: batch.id } });
  assert.equal(held.current_holder_user_id, manufacturer.user.id);
  assert.equal(held.phase, "with_manufacturer");

  // Receive before delivery is refused; wrong manufacturer cannot receive.
  const wrongDest = await receive(manufacturer2.token, { shipment_id: shipped.id, accepted_quantity_kg: 12 });
  assert.equal(wrongDest.status, 403);
  const notDelivered = await makeUser("pnx@x.dev", "manufacturer", { verified: true });
  const early = await receive(notDelivered.token, { shipment_id: shipped.id }); // not a party at all
  assert.equal(early.status, 403);

  // GRN with partial acceptance: delivered 12 -> accepted 11 / rejected 1.
  const grn = await receive(manufacturer.token, {
    shipment_id: shipped.id,
    accepted_quantity_kg: 11,
    rejection_reason: "packaging damage",
  });
  assert.equal(grn.status, 201, JSON.stringify(grn.body));
  assert.match(grn.body.data.grn.grn_number, /^GRN-2026-\d{6}$/);
  assert.equal(grn.body.data.grn.accepted_quantity_kg, 11);
  assert.equal(grn.body.data.grn.rejected_quantity_kg, 1);
  assert.equal(grn.body.data.grn.rejection_reason, "packaging damage");

  // Pool: reserved -> consumed (accepted) + rejected qty back to available.
  const after = await poolOf(batch.id);
  assert.equal(after.reserved_quantity_kg, 0);
  assert.equal(after.consumed_quantity_kg, 11);
  assert.equal(after.available_quantity_kg, 9);

  // Request + allocation fulfilled.
  const doneReq = await prisma.batchRequest.findUnique({ where: { id: req.body.data.request.id } });
  assert.equal(doneReq.status, "fulfilled");
  const alloc = await prisma.inventoryAllocation.findUnique({ where: { request_id: req.body.data.request.id } });
  assert.equal(alloc.status, "fulfilled");

  // Traceability + anchors (spec §15): BatchEvent row + blockchain anchors.
  const ev = await prisma.batchEvent.findFirst({ where: { batch_id: batch.id, event_type: "MATERIAL_RECEIVED" } });
  assert.ok(ev);
  assert.equal(ev.payload_json.manufacturer_id, manufacturer.user.id);
  const grnAudits = await prisma.auditLog.findMany({
    where: { action: "GRN_CREATED", target_type: "goods_receipt" },
    orderBy: { created_at: "desc" },
    take: 5,
  });
  const grnAudit = grnAudits.find((a) => JSON.stringify(a.meta_json).includes(batch.id));
  assert.ok(grnAudit, "GRN audit row missing");
  const anchored = await prisma.blockchainEvent.findMany({
    where: { entity_type: "audit_log", anchor_code: { in: ["MATERIAL_RECEIVED", "BATCH_ACCEPTED", "INVENTORY_ENTERED"] } },
  });
  const anchoredIds = new Set(anchored.map((x) => x.entity_id));
  assert.ok(anchoredIds.has(grnAudit.id), "GRN audit not anchored to the ledger");
  assert.equal(new Set(anchored.map((x) => x.anchor_code)).size, 3);

  // Inventory: 11 kg AVAILABLE with a RECEIVED ledger entry.
  const inv = await inventory(manufacturer.token);
  assert.equal(inv.status, 200);
  const item = inv.body.data.inventory.find((i) => i.batch.id === batch.id);
  assert.ok(item, "inventory item missing");
  assert.equal(item.state, "AVAILABLE");
  assert.equal(item.quantities.available_kg, 11);
  assert.equal(item.last_transaction.transaction_type, "received");

  const hist = await history(manufacturer.token, `?inventory_id=${item.id}`);
  assert.equal(hist.status, 200);
  assert.equal(hist.body.data.transactions.length, 1);
  assert.equal(hist.body.data.transactions[0].quantity_kg, 11);
});

// ------------------------------------------ partial approval / reservation

test("partial approval + reservation: two manufacturers share one pool; cancel returns qty", async () => {
  const { batch } = await certifyBatch();

  // M1 requests 15 of 20 -> full approval.
  const r1 = await reqBatch(manufacturer.token, { batch_id: batch.id, requested_quantity_kg: 15 });
  assert.equal(r1.status, 201, JSON.stringify(r1.body));
  const a1 = await approveReq(lab.token, r1.body.data.request.id);
  assert.equal(a1.status, 200, JSON.stringify(a1.body));
  assert.equal(a1.body.data.request.status, "approved");
  assert.equal(a1.body.data.request.approved_quantity_kg, 15);

  // M2 requests 15 -> only 5 remain -> PARTIALLY_APPROVED at the clamp.
  const r2 = await reqBatch(manufacturer2.token, { batch_id: batch.id, requested_quantity_kg: 15 });
  assert.equal(r2.status, 201, JSON.stringify(r2.body));
  const a2 = await approveReq(lab.token, r2.body.data.request.id);
  assert.equal(a2.status, 200, JSON.stringify(a2.body));
  assert.equal(a2.body.data.request.status, "partially_approved");
  assert.equal(a2.body.data.request.approved_quantity_kg, 5);

  // Pool is exhausted: no stock remains for a third request.
  const exhausted = await poolOf(batch.id);
  assert.equal(exhausted.available_quantity_kg, 0);
  assert.equal(exhausted.reserved_quantity_kg, 20);
  // No available qty remains: even REQUESTING is refused (spec §3 no oversell).
  const m3 = await makeUser("pm3@x.dev", "manufacturer", { verified: true });
  const r3 = await reqBatch(m3.token, { batch_id: batch.id, requested_quantity_kg: 2 });
  assert.equal(r3.status, 409, JSON.stringify(r3.body));
  assert.equal(r3.body.error.code, "no_stock");

  // Requests are visible to the holder (lab) and to each manufacturer.
  const labList = await listReqs(lab.token);
  assert.equal(labList.status, 200);
  assert.ok(labList.body.data.requests.length >= 2);
  const m1List = await listReqs(manufacturer.token);
  assert.ok(m1List.body.data.requests.some((r) => r.id === r1.body.data.request.id));

  // M2 cancels its approved request -> allocation cancelled, qty back to pool.
  const cx = await cancelReq(manufacturer2.token, r2.body.data.request.id, { reason: "changed plan" });
  assert.equal(cx.status, 200, JSON.stringify(cx.body));
  assert.equal(cx.body.data.request.status, "cancelled");
  const freed = await poolOf(batch.id);
  assert.equal(freed.available_quantity_kg, 5);
  assert.equal(freed.reserved_quantity_kg, 15);

  // M1 cancels too -> everything released; auto-shipment closed pre-pickup.
  const cx1 = await cancelReq(manufacturer.token, r1.body.data.request.id, { reason: "sourcing elsewhere" });
  assert.equal(cx1.status, 200, JSON.stringify(cx1.body));
  const empty = await poolOf(batch.id);
  assert.equal(empty.available_quantity_kg, 20);
  assert.equal(empty.reserved_quantity_kg, 0);
  const closedShipment = await prisma.shipment.findUnique({ where: { id: a1.body.data.request.shipment.id } });
  assert.equal(closedShipment.status, "cancelled");
});

// ------------------------------------------------------ certificate expiry

test("certificate expiry blocks procurement at request AND approval (spec §11)", async () => {
  const { batch } = await certifyBatch();

  // Expire the COA -> the batch leaves the marketplace and cannot be requested.
  await prisma.certification.update({
    where: { batch_id: batch.id },
    data: { expiry_date: new Date(Date.now() - 86400000) },
  });
  const hidden = await certifiedList(manufacturer.token);
  assert.ok(!hidden.body.data.batches.some((b) => b.batch.id === batch.id));

  const blocked = await reqBatch(manufacturer.token, { batch_id: batch.id, requested_quantity_kg: 5 });
  assert.equal(blocked.status, 409, JSON.stringify(blocked.body));
  assert.equal(blocked.body.error.code, "certificate_expired");

  // An already-pending request also cannot be approved while expired.
  await prisma.certification.update({
    where: { batch_id: batch.id },
    data: { expiry_date: new Date(Date.now() + 365 * 86400000) },
  });
  const visible = await certifiedList(manufacturer.token);
  assert.ok(visible.body.data.batches.some((b) => b.batch.id === batch.id));

  const req = await reqBatch(manufacturer.token, { batch_id: batch.id, requested_quantity_kg: 5 });
  assert.equal(req.status, 201, JSON.stringify(req.body));
  await prisma.certification.update({
    where: { batch_id: batch.id },
    data: { expiry_date: new Date(Date.now() - 86400000) },
  });
  const ap = await approveReq(lab.token, req.body.data.request.id);
  assert.equal(ap.status, 409, JSON.stringify(ap.body));
  assert.equal(ap.body.error.code, "certificate_expired");

  // Restoring the certificate unblocks the approval.
  await prisma.certification.update({
    where: { batch_id: batch.id },
    data: { expiry_date: new Date(Date.now() + 365 * 86400000) },
  });
  const ok = await approveReq(lab.token, req.body.data.request.id);
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.equal(ok.body.data.request.status, "approved");
});

// --------------------------------------------- quality holds + inventory ops

test("quality holds quarantine production; every inventory movement is ledgered", async () => {
  const { batch, grn, shipment } = await receiveStock();

  // Place a hold -> reserve/consume refused until resolved.
  const badHold = await placeHold(manufacturer.token, { batch_id: batch.id });
  assert.equal(badHold.status, 400);
  const hold = await placeHold(manufacturer.token, { batch_id: batch.id, reason: "unexpected smell" });
  assert.equal(hold.status, 201, JSON.stringify(hold.body));
  const dup = await placeHold(manufacturer.token, { batch_id: batch.id, reason: "again" });
  assert.equal(dup.status, 409);

  const inv0 = await inventory(manufacturer.token);
  const itemId = inv0.body.data.inventory.find((i) => i.batch.id === batch.id).id;
  const blockedReserve = await reserve(manufacturer.token, itemId, { quantity_kg: 5, reference_id: "PO-1" });
  assert.equal(blockedReserve.status, 409, JSON.stringify(blockedReserve.body));
  assert.equal(blockedReserve.body.error.code, "quality_hold");

  const resolved = await resolveHold(manufacturer.token, hold.body.data.hold.id, { note: "re-inspected, fine" });
  assert.equal(resolved.status, 200, JSON.stringify(resolved.body));
  assert.equal(resolved.body.data.hold.status, "resolved");

  // Now the production ledger works: reserve -> release -> consume -> discard -> adjust.
  const r1 = await reserve(manufacturer.token, itemId, { quantity_kg: 6, reference_id: "RUN-001" });
  assert.equal(r1.status, 200, JSON.stringify(r1.body));
  assert.equal(r1.body.data.inventory.state, "RESERVED");
  assert.equal(r1.body.data.inventory.quantities.reserved_kg, 6);
  assert.equal(r1.body.data.inventory.quantities.available_kg, 14);

  const tooMuch = await reserve(manufacturer.token, itemId, { quantity_kg: 999 });
  assert.equal(tooMuch.status, 409);
  assert.equal(tooMuch.body.error.code, "insufficient_stock");

  const rl = await release(manufacturer.token, itemId, { quantity_kg: 2 });
  assert.equal(rl.status, 200, JSON.stringify(rl.body));
  assert.equal(rl.body.data.inventory.quantities.reserved_kg, 4);
  const overRelease = await release(manufacturer.token, itemId, { quantity_kg: 50 });
  assert.equal(overRelease.status, 409);

  const c1 = await consume(manufacturer.token, itemId, { quantity_kg: 4, reference_id: "LOT-A" });
  assert.equal(c1.status, 200, JSON.stringify(c1.body));
  assert.equal(c1.body.data.inventory.quantities.consumed_kg, 4);
  assert.equal(c1.body.data.inventory.quantities.available_kg, 16);

  const d = await discard(manufacturer.token, itemId, { quantity_kg: 1, reason: "contaminated sack" });
  assert.equal(d.status, 200, JSON.stringify(d.body));
  assert.equal(d.body.data.inventory.quantities.discarded_kg, 1);

  const c2 = await consume(manufacturer.token, itemId, { quantity_kg: 5, reference_id: "LOT-B" });
  assert.equal(c2.status, 200, JSON.stringify(c2.body));
  const adj = await adjust(manufacturer.token, itemId, { quantity_kg: 8, notes: "cycle count" });
  assert.equal(adj.status, 200, JSON.stringify(adj.body));
  assert.equal(adj.body.data.inventory.quantities.available_kg, 8);

  // Every movement is a ledger row (spec §10: never update inventory directly).
  const hist = await history(manufacturer.token, `?inventory_id=${itemId}`);
  const types = hist.body.data.transactions.map((t) => t.transaction_type);
  for (const expected of ["received", "reserved", "released", "consumed", "discarded", "adjusted"]) {
    assert.ok(types.includes(expected), `ledger missing ${expected}: ${types}`);
  }

  // A fresh hold blocks production again.
  const hold2 = await placeHold(manufacturer.token, { batch_id: batch.id, reason: "AYUSH audit" });
  assert.equal(hold2.status, 201);
  const blockedConsume = await consume(manufacturer.token, itemId, { quantity_kg: 1 });
  assert.equal(blockedConsume.status, 409);
  assert.equal(blockedConsume.body.error.code, "quality_hold");
  assert.ok(grn.grn_number);
  assert.ok(shipment.status);
});

// --------------------------------------------------------------- guards

test("request/receive guards: holder-only approval, destination-only GRN, scoped lists", async () => {
  const { batch } = await certifyBatch();
  const req = await reqBatch(manufacturer.token, { batch_id: batch.id, requested_quantity_kg: 5 });
  assert.equal(req.status, 201, JSON.stringify(req.body));
  const ap = await approveReq(lab.token, req.body.data.request.id);
  assert.equal(ap.status, 200, JSON.stringify(ap.body));

  // Receiving a shipment that has not been delivered is refused.
  const tooEarly = await receive(manufacturer.token, { shipment_id: ap.body.data.request.shipment.id });
  assert.equal(tooEarly.status, 409, JSON.stringify(tooEarly.body));
  assert.equal(tooEarly.body.error.code, "invalid_state");

  // Request list scoping: farmers/transporters cannot list; a non-holder lab sees nothing.
  const farmerList = await listReqs(farmer.token);
  assert.equal(farmerList.status, 403);
  const transporterList = await listReqs(transporter.token);
  assert.equal(transporterList.status, 403);
  const otherLab = await makeUser("plo@x.dev", "lab", { verified: true });
  const otherLabList = await listReqs(otherLab.token);
  assert.equal(otherLabList.status, 200);
  assert.equal(otherLabList.body.data.total, 0);

  // Each party sees its own requests in scoped lists.
  const m1List = await listReqs(manufacturer.token);
  assert.equal(m1List.status, 200);
  assert.ok(m1List.body.data.requests.some((r) => r.id === req.body.data.request.id));
});

// ------------------------------------------- dashboard / analytics / recall

test("dashboard KPIs, analytics and recall readiness reflect the manufacturer's state", async () => {
  const dash = await makeUser("pd@x.dev", "manufacturer", { verified: true });
  const stock = await receiveStock({ dest: dash, qty: 12 });
  const { batch } = stock;

  const d1 = await dashboard(dash.token);
  assert.equal(d1.status, 200, JSON.stringify(d1.body));
  assert.equal(d1.body.data.dashboard.available_inventory_kg, 12);
  assert.equal(d1.body.data.dashboard.inventory_batches, 1);
  assert.equal(d1.body.data.dashboard.pending_requests, 0);
  assert.equal(d1.body.data.dashboard.incoming_shipments, 0);
  assert.equal(d1.body.data.dashboard.active_holds, 0);
  assert.ok(Array.isArray(d1.body.data.dashboard.expiring_certificates));

  // A second batch still at the lab: a fresh pending request shows on the
  // dashboard; the holder's approval surfaces the incoming shipment leg.
  const { batch: batchB } = await certifyBatch();
  const req = await reqBatch(dash.token, { batch_id: batchB.id, requested_quantity_kg: 5 });
  assert.equal(req.status, 201);
  const d2 = await dashboard(dash.token);
  assert.equal(d2.body.data.dashboard.pending_requests, 1);
  const ap = await approveReq(lab.token, req.body.data.request.id);
  assert.equal(ap.status, 200, JSON.stringify(ap.body));
  const d3 = await dashboard(dash.token);
  assert.equal(d3.body.data.dashboard.incoming_shipments, 1);
  assert.equal(d3.body.data.dashboard.pending_requests, 1); // approved requests stay open until fulfilled
  // Close the request (never delivered) so the analytics run on steady state.
  await cancelReq(dash.token, req.body.data.request.id, { reason: "not needed" });

  const a = await analytics(dash.token);
  assert.equal(a.status, 200, JSON.stringify(a.body));
  assert.equal(a.body.data.analytics.inventory_levels_kg.available, 12);
  assert.ok(a.body.data.analytics.top_herbs.some((h) => h.species === "Ashwagandha"));
  assert.equal(a.body.data.analytics.monthly_consumption_kg.length, 6);
  assert.ok(a.body.data.analytics.supplier_farmers.length >= 1);
  assert.ok(a.body.data.analytics.kpis.consumption_rate_pct >= 0);

  // Recall readiness: where the batch is, what entered inventory, nothing consumed yet.
  const r = await recall(dash.token, batch.id);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.data.recall.inventory.available_kg, 12);
  assert.equal(r.body.data.recall.goods_receipts.length, 1);
  assert.equal(r.body.data.recall.goods_receipts[0].grn_number, stock.grn.grn_number);
  assert.deepEqual(r.body.data.recall.products_affected, []);
  assert.equal(r.body.data.recall.certificate.status, "active");
});
