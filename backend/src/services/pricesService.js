// ============================================================================
// PRICES SERVICE — lite (Phase A9)
// ---------------------------------------------------------------------------
const { prisma } = require("../db/client");

// List reference prices (farmers see latest per species; admin sees all)
async function listPrices({ species_id, market, limit = 50 } = {}) {
  const where = {};
  if (species_id) where.species_id = species_id;
  if (market) where.market = market;

  const prices = await prisma.priceQuote.findMany({
    where,
    include: { species: { select: { id: true, common_name: true, scientific_name: true, code: true } } },
    orderBy: { effective_at: "desc" },
    take: limit,
  });

  // Return latest per species for farmer view
  const latest = {};
  for (const p of prices) {
    const key = p.species_id;
    if (!latest[key]) latest[key] = p;
  }

  return { prices, latest: Object.values(latest) };
}

// Create price quote (admin only)
async function createPrice(user, { species_id, price_per_kg, market, source, notes }) {
  return prisma.priceQuote.create({
    data: {
      species_id,
      price_per_kg_paise: Math.round(price_per_kg * 100), // convert INR to paise
      market: market || "local",
      source: source || "admin",
      notes: notes || null,
      created_by_user_id: user.id,
    },
    include: { species: { select: { common_name: true } } },
  });
}

module.exports = { listPrices, createPrice };
