/* Tests for POST /api/v1/batches/:id/split — port of test_batch_split.py. */
const { before, beforeEach, after, test } = require("node:test");
const assert = require("node:assert");
const { setupDatabase, wipe, teardown, register, authHeaders, request } = require("./helpers");

setupDatabase();

const { createApp } = require("../src/app");
const { prisma } = require("../src/db/client");

let app;
before(() => { app = createApp(); });
beforeEach(async () => { await wipe(prisma); });
after(async () => { await teardown(prisma); });

async function actors() {
  const [farmer] = await register(app, "farmer", "f.split@test.local");
  const [otherFarmer] = await register(app, "farmer", "of.split@test.local");
  const [transporter] = await register(app, "transporter", "t.split@test.local");
  return { farmer, otherFarmer, transporter };
}

async function createBatch(token, weight = 10.0) {
  const r = await request(app)
    .post("/api/v1/batches")
    .set(authHeaders(token))
    .send({ species_name: "Tulsi", harvest_date: "2026-04-01", location: "Pune", weight_kg: weight });
  assert.strictEqual(r.status, 201, JSON.stringify(r.body));
  return [r.body.data.herb.batch_id, r.body.data.qr_token];
}

test("split into two children", async () => {
  const { farmer } = await actors();
  const [batchId] = await createBatch(farmer, 10.0);

  const r = await request(app)
    .post(`/api/v1/batches/${batchId}/split`)
    .set(authHeaders(farmer))
    .send({ splits: [{ weight_kg: 6.0, note: "Buyer A" }, { weight_kg: 4.0, note: "Buyer B" }] });
  assert.strictEqual(r.status, 201, JSON.stringify(r.body));
  const body = r.body.data;
  assert.strictEqual(body.parent_batch_id, batchId);
  assert.strictEqual(body.parent_consumed, true);
  assert.strictEqual(body.children.length, 2);
  const weights = body.children.map((c) => c.weight_kg).sort();
  assert.deepStrictEqual(weights, [4.0, 6.0]);
  for (const c of body.children) assert.ok(c.qr_token);
});

test("partial split keeps parent", async () => {
  const { farmer } = await actors();
  const [batchId] = await createBatch(farmer, 10.0);
  const r = await request(app)
    .post(`/api/v1/batches/${batchId}/split`)
    .set(authHeaders(farmer))
    .send({ splits: [{ weight_kg: 3.0 }] });
  assert.strictEqual(r.status, 201);
  const body = r.body.data;
  assert.strictEqual(body.parent_consumed, false);
  assert.strictEqual(body.parent_remaining_kg, 7.0);
});

test("split overflow rejected", async () => {
  const { farmer } = await actors();
  const [batchId] = await createBatch(farmer, 5.0);
  const r = await request(app)
    .post(`/api/v1/batches/${batchId}/split`)
    .set(authHeaders(farmer))
    .send({ splits: [{ weight_kg: 6.0 }] });
  assert.strictEqual(r.status, 400);
});

test("only original farmer can split", async () => {
  const { farmer, otherFarmer } = await actors();
  const [batchId] = await createBatch(farmer, 4.0);
  const r = await request(app)
    .post(`/api/v1/batches/${batchId}/split`)
    .set(authHeaders(otherFarmer))
    .send({ splits: [{ weight_kg: 1.0 }] });
  assert.strictEqual(r.status, 403);
});

test("non-farmer cannot split", async () => {
  const { farmer, transporter } = await actors();
  const [batchId] = await createBatch(farmer, 4.0);
  const r = await request(app)
    .post(`/api/v1/batches/${batchId}/split`)
    .set(authHeaders(transporter))
    .send({ splits: [{ weight_kg: 1.0 }] });
  assert.strictEqual(r.status, 403);
});