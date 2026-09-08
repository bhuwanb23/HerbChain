// ============================================================================
// PRICES ROUTES — /api/v1/prices (Phase A9 lite)
// ---------------------------------------------------------------------------
const express = require("express");
const { z } = require("zod");
const { ok, error } = require("../../utils/responses");
const { requireAuth, requirePermission } = require("../../middleware/auth");
const prices = require("../../services/pricesService");

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const createBody = z.object({
  species_id: z.string().min(1),
  price_per_kg: z.number().positive(),
  market: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

function mountPricesRoutes(app) {
  const router = express.Router();

  // Public: list latest reference prices (farmers)
  router.get("/", wrap(async (req, res) => {
    const data = await prices.listPrices({
      species_id: req.query.species_id || null,
      market: req.query.market || null,
      limit: req.query.limit ? parseInt(req.query.limit, 10) : 50,
    });
    return ok(res, data);
  }));

  // Admin: create price quote
  router.post("/", requireAuth, requirePermission("admin.manage"), wrap(async (req, res) => {
    const parsed = createBody.safeParse(req.body || {});
    if (!parsed.success) return error(res, "bad_request", "Invalid price data", 400, parsed.error.flatten());
    const row = await prices.createPrice(req.user, parsed.data);
    return ok(res, { price: row }, 201);
  }));

  app.use("/api/v1/prices", router);
}

module.exports = { mountPricesRoutes };
