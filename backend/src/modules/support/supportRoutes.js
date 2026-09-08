// ============================================================================
// SUPPORT ROUTES — /api/v1/support (Phase A6 shared screen)
// ---------------------------------------------------------------------------
const express = require("express");
const { z } = require("zod");
const { ok, error } = require("../../utils/responses");
const { requireAuth } = require("../../middleware/auth");
const support = require("../../services/supportService");

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const createBody = z.object({
  category: z.string().optional(),
  subject: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
});

const updateBody = z.object({
  status: z.string().optional(),
  assignee_user_id: z.string().optional().nullable(),
});

function mountSupportRoutes(app) {
  const router = express.Router();
  router.use(requireAuth);

  // List tickets
  router.get("/", wrap(async (req, res) => {
    const data = await support.listTickets(req.user, {
      status: req.query.status || null,
      category: req.query.category || null,
      limit: req.query.limit ? parseInt(req.query.limit, 10) : 50,
      offset: req.query.offset ? parseInt(req.query.offset, 10) : 0,
    });
    return ok(res, data);
  }));

  // Constants
  router.get("/constants", wrap(async (_req, res) => {
    return ok(res, support.constants());
  }));

  // Get single ticket
  router.get("/:id", wrap(async (req, res) => {
    const ticket = await support.getTicket(req.user, req.params.id);
    if (!ticket) return error(res, "not_found", "Ticket not found", 404);
    return ok(res, { ticket });
  }));

  // Create ticket
  router.post("/", wrap(async (req, res) => {
    const parsed = createBody.safeParse(req.body || {});
    if (!parsed.success) return error(res, "bad_request", "Invalid ticket data", 400, parsed.error.flatten());
    const ticket = await support.createTicket(req.user, parsed.data);
    return ok(res, { ticket }, 201);
  }));

  // Update ticket
  router.put("/:id", wrap(async (req, res) => {
    const parsed = updateBody.safeParse(req.body || {});
    if (!parsed.success) return error(res, "bad_request", "Invalid update", 400, parsed.error.flatten());
    const updated = await support.updateTicket(req.user, req.params.id, parsed.data);
    if (!updated) return error(res, "not_found", "Ticket not found or access denied", 404);
    return ok(res, { ticket: updated });
  }));

  app.use("/api/v1/support", router);
}

module.exports = { mountSupportRoutes };
