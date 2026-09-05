/**
 * Phase 14 — notification engine (docs/phase_14.md).
 *
 * The nervous system of HerbChain. Core rule: business modules NEVER send
 * messages directly. They call publish() INSIDE their own transaction —
 * publish resolves the template, checks the recipient's channel preferences
 * and enqueues one queue row per allowed channel. The worker
 * (src/services/notificationWorker.js) drains the queue in the background:
 * render -> Notification row -> provider send -> delivery receipt, with
 * retry/backoff and FAILED handling.
 *
 * Also here: the inbox (list/read), preferences, device tokens, the
 * scheduled-notification + reminder engine (pickup 24h, cert expiry 30d),
 * the shipment-delay escalation ladder (transporter -> lab/mfr -> AYUSH),
 * analytics/metrics and the admin broadcast + center.
 */
const { prisma } = require("../db/client");
const { ApiError } = require("../utils/errors");
const {
  PRIORITIES,
  QUEUE_STATUSES,
  DELIVERY_STATUSES,
  SCHEDULED_STATUSES,
  EVENT_CATALOG,
  REMINDERS,
  ESCALATION,
  RETRY,
} = require("../constants/notifications");
const { env } = require("../config/env");
const providers = require("./notification/providers");

// ------------------------------------------------------------ template helpers

/** Replace {placeholders} in a template string. Unknown keys -> literal. */
function render(text, data = {}) {
  return String(text || "").replace(/\{(\w+)\}/g, (m, key) =>
    data[key] !== undefined && data[key] !== null ? String(data[key]) : m
  );
}

/**
 * SQLite-safe dedup: does a pending/processed scheduled row already exist
 * with this notification_type whose payload.entity.id matches? (Prisma JSON
 * path filters are Postgres-only.)
 */
async function hasScheduledFor(type, entityId, tag = null) {
  const rows = await prisma.scheduledNotification.findMany({
    where: { notification_type: type, status: { in: [SCHEDULED_STATUSES.PENDING, SCHEDULED_STATUSES.PROCESSED] } },
    select: { payload_json: true },
  });
  return rows.some((r) => {
    if (!r.payload_json || !r.payload_json.entity || r.payload_json.entity.id !== entityId) return false;
    if (tag === null) return true;
    return r.payload_json.tag === tag;
  });
}

/**
 * Idempotent: upsert the full event catalog into NotificationTemplate.
 * Called by seed + bootstrap; safe to run on every boot.
 */
async function seedTemplates(tx = prisma) {
  let count = 0;
  for (const t of EVENT_CATALOG) {
    await tx.notificationTemplate.upsert({
      where: { code: t.code },
      update: {
        name: t.name,
        channels: t.channels,
        title: t.title,
        body: t.body,
        category: t.category,
        priority: t.priority,
        is_active: true,
      },
      create: {
        code: t.code,
        name: t.name,
        channels: t.channels,
        title: t.title,
        body: t.body,
        category: t.category,
        priority: t.priority,
      },
    });
    count += 1;
  }
  return count;
}

async function getTemplate(code) {
  const tpl = await prisma.notificationTemplate.findUnique({ where: { code } });
  if (!tpl) throw new ApiError("not_found", `Unknown notification template '${code}'`, 404);
  return tpl;
}

function channelList(channels) {
  return String(channels || "in_app")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function userPrefs(tx, userId) {
  return tx.notificationPreference.upsert({
    where: { user_id: userId },
    update: {},
    create: { user_id: userId },
  });
}

/** Which channels this recipient actually gets for this template. */
async function resolveChannels(tx, tpl, prefs, forceChannel = null) {
  const allowed = channelList(tpl.channels);
  const base = forceChannel ? [forceChannel] : allowed;
  const out = [];
  for (const ch of base) {
    if (ch === "in_app" && !prefs.in_app_enabled) continue;
    if (ch === "email" && !prefs.email_enabled) continue;
    if (ch === "sms" && !prefs.sms_enabled) continue;
    if (ch === "push" && !prefs.push_enabled) continue;
    out.push(ch);
  }
  return out;
}

function periodKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

// ------------------------------------------------------------------ publish

/**
 * Publish an event notification INSIDE the caller's transaction (tx).
 * Enqueues one queue row per allowed channel — the worker delivers later,
 * so the domain transaction never touches a provider.
 *
 * data: template placeholders ({code}, {species}, ...) plus optional
 *       entity: { type, id } for deep links.
 */
async function publish(tx, { code, recipientUserId, channel = null, data = {}, priority = null }) {
  if (!recipientUserId) return [];
  // Fail-open by design (docs/phase_14.md core principle): a notification can
  // NEVER break the business transaction that published it. If the template
  // catalog hasn't been seeded yet (fresh DB / test harness), skip silently.
  // Authoring endpoints (sendBroadcast) validate the code explicitly instead.
  const tpl = await tx.notificationTemplate.findUnique({ where: { code } });
  if (!tpl) return [];

  const prefs = await userPrefs(tx, recipientUserId);
  const channels = await resolveChannels(tx, tpl, prefs, channel);
  const rows = [];
  for (const ch of channels) {
    rows.push(
      await tx.notificationQueue.create({
        data: {
          template_code: code,
          recipient_user_id: recipientUserId,
          channel: ch,
          payload_json: {
            ...data,
            entity: data.entity || null,
            priority: priority || tpl.priority,
          },
          priority: priority || tpl.priority,
        },
      })
    );
  }
  return rows;
}

/** Convenience for outside transactions (tests, admin broadcast fallback). */
async function publishDirect({ code, recipientUserId, channel = null, data = {}, priority = null }) {
  return prisma.$transaction((tx) => publish(tx, { code, recipientUserId, channel, data, priority }));
}

// --------------------------------------------------------------- worker core

function backoffMs(attempts) {
  // 1m / 5m / 15m / 30m / 1h -> FAILED at max_retries
  return RETRY.BASE_MS * Math.pow(5, Math.max(0, attempts - 1));
}

/**
 * Drain the queue: claim due pending rows, render + deliver each, write the
 * Notification row + per-channel delivery receipt. Retry/backoff on provider
 * failure; FAILED past max_retries (requeue resets).
 */
async function processQueue({ limit = env.NOTIFICATION_PROCESS_LIMIT, actor = "worker" } = {}) {
  const now = new Date();
  const due = await prisma.notificationQueue.findMany({
    where: { status: QUEUE_STATUSES.PENDING, next_attempt_at: { lte: now } },
    orderBy: { created_at: "asc" },
    take: Math.max(1, limit),
  });
  if (due.length === 0) return { processed: 0, failed: 0 };

  let processed = 0;
  let failed = 0;
  for (const row of due) {
    // Claim atomically: only this run may process the row now.
    const claim = await prisma.notificationQueue.updateMany({
      where: { id: row.id, status: QUEUE_STATUSES.PENDING },
      data: { status: QUEUE_STATUSES.PROCESSING, updated_at: new Date() },
    });
    if (claim.count === 0) continue;

    try {
      const tpl = await prisma.notificationTemplate.findUnique({ where: { code: row.template_code } });
      if (!tpl) throw new Error(`template '${row.template_code}' missing`);
      const payload = row.payload_json || {};
      const title = render(tpl.title, payload);
      const body = render(tpl.body, payload);

      const notification = await prisma.notification.create({
        data: {
          recipient_user_id: row.recipient_user_id,
          template_id: tpl.id,
          type: row.template_code,
          channel: row.channel,
          priority: row.priority || tpl.priority,
          category: tpl.category,
          title,
          body,
          data_json: payload.entity ? { entity: payload.entity } : null,
          entity_type: payload.entity ? payload.entity.type : null,
          entity_id: payload.entity ? payload.entity.id : null,
          sent_at: row.channel === "in_app" ? new Date() : null,
        },
      });

      let deliveryStatus = DELIVERY_STATUSES.SENT;
      let providerRef = null;
      if (row.channel === "in_app") {
        deliveryStatus = DELIVERY_STATUSES.DELIVERED; // inbox row is the delivery
      } else {
        const to = (await prisma.user.findUnique({ where: { id: row.recipient_user_id } })) || {};
        const contact = row.channel === "email" ? to.email : to.phone;
        if (!contact) throw new Error(`recipient has no ${row.channel === "email" ? "email" : "phone"}`);
        const send =
          row.channel === "email"
            ? providers.sendEmailMessage({ to: to.email, subject: title, body })
            : row.channel === "sms"
              ? providers.sendSms({ to: to.phone, title, body })
              : providers.sendPush({ to: to.phone || to.email, title, body });
        const receipt = await send;
        providerRef = receipt ? receipt.provider_ref : null;
        deliveryStatus = DELIVERY_STATUSES.SENT;
      }

      await prisma.notificationDelivery.create({
        data: {
          notification_id: notification.id,
          channel: row.channel,
          status: deliveryStatus,
          provider_ref: providerRef,
          sent_at: new Date(),
          delivered_at: deliveryStatus === DELIVERY_STATUSES.DELIVERED ? new Date() : null,
        },
      });

      await prisma.notificationQueue.update({
        where: { id: row.id },
        data: { status: QUEUE_STATUSES.SENT, processed_at: new Date(), updated_at: new Date() },
      });
      processed += 1;
    } catch (err) {
      const attempts = row.attempts + 1;
      const finalFail = attempts >= (env.NOTIFICATION_MAX_RETRIES || RETRY.MAX_ATTEMPTS);
      await prisma.notificationQueue.update({
        where: { id: row.id },
        data: {
          status: finalFail ? QUEUE_STATUSES.FAILED : QUEUE_STATUSES.PENDING,
          attempts,
          next_attempt_at: finalFail ? undefined : new Date(Date.now() + backoffMs(attempts)),
          last_error: err.message ? String(err.message).slice(0, 500) : "unknown error",
          updated_at: new Date(),
        },
      });
      if (finalFail) failed += 1;
    }
  }
  return { processed, failed, actor };
}

/** Reset FAILED queue rows to pending (manual requeue). */
async function requeueFailed({ ids = null, actor = "admin" } = {}) {
  const where = { status: QUEUE_STATUSES.FAILED, ...(ids && ids.length ? { id: { in: ids } } : {}) };
  const res = await prisma.notificationQueue.updateMany({
    where,
    data: { status: QUEUE_STATUSES.PENDING, attempts: 0, last_error: null, next_attempt_at: new Date(), updated_at: new Date() },
  });
  return { requeued: res.count, actor };
}

// -------------------------------------------------------------------- inbox

function serializeNotification(n) {
  return {
    id: n.id,
    type: n.type,
    channel: n.channel,
    priority: n.priority,
    category: n.category,
    title: n.title,
    body: n.body,
    entity: n.data_json && n.data_json.entity ? n.data_json.entity : null,
    is_read: n.is_read,
    read_at: n.read_at,
    sent_at: n.sent_at,
    created_at: n.created_at,
  };
}

async function listInbox(user, { unreadOnly = false, category = null, limit = 100, offset = 0 } = {}) {
  const where = {
    recipient_user_id: user.id,
    channel: "in_app",
    ...(unreadOnly ? { is_read: false } : {}),
    ...(category ? { category } : {}),
  };
  const [rows, total, unread] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: Math.min(200, Math.max(1, limit)),
      skip: Math.max(0, offset),
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { recipient_user_id: user.id, channel: "in_app", is_read: false } }),
  ]);
  return { notifications: rows.map(serializeNotification), total, unread };
}

async function markRead(user, { ids = null, all = false } = {}) {
  const where = { recipient_user_id: user.id, channel: "in_app", is_read: false, ...(all ? {} : { id: { in: ids } }) };
  const res = await prisma.notification.updateMany({ where, data: { is_read: true, read_at: new Date() } });
  return { marked: res.count };
}

// --------------------------------------------------------------- preferences

async function getPreferences(user) {
  return prisma.notificationPreference.upsert({
    where: { user_id: user.id },
    update: {},
    create: { user_id: user.id },
  });
}

async function setPreferences(user, patch = {}) {
  const allowed = ["email_enabled", "sms_enabled", "push_enabled", "in_app_enabled"];
  const data = {};
  for (const k of allowed) {
    if (patch[k] !== undefined) data[k] = Boolean(patch[k]);
  }
  if (Object.keys(data).length === 0) throw new ApiError("bad_request", "No preference fields provided", 400);
  return prisma.notificationPreference.upsert({
    where: { user_id: user.id },
    update: data,
    create: { user_id: user.id, ...data },
  });
}

// ------------------------------------------------------------------ devices

async function registerDevice(user, { device_id = null, platform = "web", token }) {
  if (!token) throw new ApiError("bad_request", "Device token is required", 400);
  const existing = await prisma.deviceToken.findUnique({ where: { token } });
  if (existing) {
    return prisma.deviceToken.update({
      where: { id: existing.id },
      data: { user_id: user.id, device_id: device_id || existing.device_id, platform, last_seen_at: new Date(), revoked_at: null },
    });
  }
  return prisma.deviceToken.create({
    data: { user_id: user.id, device_id, platform, token, last_seen_at: new Date() },
  });
}

async function revokeDevice(user, deviceId) {
  const device = await prisma.deviceToken.findUnique({ where: { id: deviceId } });
  if (!device || device.user_id !== user.id) throw new ApiError("not_found", "Device not found", 404);
  return prisma.deviceToken.update({ where: { id: deviceId }, data: { revoked_at: new Date() } });
}

async function listDevices(user) {
  return prisma.deviceToken.findMany({
    where: { user_id: user.id, revoked_at: null },
    orderBy: { last_seen_at: "desc" },
  });
}

// ------------------------------------------------------------- scheduled + reminders

/**
 * Schedule a future notification. Used by the reminder engine + escalation
 * ladder. processScheduled() publishes due rows into the queue.
 */
async function schedule({ notification_type, scheduled_time, recipientUserId, payload = {} }) {
  return prisma.scheduledNotification.create({
    data: {
      notification_type,
      scheduled_time: new Date(scheduled_time),
      recipient_user_id: recipientUserId,
      payload_json: payload,
    },
  });
}

/** Fire due scheduled notifications (worker tick). */
async function processScheduled({ limit = 50, now = new Date() } = {}) {
  const due = await prisma.scheduledNotification.findMany({
    where: { status: SCHEDULED_STATUSES.PENDING, scheduled_time: { lte: now } },
    orderBy: { scheduled_time: "asc" },
    take: Math.max(1, limit),
  });
  let fired = 0;
  let failed = 0;
  for (const s of due) {
    const claim = await prisma.scheduledNotification.updateMany({
      where: { id: s.id, status: SCHEDULED_STATUSES.PENDING },
      data: { status: SCHEDULED_STATUSES.PROCESSED, processed_at: new Date(), updated_at: new Date() },
    });
    if (claim.count === 0) continue;
    try {
      await prisma.$transaction((tx) =>
        publish(tx, {
          code: s.notification_type,
          recipientUserId: s.recipient_user_id,
          data: s.payload_json || {},
        })
      );
      fired += 1;
    } catch (err) {
      await prisma.scheduledNotification.update({
        where: { id: s.id },
        data: { status: SCHEDULED_STATUSES.FAILED, last_error: String(err.message || err).slice(0, 500), updated_at: new Date() },
      });
      failed += 1;
    }
  }
  return { fired, failed };
}

/**
 * Reminder engine scans (docs/phase_14.md "Reminder Engine"). Idempotent:
 * checks an existing pending reminder for the same entity before scheduling.
 *   - pickup reminder: 24h before a scheduled pickup
 *   - cert expiry: 30d before certificate expiry
 */
async function scanPickupReminders({ now = new Date() } = {}) {
  // Remind about pickups happening within the next 24h (+2h slack); the
  // reminder row itself fires at pickup - 24h (i.e. ~now).
  const windowStart = now;
  const windowEnd = new Date(now.getTime() + (REMINDERS.PICKUP_HOURS_BEFORE + 2) * 3600 * 1000);
  const shipments = await prisma.shipment.findMany({
    where: {
      scheduled_pickup_at: { gte: windowStart, lte: windowEnd },
      status: { in: ["assigned", "accepted"] },
      assigned_transporter_user_id: { not: null },
    },
    include: { transporter: { select: { id: true, name: true } } },
  });
  let created = 0;
  for (const s of shipments) {
    if (await hasScheduledFor("pickup_reminder", s.id)) continue;
    const remindAt = new Date(new Date(s.scheduled_pickup_at).getTime() - REMINDERS.PICKUP_HOURS_BEFORE * 3600 * 1000);
    await schedule({
      notification_type: "pickup_reminder",
      scheduled_time: remindAt,
      recipientUserId: s.assigned_transporter_user_id,
      payload: {
        code: s.shipment_no,
        pickupDate: s.scheduled_pickup_at.toISOString().slice(0, 10),
        entity: { type: "shipment", id: s.id },
      },
    });
    created += 1;
  }
  return { shipments: shipments.length, created };
}

async function scanCertExpiryReminders({ now = new Date() } = {}) {
  const horizon = new Date(now.getTime() + REMINDERS.CERT_EXPIRY_DAYS_BEFORE * 24 * 3600 * 1000);
  const soon = new Date(horizon.getTime() + 24 * 3600 * 1000);
  const certs = await prisma.certification.findMany({
    where: { expiry_date: { gte: horizon, lte: soon } },
    include: { batch: { select: { id: true, code: true, current_holder_user_id: true, farmer_id: true } } },
  });
  let created = 0;
  for (const c of certs) {
    if (await hasScheduledFor("certificate_expiry", c.id)) continue;
    const targets = new Set([c.batch?.current_holder_user_id, c.batch?.farmer_id].filter(Boolean));
    for (const uid of targets) {
      await schedule({
        notification_type: "certificate_expiry",
        scheduled_time: horizon,
        recipientUserId: uid,
        payload: {
          code: c.batch?.code || c.certificate_number,
          expiryDate: c.expiry_date.toISOString().slice(0, 10),
          entity: { type: "certificate", id: c.id },
        },
      });
      created += 1;
    }
  }
  return { certs: certs.length, created };
}

async function scanReminderEngine({ now = new Date() } = {}) {
  const pickup = await scanPickupReminders({ now });
  const cert = await scanCertExpiryReminders({ now });
  return { pickup, cert };
}

// ------------------------------------------------------------- escalation

/**
 * Escalation ladder for a delayed shipment (docs/phase_14.md "Escalation
 * System"): transporter now, lab/manufacturer after 4h, AYUSH after 12h.
 * Scans in-transit shipments past their expected delivery; schedules the
 * hops once per shipment (idempotent).
 */
async function scanEscalations({ now = new Date() } = {}) {
  const overdue = await prisma.shipment.findMany({
    where: {
      status: { in: ["picked_up", "in_transit"] },
      expected_delivery_at: { not: null, lt: now },
    },
    include: {
      transporter: { select: { id: true } },
      to_user: { select: { id: true, role: true } },
    },
  });
  let created = 0;
  for (const s of overdue) {
    const delayHours = Math.max(1, Math.round((now - new Date(s.expected_delivery_at)) / 3600 / 1000));
    for (let i = 0; i < ESCALATION.hops.length; i += 1) {
      const hop = ESCALATION.hops[i];
      const scheduledAt = new Date(new Date(s.expected_delivery_at).getTime() + hop.delay_hours * 3600 * 1000);
      if (scheduledAt > now) continue; // not due yet
      if (await hasScheduledFor(hop.event, s.id, `hop${i}`)) continue;
      // hop 0 -> transporter, hop 1 -> destination party (lab/manufacturer),
      // hop 2 -> AYUSH admins (one scheduled row per admin).
      const targets =
        i === 0
          ? s.transporter
            ? [s.transporter.id]
            : []
          : i === 1
            ? s.to_user
              ? [s.to_user.id]
              : []
            : await adminUserIds();
      for (const uid of targets) {
        await schedule({
          notification_type: hop.event,
          scheduled_time: scheduledAt,
          recipientUserId: uid,
          payload: {
            tag: `hop${i}`,
            code: s.shipment_no,
            delay: `${delayHours}h`,
            summary: `Shipment ${s.shipment_no} delayed past its expected delivery`,
            entity: { type: "shipment", id: s.id },
          },
        });
        created += 1;
      }
    }
  }
  return { overdue: overdue.length, created };
}

async function adminUserIds() {
  const admins = await prisma.user.findMany({ where: { role: "admin" }, select: { id: true } });
  return admins.map((a) => a.id);
}

// ------------------------------------------------------------------ analytics

/** Daily aggregates -> NotificationMetric rows (idempotent per period/type/channel). */
async function computeMetrics({ period = periodKey(), now = new Date() } = {}) {
  const start = new Date(`${period}T00:00:00Z`);
  const end = new Date(new Date(start).getTime() + 24 * 3600 * 1000);
  const rows = await prisma.notification.findMany({
    where: { created_at: { gte: start, lt: end } },
    include: { deliveries: true },
  });
  const agg = {};
  for (const n of rows) {
    const key = `${n.type}|${n.channel}`;
    agg[key] = agg[key] || { type: n.type, channel: n.channel, sent: 0, delivered: 0, failed: 0, read: 0 };
    agg[key].sent += 1;
    if (n.is_read) agg[key].read += 1;
    for (const d of n.deliveries) {
      if (d.status === "delivered") agg[key].delivered += 1;
      if (d.status === "failed") agg[key].failed += 1;
    }
  }
  let upserted = 0;
  for (const k of Object.keys(agg)) {
    const a = agg[k];
    await prisma.notificationMetric.upsert({
      where: { period_notification_type_channel: { period, notification_type: a.type, channel: a.channel } },
      update: {
        sent_count: a.sent,
        delivered_count: a.delivered,
        failed_count: a.failed,
        read_count: a.read,
        generated_at: now,
      },
      create: {
        period,
        notification_type: a.type,
        channel: a.channel,
        sent_count: a.sent,
        delivered_count: a.delivered,
        failed_count: a.failed,
        read_count: a.read,
        generated_at: now,
      },
    });
    upserted += 1;
  }
  return { period, upserted };
}

/** Admin analytics overview: totals, rates, channel usage. */
async function analytics({ period = periodKey() } = {}) {
  await computeMetrics({ period });
  const [metrics, recent] = await Promise.all([
    prisma.notificationMetric.findMany({ where: { period }, orderBy: [{ sent_count: "desc" }] }),
    prisma.notification.findMany({ orderBy: { created_at: "desc" }, take: 25, include: { deliveries: true } }),
  ]);
  const totals = {
    sent: 0,
    delivered: 0,
    failed: 0,
    read: 0,
    readUnique: 0,
  };
  const channelUsage = {};
  for (const m of metrics) {
    totals.sent += m.sent_count;
    totals.delivered += m.delivered_count;
    totals.failed += m.failed_count;
    totals.read += m.read_count;
    channelUsage[m.channel] = (channelUsage[m.channel] || 0) + m.sent_count;
  }
  const readRate = totals.sent ? Math.round((totals.read / totals.sent) * 100) : 0;
  const deliveryRate = totals.sent ? Math.round(((totals.delivered + totals.sent) / (totals.sent * 2)) * 100) : 0;
  const failureRate = totals.sent ? Math.round((totals.failed / totals.sent) * 100) : 0;
  return {
    period,
    totals: { ...totals, read_rate: readRate, delivery_rate: deliveryRate, failure_rate: failureRate },
    channel_usage: channelUsage,
    metrics,
    recent: recent.map(serializeNotification),
  };
}

// ------------------------------------------------------------- admin center

/** AYUSH notification center: critical alerts, failed deliveries, security. */
async function adminCenter({ limit = 50 } = {}) {
  const [critical, failedDeliveries, security, recalls, failedQueue] = await Promise.all([
    prisma.notification.findMany({
      where: { priority: PRIORITIES.CRITICAL },
      orderBy: { created_at: "desc" },
      take: Math.min(50, limit),
    }),
    prisma.notificationDelivery.findMany({
      where: { status: DELIVERY_STATUSES.FAILED },
      orderBy: { created_at: "desc" },
      take: Math.min(50, limit),
      include: { notification: true },
    }),
    prisma.notification.findMany({
      where: { category: "security" },
      orderBy: { created_at: "desc" },
      take: Math.min(50, limit),
    }),
    prisma.notification.findMany({
      where: { category: "recall" },
      orderBy: { created_at: "desc" },
      take: Math.min(50, limit),
    }),
    prisma.notificationQueue.findMany({
      where: { status: QUEUE_STATUSES.FAILED },
      orderBy: { updated_at: "desc" },
      take: Math.min(50, limit),
    }),
  ]);
  return {
    critical: critical.map(serializeNotification),
    failed_deliveries: failedDeliveries.map((d) => ({
      id: d.id,
      channel: d.channel,
      status: d.status,
      failure_reason: d.failure_reason,
      sent_at: d.sent_at,
      created_at: d.created_at,
      notification: d.notification ? serializeNotification(d.notification) : null,
    })),
    security_events: security.map(serializeNotification),
    recall_notifications: recalls.map(serializeNotification),
    failed_queue: failedQueue.map((q) => ({
      id: q.id,
      template_code: q.template_code,
      channel: q.channel,
      recipient_user_id: q.recipient_user_id,
      attempts: q.attempts,
      last_error: q.last_error,
      updated_at: q.updated_at,
    })),
  };
}

// ----------------------------------------------------------------- broadcast

/** Admin broadcast: publish a template to every user of a role (or all). */
async function sendBroadcast(actor, { code, role = null, data = {} }) {
  const tpl = await getTemplate(code);
  const where = role ? { role } : {};
  const users = await prisma.user.findMany({ where, select: { id: true } });
  if (users.length === 0) throw new ApiError("bad_request", `No users match role '${role || "all"}'`, 400);
  await prisma.$transaction(async (tx) => {
    for (const u of users) {
      await publish(tx, { code: tpl.code, recipientUserId: u.id, data: { ...data, entity: data.entity || null } });
    }
  });
  return { template: tpl.code, role: role || "all", recipients: users.length };
}

// -------------------------------------------------------------- serializers

function serializeQueueRow(q) {
  return {
    id: q.id,
    template_code: q.template_code,
    recipient_user_id: q.recipient_user_id,
    channel: q.channel,
    priority: q.priority,
    status: q.status,
    attempts: q.attempts,
    next_attempt_at: q.next_attempt_at,
    last_error: q.last_error,
    processed_at: q.processed_at,
    created_at: q.created_at,
  };
}

async function listQueue(user, { status = null, limit = 100, offset = 0 } = {}) {
  const where = { ...(status ? { status } : {}) };
  const [rows, total] = await Promise.all([
    prisma.notificationQueue.findMany({ where, orderBy: { created_at: "desc" }, take: Math.min(200, limit), skip: offset }),
    prisma.notificationQueue.count({ where }),
  ]);
  return { rows: rows.map(serializeQueueRow), total };
}

async function listScheduled({ status = null, limit = 100, offset = 0 } = {}) {
  const where = { ...(status ? { status } : {}) };
  const [rows, total] = await Promise.all([
    prisma.scheduledNotification.findMany({ where, orderBy: { scheduled_time: "desc" }, take: Math.min(200, limit), skip: offset }),
    prisma.scheduledNotification.count({ where }),
  ]);
  return { rows, total };
}

async function listTemplates() {
  return prisma.notificationTemplate.findMany({ orderBy: { code: "asc" } });
}

// ------------------------------------------------------------ exports

module.exports = {
  publish,
  publishDirect,
  seedTemplates,
  processQueue,
  requeueFailed,
  listInbox,
  markRead,
  getPreferences,
  setPreferences,
  registerDevice,
  revokeDevice,
  listDevices,
  schedule,
  processScheduled,
  scanReminderEngine,
  scanPickupReminders,
  scanCertExpiryReminders,
  scanEscalations,
  computeMetrics,
  analytics,
  adminCenter,
  sendBroadcast,
  listQueue,
  listScheduled,
  listTemplates,
  render,
  channelList,
  // test seams
  providers,
};