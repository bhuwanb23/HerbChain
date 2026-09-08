/**
 * HerbChain Node backend — entry point.
 *
 *   npm run dev     -> node --watch src/index.js
 *   npm start       -> node src/index.js
 */
const { createApp } = require("./app");
const { env } = require("./config/env");
const { getLogger } = require("./config/logging");

const logger = getLogger("main");

function main() {
  const app = createApp();

  app.listen(env.PORT, env.HOST, () => {
    logger.info(`HerbChain backend listening on http://${env.HOST}:${env.PORT}`);
    logger.info(`Database: ${env.DATABASE_URL}`);
  });

  // Phase 12: drain the blockchain event queue in the background (the API
  // never calls the ledger directly — docs/phase_12.md "Event Queue").
  if (env.BLOCKCHAIN_WORKER_ENABLED) {
    const { startWorker } = require("./services/blockchainWorker");
    startWorker();
  }

  // Phase 14: notification queue worker — deliver queued messages, fire
  // scheduled reminders/escalations in the background (docs/phase_14.md).
  if (env.NOTIFICATION_WORKER_ENABLED) {
    const { startWorker: startNotifWorker } = require("./services/notificationWorker");
    startNotifWorker();
  }

  // Phase 15: document worker — virus-scan + retention/archive storage jobs.
  if (env.DOCUMENT_WORKER_ENABLED) {
    const { startWorker: startDocWorker } = require("./services/documentWorker");
    startDocWorker();
  }

  // Phase 16: analytics worker — ETL rebuild + due scheduled reports +
  // threshold alerts (docs/phase_16.md "KPI Calculation Jobs").
  if (env.ANALYTICS_WORKER_ENABLED) {
    const { startWorker: startAnalyticsWorker } = require("./services/analyticsWorker");
    startAnalyticsWorker();
  }
}

main();