/**
 * Lab report routes — port of routes/lab_reports.py.
 *
 *   POST /api/v1/lab-reports                  lab files a report (must be holder)
 *   GET  /api/v1/lab-reports/batch/<batch_id> list reports for a batch
 *   GET  /api/v1/lab-reports/<report_id>      get a single report
 */
const express = require("express");
const { prisma } = require("../db/client");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireAuth, requireRole } = require("../middleware/auth");
const { ok, error } = require("../utils/responses");
const { createLabReportSchema, zodDetails } = require("../validation/schemas");
const { serializeLabReport, serializeState } = require("../serializers");
const { newEventId, newReportId } = require("../utils/ids");

function mountLabReports(app) {
  const router = express.Router();

  router.get("/", (req, res) => {
    ok(res, {
      endpoints: {
        create: "POST /api/v1/lab-reports",
        list_for_batch: "GET /api/v1/lab-reports/batch/<batch_id>",
        get_one: "GET /api/v1/lab-reports/<report_id>",
      },
    });
  });

  router.post("/", requireRole("lab"), asyncHandler(async (req, res) => {
    const parsed = createLabReportSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return error(res, "validation_error", "Invalid lab report data", 400, zodDetails(parsed.error));
    }
    const d = parsed.data;
    const batchId = d.batch_id;

    const [herb, state] = await Promise.all([
      prisma.herb.findUnique({ where: { batch_id: batchId } }),
      prisma.batchState.findUnique({ where: { batch_id: batchId } }),
    ]);
    if (!herb || !state) {
      return error(res, "not_found", `Batch '${batchId}' not found`, 404);
    }
    if (state.current_holder_id !== req.user.user_id) {
      return error(res, "forbidden", "Only the lab currently holding this batch can file a report", 403);
    }
    if (state.phase !== "at_lab") {
      return error(
        res,
        "invalid_state",
        `Lab reports can only be filed when phase is 'at_lab' (current: '${state.phase}')`,
        409
      );
    }

    const reportId = newReportId();
    const outcome = d.outcome;

    const { report, updatedState } = await prisma.$transaction(async (tx) => {
      const report = await tx.labReport.create({
        data: {
          report_id: reportId,
          batch_id: batchId,
          lab_id: req.user.user_id,
          test_type: d.test_type,
          test_date: d.test_date,
          results_summary: d.results_summary,
          outcome,
          certification_level: d.certification_level ?? null,
          purity_percentage: d.purity_percentage ?? null,
          moisture_content: d.moisture_content ?? null,
          ash_content: d.ash_content ?? null,
          heavy_metals_present: d.heavy_metals_present ?? null,
          pesticides_detected: d.pesticides_detected ?? null,
          active_compounds: d.active_compounds ?? null,
          potency_rating: d.potency_rating ?? null,
          report_url: d.report_url ?? null,
          notes: d.notes ?? null,
          recommendations: d.recommendations ?? null,
        },
      });

      const updatedState = await tx.batchState.update({
        where: { batch_id: batchId },
        data: { test_result: outcome, updated_at: new Date() },
      });

      await tx.batchEvent.create({
        data: {
          event_id: newEventId(),
          batch_id: batchId,
          event_type: "LAB_REPORT",
          actor_id: req.user.user_id,
          from_party_id: null,
          to_party_id: req.user.user_id,
          phase_before: state.phase,
          phase_after: state.phase,
          location: req.user.location,
          payload_json: {
            report_id: reportId,
            outcome,
            certification_level: d.certification_level ?? null,
          },
        },
      });

      return { report, updatedState };
    });

    return ok(res, { report: serializeLabReport(report), state: serializeState(updatedState) }, 201);
  }));

  router.get("/batch/:batch_id", requireAuth, asyncHandler(async (req, res) => {
    const herb = await prisma.herb.findUnique({ where: { batch_id: req.params.batch_id } });
    if (!herb) return error(res, "not_found", `Batch '${req.params.batch_id}' not found`, 404);

    const reports = await prisma.labReport.findMany({
      where: { batch_id: req.params.batch_id },
      orderBy: { created_at: "desc" },
    });
    return ok(res, { reports: reports.map(serializeLabReport), total: reports.length });
  }));

  router.get("/:report_id", requireAuth, asyncHandler(async (req, res) => {
    const report = await prisma.labReport.findUnique({ where: { report_id: req.params.report_id } });
    if (!report) return error(res, "not_found", `Lab report '${req.params.report_id}' not found`, 404);
    return ok(res, { report: serializeLabReport(report) });
  }));

  app.use("/api/v1/lab-reports", router);
}

module.exports = { mountLabReports };