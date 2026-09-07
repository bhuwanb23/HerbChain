/**
 * Gemini Vision provider driver (docs/phase_4.md Stage 1).
 *
 * Calls the REST generateContent API with the image inlined as base64 and a
 * strict-JSON instruction (responseMimeType = application/json). The result is
 * parsed into top-N {label, confidence} pairs — it is NEVER trusted as free
 * text: labels still pass through the species resolver before storage.
 *
 * Gate: env.GEMINI_API_KEY. Missing key -> ProviderError (ai_unavailable),
 * so the farmer falls back to manual entry — recognition never blocks.
 */
const { env } = require("../../../config/env");

const MODEL_NAME = () => env.GEMINI_MODEL || "gemini-1.5-flash";
const MODEL_VERSION = "1.0";

class ProviderError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ProviderError";
    this.code = code;
  }
}

async function geminiDetect(buffer, { mimeType = "image/jpeg", topK = 3 } = {}) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) throw new ProviderError("provider_not_configured", "Gemini API key not configured");

  const model = MODEL_NAME();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt =
    `You are a botanical image classifier for AYUSH medicinal plants (India). ` +
    `Identify the single herb or plant in the photo and return exactly ${topK} candidate species ` +
    `sorted by confidence (highest first). Use common Indian names (e.g. "Ashwagandha", "Tulsi", "Giloy") ` +
    `or the scientific name if the common name is unknown. Respond ONLY with JSON of the form ` +
    `{"predictions":[{"species":"name","confidence":94}]} where confidence is an integer 0-100. ` +
    `If no plant is visible, return {"predictions":[]}.`;

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: buffer.toString("base64") } },
        ],
      },
    ],
    generationConfig: { responseMimeType: "application/json", temperature: 0.2, maxOutputTokens: 256 },
  };

  let res;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
  } catch {
    throw new ProviderError("provider_timeout", "Gemini request failed (timeout or network)");
  }

  if (!res.ok) {
    throw new ProviderError("provider_error", `Gemini responded ${res.status}`);
  }
  const payload = await res.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ProviderError("provider_error", "Gemini returned malformed JSON");
  }
  const predictions = (parsed.predictions || [])
    .slice(0, topK)
    .map((p) => ({
      label: String(p.species || p.label || "").trim(),
      confidence: Math.max(0, Math.min(100, Number(p.confidence) || 0)),
    }))
    .filter((p) => p.label);

  return { predictions, model: { provider: "gemini", name: model, version: MODEL_VERSION } };
}

module.exports = { geminiDetect, ProviderError, MODEL_NAME, MODEL_VERSION };
