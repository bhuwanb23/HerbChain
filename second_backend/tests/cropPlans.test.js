/* Tests for /api/v1/crop-plans — port of test_crop_plans.py. */
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
  const [farmer] = await register(app, "farmer", "f.cp@test.local");
  const [admin] = await register(app, "admin", "a.cp@test.local");
  return { farmer, admin };
}

async function seedSpecies(adminToken, speciesId = "tulsi") {
  return request(app)
    .post("/api/v1/catalogue")
    .set(authHeaders(adminToken))
    .send({ species_id: speciesId, common_name: "Tulsi", scientific_name: "Ocimum sanctum" });
}

test("farmer lifecycle", async () => {
  const { admin, farmer } = await actors();
  await seedSpecies(admin);

  const r = await request(app)
    .post("/api/v1/crop-plans")
    .set(authHeaders(farmer))
    .send({ species_id: "tulsi", area_acres: 1.0, planting_date: "2026-04-01", expected_harvest_date: "2026-08-01" });
  assert.strictEqual(r.status, 201, JSON.stringify(r.body));
  const planId = r.body.data.plan.plan_id;

  const r2 = await request(app).get("/api/v1/crop-plans").set(authHeaders(farmer));
  assert.strictEqual(r2.status, 200);
  assert.ok(r2.body.data.total >= 1);

  const r3 = await request(app).put(`/api/v1/crop-plans/${planId}`).set(authHeaders(farmer)).send({ status: "sown" });
  assert.strictEqual(r3.status, 200);
  assert.strictEqual(r3.body.data.plan.status, "sown");

  const r4 = await request(app).delete(`/api/v1/crop-plans/${planId}`).set(authHeaders(farmer));
  assert.strictEqual(r4.status, 200);
});

test("unknown species rejected", async () => {
  const { farmer } = await actors();
  const r = await request(app)
    .post("/api/v1/crop-plans")
    .set(authHeaders(farmer))
    .send({ species_id: "does-not-exist", planting_date: "2026-04-01", expected_harvest_date: "2026-08-01" });
  assert.strictEqual(r.status, 400);
});

test("non-farmer blocked", async () => {
  const { admin } = await actors();
  const r = await request(app).get("/api/v1/crop-plans").set(authHeaders(admin));
  assert.strictEqual(r.status, 403);
});