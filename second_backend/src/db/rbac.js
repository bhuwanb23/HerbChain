/**
 * DB-driven RBAC catalog + seeder (docs/phase_2.md §14, auth architecture §4).
 *
 * Permissions are rows, not code, so new roles (State Inspector, Regional
 * Officer, Consumer Auditor) are a seed change. `admin` bypasses grants in
 * the authorization service, but everything else must be granted explicitly.
 */
const { prisma } = require("./client");

const PERMISSIONS = [
  { key: "profile.self", module: "profile", description: "Read/update own profile" },
  { key: "trace.resolve", module: "trace", description: "Resolve a QR to its journey (consumer scan)" },
  { key: "batch.create", module: "batch", description: "Register a harvest batch" },
  { key: "batch.view", module: "batch", description: "View batch details (own / assigned scope)" },
  { key: "batch.transfer", module: "batch", description: "Scan and accept/transfer custody" },
  { key: "batch.request", module: "batch", description: "Request a batch (lab/manufacturer intake)" },
  { key: "batch.receive", module: "batch", description: "Receive a requested batch" },
  { key: "lab.test", module: "lab", description: "Conduct / record lab tests" },
  { key: "lab.certify", module: "lab", description: "Approve (certify) a batch" },
  { key: "lab.reject", module: "lab", description: "Reject a batch on test failure" },
  { key: "identification.detect", module: "identification", description: "Run AI/ML herb recognition and confirm results" },
  { key: "product.create", module: "product", description: "Create a finished product / lot" },
  { key: "product.link", module: "product", description: "Link source batches to a lot" },
  { key: "product.qr", module: "product", description: "Generate lot QRs" },
  { key: "product.sell", module: "product", description: "Record retail sale (POS)" },
  { key: "shipment.manage", module: "shipment", description: "Create / update shipments" },
  { key: "shipment.assign", module: "shipment", description: "Assign a transporter / accept a job" },
  { key: "procurement.view", module: "procurement", description: "View certified batches / inventory / analytics" },
  { key: "procurement.request", module: "procurement", description: "Request a batch quantity (manufacturer)" },
  { key: "procurement.approve", module: "procurement", description: "Approve / reject / partially approve requests (holder)" },
  { key: "procurement.receive", module: "procurement", description: "Receive a shipment + record GRN" },
  { key: "procurement.inventory", module: "procurement", description: "Manage inventory (reserve / consume / hold)" },
  { key: "admin.users.manage", module: "admin", description: "Verify / suspend / re-role users" },
  { key: "admin.users.view", module: "admin", description: "View user dossiers & verification queue" },
  { key: "admin.audit.view", module: "admin", description: "Read audit logs" },
  { key: "admin.trace.view", module: "admin", description: "Trace any batch/product (AYUSH oversight)" },
  { key: "admin.analytics.view", module: "admin", description: "Read analytics dashboards" },
  { key: "verify.analytics.view", module: "verify", description: "Read consumer scan analytics & counterfeit alerts" },
  { key: "blockchain.view", module: "blockchain", description: "Read permissioned-chain receipts & verify anchors" },
  { key: "blockchain.manage", module: "blockchain", description: "Run the worker, requeue failures, manage nodes/contracts" },
  // phase 13 — AYUSH regulatory monitoring portal
  { key: "labs.audit", module: "admin", description: "Read lab monitoring metrics, failure rates & audit history" },
  { key: "manufacturers.audit", module: "admin", description: "Read manufacturer monitoring (products, intake, recalls)" },
  { key: "shipments.view", module: "admin", description: "Read all shipments + risk alerts (AYUSH oversight)" },
  { key: "certificates.review", module: "admin", description: "Read failed certifications & certificate reviews" },
  { key: "compliance.manage", module: "admin", description: "Manage compliance alerts, recalls, investigations & scores" },
  { key: "reports.export", module: "admin", description: "Generate / export regulatory reports" },
  { key: "admin.search", module: "admin", description: "Universal cross-entity search (batches, products, users, shipments, certificates)" },
  // phase 14 — notifications & alerts (docs/phase_14.md)
  { key: "notifications.view", module: "notifications", description: "Read own notification inbox + preferences" },
  { key: "notifications.manage", module: "notifications", description: "Send broadcasts, run the queue worker, view delivery analytics" },
  // phase 15 — document storage (docs/phase_15.md)
  { key: "documents.upload", module: "documents", description: "Upload / version documents for accessible entities" },
  { key: "documents.view", module: "documents", description: "Read / download documents they are a party to" },
  { key: "documents.share", module: "documents", description: "Create PUBLIC shares of safe documents" },
  { key: "documents.manage", module: "documents", description: "Run retention/archive, purge, view all documents + access logs" },
];

const GRANTS = {
  consumer: ["profile.self", "trace.resolve", "documents.view"],
  farmer: ["profile.self", "trace.resolve", "identification.detect", "batch.create", "batch.view", "batch.transfer", "documents.upload", "documents.view", "documents.share"],
  transporter: ["profile.self", "trace.resolve", "batch.view", "batch.transfer", "shipment.manage", "shipment.assign", "documents.upload", "documents.view"],
  lab: ["profile.self", "trace.resolve", "batch.view", "batch.request", "batch.receive", "lab.test", "lab.certify", "lab.reject", "procurement.approve", "blockchain.view", "documents.upload", "documents.view", "documents.share"],
  manufacturer: ["profile.self", "trace.resolve", "batch.view", "batch.request", "batch.receive", "product.create", "product.link", "product.qr", "shipment.manage", "procurement.view", "procurement.request", "procurement.receive", "procurement.inventory", "verify.analytics.view", "blockchain.view", "documents.upload", "documents.view", "documents.share"],
  distributor: ["profile.self", "trace.resolve", "product.create", "product.link", "product.qr", "product.sell", "shipment.manage", "documents.upload", "documents.view"],
  retailer: ["profile.self", "trace.resolve", "product.sell", "shipment.manage", "documents.upload", "documents.view"],
  admin: ["admin.users.manage", "admin.users.view", "admin.audit.view", "admin.trace.view", "admin.analytics.view", "verify.analytics.view", "blockchain.view", "blockchain.manage", "labs.audit", "manufacturers.audit", "shipments.view", "certificates.review", "compliance.manage", "reports.export", "admin.search", "notifications.view", "notifications.manage", "documents.upload", "documents.view", "documents.share", "documents.manage"],
};


// Every authenticated user can manage their own inbox (phase 14) — the
// notifications.view grant is granted to all roles via SELF grants below.
const SELF_GRANTS = ["notifications.view"];

/** Idempotent: upserts the catalog and grants (called by seed/bootstrap). */
async function seedRbac(tx = prisma) {
  let created = 0;
  for (const p of PERMISSIONS) {
    await tx.permission.upsert({
      where: { key: p.key },
      update: { module: p.module, description: p.description, is_active: true },
      create: { key: p.key, module: p.module, description: p.description },
    });
  }
  for (const [role, keys] of Object.entries(GRANTS)) {
    for (const key of keys) {
      const permission = await tx.permission.findUnique({ where: { key } });
      if (!permission) continue;
      await tx.rolePermission.upsert({
        where: { role_permission_id: { role, permission_id: permission.id } },
        update: {},
        create: { role, permission_id: permission.id },
      });
      created += 1;
    }
  }
  // Phase 14: every authenticated role gets its own inbox (notifications.view).
  for (const role of Object.keys(GRANTS)) {
    for (const key of SELF_GRANTS) {
      const permission = await tx.permission.findUnique({ where: { key } });
      if (!permission) continue;
      await tx.rolePermission.upsert({
        where: { role_permission_id: { role, permission_id: permission.id } },
        update: {},
        create: { role, permission_id: permission.id },
      });
      created += 1;
    }
  }
  return { permissions: PERMISSIONS.length, grants: created };
}

module.exports = { PERMISSIONS, GRANTS, SELF_GRANTS, seedRbac };
