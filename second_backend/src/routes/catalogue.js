/**
 * Herb catalogue routes — implemented in the "catalogue" step.
 */
const express = require("express");

function mountCatalogue(app) {
  const router = express.Router();
  // TODO(step: catalogue): list / get one / create / update / deactivate
  app.use("/api/v1/catalogue", router);
}

module.exports = { mountCatalogue };