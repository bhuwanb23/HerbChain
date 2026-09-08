/**
 * Failed-login lockout (docs/phase_2.md §19, architecture.md §6).
 *
 * 5 consecutive failures locks the account temporarily; the window escalates
 * 15 min -> 1 h -> 24 h on repeated lock events. A successful login resets
 * the counter (handled by the login route via registerSuccess).
 */
const { prisma } = require("../db/client");

const MAX_FAILURES = 5;
// Escalation tiers indexed by (strikes - MAX_FAILURES), capped at the last.
const LOCK_WINDOWS_MS = [
  15 * 60 * 1000,
  60 * 60 * 1000,
  24 * 60 * 60 * 1000,
];

function isLocked(user) {
  return Boolean(user && user.locked_until && new Date(user.locked_until) > new Date());
}

/**
 * Record a failed attempt. Returns the post-update state.
 * @returns { { locked: boolean, failed_login_count: number, locked_until: Date|null } }
 */
async function registerFailure(user) {
  const strikes = (user.failed_login_count || 0) + 1;
  const tier = Math.min(Math.max(strikes - MAX_FAILURES, 0), LOCK_WINDOWS_MS.length - 1);
  const locked = strikes >= MAX_FAILURES;
  const locked_until = locked ? new Date(Date.now() + LOCK_WINDOWS_MS[tier]) : null;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { failed_login_count: strikes, locked_until },
  });
  return {
    locked,
    failed_login_count: updated.failed_login_count,
    locked_until: updated.locked_until,
  };
}

/** Clear the failure counter after a successful login. */
async function registerSuccess(user) {
  if (!user.failed_login_count && !user.locked_until) return user;
  return prisma.user.update({
    where: { id: user.id },
    data: { failed_login_count: 0, locked_until: null },
  });
}

module.exports = { MAX_FAILURES, LOCK_WINDOWS_MS, isLocked, registerFailure, registerSuccess };
