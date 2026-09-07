/** Parse jsonwebtoken-style durations ("15m", "30d", "1h", "90s") to ms. */
function parseDuration(value, fallbackMs) {
  const raw = String(value ?? "").trim();
  const m = /^(\d+)\s*(ms|s|m|h|d)?$/.exec(raw);
  if (!m) return fallbackMs;
  const n = parseInt(m[1], 10);
  switch (m[2] || "ms") {
    case "ms":
      return n;
    case "s":
      return n * 1000;
    case "m":
      return n * 60 * 1000;
    case "h":
      return n * 60 * 60 * 1000;
    case "d":
      return n * 24 * 60 * 60 * 1000;
    default:
      return fallbackMs;
  }
}

module.exports = { parseDuration };
