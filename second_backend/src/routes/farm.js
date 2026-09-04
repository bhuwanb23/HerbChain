/**
 * Farm profile routes — implemented in the "farm" step.
 */
const express = require("express");

function mountFarm(app) {
  const router = express.Router();
  // TODO(step: farm): GET/PUT/DELETE /me
  app.use("/api/v1/farm", router);
}

module.exports = { mountFarm };