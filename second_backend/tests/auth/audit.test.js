const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const { setupDb } = require("./_db");

const db = setupDb();
const { prisma } = require("../../src/db/client");
after(async () => {
  await prisma.$disconnect();
  db.cleanup();
});

const { writeAudit } = require("../../src/services/audit");

test("writeAudit persists action, actor, polymorphic target and meta", async () => {
  const actor = await prisma.user.create({
    data: { name: "Admin", email: `admin-${process.pid}-${Date.now()}@test.dev`, password_hash: "x", role: "admin" },
  });
  const target = await prisma.user.create({
    data: { name: "Farmer", email: `farmer-${process.pid}-${Date.now()}@test.dev`, password_hash: "x", role: "farmer" },
  });

  const row = await writeAudit({
    actorUserId: actor.id,
    action: "USER_VERIFIED",
    targetType: "user",
    targetId: target.id,
    meta: { old_status: "pending", new_status: "verified", reason: "docs ok" },
  });

  assert.equal(row.action, "USER_VERIFIED");
  assert.equal(row.actor_user_id, actor.id);
  assert.equal(row.target_type, "user");
  assert.equal(row.target_id, target.id);
  assert.deepEqual(row.meta_json, { old_status: "pending", new_status: "verified", reason: "docs ok" });
});

test("writeAudit allows system actions (no actor) with null target", async () => {
  const row = await writeAudit({ action: "SEED_BOOTSTRAP", meta: { count: 1 } });
  assert.equal(row.actor_user_id, null);
  assert.equal(row.target_type, null);
});

test("writeAudit requires an action", async () => {
  await assert.rejects(() => writeAudit({}), /action is required/);
});
