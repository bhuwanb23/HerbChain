/**
 * Central HerbChain HTTP client for the website.
 *
 * - Base URL from `import.meta.env.VITE_API_BASE_URL` or falls back to
 *   `http://localhost:5000` for local dev.
 * - Injects `Authorization: Bearer <token>` if a token is passed.
 * - Unwraps the consistent `{ data, error }` envelope; throws `ApiError` on
 *   non-2xx or envelope errors.
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

// -------- Typed resource helpers --------

export const AuthAPI = {
  login: (identifier, password) =>
    api.post('/api/v1/auth/login', { body: { identifier, password } }),
  me: (token) => api.get('/api/v1/auth/me', { token }),
};

export const AdminAPI = {
  stats: (token) => api.get('/admin/api/stats', { token }),
  users: (token, opts = {}) => {
    const q = opts.role ? `?role=${encodeURIComponent(opts.role)}` : '';
    return api.get(`/admin/api/users${q}`, { token });
  },
  batches: (token, opts = {}) => {
    const q = opts.phase ? `?phase=${encodeURIComponent(opts.phase)}` : '';
    return api.get(`/admin/api/batches${q}`, { token });
  },
  events: (token, opts = {}) => {
    const q = opts.batchId ? `?batch_id=${encodeURIComponent(opts.batchId)}` : '';
    return api.get(`/admin/api/events${q}`, { token });
  },
  products: (token) => api.get('/admin/api/products', { token }),
  lab_reports: (token) => api.get('/admin/api/lab-reports', { token }),
  health: () => api.get('/admin/api/health'),
};

export const TraceabilityAPI = {
  batch: (batchId) => api.get(`/api/v1/traceability/batch/${batchId}`),
  product: (productId) => api.get(`/api/v1/traceability/product/${productId}`),
  resolve: (qrToken) =>
    api.post('/api/v1/traceability/resolve', { body: { qr_token: qrToken } }),
};
