/**
 * Traceability routes — port of routes/traceability.py.
 *
 * Public, read-only, no auth required — powers the consumer app's
 * "Scan & see the whole journey" feature.
 *
 *   GET  /api/v1/traceability/batch/<batch_id>     batch journey
 *   GET  /api/v1/traceability/product/<product_id> product lineage
 *   POST /api/v1/traceability/resolve              body={qr_token}
 */
const express = require("express");
const { asyncHandler } = require("../utils/asyncHandler");
const { ok, error } = require("../utils/responses");
const qrService = require("../services/qrService");
const {
  buildBatchJourney,
  buildProductJourney,
} = require("../services/traceabilityService");

function mountTraceability(app) {
  const router = express.Router();

  router.get("/", (req, res) => {
    ok(res, {
      endpoints: {
        batch_journey: "GET /api/v1/traceability/batch/<batch_id>",
        product_journey: "GET /api/v1/traceability/product/<product_id>",
        resolve_qr: "POST /api/v1/traceability/resolve  body={qr_token}",
      },
    });
  });

  router.get("/batch/:batch_id", asyncHandler(async (req, res) => {
    const journey = await buildBatchJourney(req.params.batch_id);
    if (!journey) return error(res, "not_found", `No batch '${req.params.batch_id}' found`, 404);
    return ok(res, journey);
  }));

  router.get("/product/:product_id", asyncHandler(async (req, res) => {
    const journey = await buildProductJourney(req.params.product_id);
    if (!journey) return error(res, "not_found", `No product '${req.params.product_id}' found`, 404);
    return ok(res, journey);
  }));

  router.post("/resolve", asyncHandler(async (req, res) => {
    const data = req.body ?? {};
    const token = String(data.qr_token || "").trim();
    if (!token) return error(res, "bad_request", "qr_token is required", 400);

    // Try product first (cheaper claims)
    try {
      const productClaims = qrService.verifyProductQr(token);
      const journey = await buildProductJourney(productClaims.productId);
      if (!journey) return error(res, "not_found", "Product not found", 404);
      return ok(res, { kind: "product", journey });
    } catch (err) {
      if (!(err instanceof qrService.QrError)) throw err;
    }

    try {
      const batchClaims = qrService.verifyBatchQr(token);
      const journey = await buildBatchJourney(batchClaims.batchId);
      if (!journey) return error(res, "not_found", "Batch not found", 404);
      return ok(res, { kind: "batch", journey });
    } catch (err) {
      if (err instanceof qrService.QrError) {
        return error(res, "invalid_qr", err.message, 400);
      }
      throw err;
    }
  }));

  app.use("/api/v1/traceability", router);
}

module.exports = { mountTraceability };