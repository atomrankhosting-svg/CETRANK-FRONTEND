import { getRequestPath, proxyToBackend } from "./_shared/upstreamProxy.js";

const getUpstreamPath = (req: any): string => {
  const fromQuery = getRequestPath(req.query?.path);
  if (fromQuery.length > 0) {
    return fromQuery.join("/");
  }

  const rawUrl = typeof req.url === "string" ? req.url : "";
  const pathname = rawUrl.split("?")[0] || "";
  const match = pathname.match(/\/api\/(.+)$/);
  return match?.[1] ?? "";
};

export default async function handler(req: any, res: any) {
  return proxyToBackend(req, res, getUpstreamPath(req));
}
