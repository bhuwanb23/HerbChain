const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const { setupDb } = require("./_db");

const db = setupDb();
const { prisma } = require("../../src/db/client");
after(async () => {
  await prisma.$disconnect();
  db.cleanup();
});

const { sha256 } = require("../../src/services/tokens");
const {
  openSession,
  rotateSession,
  isSessionActive,
  revokeSession,
  revokeAllForUser,
  listSessions,
} = require("../../src/services/sessions");

let seq = 0;
async function makeUser(role = "consumer") {
  seq += 1;
  return prisma.user.create({
    data: {
      name: `U${seq}`,
      email: `u${seq}-${process.pid}-${Date.now()}@test.dev`,
      password_hash: "x",
      role,
    },
  });
}

test("openSession stores only the sha256 hash, never the raw token", async () => {
  const user = await makeUser();
  const { sessionId, refreshToken, session } = await openSession(user.id, {
    deviceId: "dev-1",
    ip: "10.0.0.1",
  });
  assert.ok(sessionId);
  assert.equal(session.device_id, "dev-1");
  const row = await prisma.session.findUnique({ where: { id: sessionId } });
  assert.notEqual(row.refresh_token_hash, refreshToken); // raw never stored
  assert.equal(row.refresh_token_hash, sha256(refreshToken)); // only the hash
  assert.equal(await isSessionActive(sessionId), true);
});

test("rotation rotates in place; the old token then triggers reuse -> revoke all", async () => {
  const user = await makeUser();
  const { sessionId, refreshToken } = await openSession(user.id, { deviceId: "phone" });

  const rotated = await rotateSession(refreshToken);
  assert.equal(rotated.kind, "ok");
  assert.notEqual(rotated.refreshToken, refreshToken);

  // session row is the same, hash replaced
  const row = await prisma.session.findUnique({ where: { id: sessionId } });
  assert.equal(row.refresh_token_hash, sha256(rotated.refreshToken));

  // old token comes back -> reuse detected, whole account revoked
  const reused = await rotateSession(refreshToken);
  assert.equal(reused.kind, "reuse");
  assert.equal(reused.userId, user.id);
  assert.equal(await isSessionActive(sessionId), false);
  assert.equal((await listSessions(user.id)).length, 0);
});

test("reuse on one device revokes sessions on other devices too", async () => {
  const user = await makeUser();
  const a = await openSession(user.id, { deviceId: "phone-a" });
  const b = await openSession(user.id, { deviceId: "tablet-b" });

  const rotated = await rotateSession(a.refreshToken); // rotate phone
  assert.equal(rotated.kind, "ok");
  const reused = await rotateSession(a.refreshToken); // old phone token reused
  assert.equal(reused.kind, "reuse");

  assert.equal(await isSessionActive(a.sessionId), false);
  assert.equal(await isSessionActive(b.sessionId), false); // tablet collateral
  assert.equal((await listSessions(user.id)).length, 0);
});

test("revoking one session does not touch other devices; revokeAll kills everything", async () => {
  const user = await makeUser();
  const a = await openSession(user.id, { deviceId: "a" });
  const b = await openSession(user.id, { deviceId: "b" });

  await revokeSession(a.sessionId);
  assert.equal(await isSessionActive(a.sessionId), false);
  assert.equal(await isSessionActive(b.sessionId), true);

  await revokeAllForUser(user.id);
  assert.equal(await isSessionActive(b.sessionId), false);
});

test("unknown token is invalid; expired token cannot rotate", async () => {
  const user = await makeUser();
  assert.equal((await rotateSession("never-issued-token")).kind, "invalid");

  const { sessionId, refreshToken } = await openSession(user.id);
  await prisma.session.update({
    where: { id: sessionId },
    data: { expires_at: new Date(Date.now() - 1000) },
  });
  const res = await rotateSession(refreshToken);
  assert.equal(res.kind, "expired");
  assert.equal(await isSessionActive(sessionId), false);
});

test("sessions of different users are isolated", async () => {
  const u1 = await makeUser();
  const u2 = await makeUser();
  const s1 = await openSession(u1.id, { deviceId: "x" });
  await revokeAllForUser(u1.id);
  assert.equal(await isSessionActive(s1.sessionId), false);
  // u2 still has its own session after opening
  const s2 = await openSession(u2.id, { deviceId: "y" });
  assert.equal(await isSessionActive(s2.sessionId), true);
});
