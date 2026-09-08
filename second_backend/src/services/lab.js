/**
 * Laboratory certification service (docs/phase_8.md + docs/lab/architecture.md).
 *
 * Phase 8 = the scientific validation layer. The lab NEVER edits farmer data,
 * ownership history or transport history — it only ADDS laboratory records:
 *   receive (intake checklist) -> samples -> tests -> results (per-parameter)
 *   -> supervisor review -> certificate -> batch certified | rejected.
 *
 * The batch's custody `phase` stays `at_lab` through the whole process; the
 * certification substate lives on `Batch.test_status`. Role separation (spec
 * §8): analysts enter results; supervisors review + certify + reject.
 * Certification writes a hashed Certificate of Analysis (tamper detection),
 * a three-way species verification log (farmer vs AI vs lab), AiFeedback,
 * immutable BatchEvents, audit rows and a blockchain anchor.
 */
const crypto = require("node:crypto");
const { prisma } = require("../db/client");
const { ApiError } = require("../utils/errors");
const { publish } = require("./notifications"); // phase 14: publish, never send
const {
  RECEIPT_CONDITIONS,
  TEST_CATEGORIES,
  TEST_STATUSES,
  REVIEW_STATUSES,
  RESULT_VALUES,
  REJECTION_REASONS,
  REJECTION_ACTIONS,
  LAB_DOC_TYPES,
  certificationGate,
  isLabSupervisor,
  isLabStaff,
} = require("../constants/lab");
const { assertOwnedAssets } = require("./uploads");

// ------------------------------------------------------------------ helpers

/** sha256 hex of a canonical certificate payload (tamper detection). */
function certificateHash(payload) {
  return crypto.createHash("sha256").update(payload, "utf8").digest("hex");
}

async function getBatch(id) {
  const batch = await prisma.batch.findUnique({ where: { id } });
  if (!batch) throw new ApiError("not_found", "Batch not found", 404);
  return batch;
}

async function getSample(id) {
  const sample = await prisma.sampleRecord.findUnique({ where: { id } });
  if (!sample) throw new ApiError("not_found", "Sample not found", 404);
  return sample;
}

async function getTest(id, include = {}) {
  const test = await prisma.labTest.findUnique({ where: { id }, include });
  if (!test) throw new ApiError("not_found", "Lab test not found", 404);
  return test;
}

/**
 * The acting lab account must hold the batch. In this architecture a lab org
 * is one (verified) lab user, so the current holder IS the lab. Admin bypasses.
 */
function assertLabHolds(user, batch) {
  if (user.role === "admin") return;
  if (batch.current_holder_user_id !== user.id || user.role !== "lab") {
    throw new ApiError("forbidden", "Your lab does not hold this batch", 403);
  }
}

/**
 * Supervisor oversight guard for review / certify / reject (spec §8 role
 * separation). Lab orgs are one verified lab account + optionally separate
 * supervisor accounts, so a supervisor-lab may act on any batch currently
 * held by a lab — the two-level fraud barrier is the ROLE, not the account.
 */
async function assertLabOversight(user, batch) {
  if (user.role === "admin") return;
  if (user.role !== "lab" || user.lab_role !== "supervisor") {
    throw new ApiError("forbidden", "Only a lab supervisor (or admin) can perform this action", 403);
  }
  const holder = await prisma.user.findUnique({ where: { id: batch.current_holder_user_id }, select: { role: true } });
  if (!holder || holder.role !== "lab") {
    throw new ApiError("invalid_state", "The batch is not currently held by a laboratory", 409);
  }
}

async function writeEvent(tx, batchId, eventType, actorUserId, payload = {}, extra = {}) {
  return tx.batchEvent.create({
    data: {
      batch_id: batchId,
      event_type: eventType,
      actor_user_id: actorUserId,
      from_user_id: null,
      to_user_id: actorUserId,
      payload_json: payload,
      ...extra,
    },
  });
}

async function writeAudit(tx, { actorUserId, action, batchId, meta = {} }) {
  await tx.auditLog.create({
    data: { actor_user_id: actorUserId, action, target_type: "batch", target_id: batchId, meta_json: meta },
  });
}

async function anchor(tx, anchorCode, eventId) {
  await tx.blockchainEvent.create({
    data: { anchor_code: anchorCode, entity_type: "batch_event", entity_id: eventId, status: "pending" },
  });
}

/** Human codes SAMP-YYYY-000001 / CERT-YYYY-000001 — never the DB id. */
async function nextCode(tx, model, field, prefix) {
  const year = new Date().getFullYear();
  const pre = `${prefix}-${year}-`;
  const count = await tx[model].count({ where: { [field]: { startsWith: pre } } });
  return `${pre}${String(count + 1).padStart(6, "0")}`;
}

/**
 * Resolve a species by catalogue code (preferred) or exact common/scientific
 * name. SQLite has no case-insensitive filters, so identity results should
 * record species CODES (e.g. 'ashwagandha').
 */
async function resolveSpeciesRef(ref) {
  const trimmed = String(ref || "").trim();
  if (!trimmed) throw new ApiError("bad_request", "Species reference is empty", 400);
  const byCode = await prisma.species.findUnique({ where: { code: trimmed } });
  if (byCode) return byCode;
  const byName = await prisma.species.findFirst({
    where: { is_active: true, OR: [{ common_name: trimmed }, { scientific_name: trimmed }] },
  });
  if (!byName) throw new ApiError("bad_request", `Unknown species '${trimmed}'`, 400);
  return byName;
}

/** Latest confirmed AI identification for a batch (species the model suggested). */
async function aiPredictionFor(batchId) {
  return prisma.aiIdentification.findFirst({
    where: { batch_id: batchId, status: "confirmed" },
    orderBy: { confirmed_at: "desc" },
    select: { id: true, top_species_id: true, selected_species_id: true },
  });
}

/** Latest identity verdict the lab recorded on an approved identity test. */
async function labIdentityFor(batchId) {
  const identity = await prisma.labTestResult.findFirst({
    where: {
      test: { batch_id: batchId, test_category: "identity", status: "completed" },
      parameter: { category: "identity" },
      observed_text: { not: null },
    },
    orderBy: { updated_at: "desc" },
    include: { test: { select: { id: true, outcome: true } } },
  });
  return identity;
}

const SAMPLE_INCLUDE = {
  batch: { select: { id: true, code: true, species: { select: { code: true, common_name: true } }, farmer: { select: { id: true, name: true } } } },
  tests: { select: { id: true, test_name: true, test_category: true, status: true, outcome: true } },
};
const TEST_INCLUDE = {
  batch: { select: { id: true, code: true } },
  sample: { select: { id: true, sample_code: true } },
  results: { orderBy: { parameter_id: "asc" }, include: { parameter: true } },
  reviews: { orderBy: { reviewed_at: "asc" } },
};
const BATCH_DETAIL_INCLUDE = {
  species: { select: { id: true, code: true, common_name: true } },
  farmer: { select: { id: true, name: true } },
  lab_receipts: { orderBy: { received_at: "asc" } },
  samples: { orderBy: { collected_at: "asc" }, take: 50 },
  lab_tests: { orderBy: { created_at: "desc" }, take: 100 },
  certifications: { orderBy: { issued_at: "desc" } },
  rejection_records: { orderBy: { rejected_at: "desc" } },
  species_verifications: { orderBy: { verified_at: "desc" } },
};

// ------------------------------------------------------- intake (receive)

/**
 * Lab receive (spec §3): intake checklist + physical condition. Sets the
 * batch into the certification workflow (test_status = received_by_lab).
 * A 'rejected' condition refuses intake -> batch rejected (return action).
 */
async function receiveBatch(user, { batch_id, receiver_name = null, received_quantity_kg = null, condition_status = "good", remarks = null }) {
  if (!isLabStaff(user)) throw new ApiError("forbidden", "Only lab accounts can receive batches", 403);
  if (!RECEIPT_CONDITIONS.includes(condition_status)) {
    throw new ApiError("bad_request", `condition_status must be one of: ${RECEIPT_CONDITIONS.join(", ")}`, 400);
  }
  const batch = await getBatch(batch_id);
  if (batch.phase !== "at_lab") {
    throw new ApiError("invalid_state", `A '${batch.phase}' batch cannot be received at the lab`, 409);
  }
  assertLabHolds(user, batch);
  const existing = await prisma.labReceipt.findUnique({ where: { batch_id: batch.id } });
  if (existing) {
    throw new ApiError("invalid_state", "This batch has already been received (one intake record per batch)", 409);
  }

  if (condition_status === "rejected") {
    return prisma.$transaction(async (tx) => {
      const receipt = await tx.labReceipt.create({
        data: {
          batch_id: batch.id,
          lab_user_id: user.id,
          receiver_name,
          received_quantity_kg,
          condition_status,
          remarks: remarks || "refused at intake",
        },
      });
      await tx.batch.update({ where: { id: batch.id }, data: { test_status: "rejected" } });
      await tx.rejectionRecord.create({
        data: {
          batch_id: batch.id,
          reason: "other",
          description: remarks || "Cargo refused at lab intake (condition REJECTED)",
          action: "return_to_supplier",
          rejected_by_user_id: user.id,
        },
      });
      const ev = await writeEvent(tx, batch.id, "LAB_REJECTED", user.id, { reason: "other", action: "return_to_supplier", intake: true });
      await writeAudit(tx, { actorUserId: user.id, action: "BATCH_REJECTED", batchId: batch.id, meta: { reason: "other", intake: true } });
      await anchor(tx, "REJECTED", ev.id);
      return receipt;
    });
  }

  await prisma.$transaction(async (tx) => {
    const receipt = await tx.labReceipt.create({
      data: {
        batch_id: batch.id,
        lab_user_id: user.id,
        receiver_name,
        received_quantity_kg,
        condition_status,
        remarks,
      },
    });
    await tx.batch.update({ where: { id: batch.id }, data: { test_status: "received_by_lab" } });
    const ev = await writeEvent(tx, batch.id, "LAB_RECEIVED", user.id, {
      receipt_id: receipt.id,
      condition_status,
      received_quantity_kg,
    });
    await writeAudit(tx, { actorUserId: user.id, action: "BATCH_RECEIVED", batchId: batch.id, meta: { condition_status } });
    await anchor(tx, "RECEIVED", ev.id);
    return receipt;
  });
  return prisma.labReceipt.findUnique({ where: { batch_id: batch.id } });
}

// ----------------------------------------------------------------- samples

/** Create a sample drawn from a received batch (spec §4: 1 batch -> many samples). */
async function createSample(user, { batch_id, sample_weight_kg = null, remarks = null }) {
  if (!isLabStaff(user)) throw new ApiError("forbidden", "Only lab accounts can create samples", 403);
  const batch = await getBatch(batch_id);
  assertLabHolds(user, batch);
  if (!["received_by_lab", "sample_created", "under_testing"].includes(batch.test_status)) {
    throw new ApiError("invalid_state", `Samples require a received batch (currently '${batch.test_status}')`, 409);
  }
  if (sample_weight_kg != null && sample_weight_kg <= 0) {
    throw new ApiError("bad_request", "sample_weight_kg must be positive", 400);
  }

  let sample = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      sample = await prisma.$transaction(async (tx) => {
        const code = await nextCode(tx, "sampleRecord", "sample_code", "SAMP");
        const row = await tx.sampleRecord.create({
          data: { sample_code: code, batch_id: batch.id, lab_user_id: user.id, sample_weight_kg, remarks },
        });
        if (batch.test_status === "received_by_lab") {
          await tx.batch.update({ where: { id: batch.id }, data: { test_status: "sample_created" } });
        }
        const ev = await writeEvent(tx, batch.id, "SAMPLE_CREATED", user.id, { sample_code: code, sample_weight_kg });
        await writeAudit(tx, { actorUserId: user.id, action: "SAMPLE_CREATED", batchId: batch.id, meta: { sample_code: code } });
        return row;
      });
      break;
    } catch (err) {
      if (err.code !== "P2002" || attempt === 2) throw err;
    }
  }
  return prisma.sampleRecord.findUnique({ where: { id: sample.id }, include: SAMPLE_INCLUDE });
}

// -------------------------------------------------------------------- tests

/** Start a test on a sample (spec §5). Marks the batch under_testing. */
async function createTest(user, { sample_id, test_name, test_category, test_method = null, notes = null }) {
  if (!isLabStaff(user)) throw new ApiError("forbidden", "Only lab accounts can run tests", 403);
  if (!TEST_CATEGORIES.includes(test_category)) {
    throw new ApiError("bad_request", `test_category must be one of: ${TEST_CATEGORIES.join(", ")}`, 400);
  }
  const sample = await getSample(sample_id);
  const batch = await getBatch(sample.batch_id);
  assertLabHolds(user, batch);
  if (!["received_by_lab", "sample_created", "under_testing"].includes(batch.test_status)) {
    throw new ApiError("invalid_state", `Tests require a received batch (currently '${batch.test_status}')`, 409);
  }

  const test = await prisma.$transaction(async (tx) => {
    const row = await tx.labTest.create({
      data: {
        batch_id: batch.id,
        sample_id: sample.id,
        lab_user_id: user.id,
        test_name: test_name || `Lab test — ${test_category}`,
        test_category,
        test_method,
        notes,
        status: "in_progress",
        started_at: new Date(),
      },
    });
    if (batch.test_status !== "under_testing") {
      await tx.batch.update({ where: { id: batch.id }, data: { test_status: "under_testing" } });
    }
    const ev = await writeEvent(tx, batch.id, "LAB_TEST", user.id, { test_id: row.id, test_category, test_name: row.test_name });
    await writeAudit(tx, { actorUserId: user.id, action: "LAB_TEST_STARTED", batchId: batch.id, meta: { test_id: row.id } });
    return row;
  });
  return getTest(test.id, TEST_INCLUDE);
}

/**
 * Enter (or update) one measured parameter on a test (spec §6 — one row per
 * parameter; a test may hold 20+). Updates allowed until the test is
 * submitted for review.
 */
async function enterResult(user, { test_id, parameter_code, observed_value = null, observed_text = null, unit = null, acceptable_range = null, result = "na", notes = null }) {
  if (!isLabStaff(user)) throw new ApiError("forbidden", "Only lab accounts can enter results", 403);
  if (!RESULT_VALUES.includes(result)) {
    throw new ApiError("bad_request", `result must be one of: ${RESULT_VALUES.join(", ")}`, 400);
  }
  const parameter = await prisma.testParameter.findUnique({ where: { code: parameter_code } });
  if (!parameter) throw new ApiError("bad_request", `Unknown test parameter '${parameter_code}'`, 400);
  const test = await getTest(test_id, { sample: true });
  if (test.lab_user_id !== user.id && user.role !== "admin") {
    throw new ApiError("forbidden", "Only the analyst running this test can enter results", 403);
  }
  if (!["in_progress", "pending"].includes(test.status)) {
    throw new ApiError("invalid_state", `Results can only be entered while the test is in progress (currently '${test.status}')`, 409);
  }
  if (observed_value == null && observed_text == null) {
    throw new ApiError("bad_request", "Provide observed_value (numeric) or observed_text (qualitative)", 400);
  }
  const batch = await getBatch(test.batch_id);
  assertLabHolds(user, batch);

  const valueNum = observed_value != null ? Number(observed_value) : null;
  const row = await prisma.labTestResult.upsert({
    where: { test_id_parameter_id: { test_id: test.id, parameter_id: parameter.id } },
    update: {
      observed_value_numeric: valueNum,
      observed_text: observed_text ?? null,
      unit: unit || parameter.unit || null,
      acceptable_range: acceptable_range ?? parameter.limit_standard ?? null,
      result,
      notes,
    },
    create: {
      test_id: test.id,
      parameter_id: parameter.id,
      observed_value_numeric: valueNum,
      observed_text: observed_text ?? null,
      unit: unit || parameter.unit || null,
      acceptable_range: acceptable_range ?? parameter.limit_standard ?? null,
      result,
      notes,
    },
    include: { parameter: true },
  });
  return row;
}

/** Analyst submits the completed test: outcome = results-driven pass/fail. */
async function submitTest(user, { test_id }) {
  if (!isLabStaff(user)) throw new ApiError("forbidden", "Only lab accounts can submit tests", 403);
  const test = await getTest(test_id);
  if (test.lab_user_id !== user.id && user.role !== "admin") {
    throw new ApiError("forbidden", "Only the analyst running this test can submit it", 403);
  }
  if (test.status !== "in_progress") {
    throw new ApiError("invalid_state", `Only an in-progress test can be submitted (currently '${test.status}')`, 409);
  }
  const results = await prisma.labTestResult.findMany({ where: { test_id: test.id } });
  if (!results.length) {
    throw new ApiError("bad_request", "A test needs at least one recorded parameter before submission", 400);
  }
  const failed = results.some((r) => r.result === "fail");
  const outcome = failed ? "fail" : "pass";
  await prisma.$transaction(async (tx) => {
    await tx.labTest.update({
      where: { id: test.id },
      data: { status: "completed", outcome, completed_at: new Date() },
    });
    const ev = await writeEvent(tx, test.batch_id, "TEST_SUBMITTED", user.id, {
      test_id: test.id,
      outcome,
      parameters: results.length,
      failures: results.filter((r) => r.result === "fail").length,
    });
    await writeAudit(tx, { actorUserId: user.id, action: "LAB_TEST_SUBMITTED", batchId: test.batch_id, meta: { test_id: test.id, outcome } });
    void ev;
  });
  return getTest(test.id, TEST_INCLUDE);
}

/**
 * Supervisor review (spec §8 — two-level). approved locks the test result;
 * rejected marks the test failed; rework_required reopens it for the analyst.
 */
async function reviewTest(user, { test_id, review_status, notes = null }) {
  if (!isLabSupervisor(user)) {
    throw new ApiError("forbidden", "Only a lab supervisor (or admin) can review tests", 403);
  }
  if (!REVIEW_STATUSES.includes(review_status)) {
    throw new ApiError("bad_request", `review_status must be one of: ${REVIEW_STATUSES.join(", ")}`, 400);
  }
  const test = await getTest(test_id);
  const batch = await getBatch(test.batch_id);
  await assertLabOversight(user, batch);
  if (test.status !== "completed") {
    throw new ApiError("invalid_state", `Only a completed test can be reviewed (currently '${test.status}')`, 409);
  }
  const hasApproved = await prisma.labReview.findFirst({
    where: { test_id: test.id, review_status: "approved" },
    select: { id: true },
  });
  if (hasApproved) {
    throw new ApiError("invalid_state", "This test is already approved", 409);
  }

  const nextStatus = review_status === "rejected" ? "failed" : review_status === "rework_required" ? "in_progress" : "completed";
  await prisma.$transaction(async (tx) => {
    await tx.labReview.create({
      data: {
        test_id: test.id,
        reviewed_by_user_id: user.id,
        reviewer_role: user.role,
        review_status,
        review_notes: notes,
      },
    });
    const patch = { status: nextStatus };
    if (review_status === "rework_required") {
      patch.outcome = null;
      patch.started_at = new Date();
      patch.completed_at = null;
    }
    await tx.labTest.update({ where: { id: test.id }, data: patch });
    const ev = await writeEvent(tx, batch.id, "TEST_REVIEWED", user.id, { test_id: test.id, review_status });
    await writeAudit(tx, { actorUserId: user.id, action: "LAB_TEST_REVIEWED", batchId: batch.id, meta: { test_id: test.id, review_status } });
    void ev;
  });
  return getTest(test.id, TEST_INCLUDE);
}

// --------------------------------------------------------------- documents

async function attachDocument(user, { batch_id, test_id = null, document_type, document_url = null, document_asset_id = null }) {
  if (!isLabStaff(user)) throw new ApiError("forbidden", "Only lab accounts can attach documents", 403);
  if (!LAB_DOC_TYPES.includes(document_type)) {
    throw new ApiError("bad_request", `document_type must be one of: ${LAB_DOC_TYPES.join(", ")}`, 400);
  }
  const batch = await getBatch(batch_id);
  assertLabHolds(user, batch);
  if (test_id) {
    const test = await getTest(test_id);
    if (test.batch_id !== batch.id) {
      throw new ApiError("bad_request", "test_id does not belong to this batch", 400);
    }
  }
  let url = document_url;
  if (document_asset_id) {
    const [asset] = await assertOwnedAssets(user.id, [document_asset_id]);
    url = asset.url;
  }
  if (!url) throw new ApiError("bad_request", "document_url or document_asset_id is required", 400);

  return prisma.labDocument.create({
    data: {
      batch_id: batch.id,
      test_id: test_id || null,
      document_type,
      document_url: url,
      document_asset_id: document_asset_id || null,
      uploaded_by_user_id: user.id,
    },
  });
}

// ------------------------------------------------------------- certification

/**
 * Species three-way check (spec §12): farmer claim vs AI prediction (latest
 * confirmed identification) vs lab identity verdict (an identity test whose
 * observed_text names a catalogue species). farmerSpecies = Batch.species row.
 * Returns { status, farmer, aiCode, aiId, labCode }.
 */
async function verifySpecies(batchId, farmerSpecies) {
  const ai = await aiPredictionFor(batchId);
  const aiCode = ai ? (ai.selected_species_id || ai.top_species_id) : null;
  const aiSpecies = aiCode ? await prisma.species.findUnique({ where: { id: aiCode }, select: { code: true } }) : null;

  // Lab verdict: an identity test recorded as observed_text of a species code.
  const identity = await labIdentityFor(batchId);
  let labSpecies = null;
  if (identity && identity.observed_text) {
    try {
      labSpecies = await resolveSpeciesRef(identity.observed_text.trim());
    } catch {
      labSpecies = null; // non-species text on the identity row — ignore for the 3-way
    }
  }

  let status = "match";
  if (aiSpecies && aiSpecies.code !== farmerSpecies.code) status = "mismatch";
  if (labSpecies && labSpecies.code !== farmerSpecies.code) status = "mismatch";
  if (!aiSpecies && !labSpecies) status = "unverified";
  return {
    status,
    farmer: farmerSpecies.code,
    aiCode: aiSpecies ? aiSpecies.code : null,
    aiId: ai ? ai.id : null,
    labCode: labSpecies ? labSpecies.code : farmerSpecies.code,
  };
}

/** Batch certification gate — all completed tests need an approved PASS review. */
async function assertCertifiable(batch) {
  const reasons = certificationGate(batch);
  if (reasons.length) {
    throw new ApiError("invalid_state", reasons.join("; "), 409);
  }
  const tests = await prisma.labTest.findMany({
    where: { batch_id: batch.id },
    include: { reviews: { where: { review_status: "approved" }, select: { id: true } }, results: { select: { result: true } } },
  });
  if (!tests.length) throw new ApiError("invalid_state", "No tests recorded — a batch cannot be certified without laboratory tests", 409);
  const approved = tests.filter((t) => t.reviews.length > 0);
  if (!approved.length) {
    throw new ApiError("invalid_state", "No test has been reviewed and approved by a supervisor yet", 409);
  }
  const blocked = [];
  for (const t of approved) {
    if (t.outcome === "fail") blocked.push(`test '${t.test_name}' failed its parameters`);
  }
  const failedTests = tests.filter((t) => t.status === "failed");
  if (failedTests.length) blocked.push(`${failedTests.length} test(s) were rejected by review`);
  if (blocked.length) {
    throw new ApiError("certification_failed", `Batch cannot be certified: ${blocked.join("; ")}`, 409);
  }

  // Identity guard: if the lab's own identity verdict contradicts the farmer's
  // claim, the batch must be REJECTED (species_mismatch), never certified.
  const farmerSpecies = await prisma.species.findUnique({ where: { id: batch.species_id } });
  const verification = await verifySpecies(batch.id, farmerSpecies);
  if (verification.labCode !== farmerSpecies.code) {
    throw new ApiError(
      "species_conflict",
      `The lab identified '${verification.labCode}' but the batch is claimed as '${farmerSpecies.code}' — reject the batch (species_mismatch) instead of certifying`,
      409
    );
  }
  return tests;
}

/**
 * Generate the Certificate of Analysis + approve the batch (spec §9/§10).
 * One COA per batch; certificate_hash = sha256 of the canonical payload for
 * tamper detection. Writes species verification (farmer vs AI vs lab) with a
 * MISMATCH alert, AiFeedback for the recognition model, BatchEvent LAB_CERTIFIED,
 * audit and a blockchain anchor.
 */
async function certifyBatch(user, { batch_id, expiry_days = 365, certificate_url = null, digital_signature = null, notes = null }) {
  if (!isLabSupervisor(user)) {
    throw new ApiError("forbidden", "Only a lab supervisor (or admin) can certify batches", 403);
  }
  const batch = await getBatch(batch_id);
  await assertLabOversight(user, batch);
  await assertCertifiable(batch);

  const existing = await prisma.certification.findUnique({ where: { batch_id: batch.id } });
  if (existing) throw new ApiError("invalid_state", "This batch is already certified", 409);

  const species = await prisma.species.findUnique({ where: { id: batch.species_id } });
  const approvedTests = await prisma.labTest.findMany({
    where: { batch_id: batch.id, reviews: { some: { review_status: "approved" } }, outcome: "pass" },
    include: { results: true },
  });
  const results = approvedTests.flatMap((t) => t.results);
  const passCount = results.filter((r) => r.result === "pass").length;
  const failCount = results.filter((r) => r.result === "fail").length;
  const samples = await prisma.sampleRecord.count({ where: { batch_id: batch.id } });

  const verification = await verifySpecies(batch.id, species);
  const labProfile = await prisma.labProfile.findUnique({ where: { lab_id: user.id } });

  let cert = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      cert = await prisma.$transaction(async (tx) => {
        const certificate_number = await nextCode(tx, "certification", "certificate_number", "CERT");
        const issuedAt = new Date();
        const expiryDate = expiry_days ? new Date(issuedAt.getTime() + expiry_days * 86400000) : null;
        const hashPayload = [
          certificate_number,
          batch.code,
          species.code,
          user.id,
          issuedAt.toISOString(),
          `${passCount}/${failCount}`,
          `${approvedTests.length}`,
          `${samples}`,
          batch.current_holder_user_id,
        ].join("|");

        const row = await tx.certification.create({
          data: {
            certificate_number,
            batch_id: batch.id,
            lab_user_id: user.id,
            lab_code: labProfile?.lab_code || null,
            lab_name: labProfile?.lab_name || user.name,
            species_id: species.id,
            species_code: species.code,
            sample_count: samples,
            test_count: approvedTests.length,
            parameter_count: results.length,
            pass_count: passCount,
            fail_count: failCount,
            test_summary_json: {
              tests: approvedTests.map((t) => ({ id: t.id, name: t.test_name, category: t.test_category, outcome: t.outcome })),
            },
            certificate_url,
            certificate_hash: certificateHash(hashPayload),
            issued_by_user_id: user.id,
            signed_by_user_id: user.id,
            digital_signature: digital_signature || null,
            issued_at: issuedAt,
            expiry_date: expiryDate,
            notes,
          },
        });

        await tx.batch.update({ where: { id: batch.id }, data: { test_status: "certified" } });

        // Species verification log (farmer vs AI vs lab) + mismatch alert.
        await tx.speciesVerificationLog.create({
          data: {
            batch_id: batch.id,
            farmer_species_id: species.id,
            farmer_species: species.code,
            ai_prediction_id: verification.aiId,
            ai_prediction_code: verification.aiCode,
            lab_species_id: species.id,
            lab_species: verification.labCode,
            status: verification.status,
          },
        });
        const certEvent = await writeEvent(tx, batch.id, "LAB_CERTIFIED", user.id, {
          certificate_number,
          species: verification.labCode,
          pass_count: passCount,
          fail_count: failCount,
          tests: approvedTests.length,
          mismatch: verification.status,
        });
        if (verification.status === "mismatch") {
          await writeEvent(tx, batch.id, "SPECIES_MISMATCH", user.id, {
            farmer_species: species.code,
            ai_species: verification.aiCode,
            lab_species: verification.labCode,
            certificate_number,
          });
          await writeAudit(tx, {
            actorUserId: user.id,
            action: "SPECIES_MISMATCH_ALERT",
            batchId: batch.id,
            meta: { farmer: species.code, ai: verification.aiCode, lab: verification.labCode },
          });
        }

        // AiFeedback — predicted vs certified species (recognition model audit).
        if (verification.aiId) {
          const predicted = await tx.aiIdentification.findUnique({
            where: { id: verification.aiId },
            select: { top_species_id: true, selected_species_id: true },
          });
          const predictedId = predicted.selected_species_id || predicted.top_species_id;
          await tx.aiFeedback.create({
            data: {
              identification_id: verification.aiId,
              batch_id: batch.id,
              predicted_species_id: predictedId,
              lab_species_id: species.id,
              match: predictedId === species.id ? "correct" : "incorrect",
            },
          });
        }

        await writeAudit(tx, { actorUserId: user.id, action: "BATCH_CERTIFIED", batchId: batch.id, meta: { certificate_number } });
        await anchor(tx, "CERTIFIED", certEvent.id);

        // Phase 14: certificate issued — farmer + manufacturer (the batch
        // holder chain) + every AYUSH admin (in-app alert).
        const admins = await tx.user.findMany({ where: { role: "admin" }, select: { id: true } });
        const targets = new Set([batch.farmer_id, batch.current_holder_user_id].filter(Boolean));
        for (const uid of targets) {
          await publish(tx, {
            code: "certificate_issued",
            recipientUserId: uid,
            data: {
              code: batch.code,
              certificateNumber: certificate_number,
              lab: labProfile?.lab_name || user.name,
              entity: { type: "certificate", id: row.id },
            },
          });
        }
        for (const a of admins) {
          await publish(tx, {
            code: "certificate_issued",
            recipientUserId: a.id,
            data: {
              code: batch.code,
              certificateNumber: certificate_number,
              lab: labProfile?.lab_name || user.name,
              entity: { type: "certificate", id: row.id },
            },
          });
        }
        return row;
      });
      break;
    } catch (err) {
      if (err.code !== "P2002" || attempt === 2) throw err;
    }
  }
  return prisma.certification.findUnique({
    where: { id: cert.id },
    include: { batch: { select: { id: true, code: true, test_status: true } } },
  });
}

/** Reject the batch (spec §11): rejection record + REJECTED + anchors. */
async function rejectBatch(user, { batch_id, reason, description = null, action = "hold_for_investigation" }) {
  if (!isLabSupervisor(user)) {
    throw new ApiError("forbidden", "Only a lab supervisor (or admin) can reject batches", 403);
  }
  if (!REJECTION_REASONS.includes(reason)) {
    throw new ApiError("bad_request", `reason must be one of: ${REJECTION_REASONS.join(", ")}`, 400);
  }
  if (!REJECTION_ACTIONS.includes(action)) {
    throw new ApiError("bad_request", `action must be one of: ${REJECTION_ACTIONS.join(", ")}`, 400);
  }
  const batch = await getBatch(batch_id);
  await assertLabOversight(user, batch);
  if (["certified", "rejected"].includes(batch.test_status)) {
    throw new ApiError("invalid_state", `The batch is already '${batch.test_status}'`, 409);
  }
  const existing = await prisma.rejectionRecord.findUnique({ where: { batch_id: batch.id } });
  if (existing) throw new ApiError("invalid_state", "A rejection record already exists for this batch", 409);

  // Species mismatch rejection writes the 3-way alert too.
  const species = await prisma.species.findUnique({ where: { id: batch.species_id } });
  const verification = reason === "species_mismatch" ? await verifySpecies(batch.id, species) : { status: "match", aiCode: null, aiId: null, labCode: species.code };

  await prisma.$transaction(async (tx) => {
    const record = await tx.rejectionRecord.create({
      data: {
        batch_id: batch.id,
        reason,
        description: description || null,
        action,
        rejected_by_user_id: user.id,
      },
    });
    await tx.batch.update({ where: { id: batch.id }, data: { test_status: "rejected" } });
    if (reason === "species_mismatch") {
      await tx.speciesVerificationLog.create({
        data: {
          batch_id: batch.id,
          farmer_species_id: species.id,
          farmer_species: species.code,
          ai_prediction_id: verification.aiId,
          ai_prediction_code: verification.aiCode,
          lab_species_id: species.id,
          lab_species: verification.labCode,
          status: "mismatch",
        },
      });
      await writeEvent(tx, batch.id, "SPECIES_MISMATCH", user.id, {
        farmer_species: species.code,
        ai_species: verification.aiCode,
        lab_species: verification.labCode,
        rejection_id: record.id,
      });
    }
    const ev = await writeEvent(tx, batch.id, "LAB_REJECTED", user.id, { reason, action, description });
    await writeAudit(tx, { actorUserId: user.id, action: "BATCH_REJECTED", batchId: batch.id, meta: { reason, action } });
    await anchor(tx, "REJECTED", ev.id);

    // Phase 14: batch rejected — farmer + AYUSH admins (critical-ish notice).
    const reasonLabel = String(reason || "other").replace(/_/g, " ");
    const admins = await tx.user.findMany({ where: { role: "admin" }, select: { id: true } });
    const targets = new Set([batch.farmer_id, batch.current_holder_user_id].filter(Boolean));
    for (const uid of targets) {
      await publish(tx, {
        code: "batch_rejected",
        recipientUserId: uid,
        data: { code: batch.code, reason: reasonLabel, entity: { type: "batch", id: batch.id } },
      });
    }
    for (const a of admins) {
      await publish(tx, {
        code: "batch_rejected",
        recipientUserId: a.id,
        data: { code: batch.code, reason: reasonLabel, entity: { type: "batch", id: batch.id } },
      });
    }
  });
  return prisma.rejectionRecord.findUnique({
    where: { batch_id: batch.id },
    include: { batch: { select: { id: true, code: true, test_status: true } } },
  });
}

// ---------------------------------------------------------------- analytics

/** Lab analytics (spec §14): volume, pass/fail rate, top herbs, cert time. */
async function analytics(user, { lab_user_id = null } = {}) {
  if (user.role === "admin") {
    // global oversight scope (default) or a specific lab
  } else if (user.role === "lab") {
    lab_user_id = user.id;
  } else {
    throw new ApiError("forbidden", "Analytics are for lab accounts and AYUSH admins", 403);
  }
  const certWhere = lab_user_id ? { lab_user_id } : {};

  // The lab's own batch set = batches it certified or rejected (its dossier).
  // Test/verification counts scope through that set, not through individual
  // account ids — analysts and supervisors are accounts of the same lab org.
  const ownCert = lab_user_id ? await prisma.certification.findMany({ where: certWhere, select: { batch_id: true } }) : [];
  const ownRej = lab_user_id ? await prisma.rejectionRecord.findMany({ where: { rejected_by_user_id: lab_user_id }, select: { batch_id: true } }) : [];
  const ownBatchIds = lab_user_id ? [...new Set([...ownCert.map((c) => c.batch_id), ...ownRej.map((r) => r.batch_id)])] : null;
  const scoped = ownBatchIds ? { batch_id: { in: ownBatchIds } } : {};

  const [certifications, approvedTests, failedTests, mismatches, volume] = await Promise.all([
    prisma.certification.findMany({ where: certWhere, include: { batch: { select: { created_at: true, species: { select: { code: true, common_name: true } } } } } }),
    prisma.labTest.count({ where: { outcome: "pass", ...scoped } }),
    prisma.labTest.count({ where: { outcome: "fail", ...scoped } }),
    prisma.speciesVerificationLog.count({ where: { status: "mismatch", ...scoped } }),
    prisma.labTest.count({ where: scoped }),
  ]);
  const rejectedBatches = ownRej.length;

  const totalDecided = approvedTests + failedTests;
  const passRate = totalDecided ? Math.round((approvedTests / totalDecided) * 1000) / 10 : 0;
  const failRate = totalDecided ? Math.round((failedTests / totalDecided) * 1000) / 10 : 0;

  // Average certification time = certified_at - batch created_at (hours).
  const certTimeMs = certifications
    .map((c) => c.issued_at.getTime() - c.batch.created_at.getTime())
    .filter((d) => d > 0);
  const avgCertHours = certTimeMs.length ? Math.round((certTimeMs.reduce((a, b) => a + b, 0) / certTimeMs.length / 3600000) * 10) / 10 : null;

  const bySpecies = {};
  for (const c of certifications) {
    const key = c.species_code;
    bySpecies[key] = bySpecies[key] || { code: key, common_name: c.batch.species.common_name, count: 0 };
    bySpecies[key].count += 1;
  }
  const topHerbs = Object.values(bySpecies).sort((a, b) => b.count - a.count).slice(0, 5);

  const mismatchTotal = await prisma.speciesVerificationLog.count({ where: scoped });
  const mismatchRate = mismatchTotal ? Math.round((mismatches / mismatchTotal) * 1000) / 10 : 0;

  return {
    scope: lab_user_id ? "lab" : "global",
    testing_volume: volume,
    certified_batches: certifications.length,
    rejected_batches: rejectedBatches,
    pass_rate_pct: passRate,
    fail_rate_pct: failRate,
    avg_certification_hours: avgCertHours,
    species_mismatch_pct: mismatchRate,
    species_mismatch_count: mismatches,
    top_herbs: topHerbs,
  };
}

// --------------------------------------------------------------- dashboards

/** Batch list scoped to this lab's custody + optional workflow status. */
async function listLabBatches(user, { status = null, q = null, limit = 50, offset = 0 } = {}) {
  if (!isLabStaff(user)) throw new ApiError("forbidden", "Lab dashboard is for lab accounts", 403);
  const where = { current_holder_user_id: user.id };
  if (status && status !== "all") {
    if (status === "incoming") {
      // Approved requests where this lab is the receiver and custody hasn't landed.
      const requests = await prisma.transferRequest.findMany({
        where: { to_user_id: user.id, status: "approved" },
        select: { batch_id: true },
      });
      const batchIds = requests.map((r) => r.batch_id);
      const withBatch = await prisma.batch.findMany({ where: { id: { in: batchIds } }, select: { id: true, current_holder_user_id: true } });
      const incomingIds = withBatch.filter((b) => b.current_holder_user_id !== user.id).map((b) => b.id);
      return listByIds(incomingIds, q, limit, offset);
    }
    if (!["pending", "received_by_lab", "sample_created", "under_testing", "certified", "rejected"].includes(status)) {
      throw new ApiError("bad_request", `Unknown dashboard status '${status}'`, 400);
    }
    where.test_status = status;
  }
  if (q) {
    where.OR = [
      { code: { contains: q } },
      { species: { OR: [{ code: { contains: q } }, { common_name: { contains: q } }] } },
      { farmer: { name: { contains: q } } },
      { location: { contains: q } },
    ];
  }
  const [batches, total] = await Promise.all([
    prisma.batch.findMany({
      where,
      orderBy: { updated_at: "desc" },
      skip: Math.max(parseInt(offset, 10) || 0, 0),
      take: Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100),
      include: {
        species: { select: { code: true, common_name: true } },
        farmer: { select: { id: true, name: true } },
        _count: { select: { samples: true, lab_tests: true } },
      },
    }),
    prisma.batch.count({ where }),
  ]);
  return { batches, total };
}

async function listByIds(ids, q, limit, offset) {
  if (!ids.length) return { batches: [], total: 0 };
  const where = { id: { in: ids } };
  if (q) where.code = { contains: q };
  const [batches, total] = await Promise.all([
    prisma.batch.findMany({
      where,
      orderBy: { updated_at: "desc" },
      skip: Math.max(parseInt(offset, 10) || 0, 0),
      take: Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100),
      include: {
        species: { select: { code: true, common_name: true } },
        farmer: { select: { id: true, name: true } },
        _count: { select: { samples: true, lab_tests: true } },
      },
    }),
    prisma.batch.count({ where }),
  ]);
  return { batches, total };
}

/** One batch's full lab dossier for the dashboard (read-only view). */
async function labBatchDetail(user, batchId) {
  if (!isLabStaff(user)) throw new ApiError("forbidden", "Lab dashboard is for lab accounts", 403);
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: BATCH_DETAIL_INCLUDE,
  });
  if (!batch) throw new ApiError("not_found", "Batch not found", 404);
  await assertLabRead(user, batch);
  return batch;
}

/**
 * Read access to lab records of a batch: admin, the current holder when it's
 * a lab account, or anyone whose lab already worked this batch.
 */
async function assertLabRead(user, batch) {
  if (user.role === "admin") return;
  if (user.role !== "lab") throw new ApiError("forbidden", "Lab records are for lab accounts", 403);
  if (batch.current_holder_user_id === user.id) return;
  const [receipts, tests, certs, rejects] = await Promise.all([
    prisma.labReceipt.count({ where: { batch_id: batch.id, lab_user_id: user.id } }),
    prisma.labTest.count({ where: { batch_id: batch.id, lab_user_id: user.id } }),
    prisma.certification.count({ where: { batch_id: batch.id, lab_user_id: user.id } }),
    prisma.rejectionRecord.count({ where: { batch_id: batch.id, rejected_by_user_id: user.id } }),
  ]);
  if (!receipts && !tests && !certs && !rejects) {
    throw new ApiError("forbidden", "This batch is not in your lab's dossier", 403);
  }
}

// ------------------------------------------------------------ lab reads

async function listSamples(user, { batch_id = null, limit = 50, offset = 0 } = {}) {
  if (!isLabStaff(user)) throw new ApiError("forbidden", "Lab dashboard is for lab accounts", 403);
  const where = batch_id ? { batch_id } : {};
  const [samples, total] = await Promise.all([
    prisma.sampleRecord.findMany({
      where,
      orderBy: { collected_at: "desc" },
      skip: Math.max(parseInt(offset, 10) || 0, 0),
      take: Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100),
      include: SAMPLE_INCLUDE,
    }),
    prisma.sampleRecord.count({ where }),
  ]);
  return { samples, total };
}

async function listTests(user, { batch_id = null, sample_id = null, status = null, limit = 50, offset = 0 } = {}) {
  if (!isLabStaff(user)) throw new ApiError("forbidden", "Lab dashboard is for lab accounts", 403);
  const where = {};
  if (batch_id) where.batch_id = batch_id;
  if (sample_id) where.sample_id = sample_id;
  if (status) where.status = status;
  const [tests, total] = await Promise.all([
    prisma.labTest.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: Math.max(parseInt(offset, 10) || 0, 0),
      take: Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100),
      include: TEST_INCLUDE,
    }),
    prisma.labTest.count({ where }),
  ]);
  return { tests, total };
}

async function listCertificates(user, { batch_id = null } = {}) {
  if (!isLabStaff(user) && user.role !== "manufacturer" && user.role !== "consumer") {
    throw new ApiError("forbidden", "Certificates are for lab accounts, verified downstream parties and AYUSH", 403);
  }
  const where = {};
  if (batch_id) where.batch_id = batch_id;
  return prisma.certification.findMany({
    where,
    orderBy: { issued_at: "desc" },
    include: {
      batch: { select: { id: true, code: true, test_status: true } },
      species: { select: { code: true, common_name: true, scientific_name: true } },
    },
  });
}

module.exports = {
  receiveBatch,
  createSample,
  createTest,
  enterResult,
  submitTest,
  reviewTest,
  attachDocument,
  certifyBatch,
  rejectBatch,
  verifySpecies,
  listLabBatches,
  labBatchDetail,
  listSamples,
  listTests,
  listCertificates,
  analytics,
  certificateHash,
};
