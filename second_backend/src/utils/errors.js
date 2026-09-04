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

module.exports = { ApiError, TransferError };