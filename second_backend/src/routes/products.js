/**
 * Product routes — implemented in the "transfer" step.
 */
const express = require("express");

function mountProducts(app) {
  const router = express.Router();
  // TODO(step: transfer): create / mine / get / qr
  app.use("/api/v1/products", router);
}

module.exports = { mountProducts };