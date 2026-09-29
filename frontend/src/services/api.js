import axios from 'axios';
import { Capacitor } from '@capacitor/core';

const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL;
  if (!url) {
    // If running inside Capacitor native webview (iOS/Android), relative URLs will fail against localhost webview
    if (Capacitor.isNativePlatform()) {
      return 'http://10.0.2.2:5000/api'; // Android emulator host alias (127.0.0.1 on host machine)
    }
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
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('chatify_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle common errors like 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token invalid or expired
      localStorage.removeItem('chatify_token');
      localStorage.removeItem('chatify_user');
      // If not already on login or register, redirect
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register') &&
        window.location.pathname !== '/'
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
