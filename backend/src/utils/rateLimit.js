/**
 * Fixed-window in-memory rate limiter (docs/auth/architecture.md §6).
 * Swappable for Redis behind the same interface when deployed.
 */
const { error } = require("./responses");

function createRateLimiter({ windowMs = 60 * 1000, max = 20, keyFn = (req) => req.ip || "anon" } = {}) {
  const buckets = new Map();

  return function rateLimit(req, res, next) {
    const key = keyFn(req);
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (bucket.count >= max) {
      return error(res, "rate_limited", "Too many requests — try again shortly", 429);
    }
    bucket.count += 1;
    return next();
  };
}

module.exports = { createRateLimiter };
