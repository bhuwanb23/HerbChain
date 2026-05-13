/**
 * Central API client for the HerbChain backend.
 *
 * - Base URL is taken from `extra.API_BASE_URL` (app.json -> expo.extra) or
 *   falls back to a smart Expo dev-host resolver that maps to the LAN IP /
 *   `10.0.2.2` on Android emulators.
 * - Injects `Authorization: Bearer <token>` when a token is supplied.
 * - Unpacks the consistent backend envelope `{ data, error }`:
 *     - 2xx + `data` set    -> resolves with `data`
 *     - 2xx no envelope     -> resolves with parsed body
 *     - non-2xx OR `error`  -> throws an ApiError carrying the envelope error
 *
 * Usage:
 *     import api from 'App/services/apiClient';
 *     const me = await api.get('/api/v1/auth/me', { token });
 *     const created = await api.post('/api/v1/batches', { body: {...}, token });
 */

import Constants from 'expo-constants';
import { API_BASE_URL as RESOLVED_DEV_BASE_URL } from '../constants/api';

const expoExtra = (Constants?.expoConfig?.extra) || (Constants?.manifest?.extra) || {};
const CONFIGURED_BASE_URL = (expoExtra.API_BASE_URL || '').trim();

export const API_BASE_URL = CONFIGURED_BASE_URL || RESOLVED_DEV_BASE_URL;

export class ApiError extends Error {
  constructor({ code, message, status, details }) {
    super(message || code || `HTTP ${status}`);
    this.name = 'ApiError';
    this.code = code || 'unknown';
    this.status = status || 0;
    this.details = details || null;
  }
}

const DEFAULT_TIMEOUT_MS = 20000;

async function _fetch(method, path, { body, token, headers, timeoutMs } = {}) {
  if (!path || typeof path !== 'string') {
    throw new ApiError({ code: 'bad_request', message: 'API path is required', status: 0 });
  }
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  const finalHeaders = {
    'Accept': 'application/json',
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers || {}),
  };

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    timeoutMs || DEFAULT_TIMEOUT_MS,
  );

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new ApiError({
        code: 'timeout',
        message: `Request to ${path} timed out`,
        status: 0,
      });
    }
    throw new ApiError({
      code: 'network_error',
      message: err.message || 'Network request failed',
      status: 0,
    });
  }
  clearTimeout(timeout);

  let parsed = null;
  const text = await response.text();
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch (_e) {
      parsed = { raw: text };
    }
  }

  // Envelope: { data, error }
  if (parsed && typeof parsed === 'object' && 'error' in parsed && 'data' in parsed) {
    if (response.ok && !parsed.error) {
      return parsed.data;
    }
    if (parsed.error) {
      throw new ApiError({
        code: parsed.error.code || 'unknown',
        message: parsed.error.message || `HTTP ${response.status}`,
        status: response.status,
        details: parsed.error.details || null,
      });
    }
  }

  if (response.ok) {
    return parsed;
  }
  throw new ApiError({
    code: 'http_error',
    message: (parsed && parsed.message) || `HTTP ${response.status}`,
    status: response.status,
  });
}

const api = {
  baseUrl: API_BASE_URL,
  get: (path, opts) => _fetch('GET', path, opts),
  post: (path, opts) => _fetch('POST', path, opts),
  put: (path, opts) => _fetch('PUT', path, opts),
  patch: (path, opts) => _fetch('PATCH', path, opts),
  delete: (path, opts) => _fetch('DELETE', path, opts),
};

export default api;

// -----------------------------------------------------------------------------
// Typed helpers per resource. Centralising these keeps every screen in sync
// with the backend contract and makes it easy to swap implementation later.
// -----------------------------------------------------------------------------

export const AuthAPI = {
  register: (payload) => api.post('/api/v1/auth/register', { body: payload }),
  login: (identifier, password) =>
    api.post('/api/v1/auth/login', { body: { identifier, password } }),
  refresh: (refreshToken) =>
    api.post('/api/v1/auth/refresh', { token: refreshToken }),
  me: (token) => api.get('/api/v1/auth/me', { token }),
};

export const BatchesAPI = {
  create: (token, payload) => api.post('/api/v1/batches', { token, body: payload }),
  listMine: (token) => api.get('/api/v1/batches/mine', { token }),
  get: (token, batchId) => api.get(`/api/v1/batches/${batchId}`, { token }),
  getQr: (token, batchId) => api.get(`/api/v1/batches/${batchId}/qr`, { token }),
  transfer: (token, batchId, payload) =>
    api.post(`/api/v1/batches/${batchId}/transfer`, { token, body: payload }),
  availableForLab: (token) => api.get('/api/v1/batches/available/for-lab', { token }),
  availableForManufacturer: (token) =>
    api.get('/api/v1/batches/available/for-manufacturer', { token }),
  requestTesting: (token, batchId) =>
    api.post(`/api/v1/batches/${batchId}/request-testing`, { token }),
  placeOrder: (token, batchId) =>
    api.post(`/api/v1/batches/${batchId}/order`, { token }),
  events: (token, batchId) => api.get(`/api/v1/batches/${batchId}/events`, { token }),
};

export const LabReportsAPI = {
  create: (token, payload) => api.post('/api/v1/lab-reports', { token, body: payload }),
  listForBatch: (token, batchId) =>
    api.get(`/api/v1/lab-reports/batch/${batchId}`, { token }),
  get: (token, reportId) => api.get(`/api/v1/lab-reports/${reportId}`, { token }),
};

export const ProductsAPI = {
  create: (token, payload) => api.post('/api/v1/products', { token, body: payload }),
  listMine: (token) => api.get('/api/v1/products/mine', { token }),
  get: (token, productId) => api.get(`/api/v1/products/${productId}`, { token }),
  getQr: (token, productId) => api.get(`/api/v1/products/${productId}/qr`, { token }),
};

export const TraceabilityAPI = {
  batch: (batchId) => api.get(`/api/v1/traceability/batch/${batchId}`),
  product: (productId) => api.get(`/api/v1/traceability/product/${productId}`),
  resolve: (qrToken) =>
    api.post('/api/v1/traceability/resolve', { body: { qr_token: qrToken } }),
};

export const AdminAPI = {
  stats: (token) => api.get('/admin/api/stats', { token }),
  users: (token, opts = {}) => {
    const query = opts.role ? `?role=${encodeURIComponent(opts.role)}` : '';
    return api.get(`/admin/api/users${query}`, { token });
  },
  batches: (token, opts = {}) => {
    const query = opts.phase ? `?phase=${encodeURIComponent(opts.phase)}` : '';
    return api.get(`/admin/api/batches${query}`, { token });
  },
  products: (token) => api.get('/admin/api/products', { token }),
  events: (token, opts = {}) => {
    const query = opts.batchId ? `?batch_id=${encodeURIComponent(opts.batchId)}` : '';
    return api.get(`/admin/api/events${query}`, { token });
  },
  health: () => api.get('/admin/api/health'),
};
