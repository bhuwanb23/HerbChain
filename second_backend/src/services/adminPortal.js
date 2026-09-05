/**
 * AYUSH Admin Portal service (docs/phase_13.md + docs/admin/architecture.md).
 *
 * The regulatory control tower. AYUSH never owns batches — it MONITORS,
 * TRACES, INVESTIGATES, AUDITS and ENFORCES. Every read here is a
 * cross-entity oversight query; every write (alert, recall, investigation,
 * report) is a regulatory action recorded in the audit log.
 *
 * Hierarchy (User.admin_role): super_admin > regulatory_officer >
 * state_officer > auditor. A legacy admin with a NULL admin_role counts as
 * super_admin. Feature gates live in the ROUTES via hasCapability; the
 * service functions take the actor for audit attribution only.
 */
const crypto = require("crypto");
const { prisma } = require("../db/client");
const { ApiError } = require("../utils/errors");
const { env } = require("../config/env");
const storage = require("./storage");
const { getLogger } = require("../config/logging");
const {
  ALERT_TYPES,
  ALERT_SEVERITIES,
  ALERT_STATUSES,
  RECALL_STATUSES,
  RECALL_REF_TYPES,
  CASE_TYPES,
  CASE_STATUSES,
  ENTITY_ROLES,
  SCORE_GRADES,
  REPORT_TYPES,
  REPORT_FORMATS,
  NOTIFICATION_TYPES,
  FAILURE_CATEGORIES,
  SHIPMENT_RISKS,
  ADMIN_TIER_CAPABILITIES,
} = require("../constants/admin");

const logger = getLogger("admin-portal");

// ------------------------------------------------------------ helpers

async function nextCode(tx, model, field, prefix) {
  const year = new Date().getFullYear();
  const pre = `${prefix}-${year}-`;
  const count = await tx[model].count({ where: { [field]: { startsWith: pre } } });
  return `${pre}${String(count + 1).padStart(6, "0")}`;
}

function daysBetween(a, b) {
  return Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));
}

const sum = (arr) => arr.reduce((s, n) => s + (n || 0), 0);

// ------------------------------------------------------------ hierarchy

/** Resolve the portal tier of an admin user (null admin_role = super). */
function resolveTier(user) {
  if (user.role !== "admin") return null;
  return user.admin_role || "super_admin";
}

/** True when the admin's tier may use `capability` (super bypasses all). */
function hasCapability(user, capability) {
  const tier = resolveTier(user);
  if (!tier) return false;
  if (tier === "super_admin") return true;
  return (ADMIN_TIER_CAPABILITIES[tier] || []).includes(capability);
}

function requireCapability(user, capability) {
  if (!hasCapability(user, capability)) {
    throw new ApiError("forbidden", `Your AYUSH role (${user.admin_role || "admin"}) cannot perform this action`, 403);
  }
}

async function writeAudit({ actorUserId, action, targetType, targetId, meta }) {
  return prisma.auditLog.create({
    data: {
      actor_user_id: actorUserId,
      action,
      target_type: targetType || null,
      target_id: targetId || null,
      meta_json: meta || {},
    },
  });
}

// ------------------------------------------------------------ dashboard

/**
 * Ecosystem health at a glance (spec "AYUSH Dashboard"): KPI cards +
 * entity widgets + compliance surface. `state` optionally scopes farmer /
 * lab / manufacturer counts to one state (State Officer view).
 */
// Rules engine cooldown: re-running every rule on every dashboard hit is
// wasteful; the `opened()` dedupe keeps repeats cheap, but we still cap the
// sweep to once a minute. Tests call runAlertRules() directly.
let lastRulesRun = 0;

async function dashboard(user, { state = null } = {}) {
  if (Date.now() - lastRulesRun > 60000) {
    lastRulesRun = Date.now();
    runAlertRules(user).catch((err) => logger.warn(`alert rules sweep failed: ${err.message}`));
  }
  const [
    farmers,
    labs,
    manufacturers,
    transporters,
    activeBatches,
    activeShipments,
    certifiedBatches,
    rejectedBatches,
    products,
    recalledProducts,
    blockchainTxns,
    pendingApprovals,
    openAlerts,
    failedCerts,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "farmer", deleted_at: null } }),
    prisma.user.count({ where: { role: "lab", deleted_at: null } }),
    prisma.user.count({ where: { role: "manufacturer", deleted_at: null } }),
    prisma.user.count({ where: { role: "transporter", deleted_at: null } }),
    prisma.batch.count({ where: { phase: { notIn: ["consumed", "archived"] } } }),
    prisma.shipment.count({ where: { status: { in: ["assigned", "accepted", "arrived_for_pickup", "picked_up", "in_transit", "arrived_destination"] } } }),
    prisma.batch.count({ where: { test_status: "certified" } }),
    prisma.batch.count({ where: { test_status: "rejected" } }),
    prisma.product.count(),
    prisma.product.count({ where: { status: "recalled" } }),
    prisma.blockchainTransaction.count(),
    prisma.verificationRequest.count({ where: { status: "pending" } }),
    prisma.complianceAlert.count({ where: { status: { in: ["open", "acknowledged"] } } }),
    prisma.rejectionRecord.count(),
  ]);

  const [farmerWidget, labWidget, manufacturerWidget, logisticsWidget] = await Promise.all([
    farmerWidgetData(state),
    labWidgetData(),
    manufacturerWidgetData(),
    logisticsWidgetData(),
  ]);

  return {
    kpis: {
      total_farmers: farmers,
      total_labs: labs,
      total_manufacturers: manufacturers,
      total_transporters: transporters,
      active_batches: activeBatches,
      active_shipments: activeShipments,
      certified_batches: certifiedBatches,
      rejected_batches: rejectedBatches,
      products_created: products,
      products_recalled: recalledProducts,
      blockchain_transactions: blockchainTxns,
      failed_certifications: failedCerts,
      pending_approvals: pendingApprovals,
      compliance_alerts: openAlerts,
    },
    widgets: { farmers: farmerWidget, labs: labWidget, manufacturers: manufacturerWidget, logistics: logisticsWidget },
    compliance_surface: {
      suspicious_activities: await prisma.complianceAlert.count({ where: { status: { in: ["open", "acknowledged"] }, severity: { in: ["HIGH", "CRITICAL"] } } }),
      certificate_expiry_soon: await prisma.certification.count({
        where: { expiry_date: { not: null, lte: new Date(Date.now() + env.CERT_EXPIRY_WARNING_DAYS * 86400000), gte: new Date() } },
      }),
    },
  };
}

async function farmerWidgetData(state = null) {
  // Farmers have no state column — scope through their registered Address.
  const stateWhere = state ? { farmer: { addresses: { some: { state } } } } : {};
  const [registered, verified, recent] = await Promise.all([
    prisma.farmerProfile.count({ where: stateWhere }),
    prisma.farmerProfile.count({ where: { ...stateWhere, farmer: { kyc_status: "verified" } } }),
    prisma.farmerProfile.count({ where: { ...stateWhere, created_at: { gte: new Date(Date.now() - 30 * 86400000) } } }),
  ]);
  return { registered, verified, new_registrations_30d: recent, state };
}

async function labWidgetData() {
  const [activeLabs, certs, failedTests, mismatchCount] = await Promise.all([
    prisma.labProfile.count({ where: { verification_status: "verified" } }),
    prisma.certification.count(),
    prisma.rejectionRecord.count(),
    prisma.speciesVerificationLog.count({ where: { status: "mismatch" } }),
  ]);
  const total = certs + failedTests;
  return {
    active_labs: activeLabs,
    certification_count: certs,
    failure_rate_pct: total ? Math.round((failedTests / total) * 1000) / 10 : 0,
    species_mismatches: mismatchCount,
  };
}

async function manufacturerWidgetData() {
  const [activeMfr, products, inventoryKg] = await Promise.all([
    prisma.manufacturerProfile.count({ where: { verification_status: "verified" } }),
    prisma.product.count(),
    prisma.inventoryItem.aggregate({ _sum: { available_quantity_kg: true } }),
  ]);
  return {
    active_manufacturers: activeMfr,
    products_created: products,
    inventory_volume_kg: Math.round((inventoryKg._sum.available_quantity_kg || 0) * 1000) / 1000,
  };
}

async function logisticsWidgetData() {
  const [inTransit, delivered, failed] = await Promise.all([
    prisma.shipment.count({ where: { status: { in: ["picked_up", "in_transit", "arrived_destination"] } } }),
    prisma.shipment.count({ where: { status: "delivered" } }),
    prisma.shipment.count({ where: { status: { in: ["failed", "rejected"] } } }),
  ]);
  return { shipments_in_transit: inTransit, successful_deliveries: delivered, delivery_failures: failed };
}

// ------------------------------------------------------------ universal search

/**
 * One search box across batches, products, users (by code/name/email),
 * shipments, certificates, species and recalls. Returns categorized hits
 * with a count per category (spec "Universal Search Engine").
 */
async function search(user, { q, state = null, district = null, radiusM = null, gpsLat = null, gpsLng = null, limit = 10 } = {}) {
  const needle = String(q || "").trim().toLowerCase();
  const take = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
  const out = { query: q, categories: {}, results: [] };
  if (!needle && !state && !district && !(radiusM && gpsLat != null && gpsLng != null)) return out;

  const fetchAll = async (fn) => {
    try {
      return await fn();
    } catch {
      return [];
    }
  };

  const [batches, products, users, shipments, certs, species, recalls] = await Promise.all([
    fetchAll(async () =>
      prisma.batch.findMany({
        where: { OR: [{ code: { contains: needle } }, { id: { startsWith: needle } }] },
        take,
        include: { species: { select: { code: true, common_name: true } } },
      })
    ),
    fetchAll(async () =>
      prisma.product.findMany({
        where: { OR: [{ code: { contains: needle } }, { name: { contains: needle } }, { sku: { contains: needle } }, { id: { startsWith: needle } }] },
        take,
      })
    ),
    fetchAll(async () =>
      prisma.user.findMany({
        where: {
          deleted_at: null,
          OR: [{ name: { contains: needle } }, { email: { contains: needle } }, { phone: { contains: needle } }],
        },
        take,
        select: { id: true, name: true, email: true, phone: true, role: true, kyc_status: true, created_at: true },
      })
    ),
    fetchAll(async () =>
      prisma.shipment.findMany({
        where: { OR: [{ shipment_no: { contains: needle } }, { id: { startsWith: needle } }] },
        take,
        include: { transporter: { select: { id: true, name: true } } },
      })
    ),
    fetchAll(async () =>
      prisma.certification.findMany({
        where: { OR: [{ certificate_number: { contains: needle } }, { id: { startsWith: needle } }] },
        take,
        include: { batch: { select: { code: true } } },
      })
    ),
    fetchAll(async () =>
      prisma.species.findMany({
        where: { OR: [{ code: { contains: needle } }, { common_name: { contains: needle } }, { scientific_name: { contains: needle } }] },
        take,
      })
    ),
    fetchAll(async () =>
      prisma.recall.findMany({
        where: { OR: [{ recall_no: { contains: needle } }, { id: { startsWith: needle } }] },
        take,
      })
    ),
  ]);

  // Geographic search: batches within a GPS radius (spec "Geographic Search").
  let geoBatches = [];
  if (radiusM && gpsLat != null && gpsLng != null) {
    const allBatches = await prisma.batch.findMany({ where: { gps_lat: { not: null }, gps_lng: { not: null } }, select: { id: true, code: true, gps_lat: true, gps_lng: true, created_at: true } });
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    geoBatches = allBatches
      .filter((b) => {
        const dLat = toRad(b.gps_lat - gpsLat);
        const dLng = toRad(b.gps_lng - gpsLng);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(gpsLat)) * Math.cos(toRad(b.gps_lat)) * Math.sin(dLng / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(a)) <= radiusM;
      })
      .slice(0, take);
  }

  if (batches.length) out.categories.batches = batches.length;
  if (products.length) out.categories.products = products.length;
  if (users.length) out.categories.users = users.length;
  if (shipments.length) out.categories.shipments = shipments.length;
  if (certs.length) out.categories.certificates = certs.length;
  if (species.length) out.categories.species = species.length;
  if (recalls.length) out.categories.recalls = recalls.length;
  if (geoBatches.length) out.categories.geo_batches = geoBatches.length;

  out.results = [
    ...batches.map((b) => ({ category: "batch", id: b.id, code: b.code, species: b.species?.common_name || b.species?.code, phase: b.phase, test_status: b.test_status })),
    ...products.map((p) => ({ category: "product", id: p.id, code: p.code, name: p.name, sku: p.sku, status: p.status })),
    ...users.map((u) => ({ category: "user", id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, kyc_status: u.kyc_status })),
    ...shipments.map((s) => ({ category: "shipment", id: s.id, shipment_no: s.shipment_no, status: s.status, transporter: s.transporter?.name, from: s.from_user_id, to: s.to_user_id })),
    ...certs.map((c) => ({ category: "certificate", id: c.id, certificate_number: c.certificate_number, batch_code: c.batch?.code, species_code: c.species_code, issued_at: c.issued_at })),
    ...species.map((s) => ({ category: "species", id: s.id, code: s.code, common_name: s.common_name })),
    ...recalls.map((r) => ({ category: "recall", id: r.id, recall_no: r.recall_no, ref_type: r.ref_type, ref_id: r.ref_id, status: r.status })),
    ...geoBatches.map((b) => ({ category: "geo_batch", id: b.id, code: b.code, gps_lat: b.gps_lat, gps_lng: b.gps_lng })),
  ].slice(0, take * 5);
  return out;
}

// ------------------------------------------------------------ traceability explorers

/**
 * Batch traceability explorer (spec "Batch Traceability Explorer"): creation,
 * ownership history, lab testing, certificates, and every finished product
 * that consumed the batch (forward trace).
 */
async function batchTraceability(user, batchId) {
  requireCapability(user, "traceability");
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      species: { select: { code: true, common_name: true, scientific_name: true } },
      farmer: { select: { id: true, name: true, email: true } },
      current_holder: { select: { id: true, name: true, role: true } },
      events: {
        orderBy: { created_at: "asc" },
        include: {
          actor: { select: { id: true, name: true, role: true } },
          from_user: { select: { id: true, name: true, role: true } },
          to_user: { select: { id: true, name: true, role: true } },
        },
      },
      certifications: { orderBy: { issued_at: "desc" } },
      rejection_records: { take: 1 },
    },
  });
  // Certifications carry plain FK issuer ids — resolve names in one pass.
  const issuerIds = [...new Set(batch.certifications.map((c) => c.issued_by_user_id).filter(Boolean))];
  const issuers = issuerIds.length
    ? await prisma.user.findMany({ where: { id: { in: issuerIds } }, select: { id: true, name: true } })
    : [];
  const issuerName = Object.fromEntries(issuers.map((u) => [u.id, u.name]));
  if (!batch) throw new ApiError("not_found", "Batch not found", 404);

  const [samples, consumedBy, affected, score] = await Promise.all([
    prisma.sampleRecord.findMany({
      where: { batch_id: batchId },
      include: { tests: { include: { results: true, reviews: true } } },
    }),
    prisma.manufacturingBatchIngredient.findMany({
      where: { batch_id: batchId },
      include: { run: { include: { product: { select: { id: true, code: true, name: true, status: true } }, lots: { select: { id: true, code: true } } } } },
    }),
    prisma.affectedProduct.findMany({ where: { batch_id: batchId }, include: { product: { select: { id: true, code: true, name: true } } } }),
    prisma.complianceScore.findUnique({ where: { entity_type_entity_id: { entity_type: "farmer", entity_id: batch.farmer_id } } }),
  ]);

  return {
    batch: {
      id: batch.id,
      code: batch.code,
      species: batch.species,
      weight_kg: batch.weight_kg,
      phase: batch.phase,
      test_status: batch.test_status,
      cultivation_type: batch.cultivation_type,
      gps: { lat: batch.gps_lat, lng: batch.gps_lng },
      harvest_date: batch.harvest_date,
      created_at: batch.created_at,
      farmer: batch.farmer,
      current_holder: batch.current_holder,
      farmer_compliance_score: score || null,
    },
    ownership_history: batch.events.map((e) => ({
      event_type: e.event_type,
      actor: e.actor,
      from: e.from_user,
      to: e.to_user,
      phase_before: e.phase_before,
      phase_after: e.phase_after,
      location: e.location,
      payload: e.payload_json,
      created_at: e.created_at,
    })),
    lab_testing: samples.map((s) => ({
      sample_code: s.sample_code,
      weight_kg: s.sample_weight_kg,
      created_at: s.created_at,
      tests: s.tests.map((t) => ({
        test_name: t.test_name,
        category: t.test_category,
        status: t.status,
        results: t.results.map((r) => ({ parameter: r.parameter_code, observed: r.observed_value, unit: r.unit, result: r.result })),
        reviews: t.reviews.map((rv) => ({ status: rv.review_status, reviewer: rv.reviewer_name })),
      })),
    })),
    certificates: batch.certifications.map((c) => ({
      certificate_number: c.certificate_number,
      lab_code: c.lab_code,
      species_code: c.species_code,
      issued_at: c.issued_at,
      expiry_date: c.expiry_date,
      issued_by: issuerName[c.issued_by_user_id] || null,
      active: !c.expiry_date || c.expiry_date > new Date(),
    })),
    rejection: batch.rejection_records[0]
      ? { reason: batch.rejection_records[0].reason, description: batch.rejection_records[0].description, action: batch.rejection_records[0].action, rejected_at: batch.rejection_records[0].rejected_at }
      : null,
    products_using_batch: consumedBy.map((i) => ({
      run: i.run?.code,
      product: i.run?.product,
      lot: i.run?.lots[0] || null,
      quantity_kg: i.quantity_kg,
    })),
    recall_impacts: affected.map((a) => ({ product: a.product, status: a.status, detected_at: a.detected_at })),
  };
}

/**
 * Product traceability explorer (spec "Product Traceability Explorer"):
 * product -> runs -> raw herb batches -> certificates -> ownership chain ->
 * farmers, reconstructed top-down on one page.
 */
async function productTraceability(user, productId) {
  requireCapability(user, "traceability");
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      manufacturer: { select: { id: true, name: true, email: true } },
      formulas: { include: { species: { select: { code: true, common_name: true } } } },
    },
  });
  if (!product) throw new ApiError("not_found", "Product not found", 404);

  const runs = await prisma.manufacturingBatch.findMany({
    where: { product_id: productId },
    orderBy: { created_at: "desc" },
    include: {
      ingredients: {
        orderBy: { position: "asc" },
        include: {
          batch: {
            include: {
              species: { select: { code: true, common_name: true } },
              farmer: { select: { id: true, name: true } },
              certifications: { orderBy: { issued_at: "desc" }, take: 1 },
              events: {
                where: { event_type: { in: ["CREATED", "TRANSFER", "LAB_CERTIFIED"] } },
                orderBy: { created_at: "asc" },
                include: {
                  actor: { select: { id: true, name: true, role: true } },
                  from_user: { select: { id: true, name: true } },
                  to_user: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
      lots: { include: { qr_token: true, holder: { select: { id: true, name: true, role: true } } } },
    },
  });

  const recall = await prisma.recall.findFirst({ where: { ref_type: "product", ref_id: productId, status: { in: ["issued", "active"] } }, orderBy: { created_at: "desc" } });
  const score = await prisma.complianceScore.findUnique({ where: { entity_type_entity_id: { entity_type: "manufacturer", entity_id: product.manufacturer_user_id } } });

  return {
    product: {
      id: product.id,
      code: product.code,
      name: product.name,
      sku: product.sku,
      category: product.category,
      pack_size: product.pack_size,
      status: product.status,
      verification_status: product.verification_status,
      manufacturer: product.manufacturer,
      manufacturer_compliance_score: score || null,
    },
    formula: product.formulas.map((f) => ({ species: f.species, standard_quantity: f.standard_quantity, unit: f.unit })),
    journey: runs.map((run) => ({
      run_code: run.code,
      status: run.status,
      planned_units: run.planned_units,
      started_at: run.started_at,
      completed_at: run.completed_at,
      lots: run.lots.map((l) => ({ code: l.code, qr_active: !!l.qr_token?.token_hash, holder: l.holder })),
      ingredients: run.ingredients.map((i) => ({
        batch: {
          code: i.batch.code,
          species: i.batch.species,
          weight_kg: i.batch.weight_kg,
          phase: i.batch.phase,
          farmer: i.batch.farmer,
          quantity_used_kg: i.quantity_kg,
          certificate: i.batch.certifications[0]
            ? { certificate_number: i.batch.certifications[0].certificate_number, issued_at: i.batch.certifications[0].issued_at, expiry_date: i.batch.certifications[0].expiry_date }
            : null,
        },
        ownership_chain: i.batch.events.map((e) => ({ event_type: e.event_type, actor: e.actor?.name, from: e.from_user?.name, to: e.to_user?.name, at: e.created_at })),
      })),
    })),
    active_recall: recall ? { recall_no: recall.recall_no, severity: recall.severity, reason: recall.reason, status: recall.status, issued_at: recall.issued_at } : null,
  };
}

// ------------------------------------------------------------ shipments + risk

/**
 * Live logistics monitoring (spec "Active Shipments Dashboard"): every
 * shipment with transporter/origin/destination/status plus computed risk
 * flags — delayed vs expected delivery, no movement for N hours, route
 * deviation (tracking point off the great-circle line), delivery failures.
 */
async function shipments(user, { status = null, risk = null, limit = 100, offset = 0 } = {}) {
  requireCapability(user, "shipments");
  const take = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500);
  const skip = Math.max(parseInt(offset, 10) || 0, 0);
  const where = { ...(status ? { status } : {}) };

  const [rows, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      orderBy: { created_at: "desc" },
      take,
      skip,
      include: {
        transporter: { select: { id: true, name: true, email: true } },
        from_user: { select: { id: true, name: true, role: true } },
        to_user: { select: { id: true, name: true, role: true } },
        tracking: { orderBy: { captured_at: "desc" }, take: 1 },
      },
    }),
    prisma.shipment.count({ where }),
  ]);

  const failedDeliveries = await prisma.failedDeliveryLog.findMany({ where: { shipment_id: { in: rows.map((r) => r.id) } } });
  const failedByShipment = failedDeliveries.reduce((m, f) => {
    (m[f.shipment_id] = m[f.shipment_id] || []).push(f);
    return m;
  }, {});

  const inMotion = rows.filter((r) => ["assigned", "accepted", "arrived_for_pickup", "picked_up", "in_transit", "arrived_destination"].includes(r.status));
  const flagged = inMotion.filter((r) => computeShipmentRisk(r) !== null).map((r) => r.id);

  const list = rows.map((r) => {
    const riskFlag = computeShipmentRisk(r);
    return {
      id: r.id,
      shipment_no: r.shipment_no,
      ref_type: r.ref_type,
      ref_id: r.ref_id,
      status: r.status,
      transporter: r.transporter?.name || null,
      origin: { user: r.from_user?.name, role: r.from_role, gps: r.origin_gps_lat != null ? [r.origin_gps_lat, r.origin_gps_lng] : null },
      destination: { user: r.to_user?.name, role: r.to_role, gps: r.destination_gps_lat != null ? [r.destination_gps_lat, r.destination_gps_lng] : null },
      current_location: r.tracking[0] ? { lat: r.tracking[0].gps_lat, lng: r.tracking[0].gps_lng, at: r.tracking[0].captured_at } : null,
      expected_delivery_at: r.expected_delivery_at,
      created_at: r.created_at,
      risk: riskFlag,
      delivery_failures: (failedByShipment[r.id] || []).map((f) => ({ reason: f.reason, at: f.created_at })),
    };
  });

  return {
    total,
    shipments: risk ? list.filter((s) => s.risk && s.risk.flag === risk) : list,
    risk_summary: SHIPMENT_RISKS.reduce((m, f) => {
      m[f] = risk ? list.filter((s) => s.risk && s.risk.flag === f).length : flagged.filter((id) => list.find((s) => s.id === id)?.risk?.flag === f).length;
      return m;
    }, {}),
  };
}

/** Delayed / inactive / route-deviation flags for one shipment (computed). */
function computeShipmentRisk(shipment) {
  if (!["assigned", "accepted", "arrived_for_pickup", "picked_up", "in_transit", "arrived_destination"].includes(shipment.status)) return null;
  const now = new Date();

  // Delayed: expected_delivery_at passed without delivery.
  if (shipment.expected_delivery_at && !shipment.delivered_at && new Date(shipment.expected_delivery_at) < now) {
    return { flag: "delayed", detail: `expected ${shipment.expected_delivery_at.toISOString()}`, since: shipment.expected_delivery_at };
  }

  const last = shipment.tracking?.[0];
  // Inactive: in transit but no tracking point in the last 24h.
  if (["picked_up", "in_transit"].includes(shipment.status) && (!last || new Date(last.captured_at) < new Date(now.getTime() - 24 * 3600000))) {
    return { flag: "inactive", detail: last ? `last movement ${last.captured_at.toISOString()}` : "no movement recorded", since: last?.captured_at || shipment.created_at };
  }

  // Route deviation: last point drifts > 150km off the origin->destination line.
  if (last && shipment.origin_gps_lat != null && shipment.destination_gps_lat != null) {
    const d = distanceToSegmentKm(
      { lat: last.gps_lat, lng: last.gps_lng },
      { lat: shipment.origin_gps_lat, lng: shipment.origin_gps_lng },
      { lat: shipment.destination_gps_lat, lng: shipment.destination_gps_lng }
    );
    if (d > 150) return { flag: "route_deviation", detail: `${Math.round(d)} km off the planned route`, since: last.captured_at };
  }
  return null;
}

function distanceKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function distanceToSegmentKm(p, a, b) {
  const ab = { x: b.lat - a.lat, y: b.lng - a.lng };
  const ap = { x: p.lat - a.lat, y: p.lng - a.lng };
  const len2 = ab.x * ab.x + ab.y * ab.y;
  let t = len2 ? (ap.x * ab.x + ap.y * ab.y) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const proj = { lat: a.lat + t * ab.x, lng: a.lng + t * ab.y };
  return distanceKm(p, proj);
}

// ------------------------------------------------------------ failed certifications

/**
 * Failed-certifications dashboard (spec): every rejected batch with farmer,
 * lab, failure reason and date; filter by reason category.
 */
async function failedCertifications(user, { category = null, state = null, limit = 100, offset = 0 } = {}) {
  requireCapability(user, "failed_certifications");
  const take = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500);
  const skip = Math.max(parseInt(offset, 10) || 0, 0);

  const reasons = await prisma.rejectionRecord.findMany({
    orderBy: { rejected_at: "desc" },
    take: 2000,
    include: { batch: { include: { farmer: { select: { id: true, name: true, email: true, addresses: { select: { state: true } } } }, species: { select: { code: true, common_name: true } } } } },
  });

  const rows = reasons
    .filter((r) => (category ? failureCategoryOf(r.reason) === category : true))
    .filter((r) => (state ? r.batch?.farmer?.addresses?.some((a) => a.state === state) : true));

  const categorized = rows
    .map((r) => ({
      batch_id: r.batch.id,
      batch_code: r.batch.code,
      species: r.batch.species?.common_name || r.batch.species?.code,
      farmer: r.batch.farmer,
      reason: r.reason,
      category: failureCategoryOf(r.reason),
      description: r.description,
      action: r.action,
      rejected_at: r.rejected_at,
    }))
    .slice(skip, skip + take);

  const byCategory = FAILURE_CATEGORIES.reduce((m, c) => {
    m[c] = rows.filter((r) => failureCategoryOf(r.reason) === c).length;
    return m;
  }, {});

  return { total: rows.length, by_category: byCategory, failed: categorized };
}

/** Map a rejection reason onto the spec filter chips. */
function failureCategoryOf(reason) {
  const r = String(reason || "").toLowerCase();
  if (/(heavy|lead|mercury|cadmium|arsenic|metal)/.test(r)) return "heavy_metals";
  if (/(microbial|coliform|salmonella|e\. coli)/.test(r)) return "microbial";
  if (/(contamin|pesticide|aflatoxin|bacteria|pathogen)/.test(r)) return "contamination";
  if (/(species|mismatch|identity)/.test(r)) return "species_mismatch";
  return "other";
}

// ------------------------------------------------------------ compliance alerts

/** List alerts (spec "Compliance Alert Center") with optional filters. */
async function listComplianceAlerts(user, { status = null, severity = null, type = null, limit = 100, offset = 0 } = {}) {
  requireCapability(user, "compliance_alerts_read");
  const take = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500);
  const skip = Math.max(parseInt(offset, 10) || 0, 0);
  const where = {
    ...(status ? { status } : {}),
    ...(severity ? { severity } : {}),
    ...(type ? { alert_type: type } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.complianceAlert.findMany({ where, orderBy: { created_at: "desc" }, take, skip }),
    prisma.complianceAlert.count({ where }),
  ]);
  const bySeverity = await prisma.complianceAlert.groupBy({ by: ["severity"], where: { status: { in: ["open", "acknowledged"] } }, _count: true });
  return { total, alerts: rows, open_by_severity: Object.fromEntries(bySeverity.map((r) => [r.severity, r._count])) };
}

/** Admin-created alert (spec "Create Alert" action). */
async function createComplianceAlert(user, { alert_type, severity = "MEDIUM", title, description = null, entity_type = null, entity_id = null }) {
  requireCapability(user, "compliance_alerts_write");
  if (!ALERT_TYPES.includes(alert_type)) throw new ApiError("validation_error", `alert_type must be one of: ${ALERT_TYPES.join(", ")}`, 400);
  if (!ALERT_SEVERITIES.includes(severity)) throw new ApiError("validation_error", `severity must be one of: ${ALERT_SEVERITIES.join(", ")}`, 400);
  if (!title) throw new ApiError("validation_error", "title is required", 400);

  const alert = await prisma.$transaction(async (tx) => {
    const row = await tx.complianceAlert.create({
      data: {
        alert_no: await nextCode(tx, "complianceAlert", "alert_no", "ALT"),
        alert_type,
        severity,
        title,
        description,
        entity_type,
        entity_id,
        status: "open",
        created_by_user_id: user.id,
      },
    });
    await tx.auditLog.create({ data: { actor_user_id: user.id, action: "ALERT_CREATED", target_type: "compliance_alert", target_id: row.id, meta_json: { alert_type, severity, title } } });
    await broadcastNotification(tx, {
      notification_type: severity === "CRITICAL" || severity === "HIGH" ? "high_severity_alert" : "system",
      severity,
      title: `Compliance alert: ${title}`,
      entity_type: "compliance_alert",
      entity_id: row.id,
    });
    return row;
  });
  return alert;
}

/** Acknowledge or resolve an alert (regulatory officer / super admin). */
async function updateComplianceAlert(user, alertId, { status = null }) {
  requireCapability(user, "compliance_alerts_write");
  if (status && !ALERT_STATUSES.includes(status)) throw new ApiError("validation_error", `status must be one of: ${ALERT_STATUSES.join(", ")}`, 400);
  const alert = await prisma.complianceAlert.findUnique({ where: { id: alertId } });
  if (!alert) throw new ApiError("not_found", "Compliance alert not found", 404);
  const next = status || (alert.status === "open" ? "acknowledged" : "resolved");
  const updated = await prisma.complianceAlert.update({
    where: { id: alertId },
    data: {
      status: next,
      resolved_by_user_id: next === "resolved" ? user.id : alert.resolved_by_user_id,
      resolved_at: next === "resolved" ? new Date() : alert.resolved_at,
    },
  });
  await writeAudit({ actorUserId: user.id, action: "ALERT_UPDATED", targetType: "compliance_alert", targetId: alertId, meta: { status: next } });
  return updated;
}

/**
 * The rules engine (spec alert catalogue): scans the live data for risk
 * patterns and upserts ComplianceAlert rows. Called on dashboard access and
 * by the tests directly. Rules:
 *  1. repeated_batch_failures — a farmer with >= 2 rejected batches
 *  2. species_fraud — species mismatch logs where AI + lab disagree
 *  3. invalid_transfer — transfer requests rejected or suspicious self-moves
 *  4. duplicate_registration — same phone on multiple active users
 *  5. suspicious_qr_scan — scan bursts / unknown-token floods
 *  6. recall_event — active recalls (mirrored alert)
 *  7. certificate_expiry — certificates expiring within the warning window
 *  8. high_lab_pass_rate — lab with >= 20 certs and 100% pass rate
 */
async function runAlertRules(user = { id: null, role: "system" }) {
  const now = new Date();
  const opened = async (tx, def) => {
    const existing = await tx.complianceAlert.findFirst({
      where: { alert_type: def.alert_type, status: { in: ["open", "acknowledged"] }, ...(def.entity_type ? { entity_type: def.entity_type, entity_id: def.entity_id } : {}) },
    });
    if (existing) return false;
    await tx.complianceAlert.create({
      data: {
        alert_no: await nextCode(tx, "complianceAlert", "alert_no", "ALT"),
        alert_type: def.alert_type,
        severity: def.severity,
        title: def.title,
        description: def.description || null,
        entity_type: def.entity_type || null,
        entity_id: def.entity_id || null,
        status: "open",
        detail_json: def.detail_json || {},
        created_by_user_id: user.id || null,
      },
    });
    return true;
  };

  let created = 0;
  await prisma.$transaction(async (tx) => {
    // 1. repeated batch failures per farmer.
    const repeatOffenders = await tx.rejectionRecord.groupBy({ by: ["batch_id"], _count: true });
    const batchesById = await tx.batch.findMany({ where: { id: { in: repeatOffenders.map((r) => r.batch_id) } }, select: { id: true, farmer_id: true } });
    const byFarmer = {};
    for (const b of batchesById) byFarmer[b.farmer_id] = (byFarmer[b.farmer_id] || 0) + 1;
    for (const [farmerId, count] of Object.entries(byFarmer)) {
      if (count >= 2) {
        const done = await opened(tx, {
          alert_type: "repeated_batch_failures",
          severity: "HIGH",
          title: `Farmer has ${count} rejected batches`,
          entity_type: "user",
          entity_id: farmerId,
          detail_json: { rejected_count: count },
        });
        if (done) created += 1;
      }
    }

    // 2. species fraud — verification logs where AI/lab disagreed.
    const mismatches = await tx.speciesVerificationLog.findMany({ where: { status: "mismatch" }, orderBy: { verified_at: "desc" }, take: 500 });
    for (const m of mismatches.slice(0, 10)) {
      const done = await opened(tx, {
        alert_type: "species_fraud",
        severity: "HIGH",
        title: `Species mismatch on batch ${m.batch_id.slice(0, 8)}`,
        entity_type: "batch",
        entity_id: m.batch_id,
        detail_json: { farmer_species: m.farmer_species, lab_species: m.lab_species, verified_at: m.verified_at },
      });
      if (done) created += 1;
    }

    // 3. invalid transfers — rejected/cancelled transfer requests.
    const badTransfers = await tx.transferRequest.count({ where: { status: { in: ["rejected", "cancelled"] } } });
    if (badTransfers >= 3) {
      const done = await opened(tx, {
        alert_type: "invalid_transfer",
        severity: "MEDIUM",
        title: `${badTransfers} rejected or cancelled transfer requests`,
        detail_json: { count: badTransfers },
      });
      if (done) created += 1;
    }

    // 4. duplicate registrations — same phone, multiple active accounts.
    const dupes = await tx.user.groupBy({ by: ["phone"], where: { phone: { not: null }, deleted_at: null }, _count: true });
    for (const d of dupes) {
      if (d.phone && d._count > 1) {
        const done = await opened(tx, {
          alert_type: "duplicate_registration",
          severity: "MEDIUM",
          title: `Phone ${d.phone} registered on ${d._count} accounts`,
          detail_json: { phone: d.phone, count: d._count },
        });
        if (done) created += 1;
      }
    }

    // 5. suspicious QR scans — invalid-token floods on the public scanner
    //    (>= 5 INVALID outcomes in 1h) or open counterfeit alerts.
    const since = new Date(now.getTime() - 3600000);
    const unknownScans = await tx.consumerScan.count({ where: { outcome: "INVALID", scanned_at: { gte: since } } });
    if (unknownScans >= 5) {
      const done = await opened(tx, {
        alert_type: "suspicious_qr_scan",
        severity: "HIGH",
        title: `${unknownScans} invalid/unknown QR scans in the last hour`,
        detail_json: { count: unknownScans, window_minutes: 60 },
      });
      if (done) created += 1;
    }

    // 6. recall events — mirror every active recall as an alert.
    const activeRecalls = await tx.recall.findMany({ where: { status: { in: ["issued", "active"] } } });
    for (const r of activeRecalls) {
      const done = await opened(tx, {
        alert_type: "recall_event",
        severity: r.severity === "critical" || r.severity === "warning" ? "HIGH" : "MEDIUM",
        title: `Recall ${r.recall_no} is ${r.status}`,
        entity_type: r.ref_type,
        entity_id: r.ref_id,
        detail_json: { recall_no: r.recall_no, reason: r.reason },
      });
      if (done) created += 1;
    }

    // 7. certificate expiry — expiring within the warning window.
    const expiring = await tx.certification.findMany({
      where: { expiry_date: { not: null, gte: now, lte: new Date(now.getTime() + env.CERT_EXPIRY_WARNING_DAYS * 86400000) } },
      take: 10,
    });
    for (const c of expiring) {
      const done = await opened(tx, {
        alert_type: "certificate_expiry",
        severity: "LOW",
        title: `Certificate ${c.certificate_number} expires ${c.expiry_date.toISOString().slice(0, 10)}`,
        entity_type: "certificate",
        entity_id: c.id,
        detail_json: { certificate_number: c.certificate_number, expiry_date: c.expiry_date },
      });
      if (done) created += 1;
    }

    // 8. high lab pass rate — labs with >= 20 certifications and no failures.
    const labCerts = await tx.certification.groupBy({ by: ["lab_user_id"], _count: true });
    const labRejections = await tx.rejectionRecord.groupBy({ by: ["rejected_by_user_id"], _count: true });
    for (const lc of labCerts) {
      const rejected = (labRejections.find((r) => r.rejected_by_user_id === lc.lab_user_id) || {})._count || 0;
      if (lc._count >= 20 && rejected === 0) {
        const done = await opened(tx, {
          alert_type: "high_lab_pass_rate",
          severity: "LOW",
          title: `Lab ${lc.lab_user_id.slice(0, 8)} has 100% pass rate (${lc._count} certifications)`,
          entity_type: "lab",
          entity_id: lc.lab_user_id,
          detail_json: { certifications: lc._count, failures: 0 },
        });
        if (done) created += 1;
      }
    }
  });

  return { created };
}

// ------------------------------------------------------------ recall center

/** List recalls (spec "Recall Management Center"). */
async function listRecalls(user, { status = null, limit = 100, offset = 0 } = {}) {
  requireCapability(user, "recalls");
  const take = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500);
  const skip = Math.max(parseInt(offset, 10) || 0, 0);
  const where = status ? { status } : {};
  const [rows, total] = await Promise.all([
    prisma.recall.findMany({
      where,
      orderBy: { created_at: "desc" },
      take,
      skip,
      include: { scopes: true },
    }),
    prisma.recall.count({ where }),
  ]);
  // Recalls carry a plain-FK creator id — resolve names in one pass.
  const creatorIds = [...new Set(rows.map((r) => r.created_by_user_id).filter(Boolean))];
  const creators = creatorIds.length ? await prisma.user.findMany({ where: { id: { in: creatorIds } }, select: { id: true, name: true } }) : [];
  const creatorName = Object.fromEntries(creators.map((u) => [u.id, u.name]));
  rows.forEach((r) => {
    r._creatorName = creatorName[r.created_by_user_id] || null;
  });
  return { total, recalls: rows };
}

/**
 * Issue a regulatory recall (spec "Admin Actions → Issue Recall").
 *
 * For a BATCH recall the system auto-discovers the blast radius: every
 * manufacturing run that consumed the batch -> finished products + lots ->
 * AffectedProduct rows (deduped) -> Product.verification_status = RECALLED
 * (so the public passport flips) + the verification cache is purged so no
 * stale VERIFIED passport can be served. For a PRODUCT recall the product
 * itself + all its lots are flagged. Everything lands in one transaction
 * with a recall_event alert + an AYUSH notification + audit rows.
 */
async function issueRecall(user, { ref_type, ref_id, reason, severity = "warning", notes = null }) {
  requireCapability(user, "recalls");
  if (!RECALL_REF_TYPES.includes(ref_type)) throw new ApiError("validation_error", `ref_type must be one of: ${RECALL_REF_TYPES.join(", ")}`, 400);
  if (!reason) throw new ApiError("validation_error", "reason is required", 400);
  // The recalled entity must exist (batch, product or lot).
  if (ref_type === "batch") {
    if (!(await prisma.batch.findUnique({ where: { id: ref_id }, select: { id: true } }))) throw new ApiError("not_found", "Batch not found", 404);
  } else if (ref_type === "product") {
    if (!(await prisma.product.findUnique({ where: { id: ref_id }, select: { id: true } }))) throw new ApiError("not_found", "Product not found", 404);
  } else {
    if (!(await prisma.productLot.findUnique({ where: { id: ref_id }, select: { id: true } }))) throw new ApiError("not_found", "Product lot not found", 404);
  }

  const result = await prisma.$transaction(async (tx) => {
    const recall = await tx.recall.create({
      data: {
        recall_no: await nextCode(tx, "recall", "recall_no", "REC"),
        ref_type,
        ref_id,
        severity,
        reason,
        status: "issued",
        issued_at: new Date(),
        notes,
        created_by_user_id: user.id,
      },
    });

    const affected = [];
    if (ref_type === "batch") {
      const ingredients = await tx.manufacturingBatchIngredient.findMany({
        where: { batch_id: ref_id },
        include: { run: { include: { product: { select: { id: true, code: true, name: true } }, lots: { select: { id: true, code: true } } } } },
      });
      for (const ing of ingredients) {
        const product = ing.run?.product;
        if (!product) continue;
        const existing = await tx.affectedProduct.findFirst({ where: { batch_id: ref_id, product_id: product.id, manufacturing_batch_id: ing.manufacturing_batch_id } });
        const affectedRow = existing
          ? await tx.affectedProduct.update({
              where: { id: existing.id },
              data: { status: "open", notes: notes || existing.notes, detected_by_user_id: user.id },
            })
          : await tx.affectedProduct.create({
              data: {
                batch_id: ref_id,
                product_id: product.id,
                manufacturing_batch_id: ing.manufacturing_batch_id,
                lot_id: ing.run?.lots[0]?.id || null,
                impact_type: "regulatory",
                status: "open",
                notes,
                detected_by_user_id: user.id,
              },
            });
        affected.push(affectedRow);

        const lot = ing.run?.lots[0];
        await tx.recallScope.upsert({
          where: { recall_id_scope_type_scope_id: { recall_id: recall.id, scope_type: "product", scope_id: product.id } },
          update: {},
          create: { recall_id: recall.id, scope_type: "product", scope_id: product.id, note: "auto-scoped from batch recall" },
        });
        if (lot) {
          await tx.recallScope.upsert({
            where: { recall_id_scope_type_scope_id: { recall_id: recall.id, scope_type: "product_lot", scope_id: lot.id } },
            update: {},
            create: { recall_id: recall.id, scope_type: "product_lot", scope_id: lot.id, note: "auto-scoped from batch recall" },
          });
        }
        await tx.product.update({
          where: { id: product.id },
          data: { status: "recalled", verification_status: "RECALLED" },
        });
        await tx.productVerificationCache.deleteMany({ where: { product_id: product.id } });
        if (lot) {
          await tx.productLotEvent.create({
            data: { lot_id: lot.id, event_type: "RECALLED", actor_user_id: user.id, payload_json: { recall_no: recall.recall_no, reason } },
          });
        }
      }
    } else if (ref_type === "product") {
      const product = await tx.product.findUnique({ where: { id: ref_id } });
      if (!product) throw new ApiError("not_found", "Product not found", 404);
      await tx.recallScope.create({ data: { recall_id: recall.id, scope_type: "product", scope_id: ref_id, note: notes } });
      await tx.product.update({ where: { id: ref_id }, data: { status: "recalled", verification_status: "RECALLED" } });
      await tx.productVerificationCache.deleteMany({ where: { product_id: ref_id } });
    }

    // Mirror as a compliance alert + notify AYUSH + audit.
    const alertNo = await nextCode(tx, "complianceAlert", "alert_no", "ALT");
    await tx.complianceAlert.create({
      data: {
        alert_no: alertNo,
        alert_type: "recall_event",
        severity: severity === "critical" ? "CRITICAL" : severity === "warning" ? "HIGH" : "MEDIUM",
        title: `Recall ${recall.recall_no} issued — ${reason}`,
        entity_type: ref_type,
        entity_id: ref_id,
        status: "open",
        created_by_user_id: user.id,
      },
    });
    await broadcastNotification(tx, {
      notification_type: "recall_event",
      severity: severity === "critical" ? "CRITICAL" : "HIGH",
      title: `Recall ${recall.recall_no} issued`,
      body: reason,
      entity_type: ref_type,
      entity_id: ref_id,
    });
    await tx.auditLog.create({
      data: { actor_user_id: user.id, action: "RECALL_ISSUED", target_type: "recall", target_id: recall.id, meta_json: { ref_type, ref_id, reason, affected_products: affected.length, severity } },
    });

    return { recall, affected };
  });

  return { recall: result.recall, affected_products: result.affected, affected_count: result.affected.length };
}

/** Resolve / close a recall once the impact is cleared. */
async function updateRecall(user, recallId, { status = null }) {
  requireCapability(user, "recalls");
  if (status && !RECALL_STATUSES.includes(status)) throw new ApiError("validation_error", `status must be one of: ${RECALL_STATUSES.join(", ")}`, 400);
  const recall = await prisma.recall.findUnique({ where: { id: recallId } });
  if (!recall) throw new ApiError("not_found", "Recall not found", 404);
  const next = status || (recall.status === "issued" ? "active" : "resolved");
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.recall.update({
      where: { id: recallId },
      data: { status: next, resolved_at: next === "resolved" || next === "closed" ? new Date() : recall.resolved_at },
    });
    // Resolving a batch recall clears the open affected-product rows.
    if (recall.ref_type === "batch" && (next === "resolved" || next === "closed")) {
      await tx.affectedProduct.updateMany({ where: { batch_id: recall.ref_id, status: "open" }, data: { status: "resolved", resolved_at: new Date() } });
    }
    await tx.auditLog.create({ data: { actor_user_id: user.id, action: "RECALL_UPDATED", target_type: "recall", target_id: recallId, meta_json: { status: next } } });
    return row;
  });
  return updated;
}

// ------------------------------------------------------------ investigations

/** Open an investigation case with its involved entities (spec "Investigation Module"). */
async function createInvestigation(user, { title, case_type = "complaint", severity = "MEDIUM", summary = null, assigned_to_user_id = null, entities = [] }) {
  requireCapability(user, "investigations");
  if (!title) throw new ApiError("validation_error", "title is required", 400);
  if (!CASE_TYPES.includes(case_type)) throw new ApiError("validation_error", `case_type must be one of: ${CASE_TYPES.join(", ")}`, 400);
  if (entities.some((e) => !ENTITY_ROLES.includes(e.role || "subject"))) throw new ApiError("validation_error", `entity role must be one of: ${ENTITY_ROLES.join(", ")}`, 400);

  const caseRow = await prisma.$transaction(async (tx) => {
    const row = await tx.investigationCase.create({
      data: {
        case_no: await nextCode(tx, "investigationCase", "case_no", "INV"),
        title,
        case_type,
        severity,
        status: "open",
        summary,
        assigned_to_user_id,
        created_by_user_id: user.id,
        entities: {
          create: entities.map((e) => ({ entity_type: e.entity_type, entity_id: e.entity_id, role: e.role || "subject", note: e.note || null })),
        },
      },
    });
    await tx.auditLog.create({ data: { actor_user_id: user.id, action: "INVESTIGATION_OPENED", target_type: "investigation_case", target_id: row.id, meta_json: { case_type, title } } });
    return row;
  });
  return prisma.investigationCase.findUnique({ where: { id: caseRow.id }, include: { entities: true } });
}

async function listInvestigations(user, { status = null, case_type = null, limit = 100, offset = 0 } = {}) {
  requireCapability(user, "investigations");
  const take = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500);
  const skip = Math.max(parseInt(offset, 10) || 0, 0);
  const where = { ...(status ? { status } : {}), ...(case_type ? { case_type } : {}) };
  const [rows, total] = await Promise.all([
    prisma.investigationCase.findMany({
      where,
      orderBy: { opened_at: "desc" },
      take,
      skip,
      include: { entities: true },
    }),
    prisma.investigationCase.count({ where }),
  ]);
  // Plain-FK officer ids — resolve names in one pass.
  const userIds = [...new Set(rows.flatMap((r) => [r.assigned_to_user_id, r.created_by_user_id]).filter(Boolean))];
  const users = userIds.length ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } }) : [];
  const nameOf = Object.fromEntries(users.map((u) => [u.id, u.name]));
  return {
    total,
    investigations: rows.map((r) => ({ ...r, assignee: r.assigned_to_user_id ? nameOf[r.assigned_to_user_id] : null, creator: r.created_by_user_id ? nameOf[r.created_by_user_id] : null })),
  };
}

async function getInvestigation(user, caseId) {
  requireCapability(user, "investigations");
  const row = await prisma.investigationCase.findUnique({ where: { id: caseId }, include: { entities: true } });
  if (!row) throw new ApiError("not_found", "Investigation case not found", 404);
  const users = await prisma.user.findMany({ where: { id: { in: [row.assigned_to_user_id, row.created_by_user_id].filter(Boolean) } }, select: { id: true, name: true, email: true } });
  const byId = Object.fromEntries(users.map((u) => [u.id, u]));
  return { ...row, assignee: row.assigned_to_user_id ? byId[row.assigned_to_user_id] : null, creator: row.created_by_user_id ? byId[row.created_by_user_id] : null };
}

async function updateInvestigation(user, caseId, { status = null, summary = null, assigned_to_user_id = null }) {
  requireCapability(user, "investigations");
  if (status && !CASE_STATUSES.includes(status)) throw new ApiError("validation_error", `status must be one of: ${CASE_STATUSES.join(", ")}`, 400);
  const row = await prisma.investigationCase.findUnique({ where: { id: caseId } });
  if (!row) throw new ApiError("not_found", "Investigation case not found", 404);
  const updated = await prisma.investigationCase.update({
    where: { id: caseId },
    data: {
      status: status || row.status,
      summary: summary !== undefined ? summary : row.summary,
      assigned_to_user_id: assigned_to_user_id !== undefined ? assigned_to_user_id : row.assigned_to_user_id,
      closed_at: status === "closed" ? new Date() : row.closed_at,
    },
  });
  await writeAudit({ actorUserId: user.id, action: "INVESTIGATION_UPDATED", targetType: "investigation_case", targetId: caseId, meta: { status: status || row.status } });
  return updated;
}

// ------------------------------------------------------------ compliance scores

/**
 * Compliance score engine (spec "Compliance Score Engine"): entity-level
 * 0-100 score from certification success, mismatches, violations, recalls
 * and timeliness. Farmers: rejected batches + species mismatches + alerts.
 * Labs: failure rate + mismatches + suspicious alerts. Manufacturers:
 * recalls + verification. Transporters: delivery failures + delays.
 */
async function computeScores(user, { entity_type = null } = {}) {
  requireCapability(user, "scores");
  const types = entity_type ? [entity_type] : ["farmer", "lab", "manufacturer", "transporter"];
  const now = new Date();
  const results = [];

  for (const type of types) {
    if (type === "farmer") {
      const farmers = await prisma.user.findMany({ where: { role: "farmer", deleted_at: null }, select: { id: true, name: true } });
      for (const f of farmers) {
        const [rejected, mismatches, alerts, batches] = await Promise.all([
          prisma.batch.count({ where: { farmer_id: f.id, test_status: "rejected" } }),
          prisma.speciesVerificationLog.count({ where: { batch: { farmer_id: f.id }, status: "mismatch" } }),
          prisma.complianceAlert.count({ where: { entity_type: "user", entity_id: f.id, status: { in: ["open", "acknowledged"] } } }),
          prisma.batch.count({ where: { farmer_id: f.id } }),
        ]);
        const score = Math.max(0, 100 - rejected * 15 - mismatches * 10 - alerts * 8 - (batches === 0 ? 10 : 0));
        results.push(await upsertScore(f.id, "farmer", score, { rejected, mismatches, alerts, batches }));
      }
    } else if (type === "lab") {
      const labs = await prisma.user.findMany({ where: { role: "lab", deleted_at: null }, select: { id: true, name: true } });
      for (const l of labs) {
        const [certs, failed, mismatches, alerts] = await Promise.all([
          prisma.certification.count({ where: { lab_user_id: l.id } }),
          prisma.rejectionRecord.count({ where: { rejected_by_user_id: l.id } }),
          prisma.speciesVerificationLog.count({ where: { lab_species_id: l.id, status: "mismatch" } }),
          prisma.complianceAlert.count({ where: { entity_type: "lab", entity_id: l.id, status: { in: ["open", "acknowledged"] } } }),
        ]);
        const total = certs + failed;
        const failRate = total ? failed / total : 0;
        const score = Math.max(0, Math.round(100 - failRate * 200 - mismatches * 12 - alerts * 8));
        results.push(await upsertScore(l.id, "lab", score, { certifications: certs, failures: failed, failure_rate_pct: Math.round(failRate * 1000) / 10, mismatches, alerts }));
      }
    } else if (type === "manufacturer") {
      const mfrs = await prisma.user.findMany({ where: { role: "manufacturer", deleted_at: null }, select: { id: true, name: true } });
      for (const m of mfrs) {
        const [recalls, products, alerts] = await Promise.all([
          prisma.recall.count({ where: { created_by_user_id: m.id, status: { in: ["issued", "active"] } } }),
          prisma.product.count({ where: { manufacturer_user_id: m.id } }),
          prisma.complianceAlert.count({ where: { entity_type: "user", entity_id: m.id, status: { in: ["open", "acknowledged"] } } }),
        ]);
        const affected = await prisma.affectedProduct.count({ where: { product: { manufacturer_user_id: m.id }, status: "open" } });
        const score = Math.max(0, 100 - recalls * 20 - affected * 10 - alerts * 6);
        results.push(await upsertScore(m.id, "manufacturer", score, { active_recalls: recalls, products, open_impacts: affected, alerts }));
      }
    } else if (type === "transporter") {
      const tps = await prisma.user.findMany({ where: { role: "transporter", deleted_at: null }, select: { id: true, name: true } });
      for (const t of tps) {
        const [delivered, failed, delayed] = await Promise.all([
          prisma.shipment.count({ where: { assigned_transporter_user_id: t.id, status: "delivered" } }),
          prisma.shipment.count({ where: { assigned_transporter_user_id: t.id, status: { in: ["failed", "rejected"] } } }),
          prisma.shipment.count({ where: { assigned_transporter_user_id: t.id, expected_delivery_at: { lte: now }, delivered_at: null, status: { in: ["assigned", "accepted", "arrived_for_pickup", "picked_up", "in_transit", "arrived_destination"] } } }),
        ]);
        const total = delivered + failed;
        const score = Math.max(0, 100 - failed * 20 - delayed * 8 - (total === 0 ? 10 : 0));
        results.push(await upsertScore(t.id, "transporter", score, { delivered, failures: failed, delayed, total_jobs: total }));
      }
    }
  }
  return { computed: results.length, scores: results };
}

async function upsertScore(entityId, entityType, score, factors) {
  const grade = Object.entries(SCORE_GRADES).sort((a, b) => b[1] - a[1]).find(([, min]) => score >= min)?.[0] || "D";
  return prisma.complianceScore.upsert({
    where: { entity_type_entity_id: { entity_type: entityType, entity_id: entityId } },
    update: { score, grade, factors_json: factors, computed_at: new Date() },
    create: { entity_type: entityType, entity_id: entityId, score, grade, factors_json: factors },
  });
}

async function listScores(user, { entity_type = null, limit = 200, offset = 0 } = {}) {
  requireCapability(user, "scores");
  const take = Math.min(Math.max(parseInt(limit, 10) || 200, 1), 500);
  const skip = Math.max(parseInt(offset, 10) || 0, 0);
  const where = entity_type ? { entity_type } : {};
  const [rows, total] = await Promise.all([
    prisma.complianceScore.findMany({ where, orderBy: { score: "asc" }, take, skip }),
    prisma.complianceScore.count({ where }),
  ]);
  return { total, scores: rows };
}

// ------------------------------------------------------------ notifications

/** AYUSH notification feed (broadcast rows surface for every admin). */
async function listNotifications(user, { unread_only = false, limit = 100 } = {}) {
  const take = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500);
  const where = { OR: [{ recipient_user_id: null }, { recipient_user_id: user.id }], ...(unread_only ? { is_read: false } : {}) };
  const [rows, total] = await Promise.all([
    prisma.adminNotification.findMany({ where, orderBy: { created_at: "desc" }, take }),
    prisma.adminNotification.count({ where }),
  ]);
  const unread = await prisma.adminNotification.count({ where: { ...where, is_read: false } });
  return { total, unread, notifications: rows };
}

async function markNotificationRead(user, notificationId) {
  const row = await prisma.adminNotification.findUnique({ where: { id: notificationId } });
  if (!row) throw new ApiError("not_found", "Notification not found", 404);
  return prisma.adminNotification.update({ where: { id: notificationId }, data: { is_read: true } });
}

/** Broadcast (recipient null) — callable inside tx (tx.broadcastNotification). */
async function broadcastNotification(tx, { notification_type, severity = "INFO", title, body = null, entity_type = null, entity_id = null }) {
  return tx.adminNotification.create({
    data: { notification_type, severity, title, body, entity_type, entity_id, recipient_user_id: null },
  });
}

// ------------------------------------------------------------ reports

/**
 * Export a regulatory report (spec "Analytics & Reporting"). CSV is
 * generated live and stored through the storage driver; pdf/excel are
 * recorded as export jobs (status queued) — the CSV is the concrete
 * deliverable of this phase, the other formats are pipeline slots.
 */
async function exportReport(user, { report_type, format = "csv", params = {} }) {
  requireCapability(user, "reports");
  if (!REPORT_TYPES.includes(report_type)) throw new ApiError("validation_error", `report_type must be one of: ${REPORT_TYPES.join(", ")}`, 400);
  if (!REPORT_FORMATS.includes(format)) throw new ApiError("validation_error", `format must be one of: ${REPORT_FORMATS.join(", ")}`, 400);

  const { headers, rows } = await buildReportRows(report_type, params);

  if (format !== "csv") {
    // Non-CSV formats are recorded as queued export jobs (pipeline slot).
    const job = await prisma.reportExport.create({
      data: { report_type, format, title: `${report_type} (${format})`, params_json: params, status: "queued", requested_by_user_id: user.id },
    });
    await writeAudit({ actorUserId: user.id, action: "REPORT_EXPORTED", targetType: "report_export", targetId: job.id, meta: { report_type, format, row_count: rows.length } });
    return { report: job, download_url: null, row_count: rows.length };
  }

  const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const key = `report-${report_type}-${Date.now()}.csv`;
  await storage.put(key, Buffer.from(csv));
  const report = await prisma.reportExport.create({
    data: {
      report_type,
      format,
      title: report_type,
      params_json: params,
      status: "ready",
      file_url: storage.urlFor(key),
      row_count: rows.length,
      requested_by_user_id: user.id,
      completed_at: new Date(),
    },
  });
  await writeAudit({ actorUserId: user.id, action: "REPORT_EXPORTED", targetType: "report_export", targetId: report.id, meta: { report_type, format, row_count: rows.length } });
  return { report, download_url: report.file_url, row_count: rows.length };
}

async function buildReportRows(reportType, params) {
  if (reportType === "farmer_registrations") {
    const farmers = await prisma.farmerProfile.findMany({ include: { farmer: { select: { name: true, email: true, created_at: true, kyc_status: true } } } });
    return {
      headers: ["farmer_code", "name", "email", "state", "district", "status", "registered_at"],
      rows: farmers.map((f) => [f.farmer_code, f.farmer?.name, f.farmer?.email, f.state || "", f.district || "", f.farmer?.kyc_status, f.farmer?.created_at?.toISOString()]),
    };
  }
  if (reportType === "certification_trends") {
    const certs = await prisma.certification.findMany({ orderBy: { issued_at: "asc" }, include: { batch: { select: { code: true } } } });
    return {
      headers: ["certificate_number", "batch_code", "species_code", "lab_code", "issued_at", "expiry_date"],
      rows: certs.map((c) => [c.certificate_number, c.batch?.code, c.species_code, c.lab_code || "", c.issued_at.toISOString(), c.expiry_date?.toISOString() || ""]),
    };
  }
  if (reportType === "failed_tests") {
    const rejs = await prisma.rejectionRecord.findMany({ orderBy: { rejected_at: "desc" }, include: { batch: { select: { code: true } } } });
    return {
      headers: ["batch_code", "reason", "description", "action", "rejected_at"],
      rows: rejs.map((r) => [r.batch?.code, r.reason, r.description || "", r.action, r.rejected_at.toISOString()]),
    };
  }
  if (reportType === "popular_herbs") {
    const bySpecies = await prisma.batch.groupBy({ by: ["species_id"], _count: true, _sum: { weight_kg: true } });
    const species = await prisma.species.findMany({ where: { id: { in: bySpecies.map((s) => s.species_id) } }, select: { id: true, code: true, common_name: true } });
    const byId = Object.fromEntries(species.map((s) => [s.id, s]));
    return {
      headers: ["species_code", "common_name", "batches", "total_kg"],
      rows: bySpecies
        .sort((a, b) => b._count - a._count)
        .map((s) => [byId[s.species_id]?.code, byId[s.species_id]?.common_name, s._count, s._sum.weight_kg || 0]),
    };
  }
  if (reportType === "manufacturing_trends") {
    const runs = await prisma.manufacturingBatch.findMany({ orderBy: { created_at: "asc" }, include: { product: { select: { code: true, name: true } } } });
    return {
      headers: ["run_code", "product_code", "product_name", "status", "planned_units", "completed_at"],
      rows: runs.map((r) => [r.code, r.product?.code, r.product?.name, r.status, r.planned_units, r.completed_at?.toISOString() || ""]),
    };
  }
  // shipment_performance
  const ships = await prisma.shipment.findMany({ orderBy: { created_at: "asc" }, include: { transporter: { select: { name: true } } } });
  return {
    headers: ["shipment_no", "type", "status", "transporter", "expected_delivery_at", "delivered_at", "failure_reason"],
    rows: ships.map((s) => [s.shipment_no, s.shipment_type, s.status, s.transporter?.name || "", s.expected_delivery_at?.toISOString() || "", s.delivered_at?.toISOString() || "", s.failure_reason || ""]),
  };
}

async function listReports(user, { limit = 100 } = {}) {
  const take = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500);
  const rows = await prisma.reportExport.findMany({ where: { requested_by_user_id: user.id }, orderBy: { created_at: "desc" }, take });
  return { reports: rows };
}

// ------------------------------------------------------------ map + audit

/** Ecosystem map (spec): farm plots, labs, manufacturers + shipment routes. */
async function mapData(user) {
  requireCapability(user, "map");
  const [farms, labs, manufacturers, routes] = await Promise.all([
    prisma.farmPlot.findMany({
      where: { gps_lat: { not: null }, gps_lng: { not: null } },
      select: { id: true, name: true, gps_lat: true, gps_lng: true, profile: { select: { farmer_id: true } } },
    }),
    prisma.user.findMany({ where: { role: "lab", deleted_at: null }, select: { id: true, name: true, lab_profile: { select: { lab_code: true } } } }),
    prisma.user.findMany({ where: { role: "manufacturer", deleted_at: null }, select: { id: true, name: true } }),    prisma.shipment.findMany({
      where: { status: { in: ["picked_up", "in_transit", "arrived_destination", "delivered", "completed"] } },
      select: { id: true, shipment_no: true, origin_gps_lat: true, origin_gps_lng: true, destination_gps_lat: true, destination_gps_lng: true, status: true, tracking: { orderBy: { captured_at: "asc" }, take: 200, select: { gps_lat: true, gps_lng: true } } },
    }),
  ]);
  return {
    farms: farms.map((f) => ({ id: f.id, name: f.name, farmer_id: f.profile?.farmer_id, lat: f.gps_lat, lng: f.gps_lng })),
    labs: labs.map((l) => ({ id: l.id, name: l.name, code: l.lab_profile?.lab_code, kind: "lab" })),
    manufacturers: manufacturers.map((m) => ({ id: m.id, name: m.name, kind: "manufacturer" })),
    routes: routes.map((r) => {
      // GPS may live on the tracking breadcrumbs rather than the row —
      // derive the ends from the path when the columns are empty.
      const path = r.tracking.map((p) => [p.gps_lat, p.gps_lng]);
      const origin = r.origin_gps_lat != null ? [r.origin_gps_lat, r.origin_gps_lng] : path[0] || null;
      const destination = r.destination_gps_lat != null ? [r.destination_gps_lat, r.destination_gps_lng] : path[path.length - 1] || null;
      return { id: r.id, shipment_no: r.shipment_no, status: r.status, origin, destination, path };
    }),
  };
}

/** AYUSH audit trail — every admin action, filtered (spec "Audit Logs Dashboard"). */
async function auditView(user, { action = null, target_type = null, limit = 100, offset = 0 } = {}) {
  requireCapability(user, "audit");
  const take = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500);
  const skip = Math.max(parseInt(offset, 10) || 0, 0);
  const where = { ...(action ? { action } : {}), ...(target_type ? { target_type } : {}) };
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { created_at: "desc" }, take, skip, include: { actor: { select: { id: true, name: true, role: true } } } }),
    prisma.auditLog.count({ where }),
  ]);
  return { total, logs: rows.map((r) => ({ id: r.id, action: r.action, actor: r.actor, target_type: r.target_type, target_id: r.target_id, meta: r.meta_json, created_at: r.created_at })) };
}

// ------------------------------------------------------------ exports

module.exports = {
  // hierarchy
  resolveTier,
  hasCapability,
  requireCapability,
  // dashboard + search
  dashboard,
  search,
  // traceability
  batchTraceability,
  productTraceability,
  // logistics
  shipments,
  computeShipmentRisk,
  // quality + compliance
  failedCertifications,
  listComplianceAlerts,
  createComplianceAlert,
  updateComplianceAlert,
  runAlertRules,
  // recalls
  listRecalls,
  issueRecall,
  updateRecall,
  // investigations
  createInvestigation,
  listInvestigations,
  getInvestigation,
  updateInvestigation,
  // scores
  computeScores,
  listScores,
  // notifications
  listNotifications,
  markNotificationRead,
  broadcastNotification,
  // reports
  exportReport,
  listReports,
  // map + audit
  mapData,
  auditView,
  // internals (tests)
  failureCategoryOf,
  nextCode,
};