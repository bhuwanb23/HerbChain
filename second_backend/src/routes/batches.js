/**
 * Batch routes — implemented in the "transfer" step.
 */
const express = require("express");

function mountBatches(app) {
  const router = express.Router();
  // TODO(step: transfer): create / mine / get / qr / transfer / split / available / events
  app.use("/api/v1/batches", router);
}

module.exports = { mountBatches };