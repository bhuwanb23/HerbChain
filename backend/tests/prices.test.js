/* Tests for /api/v1/prices — port of test_prices.py. */
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
  const [farmer] = await register(app, "farmer", "f.px@test.local");
  const [admin] = await register(app, "admin", "a.px@test.local");
  return { farmer, admin };
}

async function seedSpecies(adminToken, speciesId = "tulsi") {
  return request(app)
    .post("/api/v1/catalogue")
    .set(authHeaders(adminToken))
    .send({ species_id: speciesId, common_name: "Tulsi", scientific_name: "Ocimum sanctum" });
}

test("admin creates and lists prices", async () => {
  const { admin, farmer } = await actors();
  await seedSpecies(admin);

  const r = await request(app)
    .post("/api/v1/prices")
    .set(authHeaders(admin))
    .send({ species_id: "tulsi", price_per_kg_inr: 180.0, source: "demo" });
  assert.strictEqual(r.status, 201, JSON.stringify(r.body));

  const r2 = await request(app).get("/api/v1/prices").set(authHeaders(farmer));
  assert.strictEqual(r2.status, 200);
  const rows = r2.body.data.prices;
  assert.ok(rows.some((x) => x.species_id === "tulsi" && x.price_per_kg_inr === 180.0));
});

test("latest price wins", async () => {
  const { admin } = await actors();
  await seedSpecies(admin);
  for (const price of [100.0, 220.0, 175.0]) {
    const r = await request(app)
      .post("/api/v1/prices")
      .set(authHeaders(admin))
      .send({ species_id: "tulsi", price_per_kg_inr: price });
    assert.strictEqual(r.status, 201);
  }

  const r2 = await request(app).get("/api/v1/prices/tulsi").set(authHeaders(admin));
  assert.strictEqual(r2.status, 200);
  const history = r2.body.data.history;
  assert.strictEqual(history.length, 3);
});

test("farmer cannot post price", async () => {
  const { admin, farmer } = await actors();
  await seedSpecies(admin);
  const r = await request(app)
    .post("/api/v1/prices")
    .set(authHeaders(farmer))
    .send({ species_id: "tulsi", price_per_kg_inr: 1.0 });
  assert.strictEqual(r.status, 403);
});

test("unknown species rejected", async () => {
  const { admin } = await actors();
  const r = await request(app)
    .post("/api/v1/prices")
    .set(authHeaders(admin))
    .send({ species_id: "nope", price_per_kg_inr: 1.0 });
  assert.strictEqual(r.status, 404);
});