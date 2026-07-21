const DEFAULT_BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || "3002";
const PUBLIC_FRONTEND_HOST = import.meta.env.VITE_PUBLIC_FRONTEND_HOST || "103.204.53.106";
const PUBLIC_BACKEND_URL = import.meta.env.VITE_PUBLIC_API_BASE_URL || `http://${PUBLIC_FRONTEND_HOST}:${DEFAULT_BACKEND_PORT}`;

export function getBackendBaseUrl() {
  if (typeof window === "undefined") {
    return import.meta.env.VITE_API_BASE_URL || PUBLIC_BACKEND_URL;
  }

  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  const { hostname, protocol } = window.location;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

  if (isLocalhost) {
    return `${protocol}//${hostname}:${DEFAULT_BACKEND_PORT}`;
  }

  if (hostname === PUBLIC_FRONTEND_HOST) {
    return PUBLIC_BACKEND_URL;
  }

  return `${protocol}//${hostname}:${DEFAULT_BACKEND_PORT}`;
}

export function buildApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getBackendBaseUrl()}${normalizedPath}`;
}
