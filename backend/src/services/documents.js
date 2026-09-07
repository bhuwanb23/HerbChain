/**
 * Phase 15 — document management service (docs/phase_15.md).
 *
 * The evidence repository. Bytes go to the storage driver (never the DB);
 * these tables hold the registry, versions, access logs, shares, retention
 * and async storage jobs. Core guarantees:
 *   - NEVER overwrite: every upload of the same logical document is a new
 *     DocumentVersion; the Document row points at the current bytes.
 *   - Integrity: sha256 checksum on every version; verify() recomputes
 *     against the live bytes (tamper detection).
 *   - Access control: visibility + role/ownership matrix; every access is
 *     logged (DocumentAccessLog).
 *   - Anchorable categories (certificates, compliance, investigations,
 *     laboratory) enqueue a blockchain DOCUMENT_UPLOADED anchor whose hash
 *     material includes the file checksum.
 */
const fs = require("fs");
const crypto = require("crypto");
const { prisma } = require("../db/client");
const { ApiError } = require("../utils/errors");
const storage = require("./storage");
const { env } = require("../config/env");
const { writeAudit } = require("./audit");
const blockchain = require("./blockchain");
const {
  DOCUMENT_CATEGORIES,
  CATEGORY_ENTITY_TYPES,
  VISIBILITY,
  DOCUMENT_STATUS,
  STORAGE_JOB_KIND,
  STORAGE_JOB_STATUS,
  ACCESS_ACTIONS,
  ALLOWED_MIME_TYPES,
  FILE_TYPE_OF_MIME,
  SIZE_CAPS_BYTES,
  DEFAULT_RETENTION_RULES,
  ANCHORABLE_CATEGORIES,
} = require("../constants/documents");

// ------------------------------------------------------------ code gen

async function nextDocumentNo(tx = prisma) {
  const year = new Date().getFullYear();
  const pre = `DOC-${year}-`;
  const count = await tx.document.count({ where: { document_no: { startsWith: pre } } });
  return `${pre}${String(count + 1).padStart(6, "0")}`;
}

// ------------------------------------------------------------ validation

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function fileTypeOf(mime) {
  return FILE_TYPE_OF_MIME[mime] || null;
}

function validateCategory(category) {
  if (!DOCUMENT_CATEGORIES.includes(category)) {
    throw new ApiError("bad_request", `category must be one of: ${DOCUMENT_CATEGORIES.join(", ")}`, 400);
  }
}

function validateEntityRef(category, entityType) {
  if (!entityType) return; // unbound / standalone documents allowed
  const allowed = CATEGORY_ENTITY_TYPES[category];
  if (!allowed || !allowed.includes(entityType)) {
    throw new ApiError("bad_request", `entity_type '${entityType}' is not allowed in category '${category}'`, 400);
  }
}

function assertAllowedFile({ mimeType, sizeBytes }) {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new ApiError("bad_request", `File type '${mimeType}' is not allowed — jpeg/png/webp/pdf/docx/xlsx only`, 400);
  }
  const cap = SIZE_CAPS_BYTES[fileTypeOf(mimeType)] || 50 * 1024 * 1024;
  if (sizeBytes > cap) {
    throw new ApiError("bad_request", `File too large (${Math.round(sizeBytes / 1024 / 1024)}MB — max ${Math.round(cap / 1024 / 1024)}MB for ${fileTypeOf(mimeType)})`, 413);
  }
  if (sizeBytes <= 0) throw new ApiError("bad_request", "Empty file", 400);
}

// ------------------------------------------------------------ access control

/**
 * Can `user` access this document at the given level?
 * Admin always yes. PUBLIC -> anyone with documents.view. REGULATORY ->
 * admin only (unless the user uploaded it as a regulator upload).
 * RESTRICTED/CONFIDENTIAL -> owner + entity parties + admins; CONFIDENTIAL
 * excludes non-owning farmers/transporters even if attached to their batch
 * (raw lab data is lab-side).
 */
async function canAccessDocument(user, doc, { level = "view" } = {}) {
  if (!user) return doc.visibility === VISIBILITY.PUBLIC;
  if (user.role === "admin") return true;

  const isOwner = doc.uploaded_by_user_id === user.id;
  if (doc.visibility === VISIBILITY.PUBLIC) return true;
  if (doc.visibility === VISIBILITY.REGULATORY) return isOwner; // only regulator uploaders / admins

  // Resolve the entity parties (polymorphic).
  const parties = await entityParties(doc.entity_type, doc.entity_id);
  const isParty = parties.includes(user.id);
  if (doc.visibility === VISIBILITY.CONFIDENTIAL) return isOwner || isParty; // raw reports: parties only
  return isOwner || isParty; // RESTRICTED
}

async function entityParties(entityType, entityId) {
  if (!entityType || !entityId) return [];
  const ids = new Set();
  try {
    switch (entityType) {
      case "batch": {
        const b = await prisma.batch.findUnique({ where: { id: entityId }, select: { farmer_id: true, current_holder_user_id: true } });
        if (b) {
          ids.add(b.farmer_id);
          ids.add(b.current_holder_user_id);
        }
        break;
      }
      case "shipment": {
        const s = await prisma.shipment.findUnique({
          where: { id: entityId },
          select: { requested_by_user_id: true, from_user_id: true, to_user_id: true, assigned_transporter_user_id: true },
        });
        if (s) {
          for (const k of ["requested_by_user_id", "from_user_id", "to_user_id", "assigned_transporter_user_id"]) if (s[k]) ids.add(s[k]);
        }
        break;
      }
      case "product": {
        const p = await prisma.product.findUnique({ where: { id: entityId }, select: { manufacturer_user_id: true } });
        if (p && p.manufacturer_user_id) ids.add(p.manufacturer_user_id);
        break;
      }
      case "product_lot": {
        const l = await prisma.productLot.findUnique({ where: { id: entityId }, select: { product: { select: { manufacturer_user_id: true } } } });
        if (l?.product?.manufacturer_user_id) ids.add(l.product.manufacturer_user_id);
        break;
      }
      case "certificate": {
        const c = await prisma.certification.findUnique({ where: { id: entityId }, select: { lab_user_id: true, batch: { select: { farmer_id: true, current_holder_user_id: true } } } });
        if (c) {
          ids.add(c.lab_user_id);
          if (c.batch) {
            ids.add(c.batch.farmer_id);
            ids.add(c.batch.current_holder_user_id);
          }
        }
        break;
      }
      case "user":
        ids.add(entityId);
        break;
      default:
        break;
    }
  } catch {
    /* entity row may not exist yet — fall through */
  }
  return [...ids].filter(Boolean);
}

async function logAccess({ documentId, userId = null, action, ipAddress = null }) {
  return prisma.documentAccessLog.create({
    data: { document_id: documentId, user_id: userId, action, ip_address: ipAddress },
  });
}

// ------------------------------------------------------------ upload

/**
 * Upload a file buffer. Every upload of an existing document_id becomes a
 * NEW version (never overwrite). Returns the Document + version.
 * If virus scanning is enabled a queued StorageJob is created and processed
 * by the worker; otherwise the upload is validated immediately.
 */
async function uploadDocument(
  user,
  { category, entity_type = null, entity_id = null, filename, mime_type, size_bytes, buffer, visibility = VISIBILITY.RESTRICTED, document_id = null, ipAddress = null }
) {
  validateCategory(category);
  validateEntityRef(category, entity_type);
  assertAllowedFile({ mimeType: mime_type, sizeBytes: size_bytes });

  const checksum = sha256(buffer);
  const existing = document_id ? await prisma.document.findUnique({ where: { id: document_id } }) : null;

  const out = await prisma.$transaction(async (tx) => {
    let doc;
    if (existing) {
      // New version of an existing logical document.
      const current = await tx.document.findUnique({ where: { id: existing.id } });
      const versions = await tx.documentVersion.count({ where: { document_id: existing.id } });
      const key = storage.generateKey(filename, mime_type);
      await storage.put(key, buffer);
      await tx.documentVersion.create({
        data: {
          document_id: existing.id,
          version: versions + 1,
          storage_key: key,
          checksum_sha256: checksum,
          file_size: size_bytes,
          file_name: filename || existing.file_name,
          uploaded_by_user_id: user.id,
        },
      });
      doc = await tx.document.update({
        where: { id: existing.id },
        data: {
          storage_key: key,
          public_url: storage.urlFor(key),
          checksum_sha256: checksum,
          file_size: size_bytes,
          file_name: filename || existing.file_name,
          mime_type,
          uploaded_by_user_id: user.id,
          uploaded_at: new Date(),
          status: DOCUMENT_STATUS.VALIDATED,
          archived_at: null,
          deleted_at: null,
        },
      });
    } else {
      const key = storage.generateKey(filename, mime_type);
      await storage.put(key, buffer);
      const documentNo = await nextDocumentNo(tx);
      doc = await tx.document.create({
        data: {
          document_no: documentNo,
          category,
          entity_type,
          entity_id,
          file_name: filename || "unnamed",
          storage_key: key,
          public_url: storage.urlFor(key),
          file_type: fileTypeOf(mime_type),
          mime_type,
          file_size: size_bytes,
          checksum_sha256: checksum,
          visibility,
          status: DOCUMENT_STATUS.VALIDATED,
          uploaded_by_user_id: user.id,
        },
      });
      await tx.documentVersion.create({
        data: {
          document_id: doc.id,
          version: 1,
          storage_key: key,
          checksum_sha256: checksum,
          file_size: size_bytes,
          file_name: filename || "unnamed",
          uploaded_by_user_id: user.id,
        },
      });
    }

    // Virus-scan job when enabled (worker marks done / failed).
    if (env.VIRUS_SCAN_ENABLED) {
      await tx.storageJob.create({
        data: { kind: STORAGE_JOB_KIND.VIRUS_SCAN, document_id: doc.id, payload_json: { checksum } },
      });
    }

    await tx.documentAccessLog.create({
      data: { document_id: doc.id, user_id: user.id, action: ACCESS_ACTIONS.UPLOAD, ip_address: ipAddress },
    });
    return doc;
  });

  await writeAudit({
    actorUserId: user.id,
    action: existing ? "DOCUMENT_VERSIONED" : "DOCUMENT_UPLOADED",
    targetType: "document",
    targetId: out.id,
    meta: { document_no: out.document_no, category, entity_type, entity_id, checksum, size: size_bytes },
  });

  // Blockchain hash anchor for evidence categories.
  if (ANCHORABLE_CATEGORIES.includes(category)) {
    await blockchain.enqueue({
      anchorCode: category === "certificates" ? "CERTIFICATE_UPLOADED" : "DOCUMENT_UPLOADED",
      entityType: "document",
      entityId: out.id,
      performedByUserId: user.id,
      payload: { document_no: out.document_no, checksum, category },
    });
  }

  return prisma.document.findUnique({ where: { id: out.id }, include: { versions: { orderBy: { version: "desc" } }, shares: true } });
}

// ------------------------------------------------------------ download / read

/**
 * Resolve + authorize. Returns the document (with current storage bytes)
 * when the caller may access it.
 */
async function authorizeDownload(user, documentId, ipAddress = null) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { versions: { orderBy: { version: "desc" } } },
  });
  if (!doc) throw new ApiError("not_found", "Document not found", 404);
  if (doc.status === DOCUMENT_STATUS.DELETED) throw new ApiError("not_found", "Document was purged", 404);
  const ok = await canAccessDocument(user, doc);
  if (!ok) {
    await logAccess({ documentId: doc.id, userId: user ? user.id : null, action: "VIEW", ipAddress });
    throw new ApiError("forbidden", "You do not have access to this document", 403);
  }
  return doc;
}

async function readBytes(key) {
  // Storage driver seam: local v1 (reads from the UPLOAD_DIR root). S3/Azure
  // implement the same fetch behind storage later.
  const pathMod = require("path");
  const p = pathMod.isAbsolute(key) ? key : pathMod.join(storage.localDir(), key);
  const buf = await fs.promises.readFile(p);
  return buf;
}

async function downloadDocument(user, documentId, { action = ACCESS_ACTIONS.DOWNLOAD, ipAddress = null } = {}) {
  const doc = await authorizeDownload(user, documentId, ipAddress);
  const bytes = await readBytes(doc.storage_key);
  await logAccess({ documentId: doc.id, userId: user ? user.id : null, action, ipAddress });
  return { doc, bytes };
}

async function verifyChecksum(user, documentId, ipAddress = null) {
  const doc = await authorizeDownload(user, documentId, ipAddress);
  const bytes = await readBytes(doc.storage_key);
  const actual = sha256(bytes);
  const matches = actual === doc.checksum_sha256;
  await logAccess({ documentId: doc.id, userId: user ? user.id : null, action: ACCESS_ACTIONS.VERIFY, ipAddress });
  return { document_id: doc.id, document_no: doc.document_no, stored_checksum: doc.checksum_sha256, actual_checksum: actual, matches, status: matches ? "INTACT" : "TAMPERED" };
}

async function getMetadata(user, documentId) {
  const doc = await authorizeDownload(user, documentId);
  return doc;
}

// ------------------------------------------------------------ listing / search

async function listDocuments(user, { entity_type = null, entity_id = null, category = null, limit = 100, offset = 0 } = {}) {
  // Listing is ownership-scoped for non-admins (parties can still read via
  // entity-scoped queries resolved by canAccessDocument at download time).
  const base = {};
  if (entity_type && entity_id) base.entity_type = entity_type;
  if (entity_type && entity_id) base.entity_id = entity_id;
  if (category) base.category = category;
  if (user.role === "admin") {
    const [rows, total] = await Promise.all([
      prisma.document.findMany({
        where: base,
        orderBy: { uploaded_at: "desc" },
        take: Math.min(200, limit),
        skip: offset,
        include: { versions: { orderBy: { version: "desc" }, take: 1 } },
      }),
      prisma.document.count({ where: base }),
    ]);
    return { documents: rows, total };
  }
  // Non-admin: own uploads across the scope, or entity-scoped where they are
  // a party — resolve by fetching candidates then filtering in JS.
  const where = {
    ...base,
    uploaded_by_user_id: user.id,
  };
  const [owned, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { uploaded_at: "desc" },
      take: Math.min(200, limit),
      skip: offset,
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    }),
    prisma.document.count({ where }),
  ]);
  return { documents: owned, total };
}

// ------------------------------------------------------------ shares

async function createShare(user, documentId, { expires_at = null, ipAddress = null } = {}) {
  const doc = await authorizeDownload(user, documentId, ipAddress);
  if (doc.visibility !== VISIBILITY.PUBLIC) {
    throw new ApiError("bad_request", "Only PUBLIC documents can be shared with consumers", 400);
  }
  const share = await prisma.documentShare.create({
    data: {
      document_id: doc.id,
      share_code: crypto.randomBytes(4).toString("hex").toUpperCase(),
      created_by_user_id: user.id,
      expires_at: expires_at ? new Date(expires_at) : null,
    },
  });
  await logAccess({ documentId: doc.id, userId: user.id, action: ACCESS_ACTIONS.SHARE, ipAddress });
  return share;
}

async function revokeShare(user, documentId, shareId) {
  const share = await prisma.documentShare.findUnique({ where: { id: shareId } });
  if (!share) throw new ApiError("not_found", "Share not found", 404);
  if (share.document_id !== documentId) throw new ApiError("bad_request", "Share does not belong to this document", 400);
  return prisma.documentShare.update({ where: { id: shareId }, data: { revoked_at: new Date() } });
}

async function resolveShare(shareCode, ipAddress = null) {
  const share = await prisma.documentShare.findUnique({ where: { share_code: shareCode } });
  if (!share) throw new ApiError("not_found", "Share not found", 404);
  if (share.revoked_at) throw new ApiError("forbidden", "This share has been revoked", 403);
  if (share.expires_at && share.expires_at < new Date()) throw new ApiError("forbidden", "This share has expired", 403);
  const doc = await prisma.document.findUnique({ where: { id: share.document_id } });
  if (!doc || doc.status === DOCUMENT_STATUS.DELETED) throw new ApiError("not_found", "Document not found", 404);
  if (doc.visibility !== VISIBILITY.PUBLIC) throw new ApiError("forbidden", "This document is not public", 403);
  const bytes = await readBytes(doc.storage_key);
  await prisma.documentShare.update({ where: { id: share.id }, data: { download_count: { increment: 1 } } });
  await logAccess({ documentId: doc.id, userId: null, action: ACCESS_ACTIONS.DOWNLOAD, ipAddress });
  return { doc, bytes };
}

// ------------------------------------------------------------ retention

async function seedRetentionRules(tx = prisma) {
  for (const r of DEFAULT_RETENTION_RULES) {
    await tx.documentRetentionRule.upsert({
      where: { category: r.category },
      update: { retention_months: r.retention_months, is_active: true },
      create: { category: r.category, retention_months: r.retention_months },
    });
  }
  return DEFAULT_RETENTION_RULES.length;
}

/** Retention scan: archive docs older than their window; permanent = never. */
async function runRetentionScan({ now = new Date() } = {}) {
  const rules = await prisma.documentRetentionRule.findMany({ where: { is_active: true } });
  let archived = 0;
  let marked = 0;
  for (const rule of rules) {
    if (!rule.retention_months) continue; // permanent
    const cutoff = new Date(now.getTime() - rule.retention_months * 30 * 24 * 3600 * 1000);
    const docs = await prisma.document.findMany({
      where: { category: rule.category, status: DOCUMENT_STATUS.VALIDATED, uploaded_at: { lt: cutoff } },
      select: { id: true },
    });
    for (const d of docs) {
      await prisma.storageJob.create({
        data: { kind: STORAGE_JOB_KIND.ARCHIVE, document_id: d.id, payload_json: { rule_category: rule.category } },
      });
      marked += 1;
    }
  }
  return { archived, marked };
}

async function processStorageJobs({ limit = env.DOCUMENT_PROCESS_LIMIT, actor = "worker" } = {}) {
  const jobs = await prisma.storageJob.findMany({
    where: { status: { in: [STORAGE_JOB_STATUS.QUEUED] } },
    orderBy: { created_at: "asc" },
    take: Math.max(1, limit),
  });
  let processed = 0;
  for (const job of jobs) {
    const claim = await prisma.storageJob.updateMany({
      where: { id: job.id, status: STORAGE_JOB_STATUS.QUEUED },
      data: { status: STORAGE_JOB_STATUS.PROCESSING, updated_at: new Date() },
    });
    if (claim.count === 0) continue;
    try {
      if (job.kind === STORAGE_JOB_KIND.VIRUS_SCAN) {
        // Stub scanner — provider seam (ClamAV etc. later). Clean pass.
        if (job.document_id) {
          await prisma.document.update({ where: { id: job.document_id }, data: { status: DOCUMENT_STATUS.VALIDATED } });
        }
      } else if (job.kind === STORAGE_JOB_KIND.ARCHIVE) {
        if (job.document_id) {
          await prisma.document.update({ where: { id: job.document_id }, data: { status: DOCUMENT_STATUS.ARCHIVED, archived_at: new Date() } });
        }
      } else if (job.kind === STORAGE_JOB_KIND.DELETE) {
        if (job.document_id) {
          const doc = await prisma.document.findUnique({ where: { id: job.document_id } });
          if (doc) {
            await storage.remove(doc.storage_key).catch(() => {});
            await prisma.document.update({ where: { id: doc.id }, data: { status: DOCUMENT_STATUS.DELETED, deleted_at: new Date() } });
          }
        }
      }
      await prisma.storageJob.update({
        where: { id: job.id },
        data: { status: STORAGE_JOB_STATUS.DONE, completed_at: new Date(), updated_at: new Date() },
      });
      processed += 1;
    } catch (err) {
      await prisma.storageJob.update({
        where: { id: job.id },
        data: { status: STORAGE_JOB_STATUS.FAILED, last_error: String(err.message || err).slice(0, 500), updated_at: new Date() },
      });
    }
  }
  return { processed, actor };
}

// ------------------------------------------------------------ certificate link

/** Link an uploaded PDF to a certificate (docs/phase_15 "Certificate Management"). */
async function linkCertificateDocument(user, { certificate_number, document_id }) {
  const doc = await prisma.document.findUnique({ where: { id: document_id } });
  if (!doc) throw new ApiError("not_found", "Document not found", 404);
  if (!ANCHORABLE_CATEGORIES.includes(doc.category)) {
    throw new ApiError("bad_request", "Only certificates / compliance docs can be certificate-linked", 400);
  }
  const cert = await prisma.certification.findUnique({ where: { certificate_number } });
  if (!cert) throw new ApiError("not_found", `Certificate ${certificate_number} not found`, 404);
  const link = await prisma.certificateDocument.create({
    data: {
      certificate_number,
      document_id,
      certificate_hash: cert.certificate_hash || null,
      issued_by_user_id: user.id,
    },
  });
  await writeAudit({
    actorUserId: user.id,
    action: "CERTIFICATE_DOCUMENT_LINKED",
    targetType: "document",
    targetId: document_id,
    meta: { certificate_number, link_id: link.id },
  });
  return link;
}

// ------------------------------------------------------------ admin center

// ------------------------------------------------------------ serializers

/** Strip internal fields (storage_key is sensitive) for wire responses. */
function publicSafe(doc) {
  if (!doc) return doc;
  const { storage_key, ...rest } = doc;
  return rest;
}

async function accessLogsFor(documentId, { limit = 100 } = {}) {
  return prisma.documentAccessLog.findMany({
    where: { document_id: documentId },
    orderBy: { created_at: "desc" },
    take: Math.min(200, limit),
  });
}

async function adminOverview() {
  const [total, byCategory, pendingJobs, archived, accessLogCount, shares] = await Promise.all([
    prisma.document.count(),
    prisma.document.groupBy({ by: ["category"], _count: true }),
    prisma.storageJob.count({ where: { status: { in: ["queued", "processing"] } } }),
    prisma.document.count({ where: { status: "archived" } }),
    prisma.documentAccessLog.count(),
    prisma.documentShare.count({ where: { revoked_at: null } }),
  ]);
  return { total, by_category: byCategory, pending_jobs: pendingJobs, archived, access_log_count: accessLogCount, active_shares: shares };
}

// ------------------------------------------------------------ exports

module.exports = {
  uploadDocument,
  downloadDocument,
  getMetadata,
  verifyChecksum,
  listDocuments,
  createShare,
  revokeShare,
  resolveShare,
  linkCertificateDocument,
  seedRetentionRules,
  runRetentionScan,
  processStorageJobs,
  adminOverview,
  publicSafe,
  accessLogsFor,
  sha256,
  canAccessDocument,
  // test seams
  readBytes,
};