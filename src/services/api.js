// API Service for Web Dashboard
// Same backend as mobile app - port 5001

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

// Log API configuration on load
console.log('🌐 Web Dashboard API Configuration:');
console.log('  - API Base URL:', API_BASE_URL);
console.log('  - Current Origin:', window.location.origin);

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
      console.log(`🔑 Using auth token: ${token.substring(0, 20)}...`);
    } else {
      console.warn('⚠️ Auth requested but no token found');
    }
  }

  console.log(`🌐 API Request: ${method} ${path}`);
  console.log(`   Full URL: ${API_BASE_URL}${path}`);
  if (body) {
    console.log('📦 Request body:', body);
  }

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    console.log(`📡 Response status: ${res.status} ${res.statusText}`);

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
      console.error('Response data:', data);
      throw new Error(message);
    }

    console.log(`✅ API Success:`, data);
    return data;
  } catch (error) {
    console.error(`❌ Fetch Error for ${method} ${path}:`, error);
    console.error('   Error type:', error.name);
    console.error('   Error message:', error.message);
    
    // Check if it's a network error
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      console.error('🚨 NETWORK ERROR - Possible causes:');
      console.error('   1. Backend server not running');
      console.error('   2. Wrong backend URL:', API_BASE_URL);
      console.error('   3. CORS not configured for:', window.location.origin);
      console.error('   4. Firewall blocking connection');
    }
    
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
