/**
 * Zod schemas for the auth + admin identity endpoints (new architecture).
 * Validation errors ride on the standard envelope's `details` array.
 */
const { z } = require("zod");
const { ROLES } = require("../constants/roles");

const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(255);
const phone = z.string().trim().max(32).optional().or(z.literal("").transform(() => undefined));
const password = z.string().min(8, "Password must be at least 8 characters").max(128, "Password must be at most 128 characters");
const identifier = z.string().trim().min(3, "Enter your email or phone number").max(255);

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email,
  phone: phone.optional(),
  password,
  role: z.enum(ROLES, { message: "Invalid role" }),
  device_id: z.string().trim().max(128).optional(),
  device_name: z.string().trim().max(128).optional(),
});

const loginSchema = z.object({
  identifier,
  password: z.string().min(1, "Password is required").max(256),
  device_id: z.string().trim().max(128).optional(),
  device_name: z.string().trim().max(128).optional(),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1).optional(),
});

const changePasswordSchema = z.object({
  old_password: z.string().min(1).max(256),
  new_password: password,
});

const forgotPasswordSchema = z.object({ identifier });

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  new_password: password,
});

const updateMeSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  phone: phone.optional(),
  locale: z.string().trim().min(2).max(10).optional(),
});

const approveSchema = z.object({
  org_code: z.string().trim().max(32).optional(),
  notes: z.string().trim().max(500).optional(),
});

const noteSchema = z.object({ notes: z.string().trim().max(500).optional() });

const roleSchema = z.object({ role: z.enum(ROLES.filter((r) => r !== "admin"), { message: "Invalid target role" }) });

/** Map zod issues to the wire `details` format. */
function zodDetails(zodError) {
  return zodError.issues.map((issue) => ({
    path: issue.path.join(".") || "(root)",
    message: issue.message,
    code: issue.code,
  }));
}

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateMeSchema,
  approveSchema,
  noteSchema,
  roleSchema,
  zodDetails,
};
