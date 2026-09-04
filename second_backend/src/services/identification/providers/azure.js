/**
 * Azure Custom Vision provider driver (docs/phase_4.md Option 2 / Stage 3-4).
 *
 * Custom-trained ML image classification: POST the raw image bytes to the
 * published iteration and read the per-tag probabilities. Tag names are the
 * training labels (species aliases) and still pass through the species
 * resolver — the resolver is the single source of truth for master mapping.
 *
 * Gate: AZURE_CV_ENDPOINT + AZURE_CV_PREDICTION_KEY + AZURE_CV_PROJECT_ID.
 * Missing -> ProviderError (ai_unavailable) so registration never blocks.
 */
const { env } = require("../../../config/env");

const MODEL_VERSION = "1.0";

class ProviderError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ProviderError";
    this.code = code;
  }
}

function isConfigured() {
  return Boolean(env.AZURE_CV_ENDPOINT && env.AZURE_CV_PREDICTION_KEY && env.AZURE_CV_PROJECT_ID && env.AZURE_CV_PUBLISHED_NAME);
}

async function azureDetect(buffer, { mimeType = "image/jpeg", topK = 3 } = {}) {
  if (!isConfigured()) throw new ProviderError("provider_not_configured", "Azure Custom Vision is not configured");

  const base = env.AZURE_CV_ENDPOINT.replace(/\/+$/, "");
  const url =
    `${base}/customvision/v3.0/Prediction/${encodeURIComponent(env.AZURE_CV_PROJECT_ID)}` +
    `/classify/iterations/${encodeURIComponent(env.AZURE_CV_PUBLISHED_NAME)}/image`;

  let res;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Ocp-Apim-Subscription-Key": env.AZURE_CV_PREDICTION_KEY,
      },
      body: new Uint8Array(buffer),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
  } catch {
    throw new ProviderError("provider_timeout", "Azure Custom Vision request failed (timeout or network)");
  }

  if (!res.ok) {
    throw new ProviderError("provider_error", `Azure Custom Vision responded ${res.status}`);
  }
  const payload = await res.json();
  const predictions = (payload.predictions || [])
    .slice(0, topK)
    .map((p) => ({
      label: String(p.tagName || "").trim(),
      confidence: Math.round((Number(p.probability) || 0) * 1000) / 10,
    }))
    .filter((p) => p.label);

  return {
    predictions,
    model: { provider: "azure_custom_vision", name: env.AZURE_CV_PUBLISHED_NAME, version: MODEL_VERSION },
  };
}

module.exports = { azureDetect, ProviderError, MODEL_VERSION, isConfigured };
