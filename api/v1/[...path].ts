import { getBackendBaseUrl, getOriginGuardHeaders } from "../_shared/backendProxy.js";

const sendJson = (res: any, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

const getRequestPath = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.filter((segment): segment is string => typeof segment === "string" && segment.length > 0);
  }

  if (typeof value === "string" && value.length > 0) {
    return [value];
  }

  return [];
};

const getUpstreamPath = (req: any): string => {
  const fromQuery = getRequestPath(req.query?.path);
  if (fromQuery.length > 0) {
    return fromQuery.join("/");
  }

  // Vercel sometimes omits catch-all query params; parse from the URL instead.
  const rawUrl = typeof req.url === "string" ? req.url : "";
  const pathname = rawUrl.split("?")[0] || "";
  const match = pathname.match(/\/api\/v1\/(.+)$/);
  return match?.[1] ?? "";
};

const getForwardBody = (req: any) => {
  if (req.method === "GET" || req.method === "HEAD") {
    return undefined;
  }

  if (typeof req.body === "string") {
    return req.body;
  }

  if (req.body === undefined || req.body === null) {
    return undefined;
  }

  return JSON.stringify(req.body);
};

export default async function handler(req: any, res: any) {
  let backendBaseUrl: string;
  try {
    backendBaseUrl = getBackendBaseUrl();
  } catch (error) {
    return sendJson(res, 500, {
      detail: error instanceof Error ? error.message : "Backend URL is not configured.",
    });
  }

  if (!backendBaseUrl) {
    return sendJson(res, 500, { detail: "API_GATEWAY_URL or BACKEND_URL is not configured." });
  }

  const upstreamPath = getUpstreamPath(req);
  if (!upstreamPath) {
    return sendJson(res, 400, { detail: "Missing upstream API path." });
  }

  const targetUrl = new URL(`/api/v1/${upstreamPath}`, backendBaseUrl);
  const query = req.query && typeof req.query === "object" ? req.query : {};

  for (const [key, value] of Object.entries(query)) {
    if (key === "path") continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") {
          targetUrl.searchParams.append(key, item);
        }
      }
      continue;
    }

    if (typeof value === "string") {
      targetUrl.searchParams.set(key, value);
    }
  }

  let originHeaders: Record<string, string>;
  try {
    originHeaders = getOriginGuardHeaders(req);
  } catch (error) {
    return sendJson(res, 500, {
      detail: error instanceof Error ? error.message : "Origin guard is not configured.",
    });
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        Accept: req.headers?.accept || "application/json",
        ...originHeaders,
        ...(req.headers?.["content-type"]
          ? { "Content-Type": req.headers["content-type"] }
          : {}),
        ...(req.headers?.authorization
          ? { Authorization: req.headers.authorization }
          : {}),
      },
      body: getForwardBody(req),
    });

    res.statusCode = response.status;

    const contentType = response.headers.get("content-type");
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    const cacheControl = response.headers.get("cache-control");
    if (cacheControl) {
      res.setHeader("Cache-Control", cacheControl);
    }

    res.end(await response.text());
  } catch (error) {
    console.error("[api/v1 proxy] Upstream request failed:", error);
    return sendJson(res, 502, {
      detail: error instanceof Error ? error.message : "Unable to reach upstream API.",
    });
  }
}
