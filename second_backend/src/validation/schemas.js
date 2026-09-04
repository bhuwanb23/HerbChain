/**
 * Request validation schemas — ports of the marshmallow schemas in
 * backend/server/schemas/*.py. One schema per route family; more are added
 * as their routes are ported.
 */
const { z } = require("zod");
const { ROLE_CHOICES } = require("../constants/enums");

// A "YYYY-MM-DD" calendar date (marshmallow fields.Date behaviour).
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Not a valid date (expected YYYY-MM-DD)")
  .refine((s) => !Number.isNaN(Date.parse(s + "T00:00:00Z")), "Not a real calendar date");

// Nullable float that coerces strings like marshmallow fields.Float.
const nullableFloat = z.preprocess(
  (v) => (v === null || v === undefined || v === "" ? null : v),
  z.number().nullable()
);

/**
 * Convert a ZodError into the marshmallow-style `details` payload:
 *   { "email": ["Required"], "role": ["Invalid value"] }
 */
function zodDetails(zodError) {
  const details = {};
  for (const issue of zodError.issues) {
    const key = issue.path.join(".") || "_";
    if (!details[key]) details[key] = [];
    details[key].push(issue.message);
  }
  return details;
}

// ---------------------------------------------------------------- auth

const registerSchema = z.object({
  role: z.enum(ROLE_CHOICES),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  phone: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  gps_lat: nullableFloat.optional(),
  gps_lng: nullableFloat.optional(),
  language_pref: z.string().min(2).max(10).default("en"),
});

const loginSchema = z.object({
  // Accepts email or user_id under the same field (Flask LoginSchema).
  identifier: z.string().min(1).max(120),
  password: z.string().min(1).max(128),
});

// ---------------------------------------------------------------- batches

const createBatchSchema = z.object({
  species_name: z.string().min(1).max(100),
  harvest_date: isoDate,
  location: z.string().min(1).max(200),
  weight_kg: z.coerce.number().min(0.01),
  image_url: z.string().nullable().optional(),
  gps_lat: nullableFloat.optional(),
  gps_lng: nullableFloat.optional(),
  notes: z.string().nullable().optional(),
});

const transferSchema = z.object({
  scanned_qr_token: z.string().min(10),
  location: z.string().nullable().optional(),
  gps_lat: nullableFloat.optional(),
  gps_lng: nullableFloat.optional(),
  notes: z.string().nullable().optional(),
});

// ------------------------------------------------------------- lab reports

const createLabReportSchema = z.object({
  batch_id: z.string().min(1).max(50),
  test_type: z.string().min(1).max(100),
  test_date: isoDate,
  results_summary: z.string().min(1),
  outcome: z.enum(["approved", "rejected"]),
  certification_level: z.string().nullable().optional(),
  purity_percentage: nullableFloat.optional(),
  moisture_content: nullableFloat.optional(),
  ash_content: nullableFloat.optional(),
  heavy_metals_present: z.boolean().nullable().optional(),
  pesticides_detected: z.boolean().nullable().optional(),
  active_compounds: z.string().nullable().optional(),
  potency_rating: z.string().nullable().optional(),
  report_url: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  recommendations: z.string().nullable().optional(),
});

// --------------------------------------------------------------- products

const productBatchLinkSchema = z.object({
  batch_id: z.string().min(1).max(50),
  quantity_kg: z.coerce.number().min(0.01),
});

const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  source_batches: z.array(productBatchLinkSchema).min(1),
});

module.exports = {
  isoDate,
  nullableFloat,
  zodDetails,
  registerSchema,
  loginSchema,
  createBatchSchema,
  transferSchema,
  createLabReportSchema,
  productBatchLinkSchema,
  createProductSchema,
};