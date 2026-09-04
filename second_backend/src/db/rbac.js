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
  { key: "admin.users.manage", module: "admin", description: "Verify / suspend / re-role users" },
  { key: "admin.users.view", module: "admin", description: "View user dossiers & verification queue" },
  { key: "admin.audit.view", module: "admin", description: "Read audit logs" },
  { key: "admin.trace.view", module: "admin", description: "Trace any batch/product (AYUSH oversight)" },
  { key: "admin.analytics.view", module: "admin", description: "Read analytics dashboards" },
];

const GRANTS = {
  consumer: ["profile.self", "trace.resolve"],
  farmer: ["profile.self", "trace.resolve", "identification.detect", "batch.create", "batch.view", "batch.transfer"],
  transporter: ["profile.self", "trace.resolve", "batch.view", "batch.transfer", "shipment.manage", "shipment.assign"],
  lab: ["profile.self", "trace.resolve", "batch.view", "batch.request", "batch.receive", "lab.test", "lab.certify", "lab.reject"],
  manufacturer: ["profile.self", "trace.resolve", "batch.view", "batch.request", "batch.receive", "product.create", "product.link", "product.qr", "shipment.manage"],
  distributor: ["profile.self", "trace.resolve", "product.create", "product.link", "product.qr", "product.sell", "shipment.manage"],
  retailer: ["profile.self", "trace.resolve", "product.sell", "shipment.manage"],
  admin: ["admin.users.manage", "admin.users.view", "admin.audit.view", "admin.trace.view", "admin.analytics.view"],
};

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
  return { permissions: PERMISSIONS.length, grants: created };
}

module.exports = { PERMISSIONS, GRANTS, seedRbac };
