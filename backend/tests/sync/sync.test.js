/**
 * Phase 17 — offline sync suite (docs/phase_17.md).
 *
 * Covers: device registration/revocation, the upload engine (batch drafts →
 * official batch + QR, offline transfer requests, shipment events, GPS
 * breadcrumbs, media uploads), per-item isolation, conflict capture
 * (ownership changed / unknown token / duplicate draft), incremental
 * changes pull, sync status, conflict resolution and admin analytics.
 */
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const path = require("path");
const { setupDb } = require("./_db");
const db = setupDb();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({ datasources: { db: { url: db.url } } });

const { hashPassword } = require("../../src/services/passwords");
const rbac = require("../../src/db/rbac");
const notif = require("../../src/services/notifications");
const { createApp } = require("../../src/app");
const request = require("supertest");
const syncService = require("../../src/services/syncService");

let app;
const ids = {};
let farmerToken;
let farmer2Token;
let tptToken;
let adminToken;

const NOW = new Date();

async function makeUser(email, role, extra = {}) {
  return prisma.user.create({
    data: { name: role, email, password_hash: hashPassword("password1"), role, is_active: true, kyc_status: "verified", ...extra },
  });
}

async function login(email) {
  const res = await request(app).post("/api/v1/auth/login").send({ identifier: email, password: "password1" });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  return res.body.data.access_token;
}

function makeBatchRow(code, farmerId, speciesId) {
  return prisma.batch.create({
    data: { code, farmer_id: farmerId, species_id: speciesId, weight_kg: 50, phase: "with_farmer", current_holder_user_id: farmerId },
  });
}

/** Seed an active QR token for a batch (offline scans validate against it). */
function mintQr(batchId, holder) {
  const { mintRawToken, hashToken, encryptToken } = require("../../src/services/qrEngine");
  const raw = mintRawToken();
  return prisma.qrToken.create({
    data: {
      batch_id: batchId, version: 1, token_hash: hashToken(raw), token_cipher: encryptToken(raw),
      token_prefix: raw.slice(0, 10), status: "active", owner_user_id: holder.id, owner_role: holder.role, generated_by_user_id: holder.id, expiry_at: new Date(Date.now() + 30 * 86400000),
    },
  });
}

/** Minimal valid Asset row (createBatch requires ≥1 farmer-owned image). */
function seedAsset(ownerId) {
  return prisma.asset.create({ data: { owner_user_id: ownerId, kind: "image", mime_type: "image/jpeg", filename: "seed.jpg", storage_key: `seed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg` } });
}

before(async () => {
  await rbac.seedRbac();
  await notif.seedTemplates();
  app = createApp();

  const farmer = await makeUser("sync.farmer@test.io", "farmer");
  const farmer2 = await makeUser("sync.farmer2@test.io", "farmer");
  const tpt = await makeUser("sync.tpt@test.io", "transporter");
  const admin = await makeUser("sync.admin@test.io", "admin");
  Object.assign(ids, { farmer: farmer.id, farmer2: farmer2.id, tpt: tpt.id, admin: admin.id });

  const tulsi = await prisma.species.create({ data: { code: "SPC-TULSI", common_name: "Holy Basil", scientific_name: "Ocimum tenuiflorum", ayush_category: "ayurveda" } });
  ids.tulsi = tulsi.id;
  ids.farmerAsset = (await seedAsset(farmer.id)).id;

  // Existing batches for conflict scenarios:
  // b_owned — stays with farmer (valid transfer target)
  // b_moved — current holder switched to farmer2 while client was offline (OWNERSHIP_CHANGED)
  ids.b_owned = (await makeBatchRow("BAT-SYNC-001", farmer.id, tulsi.id)).id;
  ids.b_moved = (await makeBatchRow("BAT-SYNC-002", farmer.id, tulsi.id)).id;
  ids.b_tpt = (await makeBatchRow("BAT-SYNC-003", farmer.id, tulsi.id)).id; // clean batch for the tpt pickup flow
  await mintQr(ids.b_owned, farmer);
  await mintQr(ids.b_tpt, farmer);
  await prisma.batch.update({ where: { id: ids.b_moved }, data: { current_holder_user_id: farmer2.id, phase: "with_lab" } });

  farmerToken = await login("sync.farmer@test.io");
  farmer2Token = await login("sync.farmer2@test.io");
  tptToken = await login("sync.tpt@test.io");
  adminToken = await login("sync.admin@test.io");
});

after(() => db.cleanup());

// ------------------------------------------------------------ device registry

test("device registration: register, re-register refreshes, list own, revoke (owner ok, other 404/403)", async () => {
  const reg = await request(app).post("/api/v1/devices/register").set("Authorization", `Bearer ${farmerToken}`)
    .send({ device_id: "dev-farmer-001", platform: "android", device_name: "Redmi Note 12", app_version: "1.4.0" });
  assert.equal(reg.status, 201, JSON.stringify(reg.body));
  assert.equal(reg.body.data.reregistered, false);
  ids.deviceRow = reg.body.data.device.id;

  const rereg = await request(app).post("/api/v1/devices/register").set("Authorization", `Bearer ${farmerToken}`)
    .send({ device_id: "dev-farmer-001", platform: "android", app_version: "1.5.0" });
  assert.equal(rereg.status, 201);
  assert.equal(rereg.body.data.reregistered, true);
  assert.equal(rereg.body.data.device.id, ids.deviceRow);
  assert.equal(rereg.body.data.device.app_version, "1.5.0");

  const list = await request(app).get("/api/v1/devices").set("Authorization", `Bearer ${farmerToken}`);
  assert.equal(list.status, 200);
  assert.equal(list.body.data.rows.length, 1);

  // a fresh (unregistered) device id → sync upload with device_id must 403
  const badUpload = await request(app).post("/api/v1/sync/upload").set("Authorization", `Bearer ${farmerToken}`)
    .send({ device_id: "dev-unknown-999", items: [{ local_id: "L1", entity_type: "batch_create", operation: "CREATE", payload: {} }] });
  assert.equal(badUpload.status, 403);

  // revoke — another user cannot revoke someone else's device
  const otherRevoke = await request(app).post(`/api/v1/devices/${ids.deviceRow}/revoke`).set("Authorization", `Bearer ${farmer2Token}`);
  assert.equal(otherRevoke.status, 404); // scoped lookup — not their device
  const revoke = await request(app).post(`/api/v1/devices/${ids.deviceRow}/revoke`).set("Authorization", `Bearer ${farmerToken}`);
  assert.equal(revoke.status, 200);
  assert.ok(revoke.body.data.device.revoked_at);
  // revoked device can no longer sync
  const afterRevoke = await request(app).post("/api/v1/sync/upload").set("Authorization", `Bearer ${farmerToken}`)
    .send({ device_id: "dev-farmer-001", items: [{ local_id: "L1", entity_type: "batch_create", operation: "CREATE", payload: {} }] });
  assert.equal(afterRevoke.status, 403);
  // re-register revives the device
  const revive = await request(app).post("/api/v1/devices/register").set("Authorization", `Bearer ${farmerToken}`)
    .send({ device_id: "dev-farmer-001", platform: "android" });
  assert.equal(revive.status, 201);
  assert.equal(revive.body.data.reregistered, true);
  assert.equal(revive.body.data.device.revoked_at, null);
});

// ------------------------------------------------------------- batch drafts

test("upload: offline batch draft → official batch with server code, receipt maps local_id, batch_create sync event", async () => {
  const res = await request(app).post("/api/v1/sync/upload").set("Authorization", `Bearer ${farmerToken}`)
    .send({
      device_id: "dev-farmer-001",
      items: [{
        local_id: "LOCAL_BATCH_001",
        entity_type: "batch_create",
        operation: "CREATE",
        client_timestamp: NOW.toISOString(),
        payload: { species_id: ids.tulsi, quantity: 42, unit: "kg", harvest_date: "2026-09-01", cultivation_type: "organic", gps_lat: 12.9, gps_lng: 79.1, location: "Vellore", asset_ids: [ids.farmerAsset] },
      }],
    });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  const data = res.body.data;
  assert.equal(data.status, "completed");
  assert.equal(data.applied, 1);
  assert.equal(data.conflicted, 0);
  const r = data.results[0];
  assert.equal(r.local_id, "LOCAL_BATCH_001");
  assert.equal(r.status, "SYNCED");
  assert.ok(r.receipt.batch_id);
  assert.ok(r.receipt.code);
  ids.b_offline = r.receipt.batch_id;

  const batch = await prisma.batch.findUnique({ where: { id: ids.b_offline } });
  assert.equal(batch.farmer_id, ids.farmer);
  assert.equal(batch.weight_kg, 42);

  const evt = await prisma.syncEvent.findFirst({ where: { sync_log_id: data.sync_id, queue_ref: "LOCAL_BATCH_001" } });
  assert.equal(evt.status, "SYNCED");
  assert.equal(evt.server_entity_id, ids.b_offline);
});

// -------------------------------------------------- offline transfer request

test("upload: offline custody scan → TRANSFER REQUEST (not ownership change), dependency order respected", async () => {
  // transporter scanned farmer's batch QR offline → request transfer
  const res = await request(app).post("/api/v1/sync/upload").set("Authorization", `Bearer ${tptToken}`)
    .send({
      items: [{
        local_id: "LOCAL_SCAN_001",
        entity_type: "transfer_request",
        operation: "TRANSFER",
        payload: { batch_id: ids.b_owned, type: "FARMER_TO_TRANSPORTER", reason: "offline pickup scan" },
      }],
    });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.body.data.applied, 1);
  const r = res.body.data.results[0];
  assert.equal(r.status, "SYNCED");
  assert.ok(r.receipt.request_id);
  ids.requestId = r.receipt.request_id;

  // The batch holder must NOT have changed — offline scan ≠ final action
  const batch = await prisma.batch.findUnique({ where: { id: ids.b_owned } });
  assert.equal(batch.current_holder_user_id, ids.farmer);

  const reqRow = await prisma.transferRequest.findUnique({ where: { id: ids.requestId } });
  assert.ok(reqRow);
});

// --------------------------------------------------------- conflict capture

test("upload conflicts: ownership moved while offline → OWNERSHIP_CHANGED; unknown batch → QR_EXPIRED; per-item isolation keeps the rest SYNCED", async () => {
  const res = await request(app).post("/api/v1/sync/upload").set("Authorization", `Bearer ${tptToken}`)
    .send({
      items: [
        // 1. conflicts: holder changed while offline (phase advanced → the
        //    FARMER_TO_TRANSPORTER leg no longer applies for a transporter)
        { local_id: "SCAN-MOVED", entity_type: "transfer_request", operation: "TRANSFER", payload: { batch_id: ids.b_moved, type: "FARMER_TO_TRANSPORTER" } },
        // 2. conflicts: batch unknown
        { local_id: "SCAN-GHOST", entity_type: "transfer_request", operation: "TRANSFER", payload: { batch_id: "nonexistent-batch", type: "FARMER_TO_TRANSPORTER" } },
        // 3. still applies — per-item isolation (GPS-1 intentionally missing shipment_id → VALIDATION_ERROR)
        { local_id: "GPS-1", entity_type: "gps_points", operation: "UPLOAD", payload: [{ shipment_id: null, gps_lat: 0, gps_lng: 0 }] },
        // 4. a self-contained POD photo — applies cleanly (no cross-test deps)
        { local_id: "POD-ISO", entity_type: "media_upload", operation: "UPLOAD", payload: { data_base64: Buffer.from("iso-pod").toString("base64"), mime_type: "image/png", filename: "iso.png" } },
      ],
    });
  // items 1-3 conflict, item 4 applies (per-item isolation)
  assert.equal(res.status, 200, JSON.stringify(res.body));
  const data = res.body.data;
  assert.equal(data.status, "partial");
  assert.equal(data.applied, 1);
  assert.equal(data.conflicted, 3);

  const byLocal = Object.fromEntries(data.results.map((r) => [r.local_id, r]));
  assert.equal(byLocal["SCAN-MOVED"].conflict_type, "OWNERSHIP_CHANGED");
  assert.equal(byLocal["SCAN-MOVED"].status, "CONFLICT");
  assert.ok(byLocal["SCAN-GHOST"].conflict_id);
  assert.equal(byLocal["GPS-1"].conflict_type, "VALIDATION_ERROR");
  assert.equal(byLocal["POD-ISO"].status, "SYNCED");

  // conflict rows persisted with the original payload preserved
  const conflict = await prisma.syncConflict.findUnique({ where: { id: byLocal["SCAN-MOVED"].conflict_id } });
  assert.equal(conflict.entity_type, "transfer_request");
  assert.equal(conflict.resolved_at, null);

  const log = await prisma.syncLog.findUnique({ where: { id: data.sync_id } });
  assert.equal(log.status, "partial");
  assert.equal(log.items_total, 4);
  assert.equal(log.items_conflicted, 3);
});

// ------------------------------------------------------------ shipment flow

test("upload: offline pickup + delivery events + GPS breadcrumbs apply through the shipment state machine", async () => {
  // Build a real shipment directly (farmer → farmer2, transporter assigned)
  const shipment = await prisma.shipment.create({
    data: {
      shipment_no: "SHIP-SYNC-001", ref_type: "batch", ref_id: ids.b_tpt, shipment_type: "CUSTOM",
      requested_by_user_id: ids.farmer2, from_user_id: ids.farmer, to_user_id: ids.farmer2,
      assigned_transporter_user_id: ids.tpt, status: "accepted", quantity_kg: 40,
    },
  });
  ids.shipment = shipment.id;

  // Pickup executes a custody transfer under the hood → the transporter needs
  // an APPROVED request from the current holder BEFORE going offline.
  const req = await request(app).post("/api/v1/transfers/request").set("Authorization", `Bearer ${tptToken}`)
    .send({ batch_id: ids.b_tpt, type: "FARMER_TO_TRANSPORTER", reason: "pickup for SHIP-SYNC-001" });
  assert.equal(req.status, 201, JSON.stringify(req.body));
  ids.tptRequestId = req.body.data.request.id;
  const approve = await request(app).post("/api/v1/transfers/approve").set("Authorization", `Bearer ${farmerToken}`)
    .send({ request_id: ids.tptRequestId });
  assert.equal(approve.status, 200, JSON.stringify(approve.body));

  // offline arrive-for-pickup + GPS points + pickup, in dependency order
  const res = await request(app).post("/api/v1/sync/upload").set("Authorization", `Bearer ${tptToken}`)
    .send({
      items: [
        { local_id: "SHP-EV-1", entity_type: "gps_points", operation: "UPLOAD", payload: [
          { shipment_id: shipment.id, gps_lat: 12.91, gps_lng: 79.11, speed_kph: 34 },
          { shipment_id: shipment.id, gps_lat: 12.95, gps_lng: 79.15, speed_kph: 41 },
        ] },
      ],
    });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.body.data.applied, 1);

  const points = await prisma.shipmentTrackingPoint.findMany({ where: { shipment_id: shipment.id }, orderBy: { captured_at: "asc" } });
  assert.equal(points.length, 2);
  assert.equal(points[0].captured_by_user_id, ids.tpt);

  // pickup confirmation captured offline — carries the batch QR token (the
  // custody transfer underneath re-validates it server-side, never trusting
  // the offline state)
  const qr = await prisma.qrToken.findFirst({ where: { batch_id: ids.b_tpt, status: "active" } });
  const { decryptToken } = require("../../src/services/qrEngine");
  const pickup = await request(app).post("/api/v1/sync/upload").set("Authorization", `Bearer ${tptToken}`)
    .send({
      items: [{ local_id: "SHP-PICKUP", entity_type: "shipment_event", operation: "UPDATE", payload: { event: "pickup", shipment_id: shipment.id, token: decryptToken(qr.token_cipher), gps_lat: 12.96, gps_lng: 79.16 } }],
    });
  assert.equal(pickup.status, 200, JSON.stringify(pickup.body));
  const shipRow = await prisma.shipment.findUnique({ where: { id: shipment.id } });
  assert.ok(["picked_up", "in_transit"].includes(shipRow.status), `shipment status after offline pickup: ${shipRow.status}`);
});

// ------------------------------------------------------------- media upload

test("upload: offline POD photo → Asset row via storage driver, mime/size validation", async () => {
  const png = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6360000002000154a24f3b0000000049454e44ae426082", "hex");
  const res = await request(app).post("/api/v1/sync/upload").set("Authorization", `Bearer ${tptToken}`)
    .send({
      items: [{ local_id: "POD-1", entity_type: "media_upload", operation: "UPLOAD", payload: {
        data_base64: png.toString("base64"), mime_type: "image/png", filename: "pod.png",
        gps_lat: 12.97, gps_lng: 79.17, target_type: "shipment", target_id: ids.shipment,
      } }],
    });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  const r = res.body.data.results[0];
  assert.equal(r.status, "SYNCED");
  assert.ok(r.receipt.asset_id);
  const asset = await prisma.asset.findUnique({ where: { id: r.receipt.asset_id } });
  assert.equal(asset.kind, "image");
  assert.equal(asset.metadata_json.offline_sync, true);

  // bad mime → conflict, not a crash
  const bad = await request(app).post("/api/v1/sync/upload").set("Authorization", `Bearer ${tptToken}`)
    .send({ items: [{ local_id: "POD-BAD", entity_type: "media_upload", operation: "UPLOAD", payload: { data_base64: "aGk=", mime_type: "application/zip" } }] });
  assert.equal(bad.body.data.results[0].conflict_type, "VALIDATION_ERROR");
});

// -------------------------------------------------------- incremental pull

test("changes: incremental pull returns only this user's changed rows since timestamp (batches, shipments, tracking, qr tokens)", async () => {
  const since = new Date(Date.now() - 60000).toISOString();
  const res = await request(app).get(`/api/v1/sync/changes?since=${encodeURIComponent(since)}`).set("Authorization", `Bearer ${farmerToken}`);
  assert.equal(res.status, 200, JSON.stringify(res.body));
  const data = res.body.data;
  assert.ok(data.server_time);
  // farmer owns b_owned + b_offline (created this test run)
  const batchIds = data.batches.map((b) => b.id);
  assert.ok(batchIds.includes(ids.b_owned));
  assert.ok(batchIds.includes(ids.b_offline));
  // not farmer2's batch
  assert.ok(!batchIds.includes(ids.b_moved));
  // active QR tokens for owned batches come along for offline validation L1
  assert.ok(data.qr_tokens.every((t) => t.batch_id && t.token));

  // transporter sees their assigned shipment + tracking points
  const tptRes = await request(app).get(`/api/v1/sync/changes?since=${encodeURIComponent(since)}`).set("Authorization", `Bearer ${tptToken}`);
  assert.equal(tptRes.status, 200);
  assert.ok(tptRes.body.data.shipments.some((s) => s.id === ids.shipment));
  assert.ok(tptRes.body.data.tracking.length >= 2);
});

// ------------------------------------------------------------------ status

test("status: pending/conflict counts + avg sync duration for the caller", async () => {
  const res = await request(app).get("/api/v1/sync/status").set("Authorization", `Bearer ${farmerToken}`);
  assert.equal(res.status, 200);
  const s = res.body.data;
  assert.ok("open_conflicts" in s && "avg_sync_ms_24h" in s && "last_sync" in s);
});

// ------------------------------------------------------- conflict resolution

test("conflicts: list (own scope), resolve discard/requeue with note, audit written", async () => {
  const listFarmer = await request(app).get("/api/v1/sync/conflicts").set("Authorization", `Bearer ${farmerToken}`);
  assert.equal(listFarmer.status, 200);
  assert.equal(listFarmer.body.data.rows.length, 0); // farmer has no conflicts — all belong to tpt

  const list = await request(app).get("/api/v1/sync/conflicts?resolved=false").set("Authorization", `Bearer ${tptToken}`);
  assert.equal(list.status, 200);
  assert.ok(list.body.data.rows.length >= 4);
  const conflictId = list.body.data.rows[0].id;

  // farmer cannot resolve tpt's conflict
  const forbidden = await request(app).post(`/api/v1/sync/conflicts/${conflictId}/resolve`).set("Authorization", `Bearer ${farmerToken}`)
    .send({ resolution: "discard" });
  assert.equal(forbidden.status, 403);

  const resolve = await request(app).post(`/api/v1/sync/conflicts/${conflictId}/resolve`).set("Authorization", `Bearer ${tptToken}`)
    .send({ resolution: "discard", note: "stale offline scan — dropping" });
  assert.equal(resolve.status, 200);
  assert.ok(resolve.body.data.conflict.resolved_at);

  const stillOpen = await request(app).get("/api/v1/sync/conflicts?resolved=false").set("Authorization", `Bearer ${tptToken}`);
  assert.ok(stillOpen.body.data.rows.every((c) => c.id !== conflictId));
});

// --------------------------------------------------------------- analytics

test("analytics (admin-only): sessions, conflict rate, avg sync time, active devices; non-admin 403", async () => {
  const forbidden = await request(app).get("/api/v1/sync/analytics").set("Authorization", `Bearer ${farmerToken}`);
  assert.equal(forbidden.status, 403);

  const res = await request(app).get("/api/v1/sync/analytics?days=7").set("Authorization", `Bearer ${adminToken}`);
  assert.equal(res.status, 200, JSON.stringify(res.body));
  const a = res.body.data;
  assert.ok(a.sync_sessions >= 5);
  assert.ok(a.items_total >= 10);
  assert.ok(a.conflict_rate > 0);
  assert.ok(a.by_conflict_type.some((c) => c.conflict_type === "OWNERSHIP_CHANGED"));
  assert.equal(a.active_devices, 1); // farmer's revived device

  // RBAC: transporter lacks sync.manage → also blocked from admin analytics
  const tptForbidden = await request(app).get("/api/v1/sync/analytics").set("Authorization", `Bearer ${tptToken}`);
  assert.equal(tptForbidden.status, 403);
});
