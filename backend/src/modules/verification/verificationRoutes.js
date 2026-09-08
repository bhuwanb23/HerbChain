/**
 * Consumer verification API — Phase 11 (docs/phase_11.md).
 *
 * PUBLIC (no auth — the digital product passport):
 *   POST /verify/scan                    record a scan -> full passport
 *                                        (the portal's tracking entry point)
 *   GET  /verify/product/:token          passport summary (no scan row —
 *                                        side-effect-free for shares/links)
 *   GET  /verify/product/:token/journey  consumer supply-chain timeline (§7)
 *   GET  /verify/product/:token/certificate  lab certification view (§6)
 *
 * INTERNAL (auth; AYUSH visibility + manufacturer scoping):
 *   GET  /api/v1/verify/analytics        scan KPIs, geo demand, top products,
 *                                        devices, trend, alert summary
 *   GET  /api/v1/verify/scans            scan list (admin / manufacturer)
 *   GET  /api/v1/verify/alerts           counterfeit alerts
 *   POST /api/v1/verify/alerts/:id/resolve
 *
 * Security controls (spec "Public Security Controls"): the public router is
 * rate-limited per IP (env PUBLIC_VERIFY_RATE_LIMIT, default 100/min), the
 * passport exposes only public codes (never internal ids / PII), and raw
 * tokens are never stored — lookups are hash-only.
 */
const express = require("express");
const { z } = require("zod");
const { ok, error } = require("../../utils/responses");
const { requireAuth, requirePermission } = require("../../middleware/auth");
const { rateLimit } = require("../../middleware/rateLimit");
const { env } = require("../../config/env");
const { verifyByToken, journeyByToken, certificateByToken, listScans, scanAnalytics, listAlerts, resolveAlert } = require("../../services/consumerVerification");
const { serializeScan, serializeAlert } = require("./verificationSerializer");

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const tokenParam = z.object({ token: z.string().trim().min(4) });

/** Anonymous scan context from headers + body (geo/device facets only). */
function scanMeta(req) {
  const b = req.body || {};
  return {
    deviceId: req.headers["x-device-id"] || null,
    ip: req.ip || null,
    userAgent: req.headers["user-agent"] || null,
    deviceType: b.device_type || null,
    country: b.country || null,
    state: b.state || null,
    city: b.city || null,
    location: b.location || null,
    gpsLat: b.gps_lat ?? null,
    gpsLng: b.gps_lng ?? null,
  };
}

function mountVerificationRoutes(app) {
  // ---------------------------------------------------------- public
  const pub = express.Router();
  pub.use(
    rateLimit({
      windowMs: env.PUBLIC_VERIFY_RATE_WINDOW_MS,
      max: env.PUBLIC_VERIFY_RATE_LIMIT,
      prefix: "verify-public",
    })
  );

  // Scan event: the portal's single tracking entry — records the scan and
  // returns the full passport (spec "Scan Event").
  pub.post(
    "/scan",
    wrap(async (req, res) => {
      const body = z.object({ token: z.string().trim().min(4, "token looks truncated") }).safeParse(req.body ?? {});
      if (!body.success) return error(res, "validation_error", "token is required", 400);
      const passport = await verifyByToken({ token: body.data.token, meta: scanMeta(req) });
      return ok(res, passport);
    })
  );

  // Product verification (spec "Product Passport API") — side-effect free:
  // the scan event is tracked through POST /verify/scan so shared links,
  // crawlers and preview bots never pollute the scan analytics.
  pub.get(
    "/product/:token",
    wrap(async (req, res) => {
      const parsed = tokenParam.safeParse(req.params);
      if (!parsed.success) return error(res, "validation_error", "token is required", 400);
      const passport = await verifyByToken({ token: parsed.data.token, meta: scanMeta(req), track: false });
      return ok(res, passport);
    })
  );

  pub.get(
    "/product/:token/journey",
    wrap(async (req, res) => {
      const parsed = tokenParam.safeParse(req.params);
      if (!parsed.success) return error(res, "validation_error", "token is required", 400);
      const out = await journeyByToken({ token: parsed.data.token });
      return ok(res, out);
    })
  );

  pub.get(
    "/product/:token/certificate",
    wrap(async (req, res) => {
      const parsed = tokenParam.safeParse(req.params);
      if (!parsed.success) return error(res, "validation_error", "token is required", 400);
      const out = await certificateByToken({ token: parsed.data.token });
      return ok(res, out);
    })
  );

  // -------------------------------------------------------- internal
  const api = express.Router();
  api.use(requireAuth);

  api.get(
    "/analytics",
    requirePermission("verify.analytics.view"),
    wrap(async (req, res) => {
      const out = await scanAnalytics(req.user);
      return ok(res, { analytics: out });
    })
  );

  api.get(
    "/scans",
    requirePermission("verify.analytics.view"),
    wrap(async (req, res) => {
      const { limit, offset, outcome = null, product_id = null } = req.query;
      const { scans, total } = await listScans(req.user, { limit, offset, outcome, product_id });
      return ok(res, { scans: scans.map(serializeScan), total });
    })
  );

  api.get(
    "/alerts",
    requirePermission("verify.analytics.view"),
    wrap(async (req, res) => {
      const { status = "open", severity = null, limit, offset } = req.query;
      const { alerts, total } = await listAlerts(req.user, { status, severity, limit, offset });
      return ok(res, { alerts: alerts.map(serializeAlert), total });
    })
  );

  api.post(
    "/alerts/:id/resolve",
    requirePermission("verify.analytics.view"),
    wrap(async (req, res) => {
      const note = req.body?.note ? String(req.body.note).trim() : null;
      const alert = await resolveAlert(req.user, { alert_id: req.params.id, note });
      return ok(res, { alert: serializeAlert(alert) });
    })
  );

  // ─── Consumer feedback (public, no auth) ──────────────────────────
  const feedback = require("../../services/consumerFeedback");

  pub.post(
    "/feedback",
    rateLimit({ windowMs: 60000, max: 20 }),
    wrap(async (req, res) => {
      const { message, rating, contact_email, contact_phone, product_id, batch_id, qr_token, scan_id } = req.body || {};
      if (!message || String(message).trim().length < 3) {
        return error(res, "bad_request", "Message is required (min 3 chars)", 400);
      }
      const row = await feedback.submitFeedback({
        scan_id, product_id, batch_id, qr_token,
        type: "feedback",
        rating: rating ? Math.min(5, Math.max(1, Number(rating))) : null,
        message: String(message).trim(),
        contact_email, contact_phone,
      });
      return ok(res, { feedback: row }, 201);
    })
  );

  pub.post(
    "/report-fake",
    rateLimit({ windowMs: 60000, max: 10 }),
    wrap(async (req, res) => {
      const { message, contact_email, contact_phone, product_id, batch_id, qr_token, scan_id } = req.body || {};
      if (!message || String(message).trim().length < 5) {
        return error(res, "bad_request", "Description is required (min 5 chars)", 400);
      }
      const row = await feedback.submitFeedback({
        scan_id, product_id, batch_id, qr_token,
        type: "fake_report",
        message: String(message).trim(),
        contact_email, contact_phone,
      });
      return ok(res, { report: row }, 201);
    })
  );

  // Admin: list feedback reports
  api.get(
    "/feedback",
    requirePermission("verify.analytics.view"),
    wrap(async (req, res) => {
      const data = await feedback.listFeedback({
        type: req.query.type || null,
        status: req.query.status || null,
        limit: req.query.limit ? parseInt(req.query.limit, 10) : 50,
        offset: req.query.offset ? parseInt(req.query.offset, 10) : 0,
      });
      return ok(res, data);
    })
  );

  api.put(
    "/feedback/:id",
    requirePermission("verify.analytics.view"),
    wrap(async (req, res) => {
      const { status, admin_note } = req.body || {};
      const row = await feedback.updateFeedback(req.params.id, { status, admin_note });
      return ok(res, { feedback: row });
    })
  );

  app.use("/verify", pub);
  app.use("/api/v1/verify", api);
}

module.exports = { mountVerificationRoutes };