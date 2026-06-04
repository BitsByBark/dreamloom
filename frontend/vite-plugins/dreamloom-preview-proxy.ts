import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import {
  injectPreviewHead,
  PREVIEW_BRIDGE_PREFIX,
  previewBridgeScript,
} from "../panels/center/preview-bridge";

const PREFIX = PREVIEW_BRIDGE_PREFIX;
const bridgeScript = previewBridgeScript();

function parsePreviewPath(url: string): { port: number; targetPath: string } | null {
  if (!url.startsWith(PREFIX)) {
    return null;
  }

  const rest = url.slice(PREFIX.length);
  const match = rest.match(/^\/(\d+)(\/.*)?$/);
  if (!match) {
    return null;
  }

  const port = Number.parseInt(match[1], 10);
  if (!Number.isFinite(port) || port <= 0 || port > 65535) {
    return null;
  }

  const targetPath = match[2] ?? "/";
  return { port, targetPath };
}

async function proxyRequest(
  req: IncomingMessage,
  res: ServerResponse,
  port: number,
  targetPath: string,
): Promise<void> {
  const targetUrl = new URL(targetPath, `http://127.0.0.1:${port}`);
  if (req.url?.includes("?")) {
    const query = req.url.slice(req.url.indexOf("?"));
    targetUrl.search = query;
  }

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (key === "host" || key === "connection") continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        headers.append(key, v);
      }
    } else if (typeof value === "string") {
      headers.set(key, value);
    }
  }
  headers.set("host", `127.0.0.1:${port}`);

  const method = req.method ?? "GET";
  const upstream = await fetch(targetUrl, { method, headers, redirect: "manual" });
  const contentType = upstream.headers.get("content-type") ?? "";

  res.statusCode = upstream.status;
  upstream.headers.forEach((value, key) => {
    if (key === "transfer-encoding") return;
    res.setHeader(key, value);
  });

  if (contentType.includes("text/html") && upstream.ok) {
    let html = await upstream.text();
    html = injectPreviewHead(html, port, bridgeScript);
    res.setHeader("content-type", contentType);
    res.setHeader("content-length", String(new TextEncoder().encode(html).length));
    res.end(html, "utf8");
    return;
  }

  if (upstream.body) {
    const reader = upstream.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  }
  res.end();
}

export function dreamloomPreviewProxy(): Plugin {
  return {
    name: "dreamloom-preview-proxy",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const httpReq = req as IncomingMessage;
        const url = httpReq.url?.split("?")[0] ?? "";
        const parsed = parsePreviewPath(url);
        if (!parsed) {
          next();
          return;
        }

        void proxyRequest(httpReq, res, parsed.port, parsed.targetPath).catch((err) => {
          console.error("[dreamloom-preview-proxy]", err);
          if (!res.headersSent) {
            res.statusCode = 502;
            res.end("Preview proxy error");
          }
        });
      });
    },
  };
}
