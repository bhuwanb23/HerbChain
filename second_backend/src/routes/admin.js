/**
 * Admin routes — implemented in the "admin" step.
 */
const express = require("express");

function mountAdmin(app) {
  const router = express.Router();
  // TODO(step: admin): stats / users / batches / products / lab-reports / events / logs / health
  app.use("/admin", router);
}

module.exports = { mountAdmin };