/**
 * Password hashing + policy (docs/auth/architecture.md §2).
 * bcryptjs, rounds 10. Min 8 / max 128 chars; max protects against bcrypt DoS.
 */
const bcrypt = require("bcryptjs");

const BCRYPT_ROUNDS = 10;
const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

/** @returns {{ ok: true } | { ok: false, reason: string }} */
function validatePasswordPolicy(password) {
  if (typeof password !== "string") return { ok: false, reason: "Password must be a string" };
  if (password.length < MIN_LENGTH) {
    return { ok: false, reason: `Password must be at least ${MIN_LENGTH} characters` };
  }
  if (password.length > MAX_LENGTH) {
    return { ok: false, reason: `Password must be at most ${MAX_LENGTH} characters` };
  }
  return { ok: true };
}

function hashPassword(plaintext) {
  return bcrypt.hashSync(plaintext, BCRYPT_ROUNDS);
}

/** Timing-safe comparison through bcrypt; false on any malformed input. */
function verifyPassword(plaintext, passwordHash) {
  if (!plaintext || !passwordHash || typeof plaintext !== "string") return false;
  try {
    return bcrypt.compareSync(plaintext, passwordHash);
  } catch {
    return false;
  }
}

module.exports = { hashPassword, verifyPassword, validatePasswordPolicy, BCRYPT_ROUNDS, MIN_LENGTH, MAX_LENGTH };
