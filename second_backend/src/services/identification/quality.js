/**
 * Image quality inspection (docs/phase_4.md "Image Quality Validation").
 *
 * Runs BEFORE any recognition call: decode-ability, minimum resolution, blur
 * (Laplacian variance on a downscaled grayscale frame) and darkness (mean
 * luminance). Returns structured reasons so the client can tell the farmer
 * exactly what to fix ("too dark", "blurry", "too small", "not an image").
 */
const sharp = require("sharp");
const crypto = require("crypto");
const { env } = require("../../config/env");

const ANALYZE_SIZE = 64; // downscale target for the blur/brightness pass

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * @returns {Promise<object>} {
 *   ok, decode_error?, width?, height?, sharpness?, brightness?, reasons[]
 * }
 */
async function inspectImage(buffer) {
  let meta;
  try {
    meta = await sharp(buffer).metadata();
  } catch {
    return { ok: false, decode_error: true, width: null, height: null, reasons: ["not_an_image"] };
  }

  const reasons = [];
  const width = meta.width || 0;
  const height = meta.height || 0;
  const minDim = env.RECOGNITION_MIN_DIM;
  if (minDim > 0 && (width < minDim || height < minDim)) reasons.push("too_small");

  let sharpness = null;
  let brightness = null;
  try {
    const { data } = await sharp(buffer)
      .rotate()
      .resize({ width: ANALYZE_SIZE, height: ANALYZE_SIZE, fit: "fill" })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const stats = analyzeFrame(data, ANALYZE_SIZE, ANALYZE_SIZE);
    sharpness = stats.sharpness;
    brightness = stats.brightness;
    if (sharpness < env.RECOGNITION_MIN_SHARPNESS) reasons.push("blurry");
    if (env.RECOGNITION_MIN_BRIGHTNESS > 0 && brightness < env.RECOGNITION_MIN_BRIGHTNESS) reasons.push("too_dark");
  } catch {
    reasons.push("not_an_image"); // decode failed on pixel pass
  }

  return {
    ok: reasons.length === 0,
    decode_error: false,
    width,
    height,
    sharpness: sharpness === null ? null : Math.round(sharpness * 10) / 10,
    brightness: brightness === null ? null : Math.round(brightness),
    reasons,
  };
}

/** Mean-absolute Laplacian (edge energy) + mean luminance on a raw grey frame. */
function analyzeFrame(px, w, h) {
  let sum = 0;
  let lapSum = 0;
  let lapCount = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      sum += px[i];
      const lap = 4 * px[i] - px[i - 1] - px[i + 1] - px[i - w] - px[i + w];
      lapSum += Math.abs(lap);
      lapCount += 1;
    }
  }
  const n = w * h;
  return { brightness: sum / n, sharpness: lapSum / Math.max(lapCount, 1) };
}

module.exports = { inspectImage, sha256, analyzeFrame };
