/**
 * AYUSH Admin Portal API — /api/v1/admin/portal (docs/phase_13.md).
 *
 * The regulatory control tower. Every route requires an ADMIN account and a
 * portal capability granted by the admin's tier (User.admin_role): auditor
 * (read-only), state_officer (state monitoring), regulatory_officer
 * (compliance + investigations + recalls), super_admin (everything; a
 * legacy admin with NULL admin_role counts as super_admin).
 */
const express = require("express");
const { z } = require("zod");
const { ok, error } = require("../../utils/responses");
const { requireAuth, requireRole } = require("../../middleware/auth");
const {
  dashboard,
  search,
  batchTraceability,
  productTraceability,
  shipments,
  failedCertifications,
  listComplianceAlerts,
  createComplianceAlert,
  updateComplianceAlert,
  runAlertRules,
  listRecalls,
  issueRecall,
  updateRecall,
  createInvestigation,
  listInvestigations,
  getInvestigation,
  updateInvestigation,
  computeScores,
  listScores,
  listNotifications,
  markNotificationRead,
  exportReport,
  listReports,
  mapData,
  auditView,
  requireCapability,
} = require("../../services/adminPortal");

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const idParam = z.object({ id: z.string().min(1) });

/** Middleware: authenticate, require an admin account + a portal capability. */
function portal(capability) {
  return async (req, res, next) => {
    try {
      requireCapability(req.user, capability);
      next();
    } catch (err) {
      error(res, err.code || "forbidden", err.message, err.status || 403);
    }
  };
}

function mountAdminPortalRoutes(app) {
  const router = express.Router();
  router.use(requireAuth, requireRole("admin"));

  // ------------------------------------------------ dashboard
  router.get(
    "/dashboard",
    portal("dashboard"),
    wrap(async (req, res) => {
      const { state } = req.query;
      return ok(res, { dashboard: await dashboard(req.user, { state: state || null }) });
    })
  );

  // ------------------------------------------------ universal search
  router.get(
    "/search",
    portal("search"),
    wrap(async (req, res) => {
      const { q, state, district, radius_m, lat, lng, limit } = req.query;
      return ok(
        res,
        await search(req.user, {
          q: q || null,
          state: state || null,
          district: district || null,
          radiusM: radius_m ? parseFloat(radius_m) : null,
          gpsLat: lat ? parseFloat(lat) : null,
          gpsLng: lng ? parseFloat(lng) : null,
          limit,
        })
      );
    })
  );

  // ------------------------------------------------ traceability explorers
  router.get(
    "/batches/:id",
    portal("traceability"),
    wrap(async (req, res) => {
      const parsed = idParam.safeParse(req.params);
      if (!parsed.success) return error(res, "validation_error", "batch id is required", 400);
      return ok(res, { batch_trace: await batchTraceability(req.user, parsed.data.id) });
    })
  );

  router.get(
    "/products/:id",
    portal("traceability"),
    wrap(async (req, res) => {
      const parsed = idParam.safeParse(req.params);
      if (!parsed.success) return error(res, "validation_error", "product id is required", 400);
      return ok(res, { product_trace: await productTraceability(req.user, parsed.data.id) });
    })
  );

  // ------------------------------------------------ shipments + risk
  router.get(
    "/shipments",
    portal("shipments"),
    wrap(async (req, res) => {
      const { status, risk, limit, offset } = req.query;
      return ok(res, await shipments(req.user, { status: status || null, risk: risk || null, limit, offset }));
    })
  );

  // ------------------------------------------------ failed certifications
  router.get(
    "/failed-certifications",
    portal("failed_certifications"),
    wrap(async (req, res) => {
      const { category, state, limit, offset } = req.query;
      return ok(res, await failedCertifications(req.user, { category: category || null, state: state || null, limit, offset }));
    })
  );

  // ------------------------------------------------ compliance alerts
  router.get(
    "/compliance-alerts",
    portal("compliance_alerts_read"),
    wrap(async (req, res) => {
      const { status, severity, type, limit, offset } = req.query;
      return ok(res, await listComplianceAlerts(req.user, { status: status || null, severity: severity || null, type: type || null, limit, offset }));
    })
  );

  router.post(
    "/compliance-alerts",
    portal("compliance_alerts_write"),
    wrap(async (req, res) => {
      const body = z
        .object({ alert_type: z.string().min(1), severity: z.string().optional(), title: z.string().min(1), description: z.string().nullable().optional(), entity_type: z.string().nullable().optional(), entity_id: z.string().nullable().optional() })
        .safeParse(req.body ?? {});
      if (!body.success) return error(res, "validation_error", "invalid alert payload", 400);
      return ok(res, { alert: await createComplianceAlert(req.user, body.data) }, 201);
    })
  );

  router.patch(
    "/compliance-alerts/:id",
    portal("compliance_alerts_write"),
    wrap(async (req, res) => {
      const parsed = idParam.safeParse(req.params);
      if (!parsed.success) return error(res, "validation_error", "alert id is required", 400);
      const body = z.object({ status: z.string().optional() }).safeParse(req.body ?? {});
      return ok(res, { alert: await updateComplianceAlert(req.user, parsed.data.id, body.success ? body.data : {}) });
    })
  );

  router.post(
    "/compliance-alerts/run-rules",
    portal("compliance_alerts_write"),
    wrap(async (req, res) => {
      return ok(res, await runAlertRules(req.user));
    })
  );

  // ------------------------------------------------ recall center
  router.get(
    "/recalls",
    portal("recalls"),
    wrap(async (req, res) => {
      const { status, limit, offset } = req.query;
      return ok(res, await listRecalls(req.user, { status: status || null, limit, offset }));
    })
  );

  router.post(
    "/recalls",
    portal("recalls"),
    wrap(async (req, res) => {
      const body = z
        .object({ ref_type: z.enum(["product", "batch", "product_lot"]), ref_id: z.string().min(1), reason: z.string().min(1), severity: z.string().optional(), notes: z.string().nullable().optional() })
        .safeParse(req.body ?? {});
      if (!body.success) return error(res, "validation_error", "invalid recall payload", 400);
      return ok(res, await issueRecall(req.user, body.data), 201);
    })
  );

  router.patch(
    "/recalls/:id",
    portal("recalls"),
    wrap(async (req, res) => {
      const parsed = idParam.safeParse(req.params);
      if (!parsed.success) return error(res, "validation_error", "recall id is required", 400);
      const body = z.object({ status: z.string().optional() }).safeParse(req.body ?? {});
      return ok(res, { recall: await updateRecall(req.user, parsed.data.id, body.success ? body.data : {}) });
    })
  );

  // ------------------------------------------------ investigations
  router.get(
    "/investigations",
    portal("investigations"),
    wrap(async (req, res) => {
      const { status, case_type, limit, offset } = req.query;
      return ok(res, await listInvestigations(req.user, { status: status || null, case_type: case_type || null, limit, offset }));
    })
  );

  router.post(
    "/investigations",
    portal("investigations"),
    wrap(async (req, res) => {
      const body = z
        .object({
          title: z.string().min(1),
          case_type: z.string().optional(),
          severity: z.string().optional(),
          summary: z.string().nullable().optional(),
          assigned_to_user_id: z.string().nullable().optional(),
          entities: z.array(z.object({ entity_type: z.string(), entity_id: z.string(), role: z.string().optional(), note: z.string().nullable().optional() })).optional(),
        })
        .safeParse(req.body ?? {});
      if (!body.success) return error(res, "validation_error", "invalid investigation payload", 400);
      return ok(res, { investigation: await createInvestigation(req.user, body.data) }, 201);
    })
  );

  router.get(
    "/investigations/:id",
    portal("investigations"),
    wrap(async (req, res) => {
      const parsed = idParam.safeParse(req.params);
      if (!parsed.success) return error(res, "validation_error", "case id is required", 400);
      return ok(res, { investigation: await getInvestigation(req.user, parsed.data.id) });
    })
  );

  router.patch(
    "/investigations/:id",
    portal("investigations"),
    wrap(async (req, res) => {
      const parsed = idParam.safeParse(req.params);
      if (!parsed.success) return error(res, "validation_error", "case id is required", 400);
      const body = z.object({ status: z.string().optional(), summary: z.string().nullable().optional(), assigned_to_user_id: z.string().nullable().optional() }).safeParse(req.body ?? {});
      return ok(res, { investigation: await updateInvestigation(req.user, parsed.data.id, body.success ? body.data : {}) });
    })
  );

  // ------------------------------------------------ compliance scores
  router.post(
    "/scores/compute",
    portal("scores"),
    wrap(async (req, res) => {
      const body = z.object({ entity_type: z.string().nullable().optional() }).safeParse(req.body ?? {});
      return ok(res, await computeScores(req.user, body.success ? body.data : {}));
    })
  );

  router.get(
    "/scores",
    portal("scores"),
    wrap(async (req, res) => {
      const { entity_type, limit, offset } = req.query;
      return ok(res, await listScores(req.user, { entity_type: entity_type || null, limit, offset }));
    })
  );

  // ------------------------------------------------ notifications
  router.get(
    "/notifications",
    wrap(async (req, res) => {
      const { unread_only, limit } = req.query;
      return ok(res, await listNotifications(req.user, { unread_only: unread_only === "true" || unread_only === "1", limit }));
    })
  );

  router.post(
    "/notifications/:id/read",
    wrap(async (req, res) => {
      const parsed = idParam.safeParse(req.params);
      if (!parsed.success) return error(res, "validation_error", "notification id is required", 400);
      return ok(res, { notification: await markNotificationRead(req.user, parsed.data.id) });
    })
  );

  // ------------------------------------------------ reports
  router.post(
    "/reports",
    portal("reports"),
    wrap(async (req, res) => {
      const body = z.object({ report_type: z.string().min(1), format: z.string().optional(), params: z.record(z.any()).optional() }).safeParse(req.body ?? {});
      if (!body.success) return error(res, "validation_error", "invalid report payload", 400);
      return ok(res, await exportReport(req.user, body.data), 201);
    })
  );

  router.get(
    "/reports",
    portal("reports"),
    wrap(async (req, res) => {
      const { limit } = req.query;
      return ok(res, await listReports(req.user, { limit }));
    })
  );

  // ------------------------------------------------ map + audit
  router.get(
    "/map",
    portal("map"),
    wrap(async (req, res) => ok(res, await mapData(req.user)))
  );

  router.get(
    "/audit",
    portal("audit"),
    wrap(async (req, res) => {
      const { action, target_type, limit, offset } = req.query;
      return ok(res, await auditView(req.user, { action: action || null, target_type: target_type || null, limit, offset }));
    })
  );

  app.use("/api/v1/admin/portal", router);
}

module.exports = { mountAdminPortalRoutes };