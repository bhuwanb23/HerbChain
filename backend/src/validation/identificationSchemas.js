/** Zod schemas for the identification module (docs/phase_4.md confirmation). */
const { z } = require("zod");
const { REJECT_REASONS } = require("../constants/identification");

const confirmSchema = z
  .object({
    accepted: z.boolean().optional(),
    species_id: z.string().min(1).optional(),
    species_code: z.string().trim().min(1).optional(),
    rejected_reason: z.enum(REJECT_REASONS, { message: "Invalid rejected_reason" }).optional(),
  })
  .refine((d) => !(d.species_id && d.species_code), {
    message: "Send either species_id or species_code, not both",
    path: ["species"],
  })
  .refine(
    (d) => d.accepted === true || Boolean(d.species_id || d.species_code || d.rejected_reason),
    { message: "Send accepted:true, a species selection, or a rejected_reason", path: ["(root)"] }
  );

module.exports = { confirmSchema };
