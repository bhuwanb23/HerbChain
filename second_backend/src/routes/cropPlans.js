/**
 * Crop plan routes — implemented in the "farm" step.
 */
const express = require("express");

function mountCropPlans(app) {
  const router = express.Router();
  // TODO(step: farm): CRUD on /api/v1/crop-plans
  app.use("/api/v1/crop-plans", router);
}

module.exports = { mountCropPlans };