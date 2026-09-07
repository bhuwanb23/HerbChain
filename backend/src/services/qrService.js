/**
 * QR signing & verification — port of services/qr_service.py.
 *
 * Every QR encodes a compact HS256 JWT whose claims describe the batch and
 * its current holder. The token is stored on BatchState.current_qr_token and
 * overwritten on every successful transfer, so old QRs die the moment the
 * next one is minted. Claims match the Flask backend exactly
 * (typ/sub/holder/phase/nonce/iat/exp), so tokens minted by either backend
 * with the same QR_SIGNING_KEY verify on both.
 *
 * A separate code path mints product QRs (consumer-facing read-only).
 */
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
const { env } = require("../config/env");

// Default validity window for a batch QR: 7 days (same as Flask).
const DEFAULT_BATCH_TTL_SECONDS = 7 * 24 * 60 * 60;
// Product QRs are public-read forever — no expiry by default.
const DEFAULT_PRODUCT_TTL_SECONDS = 0;

const QR_TYPE_BATCH = "batch";
const QR_TYPE_PRODUCT = "product";

class QrError extends Error {
  constructor(message) {
    super(message);
    this.name = "QrError";
  }
}

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function sign(payload) {
  return jwt.sign(payload, env.QR_SIGNING_KEY, { algorithm: "HS256" });
}

function decode(token) {
  try {
    return jwt.verify(token, env.QR_SIGNING_KEY, { algorithms: ["HS256"] });
  } catch (err) {
    if (err && err.name === "TokenExpiredError") {
      throw new QrError("QR has expired");
    }
    throw new QrError(`Invalid QR token: ${err.message}`);
  }
}

// ---------------------------------------------------------------- issuance

function issueBatchQr(batchId, holderId, phase, ttlSeconds = null) {
  if (!batchId || !holderId || !phase) {
    throw new Error("batch_id, holder_id and phase are required");
  }
  const ttl = ttlSeconds === null ? DEFAULT_BATCH_TTL_SECONDS : Number(ttlSeconds);
  const now = nowSeconds();
  const payload = {
    typ: QR_TYPE_BATCH,
    sub: batchId,
    holder: holderId,
    phase,
    nonce: crypto.randomBytes(8).toString("base64url"),
    iat: now,
  };
  if (ttl && ttl > 0) payload.exp = now + ttl;
  return sign(payload);
}

function issueProductQr(productId, ttlSeconds = null) {
  if (!productId) throw new Error("product_id is required");
  const ttl = ttlSeconds === null ? DEFAULT_PRODUCT_TTL_SECONDS : Number(ttlSeconds);
  const now = nowSeconds();
  const payload = {
    typ: QR_TYPE_PRODUCT,
    sub: productId,
    nonce: crypto.randomBytes(8).toString("base64url"),
    iat: now,
  };
  if (ttl && ttl > 0) payload.exp = now + ttl;
  return sign(payload);
}

// ------------------------------------------------------------- verification

function verifyBatchQr(token, expectedBatchId = null) {
  if (!token || typeof token !== "string") throw new QrError("Empty QR token");
  const claims = decode(token);
  if (claims.typ !== QR_TYPE_BATCH) throw new QrError("QR is not a batch token");

  const { sub: batchId, holder: holderId, phase, nonce } = claims;
  if (!batchId || !holderId || !phase || !nonce) {
    throw new QrError("QR is missing required claims");
  }
  if (expectedBatchId && batchId !== expectedBatchId) {
    throw new QrError(`QR belongs to batch '${batchId}', not '${expectedBatchId}'`);
  }
  return { batchId, holderId, phase, nonce, issuedAt: claims.iat || 0, expiresAt: claims.exp || null, token };
}

function verifyProductQr(token) {
  if (!token || typeof token !== "string") throw new QrError("Empty QR token");
  const claims = decode(token);
  if (claims.typ !== QR_TYPE_PRODUCT) throw new QrError("QR is not a product token");

  const { sub: productId, nonce } = claims;
  if (!productId || !nonce) throw new QrError("Product QR is missing required claims");
  return { productId, nonce, issuedAt: claims.iat || 0, token };
}

// --------------------------------------------------------------- rendering

/** Render a token as a QR PNG data URL (data:image/png;base64,...). */
async function renderPngDataUrl(token) {
  if (!token) throw new Error("Empty token");
  return QRCode.toDataURL(token, {
    errorCorrectionLevel: "M",
    margin: 2,
  });
}

module.exports = {
  QrError,
  issueBatchQr,
  issueProductQr,
  verifyBatchQr,
  verifyProductQr,
  renderPngDataUrl,
  DEFAULT_BATCH_TTL_SECONDS,
  DEFAULT_PRODUCT_TTL_SECONDS,
};