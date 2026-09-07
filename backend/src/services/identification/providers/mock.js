/**
 * Mock provider — deterministic, offline, used for dev/test/e2e and whenever
 * no cloud keys are configured. NEVER deployed as a silent default: rows it
 * produces are visibly tagged model "mock-classifier" so model audits can
 * never confuse them with real recognition.
 *
 * Predictions come from the optional `mock` hint ("<label>|<confidence>|<c2>|<c3>"),
 * forwarded from the client ONLY when the active provider is mock.
 */
const MODEL = { provider: "mock", name: "mock-classifier", version: "1.0" };

async function mockDetect(buffer, { mimeType, topK = 3, mock = null } = {}) {
  const parts = typeof mock === "string" ? mock.split("|") : [];
  const label = (parts[0] || "Ashwagandha").trim();
  if (label.toUpperCase() === "NONE") return { predictions: [], model: MODEL }; // no plant detected

  const conf = Math.max(1, Math.min(100, parts[1] !== undefined ? Number(parts[1]) : 94));
  const second = Math.max(0, Math.min(100 - conf, parts[2] !== undefined ? Number(parts[2]) : 3));
  const third = Math.max(0, 100 - conf - second - (parts[3] !== undefined ? Number(parts[3]) : 1));

  const raw = [
    { label, confidence: conf },
    { label: "Tulsi", confidence: second },
    { label: "Giloy", confidence: third },
  ].filter((p) => p.confidence > 0);

  return { predictions: raw.slice(0, topK), model: MODEL };
}

module.exports = { mockDetect, MODEL };
