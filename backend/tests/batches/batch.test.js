/**
 * Phase 3 batch tests — digital birth of a batch on an isolated DB.
 */
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const path = require("path");
const { setupDb } = require("./_db");

const db = setupDb();
const { prisma } = require("../../src/db/client");
const { seedRbac } = require("../../src/db/rbac");
const { hashPassword } = require("../../src/services/passwords");
const { createApp } = require("../../src/app");

let app;

async function reg(app, over) {
  return request(app).post("/api/v1/auth/register").send({ name: "T", email: over.email, password: "password1", role: over.role });
}

async function login(app, email) {
  const r = await request(app).post("/api/v1/auth/login").send({ identifier: email, password: "password1" });
  return r.body.data.access_token;
}

before(async () => {
  await seedRbac();
  // Species master rows (what the catalogue seed would create).
  await prisma.species.createMany({
    data: [
      { code: "ashwagandha", common_name: "Ashwagandha", scientific_name: "Withania somnifera", is_active: true },
      { code: "tulsi", common_name: "Tulsi", scientific_name: "Ocimum sanctum", is_active: true },
      { code: "inactive_sp", common_name: "Disabled", scientific_name: "Nope", is_active: false },
    ],
  });

  app = createApp();

  await reg(app, { email: "fa@test.dev", role: "farmer" });
  await reg(app, { email: "fb@test.dev", role: "farmer" });
  await reg(app, { email: "tr@test.dev", role: "transporter" });
  await reg(app, { email: "cu@test.dev", role: "consumer" });
  const admin = await prisma.user.create({
    data: { name: "Admin", email: "adm@test.dev", password_hash: hashPassword("password1"), role: "admin", kyc_status: "none" },
  });
  await prisma.user.update({ where: { id: admin.id }, data: { is_active: true } });
});

after(async () => {
  await prisma.$disconnect();
  db.cleanup();
});

const farmerA = () => login(app, "fa@test.dev");
const farmerB = () => login(app, "fb@test.dev");

async function uploadPhoto(token, meta = {}) {
  return request(app)
    .post("/api/v1/uploads")
    .set("Authorization", `Bearer ${token}`)
    .field("metadata", JSON.stringify({ device_id: "dev-1", captured_at: new Date().toISOString(), gps_lat: 13.0827, gps_lng: 80.2707, ...meta }))
    .attach("file", Buffer.from("fake-image-bytes"), { filename: "herb.jpg", contentType: "image/jpeg" });
}

const payload = (over = {}) => ({
  species_code: "ashwagandha",
  quantity: 50,
  unit: "kg",
  harvest_date: "2026-09-02",
  cultivation_type: "organic",
  gps_lat: 13.0827,
  gps_lng: 80.2707,
  gps_accuracy: 12,
  location: "Chengalpattu, Tamil Nadu",
  attributes: { color: "green", odor: "aromatic", moisture: "low" },
  ...over,
});

test("species read path is public", async () => {
  const list = await request(app).get("/api/v1/species");
  assert.equal(list.status, 200);
  assert.equal(list.body.data.total, 2); // active only
  const detail = await request(app).get("/api/v1/species/ashwagandha");
  assert.equal(detail.status, 200);
  assert.equal(detail.body.data.species.common_name, "Ashwagandha");
  assert.equal((await request(app).get("/api/v1/species/inactive_sp")).status, 404);
});

test("upload creates an Asset with audit metadata", async () => {
  const token = await farmerA();
  const up = await uploadPhoto(token);
  assert.equal(up.status, 201);
  assert.ok(up.body.data.asset.id);
  assert.equal(up.body.data.asset.mime_type, "image/jpeg");
  assert.equal(up.body.data.asset.metadata.device_id, "dev-1");
});

test("batch create happy path: one transaction -> batch + docs + event + audit + blockchain pending", async () => {
  const token = await farmerA();
  const img = await uploadPhoto(token);
  const img2 = await uploadPhoto(token);
  const assetIds = [img.body.data.asset.id, img2.body.data.asset.id];

  const res = await request(app)
    .post("/api/v1/batches")
    .set("Authorization", `Bearer ${token}`)
    .send(payload({ asset_ids: assetIds, primary_asset_id: assetIds[0] }));

  assert.equal(res.status, 201);
  const { batch } = res.body.data;
  assert.match(batch.code, /^HERB-\d{4}-\d{6}$/);
  assert.equal(batch.status, "CREATED");
  assert.equal(batch.phase, "with_farmer");
  assert.equal(batch.weight_kg, 50);
  assert.equal(batch.gps.accuracy_m, 12);
  assert.equal(batch.images.length, 2);
  assert.equal(batch.images.filter((i) => i.is_primary).length, 1);
  assert.equal(res.body.data.duplicate_warning, undefined);

  const dbRow = await prisma.batch.findUnique({ where: { id: batch.id } });
  assert.equal(dbRow.current_holder_user_id, dbRow.farmer_id);

  // Phase 5: QR v1 is born ACTIVE with the batch, owned by the farmer.
  const qr = await prisma.qrToken.findFirst({ where: { batch_id: batch.id } });
  assert.equal(qr.version, 1);
  assert.equal(qr.status, "active");
  assert.equal(qr.owner_user_id, dbRow.farmer_id);
  assert.equal(qr.token_prefix.startsWith("hbc_"), true);
  assert.ok(qr.token_cipher); // encrypted raw kept for re-printing

  const ev = await prisma.batchEvent.findFirst({ where: { batch_id: batch.id } });
  assert.equal(ev.event_type, "CREATED");
  assert.equal(ev.to_user_id, dbRow.farmer_id);
  assert.equal(ev.from_user_id, null);
  assert.equal(ev.phase_after, "with_farmer");

  const audit = await prisma.auditLog.findFirst({ where: { action: "BATCH_CREATED", target_id: batch.id } });
  assert.ok(audit);
  const bc = await prisma.blockchainEvent.findFirst({ where: { anchor_code: "BATCH_CREATED", entity_type: "batch_event" } });
  assert.equal(bc.status, "pending");
  assert.equal(bc.entity_id, ev.id);
});

test("validations: no auth 401, non-farmer 403, unknown species 404, bad inputs 400", async () => {
  const token = await farmerA();
  const img = await uploadPhoto(token);
  const base = payload({ asset_ids: [img.body.data.asset.id] });

  assert.equal((await request(app).post("/api/v1/batches").send(base)).status, 401);

  const transporter = await login(app, "tr@test.dev");
  assert.equal((await request(app).post("/api/v1/batches").set("Authorization", `Bearer ${transporter}`).send(base)).status, 403);
  const consumer = await login(app, "cu@test.dev");
  assert.equal((await request(app).post("/api/v1/batches").set("Authorization", `Bearer ${consumer}`).send(base)).status, 403);

  assert.equal((await request(app).post("/api/v1/batches").set("Authorization", `Bearer ${token}`).send(payload({ species_code: "nope", asset_ids: [img.body.data.asset.id] }))).status, 404);
  assert.equal((await request(app).post("/api/v1/batches").set("Authorization", `Bearer ${token}`).send(payload({ species_code: "inactive_sp", asset_ids: [img.body.data.asset.id] }))).status, 404);
  assert.equal((await request(app).post("/api/v1/batches").set("Authorization", `Bearer ${token}`).send(payload({ quantity: -1, asset_ids: [img.body.data.asset.id] }))).status, 400);
  assert.equal((await request(app).post("/api/v1/batches").set("Authorization", `Bearer ${token}`).send(payload({ asset_ids: [] }))).status, 400);
  assert.equal((await request(app).post("/api/v1/batches").set("Authorization", `Bearer ${token}`).send(payload({ asset_ids: [img.body.data.asset.id], cultivation_type: "bio" }))).status, 400);
});

test("unit conversion: gram and ton normalize to kg", async () => {
  const token = await farmerA();
  const img = await uploadPhoto(token);
  const resG = await request(app)
    .post("/api/v1/batches")
    .set("Authorization", `Bearer ${token}`)
    .send(payload({ species_code: "tulsi", quantity: 500, unit: "gram", asset_ids: [img.body.data.asset.id] }));
  assert.equal(resG.body.data.batch.weight_kg, 0.5);

  const resT = await request(app)
    .post("/api/v1/batches")
    .set("Authorization", `Bearer ${token}`)
    .send(payload({ species_code: "tulsi", quantity: 1, unit: "ton", asset_ids: [img.body.data.asset.id] }));
  assert.equal(resT.body.data.batch.weight_kg, 1000);
});

test("duplicate detection warns (same farmer/species/date/weight) but never blocks", async () => {
  const token = await farmerA();
  const img = await uploadPhoto(token);
  const ids = [img.body.data.asset.id];
  const first = await request(app).post("/api/v1/batches").set("Authorization", `Bearer ${token}`).send(payload({ species_code: "tulsi", quantity: 30, asset_ids: ids }));
  assert.equal(first.body.data.duplicate_warning, undefined);

  const dup = await request(app).post("/api/v1/batches").set("Authorization", `Bearer ${token}`).send(payload({ species_code: "tulsi", quantity: 30, asset_ids: ids }));
  assert.equal(dup.status, 201);
  assert.ok(dup.body.data.duplicate_warning);

  const notDup = await request(app).post("/api/v1/batches").set("Authorization", `Bearer ${token}`).send(payload({ species_code: "tulsi", quantity: 55, asset_ids: ids }));
  assert.equal(notDup.body.data.duplicate_warning, undefined);
});

test("mine + detail scoping: farmers see only their own batches; admin sees all", async () => {
  const tokenA = await farmerA();
  const img = await uploadPhoto(tokenA);
  const created = await request(app).post("/api/v1/batches").set("Authorization", `Bearer ${tokenA}`).send(payload({ species_code: "tulsi", quantity: 12, asset_ids: [img.body.data.asset.id] }));
  const batchId = created.body.data.batch.id;

  const mineA = await request(app).get("/api/v1/batches/mine").set("Authorization", `Bearer ${tokenA}`);
  assert.ok(mineA.body.data.batches.some((b) => b.id === batchId));

  const tokenB = await farmerB();
  const mineB = await request(app).get("/api/v1/batches/mine").set("Authorization", `Bearer ${tokenB}`);
  assert.equal(mineB.body.data.batches.length, 0);

  const peeking = await request(app).get(`/api/v1/batches/${batchId}`).set("Authorization", `Bearer ${tokenB}`);
  assert.equal(peeking.status, 403);

  const adminTok = await login(app, "adm@test.dev");
  const adminView = await request(app).get(`/api/v1/batches/${batchId}`).set("Authorization", `Bearer ${adminTok}`);
  assert.equal(adminView.status, 200);

  const history = await request(app).get(`/api/v1/batches/${batchId}/history`).set("Authorization", `Bearer ${tokenA}`);
  assert.equal(history.status, 200);
  assert.equal(history.body.data.events[0].event_type, "CREATED");
});

test("origin is immutable: no route exposes edits to farmer/species/harvest/gps", async () => {
  const routes = ["/api/v1/batches/x", "/api/v1/batches/x/history", "/api/v1/batches/x/qr"];
  const token = await farmerA();
  for (const r of routes) {
    const patch = await request(app).patch(r).set("Authorization", `Bearer ${token}`).send({ farmer_id: "x" });
    assert.ok([404, 405].includes(patch.status), `${r} has no update path (got ${patch.status})`);
  }
});

test("QR card: active v1 token with captioned PNG; old stateless verify route is gone", async () => {
  const token = await farmerA();
  const img = await uploadPhoto(token);
  const created = await request(app).post("/api/v1/batches").set("Authorization", `Bearer ${token}`).send(payload({ species_code: "ashwagandha", quantity: 5, asset_ids: [img.body.data.asset.id] }));
  const batchId = created.body.data.batch.id;

  const qr = await request(app).get(`/api/v1/batches/${batchId}/qr`).set("Authorization", `Bearer ${token}`);
  assert.equal(qr.status, 200);
  assert.equal(qr.body.data.code.startsWith("HERB-"), true);
  assert.equal(qr.body.data.qr.version, 1);
  assert.equal(qr.body.data.qr.status, "active");
  assert.match(qr.body.data.qr.token_prefix, /^hbc_/);
  assert.ok(qr.body.data.qr.png.startsWith("data:image/png"));
  assert.match(qr.body.data.qr.url, /\/qr\/hbc_/);

  // The printed token validates against the live engine.
  const qrToken = qr.body.data.qr.url.split("/qr/")[1];
  const val = await request(app).post("/api/v1/qr/validate").set("Authorization", `Bearer ${token}`).send({ token: qrToken });
  assert.equal(val.status, 200);
  assert.equal(val.body.data.valid, true);
  assert.equal(val.body.data.version, 1);
  assert.equal(val.body.data.owner.role, "farmer");

  const hist = await request(app).get(`/api/v1/batches/${batchId}/qr/history`).set("Authorization", `Bearer ${token}`);
  assert.equal(hist.status, 200);
  assert.equal(hist.body.data.tokens.length, 1);
  assert.equal(hist.body.data.tokens[0].version, 1);

  // Stateless-era endpoint is removed -> 404.
  const gone = await request(app).post(`/api/v1/batches/${batchId}/qr/verify`).set("Authorization", `Bearer ${token}`).send({ token: qrToken });
  assert.equal(gone.status, 404);
});

test("QR card is restricted to holder/admin", async () => {
  const token = await farmerA();
  const img = await uploadPhoto(token);
  const created = await request(app).post("/api/v1/batches").set("Authorization", `Bearer ${token}`).send(payload({ quantity: 3, asset_ids: [img.body.data.asset.id] }));
  const batchId = created.body.data.batch.id;
  const tokenB = await farmerB();
  const denied = await request(app).get(`/api/v1/batches/${batchId}/qr`).set("Authorization", `Bearer ${tokenB}`);
  assert.equal(denied.status, 403);
  const adminTok = await login(app, "adm@test.dev");
  assert.equal((await request(app).get(`/api/v1/batches/${batchId}/qr`).set("Authorization", `Bearer ${adminTok}`)).status, 200);
});
