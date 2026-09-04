/**
 * Phase 5 dynamic QR engine tests — versioned, stateful ownership tokens.
 *
 * Verifies the spec's core claims on an isolated DB:
 *  - v1 is born ACTIVE at batch creation (owner = farmer)
 *  - one ACTIVE token per batch, always (DB partial index + transaction)
 *  - custody transfers rotate the QR inside one atomic transaction
 *    (spec journey: farmer v1 -> transporter v2 -> lab v3 -> transporter v4
 *     -> manufacturer v5, with phase transitions)
 *  - replay protection: transferred/revoked/expired tokens die
 *  - replacement (lost/damaged/admin) rotates without ownership change and
 *    is logged in qr_replacement_logs
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

const validate = (token, body) => request(app).post("/api/v1/qr/validate").set("Authorization", `Bearer ${token}`).send(body);
const transfer = (token, body) => request(app).post("/api/v1/qr/transfer").set("Authorization", `Bearer ${token}`).send(body);
const regenerate = (token, body) => request(app).post("/api/v1/qr/regenerate").set("Authorization", `Bearer ${token}`).send(body);

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

test("custody journey farmer->transporter->lab->transporter->manufacturer rotates QR atomically", async () => {
  const batch = await createBatch(farmer.token);

  // -- v1 farmer (born) -> v2 transporter (in_transit_to_lab)
  const qr1 = await card(batch.id, farmer.token);
  const token1 = qr1.url.split("/qr/")[1];
  const hop1 = await transfer(transporter.token, { token: token1, gps_lat: 13.1, gps_lng: 80.2 });
  assert.equal(hop1.status, 200, JSON.stringify(hop1.body));
  assert.equal(hop1.body.data.old_version, 1);
  assert.equal(hop1.body.data.new_version, 2);
  assert.equal(hop1.body.data.phase_after, "in_transit_to_lab");
  assert.equal(hop1.body.data.to_user_id, transporter.user.id);
  assert.equal(await activeCount(batch.id), 1); // one active, always

  let holder = await prisma.batch.findUnique({ where: { id: batch.id } });
  assert.equal(holder.current_holder_user_id, transporter.user.id);
  assert.equal(holder.phase, "in_transit_to_lab");

  // old token is dead (replay) and the new one validates for the transporter
  const replay1 = await validate(farmer.token, { token: token1 });
  assert.equal(replay1.body.data.valid, false);
  assert.equal(replay1.body.data.reason, "replay");
  const qr2 = await card(batch.id, transporter.token);
  const token2 = qr2.url.split("/qr/")[1];
  assert.equal(qr2.version, 2);
  const ok2 = await validate(transporter.token, { token: token2 });
  assert.equal(ok2.body.data.valid, true);
  assert.equal(ok2.body.data.owner.role, "transporter");

  // -- v2 transporter -> v3 lab (at_lab)
  const hop2 = await transfer(lab.token, { token: token2 });
  assert.equal(hop2.status, 200);
  assert.equal(hop2.body.data.new_version, 3);
  holder = await prisma.batch.findUnique({ where: { id: batch.id } });
  assert.equal(holder.current_holder_user_id, lab.user.id);
  assert.equal(holder.phase, "at_lab");
  const qr3 = await card(batch.id, lab.token);
  const token3 = qr3.url.split("/qr/")[1];

  // -- v3 lab -> v4 transporter (in_transit_to_manufacturer)
  const hop3 = await transfer(transporter.token, { token: token3 });
  assert.equal(hop3.status, 200);
  assert.equal(hop3.body.data.new_version, 4);
  assert.equal(hop3.body.data.phase_after, "in_transit_to_manufacturer");
  const qr4 = await card(batch.id, transporter.token);
  const token4 = qr4.url.split("/qr/")[1];

  // -- v4 transporter -> v5 manufacturer (with_manufacturer — terminal)
  const hop4 = await transfer(manufacturer.token, { token: token4 });
  assert.equal(hop4.status, 200);
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

test("guards: wrong role, self-transfer, terminal phase, unverified receiver", async () => {
  const batch = await createBatch(farmer.token);

  // Manufacturer cannot pull straight from the farmer (matrix violation).
  const qrF = await card(batch.id, farmer.token);
  const wrong = await transfer(manufacturer.token, { token: qrF.url.split("/qr/")[1] });
  assert.equal(wrong.status, 409);
  assert.equal(wrong.body.error.code, "invalid_transition");

  // Farmer cannot self-transfer.
  const self = await transfer(farmer.token, { token: qrF.url.split("/qr/")[1] });
  assert.equal(self.status, 409);
  assert.equal(self.body.error.code, "self_transfer");
  assert.equal(await activeCount(batch.id), 1); // nothing mutated

  // Unverified lab cannot receive (AYUSH gate).
  const unver = await transfer(unverifiedLab.token, { token: qrF.url.split("/qr/")[1] });
  assert.equal(unver.status, 403);
  assert.equal(unver.body.error.code, "account_not_verified");

  // Consumer has no custody role -> matrix violation.
  const consumerTry = await transfer(consumer.token, { token: qrF.url.split("/qr/")[1] });
  assert.equal(consumerTry.status, 409);

  // Legit journey to the terminal phase (transporter -> lab -> manufacturer
  // self-collect), then the phase is sealed.
  const qrA = await card(batch.id, farmer.token);
  const hopT = await transfer(transporter.token, { token: qrA.url.split("/qr/")[1] });
  assert.equal(hopT.status, 200);
  const qrT = await card(batch.id, transporter.token);
  const hopL = await transfer(lab.token, { token: qrT.url.split("/qr/")[1] });
  assert.equal(hopL.status, 200);
  const qrL = await card(batch.id, lab.token);
  const hopM = await transfer(manufacturer.token, { token: qrL.url.split("/qr/")[1] });
  assert.equal(hopM.status, 200);
  assert.equal(hopM.body.data.phase_after, "with_manufacturer");

  // Terminal: nobody can move it onward.
  const qrM = await card(batch.id, manufacturer.token);
  const staleTry = await transfer(manufacturer.token, { token: qrM.url.split("/qr/")[1] });
  assert.equal(staleTry.status, 409);
  assert.equal(staleTry.body.error.code, "self_transfer"); // they hold it
  const stranger = await transfer(transporter.token, { token: qrM.url.split("/qr/")[1] });
  assert.equal(stranger.status, 409);
  assert.equal(stranger.body.error.code, "invalid_transition");

  // Unauthorised role attempts were logged as anomalies.
  const unauth = await prisma.qrScanLog.count({ where: { target_type: "batch", target_id: batch.id, outcome: "unauthorized" } });
  assert.ok(unauth >= 2);
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

test("one-active invariant survives parallel-ish rotations", async () => {
  const batch = await createBatch(farmer.token);
  const qr = await card(batch.id, farmer.token);
  const token = qr.url.split("/qr/")[1];

  // Interleave transfers + regenerations; the count must stay at 1.
  await transfer(transporter.token, { token });
  const qr2 = await card(batch.id, transporter.token);
  await regenerate(transporter.token, { batch_id: batch.id, reason: "DAMAGED" });
  const qr3 = await card(batch.id, transporter.token);
  const hop = await transfer(lab.token, { token: qr3.url.split("/qr/")[1] });
  assert.equal(hop.status, 200);
  const qr4 = await card(batch.id, lab.token);
  assert.equal(qr4.version, 4);
  assert.equal(await activeCount(batch.id), 1);
  void qr2;

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
