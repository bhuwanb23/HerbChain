/**
 * Phase 8 laboratory certification tests (docs/phase_8.md).
 *
 * Verifies on an isolated DB:
 *  - intake: receive checklist + conditions, double-receive guard, refuse-at-
 *    intake rejection
 *  - samples: multiple samples per batch, codes, state guards
 *  - tests/results: multi-parameter results, edits until submit, outcome is
 *    results-driven (any FAIL -> fail)
 *  - two-level review: analyst cannot review/certify; supervisor
 *    approves / sends back for rework / rejects
 *  - certification: requires an approved PASS test; hashed COA; batch marked
 *    certified; BatchEvent + blockchain anchors; species verification;
 *    identity-conflict refusal (must reject as species_mismatch)
 *  - rejection: record + actions + species-mismatch alert path
 *  - read scoping + lab dashboard + analytics
 */
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { setupDb } = require("./_db");

const db = setupDb();
const { prisma } = require("../../src/db/client");
const { seedRbac } = require("../../src/db/rbac");
const { hashPassword } = require("../../src/services/passwords");
const { createApp } = require("../../src/app");

let app;

async function makeUser(email, role, { verified = false, labRole = null } = {}) {
  const user = await prisma.user.create({
    data: {
      name: role,
      email,
      password_hash: hashPassword("password1"),
      role,
      lab_role: labRole,
      kyc_status: verified ? "verified" : "pending",
      is_active: true,
    },
  });
  const login = await request(app).post("/api/v1/auth/login").send({ identifier: email, password: "password1" });
  return { user, token: login.body.data.access_token };
}

async function uploadAsset(token) {
  const up = await request(app)
    .post("/api/v1/uploads")
    .set("Authorization", `Bearer ${token}`)
    .attach("file", Buffer.from("fake-image-bytes"), { filename: "h.jpg", contentType: "image/jpeg" });
  assert.equal(up.status, 201, JSON.stringify(up.body));
  return up.body.data.asset;
}

async function createBatch(farmerToken, speciesCode = "ashwagandha") {
  const asset = await uploadAsset(farmerToken);
  const res = await request(app)
    .post("/api/v1/batches")
    .set("Authorization", `Bearer ${farmerToken}`)
    .send({
      species_code: speciesCode,
      quantity: 50,
      unit: "kg",
      harvest_date: "2026-09-04",
      cultivation_type: "organic",
      gps_lat: 10.1234,
      gps_lng: 78.1234,
      asset_ids: [asset.id],
    });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body.data.batch;
}

async function tokenOf(batchId, holderToken) {
  const res = await request(app).get(`/api/v1/batches/${batchId}/qr`).set("Authorization", `Bearer ${holderToken}`);
  assert.equal(res.status, 200, JSON.stringify(res.body));
  return res.body.data.qr.url.split("/qr/")[1];
}

// Governed custody hops (Phase 6 API) — move a farmer batch into the lab.
async function moveToLab(batchId) {
  const r1 = await request(app).post("/api/v1/transfers/request").set("Authorization", `Bearer ${transporter.token}`).send({ batch_id: batchId });
  assert.equal(r1.status, 201, JSON.stringify(r1.body));
  const a1 = await request(app).post("/api/v1/transfers/approve").set("Authorization", `Bearer ${farmer.token}`).send({ request_id: r1.body.data.request.id });
  assert.equal(a1.status, 200);
  const e1 = await request(app).post("/api/v1/transfers/execute").set("Authorization", `Bearer ${transporter.token}`).send({ token: await tokenOf(batchId, farmer.token) });
  assert.equal(e1.status, 200, JSON.stringify(e1.body));

  const r2 = await request(app).post("/api/v1/transfers/request").set("Authorization", `Bearer ${lab.token}`).send({ batch_id: batchId });
  assert.equal(r2.status, 201, JSON.stringify(r2.body));
  const a2 = await request(app).post("/api/v1/transfers/approve").set("Authorization", `Bearer ${transporter.token}`).send({ request_id: r2.body.data.request.id });
  assert.equal(a2.status, 200);
  const e2 = await request(app).post("/api/v1/transfers/execute").set("Authorization", `Bearer ${lab.token}`).send({ token: await tokenOf(batchId, transporter.token) });
  assert.equal(e2.status, 200, JSON.stringify(e2.body));
}

// HTTP helpers
const receive = (token, body) => request(app).post("/api/v1/labs/batches/receive").set("Authorization", `Bearer ${token}`).send(body);
const samples = (token, body) => request(app).post("/api/v1/labs/samples").set("Authorization", `Bearer ${token}`).send(body);
const tests = (token, body) => request(app).post("/api/v1/labs/tests").set("Authorization", `Bearer ${token}`).send(body);
const results = (token, testId, body) => request(app).post(`/api/v1/labs/tests/${testId}/results`).set("Authorization", `Bearer ${token}`).send(body);
const submit = (token, testId) => request(app).post(`/api/v1/labs/tests/${testId}/submit`).set("Authorization", `Bearer ${token}`).send({});
const reviews = (token, body) => request(app).post("/api/v1/labs/reviews").set("Authorization", `Bearer ${token}`).send(body);
const certify = (token, body) => request(app).post("/api/v1/labs/certificates").set("Authorization", `Bearer ${token}`).send(body);
const rejectBatch = (token, body) => request(app).post("/api/v1/labs/reject").set("Authorization", `Bearer ${token}`).send(body);
const getCertificates = (token, qs = "") => request(app).get(`/api/v1/labs/certificates${qs}`).set("Authorization", `Bearer ${token}`);
const getDossier = (token, id) => request(app).get(`/api/v1/labs/batches/${id}`).set("Authorization", `Bearer ${token}`);
const listBatches = (token, qs = "") => request(app).get(`/api/v1/labs/batches${qs}`).set("Authorization", `Bearer ${token}`);
const getTests = (token, qs = "") => request(app).get(`/api/v1/labs/tests${qs}`).set("Authorization", `Bearer ${token}`);
const getAnalytics = (token) => request(app).get("/api/v1/labs/analytics").set("Authorization", `Bearer ${token}`);

let farmer, transporter, lab, supervisor, analyst, stranger, admin;

/** Full happy-path laboratory run: receive -> sample -> 2 passing tests -> certify. */
async function runCertifiedBatch(speciesCode = "ashwagandha", over = {}) {
  const batch = await createBatch(farmer.token, speciesCode);
  await moveToLab(batch.id);
  const r = await receive(lab.token, { batch_id: batch.id, receiver_name: "Lab In-charge", received_quantity_kg: 49.8, condition_status: "good" });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const s = await samples(lab.token, { batch_id: batch.id, sample_weight_kg: 0.5, remarks: "sample A" });
  assert.equal(s.status, 201, JSON.stringify(s.body));
  const sampleId = s.body.data.sample.id;

  const t1 = await tests(lab.token, { sample_id: sampleId, test_category: "physical", test_name: "Moisture content" });
  assert.equal(t1.status, 201, JSON.stringify(t1.body));
  const t1id = t1.body.data.test.id;
  await results(lab.token, t1id, { parameter_code: "moisture", observed_value: 7.2, unit: "%", acceptable_range: "< 10", result: "pass" });
  await submit(lab.token, t1id);

  const t2 = await tests(lab.token, { sample_id: sampleId, test_category: "safety", test_name: "Heavy metals screen" });
  const t2id = t2.body.data.test.id;
  await results(lab.token, t2id, { parameter_code: "lead", observed_value: 0.4, unit: "ppm", acceptable_range: "max 0.5", result: "pass" });
  await submit(lab.token, t2id);

  const testIds = [t1id, t2id];
  if (over.identitySpecies) {
    const ti = await tests(lab.token, { sample_id: sampleId, test_category: "identity", test_name: "Species verification" });
    const tiId = ti.body.data.test.id;
    await results(lab.token, tiId, { parameter_code: "species_identity", observed_text: over.identitySpecies, result: "pass" });
    await submit(lab.token, tiId);
    testIds.push(tiId);
  }

  for (const id of testIds) {
    const rv = await reviews(supervisor.token, { test_id: id, review_status: "approved", notes: "ok" });
    assert.equal(rv.status, 200, JSON.stringify(rv.body));
  }
  const c = await certify(supervisor.token, { batch_id: batch.id });
  assert.equal(c.status, 201, JSON.stringify(c.body));
  return { batch, sampleId, certification: c.body.data.certification };
}

before(async () => {
  await seedRbac();
  await prisma.species.createMany({
    data: [
      { code: "ashwagandha", common_name: "Ashwagandha", scientific_name: "Withania somnifera", is_active: true },
      { code: "tulsi", common_name: "Tulsi", scientific_name: "Ocimum sanctum", is_active: true },
    ],
  });
  await prisma.testParameter.createMany({
    data: [
      { code: "moisture", name: "Moisture content", category: "physical", unit: "%", is_active: true },
      { code: "lead", name: "Lead (Pb)", category: "safety", unit: "ppm", is_active: true },
      { code: "total_ash", name: "Total ash", category: "purity", unit: "%", is_active: true },
      { code: "species_identity", name: "Species identity (macro/micro)", category: "identity", unit: null, is_active: true },
    ],
  });
  app = createApp();

  farmer = await makeUser("lf@x.dev", "farmer");
  transporter = await makeUser("lt@x.dev", "transporter", { verified: true });
  lab = await makeUser("ll@x.dev", "lab", { verified: true }); // holder / analyst
  supervisor = await makeUser("ls@x.dev", "lab", { verified: true, labRole: "supervisor" });
  analyst = await makeUser("la@x.dev", "lab", { verified: true, labRole: "analyst" });
  stranger = await makeUser("lx@x.dev", "lab", { verified: true });
  admin = await makeUser("ladmin@x.dev", "admin");
});

after(async () => {
  await prisma.$disconnect();
  db.cleanup();
});

// ------------------------------------------------------------------ intake

test("receive: intake checklist moves the batch into the workflow; double receive refused", async () => {
  const batch = await createBatch(farmer.token);
  // Not at the lab yet -> cannot receive.
  const early = await receive(lab.token, { batch_id: batch.id, condition_status: "good" });
  assert.equal(early.status, 409);

  await moveToLab(batch.id);
  const r = await receive(lab.token, { batch_id: batch.id, receiver_name: "Dr. Priya", received_quantity_kg: 49.5, condition_status: "good", remarks: "sealed sacks" });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal(r.body.data.receipt.condition_status, "good");
  assert.equal(r.body.data.receipt.receiver_name, "Dr. Priya");

  const batchRow = await prisma.batch.findUnique({ where: { id: batch.id } });
  assert.equal(batchRow.test_status, "received_by_lab");

  const again = await receive(lab.token, { batch_id: batch.id, condition_status: "good" });
  assert.equal(again.status, 409);

  const events = await prisma.batchEvent.findMany({ where: { batch_id: batch.id, event_type: "LAB_RECEIVED" } });
  assert.equal(events.length, 1);
  const anchored = await prisma.blockchainEvent.findFirst({ where: { entity_id: events[0].id, anchor_code: "RECEIVED" } });
  assert.ok(anchored);
});

test("intake refused at the door (condition rejected) rejects the batch with a return action", async () => {
  const batch = await createBatch(farmer.token);
  await moveToLab(batch.id);
  const r = await receive(lab.token, { batch_id: batch.id, condition_status: "rejected", remarks: "bags soaked, mould visible" });
  assert.equal(r.status, 201, JSON.stringify(r.body));

  const batchRow = await prisma.batch.findUnique({ where: { id: batch.id } });
  assert.equal(batchRow.test_status, "rejected");
  const rec = await prisma.rejectionRecord.findUnique({ where: { batch_id: batch.id } });
  assert.ok(rec);
  assert.equal(rec.action, "return_to_supplier");

  // Non-lab accounts cannot receive.
  const strangerReceive = await receive(farmer.token, { batch_id: batch.id });
  assert.equal(strangerReceive.status, 403);
});

// ------------------------------------------------------------------ samples

test("samples: multiple samples per batch; state guards; SAMP codes", async () => {
  const batch = await createBatch(farmer.token);
  await moveToLab(batch.id);

  // Sample before the intake checklist is refused.
  const earlySample = await samples(lab.token, { batch_id: batch.id, sample_weight_kg: 0.5 });
  assert.equal(earlySample.status, 409);
  assert.equal(earlySample.body.error.code, "invalid_state");

  await receive(lab.token, { batch_id: batch.id });
  const s1 = await samples(lab.token, { batch_id: batch.id, sample_weight_kg: 0.25, remarks: "sample A" });
  assert.equal(s1.status, 201, JSON.stringify(s1.body));
  const s2 = await samples(lab.token, { batch_id: batch.id, sample_weight_kg: 0.25, remarks: "sample B" });
  assert.equal(s2.status, 201, JSON.stringify(s2.body));
  assert.match(s1.body.data.sample.sample_code, /^SAMP-2026-\d{6}$/);

  const batchRow = await prisma.batch.findUnique({ where: { id: batch.id } });
  assert.equal(batchRow.test_status, "sample_created");
  const count = await prisma.sampleRecord.count({ where: { batch_id: batch.id } });
  assert.equal(count, 2);

  const list = await getTests(lab.token); // smoke: list endpoints respond
  assert.equal(list.status, 200);
});

// ------------------------------------------------------------ tests/results

test("tests + results: multi-parameter, results-driven outcome, edits before submit only", async () => {
  const batch = await createBatch(farmer.token);
  await moveToLab(batch.id);
  await receive(lab.token, { batch_id: batch.id });
  const s = await samples(lab.token, { batch_id: batch.id, sample_weight_kg: 0.5 });
  const sampleId = s.body.data.sample.id;

  // Bad category + stranger account refused.
  const bad = await tests(lab.token, { sample_id: sampleId, test_category: "not-a-category" });
  assert.equal(bad.status, 400);
  const strangerTest = await tests(analyst.token, { sample_id: sampleId, test_category: "purity" });
  assert.equal(strangerTest.status, 403); // analyst doesn't hold the batch

  const t = await tests(lab.token, { sample_id: sampleId, test_category: "purity", test_name: "Purity — foreign matter", test_method: "Manual" });
  assert.equal(t.status, 201, JSON.stringify(t.body));
  const testId = t.body.data.test.id;
  assert.equal(t.body.data.test.status, "in_progress");

  // Two parameters on one test.
  const p1 = await results(lab.token, testId, { parameter_code: "total_ash", observed_value: 4.2, unit: "%", acceptable_range: "< 5", result: "pass" });
  assert.equal(p1.status, 201, JSON.stringify(p1.body));
  const p2 = await results(lab.token, testId, { parameter_code: "moisture", observed_value: 7.2, result: "fail", notes: "above limit" });
  assert.equal(p2.status, 201, JSON.stringify(p2.body));

  // Unknown parameter + bad verdict refused.
  const badParam = await results(lab.token, testId, { parameter_code: "nope", observed_value: 1, result: "pass" });
  assert.equal(badParam.status, 400);
  const badVerdict = await results(lab.token, testId, { parameter_code: "total_ash", observed_value: 1, result: "maybe" });
  assert.equal(badVerdict.status, 400);

  // Outcome is results-driven: one FAIL parameter -> test outcome fail.
  const sub = await submit(lab.token, testId);
  assert.equal(sub.status, 200, JSON.stringify(sub.body));
  assert.equal(sub.body.data.test.status, "completed");
  assert.equal(sub.body.data.test.outcome, "fail");

  // Results can't be edited after submit.
  const locked = await results(lab.token, testId, { parameter_code: "moisture", observed_value: 7.2, result: "pass" });
  assert.equal(locked.status, 409);
});

test("submit requires at least one recorded parameter", async () => {
  const batch = await createBatch(farmer.token);
  await moveToLab(batch.id);
  await receive(lab.token, { batch_id: batch.id });
  const s = await samples(lab.token, { batch_id: batch.id });
  const t = await tests(lab.token, { sample_id: s.body.data.sample.id, test_category: "chemical" });
  const empty = await submit(lab.token, t.body.data.test.id);
  assert.equal(empty.status, 400);
});

// ------------------------------------------------------- two-level review

test("two-level review: analyst cannot review/certify; supervisor approves or sends back for rework", async () => {
  const batch = await createBatch(farmer.token);
  await moveToLab(batch.id);
  await receive(lab.token, { batch_id: batch.id });
  const s = await samples(lab.token, { batch_id: batch.id });
  const sampleId = s.body.data.sample.id;

  const t1 = await tests(lab.token, { sample_id: sampleId, test_category: "physical", test_name: "Moisture" });
  const t1id = t1.body.data.test.id;
  await results(lab.token, t1id, { parameter_code: "moisture", observed_value: 7.2, result: "pass" });
  await submit(lab.token, t1id);

  // Analyst (holder's role) cannot review.
  const analystReview = await reviews(analyst.token, { test_id: t1id, review_status: "approved" });
  assert.equal(analystReview.status, 403);
  const analystCert = await certify(analyst.token, { batch_id: batch.id });
  assert.equal(analystCert.status, 403);

  // Supervisor sends back for rework -> test reopens.
  const rework = await reviews(supervisor.token, { test_id: t1id, review_status: "rework_required", notes: "re-run moisture" });
  assert.equal(rework.status, 200, JSON.stringify(rework.body));
  assert.equal(rework.body.data.test.status, "in_progress");

  // Analyst fixes the value and resubmits; supervisor approves.
  await results(lab.token, t1id, { parameter_code: "moisture", observed_value: 7.1, result: "pass" });
  const sub2 = await submit(lab.token, t1id);
  assert.equal(sub2.body.data.test.outcome, "pass");
  const ok = await reviews(supervisor.token, { test_id: t1id, review_status: "approved" });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.equal(ok.body.data.test.status, "completed");

  // Already approved -> cannot approve twice.
  const twice = await reviews(supervisor.token, { test_id: t1id, review_status: "approved" });
  assert.equal(twice.status, 409);
});

// ---------------------------------------------------------------- certify

test("certification: guarded by approved PASS tests; COA hash + events + blockchain + species log", async () => {
  const { batch } = await runCertifiedBatch("ashwagandha", { identitySpecies: "ashwagandha" });

  const batchRow = await prisma.batch.findUnique({ where: { id: batch.id } });
  assert.equal(batchRow.test_status, "certified");

  const cert = await prisma.certification.findUnique({ where: { batch_id: batch.id } });
  assert.ok(cert);
  assert.match(cert.certificate_number, /^CERT-2026-\d{6}$/);
  assert.equal(cert.certificate_hash.length, 64);
  assert.equal(cert.species_code, "ashwagandha");
  assert.ok(cert.expiry_date > cert.issued_at);

  // Tamper detection: hash must change when the canonical payload changes.
  const { certificateHash } = require("../../src/services/lab");
  assert.notEqual(
    certificateHash([cert.certificate_number, "HERB-X", "ashwagandha", cert.issued_by_user_id, cert.issued_at.toISOString(), "0/0", "1", "1", cert.batch_id].join("|")),
    cert.certificate_hash
  );

  const event = await prisma.batchEvent.findFirst({ where: { batch_id: batch.id, event_type: "LAB_CERTIFIED" } });
  assert.ok(event);
  const anchored = await prisma.blockchainEvent.findFirst({ where: { entity_id: event.id, anchor_code: "CERTIFIED" } });
  assert.ok(anchored);

  const verification = await prisma.speciesVerificationLog.findFirst({ where: { batch_id: batch.id } });
  assert.ok(verification);
  assert.equal(verification.farmer_species, "ashwagandha");
  assert.equal(verification.lab_species, "ashwagandha");
  assert.equal(verification.status, "match");

  // Second certification refused.
  const again = await certify(supervisor.token, { batch_id: batch.id });
  assert.equal(again.status, 409);

  // Certificate readable via API.
  const certs = await getCertificates(supervisor.token, `?batch_id=${batch.id}`);
  assert.equal(certs.status, 200);
  assert.equal(certs.body.data.certifications.length, 1);
  assert.equal(certs.body.data.certifications[0].certificate_hash, cert.certificate_hash);
});

test("certification refused without an approved test; refused when a test failed", async () => {
  const batch = await createBatch(farmer.token);
  await moveToLab(batch.id);
  await receive(lab.token, { batch_id: batch.id });
  const s = await samples(lab.token, { batch_id: batch.id });

  // No tests at all -> cannot certify.
  const none = await certify(supervisor.token, { batch_id: batch.id });
  assert.equal(none.status, 409);
  assert.match(none.body.error.message, /No tests recorded/);

  // A failing test, even reviewed, blocks certification.
  const t = await tests(lab.token, { sample_id: s.body.data.sample.id, test_category: "safety", test_name: "Lead" });
  const testId = t.body.data.test.id;
  await results(lab.token, testId, { parameter_code: "lead", observed_value: 0.9, unit: "ppm", acceptable_range: "max 0.5", result: "fail" });
  await submit(lab.token, testId);
  await reviews(supervisor.token, { test_id: testId, review_status: "approved" });

  const fail = await certify(supervisor.token, { batch_id: batch.id });
  assert.equal(fail.status, 409);
  assert.equal(fail.body.error.code, "certification_failed");
});

test("identity conflict: certifying against the farmer claim is refused — must reject as species mismatch", async () => {
  const batch = await createBatch(farmer.token, "ashwagandha"); // farmer claims ashwagandha
  await moveToLab(batch.id);
  await receive(lab.token, { batch_id: batch.id });
  const s = await samples(lab.token, { batch_id: batch.id });
  const sampleId = s.body.data.sample.id;

  // Two passing tests on claimed species + an identity test that says TULSI.
  const t1 = await tests(lab.token, { sample_id: sampleId, test_category: "physical" });
  await results(lab.token, t1.body.data.test.id, { parameter_code: "moisture", observed_value: 7.2, result: "pass" });
  await submit(lab.token, t1.body.data.test.id);
  const t2 = await tests(lab.token, { sample_id: sampleId, test_category: "safety" });
  await results(lab.token, t2.body.data.test.id, { parameter_code: "lead", observed_value: 0.4, result: "pass" });
  await submit(lab.token, t2.body.data.test.id);
  const ti = await tests(lab.token, { sample_id: sampleId, test_category: "identity", test_name: "Species verification" });
  const tiId = ti.body.data.test.id;
  await results(lab.token, tiId, { parameter_code: "species_identity", observed_text: "tulsi", result: "pass" });
  await submit(lab.token, tiId);

  for (const id of [t1.body.data.test.id, t2.body.data.test.id, tiId]) {
    const rv = await reviews(supervisor.token, { test_id: id, review_status: "approved" });
    assert.equal(rv.status, 200, JSON.stringify(rv.body));
  }
  // Certification refused: lab identity (tulsi) contradicts the claim.
  const conflict = await certify(supervisor.token, { batch_id: batch.id });
  assert.equal(conflict.status, 409);
  assert.equal(conflict.body.error.code, "species_conflict");

  // Supervisor rejects as species mismatch -> alert + rejection record.
  const rej = await rejectBatch(supervisor.token, { batch_id: batch.id, reason: "species_mismatch", description: "lab identified tulsi", action: "return_to_supplier" });
  assert.equal(rej.status, 201, JSON.stringify(rej.body));
  assert.equal(rej.body.data.rejection.reason, "species_mismatch");
  assert.equal(rej.body.data.rejection.action, "return_to_supplier");

  const row = await prisma.batch.findUnique({ where: { id: batch.id } });
  assert.equal(row.test_status, "rejected");
  const mismatchLog = await prisma.speciesVerificationLog.findFirst({ where: { batch_id: batch.id } });
  assert.equal(mismatchLog.status, "mismatch");
  assert.equal(mismatchLog.lab_species, "tulsi");
  const alert = await prisma.batchEvent.findFirst({ where: { batch_id: batch.id, event_type: "SPECIES_MISMATCH" } });
  assert.ok(alert);
});

test("rejection guards: coded reasons/actions; no double rejection; lab staff only", async () => {
  const batch = await createBatch(farmer.token);
  await moveToLab(batch.id);
  await receive(lab.token, { batch_id: batch.id });

  const badReason = await rejectBatch(supervisor.token, { batch_id: batch.id, reason: "not-a-reason" });
  assert.equal(badReason.status, 400);
  const notSupervisor = await rejectBatch(analyst.token, { batch_id: batch.id, reason: "other" });
  assert.equal(notSupervisor.status, 403);

  const r = await rejectBatch(supervisor.token, { batch_id: batch.id, reason: "heavy_metal_failure", description: "Pb 0.9 ppm", action: "destroy" });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const again = await rejectBatch(supervisor.token, { batch_id: batch.id, reason: "other" });
  assert.equal(again.status, 409);
});

// ------------------------------------------------------------- documents

test("documents: batch-level attachments by the holding lab", async () => {
  const { batch } = await runCertifiedBatch();
  const asset = await uploadAsset(lab.token);
  const d = await request(app)
    .post("/api/v1/labs/documents")
    .set("Authorization", `Bearer ${lab.token}`)
    .send({ batch_id: batch.id, document_type: "certificate", document_asset_id: asset.id });
  assert.equal(d.status, 201, JSON.stringify(d.body));
  assert.equal(d.body.data.document.document_type, "certificate");
  assert.ok(d.body.data.document.document_url);

  const strangerDoc = await request(app)
    .post("/api/v1/labs/documents")
    .set("Authorization", `Bearer ${stranger.token}`)
    .send({ batch_id: batch.id, document_type: "test_report", document_url: "https://x/report.pdf" });
  assert.equal(strangerDoc.status, 403);
  const badType = await request(app)
    .post("/api/v1/labs/documents")
    .set("Authorization", `Bearer ${lab.token}`)
    .send({ batch_id: batch.id, document_type: "invoice", document_url: "https://x/a.pdf" });
  assert.equal(badType.status, 400);
});

// ------------------------------------------------------- dashboards/reads

test("dashboard + read scoping: tabs reflect state; strangers locked out", async () => {
  const { batch } = await runCertifiedBatch();

  // Certified tab lists it for the holder lab + supervisor dossier access.
  const certified = await listBatches(lab.token, "?status=certified");
  assert.equal(certified.status, 200);
  assert.ok(certified.body.data.batches.some((b) => b.id === batch.id));

  const dossier = await getDossier(supervisor.token, batch.id);
  assert.equal(dossier.status, 200);
  assert.equal(dossier.body.data.batch.code, batch.code);
  assert.ok(dossier.body.data.batch.certifications.length === 1);
  assert.ok(dossier.body.data.batch.samples.length >= 1);

  // Stranger lab (never part of this batch) cannot open the dossier.
  const denied = await getDossier(stranger.token, batch.id);
  assert.equal(denied.status, 403);
  // Farmer can never read lab dossiers.
  const farmerDenied = await getDossier(farmer.token, batch.id);
  assert.equal(farmerDenied.status, 403);

  // A certified batch is visible downstream (manufacturer) via certificates.
  const m = await makeUser("lmfr@x.dev", "manufacturer", { verified: true });
  const certs = await getCertificates(m.token, `?batch_id=${batch.id}`);
  assert.equal(certs.status, 200);
  assert.equal(certs.body.data.certifications.length, 1);
  assert.match(certs.body.data.certifications[0].certificate_number, /^CERT-2026-\d{6}$/);
});

test("analytics: volume, pass/fail rate, top herbs, mismatch rate", async () => {
  await runCertifiedBatch("ashwagandha"); // cert batch 1
  await runCertifiedBatch("ashwagandha"); // cert batch 2
  const a = await getAnalytics(supervisor.token);
  assert.equal(a.status, 200, JSON.stringify(a.body));
  assert.ok(a.body.data.analytics.certified_batches >= 2);
  assert.ok(a.body.data.analytics.testing_volume >= 4);
  assert.equal(a.body.data.analytics.fail_rate_pct, 0);
  const top = a.body.data.analytics.top_herbs.find((h) => h.code === "ashwagandha");
  assert.ok(top && top.count >= 2);

  // Farmer has no analytics access.
  const denied = await getAnalytics(farmer.token);
  assert.equal(denied.status, 403);
});
