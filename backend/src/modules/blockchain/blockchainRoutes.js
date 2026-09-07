/**
 * Blockchain API — /api/v1/blockchain (docs/phase_12.md "APIs").
 *
 * Most operations are internal: the WRITES (process / requeue) are worker
 * or ops actions gated by blockchain.manage (AYUSH admin). READS follow the
 * node-permission model (spec "Node Permissions"): admin sees everything;
 * a lab can read batch chains (its certification events); a manufacturer
 * can read its own product chains. Transporters/farmers have no chain
 * access — they use the backend only.
 */
const express = require("express");
const { z } = require("zod");
const { ok, error } = require("../../utils/responses");
const { requireAuth, requirePermission } = require("../../middleware/auth");
const {
  processQueue,
  requeueFailed,
  verifyEvent,
  verifyTransactionHash,
  batchChain,
  productChain,
  listEvents,
  listTransactions,
  listNodes,
  listContracts,
  listAudit,
  dashboard,
  pingNode,
} = require("../../services/blockchain");

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const idParam = z.object({ id: z.string().min(1) });
const codeParam = z.object({ code: z.string().min(1) });

function mountBlockchainRoutes(app) {
  const router = express.Router();
  router.use(requireAuth);

  // ------------------------------------------------- governance (admin)
  router.get(
    "/dashboard",
    requirePermission("blockchain.manage"),
    wrap(async (req, res) => {
      return ok(res, { dashboard: await dashboard() });
    })
  );

  router.get(
    "/events",
    requirePermission("blockchain.manage"),
    wrap(async (req, res) => {
      const { status = null, anchor_code = null, entity_type = null, limit, offset } = req.query;
      const { events, total } = await listEvents(req.user, { status, anchor_code, entity_type, limit, offset });
      return ok(res, { events, total });
    })
  );

  router.get(
    "/transactions",
    requirePermission("blockchain.manage"),
    wrap(async (req, res) => {
      const { limit, offset } = req.query;
      const out = await listTransactions(req.user, { limit, offset });
      return ok(res, out);
    })
  );

  router.get(
    "/nodes",
    requirePermission("blockchain.manage"),
    wrap(async (req, res) => ok(res, await listNodes()))
  );

  router.get(
    "/contracts",
    requirePermission("blockchain.manage"),
    wrap(async (req, res) => ok(res, await listContracts()))
  );

  router.get(
    "/audit",
    requirePermission("blockchain.manage"),
    wrap(async (req, res) => {
      const { limit } = req.query;
      return ok(res, await listAudit({ limit }));
    })
  );

  router.post(
    "/nodes/:code/ping",
    requirePermission("blockchain.manage"),
    wrap(async (req, res) => {
      const parsed = codeParam.safeParse(req.params);
      if (!parsed.success) return error(res, "validation_error", "node code is required", 400);
      const node = await pingNode(parsed.data.code, { actor: req.user.id });
      return ok(res, { node: { node_code: node.node_code, org_type: node.org_type, status: node.status, last_seen_at: node.last_seen_at } });
    })
  );

  // ------------------------------------------- worker / ops (admin)
  router.post(
    "/process",
    requirePermission("blockchain.manage"),
    wrap(async (req, res) => {
      const out = await processQueue({ actor: req.user.id });
      return ok(res, out);
    })
  );

  router.post(
    "/requeue",
    requirePermission("blockchain.manage"),
    wrap(async (req, res) => {
      const body = z.object({ ids: z.array(z.string()).optional() }).safeParse(req.body ?? {});
      const out = await requeueFailed({ ids: body.success ? body.data.ids : null, actor: req.user.id });
      return ok(res, out);
    })
  );

  router.post(
    "/verify-event/:id",
    requirePermission("blockchain.manage"),
    wrap(async (req, res) => {
      const parsed = idParam.safeParse(req.params);
      if (!parsed.success) return error(res, "validation_error", "event id is required", 400);
      const out = await verifyEvent(parsed.data.id, { actor: req.user.id });
      return ok(res, out);
    })
  );

  // ------------------------------------------------- reads (scoped)
  router.get(
    "/batches/:batchId",
    requirePermission("blockchain.view"),
    wrap(async (req, res) => {
      const out = await batchChain(req.params.batchId);
      return ok(res, out);
    })
  );

  router.get(
    "/products/:productId",
    requirePermission("blockchain.view"),
    wrap(async (req, res) => {
      if (req.user.role === "manufacturer") {
        const product = await require("../../db/client").prisma.product.findUnique({
          where: { id: req.params.productId },
          select: { manufacturer_user_id: true },
        });
        if (!product || product.manufacturer_user_id !== req.user.id) {
          return error(res, "forbidden", "You can only read your own product chains", 403);
        }
      }
      const out = await productChain(req.params.productId);
      return ok(res, out);
    })
  );

  router.get(
    "/verify/:hash",
    requirePermission("blockchain.view"),
    wrap(async (req, res) => {
      const out = await verifyTransactionHash(req.params.hash);
      return ok(res, out);
    })
  );

  app.use("/api/v1/blockchain", router);
}

module.exports = { mountBlockchainRoutes };