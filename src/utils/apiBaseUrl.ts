const PRODUCTION_BACKEND_URL = "http://103.204.53.106:3002";

export function resolveApiBaseUrl(): string {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "");
  }

  if (typeof window === "undefined") {
    return PRODUCTION_BACKEND_URL;
  }

  const { protocol, hostname } = window.location;
  const isLocalHost = ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(hostname);

  if (isLocalHost) {
    const backendPort = import.meta.env.VITE_BACKEND_PORT || "3002";
    return `${protocol}//${hostname}:${backendPort}`;
  }

  return PRODUCTION_BACKEND_URL;
}

export function buildApiUrl(path: string): string {
  const baseUrl = resolveApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
