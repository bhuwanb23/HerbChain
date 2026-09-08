/**
 * Laboratory certification API — Phase 8 (docs/phase_8.md).
 *
 *   POST  /api/v1/labs/batches/receive   intake checklist (spec §3)
 *   GET   /api/v1/labs/batches           lab dashboard (?status=&q=)
 *   GET   /api/v1/labs/batches/:batchId  read-only lab dossier
 *   POST  /api/v1/labs/samples           draw a sample (spec §4)
 *   GET   /api/v1/labs/samples           list (?batch_id=)
 *   POST  /api/v1/labs/tests             start a test (spec §5)
 *   GET   /api/v1/labs/tests             list (?batch_id=&sample_id=&status=)
 *   GET   /api/v1/labs/tests/:id         detail incl. results + reviews
 *   POST  /api/v1/labs/tests/:id/results enter one parameter value (spec §6)
 *   POST  /api/v1/labs/tests/:id/submit  analyst submits (outcome computed)
 *   POST  /api/v1/labs/reviews           supervisor two-level review (spec §8)
 *   POST  /api/v1/labs/documents         test report / microscopy / cert (spec §13)
 *   POST  /api/v1/labs/certificates      issue COA + approve batch (spec §9/§10)
 *   GET   /api/v1/labs/certificates      certificates (?batch_id=)
 *   POST  /api/v1/labs/reject            reject batch (spec §11)
 *   GET   /api/v1/labs/analytics         spec §14 (lab / AYUSH scope)
 *
 * Role separation: analysts enter/submit results; supervisors review,
 * certify and reject (User.lab_role). The batch custody phase stays at_lab —
 * certification only ADDS scientific validation.
 */
const express = require("express");
const { z } = require("zod");
const { ok, error } = require("../../utils/responses");
const { requireAuth } = require("../../middleware/auth");
const { prisma } = require("../../db/client");
const { ApiError } = require("../../utils/errors");
const {
  receiveBatch,
  createSample,
  createTest,
  enterResult,
  submitTest,
  reviewTest,
  attachDocument,
  certifyBatch,
  rejectBatch,
  listLabBatches,
  labBatchDetail,
  listSamples,
  listTests,
  listCertificates,
  analytics,
} = require("../../services/lab");
const {
  serializeReceipt,
  serializeSample,
  serializeTest,
  serializeCertification,
  serializeRejection,
  serializeDocument,
  serializeDossierBatch,
  serializeResult,
} = require("./labSerializer");

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const optStr = (max) => z.string().trim().max(max).optional().nullable();
const optNum = z.coerce.number().optional().nullable();

const receiveSchema = z.object({
  batch_id: z.string().min(1),
  receiver_name: optStr(200),
  received_quantity_kg: optNum,
  condition_status: z.string().trim().max(20).optional().default("good"),
  remarks: optStr(1000),
});
const sampleSchema = z.object({
  batch_id: z.string().min(1),
  sample_weight_kg: optNum,
  remarks: optStr(1000),
});
const testSchema = z.object({
  sample_id: z.string().min(1),
  test_name: optStr(200),
  test_category: z.string().trim().min(1),
  test_method: optStr(200),
  notes: optStr(2000),
});
const resultSchema = z.object({
  parameter_code: z.string().trim().min(1),
  observed_value: optNum,
  observed_text: optStr(500),
  unit: optStr(50),
  acceptable_range: optStr(200),
  result: z.string().trim().max(10).optional().default("na"),
  notes: optStr(1000),
});
const reviewSchema = z.object({
  test_id: z.string().min(1),
  review_status: z.string().trim().min(1),
  notes: optStr(2000),
});
const docSchema = z.object({
  batch_id: z.string().min(1),
  test_id: z.string().min(1).optional().nullable(),
  document_type: z.string().trim().min(1),
  document_url: optStr(1000),
  document_asset_id: z.string().min(1).optional().nullable(),
});
const certSchema = z.object({
  batch_id: z.string().min(1),
  expiry_days: z.coerce.number().int().positive().optional().default(365),
  certificate_url: optStr(1000),
  digital_signature: optStr(1000),
  notes: optStr(2000),
});
const rejectSchema = z.object({
  batch_id: z.string().min(1),
  reason: z.string().trim().min(1),
  description: optStr(2000),
  action: z.string().trim().max(40).optional().default("hold_for_investigation"),
});

function mountLabRoutes(app) {
  const router = express.Router();

  // ------------------------------------------------------------ receive
  router.post(
    "/batches/receive",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = receiveSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "batch_id is required", 400);
      const receipt = await receiveBatch(req.user, parsed.data);
      return ok(res, { receipt: serializeReceipt(receipt) }, 201);
    })
  );

  // ------------------------------------------------------ batch dashboard
  router.get(
    "/batches",
    requireAuth,
    wrap(async (req, res) => {
      const { status = null, q = null, limit, offset } = req.query;
      const { batches, total } = await listLabBatches(req.user, { status, q, limit, offset });
      return ok(res, {
        batches: batches.map((b) => ({
          id: b.id,
          code: b.code,
          phase: b.phase,
          test_status: b.test_status,
          weight_kg: b.weight_kg,
          species: b.species ? { code: b.species.code, common_name: b.species.common_name } : null,
          farmer: b.farmer ? { id: b.farmer.id, name: b.farmer.name } : null,
          location: b.location ?? null,
          sample_count: b._count?.samples ?? 0,
          test_count: b._count?.lab_tests ?? 0,
        })),
        total,
      });
    })
  );

  router.get(
    "/batches/:batchId",
    requireAuth,
    wrap(async (req, res) => {
      const batch = await labBatchDetail(req.user, req.params.batchId);
      return ok(res, { batch: serializeDossierBatch(batch) });
    })
  );

  // ------------------------------------------------------------ samples
  router.post(
    "/samples",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = sampleSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "batch_id is required", 400);
      const sample = await createSample(req.user, parsed.data);
      return ok(res, { sample: serializeSample(sample) }, 201);
    })
  );

  router.get(
    "/samples",
    requireAuth,
    wrap(async (req, res) => {
      const { batch_id = null, limit, offset } = req.query;
      const { samples, total } = await listSamples(req.user, { batch_id, limit, offset });
      return ok(res, { samples: samples.map(serializeSample), total });
    })
  );

  // -------------------------------------------------------------- tests
  router.post(
    "/tests",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = testSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "sample_id and test_category are required", 400);
      const test = await createTest(req.user, parsed.data);
      return ok(res, { test: serializeTest(test) }, 201);
    })
  );

  router.get(
    "/tests",
    requireAuth,
    wrap(async (req, res) => {
      const { batch_id = null, sample_id = null, status = null, limit, offset } = req.query;
      const { tests, total } = await listTests(req.user, { batch_id, sample_id, status, limit, offset });
      return ok(res, { tests: tests.map(serializeTest), total });
    })
  );

  router.get(
    "/tests/:testId",
    requireAuth,
    wrap(async (req, res) => {
      const test = await prisma.labTest.findUnique({
        where: { id: req.params.testId },
        include: {
          batch: { select: { id: true, code: true } },
          sample: { select: { id: true, sample_code: true } },
          results: { orderBy: { parameter_id: "asc" }, include: { parameter: true } },
          reviews: { orderBy: { reviewed_at: "asc" } },
        },
      });
      if (!test) return error(res, "not_found", "Lab test not found", 404);
      await requireLabTestRead(req.user, test);
      const { serializeTest } = require("./labSerializer");
      return ok(res, { test: serializeTest(test) });
    })
  );

  router.post(
    "/tests/:testId/results",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = resultSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "parameter_code is required", 400);
      const row = await enterResult(req.user, { test_id: req.params.testId, ...parsed.data });
      return ok(res, { result: { ...serializeResult(row) } }, 201);
    })
  );

  router.post(
    "/tests/:testId/submit",
    requireAuth,
    wrap(async (req, res) => {
      const test = await submitTest(req.user, { test_id: req.params.testId });
      return ok(res, { test: serializeTest(test) });
    })
  );

  // ------------------------------------------------------------- reviews
  router.post(
    "/reviews",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = reviewSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "test_id and review_status are required", 400);
      const test = await reviewTest(req.user, parsed.data);
      return ok(res, { test: serializeTest(test) });
    })
  );

  // ---------------------------------------------------------- documents
  router.post(
    "/documents",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = docSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "batch_id and document_type are required", 400);
      const doc = await attachDocument(req.user, parsed.data);
      return ok(res, { document: serializeDocument(doc) }, 201);
    })
  );

  // -------------------------------------------------------- certificates
  router.post(
    "/certificates",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = certSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "batch_id is required", 400);
      const cert = await certifyBatch(req.user, parsed.data);
      return ok(res, { certification: serializeCertification(cert) }, 201);
    })
  );

  router.get(
    "/certificates",
    requireAuth,
    wrap(async (req, res) => {
      const { batch_id = null } = req.query;
      const certs = await listCertificates(req.user, { batch_id });
      return ok(res, { certifications: certs.map(serializeCertification) });
    })
  );

  // -------------------------------------------------------------- reject
  router.post(
    "/reject",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = rejectSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "batch_id and reason are required", 400);
      const record = await rejectBatch(req.user, parsed.data);
      return ok(res, { rejection: serializeRejection(record) }, 201);
    })
  );

  // ---------------------------------------------------------- analytics
  router.get(
    "/analytics",
    requireAuth,
    wrap(async (req, res) => {
      const { lab_user_id = null } = req.query;
      const stats = await analytics(req.user, { lab_user_id });
      return ok(res, { analytics: stats });
    })
  );

  app.use("/api/v1/labs", router);
}

/** Test-level read guard: admin, the analyst who ran it, or the batch dossier owner. */
async function requireLabTestRead(user, test) {
  if (user.role === "admin") return;
  if (test.lab_user_id === user.id) return;
  const batch = await prisma.batch.findUnique({ where: { id: test.batch_id } });
  if (!batch) throw new ApiError("not_found", "Batch not found", 404);
  if (batch.current_holder_user_id === user.id && user.role === "lab") return;
  throw new ApiError("forbidden", "You cannot view this lab test", 403);
}

module.exports = { mountLabRoutes };
