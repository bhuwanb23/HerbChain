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
}

main();