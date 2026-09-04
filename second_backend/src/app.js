/**
 * HerbChain Node backend — Express app factory.
 *
 * Mirrors backend/server/app.py: CORS, JSON body parsing, request logging,
 * the `{data, error}` envelope, and core health routes.
 *
 * API blueprints (auth, batches, ...) are mounted in `_mountRoutes`;
 * each route module is added in its own implementation step.
 */
const express = require("express");
const cors = require("cors");
const { env, corsOriginList } = require("./config/env");
const { getLogger } = require("./config/logging");
const { ok, error } = require("./utils/responses");

const logger = getLogger("api");

function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors({ origin: corsOriginList(), credentials: false }));
  app.use(express.json({ limit: env.MAX_CONTENT_LENGTH }));

  // Request logging (mirrors config/logging.py before/after request hooks)
  app.use((req, res, next) => {
    const started = Date.now();
    res.on("finish", () => {
      logger.info(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - started}ms)`);
    });
    next();
  });

  _mountCoreRoutes(app);
  _mountRoutes(app);
  _mountErrorHandlers(app);

  return app;
}

// ------------------------------------------------------------------ core

function _mountCoreRoutes(app) {
  app.get("/", (req, res) => {
    res.json({
      name: "HerbChain Backend (Node)",
      status: "ok",
      version: "1.0.0",
      endpoints: {
        health: "/health",
        ping: "/api/v1/ping",
        auth: "/api/v1/auth",
        batches: "/api/v1/batches",
        lab_reports: "/api/v1/lab-reports",
        products: "/api/v1/products",
        traceability: "/api/v1/traceability",
        admin: "/admin",
      },
    });
  });

  app.get("/health", (req, res) => {
    res.json({ status: "healthy" });
  });

  app.get("/api/v1/ping", (req, res) => {
    ok(res, { message: "pong" });
  });
}

// ------------------------------------------------------------ blueprints
//
// Each route module follows the same shape:
//   module.exports = function mount(app) { app.use("/api/v1/auth", router); }
// They are added one at a time in later steps.

function _mountRoutes(app) {
  const { mountAuth } = require("./routes/auth");
  mountAuth(app);

  const { mountBatches } = require("./routes/batches");
  mountBatches(app);

  const { mountLabReports } = require("./routes/labReports");
  mountLabReports(app);

  const { mountProducts } = require("./routes/products");
  mountProducts(app);

  const { mountTraceability } = require("./routes/traceability");
  mountTraceability(app);

  const { mountAdmin } = require("./routes/admin");
  mountAdmin(app);

  const { mountCatalogue } = require("./routes/catalogue");
  mountCatalogue(app);

  const { mountFarm } = require("./routes/farm");
  mountFarm(app);

  const { mountCropPlans } = require("./routes/cropPlans");
  mountCropPlans(app);

  const { mountRecognition } = require("./routes/recognition");
  mountRecognition(app);

  const { mountWeather } = require("./routes/weather");
  mountWeather(app);

  const { mountPrices } = require("./routes/prices");
  mountPrices(app);
}

// ------------------------------------------------------------- error box

function _mountErrorHandlers(app) {
  // JSON body parse errors -> 400 envelope
  app.use((err, req, res, next) => {
    if (err && err.type === "entity.parse.failed") {
      return error(res, "bad_request", "Invalid JSON body", 400);
    }
    if (err && err.type === "entity.too.large") {
      return error(res, "bad_request", "Request body too large", 413);
    }
    next(err);
  });

  // Application errors (ApiError / TransferError) -> mapped status codes
  const { ApiError, TransferError, transferErrorStatus } = require("./utils/errors");
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
      const status =
        err instanceof TransferError ? transferErrorStatus(err.code) : err.status || 400;
      return error(res, err.code, err.message, status);
    }
    return next(err);
  });

  // 404 for anything unmatched
  app.use((req, res) => {
    error(res, "not_found", "Resource not found", 404);
  });

  // 500 handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    logger.error(`500 internal error: ${err.stack || err}`);
    error(res, "internal_error", "Internal server error", 500);
  });
}

module.exports = { createApp };