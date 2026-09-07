/* Tests for /api/v1/recognition/herbs and the rerank service — port of test_recognition.py. */
const { before, beforeEach, after, test } = require("node:test");
const assert = require("node:assert");
const { setupDatabase, wipe, teardown, register, authHeaders, request } = require("./helpers");

setupDatabase();

const { createApp } = require("../src/app");
const { prisma } = require("../src/db/client");
const { rerank } = require("../src/services/recognitionService");

let app;
before(() => { app = createApp(); });
beforeEach(async () => { await wipe(prisma); });
after(async () => { await teardown(prisma); });

async function actors() {
  const [farmer] = await register(app, "farmer", "f.rec@test.local");
  const [admin] = await register(app, "admin", "a.rec@test.local");
  return { farmer, admin };
}

async function seedCatalogue(adminToken) {
  for (const body of [
    { species_id: "tulsi", common_name: "Tulsi", scientific_name: "Ocimum sanctum", synonyms: ["Holy Basil", "Sacred Basil"] },
    { species_id: "ashwagandha", common_name: "Ashwagandha", scientific_name: "Withania somnifera", synonyms: ["Indian Ginseng"] },
    { species_id: "neem", common_name: "Neem", scientific_name: "Azadirachta indica", synonyms: ["Margosa"] },
  ]) {
    const r = await request(app).post("/api/v1/catalogue").set(authHeaders(adminToken)).send(body);
    assert.strictEqual(r.status, 201, JSON.stringify(r.body));
  }
}

test("rerank matches synonyms", async () => {
  const { admin, farmer } = await actors();
  await seedCatalogue(admin);

  const r = await request(app)
    .post("/api/v1/recognition/herbs")
    .set(authHeaders(farmer))
    .send({ candidates: [{ label: "Holy Basil", score: 0.6 }, { label: "Daisy", score: 0.3 }] });
  assert.strictEqual(r.status, 200, JSON.stringify(r.body));
  const top = r.body.data.top;
  assert.ok(top.length > 0, "expected at least one match");
  assert.strictEqual(top[0].species_id, "tulsi");
  assert.ok(top[0].matched_via.includes("Holy Basil"));
});

test("rerank returns only known species", async () => {
  const { admin, farmer } = await actors();
  await seedCatalogue(admin);

  const r = await request(app)
    .post("/api/v1/recognition/herbs")
    .set(authHeaders(farmer))
    .send({ candidates: [{ label: "Sunflower", score: 0.9 }, { label: "Daisy", score: 0.8 }] });
  assert.strictEqual(r.status, 200);
  assert.deepStrictEqual(r.body.data.top, []);
});

test("rerank unauthenticated rejected", async () => {
  const r = await request(app)
    .post("/api/v1/recognition/herbs")
    .send({ candidates: [{ label: "Tulsi", score: 1.0 }] });
  assert.strictEqual(r.status, 401);
});

test("rerank service combines scores", async () => {
  const { admin } = await actors();
  await request(app)
    .post("/api/v1/catalogue")
    .set(authHeaders(admin))
    .send({ species_id: "tulsi", common_name: "Tulsi", scientific_name: "Ocimum sanctum" });

  const out = await rerank([{ label: "tulsi", score: 0.1 }], 3);
  assert.ok(out.length > 0);
  assert.strictEqual(out[0].species_id, "tulsi");
  assert.ok(out[0].confidence > 0 && out[0].confidence <= 1);
});