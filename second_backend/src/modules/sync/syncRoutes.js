/**
 * Sync module — /api/v1/sync + /api/v1/devices (docs/phase_17.md).
 *
 * The field client's entry point when connectivity returns:
 *   POST /sync/upload    replay the offline queue (per-item isolation)
 *   GET  /sync/changes   incremental pull since last_sync_timestamp
 *   GET  /sync/status    device sync health (pending/conflicts/avg time)
 *   GET  /sync/conflicts list refused operations (⚠ conflict UI)
 *   POST /sync/conflicts/:id/resolve  discard | requeue | applied
 *   GET  /sync/analytics offline adoption metrics (admin/AYUSH)
 *   POST /devices/register           device registration (JWT-bound)
 *   GET  /devices                    list own devices
 *   POST /devices/:id/revoke         lost-device revocation
 */
const express = require("express");
const { z } = require("zod");
const { ok, error } = require("../../utils/responses");
const { requireAuth, requirePermission } = require("../../middleware/auth");
const sync = require("../../services/syncService");

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const idParam = z.object({ id: z.string().cuid() });

const deviceRegisterBody = z.object({
  device_id: z.string().min(6).max(128),
  platform: z.enum(["android", "ios", "web"]),
  device_name: z.string().max(128).optional().nullable(),
  app_version: z.string().max(32).optional().nullable(),
  last_sync_at: z.string().datetime().optional().nullable(),
});

const uploadBody = z.object({
  device_id: z.string().max(128).optional().nullable(),
  items: z
    .array(
      z.object({
        local_id: z.string().min(1).max(128),
        entity_type: z.string(),
        operation: z.string().default("CREATE"),
        payload: z.unknown().optional(),
        client_timestamp: z.string().datetime().optional().nullable(),
      })
    )
    .min(1)
    .max(500),
});

const changesQuery = z.object({
  since: z.string().datetime().optional(),
  device_id: z.string().max(128).optional().nullable(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});

const resolveBody = z.object({
  resolution: z.enum(["discard", "requeue", "applied"]),
  note: z.string().max(512).optional().nullable(),
});

function mountSyncRoutes(app) {
  const syncRouter = express.Router();
  const devicesRouter = express.Router();

  // --------------------------------------------------------- sync upload
  syncRouter.post("/upload", requirePermission("sync.use"), wrap(async (req, res) => {
    const parsed = uploadBody.safeParse(req.body ?? {});
    if (!parsed.success) return error(res, "validation_error", "Invalid sync payload", 400, parsed.error.flatten());
    const result = await sync.upload(req.user, parsed.data);
    return ok(res, result);
  }));

  // ---------------------------------------------------- incremental pull
  syncRouter.get("/changes", requirePermission("sync.use"), wrap(async (req, res) => {
    const parsed = changesQuery.safeParse(req.query ?? {});
    if (!parsed.success) return error(res, "validation_error", "Invalid query", 400, parsed.error.flatten());
    const result = await sync.changes(req.user, parsed.data);
    return ok(res, result);
  }));

  // ------------------------------------------------------------ status
  syncRouter.get("/status", requirePermission("sync.use"), wrap(async (req, res) => {
    const result = await sync.status(req.user, { device_id: req.query.device_id || null });
    return ok(res, result);
  }));

  // --------------------------------------------------------- conflicts
  syncRouter.get("/conflicts", requirePermission("sync.use"), wrap(async (req, res) => {
    const resolved = req.query.resolved === undefined ? null : req.query.resolved === "true";
    const rows = await sync.listConflicts(req.user, { resolved, limit: Number(req.query.limit) || 100 });
    return ok(res, { rows });
  }));

  syncRouter.post("/conflicts/:id/resolve", requirePermission("sync.use"), wrap(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return error(res, "validation_error", "Invalid id", 400);
    const body = resolveBody.safeParse(req.body ?? {});
    if (!body.success) return error(res, "validation_error", "resolution must be discard | requeue | applied", 400);
    const row = await sync.resolveConflict(req.user, id.data.id, body.data);
    return ok(res, { conflict: row });
  }));

  // -------------------------------------------------------- analytics
  syncRouter.get("/analytics", requirePermission("sync.manage"), wrap(async (req, res) => {
    const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 90);
    const result = await sync.analyticsSummary({ days });
    return ok(res, result);
  }));

  app.use("/api/v1/sync", syncRouter);

  // ------------------------------------------------------------ devices
  devicesRouter.post("/register", requirePermission("sync.use"), wrap(async (req, res) => {
    const parsed = deviceRegisterBody.safeParse(req.body ?? {});
    if (!parsed.success) return error(res, "validation_error", "Invalid device data", 400, parsed.error.flatten());
    const result = await sync.registerDevice(req.user, parsed.data);
    return ok(res, result, 201);
  }));

  devicesRouter.get("/", requirePermission("sync.use"), wrap(async (req, res) => {
    const rows = await sync.listDevices(req.user);
    return ok(res, { rows });
  }));

  devicesRouter.post("/:id/revoke", requirePermission("sync.use"), wrap(async (req, res) => {
    const id = idParam.safeParse(req.params);
    if (!id.success) return error(res, "validation_error", "Invalid id", 400);
    const row = await sync.revokeDevice(req.user, id.data.id);
    return ok(res, { device: row });
  }));

  app.use("/api/v1/devices", devicesRouter);
}

module.exports = { mountSyncRoutes };
