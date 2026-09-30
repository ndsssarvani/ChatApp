import { Capacitor } from '@capacitor/core';

const PRODUCTION_BACKEND = 'https://chatapp-production-df23.up.railway.app';

export const getMediaUrl = (url) => {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }

  const customUrl = localStorage.getItem('chatify_custom_server_url');
  let backendUrl = customUrl || import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL;

  if (Capacitor.isNativePlatform()) {
    if (!backendUrl || backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1')) {
      backendUrl = PRODUCTION_BACKEND;
    }
  }

  if (!backendUrl) {
    backendUrl = 'http://localhost:5000';
  }

  backendUrl = backendUrl.trim().replace(/\/+$/, '');
  if (backendUrl.endsWith('/api')) {
    backendUrl = backendUrl.slice(0, -4);
  }

  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${backendUrl}${cleanPath}`;
};

export default getMediaUrl;
