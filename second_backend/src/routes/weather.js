/**
 * Weather routes — port of routes/weather.py.
 *
 *   GET /api/v1/weather?lat=&lng=    auth required
 */
const express = require("express");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { ok, error } = require("../utils/responses");
const { getWeather } = require("../services/weatherService");

function mountWeather(app) {
  const router = express.Router();

  router.get("/", requireAuth, asyncHandler(async (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || req.query.lat === undefined || req.query.lng === undefined) {
      return error(res, "validation_error", "lat and lng query params required (floats)", 400);
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return error(res, "validation_error", "lat/lng out of range", 400);
    }

    const result = await getWeather(lat, lng);
    return ok(res, { weather: result.payload, cached: result.cached, provider: result.provider });
  }));

  app.use("/api/v1/weather", router);
}

module.exports = { mountWeather };