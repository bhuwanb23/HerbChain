/**
 * Central API client for the HerbChain backend (backend — Node/Prisma).
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
 * Phase A0 cutover: every namespace below speaks the backend contract
 * (docs/database/architecture.md §6). Dead Flask-era prefixes are gone.
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
  /** multipart upload helper — body must be a ready FormData instance. */
  upload: (path, { file, token, fields, headers, timeoutMs } = {}) => {
    const form = new FormData();
    if (file) form.append('file', file);
    if (fields) Object.entries(fields).forEach(([k, v]) => form.append(k, String(v)));
    return _fetch('POST', path, { token, headers: { 'Content-Type': 'multipart/form-data', ...(headers || {}) }, body: form, timeoutMs });
  },
};

export default api;

// -----------------------------------------------------------------------------
// Typed helpers per resource — backend contract (Phases 1-17).
// Verify shapes against backend/src/modules/*/*Routes.js.
// -----------------------------------------------------------------------------

export const AuthAPI = {
  register: (payload) => api.post('/api/v1/auth/register', { body: payload }),
  login: (identifier, password) =>
    api.post('/api/v1/auth/login', { body: { identifier, password } }),
  refresh: (refreshToken) =>
    api.post('/api/v1/auth/refresh', { body: { refresh_token: refreshToken } }),
  me: (token) => api.get('/api/v1/auth/me', { token }),
  updateMe: (token, payload) => api.patch('/api/v1/auth/me', { token, body: payload }),
  changePassword: (token, payload) => api.post('/api/v1/auth/change-password', { token, body: payload }),
  forgotPassword: (payload) => api.post('/api/v1/auth/forgot-password', { body: payload }),
  resetPassword: (payload) => api.post('/api/v1/auth/reset-password', { body: payload }),
  logout: (token) => api.post('/api/v1/auth/logout', { token }),
  sessions: (token) => api.get('/api/v1/auth/sessions', { token }),
  revokeSession: (token, id) => api.delete(`/api/v1/auth/sessions/${id}`, { token }),
};

export const SpeciesAPI = {
  list: (token, q) =>
    api.get(`/api/v1/species${q ? `?q=${encodeURIComponent(q)}` : ''}`, { token }),
  get: (token, code) => api.get(`/api/v1/species/${encodeURIComponent(code)}`, { token }),
};

export const BatchesAPI = {
  // POST body: { species_id|species_code|identification_id, quantity, unit,
  //              harvest_date (ISO datetime), cultivation_type, gps_lat, gps_lng,
  //              gps_accuracy?, location?, asset_ids[], primary_asset_id?, attributes? }
  create: (token, payload) => api.post('/api/v1/batches', { token, body: payload }),
  listMine: (token, opts = {}) =>
    api.get(`/api/v1/batches/mine?offset=${opts.offset || 0}&limit=${opts.limit || 50}`, { token }),
  get: (token, batchId) => api.get(`/api/v1/batches/${batchId}`, { token }),
  history: (token, batchId) => api.get(`/api/v1/batches/${batchId}/history`, { token }),
  getQr: (token, batchId) => api.get(`/api/v1/batches/${batchId}/qr`, { token }),
  qrHistory: (token, batchId) => api.get(`/api/v1/batches/${batchId}/qr/history`, { token }),
  // forward trace: which products consumed this batch
  productsFor: (token, batchId) => api.get(`/api/v1/batches/${batchId}/products`, { token }),
};

export const QrAPI = {
  validate: (token, qrToken, meta = {}) =>
    api.post('/api/v1/qr/validate', { token, body: { token: qrToken, ...meta } }),
  transfer: (token, qrToken) =>
    api.post('/api/v1/qr/transfer', { token, body: { token: qrToken } }),
  regenerate: (token, batchId, reason) =>
    api.post('/api/v1/qr/regenerate', { token, body: { batch_id: batchId, reason } }),
};

export const TransfersAPI = {
  // P5 two-party custody: receiver requests, holder approves/rejects.
  request: (token, payload) => api.post('/api/v1/transfers/request', { token, body: payload }),
  approve: (token, requestId) => api.post('/api/v1/transfers/approve', { token, body: { request_id: requestId } }),
  reject: (token, requestId, reason) =>
    api.post('/api/v1/transfers/reject', { token, body: { request_id: requestId, reason } }),
  cancel: (token, requestId) => api.post('/api/v1/transfers/cancel', { token, body: { request_id: requestId } }),
  execute: (token, qrToken, requestId) =>
    api.post('/api/v1/transfers/execute', { token, body: { token: qrToken, request_id: requestId } }),
  recover: (token, batchId, reason) =>
    api.post('/api/v1/transfers/recover', { token, body: { batch_id: batchId, reason } }),
  listRequests: (token, opts = {}) =>
    api.get(`/api/v1/transfers/requests?offset=${opts.offset || 0}&limit=${opts.limit || 50}`, { token }),
  getRequest: (token, requestId) => api.get(`/api/v1/transfers/requests/${requestId}`, { token }),
  addProof: (token, requestId, payload) =>
    api.post(`/api/v1/transfers/requests/${requestId}/proof`, { token, body: payload }),
  owner: (token, batchId) => api.get(`/api/v1/batches/${batchId}/owner`, { token }),
  ownershipHistory: (token, batchId) => api.get(`/api/v1/batches/${batchId}/ownership-history`, { token }),
};

export const ShipmentsAPI = {
  // POST body: { ref_type: 'batch', ref_id, shipment_type, priority?, to_user_id?,
  //              origin_location?, origin_gps_lat/lng?, destination_location?, destination_gps_lat/lng? }
  create: (token, payload) => api.post('/api/v1/shipments', { token, body: payload }),
  list: (token, opts = {}) => {
    const params = new URLSearchParams();
    if (opts.status) params.set('status', opts.status);
    if (opts.role) params.set('role', opts.role);
    if (opts.limit) params.set('limit', String(opts.limit));
    if (opts.offset) params.set('offset', String(opts.offset));
    const qs = params.toString();
    return api.get(`/api/v1/shipments${qs ? `?${qs}` : ''}`, { token });
  },
  get: (token, shipmentId) => api.get(`/api/v1/shipments/${shipmentId}`, { token }),
  timeline: (token, shipmentId) => api.get(`/api/v1/shipments/${shipmentId}/timeline`, { token }),
  assign: (token, shipmentId, transporterUserId) =>
    api.post(`/api/v1/shipments/${shipmentId}/assign`, { token, body: { transporter_user_id: transporterUserId } }),
  accept: (token, shipmentId) => api.post(`/api/v1/shipments/${shipmentId}/accept`, { token, body: {} }),
  decline: (token, shipmentId) => api.post(`/api/v1/shipments/${shipmentId}/decline`, { token, body: {} }),
  pickup: (token, shipmentId, payload) => api.post(`/api/v1/shipments/${shipmentId}/pickup`, { token, body: payload }),
  location: (token, shipmentId, payload) => api.post(`/api/v1/shipments/${shipmentId}/location`, { token, body: payload }),
  delay: (token, shipmentId, payload) => api.post(`/api/v1/shipments/${shipmentId}/delay`, { token, body: payload }),
  arrive: (token, shipmentId, payload) => api.post(`/api/v1/shipments/${shipmentId}/arrive`, { token, body: payload }),
  deliver: (token, shipmentId, payload) => api.post(`/api/v1/shipments/${shipmentId}/deliver`, { token, body: payload }),
  pod: (token, shipmentId, payload) => api.post(`/api/v1/shipments/${shipmentId}/pod`, { token, body: payload }),
  fail: (token, shipmentId, payload) => api.post(`/api/v1/shipments/${shipmentId}/fail`, { token, body: payload }),
  cancel: (token, shipmentId) => api.post(`/api/v1/shipments/${shipmentId}/cancel`, { token, body: {} }),
  documents: (token, shipmentId) => api.get(`/api/v1/shipments/${shipmentId}/documents`, { token }),
};

export const LabsAPI = {
  dashboard: (token) => api.get('/api/v1/labs/batches', { token }),
  queue: (token, opts = {}) =>
    api.get(`/api/v1/labs/batches${opts.status ? `?status=${encodeURIComponent(opts.status)}` : ''}`, { token }),
  receive: (token, payload) => api.post('/api/v1/labs/batches/receive', { token, body: payload }),
  batchDetail: (token, batchId) => api.get(`/api/v1/labs/batches/${batchId}`, { token }),
  createSample: (token, payload) => api.post('/api/v1/labs/samples', { token, body: payload }),
  listSamples: (token, opts = {}) =>
    api.get(`/api/v1/labs/samples${opts.batch_id ? `?batch_id=${opts.batch_id}` : ''}`, { token }),
  createTest: (token, payload) => api.post('/api/v1/labs/tests', { token, body: payload }),
  listTests: (token, opts = {}) => {
    const params = new URLSearchParams();
    if (opts.sample_id) params.set('sample_id', opts.sample_id);
    if (opts.status) params.set('status', opts.status);
    const qs = params.toString();
    return api.get(`/api/v1/labs/tests${qs ? `?${qs}` : ''}`, { token });
  },
  getTest: (token, testId) => api.get(`/api/v1/labs/tests/${testId}`, { token }),
  saveResults: (token, testId, payload) => api.post(`/api/v1/labs/tests/${testId}/results`, { token, body: payload }),
  submitTest: (token, testId) => api.post(`/api/v1/labs/tests/${testId}/submit`, { token, body: {} }),
  review: (token, payload) => api.post('/api/v1/labs/reviews', { token, body: payload }),
  listReviews: (token) => api.get('/api/v1/labs/reviews', { token }),
  issueCertificate: (token, payload) => api.post('/api/v1/labs/certificates', { token, body: payload }),
  listCertificates: (token, batchId) =>
    api.get(`/api/v1/labs/certificates${batchId ? `?batch_id=${batchId}` : ''}`, { token }),
  rejectBatch: (token, payload) => api.post('/api/v1/labs/reject', { token, body: payload }),
  documents: (token) => api.get('/api/v1/labs/documents', { token }),
  analytics: (token) => api.get('/api/v1/labs/analytics', { token }),
};

export const ManufacturerAPI = {
  dashboard: (token) => api.get('/api/v1/manufacturer/dashboard', { token }),
  marketplace: (token, opts = {}) => {
    const params = new URLSearchParams();
    if (opts.species) params.set('species', opts.species);
    if (opts.limit) params.set('limit', String(opts.limit));
    if (opts.offset) params.set('offset', String(opts.offset));
    const qs = params.toString();
    return api.get(`/api/v1/manufacturer/certified-batches${qs ? `?${qs}` : ''}`, { token });
  },
  certifiedBatch: (token, batchId) => api.get(`/api/v1/manufacturer/certified-batches/${batchId}`, { token }),
  requestBatch: (token, payload) => api.post('/api/v1/manufacturer/request-batch', { token, body: payload }),
  listRequests: (token) => api.get('/api/v1/manufacturer/requests', { token }),
  approveRequest: (token, requestId) => api.post(`/api/v1/manufacturer/requests/${requestId}/approve`, { token, body: {} }),
  rejectRequest: (token, requestId, reason) =>
    api.post(`/api/v1/manufacturer/requests/${requestId}/reject`, { token, body: { reason } }),
  cancelRequest: (token, requestId) => api.post(`/api/v1/manufacturer/requests/${requestId}/cancel`, { token, body: {} }),
  receive: (token, payload) => api.post('/api/v1/manufacturer/receive', { token, body: payload }),
  inventory: (token) => api.get('/api/v1/manufacturer/inventory', { token }),
  inventoryHistory: (token) => api.get('/api/v1/manufacturer/inventory/history', { token }),
  reserveItem: (token, itemId) => api.post(`/api/v1/manufacturer/inventory/${itemId}/reserve`, { token, body: {} }),
  releaseItem: (token, itemId) => api.post(`/api/v1/manufacturer/inventory/${itemId}/release`, { token, body: {} }),
  consumeItem: (token, itemId, payload) => api.post(`/api/v1/manufacturer/inventory/${itemId}/consume`, { token, body: payload }),
  adjustItem: (token, itemId, payload) => api.post(`/api/v1/manufacturer/inventory/${itemId}/adjust`, { token, body: payload }),
  discardItem: (token, itemId, payload) => api.post(`/api/v1/manufacturer/inventory/${itemId}/discard`, { token, body: payload }),
  qualityHolds: (token) => api.get('/api/v1/manufacturer/quality-holds', { token }),
  resolveHold: (token, holdId, payload) => api.post(`/api/v1/manufacturer/quality-holds/${holdId}/resolve`, { token, body: payload }),
  analytics: (token) => api.get('/api/v1/manufacturer/analytics', { token }),
};

export const ManufacturingAPI = {
  // POST body: { product_id, planned_units, ingredients: [{ inventory_item_id, quantity, unit }] }
  createBatch: (token, payload) => api.post('/api/v1/manufacturing/batches', { token, body: payload }),
  listBatches: (token) => api.get('/api/v1/manufacturing/batches', { token }),
  getBatch: (token, id) => api.get(`/api/v1/manufacturing/batches/${id}`, { token }),
  start: (token, id) => api.post(`/api/v1/manufacturing/batches/${id}/start`, { token, body: {} }),
  complete: (token, id, payload) => api.post(`/api/v1/manufacturing/batches/${id}/complete`, { token, body: payload }),
  lotQr: (token, lotId) => api.get(`/api/v1/manufacturing/lots/${lotId}/qr`, { token }),
  listLots: (token, opts = {}) => {
    const params = new URLSearchParams();
    if (opts.product_id) params.set('product_id', opts.product_id);
    const qs = params.toString();
    return api.get(`/api/v1/manufacturing/lots${qs ? `?${qs}` : ''}`, { token });
  },
  getLot: (token, lotId) => api.get(`/api/v1/manufacturing/lots/${lotId}`, { token }),
  cancel: (token, id, payload) => api.post(`/api/v1/manufacturing/batches/${id}/cancel`, { token, body: payload || {} }),
  dashboard: (token) => api.get('/api/v1/manufacturing/dashboard', { token }),
  impacts: (token, opts = {}) => {
    const params = new URLSearchParams();
    if (opts.status) params.set('status', opts.status);
    const qs = params.toString();
    return api.get(`/api/v1/manufacturing/impacts${qs ? `?${qs}` : ''}`, { token });
  },
  createImpact: (token, payload) => api.post('/api/v1/manufacturing/impacts', { token, body: payload }),
  resolveImpact: (token, impactId, payload) => api.post(`/api/v1/manufacturing/impacts/${impactId}/resolve`, { token, body: payload || {} }),
};

export const RecallAPI = {
  batchRecall: (token, batchId) => api.get(`/api/v1/manufacturer/recall/${batchId}`, { token }),
};

export const ProductsAPI = {
  // POST body: { name, sku?, category, pack_size?, description? }
  create: (token, payload) => api.post('/api/v1/products', { token, body: payload }),
  list: (token, opts = {}) =>
    api.get(`/api/v1/products${opts.status ? `?status=${opts.status}` : ''}`, { token }),
  get: (token, productId) => api.get(`/api/v1/products/${productId}`, { token }),
  update: (token, productId, payload) => api.patch(`/api/v1/products/${productId}`, { token, body: payload }),
  lineage: (token, productId) => api.get(`/api/v1/products/${productId}/lineage`, { token }),
  addFormula: (token, productId, payload) => api.post(`/api/v1/products/${productId}/formulas`, { token, body: payload }),
  removeFormula: (token, productId, formulaId) => api.delete(`/api/v1/products/${productId}/formulas/${formulaId}`, { token }),
  verifyQr: (token, qrToken) => api.post('/api/v1/products/qr/verify', { token, body: { token: qrToken } }),
  impacts: (token) => api.get('/api/v1/products/impacts', { token }),
  createImpact: (token, payload) => api.post('/api/v1/products/impacts', { token, body: payload }),
  resolveImpact: (token, impactId) => api.post(`/api/v1/products/impacts/${impactId}/resolve`, { token, body: {} }),
};

export const VerifyAPI = {
  // public (no login) — the consumer journey
  scan: (qrToken, meta = {}) => api.post('/api/v1/verify/scan', { body: { token: qrToken, ...meta } }),
  passport: (qrToken) => api.get(`/api/v1/verify/product/${encodeURIComponent(qrToken)}`),
  journey: (qrToken) => api.get(`/api/v1/verify/product/${encodeURIComponent(qrToken)}/journey`),
  certificate: (qrToken) => api.get(`/api/v1/verify/product/${encodeURIComponent(qrToken)}/certificate`),
  // authed analytics (lab/manufacturer/admin)
  analytics: (token) => api.get('/api/v1/verify/analytics', { token }),
  scans: (token, opts = {}) => {
    const params = new URLSearchParams();
    if (opts.outcome) params.set('outcome', opts.outcome);
    if (opts.product_id) params.set('product_id', opts.product_id);
    const qs = params.toString();
    return api.get(`/api/v1/verify/scans${qs ? `?${qs}` : ''}`, { token });
  },
  alerts: (token, opts = {}) =>
    api.get(`/api/v1/verify/alerts?status=${opts.status || 'open'}`, { token }),
  resolveAlert: (token, alertId, payload) =>
    api.post(`/api/v1/verify/alerts/${alertId}/resolve`, { token, body: payload }),
  // public (no login) — consumer feedback & report-fake
  feedback: (payload) => api.post('/verify/feedback', { body: payload }),
  reportFake: (payload) => api.post('/verify/report-fake', { body: payload }),
};

export const UploadsAPI = {
  // multipart/form-data with a `file` field; returns { asset: { id, url, ... } }
  image: (token, file, metadata) =>
    api.upload('/api/v1/uploads', { token, file, fields: metadata ? { metadata: JSON.stringify(metadata) } : undefined }),
};

export const IdentificationsAPI = {
  // multipart image -> { status, cached, quality, asset, identification }
  detect: (token, file, hint) =>
    api.upload('/api/v1/identifications/detect', { token, file, fields: hint ? { hint } : undefined }),
  confirm: (token, id, payload) => api.post(`/api/v1/identifications/${id}/confirm`, { token, body: payload }),
  mine: (token, opts = {}) =>
    api.get(`/api/v1/identifications/mine?offset=${opts.offset || 0}&limit=${opts.limit || 50}`, { token }),
  get: (token, id) => api.get(`/api/v1/identifications/${id}`, { token }),
};

export const SupportAPI = {
  list: (token, opts = {}) => {
    const params = new URLSearchParams();
    if (opts.status) params.set('status', opts.status);
    if (opts.category) params.set('category', opts.category);
    if (opts.limit) params.set('limit', String(opts.limit));
    if (opts.offset) params.set('offset', String(opts.offset));
    const qs = params.toString();
    return api.get(`/api/v1/support${qs ? `?${qs}` : ''}`, { token });
  },
  get: (token, id) => api.get(`/api/v1/support/${id}`, { token }),
  create: (token, payload) => api.post('/api/v1/support', { token, body: payload }),
  reply: (token, id, payload) => api.post(`/api/v1/support/${id}/messages`, { token, body: payload }),
  update: (token, id, payload) => api.put(`/api/v1/support/${id}`, { token, body: payload }),
  constants: (token) => api.get('/api/v1/support/constants', { token }),
};

export const NotificationsAPI = {
  inbox: (token, opts = {}) => {
    const params = new URLSearchParams();
    if (opts.unread_only) params.set('unread_only', 'true');
    if (opts.category) params.set('category', opts.category);
    if (opts.limit) params.set('limit', String(opts.limit));
    if (opts.offset) params.set('offset', String(opts.offset));
    const qs = params.toString();
    return api.get(`/api/v1/notifications${qs ? `?${qs}` : ''}`, { token });
  },
  unreadCount: (token) => api.get('/api/v1/notifications/unread', { token }),
  markRead: (token, ids, all = false) =>
    api.put('/api/v1/notifications/read', { token, body: all ? { all: true } : { ids } }),
  preferences: (token) => api.get('/api/v1/notifications/preferences', { token }),
  updatePreferences: (token, payload) => api.put('/api/v1/notifications/preferences', { token, body: payload }),
  devices: (token) => api.get('/api/v1/notifications/devices', { token }),
  registerDevice: (token, payload) => api.post('/api/v1/notifications/device', { token, body: payload }),
  removeDevice: (token, id) => api.delete(`/api/v1/notifications/device/${id}`, { token }),
};

export const DocumentsAPI = {
  list: (token, opts = {}) => {
    const params = new URLSearchParams();
    if (opts.doc_kind) params.set('doc_kind', opts.doc_kind);
    if (opts.limit) params.set('limit', String(opts.limit));
    const qs = params.toString();
    return api.get(`/api/v1/documents${qs ? `?${qs}` : ''}`, { token });
  },
  get: (token, id) => api.get(`/api/v1/documents/${id}`, { token }),
  upload: (token, file, fields) => api.upload('/api/v1/documents/upload', { token, file, fields }),
  metadata: (token, id, payload) => api.put(`/api/v1/documents/${id}/metadata`, { token, body: payload }),
  verify: (token, id) => api.post(`/api/v1/documents/${id}/verify`, { token, body: {} }),
  logs: (token, id) => api.get(`/api/v1/documents/${id}/logs`, { token }),
  createShare: (token, id, payload) => api.post(`/api/v1/documents/${id}/shares`, { token, body: payload }),
  revokeShare: (token, id, shareId) => api.delete(`/api/v1/documents/${id}/shares/${shareId}`, { token }),
  sharedView: (code) => api.get(`/api/v1/documents/shares/${code}`),
};

export const SyncAPI = {
  // P17 offline sync
  registerDevice: (token, payload) => api.post('/api/v1/devices/register', { token, body: payload }),
  revokeDevice: (token, deviceId) => api.post(`/api/v1/devices/${deviceId}/revoke`, { token, body: {} }),
  upload: (token, deviceId, items) =>
    api.post('/api/v1/sync/upload', { token, body: { device_id: deviceId, items } }),
  changes: (token, since) => api.get(`/api/v1/sync/changes?since=${encodeURIComponent(since)}`, { token }),
  status: (token) => api.get('/api/v1/sync/status', { token }),
  conflicts: (token) => api.get('/api/v1/sync/conflicts', { token }),
  resolveConflict: (token, conflictId, payload) =>
    api.post(`/api/v1/sync/conflicts/${conflictId}/resolve`, { token, body: payload }),
  analytics: (token) => api.get('/api/v1/sync/analytics', { token }),
};

export const AnalyticsAPI = {
  dashboard: (token, opts = {}) =>
    api.get(`/api/v1/analytics/dashboard${opts.state ? `?state=${encodeURIComponent(opts.state)}` : ''}`, { token }),
  herbs: (token, opts = {}) => api.get(`/api/v1/analytics/herbs?period=${opts.period || 'monthly'}`, { token }),
  certifications: (token, opts = {}) => api.get(`/api/v1/analytics/certifications?period=${opts.period || 'monthly'}`, { token }),
  failures: (token, opts = {}) => api.get(`/api/v1/analytics/failures?period=${opts.period || 'monthly'}`, { token }),
  regions: (token, opts = {}) => api.get(`/api/v1/analytics/regions?period=${opts.period || 'monthly'}`, { token }),
  logistics: (token, opts = {}) => api.get(`/api/v1/analytics/logistics?period=${opts.period || 'monthly'}`, { token }),
  manufacturers: (token, opts = {}) => api.get(`/api/v1/analytics/manufacturers?period=${opts.period || 'monthly'}`, { token }),
  consumers: (token, opts = {}) => api.get(`/api/v1/analytics/consumers?period=${opts.period || 'monthly'}`, { token }),
  traceability: (token, opts = {}) => api.get(`/api/v1/analytics/traceability?period=${opts.period || 'monthly'}`, { token }),
  compliance: (token, opts = {}) => api.get(`/api/v1/analytics/compliance?period=${opts.period || 'monthly'}`, { token }),
  blockchain: (token, opts = {}) => api.get(`/api/v1/analytics/blockchain?period=${opts.period || 'monthly'}`, { token }),
};

export const ReportsAPI = {
  generate: (token, payload) => api.post('/api/v1/reports/generate', { token, body: payload }),
  list: (token) => api.get('/api/v1/reports', { token }),
  download: (token, id) => api.get(`/api/v1/reports/${id}/download`, { token }),
  schedules: (token) => api.get('/api/v1/reports/schedules', { token }),
  createSchedule: (token, payload) => api.post('/api/v1/reports/schedules', { token, body: payload }),
  runSchedule: (token, id) => api.post(`/api/v1/reports/schedules/${id}/run`, { token, body: {} }),
  jobs: (token) => api.get('/api/v1/reports/jobs/runs', { token }),
};

export const BlockchainAPI = {
  dashboard: (token) => api.get('/api/v1/blockchain/dashboard', { token }),
  events: (token, opts = {}) => {
    const params = new URLSearchParams();
    if (opts.batch_id) params.set('batch_id', opts.batch_id);
    if (opts.limit) params.set('limit', String(opts.limit));
    const qs = params.toString();
    return api.get(`/api/v1/blockchain/events${qs ? `?${qs}` : ''}`, { token });
  },
  audit: (token, opts = {}) => api.get(`/api/v1/blockchain/audit?limit=${opts.limit || 100}`, { token }),
  nodes: (token) => api.get('/api/v1/blockchain/nodes', { token }),
  contracts: (token) => api.get('/api/v1/blockchain/contracts', { token }),
  process: (token) => api.post('/api/v1/blockchain/process', { token, body: {} }),
};

export const AdminAPI = {
  // identity admin (P2)
  users: (token, opts = {}) => {
    const params = new URLSearchParams();
    if (opts.role) params.set('role', opts.role);
    if (opts.status) params.set('status', opts.status);
    if (opts.limit) params.set('limit', String(opts.limit));
    const qs = params.toString();
    return api.get(`/api/v1/admin/users${qs ? `?${qs}` : ''}`, { token });
  },
  user: (token, id) => api.get(`/api/v1/admin/users/${id}`, { token }),
  approveUser: (token, id) => api.post(`/api/v1/admin/users/${id}/approve`, { token, body: {} }),
  rejectUser: (token, id) => api.post(`/api/v1/admin/users/${id}/reject`, { token, body: {} }),
  suspendUser: (token, id) => api.post(`/api/v1/admin/users/${id}/suspend`, { token, body: {} }),
  activateUser: (token, id) => api.post(`/api/v1/admin/users/${id}/activate`, { token, body: {} }),
  setRole: (token, id, role) => api.post(`/api/v1/admin/users/${id}/role`, { token, body: { role } }),
  // admin portal (P13)
  portalDashboard: (token, state) =>
    api.get(`/api/v1/admin/portal/dashboard${state ? `?state=${encodeURIComponent(state)}` : ''}`, { token }),
  search: (token, q, opts = {}) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (opts.state) params.set('state', opts.state);
    if (opts.limit) params.set('limit', String(opts.limit));
    const qs = params.toString();
    return api.get(`/api/v1/admin/portal/search${qs ? `?${qs}` : ''}`, { token });
  },
  portalBatch: (token, id) => api.get(`/api/v1/admin/portal/batches/${id}`, { token }),
  portalProduct: (token, id) => api.get(`/api/v1/admin/portal/products/${id}`, { token }),
  shipments: (token, opts = {}) => api.get(`/api/v1/admin/portal/shipments`, { token }),
  scores: (token) => api.get('/api/v1/admin/portal/scores', { token }),
  computeScores: (token) => api.post('/api/v1/admin/portal/scores/compute', { token, body: {} }),
  complianceAlerts: (token, opts = {}) =>
    api.get(`/api/v1/admin/portal/compliance-alerts?status=${opts.status || 'open'}`, { token }),
  updateComplianceAlert: (token, id, payload) =>
    api.put(`/api/v1/admin/portal/compliance-alerts/${id}`, { token, body: payload }),
  runComplianceRules: (token) => api.post('/api/v1/admin/portal/compliance-alerts/run-rules', { token, body: {} }),
  investigations: (token) => api.get('/api/v1/admin/portal/investigations', { token }),
  createInvestigation: (token, payload) => api.post('/api/v1/admin/portal/investigations', { token, body: payload }),
  investigation: (token, id) => api.get(`/api/v1/admin/portal/investigations/${id}`, { token }),
  recalls: (token) => api.get('/api/v1/admin/portal/recalls', { token }),
  createRecall: (token, payload) => api.post('/api/v1/admin/portal/recalls', { token, body: payload }),
  recall: (token, id) => api.get(`/api/v1/admin/portal/recalls/${id}`, { token }),
  failedCertifications: (token) => api.get('/api/v1/admin/portal/failed-certifications', { token }),
  audit: (token, opts = {}) => api.get(`/api/v1/admin/portal/audit?limit=${opts.limit || 100}`, { token }),
  portalNotifications: (token) => api.get('/api/v1/admin/portal/notifications', { token }),
  markPortalNotificationRead: (token, id) => api.put(`/api/v1/admin/portal/notifications/${id}/read`, { token, body: {} }),
  reports: (token) => api.get('/api/v1/admin/portal/reports', { token }),
  map: (token, opts = {}) => api.get(`/api/v1/admin/portal/map`, { token }),
  health: () => api.get('/api/v1/ping'),
};
