/**
 * Admin routes — port of routes/admin.py.
 *
 * All endpoints (except /admin/) require the caller to be an admin.
 * Stats are real DB aggregates; /api/logs tails logs/herbchain.log.
 */
const fs = require("fs");
const path = require("path");
const express = require("express");
const { prisma } = require("../db/client");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireRole } = require("../middleware/auth");
const { ok, error } = require("../utils/responses");
const {
  serializeUser,
  serializeHerb,
  serializeState,
  serializeEvent,
  serializeLabReport,
  serializeProduct,
  serializeProductLink,
} = require("../serializers");

const LOG_FILE = path.join(__dirname, "..", "..", "logs", "herbchain.log");

function mountAdmin(app) {
  const router = express.Router();

  router.get("/", (req, res) => {
    ok(res, {
      name: "HerbChain Admin",
      endpoints: {
        stats: "GET /admin/api/stats",
        users: "GET /admin/api/users",
        batches: "GET /admin/api/batches",
        products: "GET /admin/api/products",
        lab_reports: "GET /admin/api/lab-reports",
        events: "GET /admin/api/events",
        logs: "GET /admin/api/logs",
        health: "GET /admin/api/health",
      },
    });
  });

  router.get("/api/health", asyncHandler(async (req, res) => {
    try {
      const [users, batches] = await Promise.all([
        prisma.user.count(),
        prisma.herb.count(),
      ]);
      return ok(res, {
        status: "healthy",
        db: "ok",
        users,
        batches,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      return error(res, "db_error", `Database health check failed: ${err.message}`, 500);
    }
  }));

  router.get("/api/stats", requireRole("admin"), asyncHandler(async (req, res) => {
    const [userGroups, phaseGroups, testGroups, recentBatches, recentEvents, productCount, reportCount] =
      await Promise.all([
        prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
        prisma.batchState.groupBy({ by: ["phase"], _count: { _all: true } }),
        prisma.batchState.groupBy({ by: ["test_result"], _count: { _all: true } }),
        prisma.herb.count({ where: { created_at: { gte: new Date(Date.now() - 7 * 86400000) } } }),
        prisma.batchEvent.count({ where: { created_at: { gte: new Date(Date.now() - 7 * 86400000) } } }),
        prisma.product.count(),
        prisma.labReport.count(),
      ]);

    const byRole = {};
    for (const g of userGroups) byRole[g.role] = g._count._all;
    const byPhase = {};
    for (const g of phaseGroups) byPhase[g.phase] = g._count._all;
    const byTestResult = {};
    for (const g of testGroups) byTestResult[g.test_result] = g._count._all;

    return ok(res, {
      users: {
        total: Object.values(byRole).reduce((a, b) => a + b, 0),
        by_role: byRole,
      },
      batches: {
        total: Object.values(byPhase).reduce((a, b) => a + b, 0),
        by_phase: byPhase,
        by_test_result: byTestResult,
        new_last_7_days: recentBatches,
      },
      events: {
        last_7_days: recentEvents,
      },
      products: { total: productCount },
      lab_reports: { total: reportCount },
    });
  }));

  router.get("/api/users", requireRole("admin"), asyncHandler(async (req, res) => {
    const role = req.query.role;
    const users = await prisma.user.findMany({
      where: role ? { role } : undefined,
      orderBy: { created_at: "desc" },
      take: 500,
    });
    return ok(res, { users: users.map((u) => serializeUser(u)), total: users.length });
  }));

  router.get("/api/batches", requireRole("admin"), asyncHandler(async (req, res) => {
    const phase = req.query.phase;
    const herbs = await prisma.herb.findMany({
      where: phase ? { state: { phase } } : undefined,
      include: { state: true },
      orderBy: { state: { updated_at: "desc" } },
      take: 500,
    });
    const items = herbs.map((h) => ({ herb: serializeHerb(h), state: serializeState(h.state) }));
    return ok(res, { batches: items, total: items.length });
  }));

  router.get("/api/products", requireRole("admin"), asyncHandler(async (req, res) => {
    const products = await prisma.product.findMany({ orderBy: { created_at: "desc" }, take: 500 });
    const links = await prisma.productBatchLink.findMany({
      where: { product_id: { in: products.map((p) => p.product_id) } },
    });
    const linksByProduct = new Map();
    for (const l of links) {
      if (!linksByProduct.has(l.product_id)) linksByProduct.set(l.product_id, []);
      linksByProduct.get(l.product_id).push(l);
    }
    return ok(res, {
      products: products.map((p) =>
        serializeProduct(p, { includeLinks: true, links: linksByProduct.get(p.product_id) || [] })
      ),
      total: products.length,
    });
  }));

  router.get("/api/lab-reports", requireRole("admin"), asyncHandler(async (req, res) => {
    const reports = await prisma.labReport.findMany({ orderBy: { created_at: "desc" }, take: 500 });
    return ok(res, { reports: reports.map(serializeLabReport), total: reports.length });
  }));

  router.get("/api/events", requireRole("admin"), asyncHandler(async (req, res) => {
    const rows = await prisma.batchEvent.findMany({
      where: req.query.batch_id ? { batch_id: req.query.batch_id } : undefined,
      orderBy: { created_at: "desc" },
      take: 500,
    });
    return ok(res, { events: rows.map((e) => serializeEvent(e)), total: rows.length });
  }));

  router.get("/api/logs", requireRole("admin"), asyncHandler(async (req, res) => {
    const lines = Number(req.query.lines) || 200;
    if (!fs.existsSync(LOG_FILE)) return ok(res, { logs: [] });
    try {
      const content = fs.readFileSync(LOG_FILE, "utf8");
      const tail = content.split("\n").filter((l) => l.length > 0).slice(-lines);
      return ok(res, { logs: tail, count: tail.length });
    } catch (err) {
      return error(res, "io_error", `Could not read log file: ${err.message}`, 500);
    }
  }));

  app.use("/admin", router);
}

module.exports = { mountAdmin };