/**
 * Market reference prices — migrated from the legacy root suite.
 * Live contract: GET /api/v1/prices (public; {prices, latest}, filters) and
 * POST /api/v1/prices (requireAuth + admin.manage; price_per_kg in rupees,
 * stored as price_per_kg_paise).
 */
const { test, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { setupDb } = require("./_db");

const db = setupDb();
const { prisma } = require("../../src/db/client");
const { seedRbac } = require("../../src/db/rbac");
const { hashPassword } = require("../../src/services/passwords");
const { createApp } = require("../../src/app");

let app, tulsi, neem, adminToken, farmerToken;

async function makeToken(email, role) {
  await prisma.user.create({
    data: {
      name: role,
      email,
      password_hash: hashPassword("password1"),
      role,
      kyc_status: "verified",
      is_active: true,
    },
  });
  const login = await request(app)
    .post("/api/v1/auth/login")
    .send({ identifier: email, password: "password1" });
  assert.equal(login.status, 200, JSON.stringify(login.body));
  return login.body.data.access_token;
}

async function postPrice(token, body) {
  return request(app).post("/api/v1/prices").set("Authorization", `Bearer ${token}`).send(body);
}

before(async () => {
  await seedRbac();
  await prisma.species.createMany({
    data: [
      { code: "tulsi", common_name: "Tulsi", scientific_name: "Ocimum sanctum", is_active: true },
      { code: "neem", common_name: "Neem", scientific_name: "Azadirachta indica", is_active: true },
    ],
  });
  tulsi = await prisma.species.findUnique({ where: { code: "tulsi" } });
  neem = await prisma.species.findUnique({ where: { code: "neem" } });
  app = createApp();
  adminToken = await makeToken("price.admin@test.dev", "admin");
  farmerToken = await makeToken("price.farmer@test.dev", "farmer");
});

beforeEach(async () => {
  await prisma.priceQuote.deleteMany();
});

after(async () => {
  await prisma.$disconnect();
  db.cleanup();
});

test("admin posts a price; public list includes it with species context", async () => {
  const r = await postPrice(adminToken, { species_id: tulsi.id, price_per_kg: 180, source: "demo" });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const price = r.body.data.price;
  assert.equal(price.price_per_kg_paise, 18000); // rupees -> paise
  assert.equal(price.market, "local");
  assert.equal(price.source, "demo");
  assert.equal(price.species.common_name, "Tulsi");

  const list = await request(app).get("/api/v1/prices");
  assert.equal(list.status, 200, JSON.stringify(list.body));
  assert.equal(list.body.data.prices.length, 1);
  assert.equal(list.body.data.latest.length, 1);
  assert.equal(list.body.data.prices[0].id, price.id);
});

test("list filters by species; latest-per-species picks newest effective_at", async () => {
  const a = await postPrice(adminToken, { species_id: tulsi.id, price_per_kg: 180 });
  assert.equal(a.status, 201, JSON.stringify(a.body));
  const c = await postPrice(adminToken, { species_id: neem.id, price_per_kg: 90 });
  assert.equal(c.status, 201, JSON.stringify(c.body));
  // backdate the first tulsi quote so ordering is deterministic
  await prisma.priceQuote.update({ where: { id: a.body.data.price.id }, data: { effective_at: new Date("2020-01-01T00:00:00.000Z") } });
  const d = await postPrice(adminToken, { species_id: tulsi.id, price_per_kg: 220 });
  assert.equal(d.status, 201, JSON.stringify(d.body));

  const neemOnly = await request(app).get(`/api/v1/prices?species_id=${neem.id}`);
  assert.equal(neemOnly.status, 200, JSON.stringify(neemOnly.body));
  assert.equal(neemOnly.body.data.prices.length, 1);
  assert.equal(neemOnly.body.data.prices[0].species_id, neem.id);

  const all = await request(app).get("/api/v1/prices");
  assert.equal(all.body.data.prices.length, 3); // full history, not just latest
  assert.equal(all.body.data.latest.length, 2); // one per species
  const latestTulsi = all.body.data.latest.find((p) => p.species_id === tulsi.id);
  const latestNeem = all.body.data.latest.find((p) => p.species_id === neem.id);
  assert.equal(latestTulsi.id, d.body.data.price.id); // newest wins despite backdated sibling
  assert.equal(latestTulsi.price_per_kg_paise, 22000);
  assert.equal(latestNeem.id, c.body.data.price.id);
  assert.ok(all.body.data.prices.some((p) => p.id === a.body.data.price.id), "backdated quote still listed");
});

test("non-admin gets 403 and creates no row", async () => {
  const r = await postPrice(farmerToken, { species_id: tulsi.id, price_per_kg: 1 });
  assert.equal(r.status, 403, JSON.stringify(r.body));
  assert.equal(await prisma.priceQuote.count(), 0);
});

test("unauthenticated POST gets 401", async () => {
  const r = await request(app).post("/api/v1/prices").send({ species_id: tulsi.id, price_per_kg: 1 });
  assert.equal(r.status, 401, JSON.stringify(r.body));
  assert.equal(await prisma.priceQuote.count(), 0);
});

test("invalid body rejected with 400", async () => {
  const r = await postPrice(adminToken, { species_id: tulsi.id }); // price_per_kg missing
  assert.equal(r.status, 400, JSON.stringify(r.body));
  assert.equal(await prisma.priceQuote.count(), 0);
});

test("unknown species is rejected and creates no row", async () => {
  const r = await postPrice(adminToken, { species_id: "nope", price_per_kg: 10 });
  assert.ok(r.status >= 400, `expected rejection, got ${r.status}`); // FK violation surfaces as 500 today
  assert.equal(await prisma.priceQuote.count(), 0);
});
