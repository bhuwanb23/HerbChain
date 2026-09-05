/**
 * Consumer verification service (docs/phase_11.md +
 * docs/verification/architecture.md).
 *
 * Phase 11 = the public Digital Product Passport. A consumer scans the
 * PERMANENT product QR (never the internal ownership QR) and the verification
 * engine renders one verdict:
 *
 *   VERIFIED             everything green (active product, valid QR, lineage,
 *                        active certificates)
 *   EXPIRED              authentic, but ingredient certificates have lapsed
 *   RECALLED             product recalled / open AffectedProduct row
 *   UNDER_INVESTIGATION  open counterfeit alert, not yet recalled
 *   INVALID              unknown/revoked token or incomplete lineage
 *
 * Non-negotiable rules:
 *  - NO authentication on the public wire, but every scan is stored
 *    (ConsumerScan + qr_scan_logs purpose=consumer_view) and the passport
 *    NEVER exposes internal ids, emails, phones, addresses, government ids
 *    or financial data — only public codes (PRD-…, BAT-…, CERT-…) and names.
 *  - the passport fast-path cache (product_verification_cache) is purged on
 *    recall/status change so a recalled product can never serve stale data.
 *  - counterfeit detection runs on every recorded scan: geo velocity, scan
 *    bursts, excessive daily volume, post-revoke scans, unknown-token floods.
 */
const crypto = require("crypto");
const { prisma } = require("../db/client");
const { ApiError } = require("../utils/errors");
const { env } = require("../config/env");
const { hashToken } = require("./qrEngine");
const {
  ALERT_REASONS,
  ALERT_SEVERITIES,
  ALERT_STATUSES,
  JOURNEY_STAGES,
  TRUST_SCORE_WEIGHTS,
  statusLabel,
} = require("../constants/verification");

// ------------------------------------------------------------ token helpers

/** Accept a raw token or a portal URL (…/p/<token>, …/qr/<token>) → token. */
function normalizeToken(input) {
  const raw = String(input || "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("/")) {
    const last = raw.split(/[\/?#]/).filter(Boolean).pop();
    return last || null;
  }
  return raw;
}

/** Resolve a presented token to its QR record + full public context. */
async function resolveContext(token) {
  const record = await prisma.productQrToken.findUnique({
    where: { token_hash: hashToken(token) },
    include: {
      lot: {
        include: {
          product: {
            include: {
              manufacturer: {
                include: {
                  manufacturer_profile: true,
                  addresses: { where: { is_default: true }, take: 1 },
                },
              },
              formulas: { include: { species: { select: { id: true, code: true, common_name: true } } } },
            },
          },
          run: {
            include: {
              ingredients: {
                orderBy: { position: "asc" },
                include: {
                  batch: {
                    include: {
                      species: { select: { code: true, common_name: true } },
                      farmer: {
                        include: {
                          farmer_profile: true,
                          addresses: { where: { is_default: true }, take: 1 },
                        },
                      },
                      certifications: { orderBy: { issued_at: "desc" }, take: 1 },
                      events: {
                        where: { event_type: { in: ["CREATED", "TRANSFER", "LAB_RECEIVED", "LAB_TEST", "TEST_REVIEWED", "LAB_CERTIFIED"] } },
                        orderBy: { created_at: "asc" },
                        include: {
                          actor: { select: { id: true, name: true, role: true } },
                          from_user: { select: { id: true, role: true } },
                          to_user: { select: { id: true, role: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          events: { orderBy: { created_at: "asc" } },
        },
      },
    },
  });
  return record;
}

/** The batch's certificate if active and not expired (else null). */
function validCertificate(cert) {
  if (!cert || cert.status !== "active") return null;
  if (cert.expiry_date && cert.expiry_date <= new Date()) return null;
  return cert;
}

/** Present (possibly expired) certificate for expiry signalling. */
function anyCertificate(cert) {
  return cert && cert.status === "active" ? cert : null;
}

// ------------------------------------------------------------ engine

/**
 * The verification engine (spec "Verification Checks"). Order matters:
 * product exists -> product active -> QR valid -> lineage exists -> certs.
 */
function computeStatus({ record, openImpacts, openAlerts, context }) {
  if (!record) {
    return { status: "INVALID", verified: false, reason: "not_found", message: "Product not found — this QR is not a HerbChain product code" };
  }
  const lot = record.lot;
  const product = lot?.product;
  if (!product) {
    return { status: "INVALID", verified: false, reason: "product_missing", message: "Product data incomplete — this code no longer resolves" };
  }
  // Check 1+2: product exists & active.
  if (product.status === "recalled" || openImpacts > 0) {
    return {
      status: "RECALLED",
      verified: false,
      reason: "recalled",
      message: "This product has been recalled. Do not consume. Contact the manufacturer.",
      notices: ["do_not_consume"],
    };
  }
  if (product.deleted_at) {
    return { status: "INVALID", verified: false, reason: "deleted", message: "This product has been withdrawn from the market" };
  }
  // Check 3: QR valid.
  if (record.status !== "active") {
    return {
      status: "INVALID",
      verified: false,
      reason: "revoked",
      message: `This product QR is no longer valid (${record.status})`,
    };
  }
  // UNDER_INVESTIGATION: open counterfeit alert on this token/product.
  if (openAlerts > 0) {
    return {
      status: "UNDER_INVESTIGATION",
      verified: false,
      reason: "under_investigation",
      message: "This product is under review by AYUSH. Verification is temporarily withheld.",
    };
  }
  // Check 4: lineage exists.
  const ingredients = lot?.run?.ingredients || [];
  if (!lot?.run || ingredients.length === 0) {
    return { status: "INVALID", verified: false, reason: "lineage_missing", message: "Product data incomplete — no production lineage recorded" };
  }
  // Certification validity: any required ingredient cert lapsed -> EXPIRED.
  const certs = ingredients.map((i) => i.batch?.certifications?.[0] || null);
  const anyExpired = certs.some((c) => c && (c.status !== "active" || (c.expiry_date && c.expiry_date <= new Date())));
  if (anyExpired) {
    return {
      status: "EXPIRED",
      verified: false,
      reason: "certificate_expired",
      message: "This product is authentic, but its laboratory certification has expired.",
    };
  }
  const allCertified = certs.every((c) => validCertificate(c) !== null);
  if (!allCertified) {
    return { status: "INVALID", verified: false, reason: "certificate_missing", message: "Product data incomplete — missing laboratory certification" };
  }
  return { status: "VERIFIED", verified: true, reason: null, message: "Authentic AYUSH product — verified end to end." };
}

// ------------------------------------------------------------ passport

const STAGE_MAP = {
  CREATED: { stage: "HARVESTED", label: "Harvested", icon: "🌱" },
  TRANSFER: { stage: "TRANSPORTED", label: "Transported", icon: "🚛" },
  LAB_RECEIVED: { stage: "LAB_TESTED", label: "Laboratory Tested", icon: "🔬" },
  LAB_TEST: { stage: "LAB_TESTED", label: "Laboratory Tested", icon: "🔬" },
  TEST_REVIEWED: { stage: "LAB_TESTED", label: "Laboratory Tested", icon: "🔬" },
  LAB_CERTIFIED: { stage: "CERTIFIED", label: "Certified", icon: "✅" },
};

function journeyOf(context) {
  const lot = context?.lot;
  const stages = [];
  const seen = new Set();
  let transportLegs = 0;

  const push = (stage, date, location) => {
    if (seen.has(stage)) return;
    seen.add(stage);
    stages.push({ stage, ...JOURNEY_STAGES.find((s) => s.key === stage), date, location: location || null });
  };

  for (const ing of lot?.run?.ingredients || []) {
    const b = ing.batch;
    for (const ev of b?.events || []) {
      const mapped = STAGE_MAP[ev.event_type];
      if (!mapped) continue;
      if (ev.event_type === "TRANSFER") {
        transportLegs += 1;
        continue; // legs collapsed into one TRANSPORTED stage below
      }
      push(mapped.stage, ev.created_at, ev.location || b?.location || null);
    }
  }

  // MANUFACTURED from the lot's own timeline (LOT_CREATED).
  const lotEvent = (lot?.events || []).find((e) => e.event_type === "LOT_CREATED");
  if (lotEvent) {
    push("MANUFACTURED", lotEvent.created_at, lotEvent.location || null);
  }

  // Harvest stage prefers the farmer-declared harvest date.
  const firstIng = lot?.run?.ingredients?.[0];
  if (firstIng?.batch?.harvest_date) {
    const idx = stages.findIndex((s) => s.stage === "HARVESTED");
    if (idx >= 0) stages[idx].date = firstIng.batch.harvest_date;
  }
  // TRANSPORTED collapses into a single stage right after harvest (before
  // the lab stages) — consumers see one "Transported" with a leg count.
  if (transportLegs > 0 && !seen.has("TRANSPORTED")) {
    const labIdx = stages.findIndex((s) => s.stage === "LAB_TESTED");
    const certifiedIdx = stages.findIndex((s) => s.stage === "CERTIFIED");
    const insertAt = labIdx >= 0 ? labIdx : certifiedIdx >= 0 ? certifiedIdx : stages.length;
    const before = stages[insertAt - 1];
    seen.add("TRANSPORTED");
    stages.splice(insertAt, 0, {
      stage: "TRANSPORTED",
      ...JOURNEY_STAGES.find((s) => s.key === "TRANSPORTED"),
      date: before?.date || null,
      location: before?.location || null,
      detail: `${transportLegs} leg${transportLegs > 1 ? "s" : ""}`,
    });
  }
  return stages;
}

/** Origin farms: farmer name + district/state only — never contacts. */
function originOf(context) {
  const farms = [];
  const regions = new Set();
  for (const ing of context?.lot?.run?.ingredients || []) {
    const b = ing.batch;
    if (!b) continue;
    const addr = b.farmer?.addresses?.[0] || null;
    const state = addr?.state || null;
    if (state) regions.add(state);
    farms.push({
      farmer: b.farmer?.name || null,
      district: addr?.district || addr?.city || null,
      state,
      location: b.location || null,
      harvest_date: b.harvest_date || null,
      batch_code: b.code || null,
      species: b.species?.common_name || null,
      cultivation_type: b.cultivation_type || null,
    });
  }
  return { farm_count: farms.length, regions: [...regions], farms };
}

function certificatesOf(context) {
  const out = [];
  for (const ing of context?.lot?.run?.ingredients || []) {
    const cert = ing.batch?.certifications?.[0] || null;
    if (!cert) continue;
    out.push({
      certificate_number: cert.certificate_number,
      lab_code: cert.lab_code || null,
      lab_name: cert.lab_name || null,
      species: ing.batch?.species?.common_name || cert.species_code || null,
      status: cert.status === "active" ? "PASS" : "REVOKED",
      issued_at: cert.issued_at,
      expiry_date: cert.expiry_date || null,
    });
  }
  return out;
}

function trustScoreOf(context) {
  const w = TRUST_SCORE_WEIGHTS;
  const ingredients = context?.lot?.run?.ingredients || [];

  // lab_pass: fraction of ingredient batches with a currently-valid cert.
  const certs = ingredients.map((i) => validCertificate(i.batch?.certifications?.[0] || null));
  const valid = certs.filter(Boolean).length;
  const labPass = ingredients.length ? Math.round((valid / ingredients.length) * w.lab_pass) : 0;

  // traceability_complete: lineage snapshot frozen + harvest dates on all.
  const snapshots = context?.snapshotCount || 0;
  const complete = snapshots > 0 && ingredients.every((i) => i.batch?.harvest_date);
  const traceability = complete ? w.traceability_complete : snapshots > 0 ? Math.round(w.traceability_complete * 0.7) : 0;

  // licensed_manufacturer: AYUSH licence + verified profile.
  const profile = context?.lot?.product?.manufacturer?.manufacturer_profile;
  const licensed = profile?.ayush_license_no && profile?.verification_status === "verified" ? w.licensed_manufacturer : 0;

  // verified_supply_chain: every ingredient farmer AYUSH-verified.
  const farmers = ingredients.map((i) => i.batch?.farmer).filter(Boolean);
  const verifiedFarmers = farmers.filter((f) => f?.kyc_status === "verified").length;
  const supplyChain = farmers.length && farmers.length === verifiedFarmers ? w.verified_supply_chain : 0;

  const score = labPass + traceability + licensed + supplyChain;
  return {
    score,
    max: 100,
    breakdown: { lab_pass: labPass, traceability_complete: traceability, licensed_manufacturer: licensed, verified_supply_chain: supplyChain },
  };
}

function sustainabilityOf(context) {
  const types = new Set();
  let organic = false;
  for (const ing of context?.lot?.run?.ingredients || []) {
    const b = ing.batch;
    if (!b) continue;
    if (b.cultivation_type) types.add(b.cultivation_type);
    if (b.farmer?.farmer_profile?.organic_certified) organic = true;
  }
  const regions = new Set(
    (context?.lot?.run?.ingredients || [])
      .map((i) => i.batch?.farmer?.addresses?.[0]?.state)
      .filter(Boolean)
  );
  return {
    cultivation_types: [...types],
    organic_certified: organic,
    regions: [...regions],
    region_summary: [...regions].join(", ") || null,
  };
}

function manufacturerOf(context) {
  const m = context?.lot?.product?.manufacturer || null;
  const profile = m?.manufacturer_profile || null;
  const addr = m?.addresses?.[0] || null;
  const run = context?.lot?.run;
  return {
    name: profile?.company_name || m?.name || null,
    license: profile?.ayush_license_no
      ? { number: profile.ayush_license_no, status: profile.verification_status === "verified" ? "active" : profile.verification_status }
      : null,
    location: addr?.state || addr?.city || profile?.facility_city || null,
    production_date: run?.production_date || run?.completed_at || null,
    expiry_date: context?.lot?.expiry_date || null,
  };
}

/** Assemble the nine consumer passport sections (privacy-safe). */
function buildPassport(context, verdict, scan = null) {
  const product = context?.lot?.product || null;
  const lot = context?.lot || null;
  const badgeTone = {
    VERIFIED: "success",
    EXPIRED: "warning",
    RECALLED: "danger",
    UNDER_INVESTIGATION: "warning",
    INVALID: "danger",
  }[verdict.status] || "danger";

  const passport = {
    verified: verdict.verified,
    verification_status: verdict.status,
    reason: verdict.reason,
    message: verdict.message,
    notices: verdict.notices || [],
    badge: {
      label: statusLabel(verdict.status),
      tone: badgeTone,
      icon: verdict.verified ? "verified" : verdict.status === "RECALLED" ? "recall" : verdict.status === "INVALID" ? "invalid" : "review",
    },
    product: product
      ? {
          name: product.name,
          sku: product.sku || null,
          category: product.category,
          pack_size: product.pack_size || null,
          product_code: product.code,
          lot_code: lot?.code || null,
          expiry_date: lot?.expiry_date || null,
        }
      : null,
    manufacturer: manufacturerOf(context),
    ingredients: (context?.lot?.run?.ingredients || []).map((i) => ({
      species: i.batch?.species?.common_name || null,
      quantity_kg: i.quantity_kg,
      unit: i.unit,
    })),
    origin: originOf(context),
    certificates: certificatesOf(context),
    journey: journeyOf(context),
    sustainability: sustainabilityOf(context),
    trust_score: trustScoreOf(context),
  };
  if (scan) {
    passport.scan = {
      id: scan.id,
      scanned_at: scan.scanned_at,
      device_type: scan.device_type,
      country: scan.country || null,
      state: scan.state || null,
      city: scan.city || null,
    };
  }
  return passport;
}

// ------------------------------------------------------------ scan facets

function classifyDevice(userAgent) {
  const ua = String(userAgent || "").toLowerCase();
  if (!ua) return "unknown";
  if (/(ipad|tablet|playbook|silk)/.test(ua)) return "tablet";
  if (/(mobi|iphone|android.*mobile|opera mini)/.test(ua)) return "mobile";
  return "desktop";
}

function haversineKm(aLat, aLng, bLat, bLng) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function outcomeForVerdict(verdict) {
  switch (verdict.status) {
    case "VERIFIED":
      return "success";
    case "EXPIRED":
      return "expired";
    case "not_found":
      return "not_found";
    default:
      return "invalid";
  }
}

async function openAlertCount(tokenHash, productId) {
  return prisma.counterfeitAlert.count({
    where: { status: { in: ["open", "investigating"] }, OR: [{ token_hash: tokenHash }, { product_id: productId }] },
  });
}

/** Record one consumer scan: ConsumerScan + forensic qr_scan_logs row +
 * persisted product verdict. Returns the scan row. */
async function recordScan({ tokenHash, productId, lotId, verdict, meta }) {
  // Outcome mirrors the engine verdict; unknown tokens land as INVALID with
  // `reason: not_found` (forensic detail lives on qr_scan_logs.failure_reason).
  const outcome = verdict.status;
  const scan = await prisma.consumerScan.create({
    data: {
      token_hash: tokenHash,
      product_id: productId || null,
      lot_id: lotId || null,
      outcome,
      country: meta.country || null,
      state: meta.state || null,
      city: meta.city || null,
      device_type: meta.deviceType || classifyDevice(meta.userAgent),
      ip_address: meta.ip || null,
      user_agent: meta.userAgent || null,
      scanned_at: new Date(),
    },
  });
  await prisma.qrScanLog.create({
    data: {
      target_type: "product_lot",
      target_id: lotId || null,
      purpose: "consumer_view",
      actor_user_id: null,
      device_id: meta.deviceId || null,
      ip_address: meta.ip || null,
      location: meta.location || null,
      gps_lat: meta.gpsLat ?? null,
      gps_lng: meta.gpsLng ?? null,
      outcome: outcomeForVerdict(verdict),
      failure_reason: verdict.reason || null,
    },
  });
  if (productId) {
    await prisma.product.update({
      where: { id: productId },
      data: { verification_status: verdict.status },
    });
  }
  return scan;
}

// ------------------------------------------------------------ counterfeit

async function createAlert({ tokenHash, productId, lotId, reason, severity, detail }) {
  const existing = await prisma.counterfeitAlert.findFirst({
    where: { token_hash: tokenHash, reason, status: { in: ["open", "investigating"] } },
  });
  if (existing) return null;
  return prisma.counterfeitAlert.create({
    data: {
      token_hash: tokenHash,
      product_id: productId || null,
      lot_id: lotId || null,
      reason,
      severity,
      status: "open",
      detail_json: detail || {},
      detected_at: new Date(),
    },
  });
}

/**
 * Anomaly detection — run after every recorded scan. Rules are
 * deterministic + cheap (windowed counts + GPS distance), so tests and the
 * live system agree. Deduped: one OPEN alert per (token, reason).
 */
async function detectAnomalies({ tokenHash, productId, lotId, verdict, meta, record }) {
  const created = [];
  const now = Date.now();
  const since = (ms) => new Date(now - ms);

  // 1) Post-revoke scan: a revoked/recalled/invalidated QR was presented.
  if (verdict.status === "INVALID" && record && record.status !== "active") {
    const alert = await createAlert({
      tokenHash,
      productId,
      lotId,
      reason: "revoked_token_scan",
      severity: "medium",
      detail: { token_status: record.status, reason: verdict.reason },
    });
    if (alert) created.push(alert);
  }

  // 2) Scan burst: same token scanned BURST_COUNT times in the window.
  const burst = await prisma.consumerScan.count({
    where: { token_hash: tokenHash, scanned_at: { gte: since(env.COUNTERFEIT_BURST_WINDOW_MS) } },
  });
  if (burst >= env.COUNTERFEIT_BURST_COUNT) {
    const alert = await createAlert({
      tokenHash,
      productId,
      lotId,
      reason: "scan_burst",
      severity: burst >= env.COUNTERFEIT_BURST_COUNT * 2 ? "high" : "medium",
      detail: { scans_in_window: burst, window_ms: env.COUNTERFEIT_BURST_WINDOW_MS },
    });
    if (alert) created.push(alert);
  }

  // 3) Geo velocity: the same token scanned from very far away inside the
  //    window. ConsumerScan stores only coarse geo (privacy: no raw GPS on
  //    the public table); the forensic qr_scan_logs stream does carry GPS
  //    for anomaly forensics — distance is measured across that stream.
  if (meta.gpsLat != null && meta.gpsLng != null) {
    const logs = await prisma.qrScanLog.findMany({
      where: { target_type: "product_lot", purpose: "consumer_view", target_id: lotId || null, gps_lat: { not: null }, created_at: { gte: since(env.COUNTERFEIT_GEO_WINDOW_MS) } },
      orderBy: { created_at: "desc" },
      take: 50,
    });
    let farthest = null;
    for (const log of logs) {
      const km = haversineKm(meta.gpsLat, meta.gpsLng, log.gps_lat, log.gps_lng);
      if (km > env.COUNTERFEIT_GEO_KM) {
        farthest = { km: Math.round(km), at: log.created_at };
        break;
      }
    }
    if (farthest) {
      const alert = await createAlert({
        tokenHash,
        productId,
        lotId,
        reason: "geo_velocity",
        severity: "high",
        detail: { distance_km: farthest.km, within_minutes: Math.round((now - new Date(farthest.at).getTime()) / 60000) },
      });
      if (alert) created.push(alert);
    }
  }

  // 4) Excessive daily volume for one token.
  const daily = await prisma.consumerScan.count({
    where: { token_hash: tokenHash, scanned_at: { gte: new Date(now - 86400000) } },
  });
  if (daily >= env.COUNTERFEIT_DAILY_VOLUME) {
    const alert = await createAlert({
      tokenHash,
      productId,
      lotId,
      reason: "excessive_volume",
      severity: "low",
      detail: { scans_last_24h: daily },
    });
    if (alert) created.push(alert);
  }

  // 5) Unknown-token flood: many unrecognised tokens from distinct IPs.
  if (!productId) {
    const unknown = await prisma.consumerScan.findMany({
      where: { product_id: null, scanned_at: { gte: since(60000) } },
      select: { ip_address: true },
    });
    const distinctIps = new Set(unknown.map((s) => s.ip_address || "?").filter((x) => x !== "?"));
    if (distinctIps.size >= env.COUNTERFEIT_UNKNOWN_BURST) {
      const alert = await createAlert({
        tokenHash,
        productId: null,
        lotId: null,
        reason: "unknown_token_burst",
        severity: "low",
        detail: { distinct_ips: distinctIps.size, window_ms: 60000 },
      });
      if (alert) created.push(alert);
    }
  }

  return created;
}

// ------------------------------------------------------------ main entry

/**
 * Public entry point: scan -> engine -> passport.
 *
 * `track: true` (POST /verify/scan) records the scan + runs counterfeit
 * detection + persists the verdict — the portal's tracking path.
 * `track: false` (GET passport links) is side-effect free apart from cache
 * population, so shared links / crawlers never pollute scan analytics.
 */
async function verifyByToken({ token, meta = {}, track = true }) {
  const raw = normalizeToken(token);
  if (!raw) throw new ApiError("bad_request", "token is required", 400);
  const tokenHash = hashToken(raw);

  // Fast path: unexpired cached passport (spec "Product Passport Cache").
  const cached = await prisma.productVerificationCache.findUnique({ where: { token_hash: tokenHash } });
  if (cached && cached.expires_at > new Date()) {
    if (!track) return { ...cached.passport_json };
    const verdict = { status: cached.verification_status, verified: cached.verification_status === "VERIFIED" };
    const scan = await recordScan({ tokenHash, productId: cached.product_id, lotId: cached.lot_id, verdict, meta });
    await detectAnomalies({ tokenHash, productId: cached.product_id, lotId: cached.lot_id, verdict, meta, record: null });
    return { ...cached.passport_json, scan: scanFacet(scan) };
  }

  // Slow path: resolve + compute (+ record when tracking) + cache.
  const record = await resolveContext(raw);
  const openImpacts = record?.lot?.product_id
    ? await prisma.affectedProduct.count({ where: { product_id: record.lot.product_id, status: "open" } })
    : 0;
  const openAlerts = record?.lot?.product_id
    ? await openAlertCount(tokenHash, record.lot.product_id)
    : await openAlertCount(tokenHash, null);
  const snapshotCount = record?.lot?.product_id
    ? await prisma.productLineageSnapshot.count({ where: { product_id: record.lot.product_id } })
    : 0;
  const context = record ? { ...record, snapshotCount } : null;

  const verdict = computeStatus({ record, openImpacts, openAlerts, context });
  let scan = null;
  let alertsRaised = 0;
  if (track) {
    scan = await recordScan({ tokenHash, productId: record?.lot?.product_id || null, lotId: record?.lot_id || null, verdict, meta });
  }
  const passport = buildPassport(context, verdict, scan);

  // Cache everything except INVALID/not_found (those are cheap + volatile).
  if (record && !["INVALID", "not_found"].includes(verdict.status)) {
    const { scan: _scanFacet, alerts_raised: _alerts, ...cacheable } = passport;
    await prisma.productVerificationCache.upsert({
      where: { token_hash: tokenHash },
      update: {
        verification_status: verdict.status,
        passport_json: cacheable,
        expires_at: new Date(Date.now() + env.VERIFY_CACHE_TTL_SECONDS * 1000),
      },
      create: {
        token_hash: tokenHash,
        product_id: record.lot.product_id,
        lot_id: record.lot_id,
        verification_status: verdict.status,
        passport_json: cacheable,
        expires_at: new Date(Date.now() + env.VERIFY_CACHE_TTL_SECONDS * 1000),
      },
    });
  }

  if (track) {
    const alerts = await detectAnomalies({ tokenHash, productId: record?.lot?.product_id || null, lotId: record?.lot_id || null, verdict, meta, record });
    alertsRaised = alerts.length;
  }
  return { ...passport, alerts_raised: alertsRaised };
}

function scanFacet(scan) {
  return {
    id: scan.id,
    scanned_at: scan.scanned_at,
    device_type: scan.device_type,
    country: scan.country || null,
    state: scan.state || null,
    city: scan.city || null,
  };
}

/** Public journey view (spec §7) — derived live, no scan row. */
async function journeyByToken({ token }) {
  const raw = normalizeToken(token);
  if (!raw) throw new ApiError("bad_request", "token is required", 400);
  const record = await resolveContext(raw);
  if (!record) {
    return { found: false, journey: [] };
  }
  return {
    found: true,
    product: { name: record.lot?.product?.name || null, lot_code: record.lot?.code || null },
    stages: journeyOf(record),
  };
}

/** Public certificate view (spec §6) — live cert rows, no scan row. */
async function certificateByToken({ token }) {
  const raw = normalizeToken(token);
  if (!raw) throw new ApiError("bad_request", "token is required", 400);
  const record = await resolveContext(raw);
  if (!record) {
    return { found: false, certificates: [] };
  }
  return {
    found: true,
    product: { name: record.lot?.product?.name || null, lot_code: record.lot?.code || null },
    certificates: certificatesOf(record),
    summary: {
      issued_count: record.lot?.run?.ingredients?.length || 0,
      all_pass: certificatesOf(record).every((c) => c.status === "PASS"),
    },
  };
}

// ------------------------------------------------------------ analytics

function scanWhereFor(user, extra = {}) {
  const where = { ...extra };
  if (user.role === "manufacturer") {
    where.product = { manufacturer_user_id: user.id };
  }
  return where;
}

/** Scan list (admin: all; manufacturer: own products). */
async function listScans(user, { limit = 100, offset = 0, outcome = null, product_id = null } = {}) {
  if (user.role !== "admin" && user.role !== "manufacturer") {
    throw new ApiError("forbidden", "Only AYUSH or the manufacturer can read consumer scans", 403);
  }
  const where = scanWhereFor(user);
  if (outcome) where.outcome = outcome;
  if (product_id) where.product_id = product_id;
  const [scans, total] = await Promise.all([
    prisma.consumerScan.findMany({
      where,
      orderBy: { scanned_at: "desc" },
      skip: Math.max(parseInt(offset, 10) || 0, 0),
      take: Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500),
      include: { product: { select: { id: true, code: true, name: true } }, lot: { select: { code: true } } },
    }),
    prisma.consumerScan.count({ where }),
  ]);
  return { scans, total };
}

/** AYUSH / manufacturer analytics (spec "AYUSH Visibility"). */
async function scanAnalytics(user) {
  if (user.role !== "admin" && user.role !== "manufacturer") {
    throw new ApiError("forbidden", "Only AYUSH or the manufacturer can view scan analytics", 403);
  }
  const where = scanWhereFor(user);
  const since7 = new Date(Date.now() - 7 * 86400000);
  const since30 = new Date(Date.now() - 30 * 86400000);
  const since14 = new Date(Date.now() - 14 * 86400000);

  const [total, last7d, last30d, byOutcome, byState, byDevice, trendRows, topScans, alerts] = await Promise.all([
    prisma.consumerScan.count({ where }),
    prisma.consumerScan.count({ where: { ...where, scanned_at: { gte: since7 } } }),
    prisma.consumerScan.count({ where: { ...where, scanned_at: { gte: since30 } } }),
    prisma.consumerScan.groupBy({ by: ["outcome"], where, _count: { _all: true } }),
    prisma.consumerScan.groupBy({ by: ["state", "city"], where: { ...where, state: { not: null } }, _count: { _all: true } }),
    prisma.consumerScan.groupBy({ by: ["device_type"], where, _count: { _all: true } }),
    prisma.consumerScan.findMany({
      where: { ...where, scanned_at: { gte: since14 } },
      select: { scanned_at: true },
      orderBy: { scanned_at: "asc" },
    }),
    prisma.consumerScan.groupBy({
      by: ["product_id"],
      where: { ...where, product_id: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { product_id: "desc" } },
      take: 10,
    }),
    prisma.counterfeitAlert.findMany({
      where: user.role === "manufacturer" ? { product: { manufacturer_user_id: user.id } } : {},
      orderBy: { detected_at: "desc" },
      take: 100,
      include: { product: { select: { id: true, code: true, name: true } } },
    }),
  ]);

  // Resolve product names for the top-scanned ranking.
  const topProducts = [];
  for (const row of topScans) {
    if (!row.product_id) continue;
    const p = await prisma.product.findUnique({ where: { id: row.product_id }, select: { id: true, code: true, name: true } });
    const ips = await prisma.consumerScan.groupBy({ by: ["ip_address"], where: { product_id: row.product_id, ip_address: { not: null } }, _count: { _all: true } });
    topProducts.push({ product: p || { id: row.product_id }, scan_count: row._count._all, unique_ips: ips.length });
  }

  // Daily trend buckets (last 14 days).
  const trendMap = new Map();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    trendMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of trendRows) {
    const key = row.scanned_at.toISOString().slice(0, 10);
    if (trendMap.has(key)) trendMap.set(key, trendMap.get(key) + 1);
  }

  const geo = [];
  const cityMap = new Map();
  for (const row of byState) {
    const state = row.state;
    if (!cityMap.has(state)) cityMap.set(state, { state, scans: 0, cities: [] });
    cityMap.get(state).scans += row._count._all;
    cityMap.get(state).cities.push({ city: row.city || null, scans: row._count._all });
  }
  for (const [state, bucket] of cityMap) {
    bucket.cities.sort((a, b) => b.scans - a.scans);
    geo.push(bucket);
  }
  geo.sort((a, b) => b.scans - a.scans);

  const open = alerts.filter((a) => a.status === "open");
  return {
    scans: {
      total,
      last_7d: last7d,
      last_30d: last30d,
      by_outcome: Object.fromEntries(byOutcome.map((r) => [r.outcome, r._count._all])),
    },
    most_scanned_products: topProducts,
    geo_demand: geo,
    devices: byDevice.map((r) => ({ device_type: r.device_type, scans: r._count._all })).sort((a, b) => b.scans - a.scans),
    trend: [...trendMap].map(([date, scans]) => ({ date, scans })),
    alerts: {
      open: open.length,
      total: alerts.length,
      by_severity: alerts.reduce((acc, a) => ({ ...acc, [a.severity]: (acc[a.severity] || 0) + 1 }), {}),
      recent: alerts.slice(0, 10).map((a) => ({
        id: a.id,
        product: a.product ? { code: a.product.code, name: a.product.name } : null,
        reason: a.reason,
        severity: a.severity,
        status: a.status,
        detected_at: a.detected_at,
      })),
    },
  };
}

/** Counterfeit alerts (admin: all; manufacturer: own products). */
async function listAlerts(user, { status = "open", severity = null, limit = 100, offset = 0 } = {}) {
  if (user.role !== "admin" && user.role !== "manufacturer") {
    throw new ApiError("forbidden", "Only AYUSH or the manufacturer can view counterfeit alerts", 403);
  }
  if (!ALERT_STATUSES.includes(status)) throw new ApiError("bad_request", `status must be one of: ${ALERT_STATUSES.join(", ")}`, 400);
  const where = { status };
  if (severity) {
    if (!ALERT_SEVERITIES.includes(severity)) throw new ApiError("bad_request", `severity must be one of: ${ALERT_SEVERITIES.join(", ")}`, 400);
    where.severity = severity;
  }
  if (user.role === "manufacturer") where.product = { manufacturer_user_id: user.id };
  const [alerts, total] = await Promise.all([
    prisma.counterfeitAlert.findMany({
      where,
      orderBy: { detected_at: "desc" },
      skip: Math.max(parseInt(offset, 10) || 0, 0),
      take: Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500),
      include: { product: { select: { id: true, code: true, name: true } } },
    }),
    prisma.counterfeitAlert.count({ where }),
  ]);
  return { alerts, total };
}

/** Close an alert (admin, or the manufacturer of the affected product). */
async function resolveAlert(user, { alert_id, note = null }) {
  const alert = await prisma.counterfeitAlert.findUnique({
    where: { id: alert_id },
    include: { product: true },
  });
  if (!alert) throw new ApiError("not_found", "Counterfeit alert not found", 404);
  if (user.role !== "admin" && alert.product?.manufacturer_user_id !== user.id) {
    throw new ApiError("forbidden", "You cannot resolve this alert", 403);
  }
  if (!["open", "investigating"].includes(alert.status)) {
    throw new ApiError("invalid_state", `Alert is already '${alert.status}'`, 409);
  }
  return prisma.counterfeitAlert.update({
    where: { id: alert.id },
    data: { status: "resolved", resolved_at: new Date(), resolved_by_user_id: user.id, resolution_note: note?.trim() || null },
    include: { product: { select: { id: true, code: true, name: true } } },
  });
}

// ------------------------------------------------------------ exports

module.exports = {
  normalizeToken,
  verifyByToken,
  journeyByToken,
  certificateByToken,
  listScans,
  scanAnalytics,
  listAlerts,
  resolveAlert,
  computeStatus,
  classifyDevice,
  haversineKm,
  detectAnomalies,
  ALERT_REASONS,
  ALERT_SEVERITIES,
  ALERT_STATUSES,
};