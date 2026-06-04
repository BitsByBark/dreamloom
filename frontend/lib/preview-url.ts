import { PREVIEW_BRIDGE_PREFIX } from "$panels/center/preview-bridge";

const PREVIEW_HOST = "127.0.0.1";

export function previewBaseUrl(port: number): string {
  return `http://${PREVIEW_HOST}:${port}`;
}

/** Same-origin path via Dreamloom Vite proxy (injects preview bridge script into HTML). */
export function previewPageUrl(port: number, route: string): string {
  const normalizedRoute = route.startsWith("/") ? route : `/${route}`;
  return `${PREVIEW_BRIDGE_PREFIX}/${port}${normalizedRoute}`;
}
