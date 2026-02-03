// API Service for Web Dashboard
// Same backend as mobile app - port 5001

// Backend URL: never call same origin (Vercel) for API – it returns 404. Always use Render when deployed.
const BACKEND_URL = 'https://village-work.onrender.com'.replace(/\/+$/, '');

const getApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    const url = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';
    return typeof url === 'string' ? url.replace(/\/+$/, '') : url;
  }
  const origin = window.location?.origin || '';
  // Deployed on Vercel or other host: use backend. Don’t use same origin (would 404).
  if (!window.location?.hostname?.includes('localhost')) return BACKEND_URL;
  const env = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';
  return typeof env === 'string' ? env.replace(/\/+$/, '') : env;
};
const API_BASE_URL = getApiBaseUrl();

const isDev = () => process.env.NODE_ENV === 'development';

// Sensitive keys - never log these in request/response
const SENSITIVE_KEYS = ['password', 'confirmPassword', 'token', 'accessToken', 'refreshToken', 'secret'];

function redact(obj) {
  if (obj == null || typeof obj !== 'object') return obj;
  const out = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const key of Object.keys(out)) {
    const k = key.toLowerCase();
    if (SENSITIVE_KEYS.some((s) => k.includes(s.toLowerCase()))) out[key] = '[REDACTED]';
    else if (typeof out[key] === 'object' && out[key] !== null) out[key] = redact(out[key]);
  }
  return out;
}

// Log API configuration on load (no credentials)
if (isDev()) {
  console.log('🌐 Web Dashboard API Configuration:');
  console.log('  - API Base URL:', API_BASE_URL);
  console.log('  - Current Origin:', typeof window !== 'undefined' ? window.location.origin : 'SSR');
}

function buildApiUrl(path) {
  const base = (getApiBaseUrl() || '').replace(/\/+$/, '');
  const p = (path && path.startsWith('/') ? path : `/${path || ''}`).replace(/^\/+/, '/');
  return `${base}${p}`;
}

// Get auth token from localStorage
function getAuthToken() {
  return localStorage.getItem('authToken');
}

// Set auth token and user
export function setAuth(token, user) {
  localStorage.setItem('authToken', token);
  localStorage.setItem('authUser', JSON.stringify(user));
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('userRole', user?.role || 'owner');
}

// Clear auth
export function clearAuth() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('userRole');
}

// Get current user
export function getCurrentUser() {
  const userStr = localStorage.getItem('authUser');
  return userStr ? JSON.parse(userStr) : null;
}

// API request helper
async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      if (isDev()) console.log('🔑 Using auth token');
    } else {
      if (isDev()) console.warn('⚠️ Auth requested but no token found');
    }
  }

  const url = buildApiUrl(path);
  // Never log request body - it may contain password/credentials
  if (isDev()) console.log(`🌐 API Request: ${method} ${path}`);
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (isDev()) console.log(`📡 Response status: ${res.status} ${res.statusText}`);

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!res.ok) {
      const message =
        (data && typeof data === 'object' && (data.error || data.message)) ||
        `Request failed (${res.status})`;
      console.error(`❌ API Error: ${message}`);
      if (isDev()) console.error('Response data:', redact(data));
      throw new Error(message);
    }

    // Never log full response for auth routes (contains token/user)
    const isAuthRoute = /\/api\/auth\//i.test(path);
    if (isDev() && !isAuthRoute) console.log('✅ API Success:', redact(data));
    else if (isDev()) console.log('✅ API Success');
    return data;
  } catch (error) {
    console.error(`❌ Fetch Error for ${method} ${path}:`, error.message);
    throw error;
  }
}

// API methods
export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};

export default api;
