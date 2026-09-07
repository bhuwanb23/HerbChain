/**
 * Notifications API — /api/v1/notifications (docs/phase_14.md "APIs").
 *
 *   GET    /                     own inbox (+ ?unread_only, ?category)
 *   GET    /unread               unread count
 *   PUT    /read                 mark one (ids) or all (all=true) read
 *   GET    /preferences          channel preferences (auto-created default)
 *   PUT    /preferences          update channel toggles
 *   POST   /device               register a push device token
 *   DELETE /device/:id           revoke a device
 *   GET    /devices              list my devices
 *   -- admin (notifications.manage) --
 *   POST   /send                 broadcast a template to a role / everyone
 *   GET    /admin/center         critical alerts, failed deliveries, security
 *   GET    /admin/analytics      delivery metrics + channel usage
 *   POST   /admin/process        run the queue now (manual drain)
 *   POST   /admin/requeue        reset FAILED queue rows
 *   GET    /admin/queue          queue rows (?status=)
 *   GET    /admin/scheduled      scheduled notifications
 *   GET    /admin/templates      template catalog
 */
const express = require("express");
const { z } = require("zod");
const { ok, error } = require("../../utils/responses");
const { requireAuth, requirePermission } = require("../../middleware/auth");
const notifications = require("../../services/notifications");

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const idParam = z.object({ id: z.string().min(1) });

function mountNotificationRoutes(app) {
  const router = express.Router();
  router.use(requireAuth);

  // ---------------------------------------------------------------- inbox
  router.get(
    "/",
    wrap(async (req, res) => {
      const unreadOnly = req.query.unread_only === "true" || req.query.unread_only === "1";
      const data = await notifications.listInbox(req.user, {
        unreadOnly,
        category: req.query.category || null,
        limit: req.query.limit ? parseInt(req.query.limit, 10) : 100,
        offset: req.query.offset ? parseInt(req.query.offset, 10) : 0,
      });
      return ok(res, data);
    })
  );

  router.get(
    "/unread",
    wrap(async (req, res) => {
      const { unread } = await notifications.listInbox(req.user, { unreadOnly: true, limit: 1 });
      return ok(res, { unread });
    })
  );

  router.put(
    "/read",
    wrap(async (req, res) => {
      const body = req.body || {};
      if (!body.all && (!Array.isArray(body.ids) || body.ids.length === 0)) {
        return error(res, "bad_request", "Provide ids[] or all=true", 400);
      }
      const data = await notifications.markRead(req.user, { ids: body.ids, all: Boolean(body.all) });
      return ok(res, data);
    })
  );

  // ---------------------------------------------------------- preferences
  router.get(
    "/preferences",
    wrap(async (req, res) => {
      return ok(res, await notifications.getPreferences(req.user));
    })
  );

  router.put(
    "/preferences",
    wrap(async (req, res) => {
      return ok(res, await notifications.setPreferences(req.user, req.body || {}));
    })
  );

  // -------------------------------------------------------------- devices
  const deviceBody = z.object({
    device_id: z.string().optional().nullable(),
    platform: z.enum(["android", "ios", "web"]).default("web"),
    token: z.string().min(1),
  });

  router.post(
    "/device",
    wrap(async (req, res) => {
      const parsed = deviceBody.safeParse(req.body || {});
      if (!parsed.success) return error(res, "bad_request", "Invalid device payload", 400);
      return ok(res, await notifications.registerDevice(req.user, parsed.data), 201);
    })
  );

  router.get(
    "/devices",
    wrap(async (req, res) => {
      return ok(res, { devices: await notifications.listDevices(req.user) });
    })
  );

  router.delete(
    "/device/:id",
    wrap(async (req, res) => {
      const { id } = idParam.parse(req.params);
      return ok(res, await notifications.revokeDevice(req.user, id));
    })
  );

  // ------------------------------------------------------------ admin (manage)
  const sendBody = z.object({
    code: z.string().min(1),
    role: z.string().optional().nullable(),
    data: z.record(z.unknown()).optional().default({}),
  });

  router.post(
    "/send",
    requirePermission("notifications.manage"),
    wrap(async (req, res) => {
      const parsed = sendBody.safeParse(req.body || {});
      if (!parsed.success) return error(res, "bad_request", "Invalid broadcast payload", 400);
      return ok(res, await notifications.sendBroadcast(req.user, parsed.data));
    })
  );

  router.get(
    "/admin/center",
    requirePermission("notifications.manage"),
    wrap(async (req, res) => {
      return ok(res, await notifications.adminCenter({ limit: req.query.limit ? parseInt(req.query.limit, 10) : 50 }));
    })
  );

  router.get(
    "/admin/analytics",
    requirePermission("notifications.manage"),
    wrap(async (req, res) => {
      return ok(res, await notifications.analytics({ period: req.query.period || undefined }));
    })
  );

  router.post(
    "/admin/process",
    requirePermission("notifications.manage"),
    wrap(async (req, res) => {
      const body = req.body || {};
      return ok(res, await notifications.processQueue({ limit: body.limit || undefined, actor: req.user.id }));
    })
  );

  router.post(
    "/admin/requeue",
    requirePermission("notifications.manage"),
    wrap(async (req, res) => {
      const body = req.body || {};
      return ok(res, await notifications.requeueFailed({ ids: Array.isArray(body.ids) ? body.ids : null, actor: req.user.id }));
    })
  );

  router.get(
    "/admin/queue",
    requirePermission("notifications.manage"),
    wrap(async (req, res) => {
      return ok(
        res,
        await notifications.listQueue(req.user, {
          status: req.query.status || null,
          limit: req.query.limit ? parseInt(req.query.limit, 10) : 100,
          offset: req.query.offset ? parseInt(req.query.offset, 10) : 0,
        })
      );
    })
  );

  router.get(
    "/admin/scheduled",
    requirePermission("notifications.manage"),
    wrap(async (req, res) => {
      return ok(
        res,
        await notifications.listScheduled({
          status: req.query.status || null,
          limit: req.query.limit ? parseInt(req.query.limit, 10) : 100,
          offset: req.query.offset ? parseInt(req.query.offset, 10) : 0,
        })
      );
    })
  );

  router.get(
    "/admin/templates",
    requirePermission("notifications.manage"),
    wrap(async (req, res) => {
      return ok(res, { templates: await notifications.listTemplates() });
    })
  );

  app.use("/api/v1/notifications", router);
}

module.exports = { mountNotificationRoutes };