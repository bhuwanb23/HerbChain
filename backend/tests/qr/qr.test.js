/**
 * Phase 5/6 dynamic QR engine tests — versioned, stateful ownership tokens.
 *
 * Phase 6 hardens the journey: custody moves only through an approved
 * two-party TransferRequest (receiver requests -> current holder approves ->
 * receiver executes with the scanned holder QR). Verifies on an isolated DB:
 *  - v1 is born ACTIVE at batch creation (owner = farmer)
 *  - one ACTIVE token per batch, always (DB partial index + transaction)
 *  - governed custody journey farmer v1 -> transporter v2 -> lab v3 ->
 *    transporter v4 -> manufacturer v5, with QR rotation per hop
 *  - replay protection: transferred/revoked/expired tokens die
 *  - replacement (lost/damaged/admin) rotates without ownership change
 *  - every scan/attempt lands in qr_scan_logs with the right outcome
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

async function makeUser(email, role, { verified = false, active = true } = {}) {
  const user = await prisma.user.create({
    data: {
      name: role,
      email,
      password_hash: hashPassword("password1"),
      role,
      kyc_status: verified ? "verified" : role === "farmer" ? "pending" : "pending",
      is_active: active,
    },
  });
  const login = await request(app).post("/api/v1/auth/login").send({ identifier: email, password: "password1" });
  return { user, token: login.body.data.access_token };
}

async function createBatch(farmerToken, over = {}) {
  const up = await request(app)
    .post("/api/v1/uploads")
    .set("Authorization", `Bearer ${farmerToken}`)
    .attach("file", Buffer.from("fake-image-bytes"), { filename: "h.jpg", contentType: "image/jpeg" });
  const res = await request(app)
    .post("/api/v1/batches")
    .set("Authorization", `Bearer ${farmerToken}`)
    .send({
      species_code: "ashwagandha",
      quantity: 20,
      unit: "kg",
      harvest_date: "2026-09-04",
      cultivation_type: "organic",
      gps_lat: 13.0827,
      gps_lng: 80.2707,
      asset_ids: [up.body.data.asset.id],
      ...over,
    });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body.data.batch;
}

async function card(batchId, token) {
  const res = await request(app).get(`/api/v1/batches/${batchId}/qr`).set("Authorization", `Bearer ${token}`);
  assert.equal(res.status, 200);
  return res.body.data.qr;
}

/** Active QR token for the holder. */
async function tokenOf(batchId, holderToken) {
  const qr = await card(batchId, holderToken);
  return qr.url.split("/qr/")[1];
}

const validate = (token, body) => request(app).post("/api/v1/qr/validate").set("Authorization", `Bearer ${token}`).send(body);
const transfer = (token, body) => request(app).post("/api/v1/qr/transfer").set("Authorization", `Bearer ${token}`).send(body);
const regenerate = (token, body) => request(app).post("/api/v1/qr/regenerate").set("Authorization", `Bearer ${token}`).send(body);
const reqCustody = (token, body) => request(app).post("/api/v1/transfers/request").set("Authorization", `Bearer ${token}`).send(body);
const approveReq = (token, body) => request(app).post("/api/v1/transfers/approve").set("Authorization", `Bearer ${token}`).send(body);

/**
 * One governed hop: receiver requests custody -> holder approves -> receiver
 * executes with the holder's scanned QR. Returns the execute response.
 */
async function governedHop({ receiverToken, holderToken, batchId, expectType = null }) {
  const r = await reqCustody(receiverToken, { batch_id: batchId });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  if (expectType) assert.equal(r.body.data.request.type, expectType);
  assert.equal(r.body.data.request.status, "pending");
  const requestId = r.body.data.request.id;

  const a = await approveReq(holderToken, { request_id: requestId });
  assert.equal(a.status, 200, JSON.stringify(a.body));
  assert.equal(a.body.data.request.status, "approved");

  const token = await tokenOf(batchId, holderToken);
  const ex = await transfer(receiverToken, { token });
  assert.equal(ex.status, 200, JSON.stringify(ex.body));
  assert.equal(ex.body.data.request.status, "completed");
  return ex;
}

const activeCount = (batchId) => prisma.qrToken.count({ where: { batch_id: batchId, status: "active" } });

let farmer, transporter, lab, manufacturer, consumer, admin, unverifiedLab;

before(async () => {
  await seedRbac();
  await prisma.species.createMany({
    data: [{ code: "ashwagandha", common_name: "Ashwagandha", scientific_name: "Withania somnifera", is_active: true }],
  });
  app = createApp();

  farmer = await makeUser("f@t.dev", "farmer");
  transporter = await makeUser("t@t.dev", "transporter", { verified: true });
  lab = await makeUser("l@t.dev", "lab", { verified: true });
  manufacturer = await makeUser("m@t.dev", "manufacturer", { verified: true });
  consumer = await makeUser("c@t.dev", "consumer");
  unverifiedLab = await makeUser("lu@t.dev", "lab");
  admin = await makeUser("a@t.dev", "admin");
});

after(async () => {
  await prisma.$disconnect();
  db.cleanup();
});

// ------------------------------------------------------------- birth

test("batch birth auto-mints QR v1 ACTIVE (owner = farmer, one active token)", async () => {
  const batch = await createBatch(farmer.token);
  const rows = await prisma.qrToken.findMany({ where: { batch_id: batch.id }, orderBy: { version: "asc" } });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].version, 1);
  assert.equal(rows[0].status, "active");
  assert.equal(rows[0].owner_user_id, farmer.user.id);
  assert.equal(rows[0].generated_by_user_id, farmer.user.id);
  assert.ok(rows[0].token_prefix.startsWith("hbc_"));
  assert.equal(await activeCount(batch.id), 1);

  const qr = await card(batch.id, farmer.token);
  assert.equal(qr.version, 1);
  assert.equal(qr.status, "active");
  assert.match(qr.url, /\/qr\/hbc_/);
  assert.ok(qr.png.startsWith("data:image/png"));
});

test("validate: unknown token -> not_found, logged", async () => {
  const res = await validate(farmer.token, { token: "hbc_thisIsNotARealTokenInTheDatabase" });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.valid, false);
  assert.equal(res.body.data.reason, "not_found");
  const log = await prisma.qrScanLog.findFirst({ where: { outcome: "not_found" }, orderBy: { created_at: "desc" } });
  assert.ok(log);
});

// ------------------------------------------------ transfer journey v1..v5

test("governed custody journey farmer->transporter->lab->transporter->manufacturer rotates QR atomically", async () => {
  const batch = await createBatch(farmer.token);
  let holderToken = farmer.token;
  const preToken1 = await tokenOf(batch.id, farmer.token); // v1 (born)

  // -- v1 farmer -> v2 transporter (in_transit_to_lab)
  const hop1 = await governedHop({
    receiverToken: transporter.token,
    holderToken,
    batchId: batch.id,
    expectType: "FARMER_TO_TRANSPORTER",
  });
  assert.equal(hop1.body.data.old_version, 1);
  assert.equal(hop1.body.data.new_version, 2);
  assert.equal(hop1.body.data.phase_after, "in_transit_to_lab");
  assert.equal(hop1.body.data.to_user_id, transporter.user.id);
  assert.equal(await activeCount(batch.id), 1); // one active, always

  let holder = await prisma.batch.findUnique({ where: { id: batch.id } });
  assert.equal(holder.current_holder_user_id, transporter.user.id);
  assert.equal(holder.phase, "in_transit_to_lab");
  holderToken = transporter.token;

  // old v1 token is dead (replay); the live v2 validates for the transporter
  const replay1 = await validate(farmer.token, { token: preToken1 });
  assert.equal(replay1.body.data.valid, false);
  assert.equal(replay1.body.data.reason, "replay");
  const ok2 = await validate(transporter.token, { token: await tokenOf(batch.id, transporter.token) });
  assert.equal(ok2.body.data.valid, true);
  assert.equal(ok2.body.data.owner.role, "transporter");

  // -- v2 transporter -> v3 lab (at_lab)
  const hop2 = await governedHop({ receiverToken: lab.token, holderToken, batchId: batch.id, expectType: "TRANSPORTER_TO_LAB" });
  assert.equal(hop2.body.data.new_version, 3);
  holder = await prisma.batch.findUnique({ where: { id: batch.id } });
  assert.equal(holder.current_holder_user_id, lab.user.id);
  assert.equal(holder.phase, "at_lab");
  holderToken = lab.token;

  const qr3 = await card(batch.id, lab.token);
  assert.equal(qr3.version, 3);

  // -- v3 lab -> v4 transporter (in_transit_to_manufacturer)
  const hop3 = await governedHop({ receiverToken: transporter.token, holderToken, batchId: batch.id, expectType: "LAB_TO_TRANSPORTER" });
  assert.equal(hop3.body.data.new_version, 4);
  assert.equal(hop3.body.data.phase_after, "in_transit_to_manufacturer");
  holderToken = transporter.token;

  // -- v4 transporter -> v5 manufacturer (with_manufacturer — terminal)
  const hop4 = await governedHop({ receiverToken: manufacturer.token, holderToken, batchId: batch.id, expectType: "TRANSPORTER_TO_MANUFACTURER" });
  assert.equal(hop4.body.data.new_version, 5);
  assert.equal(hop4.body.data.phase_after, "with_manufacturer");
  const qr5 = await card(batch.id, manufacturer.token);
  assert.equal(qr5.version, 5);

  // DB invariants: 5 versions, 1 active, TRANSFER events with phases, anchors
  const versions = await prisma.qrToken.findMany({ where: { batch_id: batch.id }, orderBy: { version: "asc" } });
  assert.equal(versions.length, 5);
  assert.equal(versions.filter((t) => t.status === "transferred").length, 4);
  assert.equal(await activeCount(batch.id), 1);
  const events = await prisma.batchEvent.findMany({ where: { batch_id: batch.id, event_type: "TRANSFER" }, orderBy: { created_at: "asc" } });
  assert.equal(events.length, 4);
  assert.equal(events[0].phase_before, "with_farmer");
  assert.equal(events[0].phase_after, "in_transit_to_lab");
  assert.equal(events[3].phase_after, "with_manufacturer");
  assert.equal(events[0].payload_json.token_version, 1);
  assert.equal(events[0].payload_json.new_token_version, 2);
  assert.equal(events[0].payload_json.request_id, hop1.body.data.request.id);
  const anchored = await prisma.blockchainEvent.count({
    where: { anchor_code: "TRANSFERRED", entity_id: { in: events.map((e) => e.id) } },
  });
  assert.equal(anchored, 4); // every transfer event is ledger-ready (pending)

  // history endpoint shows all versions
  const hist = await request(app).get(`/api/v1/batches/${batch.id}/qr/history`).set("Authorization", `Bearer ${manufacturer.token}`);
  assert.equal(hist.status, 200);
  assert.equal(hist.body.data.tokens.length, 5);
  assert.deepEqual(hist.body.data.tokens.map((t) => t.version), [1, 2, 3, 4, 5]);
  assert.equal(hist.body.data.tokens[4].owner.role, "manufacturer");

  // scans were logged across the journey (4 transfer successes + validates)
  const scanCount = await prisma.qrScanLog.count({ where: { target_type: "batch", target_id: batch.id, outcome: "success" } });
  assert.ok(scanCount >= 5);
});

// ---------------------------------------------------------------- guards

test("guards: unrequested transfers blocked; self/unverified/consumer blocked at request", async () => {
  const batch = await createBatch(farmer.token);

  // Manufacturer cannot request custody straight from the farmer (matrix violation).
  const wrongReq = await reqCustody(manufacturer.token, { batch_id: batch.id });
  assert.equal(wrongReq.status, 409);
  assert.equal(wrongReq.body.error.code, "invalid_transition");

  // The current holder (farmer) cannot request their own batch.
  const selfReq = await reqCustody(farmer.token, { batch_id: batch.id });
  assert.equal(selfReq.status, 403); // farmer is not a receiver role
  assert.equal(await activeCount(batch.id), 1); // nothing mutated

  // Unverified lab cannot request (AYUSH gate).
  const unverReq = await reqCustody(unverifiedLab.token, { batch_id: batch.id });
  assert.equal(unverReq.status, 403);
  assert.equal(unverReq.body.error.code, "account_not_verified");

  // Consumer has no custody role.
  const consumerReq = await reqCustody(consumer.token, { batch_id: batch.id });
  assert.equal(consumerReq.status, 403);

  // Approved request for the transporter, but a different party (lab) tries
  // to execute with the farmer's token -> blocked (no approved request for lab).
  const req = await reqCustody(transporter.token, { batch_id: batch.id });
  const reqId = req.body.data.request.id;
  await approveReq(farmer.token, { request_id: reqId });
  const stolen = await transfer(lab.token, { token: await tokenOf(batch.id, farmer.token) });
  assert.equal(stolen.status, 409);
  assert.equal(stolen.body.error.code, "transfer_not_requested");

  // Holder cancels the stale approved request before the real journey.
  const cancel = await request(app)
    .post("/api/v1/transfers/cancel")
    .set("Authorization", `Bearer ${farmer.token}`)
    .send({ request_id: reqId });
  assert.equal(cancel.status, 200);
  assert.equal(cancel.body.data.request.status, "cancelled");

  // Legit journey to the terminal phase, then the phase is sealed.
  const hopT = await governedHop({ receiverToken: transporter.token, holderToken: farmer.token, batchId: batch.id });
  assert.equal(hopT.status, 200);
  const hopL = await governedHop({ receiverToken: lab.token, holderToken: transporter.token, batchId: batch.id });
  assert.equal(hopL.status, 200);
  const hopM = await governedHop({ receiverToken: manufacturer.token, holderToken: lab.token, batchId: batch.id });
  assert.equal(hopM.body.data.phase_after, "with_manufacturer");

  // Terminal: nobody can request or move it onward.
  const terminalReq = await reqCustody(transporter.token, { batch_id: batch.id });
  assert.equal(terminalReq.status, 409);
  assert.equal(terminalReq.body.error.code, "invalid_transition");
  const stranger = await transfer(transporter.token, { token: await tokenOf(batch.id, manufacturer.token) });
  assert.equal(stranger.status, 409);
  assert.equal(stranger.body.error.code, "transfer_not_requested");
});

// -------------------------------------------------------------- regenerate

test("regenerate (lost): same owner, old REVOKED, replacement logged", async () => {
  const batch = await createBatch(farmer.token);
  const qr1 = await card(batch.id, farmer.token);

  // Non-holder cannot rotate.
  const outsider = await regenerate(transporter.token, { batch_id: batch.id, reason: "LOST" });
  assert.equal(outsider.status, 403);

  const res = await regenerate(farmer.token, { batch_id: batch.id, reason: "LOST" });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.body.data.old_version, 1);
  assert.equal(res.body.data.new_version, 2);
  assert.equal(res.body.data.reason, "LOST");

  const rows = await prisma.qrToken.findMany({ where: { batch_id: batch.id }, orderBy: { version: "asc" } });
  assert.equal(rows[0].status, "revoked");
  assert.equal(rows[0].deactivation_reason, "replaced_lost");
  assert.equal(rows[1].status, "active");
  assert.equal(rows[1].owner_user_id, farmer.user.id); // ownership unchanged
  assert.equal(await activeCount(batch.id), 1);

  const repl = await prisma.qrReplacementLog.findFirst({ where: { batch_id: batch.id } });
  assert.equal(repl.reason, "LOST");
  assert.equal(repl.old_version, 1);
  assert.equal(repl.new_version, 2);
  assert.equal(repl.created_by_user_id, farmer.user.id);

  // The old printed QR is dead; the new one is live.
  const oldToken = qr1.url.split("/qr/")[1];
  const dead = await validate(farmer.token, { token: oldToken });
  assert.equal(dead.body.data.valid, false);
  assert.equal(dead.body.data.reason, "replay");
  const qr2 = await card(batch.id, farmer.token);
  assert.equal(qr2.version, 2);

  const hist = await request(app).get(`/api/v1/batches/${batch.id}/qr/history`).set("Authorization", `Bearer ${farmer.token}`);
  assert.equal(hist.body.data.replacements.length, 1);
  assert.equal(hist.body.data.tokens.length, 2);
});

test("regenerate: admin can rotate any batch (ADMIN_REPLACEMENT); expiry regeneration keeps same owner", async () => {
  const batch = await createBatch(farmer.token);
  const adminRes = await regenerate(admin.token, { batch_id: batch.id, reason: "ADMIN_REPLACEMENT" });
  assert.equal(adminRes.status, 200);
  assert.equal(adminRes.body.data.new_version, 2);
  const token2 = adminRes.body.data.url.split("/qr/")[1];

  // Force token v2 to expire -> validate reports expired; no active card.
  await prisma.qrToken.updateMany({
    where: { batch_id: batch.id, status: "active" },
    data: { expiry_at: new Date(Date.now() - 1000) },
  });
  const expiredScan = await validate(farmer.token, { token: token2 });
  assert.equal(expiredScan.body.data.valid, false);
  assert.equal(expiredScan.body.data.reason, "expired");
  const emptyCard = await request(app).get(`/api/v1/batches/${batch.id}/qr`).set("Authorization", `Bearer ${farmer.token}`);
  assert.equal(emptyCard.body.data.qr, null);

  // Owner regenerates with EXPIRED -> v3 active, same owner, replacement logged.
  const regen = await regenerate(farmer.token, { batch_id: batch.id, reason: "EXPIRED" });
  assert.equal(regen.status, 200, JSON.stringify(regen.body));
  assert.equal(regen.body.data.new_version, 3);
  const repl = await prisma.qrReplacementLog.findFirst({ where: { batch_id: batch.id, reason: "EXPIRED" } });
  assert.ok(repl);
  const qr3 = await prisma.qrToken.findFirst({ where: { batch_id: batch.id, status: "active" } });
  assert.equal(qr3.version, 3);
  assert.equal(qr3.owner_user_id, farmer.user.id);
});

test("one-active invariant survives interleaved governed hops + regenerations", async () => {
  const batch = await createBatch(farmer.token);

  await governedHop({ receiverToken: transporter.token, holderToken: farmer.token, batchId: batch.id });
  await regenerate(transporter.token, { batch_id: batch.id, reason: "DAMAGED" });
  const qr3 = await card(batch.id, transporter.token);
  assert.equal(qr3.version, 3);
  const hop = await governedHop({ receiverToken: lab.token, holderToken: transporter.token, batchId: batch.id });
  assert.equal(hop.body.data.new_version, 4);
  assert.equal(await activeCount(batch.id), 1);

  // DB-level guard: creating a second ACTIVE token for the same batch fails.
  await assert.rejects(
    prisma.qrToken.create({
      data: {
        batch_id: batch.id,
        version: 99,
        token_hash: "x".repeat(64) + "1",
        token_cipher: "cipher",
        token_prefix: "hbc_x",
        status: "active",
        owner_user_id: lab.user.id,
        owner_role: "lab",
        generated_by_user_id: lab.user.id,
        expiry_at: new Date(Date.now() + 86400000),
      },
    }),
    (e) => e.code === "P2002" || /UNIQUE/.test(e.message)
  );
});
