import { proxyToBackend } from "../../_shared/upstreamProxy.js";

/**
 * Vercel only routes one segment through api/v1/[...path].ts.
 * Nested metadata paths (/api/v1/metadata/engg) need this handler.
 */
export default async function handler(req: any, res: any) {
  const segment = req.query?.path;
  const pathSegment = Array.isArray(segment) ? segment[0] : segment;

  if (typeof pathSegment !== "string" || !pathSegment.length) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ detail: "Missing metadata path segment." }));
    return;
  }

  return proxyToBackend(req, res, `v1/metadata/${pathSegment}`);
}
