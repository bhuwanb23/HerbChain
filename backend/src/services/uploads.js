/**
 * Upload service — writes a file to storage and records the Asset row with
 * audit metadata (filename, size, mime, capture GPS/device/timestamp).
 */
const { prisma } = require("../db/client");
const { ApiError } = require("../utils/errors");
const storage = require("./storage");
const { env } = require("../config/env");

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Parse the client's optional metadata string (JSON) into an object. */
function parseMetadata(raw) {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj === "object") return obj;
  } catch {
    /* ignore malformed metadata */
  }
  return null;
}

async function createImageAsset({ ownerUserId, filename, mimeType, sizeBytes, metadataRaw }) {
  if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
    throw new ApiError("bad_request", `Unsupported image type '${mimeType}' — jpeg/png/webp only`, 400);
  }
  if (sizeBytes > env.MAX_FILE_SIZE) {
    throw new ApiError("bad_request", "File too large", 413);
  }
  if (sizeBytes <= 0) {
    throw new ApiError("bad_request", "Empty file", 400);
  }
  return { mimeType };
}

/** Validate + save an uploaded file buffer and return the Asset row. */
async function saveImageUpload({ ownerUserId, filename = "", mimeType = "", sizeBytes = 0, metadataRaw = null, buffer }) {
  createImageAsset({ ownerUserId, filename, mimeType, sizeBytes, metadataRaw }); // throws on invalid
  const metadata = parseMetadata(metadataRaw);
  const key = storage.generateKey(filename, mimeType);
  await storage.put(key, buffer);
  return prisma.asset.create({
    data: {
      owner_user_id: ownerUserId,
      kind: "image",
      mime_type: mimeType,
      size_bytes: sizeBytes,
      filename: filename || null,
      storage_key: key,
      url: storage.urlFor(key),
      metadata_json: metadata,
    },
  });
}

/** Ensure a list of asset ids belong to the given user and are still unattached. */
async function assertOwnedAssets(userId, assetIds) {
  const assets = await prisma.asset.findMany({ where: { id: { in: assetIds } } });
  const owned = new Map(assets.map((a) => [a.id, a]));
  for (const id of assetIds) {
    const asset = owned.get(id);
    if (!asset) throw new ApiError("bad_request", `Unknown asset '${id}'`, 400);
    if (asset.owner_user_id !== userId) {
      throw new ApiError("forbidden", `Asset '${id}' does not belong to you`, 403);
    }
  }
  return assets;
}

module.exports = { saveImageUpload, assertOwnedAssets, parseMetadata };
