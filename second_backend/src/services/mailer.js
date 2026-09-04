/**
 * Email stub (docs/auth/architecture.md §12). Until the notifications phase
 * wires a real provider, outbound mail is logged and captured in memory so
 * tests (and the dev console) can read links/codes.
 */
const { getLogger } = require("../config/logging");
const { env } = require("../config/env");

const logger = getLogger("mailer");
const sent = [];

async function sendEmail({ to, subject, body }) {
  const record = { to, subject, body, provider: "stub", sent_at: new Date().toISOString() };
  sent.push(record);
  logger.info(`[mailer:stub] to=${to} subject="${subject}"\n${body}`);
  return record;
}

/** Public reset URL used by forgot-password (client app host from env). */
function resetUrl(token) {
  const base = (env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}/reset-password?token=${encodeURIComponent(token)}`;
}

function getSentEmails() {
  return sent.slice();
}

function clearSentEmails() {
  sent.length = 0;
}

module.exports = { sendEmail, resetUrl, getSentEmails, clearSentEmails };
