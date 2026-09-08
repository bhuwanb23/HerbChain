/**
 * Analytics ETL service (docs/phase_16.md "Analytics Architecture" +
 * "KPI Calculation Jobs").
 *
 *   Operational tables ──rebuild──▶ analytics warehouse tables
 *
 * Dashboard reads ONLY hit the warehouse tables; these jobs are the only
 * writers. Every job is a full rebuild of its period buckets (delete +
 * recreate inside one transaction) — simple, deterministic and idempotent.
 * Each run is observed in AnalyticsJobRun (rows written + duration).
 *
 * Periods: daily (D-1 UTC day), weekly (ISO Mon-Sun), monthly, yearly and
 * the lifetime `all` rollup. One `rebuildAll({ job })` invocation rebuilds
 * every domain the caller asked for across every period type.
 */
const { env } = require("../config/env");
const { prisma } = require("../db/client");
const { ANALYTICS_JOBS, FAILURE_REASONS } = require("../constants/analytics");
const { writeAudit } = require("./audit");
const { getLogger } = require("../config/logging");

const logger = getLogger("analytics");

// ------------------------------------------------------------- period math

/** UTC day bucket containing `date`. */
function dayStart(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** ISO week (Mon 00:00 UTC) containing `date`. */
function weekStart(date) {
  const d = dayStart(date);
  const dow = (d.getUTCDay() + 6) % 7; // Mon=0
  d.setUTCDate(d.getUTCDate() - dow);
  return d;
}

function monthStart(date) {
  const d = dayStart(date);
  d.setUTCDate(1);
  return d;
}

function yearStart(date) {
  const d = monthStart(date);
  d.setUTCMonth(0);
  return d;
}

/**
 * The standard rebuild set. `all` has no end — it spans every row.
 * Daily/weekly/monthly/yearly buckets end "now" (each covers the bucket
 * containing now; full historical backfill is a future ETL concern).
 */
function buildPeriods(now = new Date()) {
  const d = dayStart(now);
  const w = weekStart(now);
  const m = monthStart(now);
  const y = yearStart(now);
  const prevM = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const next = { daily: 1, weekly: 7, monthly: 30 };
  return [
    { type: "daily", start: d, end: new Date(d.getTime() + next.daily * 86400000) },
    { type: "weekly", start: w, end: new Date(w.getTime() + next.weekly * 86400000) },
    { type: "monthly", start: m, end: new Date(m.getTime() + next.monthly * 86400000) },
    // Previous month — MoM trend comparisons (BI alert engine, dashboards).
    { type: "monthly", start: prevM, end: m },
    { type: "yearly", start: y, end: new Date(y.getTime() + 366 * 86400000) },
    { type: "all", start: new Date(0), end: new Date("9999-12-31T00:00:00.000Z") },
  ];
}

function inWindow(dateCol, period) {
  return { gte: period.start, lt: period.end };
}

// ------------------------------------------------------------ helpers

function pct(n, total) {
  return total > 0 ? Math.round((n / total) * 10000) / 100 : 0;
}

/** day-diff between two dates, 2dp. */
function daysBetween(a, b) {
  if (!a || !b) return null;
  return Math.round(((b.getTime() - a.getTime()) / 86400000) * 100) / 100;
}

// ------------------------------------------------- 1. herb production

async function rebuildProduction(period) {
  const batches = await prisma.batch.findMany({
    where: { created_at: inWindow("created_at", period) },
    select: {
      id: true, species_id: true, weight_kg: true, farmer_id: true,
      test_status: true,
      species: { select: { code: true, common_name: true } },
    },
  });

  const byHerb = new Map();
  for (const b of batches) {
    const key = b.species_id;
    if (!byHerb.has(key)) {
      byHerb.set(key, {
        herb_id: key, herb_code: b.species.code, herb_name: b.species.common_name,
        total_batches: 0, total_quantity_kg: 0, farmers: new Set(),
        certified: 0, rejected: 0,
      });
    }
    const row = byHerb.get(key);
    row.total_batches += 1;
    row.total_quantity_kg += b.weight_kg;
    row.farmers.add(b.farmer_id);
    if (b.test_status === "certified") row.certified += 1;
    if (b.test_status === "rejected") row.rejected += 1;
  }

  const rows = [...byHerb.values()].map((r) => ({
    period_type: period.type, period_start: period.start, period_end: period.end,
    herb_id: r.herb_id, herb_code: r.herb_code, herb_name: r.herb_name,
    total_batches: r.total_batches,
    total_quantity_kg: Math.round(r.total_quantity_kg * 100) / 100,
    active_farmers: r.farmers.size,
    certified_batches: r.certified,
    rejected_batches: r.rejected,
  }));
  await replaceRows("herbProductionAnalytics", period, rows);
  return rows.length;
}

// ---------------------------------------------- 2. certification quality

async function rebuildCertification(period) {
  const tests = await prisma.labTest.findMany({
    where: { created_at: inWindow("created_at", period) },
    select: { lab_user_id: true, status: true, outcome: true, started_at: true, completed_at: true },
  });
  const certs = await prisma.certification.findMany({
    where: { created_at: inWindow("created_at", period) },
    select: { lab_user_id: true, lab_name: true },
  });
  const rejections = await prisma.rejectionRecord.findMany({
    where: { rejected_at: inWindow("rejected_at", period) },
    select: { rejected_by_user_id: true },
  });

  // per-lab aggregation keyed by lab_user_id; null key = all-labs rollup.
  const byLab = new Map();
  function labRow(id, name = null) {
    const key = id || "__all__";
    if (!byLab.has(key)) {
      byLab.set(key, {
        lab_user_id: id, lab_name: name, total_tests: 0, pass_count: 0,
        fail_count: 0, certificates_issued: 0, rejections: 0, testing_days_sum: 0,
        testing_days_n: 0,
      });
    }
    return byLab.get(key);
  }

  for (const t of tests) {
    const row = labRow(t.lab_user_id);
    row.total_tests += 1;
    if (t.outcome === "pass") row.pass_count += 1;
    if (t.outcome === "fail") row.fail_count += 1;
    if (t.started_at && t.completed_at) {
      row.testing_days_sum += daysBetween(t.started_at, t.completed_at) || 0;
      row.testing_days_n += 1;
    }
  }
  for (const c of certs) {
    const row = labRow(c.lab_user_id);
    row.lab_name = c.lab_name || row.lab_name;
    row.certificates_issued += 1;
  }
  for (const rej of rejections) {
    const row = labRow(rej.rejected_by_user_id);
    row.rejections += 1;
  }

  // National rollup row (lab_user_id null) — sums every lab in the period.
  if (byLab.size > 0) {
    const all = labRow(null);
    for (const [key, r] of byLab) {
      if (key === "__all__") continue;
      all.total_tests += r.total_tests;
      all.pass_count += r.pass_count;
      all.fail_count += r.fail_count;
      all.certificates_issued += r.certificates_issued;
      all.rejections += r.rejections;
      all.testing_days_sum += r.testing_days_sum;
      all.testing_days_n += r.testing_days_n;
    }
  }

  const rows = [...byLab.values()].map((r) => ({
    period_type: period.type, period_start: period.start, period_end: period.end,
    lab_user_id: r.lab_user_id === "__all__" ? null : r.lab_user_id,
    lab_name: r.lab_name,
    total_tests: r.total_tests,
    pass_count: r.pass_count,
    fail_count: r.fail_count,
    certificates_issued: r.certificates_issued,
    rejections: r.rejections,
    avg_testing_days: r.testing_days_n > 0 ? Math.round((r.testing_days_sum / r.testing_days_n) * 100) / 100 : 0,
  }));
  await replaceRows("certificationAnalytics", period, rows);
  return rows.length;
}

// --------------------------------------------------- 3. failure reasons

async function rebuildFailures(period) {
  const rejections = await prisma.rejectionRecord.findMany({
    where: { rejected_at: inWindow("rejected_at", period) },
    select: { reason: true, batch: { select: { farmer: { select: { addresses: { where: { is_default: true }, select: { state: true, district: true } } } } } } },
  });
  const total = rejections.length;
  const byKey = new Map();
  for (const r of rejections) {
    const addr = r.batch?.farmer?.addresses?.[0];
    const state = addr?.state || "unknown";
    const district = addr?.district || null;
    const key = `${r.reason}|${state}|${district || ""}`;
    if (!byKey.has(key)) byKey.set(key, { reason: r.reason, state, district, count: 0 });
    byKey.get(key).count += 1;
  }
  const rows = [...byKey.values()].map((r) => ({
    period_type: period.type, period_start: period.start, period_end: period.end,
    reason: r.reason, state: r.state, district: r.district,
    count: r.count, percentage: pct(r.count, total),
  }));
  await replaceRows("failureReasonAnalytics", period, rows);
  return rows.length;
}

// ------------------------------------------------- 4. regional supply

async function rebuildRegional(period) {
  const batches = await prisma.batch.findMany({
    where: { created_at: inWindow("created_at", period) },
    select: {
      species_id: true, weight_kg: true, test_status: true,
      species: { select: { common_name: true } },
      farmer: { select: { addresses: { where: { is_default: true }, select: { state: true, district: true } } } },
    },
  });
  const byKey = new Map();
  for (const b of batches) {
    const addr = b.farmer?.addresses?.[0];
    const state = addr?.state || "unknown";
    const district = addr?.district || null;
    const key = `${state}|${district || ""}|${b.species_id}`;
    if (!byKey.has(key)) {
      byKey.set(key, { state, district, herb_id: b.species_id, herb_name: b.species.common_name, kg: 0, batches: 0, certified: 0 });
    }
    const row = byKey.get(key);
    row.kg += b.weight_kg;
    row.batches += 1;
    if (b.test_status === "certified") row.certified += 1;
  }
  const rows = [...byKey.values()].map((r) => ({
    period_type: period.type, period_start: period.start, period_end: period.end,
    state: r.state, district: r.district, herb_id: r.herb_id, herb_name: r.herb_name,
    production_kg: Math.round(r.kg * 100) / 100, total_batches: r.batches,
    certified_batches: r.certified,
  }));
  await replaceRows("regionalSupplyAnalytics", period, rows);
  return rows.length;
}

// ----------------------------------------------------- 5. logistics

async function rebuildLogistics(period) {
  const shipments = await prisma.shipment.findMany({
    where: { created_at: inWindow("created_at", period) },
    select: {
      assigned_transporter_user_id: true, status: true,
      metric: { select: { delay_minutes: true, actual_hours: true } },
    },
  });
  const byT = new Map();
  function tRow(id) {
    const key = id || "__all__";
    if (!byT.has(key)) {
      byT.set(key, { transporter_user_id: id, total: 0, delivered: 0, failed: 0, on_time: 0, delayed: 0, hours_sum: 0, hours_n: 0, delay_sum: 0, delay_n: 0 });
    }
    return byT.get(key);
  }
  for (const s of shipments) {
    const row = tRow(s.assigned_transporter_user_id);
    row.total += 1;
    if (s.status === "delivered" || s.status === "completed") row.delivered += 1;
    if (s.status === "failed" || s.status === "rejected") row.failed += 1;
    const delay = s.metric?.delay_minutes;
    if (delay != null) {
      if (delay <= 0) row.on_time += 1;
      else row.delayed += 1;
      row.delay_sum += delay;
      row.delay_n += 1;
    }
    if (s.metric?.actual_hours != null) {
      row.hours_sum += s.metric.actual_hours;
      row.hours_n += 1;
    }
  }

  // Network rollup row (transporter_user_id null) — sums every transporter.
  if (byT.size > 0) {
    const all = tRow(null);
    for (const [key, r] of byT) {
      if (key === "__all__") continue;
      all.total += r.total; all.delivered += r.delivered; all.failed += r.failed;
      all.on_time += r.on_time; all.delayed += r.delayed;
      all.hours_sum += r.hours_sum; all.hours_n += r.hours_n;
      all.delay_sum += r.delay_sum; all.delay_n += r.delay_n;
    }
  }
  const rows = [...byT.values()].map((r) => ({
    period_type: period.type, period_start: period.start, period_end: period.end,
    transporter_user_id: r.transporter_user_id === "__all__" ? null : r.transporter_user_id,
    total_shipments: r.total, delivered: r.delivered, failed: r.failed,
    on_time: r.on_time, delayed: r.delayed,
    avg_transit_hours: r.hours_n > 0 ? Math.round((r.hours_sum / r.hours_n) * 100) / 100 : 0,
    avg_delay_minutes: r.delay_n > 0 ? Math.round(r.delay_sum / r.delay_n) : 0,
  }));
  await replaceRows("logisticsAnalytics", period, rows);
  return rows.length;
}

// ------------------------------------------------- 6. consumption

async function rebuildConsumption(period) {
  const ingredients = await prisma.manufacturingBatchIngredient.findMany({
    where: { state: "consumed", consumed_at: inWindow("consumed_at", period) },
    select: {
      quantity_kg: true, run: { select: { id: true, manufacturer_user_id: true } },
      batch: { select: { species: { select: { id: true, common_name: true } } } },
    },
  });
  const byKey = new Map();
  for (const ing of ingredients) {
    const mfr = ing.run.manufacturer_user_id;
    const herb = ing.batch.species;
    const key = `${mfr}|${herb.id}`;
    if (!byKey.has(key)) byKey.set(key, { manufacturer_user_id: mfr, herb_id: herb.id, herb_name: herb.common_name, kg: 0, runs: new Set() });
    const row = byKey.get(key);
    row.kg += ing.quantity_kg;
    row.runs.add(ing.run.id);
  }
  const rows = [...byKey.values()].map((r) => ({
    period_type: period.type, period_start: period.start, period_end: period.end,
    manufacturer_user_id: r.manufacturer_user_id, herb_id: r.herb_id, herb_name: r.herb_name,
    consumed_kg: Math.round(r.kg * 100) / 100, runs_count: r.runs.size,
  }));
  await replaceRows("manufacturerConsumptionAnalytics", period, rows);
  return rows.length;
}

// ------------------------------------------------- 7. consumer demand

async function rebuildConsumer(period) {
  const scans = await prisma.consumerScan.findMany({
    where: { scanned_at: inWindow("scanned_at", period) },
    select: { product_id: true, state: true, token_hash: true, outcome: true },
  });
  const productIds = [...new Set(scans.map((s) => s.product_id).filter(Boolean))];
  const products = productIds.length
    ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } })
    : [];
  const nameById = new Map(products.map((p) => [p.id, p.name]));
  const byKey = new Map();
  for (const s of scans) {
    const key = `${s.product_id || "null"}|${s.state || "unknown"}`;
    if (!byKey.has(key)) byKey.set(key, { product_id: s.product_id, product_name: nameById.get(s.product_id) || null, state: s.state, tokens: new Set(), scans: 0, valid: 0, invalid: 0 });
    const row = byKey.get(key);
    row.tokens.add(s.token_hash);
    row.scans += 1;
    if (s.outcome === "VALID") row.valid += 1;
    else row.invalid += 1;
  }
  const rows = [...byKey.values()].map((r) => ({
    period_type: period.type, period_start: period.start, period_end: period.end,
    product_id: r.product_id, product_name: r.product_name, state: r.state,
    scan_count: r.scans, unique_tokens: r.tokens.size,
    valid_scans: r.valid, invalid_scans: r.invalid,
  }));
  await replaceRows("consumerAnalytics", period, rows);
  return rows.length;
}

// ---------------------------------------------- 8. traceability quality

/**
 * Per-product lineage score (0-100): certified batch origin (40) + a
 * completed run (20) + distribution legs recorded (20) + consumer
 * verification presence (20). `all` period is the meaningful bucket.
 */
async function rebuildTraceability(period) {
  const products = await prisma.product.findMany({
    select: {
      id: true, name: true,
      runs: {
        select: {
          status: true,
          ingredients: { select: { batch: { select: { test_status: true } } } },
          lots: { select: { id: true, consumer_scans: { select: { id: true } } } },
        },
      },
    },
  });
  let rowsTotal = 0;
  let rowsTraceable = 0;
  let scoreSum = 0;
  const rows = [];
  for (const p of products) {
    if (p.runs.length === 0) continue; // products without runs are not traceable candidates
    let score = 0;
    const allIngredients = p.runs.flatMap((r) => r.ingredients);
    const hasCertifiedOrigin = allIngredients.some((i) => i.batch.test_status === "certified");
    if (hasCertifiedOrigin) score += 40;
    const hasCompletedRun = p.runs.some((r) => r.status === "completed");
    if (hasCompletedRun) score += 20;
    const lots = p.runs.flatMap((r) => r.lots);
    const hasLots = lots.length > 0;
    if (hasLots) score += 20;
    const hasConsumerVerification = lots.some((l) => l.consumer_scans.length > 0);
    if (hasConsumerVerification) score += 20;
    const fully = score >= 100;
    if (fully) rowsTraceable += 1;
    rowsTotal += 1;
    scoreSum += score;
    rows.push({
      period_type: period.type, period_start: period.start, period_end: period.end,
      product_id: p.id, product_name: p.name, traceable_products: fully ? 1 : 0,
      total_products: 1, avg_score: score,
      fully_traceable_pct: fully ? 100 : 0,
    });
  }
  // One rollup row per product keeps the unique key stable; the dashboard
  // aggregates. Store the mean as the product-level avg (score itself).
  await replaceRows("traceabilityAnalytics", period, rows);
  return rows.length;
}

// ------------------------------------------------- 9. compliance

async function rebuildCompliance(period) {
  const alertWhere = { created_at: inWindow("created_at", period) };
  const [alerts, scores, cases, counterfeits] = await Promise.all([
    prisma.complianceAlert.findMany({ where: alertWhere, select: { status: true, severity: true } }),
    prisma.complianceScore.findMany({ select: { entity_type: true, score: true } }),
    prisma.investigationCase.count({ where: { opened_at: inWindow("opened_at", period) } }),
    prisma.counterfeitAlert.count({ where: { detected_at: inWindow("detected_at", period) } }),
  ]);
  const actorTypes = ["all", "farmer", "lab", "manufacturer", "transporter"];
  const rows = [];
  for (const actor of actorTypes) {
    const scoped = actor === "all" ? scores : scores.filter((s) => s.entity_type === actor);
    const avg = scoped.length ? Math.round((scoped.reduce((a, s) => a + s.score, 0) / scoped.length) * 100) / 100 : null;
    rows.push({
      period_type: period.type, period_start: period.start, period_end: period.end,
      actor_type: actor,
      avg_score: avg ?? 0,
      alerts_total: alerts.length,
      alerts_open: alerts.filter((a) => a.status === "open").length,
      alerts_critical: alerts.filter((a) => (a.severity === "CRITICAL" || a.severity === "HIGH") && a.status === "open").length,
      investigations: cases,
      counterfeit_alerts: counterfeits,
    });
  }
  await replaceRows("complianceAnalytics", period, rows);
  return rows.length;
}

// ------------------------------------------------- 10. blockchain

async function rebuildBlockchain(period) {
  const txns = await prisma.blockchainTransaction.findMany({
    where: { created_at: inWindow("created_at", period) },
    select: { event_type: true },
  });
  const failed = await prisma.blockchainEvent.count({
    where: { status: "failed", recorded_at: inWindow("recorded_at", period) },
  });
  // verification outcomes come from BlockchainAuditLog verify actions
  const audits = await prisma.blockchainAuditLog.findMany({
    where: { action: { in: ["VERIFIED", "VERIFY_EVENT"] }, created_at: inWindow("created_at", period) },
    select: { detail_json: true },
  });
  let verified = 0;
  let tampered = 0;
  for (const a of audits) {
    const detail = a.detail_json;
    if (detail && typeof detail === "object") {
      if (detail.result === "TAMPERED" || detail.verification === "TAMPERED") tampered += 1;
      else if (detail.result === "VALID" || detail.verification === "VALID") verified += 1;
    }
  }
  const byType = new Map();
  for (const t of txns) {
    byType.set(t.event_type, (byType.get(t.event_type) || 0) + 1);
  }
  const eventTypes = [...byType.keys(), "ALL"];
  const rows = eventTypes.map((t) => ({
    period_type: period.type, period_start: period.start, period_end: period.end,
    event_type: t,
    events_count: t === "ALL" ? txns.length : byType.get(t) || 0,
    verified_checks: verified, tampered_checks: tampered, failed_syncs: failed,
  }));
  await replaceRows("blockchainAnalytics", period, rows);
  return rows.length;
}

// ------------------------------------------------------------ engine

/**
 * Replace all rows of (period_type, period_start) for one domain — a full
 * rebuild inside one transaction (delete + create). Deterministic: the same
 * operational data always produces the same warehouse rows.
 */
async function replaceRows(model, period, rows) {
  await prisma.$transaction(async (tx) => {
    await tx[model].deleteMany({
      where: { period_type: period.type, period_start: period.start },
    });
    if (rows.length > 0) await tx[model].createMany({ data: rows });
  });
}

const JOB_RUNNERS = {
  production: rebuildProduction,
  certification: rebuildCertification,
  failures: rebuildFailures,
  regional: rebuildRegional,
  logistics: rebuildLogistics,
  consumption: rebuildConsumption,
  consumer: rebuildConsumer,
  traceability: rebuildTraceability,
  compliance: rebuildCompliance,
  blockchain: rebuildBlockchain,
};

/**
 * Rebuild one domain across the standard period set. Returns rows written.
 * Each run is observed in AnalyticsJobRun.
 */
async function runJob(jobName, { actorUserId = null } = {}) {
  if (!JOB_RUNNERS[jobName]) throw new Error(`unknown analytics job: ${jobName}`);
  const startedAt = Date.now();
  const periods = buildPeriods();
  let rows = 0;
  const errors = [];
  for (const period of periods) {
    try {
      rows += await JOB_RUNNERS[jobName](period);
    } catch (err) {
      errors.push(`${period.type}: ${err.message}`);
    }
  }
  const durationMs = Date.now() - startedAt;
  const run = await prisma.analyticsJobRun.create({
    data: {
      job_name: jobName,
      period_type: "all",
      rows_written: rows,
      duration_ms: durationMs,
      status: errors.length ? "failed" : "success",
      error_message: errors.length ? errors.join("; ") : null,
    },
  });
  if (actorUserId) {
    await writeAudit({ actorUserId, action: "ANALYTICS_JOB_RUN", targetType: "analytics_job", targetId: run.id, meta: { job: jobName, rows, duration_ms: durationMs } });
  }
  if (errors.length) logger.warn(`analytics job ${jobName} partial errors: ${errors.join("; ")}`);
  return { job: jobName, rows, duration_ms: durationMs, status: run.status };
}

/** Rebuild every domain (or the requested subset). */
async function rebuildAll({ jobs = ANALYTICS_JOBS.filter((j) => j !== "all"), actorUserId = null } = {}) {
  const results = [];
  for (const job of jobs) results.push(await runJob(job, { actorUserId }));
  const totals = {
    jobs: results.length,
    rows: results.reduce((a, r) => a + r.rows, 0),
    duration_ms: results.reduce((a, r) => a + r.duration_ms, 0),
  };
  return { results, ...totals };
}

module.exports = {
  buildPeriods,
  runJob,
  rebuildAll,
  // individual runners (tests)
  rebuildProduction,
  rebuildCertification,
  rebuildFailures,
  rebuildRegional,
  rebuildLogistics,
  rebuildConsumption,
  rebuildConsumer,
  rebuildTraceability,
  rebuildCompliance,
  rebuildBlockchain,
};
