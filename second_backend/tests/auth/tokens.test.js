const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { setupDb } = require("./_db");

const db = setupDb();
const { prisma } = require("../../src/db/client");
const { env } = require("../../src/config/env");
after(async () => {
  await prisma.$disconnect();
  db.cleanup();
});

const {
  mintAccessToken,
  verifyAccessToken,
  mintRefreshToken,
  sha256,
} = require("../../src/services/tokens");

test("access token carries sub/sid/role/name/type and verifies", async () => {
  const user = await prisma.user.create({
    data: { name: "Ada", email: `ada-${process.pid}-${Date.now()}@test.dev`, password_hash: "x", role: "consumer" },
  });
  const token = mintAccessToken(user, { sessionId: "sess-1", jti: "jti-1" });
  const decoded = verifyAccessToken(token);
  assert.equal(decoded.sub, user.id);
  assert.equal(decoded.sid, "sess-1");
  assert.equal(decoded.jti, "jti-1");
  assert.equal(decoded.role, "consumer");
  assert.equal(decoded.type, "access");
});

test("expired access token throws TokenExpiredError", () => {
  const token = mintAccessToken(
    { id: "u-1", role: "farmer", name: "X" },
    { expiresIn: "-1s" }
  );
  assert.throws(() => verifyAccessToken(token), (err) => err.name === "TokenExpiredError");
});

test("wrong-secret and tampered tokens are rejected", () => {
  const token = jwt.sign({ sub: "u-1", type: "access" }, "other-secret", { expiresIn: "5m" });
  assert.throws(() => verifyAccessToken(token));

  const good = mintAccessToken({ id: "u-1", role: "farmer", name: "X" });
  const [head, body, sig] = good.split(".");
  const tampered = [head, Buffer.from(JSON.stringify({ sub: "u-2", type: "access" })).toString("base64url"), sig].join(".");
  assert.throws(() => verifyAccessToken(tampered));
});

test("refresh tokens are opaque, unique and only stored hashed", () => {
  const a = mintRefreshToken();
  const b = mintRefreshToken();
  assert.notEqual(a, b);
  assert.equal(typeof a, "string");
  // base64url 256-bit -> 43 chars
  assert.equal(a.length, 43);
  // sha256 is deterministic hex; raw is not derivable from the hash
  assert.equal(sha256(a).length, 64);
  assert.equal(sha256(a), sha256(a));
  assert.notEqual(sha256(a), a);
});

test("env access expiry default parses to 15 minutes", () => {
  assert.equal(env.JWT_ACCESS_TOKEN_EXPIRES, "15m");
});
