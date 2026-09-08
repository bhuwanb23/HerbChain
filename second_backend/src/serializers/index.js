/**
 * Serializers — ports of the model to_dict() methods in backend/server/models.
 *
 * Prisma rows are plain objects with JS Date instances; these mappers return
 * the exact JSON shape the Flask API produced.
 */

/** Flask datetime.isoformat() on naive-UTC datetimes: no trailing Z. */
function iso(d) {
  if (!d) return null;
  return d.toISOString().replace("Z", "");
}

function serializeUser(user, { includeEmail = true } = {}) {
  if (!user) return null;
  const out = {
    user_id: user.user_id,
    role: user.role,
    name: user.name,
    phone: user.phone,
    location: user.location,
    gps_lat: user.gps_lat,
    gps_lng: user.gps_lng,
    language_pref: user.language_pref,
    is_active: user.is_active,
    kyc_verified: user.kyc_verified,
    created_at: iso(user.created_at),
    updated_at: iso(user.updated_at),
  };
  if (includeEmail) out.email = user.email;
  return out;
}

function serializeHerb(herb) {
  if (!herb) return null;
  return {
    batch_id: herb.batch_id,
    farmer_id: herb.farmer_id,
    species_id: herb.species_id,
    species_name: herb.species_name,
    image_url: herb.image_url,
    harvest_date: herb.harvest_date,
    location: herb.location,
    gps_lat: herb.gps_lat,
    gps_lng: herb.gps_lng,
    weight_kg: herb.weight_kg != null ? Number(herb.weight_kg) : null,
    notes: herb.notes,
    parent_batch_id: herb.parent_batch_id,
    created_at: iso(herb.created_at),
  };
}

function serializeState(state) {
  if (!state) return null;
  return {
    batch_id: state.batch_id,
    current_holder_id: state.current_holder_id,
    phase: state.phase,
    test_result: state.test_result,
    updated_at: iso(state.updated_at),
  };
}

function serializeEvent(event, { expandParties = false, users = {} } = {}) {
  if (!event) return null;
  const out = {
    event_id: event.event_id,
    batch_id: event.batch_id,
    event_type: event.event_type,
    actor_id: event.actor_id,
    from_party_id: event.from_party_id,
    to_party_id: event.to_party_id,
    phase_before: event.phase_before,
    phase_after: event.phase_after,
    location: event.location,
    gps_lat: event.gps_lat,
    gps_lng: event.gps_lng,
    payload: event.payload_json,
    created_at: iso(event.created_at),
  };
  if (expandParties) {
    out.actor = serializeUser(users[event.actor_id], { includeEmail: false }) || null;
    out.from_party = serializeUser(users[event.from_party_id], { includeEmail: false }) || null;
    out.to_party = serializeUser(users[event.to_party_id], { includeEmail: false }) || null;
  }
  return out;
}

function serializeLabReport(report) {
  if (!report) return null;
  return {
    report_id: report.report_id,
    batch_id: report.batch_id,
    lab_id: report.lab_id,
    test_type: report.test_type,
    test_date: report.test_date,
    results_summary: report.results_summary,
    outcome: report.outcome,
    certification_level: report.certification_level,
    purity_percentage: report.purity_percentage != null ? Number(report.purity_percentage) : null,
    moisture_content: report.moisture_content != null ? Number(report.moisture_content) : null,
    ash_content: report.ash_content != null ? Number(report.ash_content) : null,
    heavy_metals_present: report.heavy_metals_present,
    pesticides_detected: report.pesticides_detected,
    active_compounds: report.active_compounds,
    potency_rating: report.potency_rating,
    report_url: report.report_url,
    notes: report.notes,
    recommendations: report.recommendations,
    created_at: iso(report.created_at),
    updated_at: iso(report.updated_at),
  };
}

function serializeProductLink(link) {
  if (!link) return null;
  return {
    product_id: link.product_id,
    batch_id: link.batch_id,
    quantity_kg: link.quantity_kg != null ? Number(link.quantity_kg) : null,
    created_at: iso(link.created_at),
  };
}

function serializeProduct(product, { includeLinks = false, links = [] } = {}) {
  if (!product) return null;
  const out = {
    product_id: product.product_id,
    manufacturer_id: product.manufacturer_id,
    name: product.name,
    sku: product.sku,
    description: product.description,
    image_url: product.image_url,
    created_at: iso(product.created_at),
    updated_at: iso(product.updated_at),
  };
  if (includeLinks) out.source_batches = links.map(serializeProductLink);
  return out;
}

function serializeSpecies(species, { includePrices = false, latestPrice = null } = {}) {
  if (!species) return null;
  const out = {
    species_id: species.species_id,
    common_name: species.common_name,
    scientific_name: species.scientific_name,
    ayush_category: species.ayush_category,
    synonyms: species.synonyms || [],
    description: species.description,
    medicinal_uses: species.medicinal_uses,
    image_url: species.image_url,
    season_planting: species.season_planting,
    season_harvest: species.season_harvest,
    default_unit_price_inr:
      species.default_unit_price_inr != null ? Number(species.default_unit_price_inr) : null,
    is_active: species.is_active,
    created_at: iso(species.created_at),
    updated_at: iso(species.updated_at),
  };
  if (includePrices) out.latest_price = latestPrice ? serializePriceQuote(latestPrice) : null;
  return out;
}

function serializePriceQuote(quote) {
  if (!quote) return null;
  return {
    quote_id: quote.quote_id,
    species_id: quote.species_id,
    price_per_kg_inr: quote.price_per_kg_inr != null ? Number(quote.price_per_kg_inr) : null,
    currency: quote.currency,
    source: quote.source,
    effective_at: iso(quote.effective_at),
    created_by_admin_id: quote.created_by_admin_id,
    notes: quote.notes,
    created_at: iso(quote.created_at),
  };
}

function serializeFarm(farm) {
  if (!farm) return null;
  return {
    farm_id: farm.farm_id,
    farmer_id: farm.farmer_id,
    farm_name: farm.farm_name,
    land_size_acres: farm.land_size_acres != null ? Number(farm.land_size_acres) : null,
    soil_type: farm.soil_type,
    irrigation_type: farm.irrigation_type,
    certifications: farm.certifications || [],
    address: farm.address,
    gps_lat: farm.gps_lat,
    gps_lng: farm.gps_lng,
    notes: farm.notes,
    created_at: iso(farm.created_at),
    updated_at: iso(farm.updated_at),
  };
}

function serializeCropPlan(plan, { includeSpecies = false, species = null } = {}) {
  if (!plan) return null;
  const out = {
    plan_id: plan.plan_id,
    farmer_id: plan.farmer_id,
    species_id: plan.species_id,
    area_acres: plan.area_acres != null ? Number(plan.area_acres) : null,
    planting_date: plan.planting_date,
    expected_harvest_date: plan.expected_harvest_date,
    actual_harvest_date: plan.actual_harvest_date,
    status: plan.status,
    notes: plan.notes,
    created_at: iso(plan.created_at),
    updated_at: iso(plan.updated_at),
  };
  if (includeSpecies && species) {
    out.species = {
      species_id: species.species_id,
      common_name: species.common_name,
      scientific_name: species.scientific_name,
      image_url: species.image_url,
    };
  }
  return out;
}

function serializeSnapshot(snapshot) {
  if (!snapshot) return null;
  return {
    snapshot_id: snapshot.snapshot_id,
    gps_lat: snapshot.gps_lat,
    gps_lng: snapshot.gps_lng,
    provider: snapshot.provider,
    payload: snapshot.payload_json,
    fetched_at: iso(snapshot.fetched_at),
  };
}

module.exports = {
  iso,
  serializeUser,
  serializeHerb,
  serializeState,
  serializeEvent,
  serializeLabReport,
  serializeProduct,
  serializeProductLink,
  serializeSpecies,
  serializePriceQuote,
  serializeFarm,
  serializeCropPlan,
  serializeSnapshot,
};