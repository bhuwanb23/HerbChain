/**
 * End-to-end auth API tests (new architecture).
 * Boots the real app on an isolated per-file DB and drives the full lifecycle:
 * register -> verification gate -> admin approve -> login -> refresh rotation
 * -> reuse attack -> logout, sessions, change-password, forgot/reset, RBAC.
 */
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { setupDb } = require("./_db");

const db = setupDb();
const { prisma } = require("../../src/db/client");
const { seedRbac } = require("../../src/db/rbac");
const { hashPassword } = require("../../src/services/passwords");
const mailer = require("../../src/services/mailer");

let app;
let adminToken;

before(async () => {
  await seedRbac();
  const admin = await prisma.user.create({
    data: {
      name: "AYUSH Admin",
      email: "admin@test.dev",
      password_hash: hashPassword("AdminPass123"),
      role: "admin",
      kyc_status: "none",
    },
  });
  // Probe business endpoint used to exercise the verification gate + RBAC.
  const { createApp } = require("../../src/app");
  const { requireAuth, requirePermission } = require("../../src/middleware/auth");
  const { ok } = require("../../src/utils/responses");
  app = createApp({
    extraRoutes: [
      (a) => a.get("/api/v1/probe/certify", requireAuth, requirePermission("lab.certify"), (req, res) => ok(res, { allowed: true, role: req.user.role })),
    ],
  });

  const login = await request(app).post("/api/v1/auth/login").send({ identifier: "admin@test.dev", password: "AdminPass123" });
  adminToken = login.body.data.access_token;
});

after(async () => {
  await prisma.$disconnect();
  db.cleanup();
});

beforeEach(() => {
  mailer.clearSentEmails();
});

const reg = (over) => request(app).post("/api/v1/auth/register").send(over);

test("register: consumer is ACTIVE immediately and can log in", async () => {
  const res = await reg({ name: "C1", email: "c1@test.dev", password: "password1", role: "consumer" });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.user.account_status, "ACTIVE");
  assert.equal(res.body.data.user.kyc_status, "none");
  assert.ok(res.body.data.access_token);

  const me = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${res.body.data.access_token}`);
  assert.equal(me.status, 200);
  assert.equal(me.body.data.user.email, "c1@test.dev");
});

test("register: farmer is provisional-ACTIVE with pending kyc + verification request", async () => {
  const res = await reg({ name: "F1", email: "f1@test.dev", password: "password1", role: "farmer" });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.user.account_status, "ACTIVE"); // D2 provisional
  assert.equal(res.body.data.user.kyc_status, "pending");
  const vr = await prisma.verificationRequest.findFirst({ where: { user_id: res.body.data.user.id } });
  assert.equal(vr.status, "pending");
  const profile = await prisma.farmerProfile.findUnique({ where: { farmer_id: res.body.data.user.id } });
  assert.ok(profile);
});

test("register: lab is PENDING and business capability is gated (account_not_verified)", async () => {
  const res = await reg({ name: "L1", email: "l1@test.dev", password: "password1", role: "lab" });
  assert.equal(res.status, 201);
  const user = res.body.data.user;
  assert.equal(user.account_status, "PENDING");

  const probe = await request(app).get("/api/v1/probe/certify").set("Authorization", `Bearer ${res.body.data.access_token}`);
  assert.equal(probe.status, 403);
  assert.equal(probe.body.error.code, "account_not_verified");
});

test("register validations: bad role, admin role, dup email, dup phone, weak password", async () => {
  assert.equal((await reg({ name: "X", email: "x1@test.dev", password: "password1", role: "god" })).status, 400);
  assert.equal((await reg({ name: "X", email: "x2@test.dev", password: "password1", role: "admin" })).status, 400);
  await reg({ name: "Dup", email: "dup@test.dev", password: "password1", role: "consumer" });
  assert.equal((await reg({ name: "Dup2", email: "DUP@test.dev", password: "password1", role: "consumer" })).status, 409);
  assert.equal((await reg({ name: "Dup3", email: "dup3@test.dev", phone: "+919999999999", password: "password1", role: "consumer" })).status, 201);
  assert.equal((await reg({ name: "Dup4", email: "dup4@test.dev", phone: "+91 99999 99999", password: "password1", role: "consumer" })).status, 409);
  assert.equal((await reg({ name: "Weak", email: "weak@test.dev", password: "short", role: "consumer" })).status, 400);
});

test("admin approve unlocks a lab; reject keeps it gated", async () => {
  const res = await reg({ name: "LabA", email: "laba@test.dev", password: "password1", role: "lab" });
  const userId = res.body.data.user.id;

  const approve = await request(app)
    .post(`/api/v1/admin/users/${userId}/approve`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ notes: "docs verified" });
  assert.equal(approve.status, 200);
  assert.equal(approve.body.data.user.kyc_status, "verified");
  assert.match(approve.body.data.user.org_code ?? "", /^LAB-/);

  // Same token now works (DB-truth, no re-login needed)
  const probe = await request(app).get("/api/v1/probe/certify").set("Authorization", `Bearer ${res.body.data.access_token}`);
  assert.equal(probe.status, 200);
  assert.equal(probe.body.data.allowed, true);

  // A rejected lab stays gated
  const rej = await reg({ name: "LabB", email: "labb@test.dev", password: "password1", role: "lab" });
  await request(app)
    .post(`/api/v1/admin/users/${rej.body.data.user.id}/reject`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ notes: "bad accreditation" });
  const probeRej = await request(app).get("/api/v1/probe/certify").set("Authorization", `Bearer ${rej.body.data.access_token}`);
  assert.equal(probeRej.status, 403);
  const d = await request(app).get(`/api/v1/admin/users/${rej.body.data.user.id}`).set("Authorization", `Bearer ${adminToken}`);
  assert.equal(d.body.data.user.kyc_status, "rejected");
  assert.equal(d.body.data.verification_requests[0].status, "rejected");
});

test("login: email/phone identifier, wrong creds identical, farmer not gated on own role caps", async () => {
  await reg({ name: "Log", email: "log@test.dev", phone: "+919876543210", password: "password1", role: "farmer" });

  const emailLogin = await request(app).post("/api/v1/auth/login").send({ identifier: "LOG@test.dev", password: "password1" });
  assert.equal(emailLogin.status, 200);
  assert.equal(emailLogin.body.data.user.account_status, "ACTIVE");

  const phoneLogin = await request(app).post("/api/v1/auth/login").send({ identifier: "+919876543210", password: "password1" });
  assert.equal(phoneLogin.status, 200);

  const bad = await request(app).post("/api/v1/auth/login").send({ identifier: "nobody@test.dev", password: "password1" });
  const bad2 = await request(app).post("/api/v1/auth/login").send({ identifier: "log@test.dev", password: "wrongpass" });
  assert.equal(bad.status, 401);
  assert.equal(bad2.status, 401);
  assert.equal(bad.body.error.code, "invalid_credentials");
  assert.equal(bad2.body.error.code, "invalid_credentials");
});

test("refresh rotation: new pair issued, old token reuse revokes every session", async () => {
  const regRes = await reg({ name: "Rot", email: "rot@test.dev", password: "password1", role: "consumer" });
  const refreshA = regRes.body.data.refresh_token;

  const login2 = await request(app).post("/api/v1/auth/login").send({ identifier: "rot@test.dev", password: "password1", device_name: "tablet" });
  assert.equal(login2.status, 200);
  const refreshB = login2.body.data.refresh_token;

  const r1 = await request(app).post("/api/v1/auth/refresh").send({ refresh_token: refreshA });
  assert.equal(r1.status, 200);
  assert.ok(r1.body.data.access_token);
  const rotated = r1.body.data.refresh_token;
  assert.notEqual(rotated, refreshA);

  // Old (rotated-out) token comes back -> reuse -> all sessions revoked
  const reuse = await request(app).post("/api/v1/auth/refresh").send({ refresh_token: refreshA });
  assert.equal(reuse.status, 401);
  assert.equal(reuse.body.error.code, "unauthorized");

  // Both devices are now dead — even the untouched tablet session B
  const stillValid = await request(app).post("/api/v1/auth/refresh").send({ refresh_token: refreshB });
  assert.equal(stillValid.status, 401);
  const audit = await prisma.auditLog.count({ where: { action: "REFRESH_REUSE" } });
  assert.ok(audit >= 1);
});

test("logout revokes the session; its access token dies immediately (sid guard)", async () => {
  const regRes = await reg({ name: "Out", email: "out@test.dev", password: "password1", role: "consumer" });
  const bearer = `Bearer ${regRes.body.data.access_token}`;

  assert.equal((await request(app).get("/api/v1/auth/me").set("Authorization", bearer)).status, 200);
  const logout = await request(app).post("/api/v1/auth/logout").set("Authorization", bearer);
  assert.equal(logout.status, 200);

  const afterLogout = await request(app).get("/api/v1/auth/me").set("Authorization", bearer);
  assert.equal(afterLogout.status, 401); // sid revoked -> immediate
});

test("sessions: list shows devices; deleting another session is scoped to owner", async () => {
  const regRes = await reg({ name: "Sess", email: "sess@test.dev", password: "password1", role: "consumer" });
  const loginB = await request(app).post("/api/v1/auth/login").send({ identifier: "sess@test.dev", password: "password1", device_name: "second" });

  const list = await request(app).get("/api/v1/auth/sessions").set("Authorization", `Bearer ${loginB.body.data.access_token}`);
  assert.equal(list.status, 200);
  assert.equal(list.body.data.sessions.length, 2);
  assert.equal(list.body.data.sessions.filter((s) => s.current).length, 1);

  const other = await reg({ name: "Other", email: "other@test.dev", password: "password1", role: "consumer" });
  const del = await request(app)
    .delete(`/api/v1/auth/sessions/${list.body.data.sessions[0].id}`)
    .set("Authorization", `Bearer ${other.body.data.access_token}`);
  assert.equal(del.status, 404); // not owner
});

test("change-password: old password check, revokes other sessions, new password works", async () => {
  const regRes = await reg({ name: "Pw", email: "pw@test.dev", password: "password1", role: "consumer" });
  const bearer = `Bearer ${regRes.body.data.access_token}`;
  const otherSession = await request(app).post("/api/v1/auth/login").send({ identifier: "pw@test.dev", password: "password1" });

  const wrongOld = await request(app).post("/api/v1/auth/change-password").set("Authorization", bearer).send({ old_password: "nope", new_password: "newpassword1" });
  assert.equal(wrongOld.status, 400);

  const ok = await request(app).post("/api/v1/auth/change-password").set("Authorization", bearer).send({ old_password: "password1", new_password: "newpassword1" });
  assert.equal(ok.status, 200);

  // other device session is dead
  assert.equal((await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${otherSession.body.data.access_token}`)).status, 401);
  // old password no longer works; new one does
  assert.equal((await request(app).post("/api/v1/auth/login").send({ identifier: "pw@test.dev", password: "password1" })).status, 401);
  assert.equal((await request(app).post("/api/v1/auth/login").send({ identifier: "pw@test.dev", password: "newpassword1" })).status, 200);
});

test("forgot/reset password via email stub; token single-use and revokes sessions", async () => {
  const regRes = await reg({ name: "Forgot", email: "forgot@test.dev", password: "password1", role: "consumer" });
  const sessionBefore = await request(app).post("/api/v1/auth/login").send({ identifier: "forgot@test.dev", password: "password1" });
  const oldBearer = `Bearer ${sessionBefore.body.data.access_token}`;

  const forgot = await request(app).post("/api/v1/auth/forgot-password").send({ identifier: "forgot@test.dev" });
  assert.equal(forgot.status, 200);
  assert.equal(forgot.body.data.message.includes("no account enumeration") || forgot.body.data.message.length > 0, true);

  const mails = mailer.getSentEmails();
  assert.equal(mails.length, 1);
  assert.equal(mails[0].to, "forgot@test.dev");
  const token = /token=([^&\s]+)/.exec(mails[0].body)[1];

  // old session still alive before reset
  assert.equal((await request(app).get("/api/v1/auth/me").set("Authorization", oldBearer)).status, 200);
  const reset = await request(app).post("/api/v1/auth/reset-password").send({ token, new_password: "freshpassword1" });
  assert.equal(reset.status, 200);
  // all sessions revoked
  assert.equal((await request(app).get("/api/v1/auth/me").set("Authorization", oldBearer)).status, 401);
  // new password works
  assert.equal((await request(app).post("/api/v1/auth/login").send({ identifier: "forgot@test.dev", password: "freshpassword1" })).status, 200);
  // token is single-use
  const again = await request(app).post("/api/v1/auth/reset-password").send({ token, new_password: "anotherpass1" });
  assert.equal(again.status, 400);
  assert.equal(again.body.error.code, "invalid_token");
});

test("RBAC: non-admin cannot reach admin routes; farmer denied lab.certify", async () => {
  const farmer = await reg({ name: "Rbac", email: "rbac@test.dev", password: "password1", role: "farmer" });
  const farmerBearer = `Bearer ${farmer.body.data.access_token}`;
  const list = await request(app).get("/api/v1/admin/users").set("Authorization", farmerBearer);
  assert.equal(list.status, 403);

  const probe = await request(app).get("/api/v1/probe/certify").set("Authorization", farmerBearer);
  assert.equal(probe.status, 403); // farmer has no lab.certify grant
});

test("admin suspend blocks account; activate restores", async () => {
  const regRes = await reg({ name: "Susp", email: "susp@test.dev", password: "password1", role: "consumer" });
  const userId = regRes.body.data.user.id;

  const suspend = await request(app)
    .post(`/api/v1/admin/users/${userId}/suspend`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ notes: "investigating" });
  assert.equal(suspend.status, 200);

  const me = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${regRes.body.data.access_token}`);
  assert.equal(me.status, 403); // disabled -> forbidden

  await request(app).post(`/api/v1/admin/users/${userId}/activate`).set("Authorization", `Bearer ${adminToken}`);
  const login = await request(app).post("/api/v1/auth/login").send({ identifier: "susp@test.dev", password: "password1" });
  assert.equal(login.status, 200);
});

test("role change takes effect next request; admin role is protected", async () => {
  const regRes = await reg({ name: "Role", email: "role@test.dev", password: "password1", role: "lab" });
  const userId = regRes.body.data.user.id;

  const adminChange = await request(app)
    .post(`/api/v1/admin/users/${userId}/role`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ role: "admin" });
  assert.equal(adminChange.status, 400); // cannot become admin

  await request(app).post(`/api/v1/admin/users/${userId}/role`).set("Authorization", `Bearer ${adminToken}`).send({ role: "consumer" });
  // same token, next request: role now consumer -> kyc none, ACTIVE
  const me = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${regRes.body.data.access_token}`);
  assert.equal(me.status, 200);
  assert.equal(me.body.data.user.role, "consumer");
  assert.equal(me.body.data.user.account_status, "ACTIVE");
  const labProfile = await prisma.labProfile.findUnique({ where: { lab_id: userId } });
  assert.equal(labProfile, null); // profile row removed on demotion
});

test("5 failed logins lock the account temporarily (account_locked)", async () => {
  await reg({ name: "Lock", email: "lock@test.dev", password: "password1", role: "consumer" });
  let last;
  for (let i = 0; i < 5; i++) {
    last = await request(app).post("/api/v1/auth/login").send({ identifier: "lock@test.dev", password: "wrongpass" });
  }
  assert.equal(last.status, 401); // 5th failure locks the account
  const locked = await request(app).post("/api/v1/auth/login").send({ identifier: "lock@test.dev", password: "wrongpass" });
  assert.equal(locked.status, 403);
  assert.equal(locked.body.error.code, "account_locked");
  const lockedWithGoodPassword = await request(app).post("/api/v1/auth/login").send({ identifier: "lock@test.dev", password: "password1" });
  assert.equal(lockedWithGoodPassword.status, 403); // correct password also blocked while locked
  const row = await prisma.user.findUnique({ where: { email: "lock@test.dev" } });
  assert.equal(row.failed_login_count, 5);
  assert.ok(row.locked_until > new Date());
});

test("audit trail records auth events", async () => {
  const logins = await prisma.auditLog.count({ where: { action: "LOGIN" } });
  const regs = await prisma.auditLog.count({ where: { action: "REGISTER" } });
  assert.ok(logins >= 5);
  assert.ok(regs >= 8);
});
