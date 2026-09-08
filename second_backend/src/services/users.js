/**
 * User service — ports the User model's create / check_password behaviour
 * (backend/server/models/users.py).
 */
const bcrypt = require("bcryptjs");
const { prisma } = require("../db/client");
const { ROLE_CHOICES } = require("../constants/enums");
const { ApiError } = require("../utils/errors");

const BCRYPT_ROUNDS = 10;

async function createUser({
  user_id,
  role,
  name,
  email,
  password,
  phone = null,
  location = null,
  gps_lat = null,
  gps_lng = null,
  language_pref = "en",
}) {
  if (!ROLE_CHOICES.includes(role)) {
    throw new ApiError("bad_request", `Invalid role '${role}'`, 400);
  }
  if (!user_id || !name || !email) {
    throw new ApiError("bad_request", "user_id, name and email are required", 400);
  }
  if (!password || typeof password !== "string") {
    throw new ApiError("bad_request", "Password must be a non-empty string", 400);
  }
  if (password.length < 6) {
    throw new ApiError("bad_request", "Password must be at least 6 characters", 400);
  }

  return prisma.user.create({
    data: {
      user_id,
      role,
      name,
      email,
      phone,
      location,
      gps_lat,
      gps_lng,
      language_pref,
      password_hash: bcrypt.hashSync(password, BCRYPT_ROUNDS),
    },
  });
}

/** Flask login lookup: email OR user_id, case-insensitive on email. */
async function findByIdentifier(identifier) {
  const raw = identifier.trim();
  const email = raw.toLowerCase();
  return (
    (await prisma.user.findUnique({ where: { email } })) ||
    (await prisma.user.findUnique({ where: { user_id: raw } }))
  );
}

function verifyPassword(user, plaintext) {
  if (!user || !user.password_hash || !plaintext) return false;
  try {
    return bcrypt.compareSync(plaintext, user.password_hash);
  } catch {
    return false;
  }
}

module.exports = { createUser, findByIdentifier, verifyPassword };