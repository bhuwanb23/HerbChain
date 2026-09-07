/**
 * Analytics + Reports API — /api/v1/analytics and /api/v1/reports
 * (docs/phase_16.md "APIs Required").
 *
 *   GET    /analytics/dashboard        executive AYUSH dashboard
 *   GET    /analytics/herbs            herb production analytics
 *   GET    /analytics/certifications   certification quality by lab
 *   GET    /analytics/failures         failure-reason breakdown
 *   GET    /analytics/regions          regional supply
 *   GET    /analytics/logistics        transporter performance
 *   GET    /analytics/manufacturers    manufacturer consumption
 *   GET    /analytics/consumers        consumer scan analytics
 *   GET    /analytics/traceability     lineage quality scores
 *   GET    /analytics/compliance       compliance scorecard
 *   GET    /analytics/blockchain       chain activity
 *   POST   /analytics/jobs/run         run the KPI ETL now
 *   POST   /analytics/alerts/run       scan alert thresholds now
 *
 *   POST   /reports/generate           generate a report (CSV)
 *   GET    /reports                    list my report exports
 *   GET    /reports/:id/download       download a ready CSV artifact
 *   POST   /reports/schedules          create a scheduled report (admin)
 *   GET    /reports/schedules          list schedules (admin)
 *   DELETE /reports/schedules/:id      delete a schedule (admin)
 *   POST   /reports/schedules/:id/run  fire one schedule now (admin)
 */
const express = require("express");
const { z } = require("zod");
const { ok, error } = require("../../utils/responses");
const { requireAuth, requirePermission } = require("../../middleware/auth");
const { prisma } = require("../../db/client");
const bi = require("../../services/analyticsBi");
const analytics = require("../../services/analytics");
const reports = require("../../services/analyticsReports");

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const reportBody = z.object({
  report_type: z.string().min(1),
  format: z.string().optional().default("csv"),
  params: z.record(z.any()).optional().default({}),
});
const scheduleBody = z.object({
  report_name: z.string().min(1),
  report_type: z.string().min(1),
  frequency: z.enum(["daily", "weekly", "monthly"]).optional().default("daily"),
  params: z.record(z.any()).optional().default({}),
  recipients: z.array(z.string()).optional().default([]),
  recipients_role: z.string().optional().nullable().default(null),
});
const idParam = z.object({ id: z.string().min(1) });

function mountAnalyticsRoutes(app) {
  // Reports router — mounted at /api/v1/reports (separate from analytics
  // so path prefixes stay clean).
  const reportsRouter = express.Router();
  reportsRouter.use(requireAuth);

  reportsRouter.post("/generate", requirePermission("reports.generate"), wrap(async (req, res) => {
    const body = reportBody.parse(req.body || {});
    const result = await reports.generateReport(req.user, body);
    return ok(res, result);
  }));

  reportsRouter.get("/", requirePermission("reports.generate"), wrap(async (req, res) => {
    const rows = await reports.listReports(req.user);
    return ok(res, { rows });
  }));

  reportsRouter.get("/:id/download", requirePermission("reports.generate"), wrap(async (req, res) => {
    const { id } = idParam.parse(req.params);
    const report = await prisma.reportExport.findUnique({ where: { id } });
    if (!report || report.status !== "ready" || !report.file_url) return error(res, "not_found", "report not ready", 404);
    if (report.requested_by_user_id !== req.user.id && req.user.role !== "admin") return error(res, "forbidden", "not your report", 403);
    const storage = require("../../services/storage");
    // file_url is "/uploads/<key>" — strip the mount prefix for the driver.
    const key = decodeURIComponent(String(report.file_url).replace(/^\/uploads\//, ""));
    const buf = await storage.get(key);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${report.title || "report"}.csv"`);
    return res.send(buf);
  }));

  reportsRouter.post("/schedules", requirePermission("reports.generate"), wrap(async (req, res) => {
    const body = scheduleBody.parse(req.body || {});
    const schedule = await reports.createSchedule(req.user, body);
    return ok(res, { schedule });
  }));

  reportsRouter.get("/schedules", requirePermission("reports.generate"), wrap(async (req, res) => {
    const rows = await reports.listSchedules(req.user);
    return ok(res, { rows });
  }));

  reportsRouter.delete("/schedules/:id", requirePermission("reports.generate"), wrap(async (req, res) => {
    const { id } = idParam.parse(req.params);
    return ok(res, await reports.deleteSchedule(req.user, id));
  }));

  reportsRouter.post("/schedules/:id/run", requirePermission("reports.generate"), wrap(async (req, res) => {
    const { id } = idParam.parse(req.params);
    if (req.user.role !== "admin") return error(res, "forbidden", "only admins may run schedules", 403);
    const schedule = await prisma.scheduledReport.findUnique({ where: { id } });
    if (!schedule) return error(res, "not_found", "schedule not found", 404);
    const result = await reports.runSchedule(schedule);
    return ok(res, result);
  }));

  app.use("/api/v1/reports", reportsRouter);

  // Analytics router — mounted at /api/v1/analytics.
  const router = express.Router();
  router.use(requireAuth);

  // ---------------------------------------------------------- dashboard
  router.get(
    "/dashboard",
    requirePermission("analytics.view"),
    wrap(async (req, res) => {
      const dashboard = await bi.executiveDashboard();
      return ok(res, { dashboard });
    })
  );

  // ------------------------------------------------------------ domains
  router.get("/herbs", requirePermission("analytics.view"), wrap(async (req, res) => {
    const { species_id } = req.query;
    const rows = await bi.herbAnalytics({ species_id: species_id || null, user: req.user });
    return ok(res, { rows });
  }));

  router.get("/certifications", requirePermission("analytics.view"), wrap(async (req, res) => {
    const { lab_user_id } = req.query;
    return ok(res, await bi.certificationAnalytics({ lab_user_id: lab_user_id || null, user: req.user }));
  }));

  router.get("/failures", requirePermission("analytics.view"), wrap(async (req, res) => {
    return ok(res, await bi.failureAnalytics(req.user));
  }));

  router.get("/regions", requirePermission("analytics.view"), wrap(async (req, res) => {
    return ok(res, await bi.regionalAnalytics(req.user));
  }));

  router.get("/logistics", requirePermission("analytics.view"), wrap(async (req, res) => {
    const { transporter_user_id } = req.query;
    return ok(res, await bi.logisticsAnalytics({ transporter_user_id: transporter_user_id || null, user: req.user }));
  }));

  router.get("/manufacturers", requirePermission("analytics.view"), wrap(async (req, res) => {
    const { manufacturer_user_id } = req.query;
    const rows = await bi.manufacturerAnalytics({ manufacturer_user_id: manufacturer_user_id || null, user: req.user });
    return ok(res, { rows });
  }));

  router.get("/consumers", requirePermission("analytics.view"), wrap(async (req, res) => {
    const rows = await bi.consumerAnalytics(req.user);
    return ok(res, { rows });
  }));

  router.get("/traceability", requirePermission("analytics.view"), wrap(async (req, res) => {
    return ok(res, await bi.traceabilityAnalytics(req.user));
  }));

  router.get("/compliance", requirePermission("analytics.view"), wrap(async (req, res) => {
    return ok(res, await bi.complianceAnalytics(req.user));
  }));

  router.get("/blockchain", requirePermission("analytics.view"), wrap(async (req, res) => {
    return ok(res, await bi.blockchainAnalytics(req.user));
  }));

  // --------------------------------------------------------------- ops
  router.post("/jobs/run", requirePermission("analytics.manage"), wrap(async (req, res) => {
    const body = req.body || {};
    const jobs = Array.isArray(body.jobs) ? body.jobs : undefined;
    const result = await analytics.rebuildAll({ jobs, actorUserId: req.user.id });
    return ok(res, { result });
  }));

  router.get("/jobs/runs", requirePermission("analytics.manage"), wrap(async (req, res) => {
    const rows = await prisma.analyticsJobRun.findMany({ orderBy: { ran_at: "desc" }, take: 50 });
    return ok(res, { rows });
  }));

  router.post("/alerts/run", requirePermission("analytics.manage"), wrap(async (req, res) => {
    const alerts = await bi.scanAnalyticsAlerts();
    return ok(res, alerts);
  }));

  app.use("/api/v1/analytics", router);
}

module.exports = { mountAnalyticsRoutes };