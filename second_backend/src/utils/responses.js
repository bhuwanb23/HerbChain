/**
 * Consistent JSON response envelope (mirrors backend/server/utils/responses.py).
 *
 *   ok(res, payload, status)     -> { "data": payload, "error": null }
 *   error(res, code, msg, status)-> { "data": null, "error": { code, message } }
 */

function ok(res, data = null, status = 200) {
  return res.status(status).json({ data, error: null });
}

function error(res, code, message, status = 400, extra = null) {
  const err = { code, message };
  if (extra) err.details = extra;
  return res.status(status).json({ data: null, error: err });
}

module.exports = { ok, error };