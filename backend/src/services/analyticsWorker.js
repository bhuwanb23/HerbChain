/**
 * Analytics worker (docs/phase_16.md "KPI Calculation Jobs" + "Scheduled
 * Reports"). On each tick: fire due scheduled reports, run the ETL rebuild
 * (worker cadence, default 30s — production would schedule hourly/daily),
 * then scan analytics thresholds for ComplianceAlert rows. `unref()` keeps
 * the process from hanging on the timer in tests/CLI — tests drive the
 * underlying functions directly.
 */
const { env } = require("../config/env");
const { getLogger } = require("../config/logging");
const { rebuildAll } = require("./analytics");
const { processDueSchedules } = require("./analyticsReports");
const { scanAnalyticsAlerts } = require("./analyticsBi");

const logger = getLogger("analytics-worker");

let timer = null;
let running = false;

async function tick() {
  if (running) return; // never overlap ticks
  running = true;
  try {
    const scheduled = await processDueSchedules();
    if (scheduled.fired > 0) logger.info(`analytics worker: ${scheduled.fired} scheduled reports fired`);
    const etl = await rebuildAll();
    if (etl.jobs > 0) logger.info(`analytics worker: ETL rebuilt ${etl.jobs} jobs, ${etl.rows} rows`);
    const alerts = await scanAnalyticsAlerts();
    if (alerts.created > 0) logger.info(`analytics worker: ${alerts.created} analytics alerts raised`);
  } catch (err) {
    logger.error(`analytics worker error: ${err.stack || err}`);
  } finally {
    running = false;
  }
}

function startWorker({ intervalMs = env.ANALYTICS_WORKER_INTERVAL_MS } = {}) {
  if (timer) return timer;
  tick(); // rebuild once at boot so dashboards are never empty
  timer = setInterval(tick, Math.max(intervalMs, 100));
  if (timer.unref) timer.unref();
  logger.info(`analytics worker started (interval ${Math.max(intervalMs, 100)}ms)`);
  return timer;
}

function stopWorker() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = { startWorker, stopWorker, tick };