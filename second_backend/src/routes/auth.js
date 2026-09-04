/**
 * Auth routes — implemented in the "auth" step.
 */
const express = require("express");

function mountAuth(app) {
  const router = express.Router();
  // TODO(step: auth): register / login / refresh / me
  app.use("/api/v1/auth", router);
}

module.exports = { mountAuth };