/**
 * Phase 7 shipment & logistics tests (docs/phase_7.md).
 *
 * Verifies on an isolated DB:
 *  - full FARM_TO_LAB lifecycle: requested -> assigned -> accepted ->
 *    arrived_for_pickup -> picked_up -> in_transit -> arrived_destination ->
 *    delivered -> completed, with the governed two-party custody hops at
 *    pickup and delivery (approved TransferRequest + QR rotation required)
 *  - shipments NEVER move custody on their own: pickup without an approved
 *    transfer request is refused (409 transfer_not_requested)
 *  - geo-fencing: delivery outside the destination fence is refused
 *  - transporter/requester/destination role guards + status-machine gating
 *  - assignment flow incl. decline -> re-assign
 *  - GPS breadcrumbs + offline buffered sync; route history on the timeline
 *  - delay tracking + completion metrics (expected vs actual)
 *  - failure + cancellation paths, POD + documents, party-scoped read access
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

let app;

const FARM_LAT = 10.1234;
const FARM_LNG = 78.1234;
const LAB_LAT = 13.0827;
const LAB_LNG = 80.2707;

async function makeUser(email, role, { verified = false } = {}) {
  const user = await prisma.user.create({
    data: {
      name: role,
      email,
      password_hash: hashPassword("password1"),
      role,
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

async function createBatch(farmerToken) {
  const asset = await uploadAsset(farmerToken);
  const res = await request(app)
    .post("/api/v1/batches")
    .set("Authorization", `Bearer ${farmerToken}`)
    .send({
      species_code: "ashwagandha",
      quantity: 20,
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

// Shipment API helpers
const createShip = (token, body) => request(app).post("/api/v1/shipments").set("Authorization", `Bearer ${token}`).send(body);
const listShips = (token, qs = "") => request(app).get(`/api/v1/shipments${qs}`).set("Authorization", `Bearer ${token}`);
const getShip = (token, id) => request(app).get(`/api/v1/shipments/${id}`).set("Authorization", `Bearer ${token}`);
const timeline = (token, id) => request(app).get(`/api/v1/shipments/${id}/timeline`).set("Authorization", `Bearer ${token}`);
const assignShip = (token, id, body) => request(app).post(`/api/v1/shipments/${id}/assign`).set("Authorization", `Bearer ${token}`).send(body);
const acceptShip = (token, id) => request(app).post(`/api/v1/shipments/${id}/accept`).set("Authorization", `Bearer ${token}`).send({});
const declineShip = (token, id, body) => request(app).post(`/api/v1/shipments/${id}/decline`).set("Authorization", `Bearer ${token}`).send(body);
const arriveShip = (token, id, body) => request(app).post(`/api/v1/shipments/${id}/arrive`).set("Authorization", `Bearer ${token}`).send(body);
const pickupShip = (token, id, body) => request(app).post(`/api/v1/shipments/${id}/pickup`).set("Authorization", `Bearer ${token}`).send(body);
const locationShip = (token, id, body) => request(app).post(`/api/v1/shipments/${id}/location`).set("Authorization", `Bearer ${token}`).send(body);
const delayShip = (token, id, body) => request(app).post(`/api/v1/shipments/${id}/delay`).set("Authorization", `Bearer ${token}`).send(body);
const arrDestShip = (token, id, body) => request(app).post(`/api/v1/shipments/${id}/arrive-destination`).set("Authorization", `Bearer ${token}`).send(body);
const deliverShip = (token, id, body) => request(app).post(`/api/v1/shipments/${id}/deliver`).set("Authorization", `Bearer ${token}`).send(body);
const podShip = (token, id, body) => request(app).post(`/api/v1/shipments/${id}/pod`).set("Authorization", `Bearer ${token}`).send(body);
const docShip = (token, id, body) => request(app).post(`/api/v1/shipments/${id}/documents`).set("Authorization", `Bearer ${token}`).send(body);
const failShip = (token, id, body) => request(app).post(`/api/v1/shipments/${id}/fail`).set("Authorization", `Bearer ${token}`).send(body);
const cancelShip = (token, id, body) => request(app).post(`/api/v1/shipments/${id}/cancel`).set("Authorization", `Bearer ${token}`).send(body);

// Governed custody helpers (Phase 6 API)
const custodyRequest = (token, body) => request(app).post("/api/v1/transfers/request").set("Authorization", `Bearer ${token}`).send(body);
const custodyApprove = (token, body) => request(app).post("/api/v1/transfers/approve").set("Authorization", `Bearer ${token}`).send(body);

let farmer, transporter, transporter2, lab, manufacturer, admin;

async function openShipment({ scheduledOffsetH = -1, expectedOffsetH = 5, fromUser = farmer, requester = lab } = {}) {
  const batch = await createBatch(fromUser.token);
  const now = Date.now();
  const created = await createShip(requester.token, {
    ref_type: "batch",
    ref_id: batch.id,
    shipment_type: "FARM_TO_LAB",
    destination_gps_lat: LAB_LAT,
    destination_gps_lng: LAB_LNG,
    origin_gps_lat: FARM_LAT,
    origin_gps_lng: FARM_LNG,
    scheduled_pickup_at: new Date(now + scheduledOffsetH * 3600000).toISOString(),
    expected_delivery_at: new Date(now + expectedOffsetH * 3600000).toISOString(),
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  return { batch, shipment: created.body.data.shipment };
}

/** Transporter requests custody of the batch from the farmer + farmer approves. */
async function approvePickupCustody(batchId) {
  const r = await custodyRequest(transporter.token, { batch_id: batchId, reason: "farm-gate pickup" });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const a = await custodyApprove(farmer.token, { request_id: r.body.data.request.id });
  assert.equal(a.status, 200, JSON.stringify(a.body));
  assert.equal(a.body.data.request.status, "approved");
  return r.body.data.request;
}

/** Lab requests custody from the transporter (batch in_transit_to_lab) + approval. */
async function approveDeliveryCustody(batchId) {
  const r = await custodyRequest(lab.token, { batch_id: batchId, reason: "receive at lab" });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const a = await custodyApprove(transporter.token, { request_id: r.body.data.request.id });
  assert.equal(a.status, 200, JSON.stringify(a.body));
  return r.body.data.request;
}

/** Runs the shipment to picked_up (batch now held by the transporter, in_transit_to_lab). */
async function runToPickedUp({ batch, shipment }, opts = {}) {
  await approvePickupCustody(batch.id);
  const asg = await assignShip(lab.token, shipment.id, { transporter_user_id: transporter.user.id });
  assert.equal(asg.status, 200, JSON.stringify(asg.body));
  const acc = await acceptShip(transporter.token, shipment.id);
  assert.equal(acc.status, 200, JSON.stringify(acc.body));
  assert.equal(acc.body.data.shipment.status, "accepted");
  const arr = await arriveShip(transporter.token, shipment.id, { gps_lat: FARM_LAT, gps_lng: FARM_LNG, accuracy_m: 12 });
  assert.equal(arr.status, 200, JSON.stringify(arr.body));
  assert.equal(arr.body.data.shipment.status, "arrived_for_pickup");
  const photo = opts.withPhoto ? await uploadAsset(transporter.token) : null;
  const pk = await pickupShip(transporter.token, shipment.id, {
    token: await tokenOf(batch.id, farmer.token),
    gps_lat: FARM_LAT,
    gps_lng: FARM_LNG,
    accuracy_m: 10,
    photo_asset_id: photo ? photo.id : undefined,
    remarks: "cargo in good condition",
  });
  assert.equal(pk.status, 200, JSON.stringify(pk.body));
  return pk.body.data.shipment;
}

/** Takes a picked-up shipment to in_transit with GPS breadcrumbs (no custody). */
async function runToInTransit(afterPickup) {
  const p1 = await locationShip(transporter.token, afterPickup.id, { gps_lat: 10.5, gps_lng: 78.6, speed_kph: 45, note: "NH-44 north" });
  assert.equal(p1.status, 200, JSON.stringify(p1.body));
  assert.equal(p1.body.data.shipment.status, "in_transit");
  const p2 = await locationShip(transporter.token, afterPickup.id, { gps_lat: 11.0, gps_lng: 79.0 });
  assert.equal(p2.status, 200, JSON.stringify(p2.body));
  return p2.body.data.shipment;
}

/** Runs a fresh shipment all the way to in_transit (pickup + breadcrumbs). */
async function ctxToInTransit(ctx) {
  const afterPickup = await runToPickedUp(ctx);
  return runToInTransit(afterPickup);
}

/** Completes the delivery leg (approve lab request + deliver inside the fence). */
async function runToDelivered(shipment, { gps_lat = LAB_LAT, gps_lng = LAB_LNG } = {}) {
  const batch = await prisma.batch.findUnique({ where: { id: shipment.ref_id || shipment.ref?.id } });
  await approveDeliveryCustody(batch.id);
  const d = await deliverShip(lab.token, shipment.id, {
    token: await tokenOf(batch.id, transporter.token),
    gps_lat,
    gps_lng,
    accuracy_m: 8,
    receiver_name: "Dr. Kumar",
    receiver_signature: "Dr. Kumar (lab in-charge)",
    remarks: "received sealed",
  });
  return d;
}

before(async () => {
  await seedRbac();
  await prisma.species.createMany({
    data: [{ code: "ashwagandha", common_name: "Ashwagandha", scientific_name: "Withania somnifera", is_active: true }],
  });
  app = createApp();

  farmer = await makeUser("sf@x.dev", "farmer");
  transporter = await makeUser("st@x.dev", "transporter", { verified: true });
  transporter2 = await makeUser("st2@x.dev", "transporter", { verified: true });
  lab = await makeUser("sl@x.dev", "lab", { verified: true });
  manufacturer = await makeUser("sm@x.dev", "manufacturer", { verified: true });
  admin = await makeUser("sa@x.dev", "admin");
});

after(async () => {
  await prisma.$disconnect();
  db.cleanup();
});

// ------------------------------------------------------------- lifecycle

test("full FARM_TO_LAB journey: governed custody hops + completion + POD + timeline", async () => {
  const ctx = await openShipment();
  const { shipment } = ctx;
  assert.equal(shipment.status, "requested");
  assert.equal(shipment.shipment_type, "FARM_TO_LAB");
  assert.equal(shipment.parties.from.id, farmer.user.id);
  assert.equal(shipment.parties.to.id, lab.user.id);
  assert.match(shipment.shipment_no, /^SHIP-2026-\d{6}$/);

  const afterPickup = await runToPickedUp(ctx, { withPhoto: true });
  assert.equal(afterPickup.status, "picked_up");
  // Pickup evidence (GPS + photo) readable from the detail view.
  const pkDetail = await getShip(lab.token, afterPickup.id);
  assert.equal(pkDetail.status, 200);
  assert.equal(pkDetail.body.data.shipment.pickup_events.length, 1);
  assert.ok(pkDetail.body.data.shipment.pickup_events[0].photo_url);
  assert.equal(pkDetail.body.data.shipment.pickup_events[0].pickup.lat, FARM_LAT);

  // Custody moved at pickup: batch is now with the transporter (in_transit_to_lab).
  const midBatch = await prisma.batch.findUnique({ where: { id: ctx.batch.id } });
  assert.equal(midBatch.current_holder_user_id, transporter.user.id);
  assert.equal(midBatch.phase, "in_transit_to_lab");

  const afterTransit = await runToInTransit(afterPickup);
  const dly = await delayShip(transporter.token, afterTransit.id, { reason: "traffic", minutes: 20, remarks: "NH hold-up near Trichy" });
  assert.equal(dly.status, 200, JSON.stringify(dly.body));
  const arrDest = await arrDestShip(transporter.token, afterTransit.id, { gps_lat: LAB_LAT, gps_lng: LAB_LNG });
  assert.equal(arrDest.status, 200, JSON.stringify(arrDest.body));
  assert.equal(arrDest.body.data.shipment.status, "arrived_destination");

  const d = await runToDelivered(arrDest.body.data.shipment);
  assert.equal(d.status, 200, JSON.stringify(d.body));
  const done = d.body.data.shipment;
  assert.equal(done.status, "completed");
  assert.equal(done.proof.receiver_name, "Dr. Kumar");
  assert.equal(done.proof.receiver_signature, "Dr. Kumar (lab in-charge)");
  const doneDetail = await getShip(lab.token, done.id);
  assert.equal(doneDetail.status, 200);
  assert.equal(doneDetail.body.data.shipment.delivery_events.length, 1);
  assert.equal(doneDetail.body.data.shipment.delivery_events[0].receiver_role, "lab");

  // Ownership now at the lab; shipment is a separate closed record.
  const finalBatch = await prisma.batch.findUnique({ where: { id: ctx.batch.id } });
  assert.equal(finalBatch.current_holder_user_id, lab.user.id);
  assert.equal(finalBatch.phase, "at_lab");
  const activeTokens = await prisma.qrToken.count({ where: { batch_id: ctx.batch.id, status: "active" } });
  assert.equal(activeTokens, 1);

  // Metrics computed at completion (expected window far in the future -> no delay).
  const metric = await prisma.shipmentMetric.findUnique({ where: { shipment_id: done.id } });
  assert.ok(metric);
  assert.ok(metric.expected_hours > 0);
  assert.ok(metric.actual_hours > 0);

  // Timeline is an ordered append-only log through COMPLETED.
  const tl = await timeline(lab.token, done.id);
  assert.equal(tl.status, 200);
  const types = tl.body.data.timeline.map((e) => e.event_type);
  const expectSeq = [
    "REQUESTED",
    "ASSIGNED",
    "ACCEPTED",
    "ARRIVED_FOR_PICKUP",
    "PICKED_UP",
    "STARTED",
    "GPS_UPDATED",
    "GPS_UPDATED",
    "DELAYED",
    "ARRIVED_DESTINATION",
    "DELIVERED",
    "COMPLETED",
  ];
  for (const t of expectSeq) {
    assert.ok(types.includes(t), `timeline missing ${t}: ${types}`);
  }
  assert.equal(types[types.length - 1], "COMPLETED");

  // Detail view carries the resolved batch.
  const detail = await getShip(lab.token, done.id);
  assert.equal(detail.status, 200);
  assert.equal(detail.body.data.shipment.batch.code, ctx.batch.code);
});

test("a shipment can never move custody by itself: pickup requires an approved transfer request", async () => {
  const ctx = await openShipment();
  await assignShip(lab.token, ctx.shipment.id, { transporter_user_id: transporter.user.id });
  await acceptShip(transporter.token, ctx.shipment.id);
  await arriveShip(transporter.token, ctx.shipment.id, { gps_lat: FARM_LAT, gps_lng: FARM_LNG });

  const noRequest = await pickupShip(transporter.token, ctx.shipment.id, { token: await tokenOf(ctx.batch.id, farmer.token) });
  assert.equal(noRequest.status, 409, JSON.stringify(noRequest.body));
  assert.equal(noRequest.body.error.code, "transfer_not_requested");

  // Still owned by the farmer.
  const untouched = await prisma.batch.findUnique({ where: { id: ctx.batch.id } });
  assert.equal(untouched.current_holder_user_id, farmer.user.id);
  assert.equal(untouched.phase, "with_farmer");

  // Once the governed request is approved the same pickup works.
  await approvePickupCustody(ctx.batch.id);
  const ok = await pickupShip(transporter.token, ctx.shipment.id, { token: await tokenOf(ctx.batch.id, farmer.token) });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.equal(ok.body.data.shipment.status, "picked_up");
});

// ------------------------------------------------------------ geo-fence

test("geo-fencing: delivery outside the destination fence is refused (no custody change)", async () => {
  const ctx = await openShipment();
  const afterTransit = await ctxToInTransit(ctx);
  await approveDeliveryCustody(ctx.batch.id);

  const batch = await prisma.batch.findUnique({ where: { id: ctx.batch.id } });
  const far = await deliverShip(lab.token, afterTransit.id, {
    token: await tokenOf(batch.id, transporter.token),
    gps_lat: 13.2, // ~13km away
    gps_lng: 80.5,
  });
  assert.equal(far.status, 409, JSON.stringify(far.body));
  assert.equal(far.body.error.code, "geofence_violation");
  const stillTransporter = await prisma.batch.findUnique({ where: { id: ctx.batch.id } });
  assert.equal(stillTransporter.current_holder_user_id, transporter.user.id);

  // The approved request survived the refused hop — the in-fence retry succeeds.
  const good = await deliverShip(lab.token, afterTransit.id, {
    token: await tokenOf(batch.id, transporter.token),
    gps_lat: LAB_LAT,
    gps_lng: LAB_LNG,
    receiver_name: "Lab",
  });
  assert.equal(good.status, 200, JSON.stringify(good.body));
  assert.equal(good.body.data.shipment.status, "completed");
});

// ---------------------------------------------------------------- guards

test("only the assigned transporter drives the job; only the destination confirms delivery", async () => {
  const ctx = await openShipment();
  const batch = ctx.batch;

  // A transporter with no assignment cannot accept/pickup.
  const wrongAccept = await acceptShip(transporter2.token, ctx.shipment.id);
  assert.equal(wrongAccept.status, 403);
  const noPickup = await pickupShip(transporter2.token, ctx.shipment.id, { token: await tokenOf(batch.id, farmer.token) });
  assert.equal(noPickup.status, 403);

  await approvePickupCustody(batch.id);
  await assignShip(lab.token, ctx.shipment.id, { transporter_user_id: transporter.user.id });
  await acceptShip(transporter.token, ctx.shipment.id);
  await arriveShip(transporter.token, ctx.shipment.id, { gps_lat: FARM_LAT, gps_lng: FARM_LNG });

  // The farmer cannot perform the pickup scan (not the assigned transporter).
  const farmerPicksUp = await pickupShip(farmer.token, ctx.shipment.id, { token: await tokenOf(batch.id, farmer.token) });
  assert.equal(farmerPicksUp.status, 403);

  const pk = await pickupShip(transporter.token, ctx.shipment.id, { token: await tokenOf(batch.id, farmer.token) });
  assert.equal(pk.status, 200, JSON.stringify(pk.body));

  // Delivery can only be confirmed by the destination party (lab), not the transporter.
  await approveDeliveryCustody(batch.id);
  const transporterDelivers = await deliverShip(transporter.token, ctx.shipment.id, {
    token: await tokenOf(batch.id, transporter.token),
    gps_lat: LAB_LAT,
    gps_lng: LAB_LNG,
  });
  assert.equal(transporterDelivers.status, 403);
  const farmerDelivers = await deliverShip(farmer.token, ctx.shipment.id, {
    token: await tokenOf(batch.id, transporter.token),
    gps_lat: LAB_LAT,
    gps_lng: LAB_LNG,
  });
  assert.equal(farmerDelivers.status, 403);

  const good = await deliverShip(lab.token, ctx.shipment.id, {
    token: await tokenOf(batch.id, transporter.token),
    gps_lat: LAB_LAT,
    gps_lng: LAB_LNG,
    receiver_name: "Lab",
  });
  assert.equal(good.status, 200, JSON.stringify(good.body));
});

test("status machine: pickup/deliver only from legal states", async () => {
  const ctx = await openShipment();
  // Not the assigned transporter (shipment only 'requested') -> forbidden.
  const early = await pickupShip(transporter.token, ctx.shipment.id, { token: await tokenOf(ctx.batch.id, farmer.token) });
  assert.equal(early.status, 403);
  assert.equal(early.body.error.code, "forbidden");

  // Cannot accept while 'requested' (no assignment yet) -> no pending job.
  const earlyAccept = await acceptShip(transporter.token, ctx.shipment.id);
  assert.equal(earlyAccept.status, 403);
  assert.equal(earlyAccept.body.error.code, "forbidden");

  // Assign -> accept -> pickup works; then pickup again is refused. Capture the
  // holder's raw token first (the farmer loses QR-read access once custody moves).
  await approvePickupCustody(ctx.batch.id);
  await assignShip(lab.token, ctx.shipment.id, { transporter_user_id: transporter.user.id });
  await acceptShip(transporter.token, ctx.shipment.id);
  await arriveShip(transporter.token, ctx.shipment.id, { gps_lat: FARM_LAT, gps_lng: FARM_LNG });
  const v1Token = await tokenOf(ctx.batch.id, farmer.token);
  const pk = await pickupShip(transporter.token, ctx.shipment.id, { token: v1Token });
  assert.equal(pk.status, 200, JSON.stringify(pk.body));
  const twice = await pickupShip(transporter.token, ctx.shipment.id, { token: v1Token });
  assert.equal(twice.status, 409);
  assert.equal(twice.body.error.code, "invalid_state");

  // Delivery before pickup state (still 'picked_up' w/o breadcrumbs is deliverable,
  // but no approved request exists yet -> 409 transfer_not_requested, not custody).
  const d = await deliverShip(lab.token, ctx.shipment.id, {
    token: await tokenOf(ctx.batch.id, transporter.token),
    gps_lat: LAB_LAT,
    gps_lng: LAB_LNG,
  });
  assert.equal(d.status, 409);
  assert.equal(d.body.error.code, "transfer_not_requested");
});

// ------------------------------------------------------------ assignments

test("assignment flow: requester/admin assign, decline reopens, reassignment works", async () => {
  const ctx = await openShipment();

  // Only the requester (or admin) can assign.
  const farmerAssigns = await assignShip(farmer.token, ctx.shipment.id, { transporter_user_id: transporter.user.id });
  assert.equal(farmerAssigns.status, 403);
  const wrongRole = await assignShip(lab.token, ctx.shipment.id, { transporter_user_id: farmer.user.id });
  assert.equal(wrongRole.status, 400);

  // First transporter declines -> shipment rejected, open for reassignment.
  const asg1 = await assignShip(lab.token, ctx.shipment.id, { transporter_user_id: transporter2.user.id });
  assert.equal(asg1.status, 200, JSON.stringify(asg1.body));
  assert.equal(asg1.body.data.shipment.status, "assigned");
  const decl = await declineShip(transporter2.token, ctx.shipment.id, { reason: "route too far" });
  assert.equal(decl.status, 200, JSON.stringify(decl.body));
  assert.equal(decl.body.data.shipment.status, "rejected");

  // Another transporter cannot decline someone else's assignment.
  await assignShip(lab.token, ctx.shipment.id, { transporter_user_id: transporter.user.id });
  const strangerDecline = await declineShip(transporter2.token, ctx.shipment.id, { reason: "not mine" });
  assert.equal(strangerDecline.status, 403);

  const acc = await acceptShip(transporter.token, ctx.shipment.id);
  assert.equal(acc.status, 200, JSON.stringify(acc.body));
  assert.equal(acc.body.data.shipment.status, "accepted");
  assert.equal(acc.body.data.shipment.parties.transporter.id, transporter.user.id);
});

test("cancellation: requester cancels before pickup; terminal shipment cannot cancel", async () => {
  const ctx = await openShipment();
  const bad = await cancelShip(transporter.token, ctx.shipment.id, { reason: "nope" });
  assert.equal(bad.status, 403); // transporter is not yet a party

  await assignShip(lab.token, ctx.shipment.id, { transporter_user_id: transporter.user.id });
  const c = await cancelShip(lab.token, ctx.shipment.id, { reason: "batch sold locally" });
  assert.equal(c.status, 200, JSON.stringify(c.body));
  assert.equal(c.body.data.shipment.status, "cancelled");

  const after = await acceptShip(transporter.token, ctx.shipment.id);
  assert.equal(after.status, 409);
});

test("failure path: transporter reports damage -> failed + failed_delivery_logs", async () => {
  const ctx = await openShipment();
  const photo = await uploadAsset(transporter.token);
  await assignShip(lab.token, ctx.shipment.id, { transporter_user_id: transporter.user.id });
  await acceptShip(transporter.token, ctx.shipment.id);
  const f = await failShip(transporter.token, ctx.shipment.id, {
    reason: "damaged",
    remarks: "vehicle overturned; bags soaked",
    photo_asset_id: photo.id,
  });
  assert.equal(f.status, 200, JSON.stringify(f.body));
  assert.equal(f.body.data.shipment.status, "failed");
  assert.equal(f.body.data.shipment.failure_reason, "vehicle overturned; bags soaked");

  const log = await prisma.failedDeliveryLog.findFirst({ where: { shipment_id: ctx.shipment.id } });
  assert.ok(log);
  assert.equal(log.reason, "damaged");
  assert.ok(log.photo_url);

  // Bad reason codes rejected.
  const bad = await failShip(transporter.token, ctx.shipment.id, { reason: "not-a-reason" });
  assert.equal(bad.status, 400);
});

// ----------------------------------------------------- tracking + delays

test("GPS tracking: breadcrumbs build the route; offline buffered sync accepted", async () => {
  const ctx = await openShipment();
  const afterPickup = await runToPickedUp(ctx);

  // First breadcrumb after pickup flips to in_transit (STARTED event).
  const p1 = await locationShip(transporter.token, afterPickup.id, { gps_lat: 10.5, gps_lng: 78.6, speed_kph: 52, accuracy_m: 9 });
  assert.equal(p1.status, 200, JSON.stringify(p1.body));
  assert.equal(p1.body.data.shipment.status, "in_transit");

  // Offline-synced point with a past captured_at.
  const old = new Date(Date.now() - 25 * 60000).toISOString();
  const p2 = await locationShip(transporter.token, afterPickup.id, {
    gps_lat: 10.9,
    gps_lng: 79.1,
    captured_at: old,
    note: "offline buffer flush",
  });
  assert.equal(p2.status, 200, JSON.stringify(p2.body));

  const detail = await getShip(lab.token, afterPickup.id);
  assert.equal(detail.body.data.shipment.tracking.length, 4); // arrive + pickup point + 2 breadcrumbs
  const captured = detail.body.data.shipment.tracking.map((t) => new Date(t.captured_at).getTime());
  assert.ok(Math.min(...captured) <= new Date(old).getTime());

  // Not in transit yet -> no delivery; but a GPS point from a stranger is refused.
  const stranger = await locationShip(transporter2.token, afterPickup.id, { gps_lat: 1, gps_lng: 1 });
  assert.equal(stranger.status, 403);
});

test("delay + completion metrics: expected vs actual + delay reason captured", async () => {
  const ctx = await openShipment({ scheduledOffsetH: -4, expectedOffsetH: -2 }); // expected window = 2h
  const afterTransit = await ctxToInTransit(ctx);
  const dly = await delayShip(transporter.token, afterTransit.id, { reason: "traffic", minutes: 45 });
  assert.equal(dly.status, 200, JSON.stringify(dly.body));

  // Simulate a long-haul pickup time (as if the trip took 3h) before delivering.
  await prisma.shipment.update({
    where: { id: afterTransit.id },
    data: { actual_pickup_at: new Date(Date.now() - 3 * 3600000) },
  });

  await approveDeliveryCustody(ctx.batch.id);
  const batch = await prisma.batch.findUnique({ where: { id: ctx.batch.id } });
  const d = await deliverShip(lab.token, afterTransit.id, {
    token: await tokenOf(batch.id, transporter.token),
    gps_lat: LAB_LAT,
    gps_lng: LAB_LNG,
  });
  assert.equal(d.status, 200, JSON.stringify(d.body));

  const metric = await prisma.shipmentMetric.findUnique({ where: { shipment_id: afterTransit.id } });
  assert.ok(metric);
  assert.ok(metric.delay_minutes > 0, `expected a delay, got ${JSON.stringify(metric)}`);
  assert.equal(metric.delay_reason, "traffic");
});

// ----------------------------------------------------------- POD + docs

test("POD + documents attach after delivery; parties only", async () => {
  const ctx = await openShipment();
  const afterPickup = await runToPickedUp(ctx);

  // POD before delivery refused.
  const earlyPod = await podShip(lab.token, afterPickup.id, { receiver_name: "x" });
  assert.equal(earlyPod.status, 409);

  const afterTransit = await runToInTransit(afterPickup);
  const d = await runToDelivered(afterTransit);
  assert.equal(d.status, 200, JSON.stringify(d.body));

  // Extend the POD with a receiver photo (separate upload, destination party).
  const asset = await uploadAsset(lab.token);
  const pod = await podShip(lab.token, afterTransit.id, {
    receiver_name: "Dr. Kumar",
    receiver_photo_asset_id: asset.id,
    remarks: "ID verified",
  });
  assert.equal(pod.status, 201, JSON.stringify(pod.body));
  assert.ok(pod.body.data.pod.receiver_photo_url);
  assert.equal(pod.body.data.pod.receiver_name, "Dr. Kumar");

  // A stranger cannot attach POD/docs.
  const strangerPod = await podShip(transporter2.token, afterTransit.id, { receiver_name: "x" });
  assert.equal(strangerPod.status, 403);
  const strangerDoc = await docShip(transporter2.token, afterTransit.id, {
    document_type: "invoice",
    document_url: "https://files/x/invoice.pdf",
  });
  assert.equal(strangerDoc.status, 403);

  // Documents attachable by any party with a URL or owned asset.
  const doc = await docShip(lab.token, afterTransit.id, { document_type: "lab_request", document_url: "https://files/x/lab-request.pdf" });
  assert.equal(doc.status, 201, JSON.stringify(doc.body));
  const docAsset = await docShip(lab.token, afterTransit.id, { document_type: "certificate", document_asset_id: asset.id });
  assert.equal(docAsset.status, 201, JSON.stringify(docAsset.body));

  const detail = await getShip(lab.token, afterTransit.id);
  assert.equal(detail.body.data.shipment.documents.length, 2);
  assert.equal(detail.body.data.shipment.proof.receiver_name, "Dr. Kumar");
});

// -------------------------------------------------------- read scoping

test("read access: parties see the shipment; strangers do not; lists are role-scoped", async () => {
  const ctx = await openShipment();
  await approvePickupCustody(ctx.batch.id);
  await assignShip(lab.token, ctx.shipment.id, { transporter_user_id: transporter.user.id });
  await acceptShip(transporter.token, ctx.shipment.id);

  // Farmer (origin) + lab (requester) + transporter can read.
  assert.equal((await getShip(farmer.token, ctx.shipment.id)).status, 200);
  assert.equal((await getShip(lab.token, ctx.shipment.id)).status, 200);
  assert.equal((await getShip(transporter.token, ctx.shipment.id)).status, 200);
  // Unrelated transporter cannot.
  const hidden = await getShip(transporter2.token, ctx.shipment.id);
  assert.equal(hidden.status, 403);

  // Role-scoped list: transporter sees only their assigned jobs.
  const tl = await listShips(transporter.token);
  assert.equal(tl.status, 200);
  assert.ok(tl.body.data.shipments.some((s) => s.id === ctx.shipment.id));
  const tl2 = await listShips(transporter2.token);
  assert.ok(!tl2.body.data.shipments.some((s) => s.id === ctx.shipment.id));

  // Lab sees it under incoming.
  const labIn = await listShips(lab.token, "?role=incoming");
  assert.ok(labIn.body.data.shipments.some((s) => s.id === ctx.shipment.id));
  // Admin sees everything + total.
  const all = await listShips(admin.token);
  assert.equal(all.status, 200);
  assert.ok(all.body.data.total >= 1);
});

test("admin can force a batch through an admin-initiated shipment (intervention)", async () => {
  const batch = await createBatch(farmer.token);
  const created = await createShip(admin.token, {
    ref_type: "batch",
    ref_id: batch.id,
    shipment_type: "CUSTOM",
    to_user_id: lab.user.id,
    destination_gps_lat: LAB_LAT,
    destination_gps_lng: LAB_LNG,
    priority: "URGENT",
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const shipment = created.body.data.shipment;
  assert.equal(shipment.priority, "URGENT");
  assert.equal(shipment.status, "requested");
  assert.equal(shipment.parties.to.id, lab.user.id);

  await approvePickupCustody(batch.id);
  const asg = await assignShip(lab.token, shipment.id, { transporter_user_id: transporter.user.id });
  assert.equal(asg.status, 200, JSON.stringify(asg.body));
  const acc = await acceptShip(transporter.token, shipment.id);
  assert.equal(acc.status, 200, JSON.stringify(acc.body));
  const pk = await pickupShip(transporter.token, shipment.id, { token: await tokenOf(batch.id, farmer.token) });
  assert.equal(pk.status, 200, JSON.stringify(pk.body));
  assert.equal(pk.body.data.shipment.status, "picked_up");
});
