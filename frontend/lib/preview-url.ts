const PREVIEW_HOST = "127.0.0.1";

export function previewBaseUrl(port: number): string {
  return `http://${PREVIEW_HOST}:${port}`;
}

export function previewPageUrl(port: number, route: string): string {
  const normalizedRoute = route.startsWith("/") ? route : `/${route}`;
  return `${previewBaseUrl(port)}${normalizedRoute}`;
}
