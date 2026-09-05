/**
 * Public verification rate limiting (spec "Public Security Controls" —
 * 100 requests/minute example). This file runs in its own process with a
 * deliberately tiny window so the 429 path is deterministic.
 */
process.env.PUBLIC_VERIFY_RATE_LIMIT = "5";
process.env.PUBLIC_VERIFY_RATE_WINDOW_MS = "60000";

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { setupDb } = require("./_db");

const db = setupDb();
const { prisma } = require("../../src/db/client");
const { createApp } = require("../../src/app");

let app;

before(async () => {
  app = createApp();
});

after(async () => {
  await prisma.$disconnect();
  db.cleanup();
});

test("public /verify endpoints are rate-limited per IP (6th request -> 429)", async () => {
  let last = null;
  for (let i = 0; i < 5; i++) {
    last = await request(app).post("/verify/scan").send({ token: `prd_bogus${i}bogusbogusbogus` });
    assert.equal(last.status, 200, `request ${i + 1} should pass: ${JSON.stringify(last.body)}`);
  }
  const limited = await request(app).post("/verify/scan").send({ token: "prd_bogus999bogusbogus" });
  assert.equal(limited.status, 429);
  assert.equal(limited.body.error.code, "rate_limited");
  assert.ok(limited.headers["retry-after"]);

  // The whole public router shares the window (journey view too).
  const journey = await request(app).get("/verify/product/prd_bogusXbogusbogusbogus/journey");
  assert.equal(journey.status, 429);
});