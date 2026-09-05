/**
 * Phase 15 documents tests (docs/phase_15.md).
 *
 * Verifies on an isolated DB: upload (validation, checksum, storage),
 * versioning (never overwrite), ACL matrix (farmer/lab/admin + PUBLIC
 * shares), integrity verify (INTACT -> tamper -> TAMPERED), listing,
 * retention rules + scan + storage jobs, certificate linking + blockchain
 * hash anchoring, and the admin overview.
 */
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { setupDb } = require("./_db");

const db = setupDb();
const { prisma } = require("../../src/db/client");
const { seedRbac } = require("../../src/db/rbac");
const { hashPassword } = require("../../src/services/passwords");
const { createApp } = require("../../src/app");
const docs = require("../../src/services/documents");
const { seedRetentionRules } = require("../../src/services/documents");

let app;

async function makeUser(email, role, { verified = false, labRole = null, adminRole = null, phone = null } = {}) {
  const user = await prisma.user.create({
    data: {
      name: role,
      email,
      phone,
      password_hash: hashPassword("password1"),
      role,
      lab_role: labRole,
      admin_role: adminRole,
      kyc_status: verified ? "verified" : "pending",
      is_active: true,
    },
  });
  const login = await request(app).post("/api/v1/auth/login").send({ identifier: email, password: "password1" });
  assert.equal(login.status, 200, JSON.stringify(login.body));
  return { user, token: login.body.data.access_token };
}

const PDF_BYTES = Buffer.from("%PDF-1.4 fake certificate body for tests");
const IMG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

let batchSeq = 0;
async function makeBatch(farmerU, speciesCode = "ashwagandha") {
  batchSeq += 1;
  const species = await prisma.species.findUnique({ where: { code: speciesCode } });
  return prisma.batch.create({
    data: {
      code: `BAT-T-2026-${String(batchSeq).padStart(4, "0")}`,
      farmer_id: farmerU.user.id,
      species_id: species.id,
      current_holder_user_id: farmerU.user.id,
      weight_kg: 20,
      phase: "with_farmer",
      harvest_date: new Date("2026-08-01"),
    },
  });
}

function uploadDoc(token, { category, entity_type = null, entity_id = null, filename = "doc.pdf", mime = "application/pdf", bytes = PDF_BYTES, document_id = null, visibility = "RESTRICTED" } = {}) {
  let req = request(app).post("/api/v1/documents/upload").set("Authorization", `Bearer ${token}`);
  req = req.field("category", category);
  if (entity_type) req = req.field("entity_type", entity_type);
  if (entity_id) req = req.field("entity_id", entity_id);
  if (document_id) req = req.field("document_id", document_id);
  req = req.field("visibility", visibility);
  return req.attach("file", bytes, { filename, contentType: mime });
}

let farmer, lab, supervisor, manufacturer, admin, otherFarmer;

before(async () => {
  await seedRbac();
  await seedRetentionRules();
  await prisma.species.createMany({
    data: [
      { code: "ashwagandha", common_name: "Ashwagandha", scientific_name: "Withania somnifera", is_active: true },
      { code: "tulsi", common_name: "Tulsi", scientific_name: "Ocimum sanctum", is_active: true },
    ],
  });
  app = createApp();
  farmer = await makeUser("df@x.dev", "farmer", { verified: true, phone: "+9198" });
  otherFarmer = await makeUser("df2@x.dev", "farmer", { verified: true });
  lab = await makeUser("dl@x.dev", "lab", { verified: true });
  supervisor = await makeUser("ds@x.dev", "lab", { verified: true, labRole: "supervisor" });
  manufacturer = await makeUser("dm@x.dev", "manufacturer", { verified: true });
  admin = await makeUser("da@x.dev", "admin", { adminRole: "super_admin" });
});

after(async () => {
  await prisma.$disconnect();
  db.cleanup();
});

// ------------------------------------------------------------ upload + integrity

test("upload: validation (mime/size), checksum + file bytes persisted", async () => {
  // Bad mime rejected.
  const bad = await uploadDoc(farmer.token, { category: "herbs", mime: "text/html", bytes: Buffer.from("<html>") });
  assert.equal(bad.status, 400, JSON.stringify(bad.body));
  // Bad category rejected.
  const badCat = await uploadDoc(farmer.token, { category: "nonsense" });
  assert.equal(badCat.status, 400);
  // Entity mismatch rejected.
  const badEntity = await uploadDoc(farmer.token, { category: "shipments", entity_type: "batch", entity_id: "b1" });
  assert.equal(badEntity.status, 400);

  const up = await uploadDoc(farmer.token, { category: "herbs", entity_type: "batch", entity_id: "batch-none", visibility: "RESTRICTED" });
  assert.equal(up.status, 201, JSON.stringify(up.body));
  const doc = up.body.data.document;
  assert.equal(doc.file_name, "doc.pdf");
  assert.equal(doc.category, "herbs");
  assert.equal(doc.file_size, PDF_BYTES.length);
  assert.equal(doc.checksum_sha256, crypto.createHash("sha256").update(PDF_BYTES).digest("hex"));
  assert.equal(doc.status, "validated");
  assert.ok(!("storage_key" in doc), "storage_key never leaks to the wire");
  assert.ok(doc.versions.length >= 1 && doc.versions[0].version === 1);
  // Bytes are on disk (not the DB).
  const raw = await prisma.document.findUnique({ where: { id: doc.id } });
  const onDisk = fs.readFileSync(path.join(require("../../src/services/storage").localDir(), raw.storage_key));
  assert.deepEqual(onDisk, PDF_BYTES);
});

test("versioning: uploading again with document_id creates v2, never overwrites v1", async () => {
  const up1 = await uploadDoc(farmer.token, { category: "herbs", entity_type: "batch", entity_id: "batch-none" });
  const docId = up1.body.data.document.id;
  const up2 = await uploadDoc(farmer.token, { category: "herbs", entity_type: "batch", entity_id: "batch-none", document_id: docId, bytes: Buffer.from("v2-bytes") });
  assert.equal(up2.status, 201, JSON.stringify(up2.body));
  const doc = up2.body.data.document;
  assert.equal(doc.checksum_sha256, crypto.createHash("sha256").update("v2-bytes").digest("hex"));
  const versions = await prisma.documentVersion.findMany({ where: { document_id: docId }, orderBy: { version: "asc" } });
  assert.equal(versions.length, 2);
  assert.equal(versions[0].version, 1);
  assert.equal(versions[1].version, 2);
  // v1 bytes still readable.
  assert.ok(fs.existsSync(path.join(require("../../src/services/storage").localDir(), versions[0].storage_key)));
});

test("verify checksum: INTACT -> tamper file -> TAMPERED", async () => {
  const up = await uploadDoc(farmer.token, { category: "herbs", entity_type: "batch", entity_id: "batch-none", filename: "t.jpg", mime: "image/jpeg", bytes: IMG_BYTES });
  const docId = up.body.data.document.id;
  const v = await request(app).get(`/api/v1/documents/${docId}/verify`).set("Authorization", `Bearer ${farmer.token}`);
  assert.equal(v.status, 200, JSON.stringify(v.body));
  assert.equal(v.body.data.status, "INTACT");
  assert.equal(v.body.data.matches, true);

  // Tamper the stored bytes directly.
  const raw = await prisma.document.findUnique({ where: { id: docId } });
  const storage = require("../../src/services/storage");
  const p = path.join(storage.localDir(), raw.storage_key);
  await fs.promises.writeFile(p, Buffer.from("tampered"));
  const v2 = await request(app).get(`/api/v1/documents/${docId}/verify`).set("Authorization", `Bearer ${farmer.token}`);
  assert.equal(v2.body.data.status, "TAMPERED");
  assert.equal(v2.body.data.matches, false);
});

// ------------------------------------------------------------ access control

test("ACL: only owner + parties + admin can download; others 403", async () => {
  const up = await uploadDoc(farmer.token, { category: "herbs", entity_type: "batch", entity_id: "batch-1", visibility: "RESTRICTED" });
  const docId = up.body.data.document.id;

  const own = await request(app).get(`/api/v1/documents/${docId}`).set("Authorization", `Bearer ${farmer.token}`);
  assert.equal(own.status, 200, JSON.stringify(own.body));
  assert.deepEqual(own.body, PDF_BYTES);

  const other = await request(app).get(`/api/v1/documents/${docId}`).set("Authorization", `Bearer ${otherFarmer.token}`);
  assert.equal(other.status, 403, JSON.stringify(other.body));

  const adm = await request(app).get(`/api/v1/documents/${docId}`).set("Authorization", `Bearer ${admin.token}`);
  assert.equal(adm.status, 200);

  // Unauthenticated cannot read a RESTRICTED doc.
  const anon = await request(app).get(`/api/v1/documents/${docId}`);
  assert.equal(anon.status, 401);
});

test("entity parties can read: lab cert doc downloadable by the batch farmer + lab", async () => {
  const batch = await makeBatch(farmer);
  const cert = await prisma.certification.create({
    data: {
      certificate_number: "CERT-2026-000111",
      batch_id: batch.id,
      lab_user_id: lab.user.id,
      lab_code: "LAB-1",
      lab_name: "Test Lab",
      species_id: batch.species_id,
      species_code: "ashwagandha",
      certificate_hash: "hash1",
      issued_by_user_id: supervisor.user.id,
    },
  });
  const up = await uploadDoc(supervisor.token, { category: "certificates", entity_type: "certificate", entity_id: cert.id, visibility: "RESTRICTED" });
  const docId = up.body.data.document.id;
  // Lab supervisor (owner), the batch farmer (a party via the cert) + admin OK;
  // an unrelated manufacturer 403.
  assert.equal((await request(app).get(`/api/v1/documents/${docId}`).set("Authorization", `Bearer ${supervisor.token}`)).status, 200);
  assert.equal((await request(app).get(`/api/v1/documents/${docId}`).set("Authorization", `Bearer ${farmer.token}`)).status, 200);
  assert.equal((await request(app).get(`/api/v1/documents/${docId}`).set("Authorization", `Bearer ${admin.token}`)).status, 200);
  assert.equal((await request(app).get(`/api/v1/documents/${docId}`).set("Authorization", `Bearer ${manufacturer.token}`)).status, 403);
  await prisma.certification.delete({ where: { id: cert.id } });
  await prisma.batch.deleteMany({ where: { id: batch.id } });
});

// ------------------------------------------------------------ public shares

test("PUBLIC document + share code -> consumer (no auth) can download; revoke blocks", async () => {
  const up = await uploadDoc(lab.token, { category: "certificates", entity_type: "certificate", entity_id: "cert-x", visibility: "PUBLIC", filename: "coa.pdf" });
  const docId = up.body.data.document.id;
  const sh = await request(app).post(`/api/v1/documents/${docId}/shares`).set("Authorization", `Bearer ${lab.token}`).send({});
  assert.equal(sh.status, 201, JSON.stringify(sh.body));
  const code = sh.body.data.share.share_code;
  assert.ok(code.length >= 6);

  const pub = await request(app).get(`/api/v1/documents/shares/${code}`);
  assert.equal(pub.status, 200, JSON.stringify(pub.body));
  assert.equal(pub.headers["x-document-no"], up.body.data.document.document_no);
  assert.deepEqual(pub.body, PDF_BYTES);

  // Revoke -> 403 on the public code.
  const rev = await request(app).delete(`/api/v1/documents/${docId}/shares/${sh.body.data.share.id}`).set("Authorization", `Bearer ${lab.token}`);
  assert.equal(rev.status, 200, JSON.stringify(rev.body));
  const after = await request(app).get(`/api/v1/documents/shares/${code}`);
  assert.equal(after.status, 403, JSON.stringify(after.body));
});

// ------------------------------------------------------------ retention + jobs

test("retention: rules seeded, scan queues archive jobs, worker archives", async () => {
  const rules = await prisma.documentRetentionRule.count();
  assert.equal(rules, 8);
  // Backdate an uploaded doc beyond a 1-month window (simulate by rule tweak).
  const up = await uploadDoc(farmer.token, { category: "herbs", entity_type: "batch", entity_id: "batch-rt" });
  const docId = up.body.data.document.id;
  await prisma.document.update({ where: { id: docId }, data: { uploaded_at: new Date(Date.now() - 200 * 24 * 3600 * 1000) } });
  await prisma.documentRetentionRule.update({ where: { category: "herbs" }, data: { retention_months: 3 } });

  const scan = await docs.runRetentionScan();
  assert.ok(scan.marked >= 1, JSON.stringify(scan));
  const jobs = await prisma.storageJob.findMany({ where: { kind: "archive" } });
  assert.ok(jobs.length >= 1);

  const done = await docs.processStorageJobs();
  assert.ok(done.processed >= 1);
  const archived = await prisma.document.findUnique({ where: { id: docId } });
  assert.equal(archived.status, "archived");
  await prisma.documentRetentionRule.update({ where: { category: "herbs" }, data: { retention_months: 120 } });
});

// ------------------------------------------------------------ certificate + chain

test("certificate link + blockchain anchor drains to a VALID document txn", async () => {
  const batch = await makeBatch(farmer, "tulsi");
  const cert = await prisma.certification.create({
    data: {
      certificate_number: "CERT-2026-000222",
      batch_id: batch.id,
      lab_user_id: lab.user.id,
      lab_code: "LAB-2",
      lab_name: "Test Lab 2",
      species_id: batch.species_id,
      species_code: "tulsi",
      certificate_hash: "hash2",
      issued_by_user_id: supervisor.user.id,
    },
  });
  const up = await uploadDoc(supervisor.token, { category: "certificates", entity_type: "certificate", entity_id: cert.id, visibility: "RESTRICTED", filename: "cert-222.pdf" });
  const docId = up.body.data.document.id;

  const link = await request(app)
    .post("/api/v1/documents/certificates/link")
    .set("Authorization", `Bearer ${supervisor.token}`)
    .send({ certificate_number: "CERT-2026-000222", document_id: docId });
  assert.equal(link.status, 201, JSON.stringify(link.body));
  const linked = await prisma.certificateDocument.findFirst({ where: { document_id: docId } });
  assert.equal(linked.certificate_number, "CERT-2026-000222");

  // A CERTIFICATE_UPLOADED anchor was queued — drain + verify it.
  const anchor = await prisma.blockchainEvent.findFirst({ where: { entity_type: "document", entity_id: docId } });
  assert.ok(anchor, "document anchor queued");
  assert.equal(anchor.anchor_code, "CERTIFICATE_UPLOADED");
  const { processQueue } = require("../../src/services/blockchain");
  const out = await processQueue();
  assert.ok(out.processed >= 1, JSON.stringify(out));
  const { verifyEvent } = require("../../src/services/blockchain");
  const v = await verifyEvent(anchor.id);
  assert.equal(v.verification, "VALID", JSON.stringify(v));

  await prisma.certification.delete({ where: { id: cert.id } });
  await prisma.batch.deleteMany({ where: { id: batch.id } });
  await prisma.blockchainTransaction.deleteMany({ where: { event: { entity_type: "document" } } });
  await prisma.blockchainEvent.deleteMany({ where: { entity_type: "document" } });
});

// ------------------------------------------------------------ listing + RBAC

test("listing + admin overview + RBAC gate", async () => {
  const mine = await request(app).get("/api/v1/documents").set("Authorization", `Bearer ${farmer.token}`);
  assert.equal(mine.status, 200);
  assert.ok(mine.body.data.documents.length >= 1);

  const byCat = await request(app).get("/api/v1/documents?category=herbs").set("Authorization", `Bearer ${admin.token}`);
  assert.equal(byCat.status, 200);

  const ov = await request(app).get("/api/v1/documents/admin/overview").set("Authorization", `Bearer ${admin.token}`);
  assert.equal(ov.status, 200, JSON.stringify(ov.body));
  assert.ok(ov.body.data.total >= 1);
  assert.ok(Array.isArray(ov.body.data.by_category));

  const gate = await request(app).get("/api/v1/documents/admin/overview").set("Authorization", `Bearer ${farmer.token}`);
  assert.equal(gate.status, 403);

  // metadata endpoint works for owner
  const md = await request(app).get("/api/v1/documents").set("Authorization", `Bearer ${farmer.token}`);
  const first = md.body.data.documents[0];
  const meta = await request(app).get(`/api/v1/documents/${first.id}/metadata`).set("Authorization", `Bearer ${farmer.token}`);
  assert.equal(meta.status, 200);
  assert.equal(meta.body.data.document.id, first.id);
});