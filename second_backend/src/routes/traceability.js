/**
 * Traceability routes — implemented in the "traceability" step.
 */
const express = require("express");

function mountTraceability(app) {
  const router = express.Router();
  // TODO(step: traceability): batch journey / product journey / resolve QR
  app.use("/api/v1/traceability", router);
}

module.exports = { mountTraceability };