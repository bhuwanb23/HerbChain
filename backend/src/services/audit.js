/**
 * Account/admin audit writer (docs/phase_2.md §18, architecture.md §2).
 *
 * This is the append-only record for account & admin events (LOGIN, LOGOUT,
 * PASSWORD_CHANGE, USER_VERIFIED, REFRESH_REUSE, …). Supply-chain events live
 * in BatchEvent / ProductLotEvent. meta_json carries before/after, reason,
 * request ids, device info — anything JSON-serializable.
 */
const { prisma } = require("../db/client");

/**
 * @param {object} input
 * @param {string|null} [input.actorUserId]  null => system-initiated action
 * @param {string} input.action              audit action code (see architecture.md)
 * @param {string|null} [input.targetType]   polymorphic target, e.g. "user"
 * @param {string|null} [input.targetId]
 * @param {object|null} [input.meta]         JSON-serializable extras
 */
async function writeAudit({ actorUserId = null, action, targetType = null, targetId = null, meta = null }) {
  if (!action) throw new Error("writeAudit: action is required");
  return prisma.auditLog.create({
    data: {
      actor_user_id: actorUserId,
      action,
      target_type: targetType,
      target_id: targetId,
      meta_json: meta === null ? undefined : meta,
    },
  });
}

module.exports = { writeAudit };
