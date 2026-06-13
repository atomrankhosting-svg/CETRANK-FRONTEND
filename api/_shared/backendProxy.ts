/** Server-side upstream URL and headers for the Lambda API (origin guard). */

const DEFAULT_API_GATEWAY_STAGE = "prod";

/**
 * Resolve execute-api base URL including the HTTP API stage when required.
 * Examples:
 *   API_GATEWAY_URL=https://xxx.execute-api.../amazonaws.com + stage prod
 *     -> https://xxx.../prod
 *   API_GATEWAY_URL=https://xxx.../prod (unchanged)
 */
export function getBackendBaseUrl(): string {
  const configured =
    process.env.API_GATEWAY_URL ||
    process.env.BACKEND_URL ||
    process.env.VITE_API_BASE_URL;

  const trimmed = configured?.trim().replace(/\/+$/, "") ?? "";
  if (!trimmed) {
    return "";
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error(
      "Set API_GATEWAY_URL (or BACKEND_URL) to the full execute-api URL on Vercel. VITE_API_BASE_URL=/api is browser-only.",
    );
  }

  const stage = (process.env.API_GATEWAY_STAGE || DEFAULT_API_GATEWAY_STAGE)
    .trim()
    .replace(/^\/+|\/+$/g, "");

  if (!stage || stage === "$default") {
    return trimmed;
  }

  if (trimmed.endsWith(`/${stage}`)) {
    return trimmed;
  }

  return `${trimmed}/${stage}`;
}

export function getOriginGuardHeaders(req: {
  headers?: Record<string, string | string[] | undefined>;
}): Record<string, string> {
  const secret = process.env.ORIGIN_VERIFY_SECRET?.trim();
  if (!secret) {
    throw new Error("ORIGIN_VERIFY_SECRET is not configured on Vercel.");
  }

  const headers: Record<string, string> = {
    "X-Origin-Verify": secret,
  };

  const origin = req.headers?.origin;
  if (typeof origin === "string" && origin.length > 0) {
    headers.Origin = origin;
  }

  const referer = req.headers?.referer;
  if (typeof referer === "string" && referer.length > 0) {
    headers.Referer = referer;
  }

  return headers;
}
