/* QR security: replay, forge, expiry, wrong-role rejection — port of test_qr_security.py. */
const { before, beforeEach, after, test } = require("node:test");
const assert = require("node:assert");
const jwt = require("jsonwebtoken");
const { setupDatabase, wipe, teardown, register, authHeaders, request } = require("./helpers");

setupDatabase();

const { createApp } = require("../src/app");
const { prisma } = require("../src/db/client");
const { env } = require("../src/config/env");

let app;
before(() => { app = createApp(); });
beforeEach(async () => { await wipe(prisma); });
after(async () => { await teardown(prisma); });

async function setupBatch() {
  const [farmer] = await register(app, "farmer", "f_qrsec@test.local");
  const [transporter] = await register(app, "transporter", "t_qrsec@test.local");
  const [lab] = await register(app, "lab", "l_qrsec@test.local");
  const r = await request(app)
    .post("/api/v1/batches")
    .set(authHeaders(farmer))
    .send({ species_name: "Tulsi", harvest_date: "2026-04-01", location: "Pune", weight_kg: 5.0 });
  return {
    batchId: r.body.data.herb.batch_id,
    qr1: r.body.data.qr_token,
    tokens: { farmer, transporter, lab },
  };
}

function transferClient(batchId, token, qr) {
  return request(app)
    .post(`/api/v1/batches/${batchId}/transfer`)
    .set(authHeaders(token))
    .send({ scanned_qr_token: qr, location: "x" });
}

test("replay old qr rejected", async () => {
  const s = await setupBatch();
  const r1 = await transferClient(s.batchId, s.tokens.transporter, s.qr1);
  assert.strictEqual(r1.status, 200);

  const r2 = await transferClient(s.batchId, s.tokens.lab, s.qr1);
  assert.strictEqual(r2.status, 409);
  assert.strictEqual(r2.body.error.code, "stale_qr");
});

test("forged signature rejected", async () => {
  const s = await setupBatch();
  const tampered = s.qr1.slice(0, -1) + (s.qr1.endsWith("a") ? "b" : "a");
  const r = await transferClient(s.batchId, s.tokens.transporter, tampered);
  assert.strictEqual(r.status, 400);
  assert.strictEqual(r.body.error.code, "invalid_qr");
});

test("wrong signing key rejected", async () => {
  const s = await setupBatch();
  const forged = jwt.sign(
    { typ: "batch", sub: s.batchId, holder: "attacker", phase: "with_farmer", nonce: "deadbeef", iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 },
    "completely-different-key",
    { algorithm: "HS256" }
  );
  const r = await transferClient(s.batchId, s.tokens.transporter, forged);
  assert.strictEqual(r.status, 400);
  assert.strictEqual(r.body.error.code, "invalid_qr");
});

test("expired qr rejected", async () => {
  const s = await setupBatch();
  const expired = jwt.sign(
    { typ: "batch", sub: s.batchId, holder: "some_farmer", phase: "with_farmer", nonce: "expired-test", iat: Math.floor(Date.now() / 1000) - 7200, exp: Math.floor(Date.now() / 1000) - 60 },
    env.QR_SIGNING_KEY,
    { algorithm: "HS256" }
  );
  const r = await transferClient(s.batchId, s.tokens.transporter, expired);
  assert.strictEqual(r.status, 400);
  assert.strictEqual(r.body.error.code, "invalid_qr");
  assert.ok(r.body.error.message.toLowerCase().includes("expired"));
});

test("wrong role rejected", async () => {
  const s = await setupBatch();
  const r = await transferClient(s.batchId, s.tokens.lab, s.qr1);
  assert.strictEqual(r.status, 409);
  assert.strictEqual(r.body.error.code, "invalid_transition");
});

test("cross batch qr rejected", async () => {
  const [farmer] = await register(app, "farmer", "fxb@test.local");
  const [transporter] = await register(app, "transporter", "txb@test.local");

  const newBatch = async () => {
    const r = await request(app)
      .post("/api/v1/batches")
      .set(authHeaders(farmer))
      .send({ species_name: "Tulsi", harvest_date: "2026-04-01", location: "Pune", weight_kg: 5.0 });
    return [r.body.data.herb.batch_id, r.body.data.qr_token];
  };
  const [batchA, qrA] = await newBatch();
  const [batchB] = await newBatch();
  assert.notStrictEqual(batchA, batchB);

  const r = await transferClient(batchB, transporter, qrA);
  assert.strictEqual(r.status, 400);
  assert.strictEqual(r.body.error.code, "invalid_qr");
});

test("unauthenticated transfer rejected", async () => {
  const s = await setupBatch();
  const r = await request(app)
    .post(`/api/v1/batches/${s.batchId}/transfer`)
    .send({ scanned_qr_token: s.qr1, location: "x" });
  assert.strictEqual(r.status, 401);
});