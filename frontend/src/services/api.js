import axios from 'axios';
import { Capacitor } from '@capacitor/core';

// Production Railway backend URL — baked in at build time via .env.production
const PRODUCTION_BACKEND = 'https://chatapp-production-df23.up.railway.app';

/**
 * Dynamically resolve the API base URL on every request.
 *
 * Priority (highest → lowest):
 *  1. chatify_custom_server_url in localStorage (user can override in Login > Server Settings)
 *  2. VITE_API_URL build-time env variable (.env.production sets this to Railway URL)
 *  3. VITE_SOCKET_URL build-time env variable (fallback)
 *  4. '/api' — relative path, works on web via Vite proxy / Vercel rewrites
 *
 * On Capacitor native WebView:
 *  - Relative paths ('/api') do NOT resolve to the backend.
 *  - We always use an absolute HTTPS URL on native.
 *  - If env vars are still localhost/blank, we fall back to the production Railway URL.
 */
const getBaseUrl = () => {
  // 1. User-saved custom server URL (highest priority — runtime override)
  const customUrl = localStorage.getItem('chatify_custom_server_url');
  if (customUrl && customUrl.trim()) {
    let clean = customUrl.trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api')) clean = `${clean}/api`;
    return clean;
  }

  // 2. Build-time environment variables
  const envApiUrl = import.meta.env.VITE_API_URL;
  const envSocketUrl = import.meta.env.VITE_SOCKET_URL;
  let url = envApiUrl || envSocketUrl;

  // 3. On Capacitor native: must use an absolute URL
  if (Capacitor.isNativePlatform()) {
    if (!url || url.includes('localhost') || url.includes('127.0.0.1')) {
      // Env var was not set or still points to localhost — use hardcoded production URL.
      // This only happens if the APK was built without .env.production being applied correctly.
      url = PRODUCTION_BACKEND;
    }
  }

  // 4. Relative path for web (Vercel/Vite proxy handles routing to backend)
  if (!url) {
    return '/api';
  }

  url = url.trim().replace(/\/+$/, '');
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000, // 20-second timeout for slow mobile networks
});

// Request interceptor:
// 1. Re-resolve baseURL on every request (handles custom URL saved after init)
// 2. Attach JWT Bearer token
api.interceptors.request.use(
  (config) => {
    // Re-resolve dynamically so custom server URL changes take effect immediately
    const freshBaseUrl = getBaseUrl();
    if (freshBaseUrl) {
      config.baseURL = freshBaseUrl;
    }

    // Attach Bearer token
    const token = localStorage.getItem('chatify_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear stale auth data
      localStorage.removeItem('chatify_token');
      localStorage.removeItem('chatify_user');

      // Fire a custom event so AuthContext / React Router can handle navigation cleanly.
      // This avoids hard page reloads in Capacitor which would reset the entire WebView.
      window.dispatchEvent(new CustomEvent('chatify_auth_expired'));

      // Fallback redirect after 500ms if the event wasn't caught
      const isOnAuthPage =
        window.location.pathname.includes('/login') ||
        window.location.pathname.includes('/register') ||
        window.location.pathname === '/';

      if (!isOnAuthPage) {
        setTimeout(() => {
          const stillUnauth =
            !localStorage.getItem('chatify_token') &&
            !window.location.pathname.includes('/login') &&
            !window.location.pathname.includes('/register') &&
            window.location.pathname !== '/';

          if (stillUnauth) {
            window.location.href = '/login';
          }
        }, 500);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
