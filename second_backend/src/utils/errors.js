/**
 * Application error types (mirrors services/transfer_service.py's
 * TransferError and the http-status conventions used across routes).
 */

class ApiError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

/**
 * Raised when a scan / state-machine operation is not valid.
 * `code` maps to an HTTP status in the routes (see _handleTransferError).
 */
class TransferError extends ApiError {
  constructor(code, message) {
    super(code, message);
    this.name = "TransferError";
  }
}

// HTTP status per TransferError code — mirrors _handle_transfer_error in
// backend/server/routes/batches.py.
const TRANSFER_ERROR_STATUS = {
  not_found: 404,
  forbidden: 403,
  bad_request: 400,
  unauthorized: 401,
  invalid_qr: 400,
  stale_qr: 409,
  qr_state_mismatch: 409,
  invalid_transition: 409,
  not_approved: 409,
  self_transfer: 409,
  invalid_state: 409,
  internal_error: 500,
};

function transferErrorStatus(code) {
  return TRANSFER_ERROR_STATUS[code] ?? 400;
}

module.exports = { ApiError, TransferError, transferErrorStatus };