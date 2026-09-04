/* Tests for /api/v1/farm/me — port of test_farm_profile.py. */
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
  const [farmer] = await register(app, "farmer", "f.fp@test.local");
  const [transporter] = await register(app, "transporter", "t.fp@test.local");
  return { farmer, transporter };
}

test("farmer starts with no profile", async () => {
  const { farmer } = await actors();
  const r = await request(app).get("/api/v1/farm/me").set(authHeaders(farmer));
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.data.farm, null);
});

test("farmer can upsert and read back", async () => {
  const { farmer } = await actors();
  const r = await request(app)
    .put("/api/v1/farm/me")
    .set(authHeaders(farmer))
    .send({ farm_name: "Demo", land_size_acres: 3.0, soil_type: "loamy", irrigation_type: "drip", certifications: ["organic"], address: "Pune", gps_lat: 18.5, gps_lng: 73.8 });
  assert.strictEqual(r.status, 200, JSON.stringify(r.body));
  const farm = r.body.data.farm;
  assert.strictEqual(farm.farm_name, "Demo");
  assert.strictEqual(farm.soil_type, "loamy");

  const r2 = await request(app).get("/api/v1/farm/me").set(authHeaders(farmer));
  assert.strictEqual(r2.body.data.farm.land_size_acres, 3.0);
});

test("non-farmer cannot use farm endpoint", async () => {
  const { transporter } = await actors();
  const r = await request(app).get("/api/v1/farm/me").set(authHeaders(transporter));
  assert.strictEqual(r.status, 403);
});

test("invalid soil type rejected", async () => {
  const { farmer } = await actors();
  const r = await request(app).put("/api/v1/farm/me").set(authHeaders(farmer)).send({ soil_type: "moondust" });
  assert.strictEqual(r.status, 400);
});