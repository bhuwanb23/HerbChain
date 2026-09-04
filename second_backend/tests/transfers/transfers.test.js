/**
 * Phase 6 governed transfer tests — two-party custody handovers.
 *
 * Verifies on an isolated DB:
 *  - full request lifecycle: pending -> approved -> completed (with reject /
 *    cancel branches), audited at every transition
 *  - two-party guards: only the receiving party requests; only the current
 *    holder approves; an approved request is required before any execute;
 *    stale requests die when the holder changes
 *  - execution routes through the QR engine: atomic ownership + QR rotation,
 *    request marked COMPLETED with the TRANSFER event linked
 *  - admin recovery: batch pulled into AYUSH custody without holder consent,
 *    phase preserved, QR rotated
 *  - proof-of-handover attach after completion (photo + signatures)
 *  - ownership queries: current owner + immutable ownership history
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

let app;

async function makeUser(email, role, { verified = false, active = true } = {}) {
  const user = await prisma.user.create({
    data: {
      name: role,
      email,
      password_hash: hashPassword("password1"),
      role,
      kyc_status: verified ? "verified" : role === "farmer" ? "pending" : "pending",
      is_active: active,
    },
  });
  const login = await request(app).post("/api/v1/auth/login").send({ identifier: email, password: "password1" });
  return { user, token: login.body.data.access_token };
}

async function createBatch(farmerToken, over = {}) {
  const up = await request(app)
    .post("/api/v1/uploads")
    .set("Authorization", `Bearer ${farmerToken}`)
    .attach("file", Buffer.from("fake-image-bytes"), { filename: "h.jpg", contentType: "image/jpeg" });
  const res = await request(app)
    .post("/api/v1/batches")
    .set("Authorization", `Bearer ${farmerToken}`)
    .send({
      species_code: "ashwagandha",
      quantity: 20,
      unit: "kg",
      harvest_date: "2026-09-04",
      cultivation_type: "organic",
      gps_lat: 13.0827,
      gps_lng: 80.2707,
      asset_ids: [up.body.data.asset.id],
      ...over,
    });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body.data.batch;
}

async function tokenOf(batchId, holderToken) {
  const res = await request(app).get(`/api/v1/batches/${batchId}/qr`).set("Authorization", `Bearer ${holderToken}`);
  assert.equal(res.status, 200);
  return res.body.data.qr.url.split("/qr/")[1];
}

const reqCustody = (token, body) => request(app).post("/api/v1/transfers/request").set("Authorization", `Bearer ${token}`).send(body);
const approveReq = (token, body) => request(app).post("/api/v1/transfers/approve").set("Authorization", `Bearer ${token}`).send(body);
const rejectReq = (token, body) => request(app).post("/api/v1/transfers/reject").set("Authorization", `Bearer ${token}`).send(body);
const cancelReq = (token, body) => request(app).post("/api/v1/transfers/cancel").set("Authorization", `Bearer ${token}`).send(body);
const executeReq = (token, body) => request(app).post("/api/v1/transfers/execute").set("Authorization", `Bearer ${token}`).send(body);
const recoverReq = (token, body) => request(app).post("/api/v1/transfers/recover").set("Authorization", `Bearer ${token}`).send(body);
const listReq = (token, qs) => request(app).get(`/api/v1/transfers/requests${qs || ""}`).set("Authorization", `Bearer ${token}`);

let farmer, transporter, lab, manufacturer, admin, strangerTransporter;

before(async () => {
  await seedRbac();
  await prisma.species.createMany({
    data: [{ code: "ashwagandha", common_name: "Ashwagandha", scientific_name: "Withania somnifera", is_active: true }],
  });
  app = createApp();

  farmer = await makeUser("f@x.dev", "farmer");
  transporter = await makeUser("t@x.dev", "transporter", { verified: true });
  lab = await makeUser("l@x.dev", "lab", { verified: true });
  manufacturer = await makeUser("m@x.dev", "manufacturer", { verified: true });
  strangerTransporter = await makeUser("t2@x.dev", "transporter", { verified: true });
  admin = await makeUser("a@x.dev", "admin");
});

after(async () => {
  await prisma.$disconnect();
  db.cleanup();
});

// ------------------------------------------------------------ lifecycle

test("request -> approve -> execute: atomic custody + QR rotation, request completed", async () => {
  const batch = await createBatch(farmer.token);

  // Request by transporter (receiver).
  const r = await reqCustody(transporter.token, { batch_id: batch.id, reason: "pickup at farm gate" });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const requestRow = r.body.data.request;
  assert.equal(requestRow.status, "pending");
  assert.equal(requestRow.type, "FARMER_TO_TRANSPORTER");
  assert.equal(requestRow.from.id, farmer.user.id);
  assert.equal(requestRow.to.id, transporter.user.id);
  assert.equal(requestRow.batch.id, batch.id);

  // Audit row for initiation.
  const initiated = await prisma.auditLog.findFirst({
    where: { action: "TRANSFER_INITIATED", target_id: requestRow.id },
  });
  assert.ok(initiated);

  // Wrong actor (lab) cannot approve.
  const wrongApprove = await approveReq(lab.token, { request_id: requestRow.id });
  assert.equal(wrongApprove.status, 403);

  // Holder approves -> approved.
  const a = await approveReq(farmer.token, { request_id: requestRow.id });
  assert.equal(a.status, 200, JSON.stringify(a.body));
  assert.equal(a.body.data.request.status, "approved");
  assert.equal(a.body.data.request.approved_by.id, farmer.user.id);

  // Execute with the holder's live QR by the receiving party.
  const token = await tokenOf(batch.id, farmer.token);
  const ex = await executeReq(transporter.token, { token });
  assert.equal(ex.status, 200, JSON.stringify(ex.body));
  assert.equal(ex.body.data.transfer.old_version, 1);
  assert.equal(ex.body.data.transfer.new_version, 2);
  assert.equal(ex.body.data.transfer.phase_after, "in_transit_to_lab");
  assert.equal(ex.body.data.transfer.request.status, "completed");
  assert.equal(ex.body.data.transfer.request.id, requestRow.id);

  // DB: batch moved, request completed with event link, audit rows present.
  const holder = await prisma.batch.findUnique({ where: { id: batch.id } });
  assert.equal(holder.current_holder_user_id, transporter.user.id);
  assert.equal(holder.phase, "in_transit_to_lab");
  const done = await prisma.transferRequest.findUnique({ where: { id: requestRow.id } });
  assert.equal(done.status, "completed");
  assert.ok(done.completed_at);
  assert.ok(done.batch_event_id);
  const completedAudit = await prisma.auditLog.findFirst({ where: { action: "TRANSFER_COMPLETED", target_id: requestRow.id } });
  assert.ok(completedAudit);

  // The transporter now HOLDS the batch, so they cannot request it again.
  const dup = await reqCustody(transporter.token, { batch_id: batch.id });
  assert.equal(dup.status, 409);
  assert.equal(dup.body.error.code, "self_transfer");
});

test("reject and cancel branches are audited; only permitted actors act", async () => {
  const batch = await createBatch(farmer.token);

  // --- reject branch
  const r1 = await reqCustody(lab.token, { batch_id: batch.id });
  const id1 = r1.body.data.request.id;
  // A second live request from the same receiver is blocked while one exists.
  const dup = await reqCustody(lab.token, { batch_id: batch.id });
  assert.equal(dup.status, 409);
  assert.equal(dup.body.error.code, "request_exists");
  // The requester cannot reject their own request (only holder/admin).
  const selfReject = await rejectReq(lab.token, { request_id: id1, reason: "changed mind" });
  assert.equal(selfReject.status, 403);
  const rej = await rejectReq(farmer.token, { request_id: id1, reason: "no stock ready" });
  assert.equal(rej.status, 200, JSON.stringify(rej.body));
  assert.equal(rej.body.data.request.status, "rejected");
  assert.equal(rej.body.data.request.rejection_reason, "no stock ready");
  assert.ok(await prisma.auditLog.findFirst({ where: { action: "TRANSFER_REJECTED", target_id: id1 } }));

  // --- cancel branch (requestor while pending)
  const r2 = await reqCustody(transporter.token, { batch_id: batch.id });
  const id2 = r2.body.data.request.id;
  const cancel = await cancelReq(transporter.token, { request_id: id2 });
  assert.equal(cancel.status, 200);
  assert.equal(cancel.body.data.request.status, "cancelled");
  assert.ok(await prisma.auditLog.findFirst({ where: { action: "TRANSFER_CANCELLED", target_id: id2 } }));

  // --- completed requests cannot be re-decided
  const r3 = await reqCustody(transporter.token, { batch_id: batch.id });
  const id3 = r3.body.data.request.id;
  await approveReq(farmer.token, { request_id: id3 });
  const token = await tokenOf(batch.id, farmer.token);
  await executeReq(transporter.token, { token });
  const later = await rejectReq(farmer.token, { request_id: id3 });
  assert.equal(later.status, 409);
  assert.equal(later.body.error.code, "invalid_state");
});

// --------------------------------------------------------- two-party gates

test("no transfer without an approved request; execute demands the receiver", async () => {
  const batch = await createBatch(farmer.token);

  // Receiver tries to execute with no request at all.
  const token = await tokenOf(batch.id, farmer.token);
  const noReq = await executeReq(transporter.token, { token });
  assert.equal(noReq.status, 409);
  assert.equal(noReq.body.error.code, "transfer_not_requested");

  // Request stays pending (holder has not approved) -> execute blocked.
  const r = await reqCustody(transporter.token, { batch_id: batch.id });
  const pendingId = r.body.data.request.id;
  const stillPending = await executeReq(transporter.token, { token: await tokenOf(batch.id, farmer.token) });
  assert.equal(stillPending.status, 409);
  assert.equal(stillPending.body.error.code, "transfer_not_requested"); // only approved requests resolve

  // Approve, then a different receiver still cannot execute.
  await approveReq(farmer.token, { request_id: pendingId });
  const stranger = await executeReq(lab.token, { token: await tokenOf(batch.id, farmer.token) });
  assert.equal(stranger.status, 409);
  assert.equal(stranger.body.error.code, "transfer_not_requested");
  // The approved requestor can.
  const ok = await executeReq(transporter.token, { token: await tokenOf(batch.id, farmer.token) });
  assert.equal(ok.status, 200);
});

test("stale requests: holder changed before approval -> request dies", async () => {
  const batch = await createBatch(farmer.token);

  // Lab requests while farmer holds.
  const r = await reqCustody(lab.token, { batch_id: batch.id });
  const reqId = r.body.data.request.id;

  // Batch moves to the transporter first (farmer -> transporter).
  const rT = await reqCustody(transporter.token, { batch_id: batch.id });
  await approveReq(farmer.token, { request_id: rT.body.data.request.id });
  const ok = await executeReq(transporter.token, { token: await tokenOf(batch.id, farmer.token) });
  assert.equal(ok.status, 200);

  // The old lab request's holder (farmer) is no longer the holder.
  const staleApprove = await approveReq(farmer.token, { request_id: reqId });
  assert.equal(staleApprove.status, 409);
  assert.equal(staleApprove.body.error.code, "stale_holder");

  // Lab must re-request from the CURRENT holder (transporter).
  const r2 = await reqCustody(lab.token, { batch_id: batch.id });
  assert.equal(r2.status, 201);
  assert.equal(r2.body.data.request.type, "TRANSPORTER_TO_LAB");
});

// -------------------------------------------------------- admin recovery

test("admin recovery pulls custody to AYUSH without holder consent (phase preserved)", async () => {
  const batch = await createBatch(farmer.token);
  const beforePhase = (await prisma.batch.findUnique({ where: { id: batch.id } })).phase;

  // Non-admin cannot recover.
  const forbidden = await recoverReq(transporter.token, { batch_id: batch.id });
  assert.equal(forbidden.status, 403);

  const rec = await recoverReq(admin.token, { batch_id: batch.id, reason: "farmer unresponsive" });
  assert.equal(rec.status, 200, JSON.stringify(rec.body));
  assert.equal(rec.body.data.transfer.request.type, "ADMIN_RECOVERY");
  assert.equal(rec.body.data.transfer.request.status, "completed");
  assert.equal(rec.body.data.transfer.to_user_id, admin.user.id);
  assert.equal(rec.body.data.transfer.phase_after, beforePhase); // phase preserved

  const holder = await prisma.batch.findUnique({ where: { id: batch.id } });
  assert.equal(holder.current_holder_user_id, admin.user.id);
  const active = await prisma.qrToken.findFirst({ where: { batch_id: batch.id, status: "active" } });
  assert.equal(active.owner_user_id, admin.user.id);
  assert.equal(active.version, 2);
  const event = await prisma.batchEvent.findFirst({
    where: { batch_id: batch.id, event_type: "TRANSFER" },
    orderBy: { created_at: "desc" },
  });
  assert.equal(event.payload_json.method, "admin_recovery");
});

// ------------------------------------------------------------ proofs

test("proof-of-handover attaches after completion (photo + signatures)", async () => {
  const batch = await createBatch(farmer.token);
  const r = await reqCustody(transporter.token, { batch_id: batch.id });
  await approveReq(farmer.token, { request_id: r.body.data.request.id });
  await executeReq(transporter.token, { token: await tokenOf(batch.id, farmer.token) });
  const reqId = r.body.data.request.id;

  // Proof before an upload: upload a photo as the receiver (transporter).
  const up = await request(app)
    .post("/api/v1/uploads")
    .set("Authorization", `Bearer ${transporter.token}`)
    .attach("file", Buffer.from("handover-photo-bytes"), { filename: "handover.jpg", contentType: "image/jpeg" });
  assert.equal(up.status, 201);

  const proof = await request(app)
    .post(`/api/v1/transfers/requests/${reqId}/proof`)
    .set("Authorization", `Bearer ${transporter.token}`)
    .send({
      asset_id: up.body.data.asset.id,
      sender_signature: "farmer-ack",
      receiver_signature: "transporter-ack",
      remarks: "handed over at farm gate 09:45",
    });
  assert.equal(proof.status, 201, JSON.stringify(proof.body));
  assert.equal(proof.body.data.proof.sender_signature, "farmer-ack");
  assert.equal(proof.body.data.proof.receiver_signature, "transporter-ack");
  assert.ok(proof.body.data.proof.photo);
  assert.ok(proof.body.data.proof.ownership_history_id);

  // An unrelated user cannot attach.
  const outsider = await request(app)
    .post(`/api/v1/transfers/requests/${reqId}/proof`)
    .set("Authorization", `Bearer ${manufacturer.token}`)
    .send({ remarks: "i was not there" });
  assert.equal(outsider.status, 403);

  // Proof on a pending (not completed) request is refused.
  const b2 = await createBatch(farmer.token);
  const r2 = await reqCustody(lab.token, { batch_id: b2.id });
  const early = await request(app)
    .post(`/api/v1/transfers/requests/${r2.body.data.request.id}/proof`)
    .set("Authorization", `Bearer ${lab.token}`)
    .send({ remarks: "premature" });
  assert.equal(early.status, 409);
  assert.equal(early.body.error.code, "invalid_state");
});

// -------------------------------------------------- ownership & history

test("ownership endpoints: current owner + full custody history", async () => {
  const batch = await createBatch(farmer.token);
  const token = await tokenOf(batch.id, farmer.token);

  // Farmer -> transporter -> lab (governed).
  const r1 = await reqCustody(transporter.token, { batch_id: batch.id });
  await approveReq(farmer.token, { request_id: r1.body.data.request.id });
  await executeReq(transporter.token, { token: await tokenOf(batch.id, farmer.token) });
  const r2 = await reqCustody(lab.token, { batch_id: batch.id });
  await approveReq(transporter.token, { request_id: r2.body.data.request.id });
  await executeReq(lab.token, { token: await tokenOf(batch.id, transporter.token) });

  // Current owner = lab.
  const owner = await request(app).get(`/api/v1/batches/${batch.id}/owner`).set("Authorization", `Bearer ${lab.token}`);
  assert.equal(owner.status, 200, JSON.stringify(owner.body));
  assert.equal(owner.body.data.ownership.owner.id, lab.user.id);
  assert.equal(owner.body.data.ownership.phase, "at_lab");
  assert.equal(owner.body.data.ownership.active_qr_version, 3);

  // History: system->farmer (CREATED), farmer->transporter, transporter->lab.
  const hist = await request(app)
    .get(`/api/v1/batches/${batch.id}/ownership-history`)
    .set("Authorization", `Bearer ${lab.token}`);
  assert.equal(hist.status, 200);
  assert.equal(hist.body.data.history.length, 3);
  assert.equal(hist.body.data.history[0].event_type, "CREATED");
  assert.equal(hist.body.data.history[1].event_type, "TRANSFER");
  assert.equal(hist.body.data.history[1].from.id, farmer.user.id);
  assert.equal(hist.body.data.history[1].to.id, transporter.user.id);
  assert.equal(hist.body.data.history[1].request_id, r1.body.data.request.id);
  assert.equal(hist.body.data.history[2].to.id, lab.user.id);
  assert.equal(hist.body.data.history[2].transfer_type, "TRANSPORTER_TO_LAB");

  // Outsider (manufacturer not in the chain yet) cannot view.
  const blocked = await request(app).get(`/api/v1/batches/${batch.id}/owner`).set("Authorization", `Bearer ${manufacturer.token}`);
  assert.equal(blocked.status, 403);
  const strangerList = await listReq(strangerTransporter.token);
  assert.equal(strangerList.status, 200);
  assert.equal(strangerList.body.data.total, 0);
  void token;
});

test("transfer request list scopes to involvement (admin sees all)", async () => {
  const batch = await createBatch(farmer.token);
  await reqCustody(transporter.token, { batch_id: batch.id });

  // Scope by batch: transporter is the requester -> sees it.
  const mine = await listReq(transporter.token, `?batch_id=${batch.id}`);
  assert.equal(mine.status, 200);
  assert.equal(mine.body.data.total, 1);
  assert.equal(mine.body.data.requests[0].to.id, transporter.user.id);

  // Lab has no involvement with THIS batch -> nothing.
  const labList = await listReq(lab.token, `?batch_id=${batch.id}`);
  assert.equal(labList.body.data.total, 0);

  // Status filter: only the pending request exists for this batch.
  const byStatus = await listReq(transporter.token, `?batch_id=${batch.id}&status=completed`);
  assert.equal(byStatus.body.data.total, 0);
  const byPending = await listReq(transporter.token, `?batch_id=${batch.id}&status=pending`);
  assert.equal(byPending.body.data.total, 1);

  // Admin sees every batch's requests (this one included).
  const adminList = await listReq(admin.token, `?batch_id=${batch.id}`);
  assert.equal(adminList.status, 200);
  assert.equal(adminList.body.data.total, 1);
});
