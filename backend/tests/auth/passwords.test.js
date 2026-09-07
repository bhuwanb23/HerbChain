const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const { setupDb } = require("./_db");

const db = setupDb();
const { prisma } = require("../../src/db/client");
after(async () => {
  await prisma.$disconnect();
  db.cleanup();
});

const {
  hashPassword,
  verifyPassword,
  validatePasswordPolicy,
} = require("../../src/services/passwords");

test("hash/verify roundtrip succeeds; wrong password fails", () => {
  const hash = hashPassword("s3cret-pass");
  assert.notEqual(hash, "s3cret-pass");
  assert.equal(verifyPassword("s3cret-pass", hash), true);
  assert.equal(verifyPassword("s3cret-pass-wrong", hash), false);
});

test("verifyPassword is false on malformed input (no throw)", () => {
  assert.equal(verifyPassword("", "x"), false);
  assert.equal(verifyPassword(null, "x"), false);
  assert.equal(verifyPassword("abc", ""), false);
  assert.equal(verifyPassword("abc", "not-a-bcrypt-hash"), false);
});

test("policy: rejects <8 and >128 chars, accepts boundaries", () => {
  assert.equal(validatePasswordPolicy("1234567").ok, false);
  assert.equal(validatePasswordPolicy("12345678").ok, true);
  assert.equal(validatePasswordPolicy("x".repeat(129)).ok, false);
  assert.equal(validatePasswordPolicy("x".repeat(128)).ok, true);
  assert.equal(validatePasswordPolicy(12345678).ok, false); // non-string
});

test("two hashes of the same password differ (salt)", () => {
  const a = hashPassword("same-password-1");
  const b = hashPassword("same-password-1");
  assert.notEqual(a, b);
  assert.equal(verifyPassword("same-password-1", a), true);
  assert.equal(verifyPassword("same-password-1", b), true);
});
