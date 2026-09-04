/**
 * Isolated-DB harness (shared). Each test file runs in its own node:test
 * process; setupDb() copies the fully migrated template DB to a unique temp
 * file and pins process.env.DATABASE_URL BEFORE any Prisma-touching module is
 * required. dotenv never overrides an env var that is already set.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const TEMPLATE = path.join(__dirname, "..", "prisma", "scratch_new.db");

function setupDb() {
  if (!fs.existsSync(TEMPLATE)) {
    throw new Error(`Template DB missing: ${TEMPLATE} — run prisma migrate deploy on scratch_new.db first`);
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "herbchain-test-"));
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
