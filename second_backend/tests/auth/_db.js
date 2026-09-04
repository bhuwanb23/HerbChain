/**
 * Isolated-DB harness for auth service tests.
 *
 * Each test file runs in its own node:test process; calling setupDb() first
 * copies the fully migrated template DB (prisma/scratch_new.db) to a unique
 * temp file and pins process.env.DATABASE_URL to it BEFORE any module that
 * touches the Prisma client is required. dotenv never overrides an env var
 * that is already set, so the temp DB always wins.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const TEMPLATE = path.join(__dirname, "..", "..", "prisma", "scratch_new.db");

function setupDb() {
  if (!fs.existsSync(TEMPLATE)) {
    throw new Error(`Template DB missing: ${TEMPLATE} — run prisma migrate deploy on scratch_new.db first`);
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "herbchain-auth-"));
  const dest = path.join(dir, "test.db");
  fs.copyFileSync(TEMPLATE, dest);
  const url = "file:" + dest.split(path.sep).join("/");
  process.env.DATABASE_URL = url;

  return {
    url,
    cleanup() {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {
        /* best effort */
      }
    },
  };
}

module.exports = { setupDb };
