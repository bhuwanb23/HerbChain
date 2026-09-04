/** Zod schemas for the batch module (docs/batch/architecture.md §4). */
const { z } = require("zod");
const { CULTIVATION_TYPES, VALID_UNITS } = require("../constants/batch");

const batchCreateSchema = z
  .object({
    species_id: z.string().min(1).optional(),
    species_code: z.string().trim().min(1).optional(),
    quantity: z.coerce.number().positive("Quantity must be greater than 0"),
    unit: z.enum(VALID_UNITS).default("kg"),
    harvest_date: z.coerce.date({ message: "harvest_date must be a date" }),
    cultivation_type: z.enum(CULTIVATION_TYPES, { message: "Invalid cultivation_type" }),
    gps_lat: z.coerce.number().min(-90).max(90),
    gps_lng: z.coerce.number().min(-180).max(180),
    gps_accuracy: z.coerce.number().nonnegative().optional(),
    location: z.string().trim().max(300).optional(),
    asset_ids: z.array(z.string().min(1)).min(1, "At least one image is required").max(10, "At most 10 images"),
    primary_asset_id: z.string().min(1).optional(),
    attributes: z
      .object({
        color: z.string().max(100).optional(),
        odor: z.string().max(100).optional(),
        moisture: z.string().max(100).optional(),
      })
      .optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine((d) => d.species_id || d.species_code, { message: "species_id or species_code is required", path: ["species"] })
  .refine((d) => !d.primary_asset_id || d.asset_ids.includes(d.primary_asset_id), {
    message: "primary_asset_id must be one of asset_ids",
    path: ["primary_asset_id"],
  });

const qrVerifySchema = z.object({ token: z.string().min(1) });

/** Map zod issues to the wire details format (shared shape with authSchemas). */
function zodDetails(zodError) {
  return zodError.issues.map((issue) => ({
    path: issue.path.join(".") || "(root)",
    message: issue.message,
    code: issue.code,
  }));
}

module.exports = { batchCreateSchema, qrVerifySchema, zodDetails };
