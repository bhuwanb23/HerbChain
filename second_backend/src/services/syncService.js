// ============================================================================
// PHASE 17 — OFFLINE SYNC (docs/phase_17.md, rural connectivity support).
// ----------------------------------------------------------------------------
// Field reality: farmers, transporters and collection centers work where the
// internet fails. Mobile clients keep an offline queue (their own SQLite
// sync_queue table) and replay it here when connectivity returns.
//
// Core philosophy of the phase: an OFFLINE action is never the FINAL action.
// The server replays queued operations through the same domain services the
// online APIs use — so server validation, custody state machines, QR checks,
// audits and blockchain anchors all still apply. Whatever cannot be applied
// becomes a SyncConflict (OWNERSHIP_CHANGED, QR_EXPIRED, DUPLICATE_BATCH,
// SHIPMENT_CANCELLED, VALIDATION_ERROR) for the client to surface and resolve.
// ============================================================================
const { prisma } = require("../db/client");
const { ApiError } = require("../utils/errors");
const { writeAudit } = require("./audit");
const { publish } = require("./notifications");
const { getLogger } = require("../config/logging");

const logger = getLogger("sync");

const { SYNC_ENTITY_TYPES, SYNC_OPERATIONS, CONFLICT_TYPES } = require("../constants/sync");
const STATUS = { SYNCED: "SYNCED", CONFLICT: "CONFLICT", FAILED: "FAILED" };

// ------------------------------------------------------------- device registry

/**
 * Register (or re-register) a device for a user. device_id is the
 * client-generated fingerprint — one active registration per (user, device).
 * Revocation (lost device) is admin/user action via /devices.
 */
async function registerDevice(user, { device_id, platform, device_name = null, app_version = null, last_sync_at = null }) {
  if (!device_id || !platform) throw new ApiError("validation_error", "device_id and platform are required", 400);
  const existing = await prisma.deviceRegistration.findUnique({
    where: { user_id_device_id: { user_id: user.id, device_id } },
  });
  if (existing) {
    const row = await prisma.deviceRegistration.update({
      where: { id: existing.id },
      data: { platform, device_name, app_version, last_sync_at: last_sync_at ? new Date(last_sync_at) : existing.last_sync_at, revoked_at: null },
    });
    return { device: row, reregistered: true };
  }
  const row = await prisma.deviceRegistration.create({
    data: { user_id: user.id, device_id, platform, device_name, app_version, last_sync_at: last_sync_at ? new Date(last_sync_at) : null },
  });
  await writeAudit({ actorUserId: user.id, action: "DEVICE_REGISTERED", targetType: "device_registration", targetId: row.id, meta: { device_id, platform } });
  return { device: row, reregistered: false };
}

/** List the caller's devices (or every device for admins). */
async function listDevices(user) {
  const where = user.role === "admin" ? {} : { user_id: user.id };
  return prisma.deviceRegistration.findMany({ where, orderBy: { created_at: "desc" } });
}

/** Revoke a device — the user themself, or any admin (lost-device flow). */
async function revokeDevice(user, deviceId) {
  // Scoped lookup: a user only ever "finds" their own device (404 otherwise);
  // admins may revoke any device (lost-device flow).
  const device = await prisma.deviceRegistration.findUnique({ where: { id: deviceId } });
  if (!device || (device.user_id !== user.id && user.role !== "admin")) throw new ApiError("not_found", "Device not found", 404);  const row = await prisma.deviceRegistration.update({ where: { id: deviceId }, data: { revoked_at: new Date() } });
  await writeAudit({ actorUserId: user.id, action: "DEVICE_REVOKED", targetType: "device_registration", targetId: deviceId, meta: { device_id: row.device_id } });
  return row;
}

// ------------------------------------------------------------ upload pipeline

/**
 * Apply one queued offline operation. Every handler delegates to the same
 * domain service the online route uses — validation, custody rules, audits
 * and blockchain anchors behave identically online and offline-synced.
 * Handlers return the created/updated server entity for the client receipt.
 */
const HANDLERS = {
  // Farmer offline batch draft → official batch (server generates the real
  // batch code + QR; local_id rides along for client reconciliation).
  batch_create: async (user, item) => {
    const { createBatch } = require("./batches");
    // Clients store dates date-only ("2026-09-01") — normalize to full ISO
    // before the domain layer (Prisma needs a real DateTime).
    const payload = { ...item.payload };
    if (payload.harvest_date) payload.harvest_date = new Date(payload.harvest_date).toISOString();
    const result = await createBatch(user, { ...payload, meta: { ...(payload.meta || {}), offline: true, local_id: item.local_id || null } });
    return { entity: result.batch, entity_id: result.batch.id, receipt: { batch_id: result.batch.id, code: result.batch.code, local_id: item.local_id || null } };
  },

  // Offline custody scan → a TRANSFER REQUEST (never a direct ownership
  // change — phase 17 core rule). The owner approves online as always.
  transfer_request: async (user, item) => {
    const { requestTransfer } = require("./transfers");
    const out = await requestTransfer(user, item.payload);
    return { entity: out.request || out, entity_id: (out.request || out).id, receipt: { request_id: (out.request || out).id, local_id: item.local_id || null } };
  },

  // Offline QR scan executed as custody transfer (transporter at pickup).
  // Still routed through executeTransfer: server re-checks the token, holder
  // and authorization — an offline scan NEVER mutates ownership by itself.
  transfer_execute: async (user, item) => {
    const { executeTransfer } = require("./transfers");
    const out = await executeTransfer(user, { ...item.payload, meta: { ...(item.payload.meta || {}), offline_sync: true } });
    return { entity: out, entity_id: out.id || null, receipt: { transfer_id: out.id || null, local_id: item.local_id || null } };
  },

  // Shipment lifecycle events captured offline (pickup / delivery / arrive).
  shipment_event: async (user, item) => {
    const shipments = require("./shipments");
    const { event, ...payload } = item.payload;
    const fn = { pickup: shipments.recordPickup, delivery: shipments.deliverShipment, arrive_pickup: shipments.arriveForPickup, arrive_destination: shipments.arriveDestination }[event];
    if (!fn) throw new ApiError("validation_error", `unknown shipment event: ${event}`, 400);
    const out = await fn(user, { ...payload, meta: { ...(payload.meta || {}), offline_sync: true } });
    return { entity: out, entity_id: out.id || null, receipt: { shipment_id: payload.shipment_id, event, local_id: item.local_id || null } };
  },

  // GPS breadcrumb points captured in transit (bulk, order preserved).
  gps_points: async (user, item) => {
    const points = Array.isArray(item.payload) ? item.payload : [item.payload];
    const rows = [];
    for (const p of points) {
      if (!p.shipment_id || p.gps_lat == null || p.gps_lng == null) {
        throw new ApiError("validation_error", "gps point requires shipment_id, gps_lat, gps_lng", 400);
      }
      rows.push({
        shipment_id: p.shipment_id, gps_lat: p.gps_lat, gps_lng: p.gps_lng,
        speed_kph: p.speed_kph ?? null, accuracy_m: p.accuracy_m ?? null,
        captured_at: p.captured_at ? new Date(p.captured_at) : new Date(),
        captured_by_user_id: user.id, note: p.note ?? "offline-sync",
      });
    }
    await prisma.shipmentTrackingPoint.createMany({ data: rows });
    return { entity: { count: rows.length }, entity_id: null, receipt: { count: rows.length, local_id: item.local_id || null } };
  },

  // Proof-of-delivery / field evidence media captured offline. The client
  // uploads the file bytes as base64 in the payload; we persist via the
  // storage driver + Asset registry (capture metadata rides along).
  media_upload: async (user, item) => {
    const storage = require("./storage");
    const p = item.payload || {};
    if (!p.data_base64 || !p.mime_type) throw new ApiError("validation_error", "media_upload requires data_base64 and mime_type", 400);
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(p.mime_type)) throw new ApiError("validation_error", `mime_type must be one of: ${allowed.join(", ")}`, 400);
    const buf = Buffer.from(p.data_base64, "base64");
    if (buf.length === 0) throw new ApiError("validation_error", "empty upload", 400);
    if (buf.length > 10 * 1024 * 1024) throw new ApiError("validation_error", "file too large (max 10MB)", 400);
    const kind = p.mime_type === "application/pdf" ? "document" : "image";
    const ext = p.mime_type === "application/pdf" ? ".pdf" : p.mime_type === "image/png" ? ".png" : p.mime_type === "image/webp" ? ".webp" : ".jpg";
    const key = `sync-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    const stored = await storage.put(key, buf);
    const asset = await prisma.asset.create({
      data: {
        owner_user_id: user.id, kind, mime_type: p.mime_type, size_bytes: buf.length,
        filename: p.filename || key, storage_key: key, url: storage.urlFor(key),
        metadata_json: {
          captured_at: p.captured_at || null, gps_lat: p.gps_lat ?? null, gps_lng: p.gps_lng ?? null,
          device_id: p.device_id || null, offline_sync: true, target_type: p.target_type || null, target_id: p.target_id || null,
        },
      },
    });
    return { entity: asset, entity_id: asset.id, receipt: { asset_id: asset.id, url: asset.url, local_id: item.local_id || null } };
  },
};

const PRIORITY = { batch_create: 1, shipment_event: 2, transfer_request: 3, transfer_execute: 3, gps_points: 4, media_upload: 5 };

function conflictTypeFor(err) {
  const code = err && err.code;
  if (code === "not_found") {
    return /token/i.test(err.message || "") ? CONFLICT_TYPES.QR_EXPIRED : CONFLICT_TYPES.SHIPMENT_CANCELLED;
  }
  if (code === "invalid_state" || code === "invalid_transition" || code === "conflict" || code === "stale_holder") {
    // Custody reality moved on while the client was offline (phase advanced,
    // holder changed, request went stale) — the scan is no longer applicable.
    return CONFLICT_TYPES.OWNERSHIP_CHANGED;
  }
  if (code === "validation_error" || code === "bad_request" || code === "forbidden") return CONFLICT_TYPES.VALIDATION_ERROR;
  return CONFLICT_TYPES.VALIDATION_ERROR;
}

/**
 * POST /sync/upload — replay a client's offline queue.
 *
 * items: [{ local_id, entity_type, operation, payload, client_timestamp,
 *           device_id? }] — applied in the client-supplied order (clients
 * must respect dependency order: batch → qr/shipment → transfer). Each item
 * is wrapped in its own transaction boundary (the domain service's) so one
 * bad row never poisons the batch; failures become SyncConflict rows and the
 * sync continues (partial success is the contract).
 */
async function upload(user, { device_id = null, items = [] }) {
  if (!Array.isArray(items) || items.length === 0) throw new ApiError("validation_error", "items[] required", 400);
  if (items.length > 500) throw new ApiError("validation_error", "max 500 items per upload", 400);
  for (const it of items) {
    if (!SYNC_ENTITY_TYPES.includes(it.entity_type)) throw new ApiError("validation_error", `unknown entity_type: ${it.entity_type}`, 400);
    if (!SYNC_OPERATIONS.includes(it.operation)) throw new ApiError("validation_error", `unknown operation: ${it.operation}`, 400);
  }

  const device = device_id
    ? await prisma.deviceRegistration.findUnique({ where: { user_id_device_id: { user_id: user.id, device_id } } })
    : null;
  if (device_id && (!device || device.revoked_at)) throw new ApiError("forbidden", "device not registered (or revoked)", 403);

  const syncLog = await prisma.syncLog.create({
    data: { user_id: user.id, device_id: device ? device.id : null, items_total: items.length, status: "in_progress" },
  });

  let applied = 0;
  let conflicted = 0;
  const results = [];

  for (const item of items) {
    const handler = HANDLERS[item.entity_type];
    if (!handler) {
      conflicted += 1;
      results.push({ local_id: item.local_id, status: STATUS.FAILED, conflict_type: CONFLICT_TYPES.VALIDATION_ERROR, error: `no handler for ${item.entity_type}` });
      continue;
    }
    try {
      const out = await handler(user, item);
      applied += 1;
      await prisma.syncEvent.create({ data: { sync_log_id: syncLog.id, queue_ref: item.local_id || null, entity_type: item.entity_type, operation: item.operation, status: "SYNCED", server_entity_id: out.entity_id, priority: PRIORITY[item.entity_type] || 9 } });
      results.push({ local_id: item.local_id, status: STATUS.SYNCED, receipt: out.receipt });
    } catch (err) {
      const isApi = err instanceof ApiError;
      conflicted += 1;
      const conflictType = isApi ? conflictTypeFor(err) : CONFLICT_TYPES.VALIDATION_ERROR;
      const conflict = await prisma.syncConflict.create({
        data: { sync_log_id: syncLog.id, queue_ref: item.local_id || null, user_id: user.id, device_id: device ? device.id : null, entity_type: item.entity_type, conflict_type: conflictType, description: (err && err.message) || "sync failed", payload_json: item.payload || {} },
      });
      await prisma.syncEvent.create({ data: { sync_log_id: syncLog.id, queue_ref: item.local_id || null, entity_type: item.entity_type, operation: item.operation, status: "CONFLICT", conflict_id: conflict.id, priority: PRIORITY[item.entity_type] || 9 } });
      results.push({ local_id: item.local_id, status: STATUS.CONFLICT, conflict_id: conflict.id, conflict_type: conflictType, error: (err && err.message) || "sync failed" });
      if (!isApi) logger.warn(`sync item ${item.local_id} failed unexpectedly: ${err.message}`);
    }
  }

  const status = conflicted === 0 ? "completed" : applied > 0 ? "partial" : "failed";
  const completedAt = new Date();
  await prisma.syncLog.update({ where: { id: syncLog.id }, data: { items_applied: applied, items_conflicted: conflicted, status, completed_at: completedAt, duration_ms: Math.max(0, completedAt.getTime() - syncLog.started_at.getTime()) } });
  if (device) await prisma.deviceRegistration.update({ where: { id: device.id }, data: { last_sync_at: new Date() } });
  await writeAudit({ actorUserId: user.id, action: "SYNC_UPLOAD", targetType: "sync_log", targetId: syncLog.id, meta: { total: items.length, applied, conflicted, status } });

  return { sync_id: syncLog.id, status, applied, conflicted, results };
}

// --------------------------------------------------------- incremental pull

/**
 * GET /sync/changes?since=<iso> — incremental download: only what changed
 * for THIS user since their last successful sync (phase 17 "don't download
 * everything"). Returns owned batches, assigned shipments (+ their tracking
 * points), active transfer requests and the active QR tokens for those
 * batches — the client's offline cache.
 */
async function changes(user, { since, device_id = null, limit = 200 } = {}) {
  const sinceDate = since ? new Date(since) : new Date(0);
  if (Number.isNaN(sinceDate.getTime())) throw new ApiError("validation_error", "invalid since timestamp", 400);

  const [batches, shipments, transfersOut, transfersIn] = await Promise.all([
    prisma.batch.findMany({
      // Custody view: the client caches what it currently HOLDS (a farmer
      // stops needing a batch the moment custody moves past them).
      where: { current_holder_user_id: user.id, updated_at: { gt: sinceDate } },
      select: { id: true, code: true, species_id: true, weight_kg: true, phase: true, test_status: true, current_holder_user_id: true, updated_at: true },
      take: limit, orderBy: { updated_at: "desc" },
    }),
    prisma.shipment.findMany({
      where: { assigned_transporter_user_id: user.id, updated_at: { gt: sinceDate } },
      select: { id: true, shipment_no: true, status: true, ref_type: true, ref_id: true, scheduled_pickup_at: true, expected_delivery_at: true, updated_at: true },
      take: limit, orderBy: { updated_at: "desc" },
    }),
    prisma.transferRequest.findMany({
      where: { from_user_id: user.id, updated_at: { gt: sinceDate } },
      select: { id: true, batch_id: true, status: true, type: true, updated_at: true },
      take: limit, orderBy: { updated_at: "desc" },
    }),
    prisma.transferRequest.findMany({
      where: { to_user_id: user.id, updated_at: { gt: sinceDate } },
      select: { id: true, batch_id: true, status: true, type: true, updated_at: true },
      take: limit, orderBy: { updated_at: "desc" },
    }),
  ]);

  const shipmentIds = shipments.map((s) => s.id);
  const batchIds = batches.map((b) => b.id);
  const [tracking, tokenRows] = await Promise.all([
    shipmentIds.length ? prisma.shipmentTrackingPoint.findMany({ where: { shipment_id: { in: shipmentIds }, captured_at: { gt: sinceDate } }, orderBy: { captured_at: "asc" } }) : [],
    batchIds.length ? prisma.qrToken.findMany({ where: { batch_id: { in: batchIds }, status: "active" } }) : [],
  ]);

  // The client needs the RAW token (it validates scans offline against it);
  // the registry only stores hash+cipher, so decrypt for the wire here.
  const { decryptToken } = require("./qrEngine");
  const tokens = tokenRows.map((t) => ({
    id: t.id, batch_id: t.batch_id, token: decryptToken(t.token_cipher),
    expires_at: t.expires_at, version: t.version, status: t.status,
  }));

  return {
    since: sinceDate.toISOString(),
    server_time: new Date().toISOString(),
    has_more: batches.length === limit || shipments.length === limit,
    batches, shipments, transfers_out: transfersOut, transfers_in: transfersIn, tracking, qr_tokens: tokens,
  };
}

/** GET /sync/status — the device's sync health summary. */
async function status(user, { device_id = null } = {}) {
  const since24h = new Date(Date.now() - 86400000);
  const device = device_id
    ? await prisma.deviceRegistration.findUnique({ where: { user_id_device_id: { user_id: user.id, device_id } } })
    : null;
  const [lastLog, openConflicts, recentConflicts, pendingEvents] = await Promise.all([
    prisma.syncLog.findFirst({ where: { user_id: user.id }, orderBy: { started_at: "desc" } }),
    prisma.syncConflict.count({ where: { user_id: user.id, resolved_at: null } }),
    prisma.syncEvent.count({ where: { status: "CONFLICT", created_at: { gte: since24h } } }),
    prisma.syncEvent.count({ where: { status: "PENDING" } }),
  ]);
  const avg = await prisma.syncLog.aggregate({
    _avg: { duration_ms: true },
    where: { user_id: user.id, status: { in: ["completed", "partial"] }, completed_at: { gte: since24h } },
  });
  return {
    device: device ? { id: device.id, device_id: device.device_id, last_sync_at: device.last_sync_at } : null,
    last_sync: lastLog ? { at: lastLog.completed_at || lastLog.started_at, status: lastLog.status } : null,
    open_conflicts: openConflicts,
    conflicts_24h: recentConflicts,
    pending_events: pendingEvents,
    avg_sync_ms_24h: avg._avg.duration_ms ? Math.round(avg._avg.duration_ms) : 0,
  };
}

// ------------------------------------------------------------ conflict center

/** List conflicts (own for users, all for admins). */
async function listConflicts(user, { resolved = null, limit = 100 } = {}) {
  const where = {};
  if (user.role !== "admin") where.user_id = user.id;
  if (resolved !== null) where.resolved_at = resolved ? { not: null } : null;
  return prisma.syncConflict.findMany({ where, orderBy: { created_at: "desc" }, take: limit });
}

/**
 * Resolve a conflict. resolution: discard (drop the offline op) | requeue
 * (client should retry with a corrected payload — marks unresolved again
 * on the client side via the response) | applied (client fixed it another
 * way — informational close).
 */
async function resolveConflict(user, conflictId, { resolution, note = null }) {
  const conflict = await prisma.syncConflict.findUnique({ where: { id: conflictId } });
  if (!conflict) throw new ApiError("not_found", "Conflict not found", 404);
  if (conflict.user_id !== user.id && user.role !== "admin") throw new ApiError("forbidden", "not your conflict", 403);
  const resolvedAt = new Date();
  const row = await prisma.syncConflict.update({
    where: { id: conflictId },
    data: { resolution, resolution_note: note, resolved_by_user_id: user.id, resolved_at: resolvedAt },
  });
  await writeAudit({ actorUserId: user.id, action: "SYNC_CONFLICT_RESOLVED", targetType: "sync_conflict", targetId: conflictId, meta: { resolution, conflict_type: conflict.conflict_type } });
  return row;
}

// ---------------------------------------------------------------- analytics

/** Offline-adoption analytics for AYUSH (phase 17 "Offline Analytics"). */
async function analyticsSummary({ days = 7 } = {}) {
  const since = new Date(Date.now() - days * 86400000);
  const [logs, events, conflicts, devices] = await Promise.all([
    prisma.syncLog.findMany({ where: { started_at: { gte: since } }, select: { items_total: true, items_applied: true, items_conflicted: true, status: true, started_at: true, completed_at: true, duration_ms: true } }),
    prisma.syncEvent.groupBy({ by: ["entity_type", "status"], _count: { _all: true }, where: { created_at: { gte: since } } }),
    prisma.syncConflict.groupBy({ by: ["conflict_type"], _count: { _all: true }, where: { created_at: { gte: since } } }),
    prisma.deviceRegistration.aggregate({ _count: { _all: true }, where: { revoked_at: null } }),
  ]);
  const totals = logs.reduce((a, l) => ({ items: a.items + l.items_total, applied: a.applied + l.items_applied, conflicted: a.conflicted + l.items_conflicted }), { items: 0, applied: 0, conflicted: 0 });
  const durations = logs.filter((l) => l.duration_ms != null).map((l) => l.duration_ms);
  const completed = logs.filter((l) => l.status === "completed").length;
  const avgSyncMs = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  return {
    window_days: days,
    sync_sessions: logs.length,
    completion_rate: logs.length ? Math.round((completed / logs.length) * 10000) / 100 : 0,
    items_total: totals.items,
    items_applied: totals.applied,
    items_conflicted: totals.conflicted,
    conflict_rate: totals.items ? Math.round((totals.conflicted / totals.items) * 10000) / 100 : 0,
    avg_sync_ms: avgSyncMs,
    by_entity: events.map((e) => ({ entity_type: e.entity_type, status: e.status, count: e._count._all })),
    by_conflict_type: conflicts.map((c) => ({ conflict_type: c.conflict_type, count: c._count._all })),
    active_devices: devices._count._all,
  };
}

module.exports = {
  registerDevice, listDevices, revokeDevice,
  upload, changes, status,
  listConflicts, resolveConflict, analyticsSummary,
  HANDLERS, PRIORITY,
};
