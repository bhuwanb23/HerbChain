/**
 * Notification worker (docs/phase_14.md "Notification Queue"). Drains the
 * queue on an interval + once at boot, fires due scheduled notifications and
 * scans the reminder + escalation engines. `unref()` keeps the process from
 * hanging on the timer in tests/CLI — tests drive the functions directly.
 */
const { env } = require("../config/env");
const { getLogger } = require("../config/logging");
const {
  processQueue,
  processScheduled,
  scanReminderEngine,
  scanEscalations,
} = require("./notifications");

const logger = getLogger("notification-worker");

let timer = null;
let running = false;

async function tick() {
  if (running) return; // never overlap ticks
  running = true;
  try {
    const [queue, scheduled, reminders, escalations] = await Promise.all([
      processQueue({ actor: "worker" }),
      processScheduled(),
      scanReminderEngine().catch((err) => {
        logger.error(`reminder scan error: ${err.stack || err}`);
        return { pickup: { created: 0 }, cert: { created: 0 } };
      }),
      scanEscalations().catch((err) => {
        logger.error(`escalation scan error: ${err.stack || err}`);
        return { overdue: 0, created: 0 };
      }),
    ]);
    if (queue.processed > 0 || queue.failed > 0) {
      logger.info(`notification worker: ${queue.processed} delivered, ${queue.failed} failed`);
    }
    if (scheduled.fired > 0) logger.info(`notification worker: ${scheduled.fired} scheduled fired`);
    if (reminders.pickup.created + reminders.cert.created + escalations.created > 0) {
      logger.info(
        `notification worker: reminders pickup=${reminders.pickup.created} cert=${reminders.cert.created} escalations=${escalations.created}`
      );
    }
  } catch (err) {
    logger.error(`notification worker error: ${err.stack || err}`);
  } finally {
    running = false;
  }
}

function startWorker({ intervalMs = env.NOTIFICATION_WORKER_INTERVAL_MS } = {}) {
  if (timer) return timer;
  tick(); // drain anything queued before boot
  timer = setInterval(tick, Math.max(intervalMs, 100));
  if (timer.unref) timer.unref();
  logger.info(`notification worker started (interval ${Math.max(intervalMs, 100)}ms)`);
  return timer;
}

function stopWorker() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = { startWorker, stopWorker, tick };