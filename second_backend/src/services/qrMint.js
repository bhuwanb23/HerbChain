/**
 * Stateless batch QR (docs/batch/architecture.md §6, auth design §5b.2).
 *
 * The QR payload is ONLY a signed token embedding the batch identity + its
 * current nonce — no farmer data, no location, no quantity. Nothing is stored
 * server-side: replay protection comes from the nonce, which increments on
 * every future custody transfer. QR_SIGNING_KEY keeps the token unforgeable.
 */
const jwt = require("jsonwebtoken");
const qrcode = require("qrcode");
const { env } = require("../config/env");

function signBatchQrToken(batch) {
  return jwt.sign(
    { typ: "batch_qr", code: batch.code, nonce: batch.qr_nonce },
    env.QR_SIGNING_KEY,
    { subject: batch.id, algorithm: "HS256" }
  );
}

/** Decode + verify signature. Throws jsonwebtoken errors for the caller. */
function verifyBatchQrToken(token) {
  return jwt.verify(token, env.QR_SIGNING_KEY, { algorithms: ["HS256"] });
}

/** Token is valid for THIS batch only if the embedded nonce is current. */
function tokenMatchesBatch(payload, batch) {
  return Boolean(
    payload &&
      payload.typ === "batch_qr" &&
      payload.sub === batch.id &&
      payload.nonce === batch.qr_nonce
  );
}

async function mintBatchQr(batch) {
  const token = signBatchQrToken(batch);
  const url = `${(env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "")}/qr/${token}`;
  const png = await qrcode.toDataURL(url);
  return { token, url, png, code: batch.code, version: batch.qr_nonce + 1 };
}

module.exports = { signBatchQrToken, verifyBatchQrToken, tokenMatchesBatch, mintBatchQr };
