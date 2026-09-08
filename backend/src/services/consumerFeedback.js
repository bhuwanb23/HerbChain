// ============================================================================
// CONSUMER FEEDBACK SERVICE (Phase A8)
// ---------------------------------------------------------------------------
const { prisma } = require("../db/client");

async function submitFeedback({ scan_id, product_id, batch_id, qr_token, type, rating, message, contact_email, contact_phone }) {
  return prisma.consumerFeedback.create({
    data: {
      scan_id: scan_id || null,
      product_id: product_id || null,
      batch_id: batch_id || null,
      qr_token: qr_token || null,
      type: type === "fake_report" ? "fake_report" : "feedback",
      rating: rating || null,
      message,
      contact_email: contact_email || null,
      contact_phone: contact_phone || null,
    },
  });
}

async function listFeedback({ type, status, limit = 50, offset = 0 } = {}) {
  const where = {};
  if (type) where.type = type;
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.consumerFeedback.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.consumerFeedback.count({ where }),
  ]);

  return { items, total };
}

async function updateFeedback(id, { status, admin_note }) {
  const data = {};
  if (status) data.status = status;
  if (admin_note !== undefined) data.admin_note = admin_note;
  return prisma.consumerFeedback.update({ where: { id }, data });
}

module.exports = { submitFeedback, listFeedback, updateFeedback };
