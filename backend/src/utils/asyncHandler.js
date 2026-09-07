/**
 * Wraps an async Express handler so rejected promises are forwarded to the
 * error middleware instead of crashing the process (Express 4 doesn't do
 * this automatically for async handlers).
 */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { asyncHandler };