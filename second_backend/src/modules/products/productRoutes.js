/**
 * Products & manufacturing API — Phase 10 (docs/phase_10.md).
 *
 *   POST   /api/v1/products                       create a product master
 *   GET    /api/v1/products                       list mine (admin: all)
 *   GET    /api/v1/products/:id                   product detail + formula/runs
 *   PATCH  /api/v1/products/:id                   update / lifecycle status
 *   POST   /api/v1/products/:id/formulas          add a standard recipe line
 *   DELETE /api/v1/products/:id/formulas/:fid     remove a formula line
 *   GET    /api/v1/products/:id/lineage           BACKWARD trace (spec §8)
 *   POST   /api/v1/products/qr/verify             scan a product QR (consumer)
 *
 *   POST   /api/v1/manufacturing/batches          create a planned run (reserves)
 *   GET    /api/v1/manufacturing/batches          list my runs (admin: all)
 *   GET    /api/v1/manufacturing/batches/:id      run dossier (ingredients)
 *   POST   /api/v1/manufacturing/batches/:id/start     planned -> in_progress
 *   POST   /api/v1/manufacturing/batches/:id/complete  consume + lot + QR
 *   POST   /api/v1/manufacturing/batches/:id/cancel    release reservations
 *   GET    /api/v1/manufacturing/lots             finished lots (mine)
 *   GET    /api/v1/manufacturing/lots/:lotId      lot detail + lineage
 *   GET    /api/v1/manufacturing/lots/:lotId/qr   reprint the permanent QR card
 *   GET    /api/v1/manufacturing/dashboard        production KPIs (spec §15)
 *   GET    /api/v1/manufacturing/impacts          recall blast radius (spec §10)
 *   POST   /api/v1/manufacturing/impacts          flag a batch -> affected rows
 *   POST   /api/v1/manufacturing/impacts/:id/resolve
 *
 *   GET    /api/v1/batches/:batchId/products      FORWARD trace (spec §9)
 */
const express = require("express");
const { z } = require("zod");
const { ok, error } = require("../../utils/responses");
const { requireAuth, requirePermission } = require("../../middleware/auth");
const {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  addFormula,
  removeFormula,
  createRun,
  startRun,
  completeRun,
  cancelRun,
  listRuns,
  getRun,
  getLot,
  listLots,
  productLineage,
  batchForwardTrace,
  verifyProductQr,
  lotQrCard,
  assessBatchImpact,
  listAffectedProducts,
  resolveAffectedProduct,
  dashboard,
} = require("../../services/products");
const {
  serializeProduct,
  serializeProductDetail,
  serializeRun,
  serializeLot,
  serializeLotLight,
  serializeQrCard,
  serializeProductQrResult,
  serializeFormula,
  serializeLineageProduct,
  serializeForwardTrace,
  serializeAffected,
} = require("./productsSerializer");

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const optStr = (max) => z.string().trim().max(max).optional().nullable();
const optNum = z.coerce.number().optional().nullable();

const productSchema = z.object({
  name: z.string().trim().min(1).max(200),
  sku: optStr(100),
  description: optStr(4000),
  category: optStr(50).default("other"),
  pack_size: optStr(100),
  expiry_months: optNum,
});
const updateSchema = z.object({
  name: optStr(200),
  sku: optStr(100),
  description: optStr(4000),
  category: optStr(50),
  pack_size: optStr(100),
  expiry_months: optNum,
  status: optStr(20),
});
const formulaSchema = z.object({
  species_code: z.string().trim().min(1),
  standard_quantity: optNum,
  unit: optStr(20),
});
const ingredientSchema = z.object({
  batch_id: z.string().min(1),
  quantity_kg: z.coerce.number().positive(),
});
const runSchema = z.object({
  product_id: z.string().min(1),
  planned_units: z.coerce.number().int().positive(),
  notes: optStr(2000),
  ingredients: z.array(ingredientSchema).min(1).max(50),
});
const cancelSchema = z.object({ reason: optStr(1000) });
const impactSchema = z.object({
  batch_id: z.string().min(1),
  impact_type: z.string().trim().min(1).max(50),
  notes: optStr(2000),
});
const verifySchema = z.object({ token: z.string().min(10, "token looks truncated") });

function mountProductRoutes(app) {
  const products = express.Router();

  // --------------------------------------------------------- products
  products.post(
    "/",
    requireAuth,
    requirePermission("product.create"),
    wrap(async (req, res) => {
      const parsed = productSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "name is required", 400);
      const product = await createProduct(req.user, parsed.data);
      return ok(res, { product: serializeProduct(product) }, 201);
    })
  );

  products.get(
    "/",
    requireAuth,
    wrap(async (req, res) => {
      const { status = null, limit, offset } = req.query;
      const { products: items, total } = await listProducts(req.user, { status, limit, offset });
      return ok(res, { products: items.map(serializeProduct), total });
    })
  );

  products.post(
    "/qr/verify",
    requireAuth,
    wrap(async (req, res) => {
      const parsed = verifySchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "token is required", 400);
      const out = await verifyProductQr({
        token: parsed.data.token,
        actor: req.user,
        meta: { deviceId: req.headers["x-device-id"] || null, ip: req.ip || null, gpsLat: req.body?.gps_lat ?? null, gpsLng: req.body?.gps_lng ?? null },
      });
      return ok(res, out);
    })
  );

  products.get(
    "/:id",
    requireAuth,
    wrap(async (req, res) => {
      const product = await getProduct(req.user, req.params.id);
      return ok(res, { product: serializeProductDetail(product) });
    })
  );

  products.patch(
    "/:id",
    requireAuth,
    requirePermission("product.create"),
    wrap(async (req, res) => {
      const parsed = updateSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "Invalid payload", 400);
      const product = await updateProduct(req.user, { product_id: req.params.id, ...parsed.data });
      return ok(res, { product: serializeProductDetail(product) });
    })
  );

  products.post(
    "/:id/formulas",
    requireAuth,
    requirePermission("product.create"),
    wrap(async (req, res) => {
      const parsed = formulaSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "species_code is required", 400);
      const formula = await addFormula(req.user, { product_id: req.params.id, ...parsed.data });
      return ok(res, { formula: serializeFormula(formula) }, 201);
    })
  );

  products.delete(
    "/:id/formulas/:fid",
    requireAuth,
    requirePermission("product.create"),
    wrap(async (req, res) => {
      await removeFormula(req.user, { product_id: req.params.id, formula_id: req.params.fid });
      return ok(res, { removed: true });
    })
  );

  products.get(
    "/:id/lineage",
    requireAuth,
    wrap(async (req, res) => {
      const lineage = await productLineage(req.user, req.params.id);
      return ok(res, serializeLineageProduct(lineage));
    })
  );

  // ------------------------------------------------- manufacturing runs
  const mfg = express.Router();

  mfg.post(
    "/batches",
    requireAuth,
    requirePermission("product.link"),
    wrap(async (req, res) => {
      const parsed = runSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "product_id, planned_units and ingredients are required", 400);
      const run = await createRun(req.user, parsed.data);
      return ok(res, { run: serializeRun(run) }, 201);
    })
  );

  mfg.get(
    "/batches",
    requireAuth,
    wrap(async (req, res) => {
      const { status = null, limit, offset } = req.query;
      const { runs, total } = await listRuns(req.user, { status, limit, offset });
      return ok(res, { runs: runs.map(serializeRun), total });
    })
  );

  mfg.get(
    "/batches/:id",
    requireAuth,
    wrap(async (req, res) => {
      const run = await getRun(req.user, req.params.id);
      return ok(res, { run: serializeRun(run) });
    })
  );

  mfg.post(
    "/batches/:id/start",
    requireAuth,
    requirePermission("product.link"),
    wrap(async (req, res) => {
      const run = await startRun(req.user, req.params.id);
      return ok(res, { run: serializeRun(run) });
    })
  );

  mfg.post(
    "/batches/:id/complete",
    requireAuth,
    requirePermission("product.link"),
    wrap(async (req, res) => {
      const body = z.object({ produced_units: z.coerce.number().int().positive().optional().nullable() }).safeParse(req.body ?? {});
      if (!body.success) return error(res, "validation_error", "produced_units must be a positive integer", 400);
      const out = await completeRun(req.user, req.params.id, { produced_units: body.data.produced_units ?? null });
      return ok(res, { run: serializeRun(out.run), lot: serializeLot(out.lot), qr: serializeProductQrResult(out) });
    })
  );

  mfg.post(
    "/batches/:id/cancel",
    requireAuth,
    requirePermission("product.link"),
    wrap(async (req, res) => {
      const parsed = cancelSchema.safeParse(req.body ?? {});
      const run = await cancelRun(req.user, req.params.id, { reason: parsed.success ? parsed.data.reason : null });
      return ok(res, { run: serializeRun(run) });
    })
  );

  mfg.get(
    "/lots",
    requireAuth,
    wrap(async (req, res) => {
      const { product_id = null, limit, offset } = req.query;
      const { lots, total } = await listLots(req.user, { product_id, limit, offset });
      return ok(res, { lots: lots.map(serializeLotLight), total });
    })
  );

  mfg.get(
    "/lots/:lotId",
    requireAuth,
    wrap(async (req, res) => {
      const lot = await getLot(req.user, req.params.lotId);
      return ok(res, { lot: serializeLot(lot) });
    })
  );

  mfg.get(
    "/lots/:lotId/qr",
    requireAuth,
    requirePermission("product.qr"),
    wrap(async (req, res) => {
      const card = await lotQrCard(req.user, req.params.lotId);
      return ok(res, serializeQrCard(card));
    })
  );

  mfg.get(
    "/dashboard",
    requireAuth,
    wrap(async (req, res) => {
      return ok(res, { dashboard: await dashboard(req.user) });
    })
  );

  // ------------------------------------------------- recalls / impacts
  mfg.get(
    "/impacts",
    requireAuth,
    wrap(async (req, res) => {
      const { status = "open", limit, offset } = req.query;
      const { affected, total } = await listAffectedProducts(req.user, { status, limit, offset });
      return ok(res, { impacts: affected.map(serializeAffected), total });
    })
  );

  mfg.post(
    "/impacts",
    requireAuth,
    requirePermission("product.create"),
    wrap(async (req, res) => {
      const parsed = impactSchema.safeParse(req.body ?? {});
      if (!parsed.success) return error(res, "validation_error", "batch_id and impact_type are required", 400);
      const out = await assessBatchImpact(req.user, parsed.data);
      return ok(res, { flagged_batch: out.flagged_batch, affected_count: out.affected_count, impacts: out.created.map(serializeAffected) }, 201);
    })
  );

  mfg.post(
    "/impacts/:id/resolve",
    requireAuth,
    wrap(async (req, res) => {
      const note = req.body?.note ? String(req.body.note).trim() : null;
      const affected = await resolveAffectedProduct(req.user, { affected_id: req.params.id, note });
      return ok(res, { impact: serializeAffected(affected) });
    })
  );

  // --------------------------------------- forward trace: /batches/:id/products
  const trace = express.Router();
  trace.get(
    "/:batchId/products",
    requireAuth,
    wrap(async (req, res) => {
      const out = await batchForwardTrace(req.user, req.params.batchId);
      return ok(res, serializeForwardTrace(out));
    })
  );

  app.use("/api/v1/products", products);
  app.use("/api/v1/manufacturing", mfg);
  app.use("/api/v1/batches", trace);
}

module.exports = { mountProductRoutes };
