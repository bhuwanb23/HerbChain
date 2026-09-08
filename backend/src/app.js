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

function createApp(options = {}) {
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
  // Tests may inject extra route mounters (must run before the 404 handler).
  for (const mounter of options.extraRoutes || []) mounter(app);
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
        admin_users: "/api/v1/admin/users",
        species: "/api/v1/species",
        batches: "/api/v1/batches",
        uploads: "/api/v1/uploads",
        identifications: "/api/v1/identifications",
        qr: "/api/v1/qr (validate | transfer | regenerate)",
        transfers: "/api/v1/transfers (request | approve | reject | cancel | execute | recover)",
        batch_ownership: "/api/v1/batches/:id (owner | ownership-history)",
        shipments: "/api/v1/shipments (create | :id/assign | accept | pickup | location | deliver | pod | timeline)",
        labs: "/api/v1/labs (receive | samples | tests | reviews | certificates | reject | analytics)",
        manufacturer: "/api/v1/manufacturer (certified-batches | request-batch | receive | inventory | quality-holds | analytics)",
        products: "/api/v1/products (create | :id/lineage | qr/verify | formulas)",
        manufacturing: "/api/v1/manufacturing (batches create/start/complete/cancel | lots | :lotId/qr | impacts)",
        product_trace: "/api/v1/batches/:batchId/products (forward trace)",
        verify_public: "/verify (scan | product/:token | journey | certificate) — public passport",
        verify_internal: "/api/v1/verify (analytics | scans | alerts | alerts/:id/resolve)",
        blockchain: "/api/v1/blockchain (dashboard | events | transactions | batches/:id | products/:id | verify/:hash | process | requeue | nodes | contracts | audit)",
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
  // New-architecture modules (docs/database/architecture.md §6). Legacy route
  // modules (src/routes/*) belong to the old schema and are ported module by
  // module as each phase lands.
  const { mountAuth } = require("./modules/identity/authRoutes");
  mountAuth(app);

  const { mountAdmin } = require("./modules/identity/adminRoutes");
  mountAdmin(app);

  // Phase 3: batch management (trace module) + species read path + uploads.
  const { mountBatchRoutes } = require("./modules/trace/batchRoutes");
  mountBatchRoutes(app);

  const { mountSpeciesRoutes } = require("./modules/catalogue/speciesRoutes");
  mountSpeciesRoutes(app);

  const { mountUploadRoutes } = require("./modules/uploads/uploadsRoutes");
  mountUploadRoutes(app);

  // Phase 4: AI/ML species identification (identification module).
  const { mountIdentificationRoutes } = require("./modules/identification/identificationRoutes");
  mountIdentificationRoutes(app);

  // Phase 5: dynamic QR engine (validate / transfer / regenerate).
  const { mountQrRoutes } = require("./modules/trace/qrRoutes");
  mountQrRoutes(app);

  // Phase 6: governed two-party ownership transfers (request/approve/execute).
  const { mountTransfersRoutes } = require("./modules/transfers/transfersRoutes");
  mountTransfersRoutes(app);

  // Phase 7: shipment & logistics (create/assign/pickup/track/deliver/pod).
  const { mountShipmentRoutes } = require("./modules/shipments/shipmentsRoutes");
  mountShipmentRoutes(app);

  // Phase 8: laboratory certification (receive/samples/tests/review/COA).
  const { mountLabRoutes } = require("./modules/lab/labRoutes");
  mountLabRoutes(app);

  // Phase 9: manufacturer procurement (certified marketplace, requests,
  // GRN + inventory, quality holds, analytics).
  const { mountManufacturerRoutes } = require("./modules/procurement/procurementRoutes");
  mountManufacturerRoutes(app);

  // Phase 10: products & manufacturing lineage (product masters, runs, lots,
  // permanent product QR, backward/forward trace, recall impact).
  const { mountProductRoutes } = require("./modules/products/productRoutes");
  mountProductRoutes(app);

  // Phase 11: consumer verification portal — public /verify endpoints
  // (rate-limited, no auth) + AYUSH/manufacturer analytics under
  // /api/v1/verify.
  const { mountVerificationRoutes } = require("./modules/verification/verificationRoutes");
  mountVerificationRoutes(app);

  // Phase 12: permissioned blockchain trust layer — event queue worker +
  // governance reads under /api/v1/blockchain.
  const { mountBlockchainRoutes } = require("./modules/blockchain/blockchainRoutes");
  mountBlockchainRoutes(app);

  // Phase 13: AYUSH admin portal — the regulatory control tower
  // (dashboard, universal search, traceability explorers, shipments,
  // failed certifications, compliance alerts, recalls, investigations,
  // scores, notifications, reports, map, audit) under /api/v1/admin/portal.
  const { mountAdminPortalRoutes } = require("./modules/admin/adminPortalRoutes");
  mountAdminPortalRoutes(app);

  // Phase 14: notifications & alerts — the communication layer
  // (inbox, preferences, devices, broadcasts, admin center + analytics)
  // under /api/v1/notifications.
  const { mountNotificationRoutes } = require("./modules/notifications/notificationRoutes");
  mountNotificationRoutes(app);

  // Phase 15: file storage / document management — the evidence repository
  // (uploads, versions, shares, integrity verify, retention, admin) under
  // /api/v1/documents (+ public /shares/:code for consumer passports).
  const { mountDocumentRoutes } = require("./modules/documents/documentRoutes");
  mountDocumentRoutes(app);

  // Phase 16: reporting & analytics — the BI layer. Warehouse dashboards
  // (executive, herbs, certifications, failures, regions, logistics,
  // manufacturers, consumers, traceability, compliance, blockchain) under
  // /api/v1/analytics, report generation + schedules under /api/v1/reports
  // (docs/phase_16.md).
  const { mountAnalyticsRoutes } = require("./modules/analytics/analyticsRoutes");
  mountAnalyticsRoutes(app);

  // Phase 17: offline sync — the rural connectivity layer. Field clients
  // replay their offline queue (POST /sync/upload), pull incremental changes,
  // resolve conflicts and register devices (docs/phase_17.md).
  const { mountSyncRoutes } = require("./modules/sync/syncRoutes");
  mountSyncRoutes(app);

  // Phase A6: support tickets — user help desk under /api/v1/support.
  const { mountSupportRoutes } = require("./modules/support/supportRoutes");
  mountSupportRoutes(app);
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
      return error(res, err.code, err.message, status, err.details || null);
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