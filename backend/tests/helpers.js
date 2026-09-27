/**
 * Test harness (replaces backend/server/tests/conftest.py).
 *
 * Each test-file process gets its own SQLite database:
 *   1. `setupDatabase()` must be called BEFORE requiring the app — it builds
 *      a schema template once per process (prisma db push) and copies it to
 *      a unique file, then sets process.env.DATABASE_URL so the shared
 *      PrismaClient in src/db/client.js connects to the isolated DB.
 *   2. `wipe(prisma)` clears every table between tests (FK-safe order).
 */
const { execSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const assert = require("node:assert");
const request = require("supertest");

const PROJECT_ROOT = path.join(__dirname, "..");
const TESTDB_DIR = path.join(PROJECT_ROOT, ".testdb");

// Absolute file: URL — relative paths resolve against prisma/schema/ (multi-file
// schema dir), which would place files in prisma/.testdb instead of .testdb/.
const toUrl = (absPath) => "file:" + absPath.split(path.sep).join("/");

/** Must be called before any require of ../src (config/db/app). */
function setupDatabase() {
  fs.mkdirSync(TESTDB_DIR, { recursive: true });
  const templateName = `template-${process.pid}.db`;
  const template = path.join(TESTDB_DIR, templateName);
  if (!fs.existsSync(template)) {
    execSync("npx prisma db push --skip-generate", {
      cwd: PROJECT_ROOT,
      env: { ...process.env, DATABASE_URL: toUrl(template) },
      stdio: "pipe",
    });
  }
  const dbName = `test-${process.pid}-${crypto.randomBytes(4).toString("hex")}.db`;
  fs.copyFileSync(template, path.join(TESTDB_DIR, dbName));
  process.env.DATABASE_URL = toUrl(path.join(TESTDB_DIR, dbName));
  // Weather tests need no live provider.
  delete process.env.OPENWEATHER_API_KEY;
}

/**
 * Clear every table. Schema-independent: current schema replaced several old
 * models (ProductBatchLink, LabReport, BatchState, FarmProfile, HerbCatalogue),
 * so wipe by iterating sqlite_master instead of hardcoded Prisma delegates.
 */
async function wipe(prisma) {
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = OFF");
  const rows = await prisma.$queryRawUnsafe(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%'"
  );
  for (const { name } of rows) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${name}"`);
  }
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON");
}

async function teardown(prisma) {
  await prisma.$disconnect();
  const url = process.env.DATABASE_URL || "";
  const match = url.match(/\.testdb\/([^/]+\.db)$/);
  if (match) {
    try {
      fs.unlinkSync(path.join(TESTDB_DIR, match[1]));
    } catch {
      // already gone
    }
  }
}

/** Register a user via the API; returns [accessToken, userDict]. */
async function register(app, role, email, password = "password123") {
  const emailAddr = email || `${role}+${Math.abs(hashCode(role + password)) % 10_000_000}@test.local`;
  const r = await request(app).post("/api/v1/auth/register").send({
    role,
    name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
    email: emailAddr,
    password,
  });
  assert.strictEqual(r.status, 201, JSON.stringify(r.body));
  const data = r.body.data;
  return [data.access_token, data.user];
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

module.exports = { setupDatabase, wipe, teardown, register, authHeaders, request };