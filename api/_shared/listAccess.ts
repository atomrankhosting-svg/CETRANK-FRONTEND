import { getBackendBaseUrl, getOriginGuardHeaders } from "./backendProxy.js";
import { getEnv, getSupabaseConfig } from "./paymentUtils.js";

export const PREVIEW_COLLEGE_COUNT = 5;
export const MIN_LIST_OPTIONS_FOR_CREDIT = 30;

export interface CutoffFilters {
  student_name?: string;
  user_category: string;
  user_minority_list: string[];
  user_home_university: string;
  user_gender: string;
  city?: string[] | null;
  division?: string[] | null;
  percentile_cet: number;
  percentile_ai: number;
  is_tech?: boolean;
  is_electronic?: boolean;
  is_other?: boolean;
  is_civil?: boolean;
  is_mechanical?: boolean;
  is_electrical?: boolean;
  is_ews: boolean;
  is_tfws?: boolean;
  location_flexibility?: 1 | 2 | 3;
  course_type?: "engineering" | "pharmacy";
  course_names?: string[];
  cap_no?: 1 | 2 | 3 | null;
}

export interface CutoffBackendResponse {
  results: Record<string, unknown>[];
  count: number;
  user_details: Record<string, unknown>;
}

const supabaseRestHeaders = (key: string, prefer?: string) => ({
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  ...(prefer ? { Prefer: prefer } : {}),
});

const getSupabaseAnonKey = () =>
  getEnv("SUPABASE_ANON_KEY") || getEnv("VITE_SUPABASE_ANON_KEY");

/** Service role bypasses RLS; otherwise use the caller's JWT so RLS policies apply. */
const buildSupabaseHeaders = (accessToken: string, prefer?: string) => {
  const { key, usingServiceRole } = getSupabaseConfig();

  if (usingServiceRole && key) {
    return supabaseRestHeaders(key, prefer);
  }

  const anonKey = getSupabaseAnonKey();
  if (!anonKey) {
    throw new Error("Supabase anon key is not configured on the server.");
  }

  return {
    apikey: anonKey,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
};

const getBearerToken = (req: { headers?: Record<string, string | string[] | undefined> }): string | null => {
  const authHeader = req.headers?.authorization ?? req.headers?.Authorization;
  if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
};

export async function verifySupabaseUser(
  req: { headers?: Record<string, string | string[] | undefined> },
): Promise<{ userId: string; email?: string; accessToken: string }> {
  const token = getBearerToken(req);
  if (!token) {
    throw new AuthError("Missing or invalid Authorization header.");
  }

  const { url } = getSupabaseConfig();
  const apikey = getSupabaseAnonKey() || getSupabaseConfig().key;
  if (!url || !apikey) {
    throw new Error("Supabase is not configured on the server.");
  }

  const response = await fetch(`${url.replace(/\/+$/, "")}/auth/v1/user`, {
    headers: {
      apikey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new AuthError("Invalid or expired session token.");
  }

  const data: { id?: string; email?: string; user?: { id?: string; email?: string } } =
    await response.json();
  const userId = data.id ?? data.user?.id;
  const email = data.email ?? data.user?.email;
  if (!userId) {
    throw new AuthError("Could not resolve authenticated user.");
  }

  return { userId, email, accessToken: token };
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export async function getUserCredits(userId: string, accessToken: string): Promise<number> {
  const { url } = getSupabaseConfig();
  if (!url) {
    throw new Error("Supabase is not configured on the server.");
  }

  const queryUrl =
    `${url.replace(/\/+$/, "")}/rest/v1/user_credits` +
    `?user_id=eq.${encodeURIComponent(userId)}` +
    "&select=available_credits";

  const response = await fetch(queryUrl, {
    headers: buildSupabaseHeaders(accessToken),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to read user credits: ${errorText}`);
  }

  const rows: { available_credits?: number }[] = await response.json();
  if (rows.length === 0) {
    return 0;
  }

  const credits = rows[0]?.available_credits;
  return typeof credits === "number" && Number.isFinite(credits) ? credits : 0;
}

const normalizeCutoffResponse = (
  data: unknown,
  filters: CutoffFilters,
): CutoffBackendResponse => {
  if (Array.isArray(data)) {
    return {
      results: data as Record<string, unknown>[],
      count: data.length,
      user_details: { ...filters },
    };
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const results = Array.isArray(record.results)
      ? record.results
      : Array.isArray(record.colleges)
        ? record.colleges
        : Array.isArray(record.data)
          ? record.data
          : [];

    const mappedResults = results.map((result) => {
      if (!result || typeof result !== "object") return result;
      const row = result as Record<string, unknown>;
      const responseCategory =
        typeof (record.user_details as Record<string, unknown> | undefined)?.user_category === "string"
          ? (record.user_details as Record<string, unknown>).user_category
          : filters.user_category;

      return {
        ...row,
        user_category:
          typeof row.user_category === "string" && row.user_category
            ? row.user_category
            : responseCategory,
      };
    }) as Record<string, unknown>[];

    return {
      results: mappedResults,
      count: typeof record.count === "number" ? record.count : mappedResults.length,
      user_details:
        (record.user_details as Record<string, unknown> | undefined) ?? { ...filters },
    };
  }

  return { results: [], count: 0, user_details: { ...filters } };
};

export async function fetchCutoffsFromBackend(
  filters: CutoffFilters,
  req: { headers?: Record<string, string | string[] | undefined> },
): Promise<CutoffBackendResponse> {
  const backendBaseUrl = getBackendBaseUrl();
  if (!backendBaseUrl) {
    throw new Error("API_GATEWAY_URL or BACKEND_URL is not configured.");
  }

  const isPharmacy = filters.course_type === "pharmacy";
  const upstreamPath = isPharmacy ? "v1/get-pharmacy-cutoffs" : "v1/get-cutoffs";
  const targetUrl = new URL(`/api/${upstreamPath}`, backendBaseUrl);

  const payload: Record<string, unknown> = { ...filters };
  delete payload.course_type;
  if (isPharmacy) {
    payload.course_names = filters.course_names ?? ["Pharmacy", "Pharm D ( Doctor of Pharmacy)"];
  }

  const originHeaders = getOriginGuardHeaders(req);

  const response = await fetch(targetUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...originHeaders,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new UpstreamError(response.status, detail || `Upstream request failed (${response.status})`);
  }

  const data = await response.json();
  return normalizeCutoffResponse(data, filters);
}

export class UpstreamError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "UpstreamError";
    this.status = status;
  }
}

export async function saveListAndDeductCredit(
  userId: string,
  listData: { results: unknown[]; user_details: unknown; count: number },
  currentCredits: number,
  accessToken: string,
): Promise<{ newCreditBalance: number }> {
  const { url } = getSupabaseConfig();
  if (!url) {
    throw new Error("Supabase is not configured on the server.");
  }

  const baseUrl = url.replace(/\/+$/, "");
  const authHeaders = buildSupabaseHeaders(accessToken, "return=minimal");

  const insertResponse = await fetch(`${baseUrl}/rest/v1/college_lists`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      user_id: userId,
      list_data: listData,
    }),
  });

  if (!insertResponse.ok) {
    const errorText = await insertResponse.text();
    throw new Error(`Failed to save list to history: ${errorText}`);
  }

  const newCreditBalance = currentCredits - 1;
  const updateResponse = await fetch(
    `${baseUrl}/rest/v1/user_credits?user_id=eq.${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ available_credits: newCreditBalance }),
    },
  );

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    throw new Error(`List saved but credit deduction failed: ${errorText}`);
  }

  return { newCreditBalance };
}

export function buildListResponse(
  backend: CutoffBackendResponse,
  options: {
    isLocked: boolean;
    creditNotCharged?: boolean;
    creditsRemaining?: number;
  },
) {
  const totalCount = backend.count;
  const results =
    options.isLocked
      ? backend.results.slice(0, PREVIEW_COLLEGE_COUNT)
      : backend.results;

  return {
    results,
    count: totalCount,
    user_details: backend.user_details,
    is_locked: options.isLocked,
    ...(options.creditNotCharged ? { credit_not_charged: true } : {}),
    ...(options.creditsRemaining !== undefined ? { credits_remaining: options.creditsRemaining } : {}),
  };
}
