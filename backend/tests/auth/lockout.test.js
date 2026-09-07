const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const { setupDb } = require("./_db");

const db = setupDb();
const { prisma } = require("../../src/db/client");
after(async () => {
  await prisma.$disconnect();
  db.cleanup();
});

const { MAX_FAILURES, LOCK_WINDOWS_MS, isLocked, registerFailure, registerSuccess } = require("../../src/services/lockout");

let seq = 0;
async function makeUser(role = "consumer", extra = {}) {
  seq += 1;
  return prisma.user.create({
    data: {
      name: `L${seq}`,
      email: `lock${seq}-${process.pid}-${Date.now()}@test.dev`,
      password_hash: "x",
      role,
      ...extra,
    },
  });
}

test("4 failures: counted but not locked", async () => {
  let user = await makeUser();
  let last;
  for (let i = 0; i < 4; i++) {
    user = await prisma.user.findUnique({ where: { id: user.id } }); // fresh read, like the login route
    last = await registerFailure(user);
  }
  assert.equal(last.locked, false);
  assert.equal(last.failed_login_count, 4);
  assert.equal(last.locked_until, null);
  assert.equal(isLocked({ ...user, failed_login_count: 4, locked_until: null }), false);
});

test("5th failure locks for 15 minutes; 6th escalates to 1 hour", async () => {
  let user = await makeUser();
  let res;
  for (let i = 0; i < 5; i++) {
    user = await prisma.user.findUnique({ where: { id: user.id } });
    res = await registerFailure(user);
  }
  assert.equal(res.locked, true);
  assert.equal(res.failed_login_count, 5);
  const delta5 = new Date(res.locked_until).getTime() - Date.now();
  assert.ok(delta5 > LOCK_WINDOWS_MS[0] - 5000 && delta5 <= LOCK_WINDOWS_MS[0], "locked ~15m");

  res = await registerFailure(await prisma.user.findUnique({ where: { id: user.id } }));
  const delta6 = new Date(res.locked_until).getTime() - Date.now();
  assert.ok(delta6 > LOCK_WINDOWS_MS[1] - 5000 && delta6 <= LOCK_WINDOWS_MS[1], "escalated ~1h");
});

test("isLocked respects locked_until in the past", () => {
  assert.equal(isLocked({ locked_until: new Date(Date.now() - 1000) }), false);
  assert.equal(isLocked({ locked_until: new Date(Date.now() + 60000) }), true);
  assert.equal(isLocked({ locked_until: null }), false);
});

test("registerSuccess clears the counter and lock", async () => {
  const user = await makeUser("consumer", {
    failed_login_count: 7,
    locked_until: new Date(Date.now() + 60 * 60 * 1000),
  });
  const updated = await registerSuccess(user);
  assert.equal(updated.failed_login_count, 0);
  assert.equal(updated.locked_until, null);
});
