/**
 * Document worker (docs/phase_15.md "Document Lifecycle"). Drains queued
 * storage jobs (virus scan / archive) on a timer + at boot. `unref()` keeps
 * the process from hanging on the timer in tests/CLI — tests drive
 * processStorageJobs() directly instead.
 */
const { env } = require("../config/env");
const { getLogger } = require("../config/logging");
const { processStorageJobs, runRetentionScan } = require("./documents");

const logger = getLogger("document-worker");

let timer = null;
let running = false;

async function tick() {
  if (running) return; // never overlap ticks
  running = true;
  try {
    const jobs = await processStorageJobs({ actor: "worker" });
    const retention = await runRetentionScan();
    if (jobs.processed > 0 || retention.marked > 0) {
      logger.info(`document worker: ${jobs.processed} storage job(s) done, ${retention.marked} queued for retention`);
    }
  } catch (err) {
    logger.error(`document worker error: ${err.stack || err}`);
  } finally {
    running = false;
  }
}

function startWorker({ intervalMs = env.DOCUMENT_WORKER_INTERVAL_MS } = {}) {
  if (timer) return timer;
  tick();
  timer = setInterval(tick, Math.max(intervalMs, 100));
  if (timer.unref) timer.unref();
  logger.info(`document worker started (interval ${Math.max(intervalMs, 100)}ms)`);
  return timer;
}

function stopWorker() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = { startWorker, stopWorker, tick };