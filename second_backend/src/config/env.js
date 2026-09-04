/**
 * Environment configuration — mirrors backend/env.example and app.py.
 *
 * The .env file lives at the repo root of second_backend/ and is loaded
 * here once, before anything else imports the app.
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

function intOr(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

const SECRET_KEY = process.env.SECRET_KEY || "dev-secret-change-me";

const env = {
  // server
  HOST: process.env.HOST || "0.0.0.0",
  PORT: intOr(process.env.PORT, 5000),

  // database (Prisma URL; relative paths resolve against prisma/schema.prisma)
  DATABASE_URL: process.env.DATABASE_URL || "file:./herbchain.db",

  // auth
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY || process.env.SECRET_KEY || "dev-jwt-change-me",
  JWT_ACCESS_TOKEN_EXPIRES: process.env.JWT_ACCESS_TOKEN_EXPIRES || "15m", // jsonwebtoken duration
  JWT_REFRESH_TOKEN_EXPIRES: process.env.JWT_REFRESH_TOKEN_EXPIRES || "30d",

  // QR signing key (legacy stateless qrService; kept for visibility)
  QR_SIGNING_KEY: process.env.QR_SIGNING_KEY || process.env.SECRET_KEY || "dev-qr-change-me",

  // phase 5 — dynamic QR engine (docs/qr/architecture.md)
  QR_TOKEN_TTL_DAYS: intOr(process.env.QR_TOKEN_TTL_DAYS, 30), // spec: token expiry, not ownership expiry
  QR_TOKEN_BYTES: intOr(process.env.QR_TOKEN_BYTES, 24), // random bytes per token (192 bits)
  QR_TOKEN_PREFIX: process.env.QR_TOKEN_PREFIX || "hbc_",

  // CORS — comma-separated origins or "*"
  CORS_ORIGINS: (process.env.CORS_ORIGINS || "*").trim(),

  // frontend host for password-reset links (mailer stub)
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",

  // logging
  LOG_LEVEL: (process.env.LOG_LEVEL || "INFO").toUpperCase(),

  // upload limit
  MAX_CONTENT_LENGTH: intOr(process.env.MAX_CONTENT_LENGTH, 16 * 1024 * 1024),
  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads", // storage driver root (relative = repo root of second_backend)
  MAX_FILE_SIZE: intOr(process.env.MAX_FILE_SIZE, 8 * 1024 * 1024),

  // optional integrations
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || "",

  // recognition (phase 4 — see docs/identification/architecture.md)
  // provider: "" (auto) | mock | gemini | azure_custom_vision
  RECOGNITION_PROVIDER: (process.env.RECOGNITION_PROVIDER || "").trim().toLowerCase(),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-1.5-flash",
  AZURE_CV_ENDPOINT: process.env.AZURE_CV_ENDPOINT || "",
  AZURE_CV_PREDICTION_KEY: process.env.AZURE_CV_PREDICTION_KEY || "",
  AZURE_CV_PROJECT_ID: process.env.AZURE_CV_PROJECT_ID || "",
  AZURE_CV_PUBLISHED_NAME: process.env.AZURE_CV_PUBLISHED_NAME || "",
  RECOGNITION_TOP_K: intOr(process.env.RECOGNITION_TOP_K, 3),
  RECOGNITION_MIN_DIM: intOr(process.env.RECOGNITION_MIN_DIM, 1024), // spec: min 1024x1024
  RECOGNITION_MIN_SHARPNESS: parseFloat(process.env.RECOGNITION_MIN_SHARPNESS || 3),
  RECOGNITION_MIN_BRIGHTNESS: intOr(process.env.RECOGNITION_MIN_BRIGHTNESS, 25),
  RECOGNITION_DAILY_LIMIT: intOr(process.env.RECOGNITION_DAILY_LIMIT, 50), // spec: 50 AI requests/day/user
  RECOGNITION_CACHE_TTL_DAYS: intOr(process.env.RECOGNITION_CACHE_TTL_DAYS, 30),
};

function corsOriginList() {
  const raw = (env.CORS_ORIGINS || "*").trim();
  if (raw === "*" || raw === "") return "*";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

module.exports = { env, corsOriginList, SECRET_KEY };