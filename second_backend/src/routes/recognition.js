/**
 * Recognition routes — implemented in the "recognition" step.
 */
const express = require("express");

function mountRecognition(app) {
  const router = express.Router();
  // TODO(step: recognition): POST /herbs
  app.use("/api/v1/recognition", router);
}

module.exports = { mountRecognition };