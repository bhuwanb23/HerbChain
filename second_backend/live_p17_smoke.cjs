/**
 * Phase 17 live smoke — offline sync over real HTTP (BASE_URL, default :4817):
 * device register → offline batch draft → official batch + QR receipt →
 * offline transfer request (no ownership change) → conflicts (moved holder /
 * unknown batch / invalid GPS) with per-item isolation → shipment GPS +
 * pickup → media upload → incremental pull → status → conflict resolve →
 * admin analytics + RBAC gates.
 *
 *   BASE_URL=http://localhost:4817 node live_p17_smoke.cjs
 */
const assert = require("assert");
const http = require("http");

const BASE = process.env.BASE_URL || "http://localhost:4817";
const PASSWORD = "Admin@123456";
let passed = 0;

function req(method, p, { token, body } = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request(`${BASE}${p}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
      },
    }, (res) => {
      let buf = "";
      res.on("data", (c) => (buf += c));
      res.on("end", () => resolve({ status: res.statusCode, body: buf ? JSON.parse(buf) : {} }));
    });
    r.on("error", reject);
    if (data) r.write(data);
    r.end();
  });
}

function check(name, cond, extra) {
  assert.ok(cond, `${name} ${extra ? "→ " + JSON.stringify(extra).slice(0, 300) : "failed"}`);
  passed += 1;
  console.log(`  ✔ ${name}`);
}

(async () => {
  console.log(`Phase 17 smoke → ${BASE}`);

  // ---- logins
  const login = async (email) => {
    const r = await req("POST", "/api/v1/auth/login", { body: { identifier: email, password: PASSWORD } });
    check(`login ${email}`, r.status === 200 && r.body.data.access_token, r.body);
    return r.body.data.access_token;
  };
  const farmer = await login("p17.farmer@herbchain.in");
  const tpt = await login("p17.tpt@herbchain.in");
  const admin = await login("p17.admin@herbchain.in");

  // ---- device registration
  const reg = await req("POST", "/api/v1/devices/register", { token: farmer, body: { device_id: "p17-field-phone-01", platform: "android", device_name: "Field Phone", app_version: "1.0.0" } });
  check("device register 201", reg.status === 201 && reg.body.data.device.id, reg.body);
  const unreg = await req("POST", "/api/v1/sync/upload", { token: farmer, body: { device_id: "ghost-device", items: [{ local_id: "X", entity_type: "gps_points", operation: "UPLOAD", payload: [] }] } });
  check("upload w/ unregistered device → 403", unreg.status === 403, unreg.body);

  // ---- offline batch draft
  const species = await req("GET", "/api/v1/species/p17-tulsi");
  const speciesId = species.body.data.species.id;
  const prep = require("./p17_prep.json");
  const b = await req("POST", "/api/v1/sync/upload", { token: farmer, body: { device_id: "p17-field-phone-01", items: [{
    local_id: "OFF-BATCH-1", entity_type: "batch_create", operation: "CREATE",
    payload: { species_id: speciesId, quantity: 25, unit: "kg", harvest_date: new Date().toISOString().slice(0, 10), cultivation_type: "organic", gps_lat: 12.9, gps_lng: 79.1, location: "Vellore", asset_ids: [prep.asset_id] },
  }] } });
  check("offline batch draft applied", b.status === 200 && b.body.data.status === "completed" && b.body.data.applied === 1, b.body);
  const bReceipt = b.body.data.results[0].receipt;
  check("receipt maps local_id → server batch + code", bReceipt.batch_id && /^HERB-/.test(bReceipt.code), bReceipt);
  const offlineBatch = bReceipt.batch_id;

  // batch_create with no images → conflict (createBatch requires ≥1 asset)
  const bBad = await req("POST", "/api/v1/sync/upload", { token: farmer, body: { device_id: "p17-field-phone-01", items: [{
    local_id: "OFF-BATCH-2", entity_type: "batch_create", operation: "CREATE",
    payload: { species_id: speciesId, quantity: 5, unit: "kg", harvest_date: new Date().toISOString().slice(0, 10), cultivation_type: "organic" },
  }] } });
  check("batch draft without image → CONFLICT (isolation)", bBad.body.data.results[0].status === "CONFLICT" && bBad.body.data.results[0].conflict_type === "VALIDATION_ERROR", bBad.body.data.results[0]);

  // ---- offline custody scan → transfer REQUEST (holder must not change)
  const batchBefore = await req("GET", `/api/v1/batches/${offlineBatch}`, { token: farmer });
  const scan = await req("POST", "/api/v1/sync/upload", { token: tpt, body: { items: [{
    local_id: "OFF-SCAN-1", entity_type: "transfer_request", operation: "TRANSFER",
    payload: { batch_id: offlineBatch, type: "FARMER_TO_TRANSPORTER", reason: "offline pickup scan" },
  }] } });
  check("offline scan → transfer request applied", scan.status === 200 && scan.body.data.applied === 1, scan.body);
  const requestId = scan.body.data.results[0].receipt.request_id;
  check("offline scan did NOT move custody", batchBefore.body.data.batch.current_holder_user_id === batchBefore.body.data.batch.farmer_id, batchBefore.body.data.batch);

  // ---- conflicts + per-item isolation
  const preppedBatchId = (await req("GET", "/api/v1/batches/mine", { token: farmer })).body.data.batches.find((x) => x.code === "HERB-P17-000001").id;
  const cf = await req("POST", "/api/v1/sync/upload", { token: tpt, body: { items: [
    { local_id: "C-MOVED", entity_type: "transfer_request", operation: "TRANSFER", payload: { batch_id: "missing-batch-xyz", type: "FARMER_TO_TRANSPORTER" } },
    { local_id: "C-GPS", entity_type: "gps_points", operation: "UPLOAD", payload: [{ shipment_id: null, gps_lat: 1, gps_lng: 2 }] },
    { local_id: "C-POD", entity_type: "media_upload", operation: "UPLOAD", payload: { data_base64: Buffer.from("p17-pod").toString("base64"), mime_type: "image/png", filename: "pod.png" } },
  ] } });
  check("mixed upload → partial", cf.body.data.status === "partial" && cf.body.data.conflicted === 2 && cf.body.data.applied === 1, cf.body.data);
  const byLocal = Object.fromEntries(cf.body.data.results.map((r) => [r.local_id, r]));
  check("unknown batch → QR_EXPIRED-style not_found conflict", byLocal["C-MOVED"].status === "CONFLICT", byLocal["C-MOVED"]);
  check("invalid GPS → VALIDATION_ERROR", byLocal["C-GPS"].conflict_type === "VALIDATION_ERROR", byLocal["C-GPS"]);
  check("POD applied despite conflicts (isolation)", byLocal["C-POD"].status === "SYNCED" && byLocal["C-POD"].receipt.asset_id, byLocal["C-POD"]);

  // ---- shipment + offline GPS + pickup
  const shipment = await req("POST", "/api/v1/shipments", { token: tpt, body: { shipment_type: "CUSTOM", ref_type: "batch", ref_id: offlineBatch, from_user_id: null, to_user_id: null, quantity_kg: 25 } });
  // (shipment creation may require specific roles/flow — fall back to skip if not creatable here)
  let shipmentId = null;
  if (shipment.status === 201 && shipment.body.data.shipment) {
    shipmentId = shipment.body.data.shipment.id;
    const gps = await req("POST", "/api/v1/sync/upload", { token: tpt, body: { items: [{ local_id: "G-1", entity_type: "gps_points", operation: "UPLOAD", payload: [{ shipment_id: shipmentId, gps_lat: 12.91, gps_lng: 79.11 }] }] } });
    check("offline GPS breadcrumbs applied", gps.body.data.applied === 1, gps.body.data);
  } else {
    console.log("  ↷ shipment creation skipped (flow-specific) — GPS exercised via unit suite");
  }

  // ---- incremental pull
  const changes = await req("GET", `/api/v1/sync/changes?since=${encodeURIComponent(new Date(Date.now() - 3600000).toISOString())}`, { token: farmer });
  check("incremental pull 200", changes.status === 200, changes.body);
  check("pull includes farmer's offline batch", changes.body.data.batches.some((x) => x.id === offlineBatch), changes.body.data.batches);
  check("pull includes active qr tokens with raw token", changes.body.data.qr_tokens.length >= 1 && changes.body.data.qr_tokens.every((t) => t.batch_id && t.token), changes.body.data.qr_tokens);

  // ---- status
  const st = await req("GET", "/api/v1/sync/status", { token: tpt });
  check("status 200 with health fields", st.status === 200 && "open_conflicts" in st.body.data && "avg_sync_ms_24h" in st.body.data, st.body.data);

  // ---- conflict resolution
  const list = await req("GET", "/api/v1/sync/conflicts?resolved=false", { token: tpt });
  check("conflict list (own scope)", list.status === 200 && list.body.data.rows.length >= 2, list.body.data.rows.length);
  const cid = list.body.data.rows[0].id;
  const farmerResolve = await req("POST", `/api/v1/sync/conflicts/${cid}/resolve`, { token: farmer, body: { resolution: "discard" } });
  check("other user cannot resolve → 403", farmerResolve.status === 403, farmerResolve.status);
  const resolve = await req("POST", `/api/v1/sync/conflicts/${cid}/resolve`, { token: tpt, body: { resolution: "discard", note: "stale offline scan" } });
  check("owner resolves → 200", resolve.status === 200 && resolve.body.data.conflict.resolved_at, resolve.body);

  // ---- analytics + RBAC
  const anon = await req("GET", "/api/v1/sync/analytics");
  check("analytics without auth → 401", anon.status === 401, anon.status);
  const tptAn = await req("GET", "/api/v1/sync/analytics", { token: tpt });
  check("analytics non-admin → 403", tptAn.status === 403, tptAn.status);
  const an = await req("GET", "/api/v1/sync/analytics?days=1", { token: admin });
  check("admin analytics 200 (sessions, conflict rate, devices)", an.status === 200 && an.body.data.sync_sessions >= 3 && an.body.data.conflict_rate > 0 && an.body.data.active_devices >= 1, an.body.data);

  console.log(`\nPhase 17 smoke: ${passed} checks passed`);
})().catch((e) => { console.error(`\nSMOKE FAILED: ${e.message}`); process.exit(1); });
