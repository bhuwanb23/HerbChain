/**
 * Price routes — implemented in the "prices" step.
 */
const express = require("express");

function mountPrices(app) {
  const router = express.Router();
  // TODO(step: prices): list latest / history / admin create
  app.use("/api/v1/prices", router);
}

module.exports = { mountPrices };