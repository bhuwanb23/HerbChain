/**
 * Recognition routes — port of routes/recognition.py.
 *
 *   POST /api/v1/recognition/herbs
 *     body = { candidates: [{label, score}, ...], gps_lat?, gps_lng?, image_url?, top_k? }
 *     returns top-K ranked AYUSH species with confidence + species_id
 */
const express = require("express");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { ok, error } = require("../utils/responses");
const { rerankSchema, zodDetails } = require("../validation/schemas");
const { rerank } = require("../services/recognitionService");

function mountRecognition(app) {
  const router = express.Router();

  router.get("/", (req, res) => {
    ok(res, { endpoints: { rerank: "POST /api/v1/recognition/herbs" } });
  });

  router.post("/herbs", requireAuth, asyncHandler(async (req, res) => {
    const parsed = rerankSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return error(res, "validation_error", "Invalid candidates", 400, zodDetails(parsed.error));
    }
    const d = parsed.data;

    const results = await rerank(d.candidates, d.top_k ?? 3);
    return ok(res, {
      top: results.map((r) => ({
        species_id: r.species_id,
        common_name: r.common_name,
        scientific_name: r.scientific_name,
        image_url: r.image_url,
        medicinal_uses: r.medicinal_uses,
        confidence: r.confidence,
        matched_via: r.matched_via,
      })),
      total: results.length,
    });
  }));

  app.use("/api/v1/recognition", router);
}

module.exports = { mountRecognition };