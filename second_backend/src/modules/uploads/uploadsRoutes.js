/**
 * Uploads module — POST /api/v1/uploads (multipart, single file) + static
 * serving of the local driver in dev.
 */
const express = require("express");
const multer = require("multer");
const path = require("path");
const { ok, error } = require("../../utils/responses");
const { requireAuth } = require("../../middleware/auth");
const { saveImageUpload } = require("../../services/uploads");
const storage = require("../../services/storage");
const { env } = require("../../config/env");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE, files: 1 },
});

function mountUploadRoutes(app) {
  const router = express.Router();

  // Serve stored files (local driver). A CDN driver would skip this.
  const uploadsDir = storage.localDir();
  app.use("/uploads", express.static(uploadsDir));

  router.post(
    "/",
    requireAuth,
    (req, res, next) => {
      upload.single("file")(req, res, (err) => {
        if (!err) return next();
        if (err.code === "LIMIT_FILE_SIZE") return error(res, "bad_request", "File too large", 413);
        if (err.code === "LIMIT_FILE_COUNT") return error(res, "bad_request", "Only one file per request", 400);
        return error(res, "bad_request", `Upload failed: ${err.message}`, 400);
      });
    },
    (req, res, next) => {
      if (!req.file) return error(res, "bad_request", "file field is required (multipart/form-data)", 400);
      const asset = saveImageUpload({
        ownerUserId: req.user.id,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        metadataRaw: req.body.metadata || null,
        buffer: req.file.buffer,
      });
      return asset
        .then((a) => ok(res, { asset: { id: a.id, url: a.url, filename: a.filename, mime_type: a.mime_type, size_bytes: a.size_bytes, metadata: a.metadata_json }, created_by: req.user.id }, 201))
        .catch(next);
    }
  );

  app.use("/api/v1/uploads", router);
}

module.exports = { mountUploadRoutes };
