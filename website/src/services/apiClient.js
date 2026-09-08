/**
 * Central HerbChain HTTP client for the website (backend — Node/Prisma).
 *
 * - Base URL from `import.meta.env.VITE_API_BASE_URL` or falls back to
 *   `http://localhost:5000` for local dev (matches backend PORT=5000).
 * - Injects `Authorization: Bearer <token>` if a token is passed.
 * - Unwraps the consistent `{ data, error }` envelope; throws `ApiError` on
 *   non-2xx or envelope errors.
 *
 * Phase A0 cutover: AdminAPI speaks the P13 admin-portal contract
 * (`/api/v1/admin/portal/*` + `/api/v1/admin/users*`); TraceabilityAPI uses
 * the P12 verify + P10 products endpoints.
 */

export const API_BASE_URL =
  (import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  (typeof window !== 'undefined' && window.location.hostname
    ? `http://${window.location.hostname}:5000`
    : 'http://localhost:5000');

export class ApiError extends Error {
  constructor({ code, message, status, details }) {
    super(message || code || `HTTP ${status}`);
    this.name = 'ApiError';
    this.code = code || 'unknown';
    this.status = status || 0;
    this.details = details || null;
  }
}

async function request(method, path, { body, token, headers } = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const final = {
    Accept: 'application/json',
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers || {}),
  };

  let resp;
  try {
    resp = await fetch(url, {
      method,
      headers: final,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError({
      code: 'network_error',
      message: err.message || 'Network error',
      status: 0,
    });
  }

  let parsed = null;
  const text = await resp.text();
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch (_e) {
      parsed = { raw: text };
    }
  }

  if (parsed && typeof parsed === 'object' && 'data' in parsed && 'error' in parsed) {
    if (resp.ok && !parsed.error) return parsed.data;
    if (parsed.error) {
      throw new ApiError({
        code: parsed.error.code || 'unknown',
        message: parsed.error.message || `HTTP ${resp.status}`,
        status: resp.status,
        details: parsed.error.details,
      });
    }
  }
  if (resp.ok) return parsed;
  throw new ApiError({
    code: 'http_error',
    message: (parsed && parsed.message) || `HTTP ${resp.status}`,
    status: resp.status,
  });
}

const api = {
  baseUrl: API_BASE_URL,
  get: (path, opts) => request('GET', path, opts),
  post: (path, opts) => request('POST', path, opts),
  put: (path, opts) => request('PUT', path, opts),
  patch: (path, opts) => request('PATCH', path, opts),
  delete: (path, opts) => request('DELETE', path, opts),
};

export default api;

// -------- Typed resource helpers (backend contract) --------

export const AuthAPI = {
  login: (identifier, password) =>
    api.post('/api/v1/auth/login', { body: { identifier, password } }),
  me: (token) => api.get('/api/v1/auth/me', { token }),
  refresh: (refreshToken) =>
    api.post('/api/v1/auth/refresh', { body: { refresh_token: refreshToken } }),
  logout: (token) => api.post('/api/v1/auth/logout', { token }),
  changePassword: (token, payload) =>
    api.post('/api/v1/auth/change-password', { token, body: payload }),
  sessions: (token) => api.get('/api/v1/auth/sessions', { token }),
  revokeSession: (token, id) => api.delete(`/api/v1/auth/sessions/${id}`, { token }),
};

export const AdminAPI = {
  // identity admin (P2) — user management
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
  // admin portal (P13) — control tower
  stats: (token, state) =>
    api.get(`/api/v1/admin/portal/dashboard${state ? `?state=${encodeURIComponent(state)}` : ''}`, { token }),
  search: (token, q, opts = {}) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (opts.state) params.set('state', opts.state);
    if (opts.limit) params.set('limit', String(opts.limit));
    const qs = params.toString();
    return api.get(`/api/v1/admin/portal/search${qs ? `?${qs}` : ''}`, { token });
  },
  batches: (token, opts = {}) => {
    // P13 portal batch explorer — search by query, detail by id
    if (opts.batchId) return api.get(`/api/v1/admin/portal/batches/${opts.batchId}`, { token });
    return api.search(token, opts.q || '', opts);
  },
  batch: (token, id) => api.get(`/api/v1/admin/portal/batches/${id}`, { token }),
  product: (token, id) => api.get(`/api/v1/admin/portal/products/${id}`, { token }),
  events: (token, opts = {}) => api.get(`/api/v1/admin/portal/audit?limit=${opts.limit || 100}`, { token }),
  shipments: (token) => api.get('/api/v1/admin/portal/shipments', { token }),
  map: (token) => api.get('/api/v1/admin/portal/map', { token }),
  scores: (token) => api.get('/api/v1/admin/portal/scores', { token }),
  computeScores: (token) => api.post('/api/v1/admin/portal/scores/compute', { token, body: {} }),
  complianceAlerts: (token, opts = {}) =>
    api.get(`/api/v1/admin/portal/compliance-alerts?status=${opts.status || 'open'}`, { token }),
  updateComplianceAlert: (token, id, payload) =>
    api.put(`/api/v1/admin/portal/compliance-alerts/${id}`, { token, body: payload }),
  runComplianceRules: (token) =>
    api.post('/api/v1/admin/portal/compliance-alerts/run-rules', { token, body: {} }),
  investigations: (token) => api.get('/api/v1/admin/portal/investigations', { token }),
  createInvestigation: (token, payload) =>
    api.post('/api/v1/admin/portal/investigations', { token, body: payload }),
  investigation: (token, id) => api.get(`/api/v1/admin/portal/investigations/${id}`, { token }),
  recalls: (token) => api.get('/api/v1/admin/portal/recalls', { token }),
  createRecall: (token, payload) => api.post('/api/v1/admin/portal/recalls', { token, body: payload }),
  recall: (token, id) => api.get(`/api/v1/admin/portal/recalls/${id}`, { token }),
  failedCertifications: (token) => api.get('/api/v1/admin/portal/failed-certifications', { token }),
  audit: (token, opts = {}) => api.get(`/api/v1/admin/portal/audit?limit=${opts.limit || 100}`, { token }),
  portalNotifications: (token) => api.get('/api/v1/admin/portal/notifications', { token }),
  markPortalNotificationRead: (token, id) =>
    api.put(`/api/v1/admin/portal/notifications/${id}/read`, { token, body: {} }),
  reports: (token) => api.get('/api/v1/admin/portal/reports', { token }),
  lab_reports: (token) => api.get('/api/v1/admin/portal/failed-certifications', { token }),
  health: () => api.get('/api/v1/ping'),
};

// P16 analytics — the BI warehouse reads
export const AnalyticsAPI = {
  dashboard: (token, opts = {}) =>
    api.get(`/api/v1/analytics/dashboard${opts.state ? `?state=${encodeURIComponent(opts.state)}` : ''}`, { token }),
  herbs: (token, period = 'monthly') => api.get(`/api/v1/analytics/herbs?period=${period}`, { token }),
  certifications: (token, period = 'monthly') => api.get(`/api/v1/analytics/certifications?period=${period}`, { token }),
  failures: (token, period = 'monthly') => api.get(`/api/v1/analytics/failures?period=${period}`, { token }),
  regions: (token, period = 'monthly') => api.get(`/api/v1/analytics/regions?period=${period}`, { token }),
  logistics: (token, period = 'monthly') => api.get(`/api/v1/analytics/logistics?period=${period}`, { token }),
  manufacturers: (token, period = 'monthly') => api.get(`/api/v1/analytics/manufacturers?period=${period}`, { token }),
  consumers: (token, period = 'monthly') => api.get(`/api/v1/analytics/consumers?period=${period}`, { token }),
  traceability: (token, period = 'monthly') => api.get(`/api/v1/analytics/traceability?period=${period}`, { token }),
  compliance: (token, period = 'monthly') => api.get(`/api/v1/analytics/compliance?period=${period}`, { token }),
  blockchain: (token, period = 'monthly') => api.get(`/api/v1/analytics/blockchain?period=${period}`, { token }),
};

// P16 reports — CSV artifacts + schedules
export const ReportsAPI = {
  generate: (token, payload) => api.post('/api/v1/reports/generate', { token, body: payload }),
  list: (token) => api.get('/api/v1/reports', { token }),
  download: (token, id) => api.get(`/api/v1/reports/${id}/download`, { token }),
  schedules: (token) => api.get('/api/v1/reports/schedules', { token }),
  createSchedule: (token, payload) => api.post('/api/v1/reports/schedules', { token, body: payload }),
  runSchedule: (token, id) => api.post(`/api/v1/reports/schedules/${id}/run`, { token, body: {} }),
  jobs: (token) => api.get('/api/v1/reports/jobs/runs', { token }),
};

// P13 blockchain audit center
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

// P12 consumer verification — public (no login)
export const VerifyAPI = {
  scan: (qrToken, meta = {}) => api.post('/api/v1/verify/scan', { body: { token: qrToken, ...meta } }),
  passport: (qrToken) => api.get(`/api/v1/verify/product/${encodeURIComponent(qrToken)}`),
  journey: (qrToken) => api.get(`/api/v1/verify/product/${encodeURIComponent(qrToken)}/journey`),
  certificate: (qrToken) => api.get(`/api/v1/verify/product/${encodeURIComponent(qrToken)}/certificate`),
};

// P10 product lineage — replaces the old /traceability/* reads
export const TraceabilityAPI = {
  product: (token, productId) => api.get(`/api/v1/products/${productId}`, { token }),
  productLineage: (token, productId) => api.get(`/api/v1/products/${productId}/lineage`, { token }),
  batchProducts: (token, batchId) => api.get(`/api/v1/batches/${batchId}/products`, { token }),
  resolve: (qrToken) => api.post('/api/v1/verify/scan', { body: { token: qrToken } }),
};

// P14 documents — evidence repository
export const DocumentsAPI = {
  list: (token, opts = {}) => {
    const params = new URLSearchParams();
    if (opts.doc_kind) params.set('doc_kind', opts.doc_kind);
    if (opts.limit) params.set('limit', String(opts.limit));
    const qs = params.toString();
    return api.get(`/api/v1/documents${qs ? `?${qs}` : ''}`, { token });
  },
  get: (token, id) => api.get(`/api/v1/documents/${id}`, { token }),
  metadata: (token, id, payload) => api.put(`/api/v1/documents/${id}/metadata`, { token, body: payload }),
  verify: (token, id) => api.post(`/api/v1/documents/${id}/verify`, { token, body: {} }),
  logs: (token, id) => api.get(`/api/v1/documents/${id}/logs`, { token }),
};

// P14/15 notifications — inbox + preferences
export const NotificationsAPI = {
  inbox: (token, opts = {}) => {
    const params = new URLSearchParams();
    if (opts.unread_only) params.set('unread_only', 'true');
    if (opts.category) params.set('category', opts.category);
    if (opts.limit) params.set('limit', String(opts.limit));
    const qs = params.toString();
    return api.get(`/api/v1/notifications${qs ? `?${qs}` : ''}`, { token });
  },
  unreadCount: (token) => api.get('/api/v1/notifications/unread', { token }),
  markRead: (token, ids, all = false) =>
    api.put('/api/v1/notifications/read', { token, body: all ? { all: true } : { ids } }),
  preferences: (token) => api.get('/api/v1/notifications/preferences', { token }),
  updatePreferences: (token, payload) => api.put('/api/v1/notifications/preferences', { token, body: payload }),
};

// Support tickets
export const SupportAPI = {
  list: (token, opts = {}) => {
    const params = new URLSearchParams();
    if (opts.status) params.set('status', opts.status);
    if (opts.category) params.set('category', opts.category);
    if (opts.limit) params.set('limit', String(opts.limit));
    const qs = params.toString();
    return api.get(`/api/v1/support${qs ? `?${qs}` : ''}`, { token });
  },
  get: (token, id) => api.get(`/api/v1/support/${id}`, { token }),
  create: (token, payload) => api.post('/api/v1/support', { token, body: payload }),
  update: (token, id, payload) => api.put(`/api/v1/support/${id}`, { token, body: payload }),
};
