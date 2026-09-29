import { Capacitor } from '@capacitor/core';

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
      backendUrl = 'http://192.168.29.158:5000';
    }
  }
  if (!backendUrl) {
    backendUrl = 'http://localhost:5000';
  }

  backendUrl = backendUrl.trim().replace(/\/+$/, '');
  if (backendUrl.endsWith('/api')) {
    backendUrl = backendUrl.substring(0, backendUrl.length - 4);
  }

  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${backendUrl}${cleanPath}`;
};

export default getMediaUrl;
