/**
 * Resolves media and upload URLs to always point to the backend server.
 * Handles both relative paths (/uploads/...) and absolute URLs (http://...).
 */
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

  let backendUrl =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_URL ||
    'http://localhost:5000';

  backendUrl = backendUrl.trim().replace(/\/+$/, '');
  if (backendUrl.endsWith('/api')) {
    backendUrl = backendUrl.substring(0, backendUrl.length - 4);
  }

  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${backendUrl}${cleanPath}`;
};

export default getMediaUrl;
