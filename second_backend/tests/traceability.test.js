/* Traceability: public batch journey, product journey, raw-QR resolve — port of test_traceability.py. */
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

/** Drive a batch all the way to consumed-in-product; return ids + tokens. */
async function fullPipeline() {
  const [farmer] = await register(app, "farmer", "fp@test.local");
  const [transporter] = await register(app, "transporter", "tp@test.local");
  const [lab] = await register(app, "lab", "lp@test.local");
  const [manufacturer] = await register(app, "manufacturer", "mp@test.local");

  const r = await request(app)
    .post("/api/v1/batches")
    .set(authHeaders(farmer))
    .send({ species_name: "Ashwagandha", harvest_date: "2026-03-15", location: "Nashik", weight_kg: 25.0, gps_lat: 19.99, gps_lng: 73.78 });
  const batchId = r.body.data.herb.batch_id;
  let qr = r.body.data.qr_token;

  const transfer = async (token) => {
    const t = await request(app)
      .post(`/api/v1/batches/${batchId}/transfer`)
      .set(authHeaders(token))
      .send({ scanned_qr_token: qr, location: "X" });
    assert.strictEqual(t.status, 200, JSON.stringify(t.body));
    qr = t.body.data.new_qr_token;
  };

  await transfer(transporter);
  await transfer(lab);

  const lr = await request(app)
    .post("/api/v1/lab-reports")
    .set(authHeaders(lab))
    .send({ batch_id: batchId, test_type: "purity", test_date: "2026-03-20", results_summary: "passed", outcome: "approved", certification_level: "Grade A" });
  assert.strictEqual(lr.status, 201);

  await transfer(transporter);
  await transfer(manufacturer);

  const prod = await request(app)
    .post("/api/v1/products")
    .set(authHeaders(manufacturer))
    .send({ name: "Calm-It Capsules", sku: "CIC-1", source_batches: [{ batch_id: batchId, quantity_kg: 25.0 }] });
  const productId = prod.body.data.product.product_id;
  const productQr = prod.body.data.qr_token;

  return { batchId, productId, productQr };
}

test("batch journey is public", async () => {
  const { batchId } = await fullPipeline();
  const r = await request(app).get(`/api/v1/traceability/batch/${batchId}`);
  assert.strictEqual(r.status, 200);
  const data = r.body.data;
  assert.strictEqual(data.batch_id, batchId);
  assert.strictEqual(data.summary.quality_certified, true);
  const types = data.journey.map((s) => s.event_type);
  assert.deepStrictEqual(types, ["CREATED", "TRANSFER", "TRANSFER", "LAB_REPORT", "TRANSFER", "TRANSFER", "PRODUCT_LINK"]);
  const labStep = data.journey.find((s) => s.event_type === "LAB_REPORT");
  assert.strictEqual(labStep.lab_report.outcome, "approved");
});

test("product journey is public", async () => {
  const { productId } = await fullPipeline();
  const r = await request(app).get(`/api/v1/traceability/product/${productId}`);
  assert.strictEqual(r.status, 200);
  const data = r.body.data;
  assert.strictEqual(data.product.product_id, productId);
  assert.strictEqual(data.summary.all_certified, true);
  assert.strictEqual(data.summary.total_source_batches, 1);
});

test("unknown batch 404", async () => {
  const r = await request(app).get("/api/v1/traceability/batch/NOPE-XXXX");
  assert.strictEqual(r.status, 404);
  assert.strictEqual(r.body.error.code, "not_found");
});

test("resolve product qr", async () => {
  const { productQr, productId } = await fullPipeline();
  const r = await request(app).post("/api/v1/traceability/resolve").send({ qr_token: productQr });
  assert.strictEqual(r.status, 200);
  const body = r.body.data;
  assert.strictEqual(body.kind, "product");
  assert.strictEqual(body.journey.product.product_id, productId);
});

test("resolve invalid token", async () => {
  const r = await request(app).post("/api/v1/traceability/resolve").send({ qr_token: "not.a.token" });
  assert.strictEqual(r.status, 400);
  assert.strictEqual(r.body.error.code, "invalid_qr");
});