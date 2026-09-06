/**
 * Analytics report generation (docs/phase_16.md "Report Generation
 * System"). Reports are audience-scoped: farmers/labs/manufacturers can
 * only export their own slice; admins/regulators can export anything.
 * CSV is the concrete artifact (stored via the storage driver + a
 * ReportExport row, same pipeline as Phase 13). pdf/excel are recorded as
 * queued export jobs behind the same pipeline. Scheduled reports
 * auto-generate through the worker (daily/weekly/monthly cadence).
 */
const { prisma } = require("../db/client");
const storage = require("./storage");
const { writeAudit } = require("./audit");
const { ANALYTICS_REPORT_TYPES, FREQUENCY_DAYS } = require("../constants/analytics");
const { ApiError } = require("../utils/errors");
const { publishDirect } = require("./notifications");
const { getLogger } = require("../config/logging");

const logger = getLogger("analytics-reports");

const CSV_FORMATS = ["csv"];
const ALL_FORMATS = ["csv", "pdf", "excel"];

// -------------------------------------------------------- builders

/** Every builder returns { headers, rows } — rows are string[] arrays. */

async function buildFarmerReport({ farmer_id, user }) {
  const scope = (user.role !== "admin" && user.role !== "farmer") ? null : (farmer_id && (user.role === "admin" ? farmer_id : user.id)) || (user.role === "farmer" ? user.id : farmer_id || null);
  if (!scope) throw new ApiError("forbidden", "farmer report requires a farmer scope", 403);
  const batches = await prisma.batch.findMany({
    where: { farmer_id: scope },
    orderBy: { created_at: "desc" },
    select: {
      code: true, weight_kg: true, phase: true, test_status: true, created_at: true,
      species: { select: { code: true, common_name: true } },
      farmer: { select: { name: true } },
    },
  });
  return {
    headers: ["Farmer", "Species", "Batch", "Weight (kg)", "Phase", "Test Status", "Created"],
    rows: batches.map((b) => [
      b.farmer?.name || "", b.species.common_name, b.code, String(b.weight_kg),
      b.phase, b.test_status, b.created_at.toISOString(),
    ]),
  };
}

async function buildLabReport({ lab_user_id, user }) {
  const scope = (user.role === "lab") ? user.id : (user.role === "admin" ? lab_user_id : null);
  if (!scope) throw new ApiError("forbidden", "lab report requires a lab scope", 403);
  const [tests, certs, rejections] = await Promise.all([
    prisma.labTest.findMany({ where: { lab_user_id: scope }, orderBy: { created_at: "desc" }, select: { test_name: true, test_category: true, status: true, outcome: true, created_at: true } }),
    prisma.certification.count({ where: { lab_user_id: scope } }),
    prisma.rejectionRecord.count({ where: { rejected_by_user_id: scope } }),
  ]);
  const passed = tests.filter((t) => t.outcome === "pass").length;
  const failed = tests.filter((t) => t.outcome === "fail").length;
  return {
    headers: ["Summary: tests", "passed", "failed", "certificates issued", "rejections"],
    rows: [[String(tests.length), String(passed), String(failed), String(certs), String(rejections)]],
  };
}

async function buildManufacturerReport({ manufacturer_user_id, user }) {
  const scope = (user.role === "manufacturer") ? user.id : (user.role === "admin" ? manufacturer_user_id : null);
  if (!scope) throw new ApiError("forbidden", "manufacturer report requires a manufacturer scope", 403);
  const [runs, lots, ingredients] = await Promise.all([
    prisma.manufacturingBatch.findMany({ where: { manufacturer_user_id: scope }, orderBy: { created_at: "desc" }, select: { code: true, status: true, planned_units: true, production_date: true, product: { select: { name: true } } } }),
    prisma.productLot.count({ where: { holder: { id: scope } } }),
    prisma.manufacturingBatchIngredient.findMany({
      where: { state: "consumed", run: { manufacturer_user_id: scope } },
      select: { quantity_kg: true, batch: { select: { species: { select: { common_name: true } } } } },
    }),
  ]);
  const byHerb = new Map();
  for (const ing of ingredients) {
    byHerb.set(ing.batch.species.common_name, (byHerb.get(ing.batch.species.common_name) || 0) + ing.quantity_kg);
  }
  const body = runs.length
    ? runs.map((r) => [r.product.name || "", r.code, r.status, String(r.planned_units), r.production_date ? r.production_date.toISOString() : ""])
    : [["No manufacturing runs recorded", "", "", "", ""]];
  return {
    headers: [`Product | run count=${runs.length}, lots=${lots}, consumed: ${[...byHerb].map(([h, kg]) => `${h} ${kg.toFixed(1)}kg`).join(", ") || "none"}`],
    rows: body.map((r) => r),
  };
}

async function buildTraceabilityReport() {
  const products = await prisma.traceabilityAnalytics.findMany({ where: { period_type: "all" }, orderBy: { avg_score: "desc" } });
  return {
    headers: ["Product", "Traceable", "Avg Score", "Fully Traceable %"],
    rows: products.map((p) => [p.product_name, String(p.traceable_products), String(p.avg_score), String(p.fully_traceable_pct)]),
  };
}

async function buildComplianceReport() {
  const [rows, scores, alerts] = await Promise.all([
    prisma.complianceAnalytics.findMany({ where: { period_type: "all" }, orderBy: { alerts_critical: "desc" } }),
    prisma.complianceScore.findMany({ orderBy: { score: "asc" } }),
    prisma.complianceAlert.findMany({ where: { status: "open" }, orderBy: { created_at: "desc" }, take: 100 }),
  ]);
  const body = alerts.slice(0, 20).map((a) => [a.alert_type, a.severity, a.title, a.status, a.created_at.toISOString()]);
  return {
    headers: [
      `Scores: ${rows.map((r) => `${r.actor_type}=${r.avg_score ?? "n/a"}`).join(", ")} | worst: ${scores[0] ? `${scores[0].entity_type} ${scores[0].score}` : "none"} | open alerts: ${alerts.length}`,
      "Alert type/severity/title/status/raised",
    ],
    rows: body.map((r) => r),
  };
}

async function buildExecutiveSummary() {
  const [production, cert, logistics, blockchain, consumer] = await Promise.all([
    prisma.herbProductionAnalytics.findMany({ where: { period_type: "all" }, orderBy: { total_quantity_kg: "desc" } }),
    prisma.certificationAnalytics.findMany({ where: { period_type: "all" } }),
    prisma.logisticsAnalytics.findMany({ where: { period_type: "all" } }),
    prisma.blockchainAnalytics.findFirst({ where: { period_type: "all", event_type: "ALL" } }),
    prisma.consumerAnalytics.findMany({ where: { period_type: "all" }, orderBy: { scan_count: "desc" } }),
  ]);
  const totalKg = production.reduce((a, r) => a + r.total_quantity_kg, 0);
  const tests = cert.reduce((a, r) => a + r.total_tests, 0);
  const pass = cert.reduce((a, r) => a + r.pass_count, 0);
  const logAll = logistics.find((r) => r.transporter_user_id === null) || { total_shipments: 0, on_time: 0 };
  return {
    headers: ["Total KG", "Tests", "Pass Rate %", "Shipments", "On-Time %", "Chain Events", "Top Consumer Scans"],
    rows: [[
      totalKg.toFixed(1), String(tests),
      tests > 0 ? ((pass / tests) * 100).toFixed(1) : "0",
      String(logAll.total_shipments),
      logAll.total_shipments > 0 ? ((logAll.on_time / logAll.total_shipments) * 100).toFixed(1) : "0",
      String(blockchain?.events_count || 0),
      String(consumer.slice(0, 3).map((c) => `${c.product_name || "?"}:${c.scan_count}`).join(", ") || "none"),
    ]],
  };
}

const BUILDERS = {
  farmer: buildFarmerReport,
  lab: buildLabReport,
  manufacturer: buildManufacturerReport,
  traceability: buildTraceabilityReport,
  compliance: buildComplianceReport,
  executive_summary: buildExecutiveSummary,
  production: buildExecutiveSummary,
  logistics: buildExecutiveSummary,
  consumer: buildExecutiveSummary,
};

// -------------------------------------------------------- generation

function renderCsv({ headers, rows }) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
}

/**
 * Generate a report. CSV → stored artifact + ready ReportExport row;
 * pdf/excel → queued export job (pipeline slot, same as Phase 13).
 */
async function generateReport(user, { report_type, format = "csv", params = {} } = {}) {
  if (!ANALYTICS_REPORT_TYPES.includes(report_type)) {
    throw new ApiError("validation_error", `report_type must be one of: ${ANALYTICS_REPORT_TYPES.join(", ")}`, 400);
  }
  if (!ALL_FORMATS.includes(format)) throw new ApiError("validation_error", `format must be one of: ${ALL_FORMATS.join(", ")}`, 400);
  if (user.role !== "admin" && report_type !== "farmer" && report_type !== "lab" && report_type !== "manufacturer") {
    throw new ApiError("forbidden", "only admins may export this report type", 403);
  }

  const { headers, rows } = await BUILDERS[report_type]({ ...params, user });

  if (!CSV_FORMATS.includes(format)) {
    const job = await prisma.reportExport.create({
      data: {
        report_type: `analytics_${report_type}`, format, title: `${report_type} (${format})`,
        params_json: params, status: "queued", requested_by_user_id: user.id,
      },
    });
    await writeAudit({ actorUserId: user.id, action: "REPORT_EXPORTED", targetType: "report_export", targetId: job.id, meta: { report_type, format, row_count: rows.length } });
    return { report: job, download_url: null, row_count: rows.length };
  }

  const csv = renderCsv({ headers, rows });
  const key = `report-${report_type}-${Date.now()}.csv`;
  await storage.put(key, Buffer.from(csv));
  const report = await prisma.reportExport.create({
    data: {
      report_type: `analytics_${report_type}`, format: "csv", title: report_type,
      params_json: params, status: "ready", file_url: storage.urlFor(key),
      row_count: rows.length, requested_by_user_id: user.id, completed_at: new Date(),
    },
  });
  await writeAudit({ actorUserId: user.id, action: "REPORT_EXPORTED", targetType: "report_export", targetId: report.id, meta: { report_type, format, row_count: rows.length } });
  return { report, download_url: report.file_url, row_count: rows.length };
}

async function listReports(user, { limit = 50 } = {}) {
  if (user.role === "admin") {
    return prisma.reportExport.findMany({ orderBy: { created_at: "desc" }, take: Math.min(limit, 200) });
  }
  return prisma.reportExport.findMany({ where: { requested_by_user_id: user.id }, orderBy: { created_at: "desc" }, take: Math.min(limit, 200) });
}

// ---------------------------------------------------- scheduled reports

async function createSchedule(user, { report_name, report_type, frequency = "daily", params = {}, recipients = [], recipients_role = null }) {
  if (user.role !== "admin") throw new ApiError("forbidden", "only admins may schedule reports", 403);
  if (!ANALYTICS_REPORT_TYPES.includes(report_type)) throw new ApiError("validation_error", `report_type must be one of: ${ANALYTICS_REPORT_TYPES.join(", ")}`, 400);
  if (!Object.keys(FREQUENCY_DAYS).includes(frequency)) throw new ApiError("validation_error", `frequency must be one of: ${Object.keys(FREQUENCY_DAYS).join(", ")}`, 400);
  const next = new Date(Date.now() + FREQUENCY_DAYS[frequency] * 86400000);
  const schedule = await prisma.scheduledReport.create({
    data: {
      report_name, report_type, frequency, params_json: params, recipients_json: recipients,
      recipients_role, is_active: true, next_run_at: next, created_by_user_id: user.id,
    },
  });
  await writeAudit({ actorUserId: user.id, action: "SCHEDULED_REPORT_CREATED", targetType: "scheduled_report", targetId: schedule.id, meta: { report_type, frequency } });
  return schedule;
}

async function listSchedules(user) {
  if (user.role !== "admin") throw new ApiError("forbidden", "only admins may view schedules", 403);
  return prisma.scheduledReport.findMany({ orderBy: { next_run_at: "asc" } });
}

async function deleteSchedule(user, scheduleId) {
  if (user.role !== "admin") throw new ApiError("forbidden", "only admins may manage schedules", 403);
  const schedule = await prisma.scheduledReport.findUnique({ where: { id: scheduleId } });
  if (!schedule) throw new ApiError("not_found", "schedule not found", 404);
  await prisma.scheduledReport.delete({ where: { id: scheduleId } });
  await writeAudit({ actorUserId: user.id, action: "SCHEDULED_REPORT_DELETED", targetType: "scheduled_report", targetId: scheduleId });
  return { ok: true };
}

/**
 * Run one schedule now: generate the report as the schedule owner, notify
 * recipients through the Phase 14 notification engine, advance next_run_at
 * by the frequency. Idempotent per (schedule, due window).
 */
async function runSchedule(schedule) {
  const owner = await prisma.user.findUnique({ where: { id: schedule.created_by_user_id } });
  if (!owner) return { ran: false, reason: "owner_missing" };
  const params = typeof schedule.params_json === "object" && schedule.params_json ? schedule.params_json : {};
  const generated = await generateReport(owner, { report_type: schedule.report_type, format: "csv", params });
  await prisma.scheduledReport.update({
    where: { id: schedule.id },
    data: { last_run_at: new Date(), next_run_at: new Date(Date.now() + FREQUENCY_DAYS[schedule.frequency] * 86400000) },
  });
  // Notify recipients (or the broadcast role) that the report is ready.
  try {
    const recipients = Array.isArray(schedule.recipients_json) && schedule.recipients_json.length
      ? schedule.recipients_json
      : await adminUserIds(schedule.recipients_role);
    if (recipients.length) {
      await Promise.all(
        recipients.map((recipientUserId) =>
          publishDirect({
            code: "report_ready",
            recipientUserId,
            data: { scheduleName: schedule.report_name, schedule_name: schedule.report_name, entity: { id: generated.report.id } },
          })
        )
      );
    }
  } catch (err) {
    logger.warn(`schedule ${schedule.id} notify failed: ${err.message}`);
  }
  return { ran: true, report_id: generated.report.id, row_count: generated.row_count };
}

async function adminUserIds(role) {
  return prisma.user.findMany({ where: { role: role || "admin", is_active: true }, select: { id: true } }).then((rows) => rows.map((r) => r.id));
}

/** Fire every due schedule (worker's cadence hook). */
async function processDueSchedules(now = new Date()) {
  const due = await prisma.scheduledReport.findMany({
    where: { is_active: true, next_run_at: { lte: now } },
    orderBy: { next_run_at: "asc" },
  });
  let fired = 0;
  for (const schedule of due) {
    try {
      const res = await runSchedule(schedule);
      if (res.ran) fired += 1;
    } catch (err) {
      logger.error(`scheduled report ${schedule.id} failed: ${err.stack || err}`);
    }
  }
  return { fired };
}

module.exports = {
  generateReport,
  listReports,
  createSchedule,
  listSchedules,
  deleteSchedule,
  runSchedule,
  processDueSchedules,
  BUILDERS,
};