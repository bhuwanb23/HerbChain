/**
 * Storage driver (docs/batch/architecture.md §5).
 *
 * Interface: { put(key, buffer), urlFor(key), remove(key) }. v1 driver is a
 * local disk directory (env UPLOAD_DIR, served statically in dev). S3/Azure
 * implement the same interface behind the provider flag later — callers never
 * import fs.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { env } = require("../config/env");

function localDir() {
  return path.isAbsolute(env.UPLOAD_DIR) ? env.UPLOAD_DIR : path.join(__dirname, "..", "..", env.UPLOAD_DIR);
}

function ensureDir() {
  const dir = localDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Random key with the original extension preserved for content sniffing. */
function generateKey(originalName, mimeType) {
  const ext = (path.extname(originalName || "") || mimeToExt(mimeType)).toLowerCase();
  return `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
}

function mimeToExt(mime) {
  const map = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "application/pdf": ".pdf" };
  return map[mime] || "";
}

async function put(key, buffer) {
  const filePath = path.join(ensureDir(), key);
  await fs.promises.writeFile(filePath, buffer);
  return key;
}

async function remove(key) {
  if (!key) return;
  await fs.promises.unlink(path.join(localDir(), key)).catch(() => {});
}

/** Dev URL for the local driver (CDN driver returns absolute URLs later). */
function urlFor(key) {
  return `/uploads/${encodeURIComponent(key)}`;
}

module.exports = { put, remove, urlFor, generateKey, localDir };
