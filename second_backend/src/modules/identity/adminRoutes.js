/**
 * Identity admin module — /api/v1/admin/user governance.
 * Gates: admin.users.view (reads) / admin.users.manage (mutations).
 */
const express = require("express");
const { ok, error } = require("../../utils/responses");
const { requirePermission } = require("../../middleware/auth");
const { serializeUser } = require("../../serializers/user");
const { approveUser, rejectUser, setUserActive, changeUserRole, listUsers, getUserDossier } = require("../../services/verification");
const { getUserWithProfile } = require("../../services/accounts");
const { approveSchema, noteSchema, roleSchema, zodDetails } = require("../../validation/authSchemas");

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function mountAdmin(app) {
  const router = express.Router();
  router.use(requirePermission("admin.users.view"));

  // -------------------------------------------------------------- queue
  router.get(
    "/users",
    wrap(async (req, res) => {
      const { role = null, status = null, offset = 0, limit = 50 } = req.query;
      const { users, total } = await listUsers({
        role: role || null,
        status: status || null,
        offset: Math.max(parseInt(offset, 10) || 0, 0),
        limit: Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100),
      });
      return ok(res, { users: users.map((u) => serializeUser(u)), total });
    })
  );

  // ------------------------------------------------------------ dossier
  router.get(
    "/users/:id",
    wrap(async (req, res) => {
      const dossier = await getUserDossier(req.params.id);
      return ok(res, {
        user: serializeUser(dossier.user, dossier.profile),
        addresses: dossier.addresses,
        verification_requests: dossier.verification_requests,
      });
    })
  );

  // -------------------------------------------------- approve / reject
  router.post(
    "/users/:id/approve",
    requirePermission("admin.users.manage"),
    wrap(async (req, res) => {
      const parsed = approveSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return error(res, "validation_error", "Invalid approval data", 400, zodDetails(parsed.error));
      }
      const result = await approveUser(req.user, req.params.id, parsed.data);
      const { profile } = await getUserWithProfile(result.user.id);
      return ok(res, { user: serializeUser(result.user, profile) });
    })
  );

  router.post(
    "/users/:id/reject",
    requirePermission("admin.users.manage"),
    wrap(async (req, res) => {
      const parsed = noteSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return error(res, "validation_error", "Invalid data", 400, zodDetails(parsed.error));
      }
      const user = await rejectUser(req.user, req.params.id, parsed.data);
      return ok(res, { user: serializeUser(user) });
    })
  );

  // ----------------------------------------------- suspend / activate
  router.post(
    "/users/:id/suspend",
    requirePermission("admin.users.manage"),
    wrap(async (req, res) => {
      const parsed = noteSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return error(res, "validation_error", "Invalid data", 400, zodDetails(parsed.error));
      }
      const user = await setUserActive(req.user, req.params.id, false, parsed.data);
      return ok(res, { user: serializeUser(user) });
    })
  );

  router.post(
    "/users/:id/activate",
    requirePermission("admin.users.manage"),
    wrap(async (req, res) => {
      const user = await setUserActive(req.user, req.params.id, true);
      return ok(res, { user: serializeUser(user) });
    })
  );

  // ---------------------------------------------------------- role change
  router.post(
    "/users/:id/role",
    requirePermission("admin.users.manage"),
    wrap(async (req, res) => {
      const parsed = roleSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return error(res, "validation_error", "Invalid role", 400, zodDetails(parsed.error));
      }
      const user = await changeUserRole(req.user, req.params.id, parsed.data.role);
      return ok(res, { user: serializeUser(user) });
    })
  );

  app.use("/api/v1/admin", router);
}

module.exports = { mountAdmin };
