export function getBackendUrl() {
  // In local dev, route API calls through Vite proxy to avoid browser CORS errors.
  if (import.meta.env.DEV) {
    return '/addhelper';
  }

  return import.meta.env.VITE_BACKEND_URL || 'https://gen-proj.duckdns.org/addhelper';
}

