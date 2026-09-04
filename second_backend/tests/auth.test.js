/* Auth: register, login, refresh, /me, role guards — port of test_auth.py. */
const { before, beforeEach, after, test } = require("node:test");
const assert = require("node:assert");
const { setupDatabase, wipe, teardown, register, authHeaders, request } = require("./helpers");

setupDatabase(); // must precede app require

const { createApp } = require("../src/app");
const { prisma } = require("../src/db/client");

let app;
before(() => { app = createApp(); });
beforeEach(async () => { await wipe(prisma); });
after(async () => { await teardown(prisma); });

test("register and login (by email and by user_id)", async () => {
  const [token, user] = await register(app, "farmer", "f1@test.local", "hunter2hunter");
  assert.strictEqual(user.role, "farmer");
  assert.strictEqual(user.email, "f1@test.local");
  assert.ok(token);

  const r = await request(app).post("/api/v1/auth/login").send({ identifier: "f1@test.local", password: "hunter2hunter" });
  assert.strictEqual(r.status, 200);
  assert.ok(r.body.data.access_token);

  const r2 = await request(app).post("/api/v1/auth/login").send({ identifier: user.user_id, password: "hunter2hunter" });
  assert.strictEqual(r2.status, 200);
});

test("register validation errors", async () => {
  const r = await request(app).post("/api/v1/auth/register").send({});
  assert.strictEqual(r.status, 400);
  assert.strictEqual(r.body.error.code, "validation_error");
  assert.ok(r.body.error.details.email);
});

test("login wrong password", async () => {
  await register(app, "transporter", "t1@test.local", "rightone");
  const r = await request(app).post("/api/v1/auth/login").send({ identifier: "t1@test.local", password: "wrongone" });
  assert.strictEqual(r.status, 401);
  assert.strictEqual(r.body.error.code, "invalid_credentials");
});

test("duplicate email rejected", async () => {
  await register(app, "lab", "dup@test.local");
  const r = await request(app).post("/api/v1/auth/register").send({
    role: "manufacturer",
    name: "X",
    email: "dup@test.local",
    password: "password123",
  });
  assert.strictEqual(r.status, 409);
  assert.strictEqual(r.body.error.code, "email_taken");
});

test("me requires token", async () => {
  const r = await request(app).get("/api/v1/auth/me");
  assert.strictEqual(r.status, 401);
});

test("me returns user", async () => {
  const [token, user] = await register(app, "consumer", "c1@test.local");
  const r = await request(app).get("/api/v1/auth/me").set(authHeaders(token));
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.data.user.user_id, user.user_id);
});

test("role guard blocks other roles", async () => {
  const [token] = await register(app, "transporter", "tt@test.local");
  const r = await request(app)
    .post("/api/v1/batches")
    .set(authHeaders(token))
    .send({ species_name: "Tulsi", harvest_date: "2026-04-01", location: "Pune", weight_kg: 5.0 });
  assert.strictEqual(r.status, 403);
  assert.strictEqual(r.body.error.code, "forbidden");
});

test("refresh token issues new access", async () => {
  await register(app, "farmer", "ref@test.local", "password123");
  const login = await request(app).post("/api/v1/auth/login").send({ identifier: "ref@test.local", password: "password123" });
  const refresh = login.body.data.refresh_token;
  const r = await request(app).post("/api/v1/auth/refresh").set(authHeaders(refresh));
  assert.strictEqual(r.status, 200);
  assert.ok(r.body.data.access_token);
});