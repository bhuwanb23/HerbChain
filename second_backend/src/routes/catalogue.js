/**
 * Herb catalogue routes — port of routes/herb_catalogue.py.
 *
 *   GET    /api/v1/catalogue                 list + filter species (open)
 *   GET    /api/v1/catalogue/<species_id>    one entry (with latest price)
 *   POST   /api/v1/catalogue                 admin: create
 *   PUT    /api/v1/catalogue/<species_id>    admin: update
 *   DELETE /api/v1/catalogue/<species_id>    admin: soft-delete (is_active=False)
 */
const express = require("express");
const { prisma } = require("../db/client");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireRole } = require("../middleware/auth");
const { ok, error } = require("../utils/responses");
const {
  createCatalogueEntrySchema,
  updateCatalogueEntrySchema,
  zodDetails,
} = require("../validation/schemas");
const { serializeSpecies } = require("../serializers");

function slugify(text) {
  const s = text.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return s || "species";
}

async function latestPriceFor(speciesId) {
  return prisma.priceQuote.findFirst({
    where: { species_id: speciesId },
    orderBy: { effective_at: "desc" },
  });
}

function mountCatalogue(app) {
  const router = express.Router();

  router.get("/", asyncHandler(async (req, res) => {
    const q = (req.query.q || "").toString().trim().toLowerCase();
    const category = req.query.category;
    const includeInactive = req.query.include_inactive === "1";

    const rows = await prisma.herbCatalogue.findMany({
      where: {
        ...(includeInactive ? {} : { is_active: true }),
        ...(category ? { ayush_category: category } : {}),
      },
      orderBy: { common_name: "asc" },
    });

    let filtered = rows;
    if (q) {
      filtered = rows.filter((row) => {
        const haystack = [row.common_name || "", row.scientific_name || "", (row.synonyms || []).join(" ")]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    return ok(res, { species: filtered.map(serializeSpecies), total: filtered.length });
  }));

  router.get("/:species_id", asyncHandler(async (req, res) => {
    const row = await prisma.herbCatalogue.findUnique({ where: { species_id: req.params.species_id } });
    if (!row) return error(res, "not_found", `Species '${req.params.species_id}' not found`, 404);
    return ok(res, {
      species: serializeSpecies(row, { includePrices: true, latestPrice: await latestPriceFor(row.species_id) }),
    });
  }));

  router.post("/", requireRole("admin"), asyncHandler(async (req, res) => {
    const parsed = createCatalogueEntrySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return error(res, "validation_error", "Invalid catalogue entry", 400, zodDetails(parsed.error));
    }
    const d = parsed.data;

    const speciesId = d.species_id || `SPC-${slugify(d.common_name)}`;
    if (await prisma.herbCatalogue.findUnique({ where: { species_id: speciesId } })) {
      return error(res, "conflict", `Species '${speciesId}' already exists`, 409);
    }

    const row = await prisma.herbCatalogue.create({
      data: {
        species_id: speciesId,
        common_name: d.common_name,
        scientific_name: d.scientific_name,
        ayush_category: d.ayush_category,
        synonyms: d.synonyms || [],
        description: d.description ?? null,
        medicinal_uses: d.medicinal_uses ?? null,
        image_url: d.image_url ?? null,
        season_planting: d.season_planting ?? null,
        season_harvest: d.season_harvest ?? null,
        default_unit_price_inr: d.default_unit_price_inr ?? null,
        is_active: true,
      },
    });
    return ok(res, { species: serializeSpecies(row) }, 201);
  }));

  router.put("/:species_id", requireRole("admin"), asyncHandler(async (req, res) => {
    const row = await prisma.herbCatalogue.findUnique({ where: { species_id: req.params.species_id } });
    if (!row) return error(res, "not_found", `Species '${req.params.species_id}' not found`, 404);

    const parsed = updateCatalogueEntrySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return error(res, "validation_error", "Invalid catalogue entry", 400, zodDetails(parsed.error));
    }
    const d = parsed.data;

    const updated = await prisma.herbCatalogue.update({
      where: { species_id: req.params.species_id },
      data: { ...d },
    });
    return ok(res, { species: serializeSpecies(updated) });
  }));

  router.delete("/:species_id", requireRole("admin"), asyncHandler(async (req, res) => {
    const row = await prisma.herbCatalogue.findUnique({ where: { species_id: req.params.species_id } });
    if (!row) return error(res, "not_found", `Species '${req.params.species_id}' not found`, 404);

    const updated = await prisma.herbCatalogue.update({
      where: { species_id: req.params.species_id },
      data: { is_active: false },
    });
    return ok(res, { species: serializeSpecies(updated) });
  }));

  app.use("/api/v1/catalogue", router);
}

module.exports = { mountCatalogue };