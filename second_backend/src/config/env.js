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
  JWT_ACCESS_TOKEN_EXPIRES: process.env.JWT_ACCESS_TOKEN_EXPIRES || "12h", // jsonwebtoken duration
  JWT_REFRESH_TOKEN_EXPIRES: process.env.JWT_REFRESH_TOKEN_EXPIRES || "30d",

  // QR signing key (read directly by qrService; kept here for visibility)
  QR_SIGNING_KEY: process.env.QR_SIGNING_KEY || process.env.SECRET_KEY || "dev-qr-change-me",

  // CORS — comma-separated origins or "*"
  CORS_ORIGINS: (process.env.CORS_ORIGINS || "*").trim(),

  // logging
  LOG_LEVEL: (process.env.LOG_LEVEL || "INFO").toUpperCase(),

  // upload limit
  MAX_CONTENT_LENGTH: intOr(process.env.MAX_CONTENT_LENGTH, 16 * 1024 * 1024),

  // optional integrations
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || "",
  RECOGNITION_TOP_K: intOr(process.env.RECOGNITION_TOP_K, 3),
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