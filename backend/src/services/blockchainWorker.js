/**
 * Blockchain queue worker (docs/phase_12.md "Event Queue Architecture").
 *
 * The app NEVER calls the ledger from request handlers. This worker drains
 * the queue on an interval (and once at boot): pending rows that are due get
 * hashed, contract-validated and anchored. `unref()` keeps the process from
 * hanging on the timer in tests/CLI — tests drive `processQueue()` directly
 * instead (deterministic), and the live server runs the interval.
 */
const { env } = require("../config/env");
const { getLogger } = require("../config/logging");
const { processQueue } = require("./blockchain");

const logger = getLogger("blockchain-worker");

let timer = null;
let running = false;

async function tick() {
  if (running) return; // never overlap ticks
  running = true;
  try {
    const out = await processQueue({ actor: "worker" });
    if (out.processed > 0) {
      logger.info(`blockchain worker: ${out.processed} queue row(s) processed`);
    }
  } catch (err) {
    logger.error(`blockchain worker error: ${err.stack || err}`);
  } finally {
    running = false;
  }
}

function startWorker({ intervalMs = env.BLOCKCHAIN_WORKER_INTERVAL_MS } = {}) {
  if (timer) return timer;
  tick(); // drain anything queued before boot
  timer = setInterval(tick, Math.max(intervalMs, 100));
  if (timer.unref) timer.unref();
  logger.info(`blockchain worker started (interval ${Math.max(intervalMs, 100)}ms)`);
  return timer;
}

function stopWorker() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = { startWorker, stopWorker, tick };