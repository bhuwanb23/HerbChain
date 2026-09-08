/**
 * Crop plan routes — port of routes/crop_plans.py.
 *
 * All endpoints are farmer-only and scoped to the caller's own rows:
 *   GET    /api/v1/crop-plans               list mine
 *   POST   /api/v1/crop-plans               create
 *   GET    /api/v1/crop-plans/<plan_id>     read one
 *   PUT    /api/v1/crop-plans/<plan_id>     update
 *   DELETE /api/v1/crop-plans/<plan_id>     delete
 */
const express = require("express");
const { prisma } = require("../db/client");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireRole } = require("../middleware/auth");
const { ok, error } = require("../utils/responses");
const {
  createCropPlanSchema,
  updateCropPlanSchema,
  zodDetails,
} = require("../validation/schemas");
const { serializeCropPlan } = require("../serializers");
const { newPlanId } = require("../utils/ids");

function ensureSpecies(speciesId) {
  return prisma.herbCatalogue.findFirst({
    where: { species_id: speciesId, is_active: true },
  });
}

async function planWithSpecies(plan) {
  const species = await prisma.herbCatalogue.findUnique({
    where: { species_id: plan.species_id },
  });
  return serializeCropPlan(plan, { includeSpecies: true, species });
}

function mountCropPlans(app) {
  const router = express.Router();

  router.get("/", requireRole("farmer"), asyncHandler(async (req, res) => {
    const rows = await prisma.cropPlan.findMany({
      where: { farmer_id: req.user.user_id },
      orderBy: { expected_harvest_date: "asc" },
    });
    const plans = [];
    for (const row of rows) plans.push(await planWithSpecies(row));
    return ok(res, { plans, total: plans.length });
  }));

  router.get("/:plan_id", requireRole("farmer"), asyncHandler(async (req, res) => {
    const row = await prisma.cropPlan.findFirst({
      where: { plan_id: req.params.plan_id, farmer_id: req.user.user_id },
    });
    if (!row) return error(res, "not_found", `Plan '${req.params.plan_id}' not found`, 404);
    return ok(res, { plan: await planWithSpecies(row) });
  }));

  router.post("/", requireRole("farmer"), asyncHandler(async (req, res) => {
    const parsed = createCropPlanSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return error(res, "validation_error", "Invalid crop plan", 400, zodDetails(parsed.error));
    }
    const d = parsed.data;

    if (!(await ensureSpecies(d.species_id))) {
      return error(res, "bad_request", `species_id '${d.species_id}' is not in the catalogue`, 400);
    }

    const row = await prisma.cropPlan.create({
      data: {
        plan_id: newPlanId(),
        farmer_id: req.user.user_id,
        species_id: d.species_id,
        area_acres: d.area_acres ?? null,
        planting_date: d.planting_date,
        expected_harvest_date: d.expected_harvest_date,
        status: d.status,
        notes: d.notes ?? null,
      },
    });
    return ok(res, { plan: await planWithSpecies(row) }, 201);
  }));

  router.put("/:plan_id", requireRole("farmer"), asyncHandler(async (req, res) => {
    const row = await prisma.cropPlan.findFirst({
      where: { plan_id: req.params.plan_id, farmer_id: req.user.user_id },
    });
    if (!row) return error(res, "not_found", `Plan '${req.params.plan_id}' not found`, 404);

    const parsed = updateCropPlanSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return error(res, "validation_error", "Invalid crop plan", 400, zodDetails(parsed.error));
    }
    const d = parsed.data;

    if (d.species_id && !(await ensureSpecies(d.species_id))) {
      return error(res, "bad_request", `species_id '${d.species_id}' is not in the catalogue`, 400);
    }

    const updated = await prisma.cropPlan.update({
      where: { plan_id: req.params.plan_id },
      data: { ...d },
    });
    return ok(res, { plan: await planWithSpecies(updated) });
  }));

  router.delete("/:plan_id", requireRole("farmer"), asyncHandler(async (req, res) => {
    const row = await prisma.cropPlan.findFirst({
      where: { plan_id: req.params.plan_id, farmer_id: req.user.user_id },
    });
    if (!row) return error(res, "not_found", `Plan '${req.params.plan_id}' not found`, 404);
    await prisma.cropPlan.delete({ where: { plan_id: req.params.plan_id } });
    return ok(res, { deleted: true });
  }));

  app.use("/api/v1/crop-plans", router);
}

module.exports = { mountCropPlans };