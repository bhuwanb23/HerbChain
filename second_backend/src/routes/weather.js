/**
 * Weather routes — implemented in the "weather" step.
 */
const express = require("express");

function mountWeather(app) {
  const router = express.Router();
  // TODO(step: weather): GET /?lat=&lng=
  app.use("/api/v1/weather", router);
}

module.exports = { mountWeather };