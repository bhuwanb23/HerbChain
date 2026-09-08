/**
 * Farm profile routes — port of routes/farm.py.
 *
 *   GET    /api/v1/farm/me        farmer reads their farm
 *   PUT    /api/v1/farm/me        farmer creates or updates their farm
 *   DELETE /api/v1/farm/me        farmer clears their farm
 */
const express = require("express");
const { prisma } = require("../db/client");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireRole } = require("../middleware/auth");
const { ok, error } = require("../utils/responses");
const { farmProfileSchema, zodDetails } = require("../validation/schemas");
const { serializeFarm } = require("../serializers");
const { newFarmId } = require("../utils/ids");

function mountFarm(app) {
  const router = express.Router();

  router.get("/", (req, res) => {
    ok(res, { endpoints: { me: "GET/PUT/DELETE /api/v1/farm/me" } });
  });

  router.get("/me", requireRole("farmer"), asyncHandler(async (req, res) => {
    const row = await prisma.farmProfile.findUnique({ where: { farmer_id: req.user.user_id } });
    return ok(res, { farm: row ? serializeFarm(row) : null });
  }));

  router.put("/me", requireRole("farmer"), asyncHandler(async (req, res) => {
    const parsed = farmProfileSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return error(res, "validation_error", "Invalid farm profile", 400, zodDetails(parsed.error));
    }
    const d = parsed.data;

    let row = await prisma.farmProfile.findUnique({ where: { farmer_id: req.user.user_id } });
    if (!row) {
      row = await prisma.farmProfile.create({
        data: {
          farm_id: newFarmId(),
          farmer_id: req.user.user_id,
          certifications: [],
          ...d,
        },
      });
    } else {
      row = await prisma.farmProfile.update({
        where: { farmer_id: req.user.user_id },
        data: { ...d },
      });
    }
    return ok(res, { farm: serializeFarm(row) });
  }));

  router.delete("/me", requireRole("farmer"), asyncHandler(async (req, res) => {
    const row = await prisma.farmProfile.findUnique({ where: { farmer_id: req.user.user_id } });
    if (!row) return error(res, "not_found", "No farm profile to delete", 404);
    await prisma.farmProfile.delete({ where: { farmer_id: req.user.user_id } });
    return ok(res, { deleted: true });
  }));

  app.use("/api/v1/farm", router);
}

module.exports = { mountFarm };