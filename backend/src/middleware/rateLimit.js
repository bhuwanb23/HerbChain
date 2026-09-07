/**
 * In-memory sliding-window rate limiter (spec: public portal security
 * controls — 100 requests/minute example). Keyed by IP, per window.
 *
 * In-process bucket table: fine for a single-node deployment and tests;
 * swap for Redis when the portal scales horizontally (docs/phase_11.md
 * notes the Redis option — the bucket shape ports 1:1).
 */

const buckets = new Map(); // `${prefix}:${ip}` -> { count, resetAt }

function rateLimit({ windowMs = 60000, max = 100, prefix = "rl", message = "Too many requests — please try again shortly" }) {
  return (req, res, next) => {
    if (!max || max <= 0) return next(); // disabled (0 in .env / tests)
    const now = Date.now();
    const key = `${prefix}:${req.ip || "unknown"}`;
    const bucket = buckets.get(key);

    // Periodic sweep to keep the map bounded (amortised O(1) on hit path).
    if (buckets.size > 10000) {
      for (const [k, b] of buckets) {
        if (b.resetAt <= now) buckets.delete(k);
      }
    }

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    bucket.count += 1;
    if (bucket.count > max) {
      const { error } = require("../utils/responses");
      res.set("Retry-After", String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
      return error(res, "rate_limited", message, 429);
    }
    return next();
  };
}

module.exports = { rateLimit, buckets };