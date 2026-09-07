/**
 * Catalogue module (read path) — GET /api/v1/species.
 * Public, active species only; full catalogue management is its own phase.
 */
const express = require("express");
const { prisma } = require("../../db/client");
const { ok, error } = require("../../utils/responses");

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const SPECIES_SELECT = {
  id: true,
  code: true,
  common_name: true,
  scientific_name: true,
  family: true,
  ayush_category: true,
  season_planting: true,
  season_harvest: true,
};

function mountSpeciesRoutes(app) {
  const router = express.Router();

  router.get(
    "/",
    wrap(async (req, res) => {
      const { q = null } = req.query;
      let species = await prisma.species.findMany({ where: { is_active: true }, orderBy: { common_name: "asc" }, select: SPECIES_SELECT });
      if (q) {
        const needle = String(q).trim().toLowerCase();
        species = species.filter(
          (s) =>
            s.common_name.toLowerCase().includes(needle) ||
            s.scientific_name.toLowerCase().includes(needle) ||
            s.code.toLowerCase().includes(needle)
        );
      }
      return ok(res, { species, total: species.length });
    })
  );

  router.get(
    "/:code",
    wrap(async (req, res) => {
      const species = await prisma.species.findFirst({
        where: { code: req.params.code.toLowerCase().trim(), is_active: true },
        select: SPECIES_SELECT,
      });
      if (!species) return error(res, "not_found", "Species not found", 404);
      return ok(res, { species });
    })
  );

  app.use("/api/v1/species", router);
}

module.exports = { mountSpeciesRoutes };
