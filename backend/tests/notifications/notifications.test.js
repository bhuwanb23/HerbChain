/**
 * Phase 14 notifications tests (docs/phase_14.md).
 *
 * Verifies on an isolated DB: the publish->queue->worker->delivery pipeline
 * (in-app inbox + sms/push/email capture + delivery receipts), template
 * rendering with placeholders, preference-gated channels, retry/backoff +
 * requeue via the provider-failure seam, the inbox (list/read/mark-all/
 * filter), device tokens, scheduled + reminder engine (pickup 24h, cert
 * expiry 30d), the delayed-shipment escalation ladder (transporter -> lab/
 * manufacturer -> AYUSH), admin broadcast + analytics/metrics + admin
 * center, RBAC gates, and end-to-end domain wiring (batch created, batch
 * certified, transfer approved, recall issued).
 */
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { setupDb } = require("./_db");

const db = setupDb();
const { prisma } = require("../../src/db/client");
const { seedRbac } = require("../../src/db/rbac");
const { hashPassword } = require("../../src/services/passwords");
const { createApp } = require("../../src/app");
const notif = require("../../src/services/notifications");

const FARM_LAT = 10.1234;
const FARM_LNG = 78.1234;
const LAB_LAT = 13.0827;
const LAB_LNG = 80.2707;
const PUNE_LAT = 18.5204;
const PUNE_LNG = 73.8567;

let app;

async function makeUser(email, role, { verified = false, labRole = null, adminRole = null, phone = null } = {}) {
  const user = await prisma.user.create({
    data: {
      name: role,
      email,
      phone,
      password_hash: hashPassword("password1"),
      role,
      lab_role: labRole,
      admin_role: adminRole,
      kyc_status: verified ? "verified" : "pending",
      is_active: true,
    },
  });
  const login = await request(app).post("/api/v1/auth/login").send({ identifier: email, password: "password1" });
  assert.equal(login.status, 200, JSON.stringify(login.body));
  return { user, token: login.body.data.access_token };
}

async function uploadAsset(token) {
  const up = await request(app)
    .post("/api/v1/uploads")
    .set("Authorization", `Bearer ${token}`)
    .attach("file", Buffer.from("fake-image-bytes"), { filename: "h.jpg", contentType: "image/jpeg" });
  assert.equal(up.status, 201, JSON.stringify(up.body));
  return up.body.data.asset;
}

async function createBatch(farmerToken, qty = 20) {
  const asset = await uploadAsset(farmerToken);
  const res = await request(app)
    .post("/api/v1/batches")
    .set("Authorization", `Bearer ${farmerToken}`)
    .send({
      species_code: "ashwagandha",
      quantity: qty,
      unit: "kg",
      harvest_date: "2026-09-04",
      cultivation_type: "organic",
      gps_lat: FARM_LAT,
      gps_lng: FARM_LNG,
      asset_ids: [asset.id],
    });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body.data.batch;
}

async function tokenOf(batchId, holderToken) {
  const res = await request(app).get(`/api/v1/batches/${batchId}/qr`).set("Authorization", `Bearer ${holderToken}`);
  assert.equal(res.status, 200, JSON.stringify(res.body));
  return res.body.data.qr.url.split("/qr/")[1];
}

const tr = (token, body) => request(app).post("/api/v1/transfers/request").set("Authorization", `Bearer ${token}`).send(body);
const ta = (token, body) => request(app).post("/api/v1/transfers/approve").set("Authorization", `Bearer ${token}`).send(body);

async function governedHop(requester, approver, executor, batchId) {
  const r = await tr(requester.token, { batch_id: batchId });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const a = await ta(approver.token, { request_id: r.body.data.request.id });
  assert.equal(a.status, 200, JSON.stringify(a.body));
  const e = await request(app)
    .post("/api/v1/transfers/execute")
    .set("Authorization", `Bearer ${executor.token}`)
    .send({ token: await tokenOf(batchId, approver.token) });
  assert.equal(e.status, 200, JSON.stringify(e.body));
  return r.body.data.request;
}

/** Full lab run: create -> governed to lab -> certify. */
async function certifyBatch(qty = 20) {
  const batch = await createBatch(farmer.token, qty);
  await governedHop(transporter, farmer, transporter, batch.id);
  await governedHop(lab, transporter, lab, batch.id);
  const r = await request(app).post("/api/v1/labs/batches/receive").set("Authorization", `Bearer ${lab.token}`).send({ batch_id: batch.id, receiver_name: "Lab In-charge", condition_status: "good" });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const s = await request(app).post("/api/v1/labs/samples").set("Authorization", `Bearer ${lab.token}`).send({ batch_id: batch.id, sample_weight_kg: 0.5, remarks: "sample A" });
  assert.equal(s.status, 201, JSON.stringify(s.body));
  const sampleId = s.body.data.sample.id;
  for (const [category, name, code, observed, unit] of [
    ["physical", "Moisture content", "moisture", 7.2, "%"],
    ["safety", "Heavy metals screen", "lead", 0.4, "ppm"],
  ]) {
    const t = await request(app).post("/api/v1/labs/tests").set("Authorization", `Bearer ${lab.token}`).send({ sample_id: sampleId, test_category: category, test_name: name });
    assert.equal(t.status, 201, JSON.stringify(t.body));
    const id = t.body.data.test.id;
    const p = await request(app).post(`/api/v1/labs/tests/${id}/results`).set("Authorization", `Bearer ${lab.token}`).send({ parameter_code: code, observed_value: observed, unit, result: "pass" });
    assert.equal(p.status, 201, JSON.stringify(p.body));
    const sub = await request(app).post(`/api/v1/labs/tests/${id}/submit`).set("Authorization", `Bearer ${lab.token}`).send({});
    assert.equal(sub.status, 200, JSON.stringify(sub.body));
    const rv = await request(app).post("/api/v1/labs/reviews").set("Authorization", `Bearer ${supervisor.token}`).send({ test_id: id, review_status: "approved", notes: "ok" });
    assert.equal(rv.status, 200, JSON.stringify(rv.body));
  }
  const c = await request(app).post("/api/v1/labs/certificates").set("Authorization", `Bearer ${supervisor.token}`).send({ batch_id: batch.id });
  assert.equal(c.status, 201, JSON.stringify(c.body));
  return { batch, certification: c.body.data.certification };
}

const nget = (token, p = "") => request(app).get(`/api/v1/notifications${p}`).set("Authorization", `Bearer ${token}`);
const nput = (token, p = "") => request(app).put(`/api/v1/notifications${p}`).set("Authorization", `Bearer ${token}`);
const npost = (token, p = "") => request(app).post(`/api/v1/notifications${p}`).set("Authorization", `Bearer ${token}`);

let farmer, transporter, lab, supervisor, manufacturer, admin;

before(async () => {
  await seedRbac();
  await notif.seedTemplates();
  await prisma.species.createMany({
    data: [
      { code: "ashwagandha", common_name: "Ashwagandha", scientific_name: "Withania somnifera", is_active: true },
      { code: "tulsi", common_name: "Tulsi", scientific_name: "Ocimum sanctum", is_active: true },
    ],
  });
  await prisma.testParameter.createMany({
    data: [
      { code: "moisture", name: "Moisture content", category: "physical", unit: "%", is_active: true },
      { code: "lead", name: "Lead (Pb)", category: "safety", unit: "ppm", is_active: true },
    ],
  });
  app = createApp();

  farmer = await makeUser("nf@x.dev", "farmer", { phone: "+919800000001" });
  transporter = await makeUser("nt@x.dev", "transporter", { verified: true, phone: "+919800000002" });
  lab = await makeUser("nl@x.dev", "lab", { verified: true, phone: "+919800000003" });
  supervisor = await makeUser("ns@x.dev", "lab", { verified: true, labRole: "supervisor", phone: "+919800000004" });
  manufacturer = await makeUser("nm@x.dev", "manufacturer", { verified: true, phone: "+919800000005" });
  admin = await makeUser("na@x.dev", "admin", { verified: true });
});

after(async () => {
  await prisma.$disconnect();
  db.cleanup();
});

// ------------------------------------------------------ queue pipeline

test("publish -> queue -> worker -> inbox row + deliveries + captured sms", async () => {
  await prisma.notificationQueue.deleteMany();
  await prisma.notification.deleteMany();
  notif.providers.clearSent();

  const rows = await notif.publishDirect({
    code: "batch_created",
    recipientUserId: farmer.user.id,
    data: { code: "HERB-2026-000001", species: "Ashwagandha", entity: { type: "batch", id: "b1" } },
  });
  assert.ok(rows.length >= 2, "batch_created has in_app + sms channels");
  const channels = rows.map((r) => r.channel).sort();
  assert.deepEqual(channels, ["in_app", "sms"]);

  const out = await notif.processQueue();
  assert.equal(out.processed, rows.length, JSON.stringify(out));

  // Inbox row exists (in_app delivered immediately).
  const inbox = await notif.listInbox(farmer.user, {});
  assert.equal(inbox.notifications.length, 1);
  assert.equal(inbox.notifications[0].type, "batch_created");
  assert.match(inbox.notifications[0].body, /HERB-2026-000001/);
  assert.equal(inbox.notifications[0].entity.id, "b1");
  assert.equal(inbox.unread, 1);

  // SMS captured by the stub provider.
  const sms = notif.providers.getSent("sms");
  assert.equal(sms.length, 1);
  assert.equal(sms[0].to, farmer.user.phone);
  assert.match(sms[0].body, /HERB-2026-000001/);

  // Delivery receipts for both channels.
  const deliveries = await prisma.notificationDelivery.findMany();
  assert.equal(deliveries.length, 2);
  assert.ok(deliveries.some((d) => d.channel === "sms" && d.status === "sent"));
  assert.ok(deliveries.some((d) => d.channel === "in_app" && d.status === "delivered"));

  // Queue rows now sent.
  const pending = await prisma.notificationQueue.count({ where: { status: "sent" } });
  assert.equal(pending, rows.length);
});

test("template rendering replaces {placeholders}; unknown keys stay literal", () => {
  const out = notif.render("Batch {code} for {species}", { code: "HERB-1", species: "Tulsi" });
  assert.equal(out, "Batch HERB-1 for Tulsi");
  assert.equal(notif.render("Keep {missing}", {}), "Keep {missing}");
});

test("preferences gate channels: sms off -> no sms queue row", async () => {
  await prisma.notificationQueue.deleteMany();
  await prisma.notification.deleteMany();
  notif.providers.clearSent();
  await notif.setPreferences(farmer.user, { sms_enabled: false });

  const rows = await notif.publishDirect({
    code: "batch_created",
    recipientUserId: farmer.user.id,
    data: { code: "HERB-2026-000002", species: "Tulsi", entity: { type: "batch", id: "b2" } },
  });
  assert.deepEqual(rows.map((r) => r.channel), ["in_app"]); // sms gated off
  const out = await notif.processQueue();
  assert.equal(out.processed, 1);
  assert.equal(notif.providers.getSent("sms").length, 0);

  // Turn sms back on for later tests.
  await notif.setPreferences(farmer.user, { sms_enabled: true });
});

test("provider outage -> retry/backoff -> FAILED -> requeue -> sent", async () => {
  await prisma.notificationQueue.deleteMany();
  await prisma.notification.deleteMany();
  notif.providers.clearSent();
  notif.providers.failNext("sms", 10); // every sms send throws

  const rows = await notif.publishDirect({
    code: "batch_created",
    recipientUserId: transporter.user.id,
    data: { code: "HERB-2026-000003", species: "Ashwagandha", entity: { type: "batch", id: "b3" } },
  });
  assert.ok(rows.some((r) => r.channel === "sms"));

  const out = await notif.processQueue();
  // sms row backoffs (attempt 1 < max). Force it to max attempts AND make it
  // due now so the next drain marks it FAILED.
  await prisma.notificationQueue.updateMany({
    where: { channel: "sms" },
    data: { attempts: 5, next_attempt_at: new Date(Date.now() - 1000) },
  });
  const out2 = await notif.processQueue();
  const failed = await prisma.notificationQueue.findFirst({ where: { channel: "sms", status: "failed" } });
  assert.ok(failed, "sms row should be FAILED");
  assert.match(failed.last_error, /outage/);

  // Requeue clears failure and delivers.
  notif.providers.clearSent();
  const req = await notif.requeueFailed();
  assert.ok(req.requeued >= 1);
  const out3 = await notif.processQueue();
  assert.ok(out3.processed >= 1);
  assert.equal(notif.providers.getSent("sms").length, 1);
  const inbox = await notif.listInbox(transporter.user, {});
  assert.ok(inbox.notifications.length >= 1);
});

test("inbox: unread count, mark one read, mark all read, filter by category", async () => {
  await prisma.notificationQueue.deleteMany();
  await prisma.notification.deleteMany();
  notif.providers.clearSent();

  await notif.publishDirect({ code: "batch_created", recipientUserId: farmer.user.id, data: { code: "C1", species: "x", entity: { type: "batch", id: "c1" } } });
  await notif.publishDirect({ code: "shipment_assigned", recipientUserId: farmer.user.id, data: { code: "SHIP-1", pickupDate: "2026-09-05", entity: { type: "shipment", id: "s1" } } });
  await notif.processQueue();

  const unread = await nget(farmer.token, "/unread");
  assert.equal(unread.status, 200);
  assert.ok(unread.body.data.unread >= 2);

  const inbox = await nget(farmer.token, "?category=shipment");
  assert.equal(inbox.status, 200);
  assert.ok(inbox.body.data.notifications.length >= 1);
  assert.ok(inbox.body.data.notifications.every((n) => n.category === "shipment"));

  // Mark one read.
  const first = inbox.body.data.notifications[0];
  const r = await nput(farmer.token, "/read").send({ ids: [first.id] });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.marked, 1);
  const after = await prisma.notification.findUnique({ where: { id: first.id } });
  assert.equal(after.is_read, true);

  // Mark all read.
  const all = await nput(farmer.token, "/read").send({ all: true });
  assert.equal(all.status, 200);
  const unread2 = await nget(farmer.token, "/unread");
  assert.equal(unread2.body.data.unread, 0);
});

// --------------------------------------------------------------- devices

test("devices: register, list, revoke", async () => {
  const d = await npost(farmer.token, "/device").send({ device_id: "dev-1", platform: "android", token: "fcm-token-1" });
  assert.equal(d.status, 201, JSON.stringify(d.body));
  const d2 = await npost(farmer.token, "/device").send({ device_id: "dev-2", platform: "ios", token: "apns-token-2" });
  assert.equal(d2.status, 201);

  const list = await nget(farmer.token, "/devices");
  assert.equal(list.status, 200);
  assert.equal(list.body.data.devices.length, 2);

  const rev = await request(app).delete(`/api/v1/notifications/device/${d.body.data.id}`).set("Authorization", `Bearer ${farmer.token}`);
  assert.equal(rev.status, 200, JSON.stringify(rev.body));
  const list2 = await nget(farmer.token, "/devices");
  assert.equal(list2.body.data.devices.length, 1);
});

// ------------------------------------------------- scheduled + reminders

test("scheduled notifications: schedule -> processScheduled -> published + fired", async () => {
  await prisma.notificationQueue.deleteMany();
  await prisma.notification.deleteMany();
  notif.providers.clearSent();

  await notif.schedule({
    notification_type: "pickup_reminder",
    scheduled_time: new Date(Date.now() - 1000),
    recipientUserId: transporter.user.id,
    payload: { code: "SHIP-99", pickupDate: "2026-09-05", entity: { type: "shipment", id: "s99" } },
  });
  const out = await notif.processScheduled();
  assert.equal(out.fired, 1);

  // The scheduled publish enqueued + the worker delivered it.
  const queueRows = await prisma.notificationQueue.count({ where: { template_code: "pickup_reminder" } });
  assert.ok(queueRows >= 1);
  const p2 = await notif.processQueue();
  assert.ok(p2.processed >= 1);
  const inbox = await notif.listInbox(transporter.user, { category: "shipment" });
  assert.ok(inbox.notifications.some((n) => n.type === "pickup_reminder"));
  const scheduled = await notif.listScheduled({});
  assert.equal(scheduled.rows.find((r) => r.notification_type === "pickup_reminder").status, "processed");
});

test("reminder engine: pickup reminder scheduled ~24h before pickup", async () => {
  // A shipment scheduled for pickup in ~23h -> window hit by scanPickupReminders.
  const pickupAt = new Date(Date.now() + 23 * 3600 * 1000);
  const ship = await prisma.shipment.create({
    data: {
      shipment_no: "SHIP-2026-000042",
      ref_type: "batch",
      ref_id: "batch-none",
      requested_by_user_id: lab.user.id,
      from_user_id: farmer.user.id,
      to_user_id: lab.user.id,
      assigned_transporter_user_id: transporter.user.id,
      status: "assigned",
      scheduled_pickup_at: pickupAt,
    },
  });
  const scan = await notif.scanPickupReminders();
  assert.equal(scan.created, 1);

  // Idempotent — second scan schedules nothing new.
  const scan2 = await notif.scanPickupReminders();
  assert.equal(scan2.created, 0);

  // The reminder row targets the transporter.
  const reminder = await prisma.scheduledNotification.findFirst({ where: { notification_type: "pickup_reminder" } });
  assert.equal(reminder.recipient_user_id, transporter.user.id);
  await prisma.shipment.delete({ where: { id: ship.id } });
  await prisma.scheduledNotification.deleteMany({ where: { notification_type: "pickup_reminder" } });
});

test("cert expiry reminder: scheduled 30d before expiry for the batch holder", async () => {
  const batch = await createBatch(farmer.token);
  const cert = await prisma.certification.create({
    data: {
      certificate_number: "CERT-2026-000777",
      batch_id: batch.id,
      lab_user_id: lab.user.id,
      lab_code: "LAB-1",
      lab_name: "Test Lab",
      species_id: (await prisma.species.findFirst()).id,
      species_code: "ashwagandha",
      certificate_hash: "h",
      issued_by_user_id: supervisor.user.id,
      expiry_date: new Date(Date.now() + 30 * 24 * 3600 * 1000 + 12 * 3600 * 1000), // ~30.5d out — inside the 30d+24h scan window
    },
  });
  const scan = await notif.scanCertExpiryReminders();
  assert.ok(scan.created >= 1, JSON.stringify(scan));
  const rows = await prisma.scheduledNotification.findMany({ where: { notification_type: "certificate_expiry" } });
  const reminder = rows.find((r) => r.payload_json && r.payload_json.entity && r.payload_json.entity.id === cert.id);
  assert.ok(reminder, "certificate_expiry reminder scheduled");
  assert.equal(reminder.recipient_user_id, farmer.user.id);
  await prisma.certification.delete({ where: { id: cert.id } });
  await prisma.batch.deleteMany({ where: { id: batch.id } });
  await prisma.scheduledNotification.deleteMany({ where: { notification_type: "certificate_expiry" } });
  await prisma.notificationQueue.deleteMany();
  await prisma.notification.deleteMany();
});

// ------------------------------------------------------------ escalation

test("escalation ladder: delayed shipment -> transporter -> lab/mfr -> AYUSH", async () => {
  const ship = await prisma.shipment.create({
    data: {
      shipment_no: "SHIP-2026-000043",
      ref_type: "batch",
      ref_id: "batch-none",
      requested_by_user_id: lab.user.id,
      from_user_id: farmer.user.id,
      to_user_id: manufacturer.user.id,
      assigned_transporter_user_id: transporter.user.id,
      status: "in_transit",
      expected_delivery_at: new Date(Date.now() - 13 * 3600 * 1000), // 13h overdue
    },
  });
  const scan = await notif.scanEscalations();
  // 3 hops: transporter (hop0), manufacturer (hop1, to_user), admin (hop2).
  assert.ok(scan.created >= 3, JSON.stringify(scan));
  const scheduled = await prisma.scheduledNotification.findMany({ where: { notification_type: { in: ["shipment_delayed", "security_alert"] } } });
  assert.ok(scheduled.length >= 3);
  const uids = new Set(scheduled.map((s) => s.recipient_user_id));
  assert.ok(uids.has(transporter.user.id));
  assert.ok(uids.has(manufacturer.user.id));
  assert.ok(uids.has(admin.user.id)); // AYUSH hop is CRITICAL security_alert

  // Fire them all now (they're in the past) and verify delivery.
  notif.providers.clearSent();
  const fired = await notif.processScheduled();
  assert.ok(fired.fired >= 3);
  await notif.processQueue();
  const inboxT = await notif.listInbox(transporter.user, {});
  assert.ok(inboxT.notifications.some((n) => n.type === "shipment_delayed"));

  await prisma.shipment.delete({ where: { id: ship.id } });
  await prisma.scheduledNotification.deleteMany({ where: { notification_type: { in: ["shipment_delayed", "security_alert"] } } });
  await prisma.notificationQueue.deleteMany();
  await prisma.notification.deleteMany();
  notif.providers.clearSent();
});

// ------------------------------------------------------- admin endpoints

test("admin: broadcast to role, analytics/metrics, admin center, RBAC gate", async () => {
  notif.providers.clearSent();
  await prisma.notificationQueue.deleteMany();
  await prisma.notification.deleteMany();

  // Broadcast to farmers only.
  const b = await npost(admin.token, "/send").send({ code: "account_approved", role: "farmer", data: { role: "farmer" } });
  assert.equal(b.status, 200, JSON.stringify(b.body));
  assert.equal(b.body.data.recipients, 1);
  await notif.processQueue();
  const inboxF = await notif.listInbox(farmer.user, {});
  assert.ok(inboxF.notifications.some((n) => n.type === "account_approved"));

  // Analytics (metrics computed for today).
  const a = await nget(admin.token, "/admin/analytics");
  assert.equal(a.status, 200, JSON.stringify(a.body));
  assert.ok(a.body.data.totals.sent >= 1);
  assert.ok(a.body.data.channel_usage.in_app >= 1);

  // Admin center surfaces the metrics + queue.
  const c = await nget(admin.token, "/admin/center");
  assert.equal(c.status, 200, JSON.stringify(c.body));
  assert.ok(Array.isArray(c.body.data.critical));
  assert.ok(Array.isArray(c.body.data.failed_deliveries));

  // Queue listing.
  const q = await nget(admin.token, "/admin/queue");
  assert.equal(q.status, 200);
  assert.ok(Array.isArray(q.body.data.rows));

  // Templates catalog.
  const t = await nget(admin.token, "/admin/templates");
  assert.equal(t.status, 200);
  assert.ok(t.body.data.templates.length >= 20);

  // RBAC: a farmer cannot broadcast or see admin center.
  const forbidden = await npost(farmer.token, "/send").send({ code: "account_approved", role: "all", data: {} });
  assert.equal(forbidden.status, 403, JSON.stringify(forbidden.body));
  const forbiddenCenter = await nget(farmer.token, "/admin/center");
  assert.equal(forbiddenCenter.status, 403);

  // Manual queue drain endpoint works for admin.
  const drain = await npost(admin.token, "/admin/process").send({});
  assert.equal(drain.status, 200, JSON.stringify(drain.body));
});

// ----------------------------------------------------------- domain wiring

test("domain wiring: batch created -> farmer inbox; transfer approved -> both parties", async () => {
  notif.providers.clearSent();
  await prisma.notificationQueue.deleteMany();
  await prisma.notification.deleteMany();

  const batch = await createBatch(farmer.token);
  await notif.processQueue();
  let inboxF = await notif.listInbox(farmer.user, {});
  assert.ok(inboxF.notifications.some((n) => n.type === "batch_created"), JSON.stringify(inboxF.notifications));

  // Governed hop farmer -> transporter -> lab; both parties notified on each.
  const hop = await governedHop(transporter, farmer, transporter, batch.id);
  assert.ok(hop.id);
  await notif.processQueue();
  inboxF = await notif.listInbox(farmer.user, {});
  assert.ok(inboxF.notifications.some((n) => n.type === "ownership_transferred"), JSON.stringify(inboxF.notifications.map((n) => n.type)));
  const inboxT = await notif.listInbox(transporter.user, {});
  assert.ok(inboxT.notifications.some((n) => n.type === "ownership_transferred"));

  await prisma.batch.deleteMany({ where: { id: batch.id } });
  await prisma.notificationQueue.deleteMany();
  await prisma.notification.deleteMany();
});

test("domain wiring: certified -> farmer + AYUSH admins (email to farmer)", async () => {
  notif.providers.clearSent();
  await prisma.notificationQueue.deleteMany();
  await prisma.notification.deleteMany();

  const { batch } = await certifyBatch(15);
  await notif.processQueue();

  // Farmer got the certificate notice (in_app + email channels).
  const inboxF = await notif.listInbox(farmer.user, { category: "lab" });
  assert.ok(inboxF.notifications.some((n) => n.type === "certificate_issued"), JSON.stringify(inboxF.notifications.map((n) => n.type)));
  const emails = notif.providers.getSent("email");
  assert.ok(emails.length >= 1, "certificate email captured");
  assert.match(emails[0].subject, /certified/);

  // AYUSH admin got an in-app certificate notice too.
  const inboxA = await notif.listInbox(admin.user, { category: "lab" });
  assert.ok(inboxA.notifications.some((n) => n.type === "certificate_issued"), JSON.stringify(inboxA.notifications.map((n) => n.type)));

  await prisma.batch.deleteMany({ where: { id: batch.id } });
  await prisma.notificationQueue.deleteMany();
  await prisma.notification.deleteMany();
  notif.providers.clearSent();
});

test("domain wiring: recall issued -> affected manufacturer + AYUSH get CRITICAL recall notice", async () => {
  notif.providers.clearSent();
  await prisma.notificationQueue.deleteMany();
  await prisma.notification.deleteMany();

  // A manufacturer product recall (product exists -> scope + notify directly).
  const product = await prisma.product.create({
    data: {
      code: "PRD-2026-000777",
      name: "Ashwagandha Capsules",
      category: "capsule",
      pack_size: "60",
      manufacturer_user_id: manufacturer.user.id,
      status: "active",
    },
  });

  const r = await request(app)
    .post("/api/v1/admin/portal/recalls")
    .set("Authorization", `Bearer ${admin.token}`)
    .send({ ref_type: "product", ref_id: product.id, reason: "heavy metal contamination", severity: "critical" });
  assert.equal(r.status, 201, JSON.stringify(r.body));

  await notif.processQueue();
  // The product's manufacturer + every AYUSH admin got the CRITICAL recall notice.
  const inboxM = await notif.listInbox(manufacturer.user, { category: "recall" });
  assert.ok(inboxM.notifications.some((n) => n.type === "recall_issued"), JSON.stringify(inboxM.notifications.map((n) => n.type)));
  const inboxA = await notif.listInbox(admin.user, { category: "recall" });
  assert.ok(inboxA.notifications.some((n) => n.type === "recall_issued"));
  const sms = notif.providers.getSent("sms");
  assert.ok(sms.length >= 1, "recall SMS sent");

  await prisma.product.deleteMany({ where: { id: product.id } });
  await prisma.notificationQueue.deleteMany();
  await prisma.notification.deleteMany();
  notif.providers.clearSent();
});