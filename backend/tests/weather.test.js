/* Tests for /api/v1/weather (stub provider when no API key) — port of test_weather.py. */
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

async function actor() {
  const [token] = await register(app, "farmer", "f.wx@test.local");
  return token;
}

test("returns stub when no key", async () => {
  const token = await actor();
  const r = await request(app).get("/api/v1/weather?lat=18.5&lng=73.8").set(authHeaders(token));
  assert.strictEqual(r.status, 200, JSON.stringify(r.body));
  const body = r.body.data;
  assert.strictEqual(body.provider, "stub");
  assert.ok(body.weather.current);
  assert.ok(Array.isArray(body.weather.forecast));
});

test("cache hit on second call", async () => {
  const token = await actor();
  const a = (await request(app).get("/api/v1/weather?lat=18.5&lng=73.8").set(authHeaders(token))).body.data;
  const b = (await request(app).get("/api/v1/weather?lat=18.5&lng=73.8").set(authHeaders(token))).body.data;
  assert.strictEqual(a.cached, false);
  assert.strictEqual(b.cached, true);
  assert.deepStrictEqual(a.weather, b.weather);
});

test("invalid coords rejected", async () => {
  const token = await actor();
  const r = await request(app).get("/api/v1/weather?lat=999&lng=0").set(authHeaders(token));
  assert.strictEqual(r.status, 400);
  const r2 = await request(app).get("/api/v1/weather").set(authHeaders(token));
  assert.strictEqual(r2.status, 400);
});

test("unauthenticated rejected", async () => {
  const r = await request(app).get("/api/v1/weather?lat=18.5&lng=73.8");
  assert.strictEqual(r.status, 401);
});