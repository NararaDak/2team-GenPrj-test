const DEFAULT_BACKEND_URL = 'https://gen-proj.duckdns.org/addhelper';

const trimTrailingSlash = (value) => {
  const trimmed = value.replace(/\/+$/, '');
  return trimmed || '/';
};

export function getConfiguredBackendUrl() {
  return trimTrailingSlash(import.meta.env.VITE_BACKEND_URL?.trim() || DEFAULT_BACKEND_URL);
}

export function getBackendProxyPath() {
  const backendUrl = getConfiguredBackendUrl();

  try {
    return trimTrailingSlash(new URL(backendUrl).pathname || '/');
  } catch {
    if (backendUrl.startsWith('/')) {
      return trimTrailingSlash(backendUrl);
    }

    return '/addhelper';
  }
}

export function getBackendUrl() {
  // In local dev, route API calls through the Vite proxy to avoid browser CORS errors.
  if (import.meta.env.DEV) {
    return getBackendProxyPath();
  }

  return getConfiguredBackendUrl();
}

