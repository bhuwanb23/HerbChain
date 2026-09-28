/**
 * Species catalogue (read path) — migrated from the legacy root suite.
 * Live contract: GET /api/v1/species (public, active only, ?q= search) and
 * GET /api/v1/species/:code. Management routes are a later phase.
 * (batch.test.js also touches list/detail; this suite owns ?q= coverage.)
 */
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { setupDb } = require("./_db");

const db = setupDb();
const { prisma } = require("../../src/db/client");
const { createApp } = require("../../src/app");

let app;

before(async () => {
  await prisma.species.createMany({
    data: [
      { code: "ashwagandha", common_name: "Ashwagandha", scientific_name: "Withania somnifera", ayush_category: "ayurveda", is_active: true },
      { code: "tulsi", common_name: "Tulsi", scientific_name: "Ocimum sanctum", ayush_category: "ayurveda", is_active: true },
      { code: "retired-herb", common_name: "Retired Herb", scientific_name: "Retiredus maximus", is_active: false },
    ],
  });
  app = createApp();
});

after(async () => {
  await prisma.$disconnect();
  db.cleanup();
});

test("list returns active species only, sorted, with full row shape", async () => {
  const r = await request(app).get("/api/v1/species");
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const { species, total } = r.body.data;
  assert.equal(total, 2);
  assert.deepEqual(species.map((s) => s.code), ["ashwagandha", "tulsi"]); // common_name asc
  const row = species.find((s) => s.code === "tulsi");
  assert.equal(row.common_name, "Tulsi");
  assert.equal(row.scientific_name, "Ocimum sanctum");
  assert.equal(row.ayush_category, "ayurveda");
  assert.ok(row.id, "id present");
  assert.ok(!("is_active" in row), "select shape is SPECIES_SELECT");
});

test("q filter matches common name, scientific name and code, case-insensitively", async () => {
  const cases = [
    ["ashwa", "ashwagandha"], // common_name prefix
    ["withania", "ashwagandha"], // scientific_name
    ["TULSI", "tulsi"], // code, uppercase needle
    ["tul", "tulsi"], // common_name substring
  ];
  for (const [q, expected] of cases) {
    const r = await request(app).get(`/api/v1/species?q=${encodeURIComponent(q)}`);
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.data.species.length, 1, `q=${q}`);
    assert.equal(r.body.data.species[0].code, expected, `q=${q}`);
    assert.equal(r.body.data.total, 1, `q=${q}`);
  }
  const none = await request(app).get("/api/v1/species?q=no-such-herb");
  assert.equal(none.status, 200);
  assert.equal(none.body.data.species.length, 0);
  assert.equal(none.body.data.total, 0);
});

test("detail by code: active 200, unknown 404, inactive 404", async () => {
  const ok = await request(app).get("/api/v1/species/tulsi");
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.equal(ok.body.data.species.common_name, "Tulsi");
  assert.equal(ok.body.data.species.code, "tulsi");

  assert.equal((await request(app).get("/api/v1/species/not-a-herb")).status, 404);
  assert.equal((await request(app).get("/api/v1/species/retired-herb")).status, 404);
});
