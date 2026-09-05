/**
 * Documents API — /api/v1/documents (docs/phase_15.md "APIs").
 *
 *   POST  /upload               multipart upload (new doc or version of id)
 *   GET   /                     list (?entity_type=&entity_id=&category=&mine=)
 *   GET   /:id                  download file bytes (ACL-checked)
 *   GET   /:id/metadata         registry metadata
 *   GET   /:id/verify           recompute sha256 -> INTACT / TAMPERED
 *   POST  /:id/shares           create a PUBLIC share (short code)
 *   DELETE /:id/shares/:shareId revoke a share
 *   GET   /:id/logs             access log for this document (owner/admin)
 *   -- public (no auth) --
 *   GET   /shares/:code         consumer-safe public download
 *   -- admin (documents.manage) --
 *   GET   /admin/overview       totals, categories, pending jobs
 *   POST  /admin/retention/run  run the retention scan now
 *   POST  /admin/jobs/process   drain storage jobs now
 *   POST  /certificates/link    link an uploaded PDF to a certificate_number
 */
const express = require("express");
const multer = require("multer");
const { z } = require("zod");
const { ok, error } = require("../../utils/responses");
const { requireAuth, requirePermission } = require("../../middleware/auth");
const documents = require("../../services/documents");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 60 * 1024 * 1024 } });
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const idParam = z.object({ id: z.string().min(1) });
const idShareParam = z.object({ id: z.string().min(1), shareId: z.string().min(1) });
const codeParam = z.object({ code: z.string().min(1) });

function mountDocumentRoutes(app) {
  const router = express.Router();

  // Public share resolution — registered BEFORE requireAuth so consumers can
  // fetch passport certificates without an account.
  router.get(
    "/shares/:code",
    wrap(async (req, res) => {
      const { code } = codeParam.parse(req.params);
      const { doc, bytes } = await documents.resolveShare(code, req.ip);
      res.setHeader("Content-Type", doc.mime_type || "application/octet-stream");
      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(doc.file_name)}"`);
      res.setHeader("X-Document-No", doc.document_no);
      return res.send(bytes);
    })
  );

  router.use(requireAuth);

  // ---------------------------------------------------------------- upload
  router.post(
    "/upload",
    requirePermission("documents.upload"),
    upload.single("file"),
    wrap(async (req, res) => {
      if (!req.file) return error(res, "bad_request", "file (multipart) is required", 400);
      const body = req.body || {};
      const category = body.category;
      if (!category) return error(res, "bad_request", "category is required", 400);
      const doc = await documents.uploadDocument(req.user, {
        category,
        entity_type: body.entity_type || null,
        entity_id: body.entity_id || null,
        filename: body.filename || req.file.originalname,
        mime_type: body.mime_type || req.file.mimetype,
        size_bytes: req.file.size,
        buffer: req.file.buffer,
        visibility: body.visibility || "RESTRICTED",
        document_id: body.document_id || null,
        ipAddress: req.ip,
      });
      return ok(res, { document: documents.publicSafe(doc) }, 201);
    })
  );

  // -------------------------------------------------------------- list / read
  router.get(
    "/",
    wrap(async (req, res) => {
      const data = await documents.listDocuments(req.user, {
        entity_type: req.query.entity_type || null,
        entity_id: req.query.entity_id || null,
        category: req.query.category || null,
        limit: req.query.limit ? parseInt(req.query.limit, 10) : 100,
        offset: req.query.offset ? parseInt(req.query.offset, 10) : 0,
      });
      return ok(res, { documents: data.documents.map(documents.publicSafe), total: data.total });
    })
  );

  router.get(
    "/:id/metadata",
    wrap(async (req, res) => {
      const { id } = idParam.parse(req.params);
      return ok(res, { document: documents.publicSafe(await documents.getMetadata(req.user, id)) });
    })
  );

  router.get(
    "/:id/verify",
    wrap(async (req, res) => {
      const { id } = idParam.parse(req.params);
      return ok(res, await documents.verifyChecksum(req.user, id, req.ip));
    })
  );

  router.get(
    "/:id",
    wrap(async (req, res) => {
      const { id } = idParam.parse(req.params);
      const { doc, bytes } = await documents.downloadDocument(req.user, id, { ipAddress: req.ip });
      res.setHeader("Content-Type", doc.mime_type || "application/octet-stream");
      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(doc.file_name)}"`);
      res.setHeader("ETag", doc.checksum_sha256);
      return res.send(bytes);
    })
  );

  // ---------------------------------------------------------------- shares
  const shareBody = z.object({
    expires_at: z.string().optional().nullable(),
  });

  router.post(
    "/:id/shares",
    requirePermission("documents.share"),
    wrap(async (req, res) => {
      const { id } = idParam.parse(req.params);
      const parsed = shareBody.safeParse(req.body || {});
      if (!parsed.success) return error(res, "bad_request", "Invalid share payload", 400);
      const share = await documents.createShare(req.user, id, { expires_at: parsed.data.expires_at, ipAddress: req.ip });
      return ok(res, { share: { id: share.id, share_code: share.share_code, expires_at: share.expires_at, download_count: share.download_count } }, 201);
    })
  );

  router.delete(
    "/:id/shares/:shareId",
    requirePermission("documents.share"),
    wrap(async (req, res) => {
      const { id, shareId } = idShareParam.parse(req.params);
      return ok(res, await documents.revokeShare(req.user, id, shareId));
    })
  );

  // ------------------------------------------------------------- access log
  router.get(
    "/:id/logs",
    requirePermission("documents.manage"),
    wrap(async (req, res) => {
      const { id } = idParam.parse(req.params);
      const logs = await documents.accessLogsFor(id);
      return ok(res, { logs });
    })
  );

  // ---------------------------------------------------------- certificate link
  router.post(
    "/certificates/link",
    requirePermission("documents.upload"),
    wrap(async (req, res) => {
      const body = req.body || {};
      if (!body.certificate_number || !body.document_id) {
        return error(res, "bad_request", "certificate_number and document_id are required", 400);
      }
      return ok(res, { link: await documents.linkCertificateDocument(req.user, body) }, 201);
    })
  );

  // --------------------------------------------------------------- admin
  router.get(
    "/admin/overview",
    requirePermission("documents.manage"),
    wrap(async (req, res) => {
      return ok(res, await documents.adminOverview());
    })
  );

  router.post(
    "/admin/retention/run",
    requirePermission("documents.manage"),
    wrap(async (req, res) => {
      return ok(res, await documents.runRetentionScan());
    })
  );

  router.post(
    "/admin/jobs/process",
    requirePermission("documents.manage"),
    wrap(async (req, res) => {
      return ok(res, await documents.processStorageJobs({ actor: req.user.id }));
    })
  );

  app.use("/api/v1/documents", router);
}

module.exports = { mountDocumentRoutes };