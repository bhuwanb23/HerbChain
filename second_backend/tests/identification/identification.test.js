/**
 * Phase 4 identification tests — AI/ML-assisted recognition flow on an
 * isolated DB. Real sharp-decoded images (synthetic noise / solid frames)
 * exercise the quality gate, the mock provider drives deterministic
 * predictions through the species alias resolver, and the full flow ends with
 * a batch created from a confirmed identification.
 */
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const sharp = require("sharp");

// Offline, deterministic recognition for the whole suite.
process.env.RECOGNITION_PROVIDER = "mock";

const { setupDb } = require("./_db");
const db = setupDb();
const { prisma } = require("../../src/db/client");
const { seedRbac } = require("../../src/db/rbac");
const { hashPassword } = require("../../src/services/passwords");
const { createApp } = require("../../src/app");

let app;

/** Synthetic grayscale image (noise = textured/sharp; solid = flat/blur). */
async function frame({ width = 1024, height = 1024, kind = "noise", min = 60, max = 210, value = 128 } = {}) {
  const n = width * height;
  const buf = Buffer.alloc(n);
  if (kind === "noise") {
    for (let i = 0; i < n; i++) buf[i] = min + Math.floor(Math.random() * (max - min));
  } else {
    buf.fill(value);
  }
  return sharp(buf, { raw: { width, height, channels: 1 } }).jpeg().toBuffer();
}

async function reg(email) {
  const r = await request(app).post("/api/v1/auth/register").send({ name: "T", email, password: "password1", role: "farmer" });
  return r.body.data.access_token;
}

async function detect(token, buffer, mock = null) {
  let req = request(app)
    .post("/api/v1/identifications/detect")
    .set("Authorization", `Bearer ${token}`)
    .field("metadata", JSON.stringify({ device_id: "dev-1", captured_at: new Date().toISOString(), gps_lat: 13.0827, gps_lng: 80.2707 }));
  if (mock) req = req.field("mock", mock);
  return req.attach("file", buffer, { filename: "herb.jpg", contentType: "image/jpeg" });
}

const confirm = (token, id, body) =>
  request(app).post(`/api/v1/identifications/${id}/confirm`).set("Authorization", `Bearer ${token}`).send(body);

let farmerToken;
let farmerBToken;
let adminToken;

before(async () => {
  await seedRbac();
  await prisma.species.createMany({
    data: [
      { code: "ashwagandha", common_name: "Ashwagandha", scientific_name: "Withania somnifera", is_active: true },
      { code: "tulsi", common_name: "Tulsi", scientific_name: "Ocimum sanctum", is_active: true },
      { code: "giloy", common_name: "Giloy", scientific_name: "Tinospora cordifolia", is_active: true },
      { code: "inactive_sp", common_name: "Disabled", scientific_name: "Nope", is_active: false },
    ],
  });
  await prisma.speciesSynonym.createMany({
    data: [
      { species_id: (await prisma.species.findUnique({ where: { code: "ashwagandha" } })).id, name: "Indian Ginseng", language: "en" },
      { species_id: (await prisma.species.findUnique({ where: { code: "tulsi" } })).id, name: "Holy Basil", language: "en" },
    ],
  });

  app = createApp();

  farmerToken = await reg("fa@test.dev");
  farmerBToken = await reg("fb@test.dev");
  await reg("tr@test.dev");
  // Transporter: registered (farmer role) then re-rolled — gated + no grant.
  const tr = await prisma.user.findUnique({ where: { email: "tr@test.dev" } });
  await prisma.user.update({ where: { id: tr.id }, data: { role: "transporter" } });

  const admin = await prisma.user.create({
    data: { name: "Admin", email: "adm@test.dev", password_hash: hashPassword("password1"), role: "admin", kyc_status: "none" },
  });
  const login = await request(app).post("/api/v1/auth/login").send({ identifier: "adm@test.dev", password: "password1" });
  adminToken = login.body.data.access_token;
  void admin;
});

after(async () => {
  await prisma.$disconnect();
  db.cleanup();
});

// ------------------------------------------------------------- quality

test("quality gate: small image is rejected (too_small) without a provider call", async () => {
  const small = await frame({ width: 200, height: 200 });
  const res = await detect(farmerToken, small);
  assert.equal(res.status, 422);
  assert.equal(res.body.error.code, "image_quality");
  assert.ok(res.body.error.details.quality.reasons.includes("too_small"));
  assert.equal(res.body.error.details.quality.reasons.includes("blurry"), false);
  // no recognition rows for a rejected image
  const reqs = await prisma.aiRequest.count();
  assert.equal(reqs, 0);
});

test("quality gate: solid bright image is blurry", async () => {
  const flat = await frame({ kind: "solid", value: 128 });
  const res = await detect(farmerToken, flat);
  assert.equal(res.status, 422);
  assert.ok(res.body.error.details.quality.reasons.includes("blurry"));
});

test("quality gate: near-black image is too dark", async () => {
  const dark = await frame({ kind: "solid", value: 5 });
  const res = await detect(farmerToken, dark);
  assert.equal(res.status, 422);
  assert.ok(res.body.error.details.quality.reasons.includes("too_dark"));
});

test("detect: invalid bytes are rejected as not_an_image", async () => {
  const res = await detect(farmerToken, Buffer.from("not an image at all"));
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, "invalid_image");
});

// ------------------------------------------------------------ detect

test("detect: high-confidence mapping -> verdict high + pending identification", async () => {
  const img = await frame();
  const res = await detect(farmerToken, img, "Ashwagandha|94");
  assert.equal(res.status, 200);
  assert.equal(res.body.data.status, "ok");
  assert.equal(res.body.data.cached, false);
  const ident = res.body.data.identification;
  assert.equal(ident.status, "pending");
  assert.equal(ident.verdict, "high");
  assert.equal(ident.confidence, 94);
  assert.equal(ident.predictions[0].code, "ashwagandha");
  assert.equal(ident.predictions[0].mapped, true);
  assert.equal(ident.top_species.code, "ashwagandha");
  assert.equal(ident.model.provider, "mock");
  assert.equal(ident.model.name, "mock-classifier");
  assert.ok(ident.asset.id);

  const reqRow = await prisma.aiRequest.findFirst({ where: { identification: { id: ident.id } } });
  assert.ok(reqRow);
  assert.equal(reqRow.success, true);
  assert.equal(reqRow.is_cached, false);
});

test("detect: alias resolution via scientific name and synonym", async () => {
  const img1 = await frame();
  const sci = await detect(farmerToken, img1, "Withania somnifera|90");
  assert.equal(sci.body.data.identification.predictions[0].code, "ashwagandha");

  const img2 = await frame();
  const syn = await detect(farmerToken, img2, "Indian Ginseng|88");
  assert.equal(syn.body.data.identification.predictions[0].code, "ashwagandha");
});

test("detect: verdict bands medium and low", async () => {
  const imgM = await frame();
  const med = await detect(farmerToken, imgM, "Tulsi|80");
  assert.equal(med.body.data.identification.verdict, "medium");

  const imgL = await frame();
  const low = await detect(farmerToken, imgL, "Ashwagandha|55");
  assert.equal(low.body.data.identification.verdict, "low");
  assert.equal(low.body.data.identification.top_species.code, "ashwagandha");
});

test("detect: unmapped label stays manual and never becomes a species", async () => {
  const img = await frame();
  const res = await detect(farmerToken, img, "MysteryPlantX|92");
  assert.equal(res.status, 200);
  const ident = res.body.data.identification;
  assert.equal(ident.predictions[0].mapped, false);
  assert.equal(ident.predictions[0].code, null);
  assert.equal(ident.verdict, "manual");
  assert.equal(ident.top_species, null);
});

test("detect: no plant detected (empty predictions) -> status no_plant", async () => {
  const img = await frame();
  const res = await detect(farmerToken, img, "NONE");
  assert.equal(res.status, 200);
  assert.equal(res.body.data.status, "no_plant");
  assert.equal(res.body.data.identification.status, "error");
  assert.equal(res.body.data.identification.predictions.length, 0);
});

test("detect: same image+provider is served from the hash cache (no second call)", async () => {
  const img = await frame();
  const first = await detect(farmerToken, img, "Ashwagandha|91");
  assert.equal(first.body.data.cached, false);
  const id1 = first.body.data.identification.id;

  const second = await detect(farmerToken, img, "Ashwagandha|91");
  assert.equal(second.status, 200);
  assert.equal(second.body.data.cached, true);
  const id2 = second.body.data.identification.id;
  assert.notEqual(id1, id2); // fresh pending row per attempt
  assert.equal(second.body.data.identification.predictions[0].code, "ashwagandha");

  // Deterministic: the cache row keyed by THIS image's hash + mock model.
  const cache = await prisma.imageHashCache.findFirst({
    where: { provider: "mock", model_name: "mock-classifier", image_hash: second.body.data.identification.image_hash },
  });
  assert.ok(cache);
  assert.equal(cache.hits, 1);

  const identRow = await prisma.aiIdentification.findUnique({ where: { id: id2 }, include: { request: true } });
  assert.equal(identRow.request.is_cached, true);
});

test("detect: transporter (no grant) is forbidden", async () => {
  // Single retry: supertest's per-request ephemeral server can ECONNRESET on
  // Windows under load — not an app failure.
  const once = async (fn) => {
    try {
      return await fn();
    } catch (err) {
      if (err.code !== "ECONNRESET") throw err;
      await new Promise((r) => setTimeout(r, 150));
      return fn();
    }
  };
  const trLogin = await once(() => request(app).post("/api/v1/auth/login").send({ identifier: "tr@test.dev", password: "password1" }));
  assert.equal(trLogin.status, 200);
  // Tiny body: the permission gate rejects BEFORE parsing the file, and a
  // large unread multipart body can ECONNRESET the client socket.
  const res = await once(() =>
    request(app)
      .post("/api/v1/identifications/detect")
      .set("Authorization", `Bearer ${trLogin.body.data.access_token}`)
      .field("mock", "Ashwagandha|94")
      .attach("file", Buffer.from("tiny"), { filename: "h.jpg", contentType: "image/jpeg" })
  );
  assert.equal(res.status, 403);
});

// ----------------------------------------------------------- confirm

test("confirm: accept AI top pick (accepted) -> confirmed, batch-ready", async () => {
  const img = await frame();
  const res = await detect(farmerToken, img, "Ashwagandha|94");
  const id = res.body.data.identification.id;
  const topSpeciesId = res.body.data.identification.top_species.id;

  const c = await confirm(farmerToken, id, { accepted: true });
  assert.equal(c.status, 200);
  const ident = c.body.data.identification;
  assert.equal(ident.status, "confirmed");
  assert.equal(ident.accepted, true);
  assert.equal(ident.mismatch, false);
  assert.equal(ident.selected_species.id, topSpeciesId);

  // repeat -> 409 already resolved
  const again = await confirm(farmerToken, id, { accepted: true });
  assert.equal(again.status, 409);
});

test("confirm: farmer changes species -> mismatch flagged (training data)", async () => {
  const img = await frame();
  const res = await detect(farmerToken, img, "Ashwagandha|90");
  const id = res.body.data.identification.id;

  const c = await confirm(farmerToken, id, { species_code: "tulsi" });
  assert.equal(c.status, 200);
  const ident = c.body.data.identification;
  assert.equal(ident.status, "confirmed");
  assert.equal(ident.accepted, false);
  assert.equal(ident.mismatch, true);
  assert.equal(ident.selected_species.code, "tulsi");
});

test("confirm: farmer rejects the photo", async () => {
  const img = await frame();
  const res = await detect(farmerToken, img, "Ashwagandha|80");
  const id = res.body.data.identification.id;

  const c = await confirm(farmerToken, id, { rejected_reason: "poor_image" });
  assert.equal(c.status, 200);
  assert.equal(c.body.data.identification.status, "rejected");
  assert.equal(c.body.data.identification.rejected_reason, "poor_image");
});

test("confirm: cannot accept an unmapped prediction; species pick required", async () => {
  const img = await frame();
  const res = await detect(farmerToken, img, "MysteryPlantX|92");
  const id = res.body.data.identification.id;
  const accept = await confirm(farmerToken, id, { accepted: true });
  assert.equal(accept.status, 400);

  // manual pick from the catalogue resolves it
  const pick = await confirm(farmerToken, id, { species_code: "giloy" });
  assert.equal(pick.status, 200);
  assert.equal(pick.body.data.identification.selected_species.code, "giloy");
});

test("confirm: ownership scoping — another farmer cannot confirm or view", async () => {
  const img = await frame();
  const res = await detect(farmerBToken, img, "Ashwagandha|90");
  const id = res.body.data.identification.id;

  const c = await confirm(farmerToken, id, { accepted: true });
  assert.equal(c.status, 404);
  const v = await request(app).get(`/api/v1/identifications/${id}`).set("Authorization", `Bearer ${farmerToken}`);
  assert.equal(v.status, 404);
});

// ------------------------------------------------------ history + admin

test("history: farmer list is scoped; admin list sees everyone with filters", async () => {
  const mine = await request(app).get("/api/v1/identifications/mine").set("Authorization", `Bearer ${farmerBToken}`);
  assert.equal(mine.status, 200);
  assert.ok(mine.body.data.total >= 1);
  assert.ok(mine.body.data.identifications.every((i) => i.user === null)); // no cross-user leak in mine view

  const all = await request(app).get("/api/v1/identifications").set("Authorization", `Bearer ${adminToken}`);
  assert.equal(all.status, 200);
  assert.ok(all.body.data.identifications.length >= mine.body.data.total);

  const farmerB = await prisma.user.findUnique({ where: { email: "fb@test.dev" } });
  const byFarmer = await request(app)
    .get(`/api/v1/identifications?farmer_id=${farmerB.id}`)
    .set("Authorization", `Bearer ${adminToken}`);
  assert.equal(byFarmer.status, 200);
  assert.equal(byFarmer.body.data.total, mine.body.data.total);
  assert.ok(byFarmer.body.data.identifications.every((i) => i.user.email === "fb@test.dev"));

  // non-admin list -> forbidden
  const denied = await request(app).get("/api/v1/identifications").set("Authorization", `Bearer ${farmerToken}`);
  assert.equal(denied.status, 403);
});

// ---------------------------------------------------------- batch link

test("end to end: confirmed identification registers a batch (species + image derived)", async () => {
  const img = await frame();
  const res = await detect(farmerToken, img, "Ashwagandha|94");
  const ident = res.body.data.identification;
  await confirm(farmerToken, ident.id, { accepted: true });

  const create = await request(app)
    .post("/api/v1/batches")
    .set("Authorization", `Bearer ${farmerToken}`)
    .send({
      identification_id: ident.id, // species + image come from here
      quantity: 42,
      unit: "kg",
      harvest_date: "2026-09-04",
      cultivation_type: "organic",
      gps_lat: 13.0827,
      gps_lng: 80.2707,
    });
  assert.equal(create.status, 201, JSON.stringify(create.body));
  const batch = create.body.data.batch;
  assert.equal(batch.species.code, "ashwagandha");

  // the analysed photo was attached automatically (serializer flattens docs)
  assert.ok(batch.images.some((d) => d.id === ident.asset.id));

  // identification is linked and cannot be reused
  const linked = await prisma.aiIdentification.findUnique({ where: { id: ident.id } });
  assert.equal(linked.batch_id, batch.id);

  const reuse = await request(app)
    .post("/api/v1/batches")
    .set("Authorization", `Bearer ${farmerToken}`)
    .send({
      identification_id: ident.id,
      quantity: 10,
      unit: "kg",
      harvest_date: "2026-09-04",
      cultivation_type: "organic",
      gps_lat: 13.0827,
      gps_lng: 80.2707,
    });
  assert.equal(reuse.status, 409);

  // the CREATED event records which identification produced the batch
  const event = await prisma.batchEvent.findFirst({ where: { batch_id: batch.id, event_type: "CREATED" } });
  assert.equal(event.payload_json.identification_id, ident.id);
});

test("end to end: mismatched (changed) identification registers the farmer's pick", async () => {
  const img = await frame();
  const res = await detect(farmerToken, img, "Ashwagandha|88");
  const ident = res.body.data.identification;
  await confirm(farmerToken, ident.id, { species_code: "tulsi" });

  const create = await request(app)
    .post("/api/v1/batches")
    .set("Authorization", `Bearer ${farmerToken}`)
    .send({
      identification_id: ident.id,
      quantity: 12,
      unit: "kg",
      harvest_date: "2026-09-04",
      cultivation_type: "organic",
      gps_lat: 13.0827,
      gps_lng: 80.2707,
    });
  assert.equal(create.status, 201);
  assert.equal(create.body.data.batch.species.code, "tulsi");
});

test("batch create: rejected or unconfirmed identification is refused", async () => {
  const img = await frame();
  const res = await detect(farmerToken, img, "Ashwagandha|70");
  const id = res.body.data.identification.id;

  // pending (not confirmed)
  const pending = await request(app)
    .post("/api/v1/batches")
    .set("Authorization", `Bearer ${farmerToken}`)
    .send({ identification_id: id, quantity: 5, unit: "kg", harvest_date: "2026-09-04", cultivation_type: "organic", gps_lat: 0, gps_lng: 0 });
  assert.equal(pending.status, 400);

  await confirm(farmerToken, id, { rejected_reason: "poor_image" });
  const rejected = await request(app)
    .post("/api/v1/batches")
    .set("Authorization", `Bearer ${farmerToken}`)
    .send({ identification_id: id, quantity: 5, unit: "kg", harvest_date: "2026-09-04", cultivation_type: "organic", gps_lat: 0, gps_lng: 0 });
  assert.equal(rejected.status, 400);
});
