/**
 * Build the EMPTY, fully-migrated template DB used by tests/_db.js.
 *
 * The test harness copies prisma/scratch_new.db to a temp file per suite, so
 * the template must exist but must contain no rows. This script:
 *   1. creates a scratch DB file
 *   2. applies every committed migration to it (prisma migrate deploy)
 *   3. copies the result over prisma/scratch_new.db
 *
 *   node scripts/create-test-template.mjs
 */
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(here, "..");
const prismaDir = join(backendRoot, "prisma");
const schemaDir = join(prismaDir, "schema");
const templatePath = join(prismaDir, "scratch_new.db");

const require = createRequire(join(backendRoot, "package.json"));
const { PrismaClient } = require("@prisma/client");

if (!existsSync(schemaDir)) {
  console.error(`Schema dir not found: ${schemaDir} — run npm install first.`);
  process.exit(1);
}

// 1. fresh scratch file (relative DATABASE_URL resolves from prisma/schema/)
const scratchName = "scratch_build.db";
const scratchUrl = "file:./" + scratchName;

// migrations resolve relative to prisma/schema, so run from there
const run = (cmd, args, extraEnv = {}) =>
  execFileSync(cmd, args, {
    cwd: schemaDir,
    stdio: "inherit",
    shell: false,
    env: { ...process.env, ...extraEnv },
  });

console.log("==> prisma migrate deploy (fresh DB)");
const prismaCli = require.resolve("prisma/build/index.js");
run(process.execPath, [prismaCli, "migrate", "deploy", "--schema", schemaDir], {
  DATABASE_URL: scratchUrl,
});

// 2. sanity check: connect and count rows (tables exist, zero data)
process.env.DATABASE_URL = "file:" + join(schemaDir, scratchName).split("\\").join("/");
const prisma = new PrismaClient();
const tables = await prisma.$queryRawUnsafe(
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%'"
);
console.log(`==> template contains ${tables.length} tables`);

// 3. release the DB handle, then copy over the template and clean up
await prisma.$disconnect();
copyFileSync(join(schemaDir, scratchName), templatePath);
try {
  rmSync(join(schemaDir, scratchName), { force: true });
} catch {
  // Windows may briefly hold a handle; the leftover file is harmless (gitignored)
}

console.log(`==> template ready: ${templatePath}`);
