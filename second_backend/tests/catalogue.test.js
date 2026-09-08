/* Tests for /api/v1/catalogue — port of test_catalogue.py. */
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
  const [farmer] = await register(app, "farmer", "f.cat@test.local");
  const [admin] = await register(app, "admin", "a.cat@test.local");
  return { farmer, admin };
}

test("admin creates and lists species", async () => {
  const { admin } = await actors();
  const r = await request(app)
    .post("/api/v1/catalogue")
    .set(authHeaders(admin))
    .send({ common_name: "Tulsi", scientific_name: "Ocimum sanctum", synonyms: ["Holy Basil"], default_unit_price_inr: 200.0 });
  assert.strictEqual(r.status, 201, JSON.stringify(r.body));
  const species = r.body.data.species;
  assert.ok(species.species_id.startsWith("SPC-"));
  assert.strictEqual(species.common_name, "Tulsi");

  const r2 = await request(app).get("/api/v1/catalogue").set(authHeaders(admin));
  assert.strictEqual(r2.status, 200);
  const rows = r2.body.data.species;
  assert.ok(rows.some((x) => x.common_name === "Tulsi"));
});

test("farmer cannot create species", async () => {
  const { farmer } = await actors();
  const r = await request(app)
    .post("/api/v1/catalogue")
    .set(authHeaders(farmer))
    .send({ common_name: "Neem", scientific_name: "Azadirachta indica" });
  assert.strictEqual(r.status, 403);
});

test("search and filter", async () => {
  const { admin } = await actors();
  for (const spec of [
    { common_name: "Ashwagandha", scientific_name: "Withania somnifera", ayush_category: "ayurveda" },
    { common_name: "Mulethi", scientific_name: "Glycyrrhiza glabra", ayush_category: "unani" },
  ]) {
    await request(app).post("/api/v1/catalogue").set(authHeaders(admin)).send(spec);
  }

  const r = await request(app).get("/api/v1/catalogue?q=ashwa").set(authHeaders(admin));
  const rows = r.body.data.species;
  assert.ok(rows.some((x) => x.common_name.includes("Ashwagandha")));

  const r2 = await request(app).get("/api/v1/catalogue?category=unani").set(authHeaders(admin));
  const cats = r2.body.data.species.map((x) => x.ayush_category);
  assert.ok(cats.every((c) => c === "unani"));
});

test("admin soft deletes species", async () => {
  const { admin } = await actors();
  const r = await request(app)
    .post("/api/v1/catalogue")
    .set(authHeaders(admin))
    .send({ common_name: "DemoX", scientific_name: "Demo x", species_id: "spc-demox" });
  const speciesId = r.body.data.species.species_id;

  const r2 = await request(app).delete(`/api/v1/catalogue/${speciesId}`).set(authHeaders(admin));
  assert.strictEqual(r2.status, 200);
  assert.strictEqual(r2.body.data.species.is_active, false);
});