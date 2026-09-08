/**
 * Recognition provider registry (docs/phase_4.md AI Service Layer).
 *
 * Selection order:
 *   1. env RECOGNITION_PROVIDER (mock | gemini | azure_custom_vision)
 *   2. auto: gemini key -> gemini, azure configured -> azure
 *   3. mock (offline dev/test default; rows stay visibly tagged "mock")
 *
 * Every provider exposes its model identity STATICALLY (modelName/version)
 * because the image-hash cache key needs it before the first call. The
 * detect() return value must agree with it (drivers export the same meta).
 *
 * Interface:
 *   detect(buffer, { mimeType, topK, mock }) -> { predictions, model }
 * Providers throw ProviderError when they cannot run — the service converts
 * that into a 503 `ai_unavailable` so registration never blocks.
 */
const { env } = require("../../../config/env");
const { mockDetect } = require("./mock");
const { geminiDetect, MODEL_VERSION: GEMINI_VERSION } = require("./gemini");
const { azureDetect, MODEL_VERSION: AZURE_VERSION } = require("./azure");

const PROVIDERS = {
  mock: {
    key: "mock",
    detect: mockDetect,
    modelName: "mock-classifier",
    modelVersion: "1.0",
  },
  gemini: {
    key: "gemini",
    detect: geminiDetect,
    modelName: env.GEMINI_MODEL || "gemini-1.5-flash",
    modelVersion: GEMINI_VERSION,
  },
  azure_custom_vision: {
    key: "azure_custom_vision",
    detect: azureDetect,
    modelName: env.AZURE_CV_PUBLISHED_NAME || "published",
    modelVersion: AZURE_VERSION,
  },
};

function resolveProvider() {
  const explicit = (env.RECOGNITION_PROVIDER || "").trim().toLowerCase();
  if (explicit === "mock" || explicit === "gemini" || explicit === "azure_custom_vision" || explicit === "azure") {
    const key = explicit === "azure" ? "azure_custom_vision" : explicit;
    return PROVIDERS[key];
  }
  if (env.GEMINI_API_KEY) return PROVIDERS.gemini;
  if (env.AZURE_CV_ENDPOINT && env.AZURE_CV_PREDICTION_KEY && env.AZURE_CV_PROJECT_ID && env.AZURE_CV_PUBLISHED_NAME) {
    return PROVIDERS.azure_custom_vision;
  }
  return PROVIDERS.mock; // offline default — rows visibly tagged "mock"
}

module.exports = { PROVIDERS, resolveProvider };
