/**
 * BI read service (docs/phase_16.md "Analytics Modules"). Every dashboard
 * endpoint reads ONLY the pre-aggregated warehouse tables — never the
 * operational tables (the ETL jobs in analytics.js are the sole writers).
 * Role scoping: admins/regulators see everything; farms, labs and
 * manufacturers see their own slice (self scope).
 */
const { prisma } = require("../db/client");
const { ALERT_THRESHOLDS } = require("../constants/analytics");

// ------------------------------------------------------------ scope

const ADMIN_ROLES = new Set(["admin"]);

function scopedWhere(user, ownField, extra = {}) {
  if (ADMIN_ROLES.has(user.role)) return { period_type: "all", ...extra };
  if (user.role === "manufacturer" || user.role === "lab" || user.role === "farmer") {
    const isManufacturer = user.role === "manufacturer";
    const isLab = user.role === "lab";
    return {
      period_type: "all",
      ...(isManufacturer ? { manufacturer_user_id: user.id } : {}),
      ...(isLab ? { lab_user_id: user.id } : {}),
      ...(isManufacturer || isLab || user.role === "farmer" ? {} : {}),
      ...extra,
    };
  }
  return { period_type: "all", ...extra };
}

// --------------------------------------------------------- dashboard

/**
 * Executive AYUSH dashboard — the national overview. Totals are lightweight
 * counts on operational tables (cheap), all KPI bullets come from the
 * warehouse `all` rows.
 */
async function executiveDashboard() {
  const [farmers, labs, manufacturers, products, batches, lots, shipments, users, scans] = await Promise.all([
    prisma.user.count({ where: { role: "farmer" } }),
    prisma.user.count({ where: { role: "lab" } }),
    prisma.user.count({ where: { role: "manufacturer" } }),
    prisma.product.count(),
    prisma.batch.count(),
    prisma.productLot.count(),
    prisma.shipment.count({ where: { status: { in: ["picked_up", "in_transit", "assigned"] } } }),
    prisma.user.count({ where: { is_active: true } }),
    prisma.consumerScan.count(),
  ]);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const [todayBatches, todayCerts, pendingApprovals, openAlerts] = await Promise.all([
    prisma.batch.count({ where: { created_at: { gte: today } } }),
    prisma.certification.count({ where: { issued_at: { gte: today } } }),
    prisma.verificationRequest.count({ where: { status: "pending" } }),
    prisma.complianceAlert.count({ where: { status: "open" } }),
  ]);

  // Warehouse reads — latest `all` rows.
  const [production, cert, logistics, compliance, traceability, blockchain] = await Promise.all([
    prisma.herbProductionAnalytics.findMany({ where: { period_type: "all" }, orderBy: { total_quantity_kg: "desc" } }),
    prisma.certificationAnalytics.findFirst({ where: { period_type: "all", lab_user_id: null } }),
    prisma.logisticsAnalytics.findFirst({ where: { period_type: "all", transporter_user_id: null } }),
    prisma.complianceAnalytics.findFirst({ where: { period_type: "all", actor_type: "all" } }),
    prisma.traceabilityAnalytics.findMany({ where: { period_type: "all" }, orderBy: { avg_score: "desc" } }),
    prisma.blockchainAnalytics.findFirst({ where: { period_type: "all", event_type: "ALL" } }),
  ]);

  const totalKg = production.reduce((a, r) => a + r.total_quantity_kg, 0);
  const traceableRows = traceability.filter((r) => r.total_products > 0);
  const avgTrace = traceableRows.length
    ? Math.round((traceableRows.reduce((a, r) => a + r.avg_score, 0) / traceableRows.length) * 100) / 100
    : 0;

  const certRows = await prisma.certificationAnalytics.findMany({ where: { period_type: "all" } });
  const certAll = certRows.find((r) => r.lab_user_id === null) || { total_tests: 0, pass_count: 0, certificates_issued: 0 };
  const passRate = certAll.total_tests > 0 ? Math.round((certAll.pass_count / certAll.total_tests) * 10000) / 100 : 0;

  const logisticsAll = logistics || { total_shipments: 0, on_time: 0, delivered: 0 };

  return {
    national: {
      total_farmers: farmers, total_labs: labs, total_manufacturers: manufacturers,
      total_products: products, total_batches: batches, total_product_lots: lots,
      total_users: users, active_shipments: shipments, total_consumer_scans: scans,
    },
    today: {
      batches: todayBatches, certifications: todayCerts, pending_approvals: pendingApprovals, open_alerts: openAlerts,
    },
    strategic_kpis: {
      national_production_kg: Math.round(totalKg * 100) / 100,
      certification_pass_rate: passRate,
      certificates_issued: certAll.certificates_issued,
      supply_chain: {
        total_shipments: logisticsAll.total_shipments,
        on_time: logisticsAll.on_time,
        on_time_pct: logisticsAll.total_shipments > 0 ? Math.round((logisticsAll.on_time / logisticsAll.total_shipments) * 10000) / 100 : 0,
      },
      compliance_health: compliance ? { avg_score: compliance.avg_score, open_critical_alerts: compliance.alerts_critical, open_alerts: compliance.alerts_open } : null,
      traceability: { avg_score: avgTrace, products_evaluated: traceableRows.length },
      blockchain: blockchain ? { events: blockchain.events_count, failed_syncs: blockchain.failed_syncs, verified: blockchain.verified_checks, tampered: blockchain.tampered_checks } : null,
    },
    top_herbs: production.slice(0, 5).map((r) => ({ herb: r.herb_name, code: r.herb_code, quantity_kg: r.total_quantity_kg, batches: r.total_batches })),
  };
}

// --------------------------------------------------------- domains

async function herbAnalytics({ species_id = null, limit = 20, user = null } = {}) {
  return prisma.herbProductionAnalytics.findMany({
    where: { period_type: "all", ...(species_id ? { herb_id: species_id } : {}) },
    orderBy: { total_quantity_kg: "desc" },
    take: Math.min(limit, 100),
  });
}

async function certificationAnalytics({ lab_user_id = null, user = null } = {}) {
  const self = user && (user.role === "lab") ? { lab_user_id: user.id } : {};
  const scope = lab_user_id || self.lab_user_id || null;
  const where = { period_type: "all", ...(scope ? { lab_user_id: scope } : {}) };
  const rows = await prisma.certificationAnalytics.findMany({ where, orderBy: { certificates_issued: "desc" } });
  // Exclude the national rollup row (lab_user_id null) from sums — it already
  // aggregates every lab; summing it with the per-lab rows would double-count.
  const sumRows = rows.filter((r) => r.lab_user_id !== null);
  const total_tests = sumRows.reduce((a, r) => a + r.total_tests, 0);
  const pass = sumRows.reduce((a, r) => a + r.pass_count, 0);
  return { rows, summary: { total_tests, pass_count: pass, fail_count: sumRows.reduce((a, r) => a + r.fail_count, 0), pass_rate: total_tests > 0 ? Math.round((pass / total_tests) * 10000) / 100 : 0 } };
}

async function failureAnalytics(user) {
  const rows = await prisma.failureReasonAnalytics.findMany({ where: { period_type: "all" }, orderBy: { count: "desc" } });
  return { rows: rows.filter((r) => r.count > 0) };
}

async function regionalAnalytics(user) {
  const rows = await prisma.regionalSupplyAnalytics.findMany({ where: { period_type: "all" }, orderBy: { production_kg: "desc" } });
  const byState = new Map();
  for (const r of rows) {
    const cur = byState.get(r.state) || { state: r.state, production_kg: 0, total_batches: 0, certified_batches: 0 };
    cur.production_kg += r.production_kg;
    cur.total_batches += r.total_batches;
    cur.certified_batches += r.certified_batches;
    byState.set(r.state, cur);
  }
  return { states: [...byState.values()].sort((a, b) => b.production_kg - a.production_kg), rows };
}

async function logisticsAnalytics({ transporter_user_id = null, user = null } = {}) {
  const self = user && user.role === "transporter" ? { transporter_user_id: user.id } : {};
  const scope = transporter_user_id || self.transporter_user_id || null;
  const where = { period_type: "all", ...(scope ? { transporter_user_id: scope } : {}) };
  const rows = await prisma.logisticsAnalytics.findMany({ where, orderBy: { total_shipments: "desc" } });
  const all = rows.find((r) => r.transporter_user_id === null);
  return { rows: rows.filter((r) => r.transporter_user_id !== null), total: all };
}

async function manufacturerAnalytics({ manufacturer_user_id = null, user = null } = {}) {
  const self = user && user.role === "manufacturer" ? { manufacturer_user_id: user.id } : {};
  const scope = manufacturer_user_id || self.manufacturer_user_id || null;
  const where = { period_type: "all", ...(scope ? { manufacturer_user_id: scope } : {}) };
  return prisma.manufacturerConsumptionAnalytics.findMany({
    where, orderBy: { consumed_kg: "desc" },
  });
}

async function consumerAnalytics(user) {
  const rows = await prisma.consumerAnalytics.findMany({
    where: { period_type: "all", ...(user && user.role === "manufacturer" ? { product_id: { not: null } } : {}) },
    orderBy: { scan_count: "desc" },
    take: 100,
  });
  return rows;
}

async function traceabilityAnalytics(user) {
  const rows = await prisma.traceabilityAnalytics.findMany({ where: { period_type: "all" }, orderBy: { avg_score: "desc" } });
  const evaluated = rows.filter((r) => r.total_products > 0);
  const avg = evaluated.length ? Math.round((evaluated.reduce((a, r) => a + r.avg_score, 0) / evaluated.length) * 100) / 100 : 0;
  const missing = rows.filter((r) => r.avg_score < 40);
  return {
    rows,
    summary: {
      products_evaluated: rows.length,
      avg_score: avg,
      fully_traceable: rows.filter((r) => r.avg_score >= 100).length,
      fully_traceable_pct: rows.length > 0 ? Math.round((rows.filter((r) => r.avg_score >= 100).length / rows.length) * 10000) / 100 : 0,
      at_risk_products: rows.filter((r) => r.avg_score < 40).length,
    },
  };
}

async function complianceAnalytics(user) {
  const rows = await prisma.complianceAnalytics.findMany({
    where: { period_type: "all" },
    orderBy: { alerts_critical: "desc" },
  });
  const scores = await prisma.complianceScore.findMany({ orderBy: { score: "asc" } });
  return { rows, scores: scores.slice(0, 10) };
}

async function blockchainAnalytics(user) {
  const [rows, queue] = await Promise.all([
    prisma.blockchainAnalytics.findMany({ where: { period_type: "all" }, orderBy: { events_count: "desc" } }),
    prisma.blockchainEvent.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const all = rows.find((r) => r.event_type === "ALL");
  return { rows: rows.filter((r) => r.event_type !== "ALL"), total: all, queue };
}

// ------------------------------------------------------------ alerts

const ALERT_DEDUP_HOURS = 24;

/**
 * Alert-based analytics (spec): compare freshly rebuilt KPI rows against
 * thresholds and raise ComplianceAlert rows (Phase 13 engine) when breached.
 * Idempotent — an alert type/entity pair is only raised once per cooldown
 * window (or while still open).
 */
async function scanAnalyticsAlerts() {
  const created = [];
  const logger = require("../config/logging").getLogger("analytics-alerts");

  // 1. Lab failure rate > threshold (the `all` bucket, per lab).
  const labs = await prisma.certificationAnalytics.findMany({
    where: { period_type: "all", lab_user_id: { not: null } },
    orderBy: { fail_count: "desc" },
  });
  for (const lab of labs) {
    const total = lab.total_tests || 0;
    if (total < 5) continue; // noise guard — too few tests to judge
    const failRate = (lab.fail_count / total) * 100;
    if (failRate <= ALERT_THRESHOLDS.LAB_FAILURE_RATE) continue;
    const ok = await raiseAlert({
      alert_type: "LAB_FAILURE_RATE",
      severity: "HIGH",
      title: `Lab failure rate ${failRate.toFixed(1)}% exceeds ${ALERT_THRESHOLDS.LAB_FAILURE_RATE}%`,
      description: `${lab.fail_count}/${total} tests failed for ${lab.lab_name || "a lab"} over the full period.`,
      entity_type: "lab", entity_id: lab.lab_user_id,
    });
    if (ok) created.push(`LAB_FAILURE_RATE:${lab.lab_user_id}`);
  }

  // 2. Species-mismatch spike — current month vs previous month (>=300%).
  const now = new Date();
  const curStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const prevStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const [curMismatch, prevMismatch] = await Promise.all([
    prisma.failureReasonAnalytics.findMany({ where: { period_type: "monthly", period_start: curStart, reason: "species_mismatch" } }),
    prisma.failureReasonAnalytics.findMany({ where: { period_type: "monthly", period_start: prevStart, reason: "species_mismatch" } }),
  ]);
  const curCount = curMismatch.reduce((a, r) => a + r.count, 0);
  const prevCount = prevMismatch.reduce((a, r) => a + r.count, 0);
  if (prevCount > 0 && curCount >= prevCount + Math.ceil((prevCount * ALERT_THRESHOLDS.SPECIES_MISMATCH_SPIKE) / 100)) {
    const growth = Math.round((((curCount - prevCount) / prevCount) * 100)) ;
    const ok = await raiseAlert({
      alert_type: "SPECIES_MISMATCH_SPIKE",
      severity: "HIGH",
      title: `Species mismatches up ${growth}% month-over-month`,
      description: `${curCount} species-mismatch rejections this month vs ${prevCount} last month.`,
      entity_type: null, entity_id: null,
    });
    if (ok) created.push(`SPECIES_MISMATCH_SPIKE:${curStart.toISOString()}`);
  }

  // 3. Counterfeit scan volume — per product per month.
  const consumerRows = await prisma.consumerAnalytics.findMany({
    where: { period_type: "monthly", period_start: curStart, invalid_scans: { gt: 0 } },
    orderBy: { invalid_scans: "desc" },
  });
  for (const row of consumerRows) {
    if (row.invalid_scans < ALERT_THRESHOLDS.COUNTERFEIT_SCANS) continue;
    const ok = await raiseAlert({
      alert_type: "COUNTERFEIT_SURGE",
      severity: "MEDIUM",
      title: `${row.invalid_scans} invalid consumer scans for ${row.product_name || "a product"}`,
      description: `Invalid scan volume passed the ${ALERT_THRESHOLDS.COUNTERFEIT_SCANS}-scan threshold this month.`,
      entity_type: "product", entity_id: row.product_id,
    });
    if (ok) created.push(`COUNTERFEIT_SURGE:${row.product_id}`);
  }

  return { created: created.length, alerts: created };
}

/** Raise a ComplianceAlert unless one for the pair is open / fresh. */
/**
 * Deduplicated alert insert. Generates the unique alert_no (ALT-YYYY-NNNNNN)
 * the same way adminPortal does — the analytics engine is just another
 * auto-raising rules source (created_by_user_id stays null).
 */
async function raiseAlert({ alert_type, severity, title, description, entity_type, entity_id }) {
  const since = new Date(Date.now() - ALERT_DEDUP_HOURS * 3600000);
  const existing = await prisma.complianceAlert.findFirst({
    where: {
      alert_type,
      ...(entity_type ? { entity_type } : {}),
      ...(entity_id ? { entity_id } : {}),
      created_at: { gte: since },
    },
  });
  if (existing) return false;
  const year = new Date().getFullYear();
  const pre = `ALT-${year}-`;
  const count = await prisma.complianceAlert.count({ where: { alert_no: { startsWith: pre } } });
  await prisma.complianceAlert.create({
    data: {
      alert_no: `${pre}${String(count + 1).padStart(6, "0")}`,
      alert_type, severity, title, description, entity_type, entity_id,
      status: "open", detail_json: { source: "analytics_engine" },
    },
  });
  return true;
}

module.exports = {
  executiveDashboard,
  herbAnalytics,
  certificationAnalytics,
  failureAnalytics,
  regionalAnalytics,
  logisticsAnalytics,
  manufacturerAnalytics,
  consumerAnalytics,
  traceabilityAnalytics,
  complianceAnalytics,
  blockchainAnalytics,
  scanAnalyticsAlerts,
  raiseAlert,
};