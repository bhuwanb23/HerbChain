/**
 * Lab report routes — implemented in the "transfer" step.
 */
const express = require("express");

function mountLabReports(app) {
  const router = express.Router();
  // TODO(step: transfer): create / list for batch / get one
  app.use("/api/v1/lab-reports", router);
}

module.exports = { mountLabReports };