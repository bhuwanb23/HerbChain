/**
 * Price discovery routes — port of routes/prices.py.
 *
 *   GET  /api/v1/prices                latest price per species (auth)
 *   GET  /api/v1/prices/<species_id>   full history for one species (auth)
 *   POST /api/v1/prices                admin: record a new quote
 */
const express = require("express");
const { prisma } = require("../db/client");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireAuth, requireRole } = require("../middleware/auth");
const { ok, error } = require("../utils/responses");
const { createPriceQuoteSchema, zodDetails } = require("../validation/schemas");
const { serializePriceQuote } = require("../serializers");
const { newQuoteId } = require("../utils/ids");

function mountPrices(app) {
  const router = express.Router();

  router.get("/", requireAuth, asyncHandler(async (req, res) => {
    // Latest PriceQuote per species, joined to its catalogue metadata.
    const latest = await prisma.priceQuote.groupBy({
      by: ["species_id"],
      _max: { effective_at: true },
    });
    const latestBySpecies = new Map(latest.map((l) => [l.species_id, l._max.effective_at]));

    const quotes = await prisma.priceQuote.findMany({
      where: {
        OR: [...latestBySpecies].map(([speciesId, effectiveAt]) => ({
          species_id: speciesId,
          effective_at: effectiveAt,
        })),
      },
    });
    const speciesIds = [...new Set(quotes.map((q) => q.species_id))];
    const speciesRows = await prisma.herbCatalogue.findMany({
      where: { species_id: { in: speciesIds } },
    });
    const speciesById = new Map(speciesRows.map((s) => [s.species_id, s]));

    const items = quotes
      .map((quote) => {
        const species = speciesById.get(quote.species_id);
        if (!species) return null;
        return {
          species_id: species.species_id,
          common_name: species.common_name,
          scientific_name: species.scientific_name,
          image_url: species.image_url,
          price_per_kg_inr: quote.price_per_kg_inr != null ? Number(quote.price_per_kg_inr) : null,
          currency: quote.currency,
          source: quote.source,
          effective_at: quote.effective_at ? quote.effective_at.toISOString().replace("Z", "") : null,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.common_name.localeCompare(b.common_name));

    return ok(res, { prices: items, total: items.length });
  }));

  router.get("/:species_id", requireAuth, asyncHandler(async (req, res) => {
    const species = await prisma.herbCatalogue.findUnique({
      where: { species_id: req.params.species_id },
    });
    if (!species) return error(res, "not_found", `Species '${req.params.species_id}' not found`, 404);

    const rows = await prisma.priceQuote.findMany({
      where: { species_id: req.params.species_id },
      orderBy: { effective_at: "desc" },
    });
    return ok(res, {
      species: {
        species_id: species.species_id,
        common_name: species.common_name,
        scientific_name: species.scientific_name,
      },
      history: rows.map(serializePriceQuote),
      total: rows.length,
    });
  }));

  router.post("/", requireRole("admin"), asyncHandler(async (req, res) => {
    const parsed = createPriceQuoteSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return error(res, "validation_error", "Invalid quote", 400, zodDetails(parsed.error));
    }
    const d = parsed.data;

    const species = await prisma.herbCatalogue.findUnique({ where: { species_id: d.species_id } });
    if (!species) return error(res, "not_found", `Species '${d.species_id}' not found`, 404);

    const quote = await prisma.priceQuote.create({
      data: {
        quote_id: newQuoteId(),
        species_id: d.species_id,
        price_per_kg_inr: d.price_per_kg_inr,
        currency: d.currency,
        source: d.source,
        notes: d.notes ?? null,
        created_by_admin_id: req.user.user_id,
      },
    });
    await prisma.herbCatalogue.update({
      where: { species_id: d.species_id },
      data: { default_unit_price_inr: d.price_per_kg_inr },
    });

    return ok(res, { quote: serializePriceQuote(quote) }, 201);
  }));

  app.use("/api/v1/prices", router);
}

module.exports = { mountPrices };