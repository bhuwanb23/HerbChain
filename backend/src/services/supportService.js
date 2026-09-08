// ============================================================================
// SUPPORT SERVICE (Phase A6 shared screen)
// ---------------------------------------------------------------------------
// Works with the existing SupportTicket model in 80_compliance.prisma.
// No messages table — tickets use subject + body + status updates.

const { prisma } = require("../db/client");

const CATEGORIES = ["billing", "traceability", "account", "technical", "other"];
const STATUSES = ["open", "in_progress", "resolved", "closed"];
const PRIORITIES = ["low", "medium", "high", "urgent"];

let seqCounter = 0;
function nextTicketNo() {
  const year = new Date().getFullYear();
  seqCounter++;
  return `TCK-${year}-${String(seqCounter).padStart(6, "0")}`;
}

// ---------------------------------------------------------------------------
// List tickets for current user (or all for admin)
async function listTickets(user, { status, category, limit = 50, offset = 0 } = {}) {
  const where = {};
  if (user.role !== "admin") {
    where.requester_user_id = user.id;
  }
  if (status) where.status = status;
  if (category) where.category = category;

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: { assignee: { select: { id: true, full_name: true } } },
      orderBy: { created_at: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return { tickets, total };
}

// ---------------------------------------------------------------------------
// Get single ticket
async function getTicket(user, ticketId) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      assignee: { select: { id: true, full_name: true } },
      requester: { select: { id: true, full_name: true, role: true } },
    },
  });
  if (!ticket) return null;
  if (user.role !== "admin" && ticket.requester_user_id !== user.id) return null;
  return ticket;
}

// ---------------------------------------------------------------------------
// Create ticket
async function createTicket(user, { category, subject, description }) {
  const cat = CATEGORIES.includes(category) ? category : "other";
  const priority = cat === "technical" ? "high" : "medium";
  const ticket = await prisma.supportTicket.create({
    data: {
      ticket_no: nextTicketNo(),
      requester_user_id: user.id,
      category: cat,
      subject,
      body: description,
      priority,
    },
  });
  return ticket;
}

// ---------------------------------------------------------------------------
// Update ticket status (admin or ticket owner)
async function updateTicket(user, ticketId, { status, assignee_user_id, resolution_note }) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) return null;
  if (user.role !== "admin" && ticket.requester_user_id !== user.id) return null;

  const data = {};
  if (status && STATUSES.includes(status)) {
    data.status = status;
    if (status === "resolved") data.resolved_at = new Date();
  }
  if (assignee_user_id !== undefined && user.role === "admin") {
    data.assignee_user_id = assignee_user_id || null;
  }

  return prisma.supportTicket.update({ where: { id: ticketId }, data });
}

// ---------------------------------------------------------------------------
// Constants for mobile pickers
function constants() {
  return { CATEGORIES, STATUSES, PRIORITIES };
}

module.exports = {
  listTickets,
  getTicket,
  createTicket,
  updateTicket,
  constants,
};
