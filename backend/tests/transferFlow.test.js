/* Full farmer -> transporter -> lab -> transporter -> manufacturer flow — port of test_transfer_flow.py. */
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
  const [farmer] = await register(app, "farmer", "f@test.local");
  const [transporter] = await register(app, "transporter", "t@test.local");
  const [lab] = await register(app, "lab", "l@test.local");
  const [manufacturer] = await register(app, "manufacturer", "m@test.local");
  return { farmer, transporter, lab, manufacturer };
}

async function createBatch(client, farmerToken) {
  const r = await client
    .post("/api/v1/batches")
    .set(authHeaders(farmerToken))
    .send({ species_name: "Tulsi", harvest_date: "2026-04-01", location: "Pune", weight_kg: 10.0, gps_lat: 18.52, gps_lng: 73.85 });
  assert.strictEqual(r.status, 201, JSON.stringify(r.body));
  return [r.body.data.herb.batch_id, r.body.data.qr_token];
}

function transfer(client, batchId, scannerToken, qrToken) {
  return client
    .post(`/api/v1/batches/${batchId}/transfer`)
    .set(authHeaders(scannerToken))
    .send({ scanned_qr_token: qrToken, location: "X" });
}

test("happy path end-to-end", async () => {
  const { farmer, transporter, lab, manufacturer } = await actors();
  const client = request(app);

  const [batchId, qr1] = await createBatch(client, farmer);

  const r1 = await transfer(client, batchId, transporter, qr1);
  assert.strictEqual(r1.status, 200);
  let qr = r1.body.data.new_qr_token;
  assert.strictEqual(r1.body.data.transfer.to_phase, "in_transit_to_lab");

  const r2 = await transfer(client, batchId, lab, qr);
  assert.strictEqual(r2.status, 200);
  qr = r2.body.data.new_qr_token;
  assert.strictEqual(r2.body.data.transfer.to_phase, "at_lab");

  const r3 = await transfer(client, batchId, transporter, qr);
  assert.strictEqual(r3.status, 409);
  assert.strictEqual(r3.body.error.code, "not_approved");

  const lr = await client
    .post("/api/v1/lab-reports")
    .set(authHeaders(lab))
    .send({ batch_id: batchId, test_type: "purity", test_date: "2026-04-05", results_summary: "all clear", outcome: "approved" });
  assert.strictEqual(lr.status, 201);

  const r4 = await transfer(client, batchId, transporter, qr);
  assert.strictEqual(r4.status, 200);
  qr = r4.body.data.new_qr_token;
  assert.strictEqual(r4.body.data.transfer.to_phase, "in_transit_to_manufacturer");

  const r5 = await transfer(client, batchId, manufacturer, qr);
  assert.strictEqual(r5.status, 200);
  assert.strictEqual(r5.body.data.transfer.to_phase, "with_manufacturer");

  const prod = await client
    .post("/api/v1/products")
    .set(authHeaders(manufacturer))
    .send({ name: "Tulsi Tea", sku: "TT-1", source_batches: [{ batch_id: batchId, quantity_kg: 10.0 }] });
  assert.strictEqual(prod.status, 201);
  const productId = prod.body.data.product.product_id;

  const journey = await request(app).get(`/api/v1/traceability/product/${productId}`);
  assert.strictEqual(journey.status, 200);
  const data = journey.body.data;
  assert.strictEqual(data.summary.total_source_batches, 1);
  assert.strictEqual(data.summary.all_certified, true);
  assert.strictEqual(data.source_batches[0].journey.summary.quality_certified, true);
  // Steps: CREATED + 4 TRANSFERs + LAB_REPORT + PRODUCT_LINK = 7
  assert.strictEqual(data.source_batches[0].journey.summary.total_steps, 7);
});

test("wrong role cannot transfer", async () => {
  const { farmer, manufacturer } = await actors();
  const client = request(app);
  const [batchId, qr1] = await createBatch(client, farmer);

  const r = await transfer(client, batchId, manufacturer, qr1);
  assert.strictEqual(r.status, 409);
  assert.strictEqual(r.body.error.code, "invalid_transition");
});

test("farmer cannot transfer (role guard 403)", async () => {
  const { farmer } = await actors();
  const client = request(app);
  const [batchId, qr1] = await createBatch(client, farmer);

  const r = await transfer(client, batchId, farmer, qr1);
  assert.strictEqual(r.status, 403);
});

test("transferred batch lists in mine", async () => {
  const { farmer, transporter } = await actors();
  const client = request(app);
  const [batchId, qr1] = await createBatch(client, farmer);
  await transfer(client, batchId, transporter, qr1);

  const r = await client.get("/api/v1/batches/mine").set(authHeaders(transporter));
  assert.strictEqual(r.status, 200);
  const ids = r.body.data.batches.map((b) => b.herb.batch_id);
  assert.ok(ids.includes(batchId));
});

test("qr endpoint visibility", async () => {
  const { farmer, transporter, lab } = await actors();
  const client = request(app);
  const [batchId] = await createBatch(client, farmer);

  const r = await client.get(`/api/v1/batches/${batchId}/qr`).set(authHeaders(lab));
  assert.strictEqual(r.status, 403);

  const r2 = await client.get(`/api/v1/batches/${batchId}/qr`).set(authHeaders(farmer));
  assert.strictEqual(r2.status, 200);
  assert.ok(r2.body.data.qr_png.startsWith("data:image/png"));
});