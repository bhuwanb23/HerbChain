/**
 * Traceability service — port of services/traceability_service.py.
 *
 * Builds the consumer-facing journey timeline from the append-only
 * BatchEvent log, joining Herb, BatchState, LabReport, Product,
 * ProductBatchLink and User into a single self-contained JSON object.
 */
const { prisma } = require("../db/client");
const { serializeHerb, serializeState, serializeLabReport } = require("../serializers");

const EVENT_LABELS = {
  CREATED: "Harvested by farmer",
  TRANSFER: "Custody changed",
  LAB_REPORT: "Lab report filed",
  PRODUCT_LINK: "Used in a product",
  INTENT_LAB_REQUEST: "Lab requested testing",
  INTENT_MANUFACTURER_ORDER: "Manufacturer placed order",
};

function userSummary(user) {
  if (!user) return null;
  return {
    user_id: user.user_id,
    role: user.role,
    name: user.name,
    location: user.location,
  };
}

async function buildBatchJourney(batchId) {
  const herb = await prisma.herb.findUnique({ where: { batch_id: batchId } });
  if (!herb) return null;

  const state = await prisma.batchState.findUnique({ where: { batch_id: batchId } });
  const [farmer, currentHolder] = await Promise.all([
    prisma.user.findUnique({ where: { user_id: herb.farmer_id } }),
    state ? prisma.user.findUnique({ where: { user_id: state.current_holder_id } }) : null,
  ]);

  const events = await prisma.batchEvent.findMany({
    where: { batch_id: batchId },
    orderBy: { created_at: "asc" },
  });

  const reports = await prisma.labReport.findMany({ where: { batch_id: batchId } });
  const reportsById = new Map(reports.map((r) => [r.report_id, serializeLabReport(r)]));

  const productLinks = await prisma.productBatchLink.findMany({ where: { batch_id: batchId } });
  const products = [];
  if (productLinks.length > 0) {
    const productRows = await prisma.product.findMany({
      where: { product_id: { in: productLinks.map((l) => l.product_id) } },
    });
    const productById = new Map(productRows.map((p) => [p.product_id, p]));
    for (const link of productLinks) {
      const product = productById.get(link.product_id);
      if (!product) continue;
      products.push({
        product_id: product.product_id,
        manufacturer_id: product.manufacturer_id,
        name: product.name,
        sku: product.sku,
        description: product.description,
        image_url: product.image_url,
        created_at: product.created_at ? product.created_at.toISOString().replace("Z", "") : null,
        updated_at: product.updated_at ? product.updated_at.toISOString().replace("Z", "") : null,
        quantity_kg: link.quantity_kg != null ? Number(link.quantity_kg) : null,
      });
    }
  }

  // Load users referenced by events once
  const userIds = new Set();
  for (const ev of events) {
    if (ev.actor_id) userIds.add(ev.actor_id);
    if (ev.from_party_id) userIds.add(ev.from_party_id);
    if (ev.to_party_id) userIds.add(ev.to_party_id);
  }
  const users = {};
  if (userIds.size > 0) {
    const found = await prisma.user.findMany({ where: { user_id: { in: [...userIds] } } });
    for (const u of found) users[u.user_id] = u;
  }

  const timeline = [];
  let totalDistanceKm = 0.0;
  for (let idx = 0; idx < events.length; idx += 1) {
    const ev = events[idx];
    const step = {
      step: idx + 1,
      event_id: ev.event_id,
      event_type: ev.event_type,
      label: EVENT_LABELS[ev.event_type] || ev.event_type,
      occurred_at: ev.created_at ? ev.created_at.toISOString().replace("Z", "") : null,
      actor: userSummary(users[ev.actor_id]),
      from_party: ev.from_party_id ? userSummary(users[ev.from_party_id]) : null,
      to_party: ev.to_party_id ? userSummary(users[ev.to_party_id]) : null,
      phase_before: ev.phase_before,
      phase_after: ev.phase_after,
      location: ev.location,
      gps_lat: ev.gps_lat,
      gps_lng: ev.gps_lng,
      payload: ev.payload_json,
    };

    if (ev.payload_json && typeof ev.payload_json === "object") {
      const distance = ev.payload_json.distance_km;
      if (typeof distance === "number") totalDistanceKm += distance;
    }

    if (ev.event_type === "LAB_REPORT" && ev.payload_json) {
      const reportId = ev.payload_json.report_id;
      if (reportId && reportsById.has(reportId)) {
        step.lab_report = reportsById.get(reportId);
      }
    }

    timeline.push(step);
  }

  const createdAt = herb.created_at || new Date();
  const totalDays = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 86400000));

  return {
    batch_id: batchId,
    herb: serializeHerb(herb),
    state: serializeState(state),
    farmer: userSummary(farmer),
    current_holder: userSummary(currentHolder),
    journey: timeline,
    lab_reports: [...reportsById.values()],
    products,
    summary: {
      total_steps: timeline.length,
      total_days: totalDays,
      quality_certified: Boolean(state && state.test_result === "approved"),
      total_distance_km: Math.round(totalDistanceKm * 100) / 100,
      current_phase: state ? state.phase : null,
      current_holder_id: state ? state.current_holder_id : null,
    },
  };
}

async function buildProductJourney(productId) {
  const product = await prisma.product.findUnique({ where: { product_id: productId } });
  if (!product) return null;

  const manufacturer = await prisma.user.findUnique({ where: { user_id: product.manufacturer_id } });
  const links = await prisma.productBatchLink.findMany({ where: { product_id: productId } });

  const sourceBatches = [];
  for (const link of links) {
    const journey = await buildBatchJourney(link.batch_id);
    if (!journey) continue;
    sourceBatches.push({
      batch_id: link.batch_id,
      quantity_kg: link.quantity_kg != null ? Number(link.quantity_kg) : null,
      journey,
    });
  }

  return {
    product: {
      product_id: product.product_id,
      manufacturer_id: product.manufacturer_id,
      name: product.name,
      sku: product.sku,
      description: product.description,
      image_url: product.image_url,
      created_at: product.created_at ? product.created_at.toISOString().replace("Z", "") : null,
      updated_at: product.updated_at ? product.updated_at.toISOString().replace("Z", "") : null,
    },
    manufacturer: userSummary(manufacturer),
    source_batches: sourceBatches,
    summary: {
      total_source_batches: sourceBatches.length,
      all_certified: sourceBatches.every((b) => b.journey.summary.quality_certified),
    },
  };
}

module.exports = { buildBatchJourney, buildProductJourney, userSummary };