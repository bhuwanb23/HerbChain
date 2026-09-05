/**
 * Phase 14 — channel providers (docs/phase_14.md "Channel Selection").
 *
 * The notification service NEVER calls a vendor directly — it goes through
 * this seam. Stub providers capture outbound messages in memory (exactly like
 * src/services/mailer.js) so tests + the live smoke can assert delivery; a
 * real provider (Twilio / MSG91 / FCM / APNs / SMTP) is a swap-in behind the
 * same signatures.
 *
 * Test seams: setProvider(channel, fn) / failNext(channel) let suites simulate
 * an outage (retry/backoff path) without any network.
 */
const { env } = require("../../config/env");
const { getLogger } = require("../../config/logging");
const { sendEmail } = require("../mailer");

const logger = getLogger("notification-providers");

const sent = { sms: [], push: [], email: [] };

// Test seams: override a channel with a fake fn, or force the next N sends
// of a channel to throw (simulates provider outage).
const overrides = {};
const failCounters = { sms: 0, push: 0, email: 0 };

function capture(channel, record) {
  sent[channel].push(record);
  logger.info(`[notification:${channel}] to=${record.to} title="${record.title}"\n${record.body}`);
  return { provider_ref: `${channel}-${sent[channel].length}`, channel };
}

async function sendSms({ to, title, body }) {
  const record = { to, title, body, provider: env.SMS_PROVIDER || "stub", sent_at: new Date().toISOString() };
  if (overrides.sms) return overrides.sms(record);
  if (failCounters.sms > 0) {
    failCounters.sms -= 1;
    throw new Error("SMS provider outage (simulated)");
  }
  return capture("sms", record);
}

async function sendPush({ to, title, body }) {
  const record = { to, title, body, provider: env.PUSH_PROVIDER || "stub", sent_at: new Date().toISOString() };
  if (overrides.push) return overrides.push(record);
  if (failCounters.push > 0) {
    failCounters.push -= 1;
    throw new Error("Push provider outage (simulated)");
  }
  return capture("push", record);
}

async function sendEmailMessage({ to, subject, body }) {
  const record = { to, subject, body, provider: env.EMAIL_PROVIDER || "stub", sent_at: new Date().toISOString() };
  if (overrides.email) return overrides.email(record);
  if (failCounters.email > 0) {
    failCounters.email -= 1;
    throw new Error("Email provider outage (simulated)");
  }
  const mail = await sendEmail({ to, subject, body });
  record.provider_ref = mail ? `email-${sent.email.length + 1}` : undefined;
  return capture("email", record);
}

// ------------------------------------------------------------- test seams
function setProvider(channel, fn) {
  overrides[channel] = fn || null;
}

function failNext(channel, n = 1) {
  failCounters[channel] = Math.max(0, (failCounters[channel] || 0) + n);
}

function getSent(channel) {
  return sent[channel] ? sent[channel].slice() : [];
}

function clearSent() {
  sent.sms.length = 0;
  sent.push.length = 0;
  sent.email.length = 0;
  failCounters.sms = 0;
  failCounters.push = 0;
  failCounters.email = 0;
}

module.exports = {
  sendSms,
  sendPush,
  sendEmailMessage,
  setProvider,
  failNext,
  getSent,
  clearSent,
};