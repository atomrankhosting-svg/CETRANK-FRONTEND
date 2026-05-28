import {
  FC_ACK_DEPLOYED_MAX_FILE_SIZE_BYTES,
  FC_ACK_MAX_FILE_SIZE_BYTES,
  FC_ACK_VERCEL_SAFE_PAYLOAD_BYTES,
  estimateFcAcknowledgePayloadBytes,
  resolveFcAcknowledgeMimeType,
  type FcAcknowledgeAutofillData,
} from "./fcAcknowledge";

const DEFAULT_API_BASE_URL = "/api";

const normalizeApiBaseUrl = (value?: string) => {
  const trimmedValue = value?.trim();
  if (!trimmedValue) {
    return DEFAULT_API_BASE_URL;
  }

  if (!/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue.replace(/\/+$/, "");
  }

  try {
    const parsedUrl = new URL(trimmedValue);
    if (parsedUrl.pathname === "/" || parsedUrl.pathname === "") {
      parsedUrl.pathname = DEFAULT_API_BASE_URL;
    }

    return parsedUrl.toString().replace(/\/+$/, "");
  } catch {
    return trimmedValue.replace(/\/+$/, "");
  }
};

const envBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const isAbsolute = Boolean(envBaseUrl) && /^https?:\/\//i.test(envBaseUrl);

const BASE_URL = (import.meta.env.DEV && !isAbsolute)
  ? DEFAULT_API_BASE_URL
  : normalizeApiBaseUrl(envBaseUrl);
const API_ROOT = BASE_URL;

const buildApiUrl = (path: string) =>
  new URL(`${API_ROOT}${path.startsWith("/") ? path : `/${path}`}`, window.location.origin);

const getStringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const pickFirstStringList = (...values: unknown[]) => {
  for (const value of values) {
    const items = getStringList(value);
    if (items.length > 0) {
      return items;
    }
  }

  return [];
};

/** Split comma-separated entries (e.g. "Amravati Division, Nagpur Division") into distinct values. */
const splitAndDedupe = (items: string[]): string[] => {
  const unique = new Set<string>();
  for (const item of items) {
    for (const part of item.split(",")) {
      const trimmed = part.trim();
      if (trimmed) unique.add(trimmed);
    }
  }
  return Array.from(unique).sort();
};

export interface UserDetails {
  student_name?: string;
  user_gender: string;
  user_category: string;
  user_minority_list: string[];
  user_home_university: string;
  division?: string[];
  city?: string[];
  percentile_cet: number;
  percentile_ai: number;
  is_tech: boolean;
  is_civil: boolean;
  is_mechanical: boolean;
  is_electrical: boolean;
  is_electronic: boolean;
  is_other: boolean;
  is_ews: boolean;
  is_tfws?: boolean;
  calculated_bounds?: {
    min_percentile_cet: number;
    max_percentile_cet: number;
    min_percentile_ai: number;
    max_percentile_ai: number;
  };
}

export interface CutoffResponse {
  user_details: UserDetails;
  count: number;
  results: CollegeResult[];
}

export interface CutoffRequest {
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

export interface CollegeResult {
  [key: string]: string | number | boolean | null | undefined;
  CET_Percentile?: number;
  cet_percentile?: number;
  cutoff_percentile?: number;
  Percentile?: number;
  percentile?: number;
  merit_rank?: number | string;
  college_name?: string;
  College?: string;
  Name?: string;
  name?: string;
  branch_name?: string;
  Branch?: string;
  branch?: string;
  course_name?: string;
  city?: string;
  City?: string;
  category?: string;
  Category?: string;
  seat_type?: string;
  SeatType?: string;
  reservation_category?: string;
  user_category?: string;
  year?: string | number;
  Year?: string | number;
  round?: string | number;
  Round?: string | number;
  round_no?: string | number;
  home_university?: string;
  University?: string;
  status?: string;
  is_local?: boolean;
  is_cap_top?: boolean;
  is_tfws?: boolean;
}

export interface MetadataResponse {
  cities: string[];
  divisions: Record<string, string[]>;
  universities: string[];
  minorities: string[];
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export interface ChatResponse {
  query: string;
  answer: string;
  sql_generated: string;
  row_count: number;
  data: any[];
}

export class ApiError extends Error {
  status: number;
  detail?: string;

  constructor(status: number, message: string, detail?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

const parseErrorDetail = async (res: Response) => {
  const text = await res.text();

  try {
    const parsed = JSON.parse(text) as { detail?: string };
    return parsed.detail ?? text;
  } catch {
    return text;
  }
};

const readFileAsBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unable to read the uploaded file."));
        return;
      }

      const base64 = result.includes(",") ? result.split(",")[1] : result;
      if (!base64) {
        reject(new Error("The selected file could not be encoded."));
        return;
      }

      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Unable to read the uploaded file."));
    reader.readAsDataURL(file);
  });

export async function getColleges(params?: {
  city?: string;
  division?: string;
  is_minority?: boolean;
}) {
  const url = buildApiUrl("/colleges");
  if (params?.city) url.searchParams.set("city", params.city);
  if (params?.division) url.searchParams.set("division", params.division);
  if (params?.is_minority !== undefined) {
    url.searchParams.set("is_minority", String(params.is_minority));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch colleges");
  return res.json();
}

export async function getBranches(params?: {
  college_code?: string;
  branch_name?: string;
}) {
  const url = buildApiUrl("/branches");
  if (params?.college_code) url.searchParams.set("college_code", params.college_code);
  if (params?.branch_name) url.searchParams.set("branch_name", params.branch_name);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch branches");
  return res.json();
}

export async function getMetadata(courseType: "engineering" | "pharmacy" = "engineering"): Promise<MetadataResponse> {
  const endpoint = courseType === "pharmacy" ? "/v1/pharmacy-metadata" : "/v1/metadata";
  const res = await fetch(buildApiUrl(endpoint).toString());

  if (!res.ok) {
    const detail = await parseErrorDetail(res);
    throw new ApiError(res.status, `Failed to fetch metadata (${res.status})`, detail);
  }

  const rawData = await res.json();
  const data =
    rawData && typeof rawData === "object" && rawData.data && typeof rawData.data === "object"
      ? rawData.data
      : rawData;

  const rawDivisions = data?.divisions || data?.Divisions || {};
  let divisions: Record<string, string[]> = {};

  if (Array.isArray(rawDivisions)) {
    // Fallback for old array format (though unlikely based on user feedback)
    rawDivisions.forEach((d: string) => {
      divisions[d] = [];
    });
  } else if (typeof rawDivisions === "object") {
    divisions = rawDivisions;
  }

  return {
    cities: pickFirstStringList(data?.cities, data?.Cities).sort(),
    divisions,
    universities: pickFirstStringList(
      data?.universities,
      data?.Universities,
      data?.home_universities,
      data?.homeUniversities,
    ).sort(),
    minorities: pickFirstStringList(
      data?.minorities,
      data?.Minorities,
      data?.minority,
      data?.Minority,
      data?.minority_list,
      data?.minority_lists,
      data?.minorityList,
      data?.minorityLists,
      data?.minority_options,
      data?.minorityOptions,
      data?.minority_types,
      data?.minorityTypes,
      data?.user_minority_list,
      data?.userMinorityList,
    ),
  };
}

export async function getEligibleCutoffs(request: CutoffRequest): Promise<CutoffResponse> {
  const isPharmacy = request.course_type === "pharmacy";
  const endpoint = isPharmacy ? "/v1/get-pharmacy-cutoffs" : "/v1/get-cutoffs";
  const url = buildApiUrl(endpoint).toString();
  console.log("[getEligibleCutoffs] POST", url);

  const payload = { ...request };
  delete payload.course_type; // the backend might not expect it
  if (isPharmacy) {
    payload.course_names = request.course_names || ["Pharmacy", "Pharm D ( Doctor of Pharmacy)"];
  }

  console.log("[getEligibleCutoffs] Request body:", JSON.stringify(payload, null, 2));

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  console.log("[getEligibleCutoffs] Response status:", res.status);

  if (!res.ok) {
    const detail = await parseErrorDetail(res);
    console.error("[getEligibleCutoffs] API error:", res.status, detail);
    throw new ApiError(
      res.status,
      `Failed to fetch eligible cutoffs (${res.status})`,
      detail,
    );
  }

  const data = await res.json();

  console.log("[getEligibleCutoffs] Response keys:", data ? Object.keys(data) : "null/undefined");
  console.log("[getEligibleCutoffs] count:", data?.count, "| results length:", data?.results?.length);

  if (Array.isArray(data)) {
    console.log("[getEligibleCutoffs] Response is a direct array, length:", data.length);
    // If it's just an array, we synthesize a response object
    return {
      results: data,
      count: data.length,
      user_details: {
        ...request,
        is_electronic: request.is_electronic,
        is_other: request.is_other,
        is_civil: request.is_civil,
        is_mechanical: request.is_mechanical,
        is_electrical: request.is_electrical,
        is_tech: request.is_tech,
        is_ews: request.is_ews,
        is_tfws: request.is_tfws,
        percentile_cet: request.percentile_cet,
        percentile_ai: request.percentile_ai,
        student_name: request.student_name,
      } as UserDetails
    };
  }

  if (data && typeof data === "object") {
    const results = Array.isArray(data.results) ? data.results : 
                    Array.isArray(data.colleges) ? data.colleges :
                    Array.isArray(data.data) ? data.data : [];

    const responseCategory =
      typeof data.user_details?.user_category === "string" && data.user_details.user_category
        ? data.user_details.user_category
        : request.user_category;

    const mappedResults = results.map((result: any) =>
      result && typeof result === "object"
        ? {
            ...result,
            user_category:
              typeof result.user_category === "string" && result.user_category
                ? result.user_category
                : responseCategory,
          }
        : result,
    );

    return {
      results: mappedResults,
      count: data.count ?? mappedResults.length,
      user_details: data.user_details || {
        ...request,
        is_electronic: request.is_electronic,
        is_other: request.is_other,
        is_civil: request.is_civil,
        is_mechanical: request.is_mechanical,
        is_electrical: request.is_electrical,
        is_tech: request.is_tech,
        is_ews: request.is_ews,
        is_tfws: request.is_tfws,
        percentile_cet: request.percentile_cet,
        percentile_ai: request.percentile_ai,
        student_name: request.student_name,
      }
    };
  }

  console.warn("[getEligibleCutoffs] Returning empty response — no results found");
  return {
    results: [],
    count: 0,
    user_details: request as unknown as UserDetails
  };
}

export async function extractFcAcknowledgeDetails(file: File): Promise<FcAcknowledgeAutofillData> {
  const mimeType = resolveFcAcknowledgeMimeType(file.name, file.type);
  if (!mimeType) {
    throw new Error("Please upload a PDF or image file for the FC acknowledgement.");
  }

  if (file.size > FC_ACK_MAX_FILE_SIZE_BYTES) {
    throw new Error("The uploaded file must be 20 MB or smaller.");
  }

  if (!import.meta.env.DEV) {
    const estimatedPayloadBytes = estimateFcAcknowledgePayloadBytes(file.size);
    if (estimatedPayloadBytes > FC_ACK_VERCEL_SAFE_PAYLOAD_BYTES) {
      const maxSizeInMb = (FC_ACK_DEPLOYED_MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(1);
      throw new Error(
        `This file is too large for deployment upload. Please keep the FC acknowledgement under ${maxSizeInMb} MB, or upload a smaller/compressed image or PDF.`,
      );
    }
  }

  const payload = {
    file_name: file.name,
    mime_type: mimeType,
    file_data: await readFileAsBase64(file),
  };

  const extractionUrl = new URL("/api/v1/extract-fc-acknowledgement", window.location.origin);

  const res = await fetch(extractionUrl.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await parseErrorDetail(res);
    throw new ApiError(
      res.status,
      typeof detail === "string" && detail.trim()
        ? detail
        : `Failed to extract FC acknowledgement details (${res.status})`,
      detail,
    );
  }

  const data = await res.json();
  return (data?.data ?? data) as FcAcknowledgeAutofillData;
}

/* ── Application Form Extraction ── */

export const APP_FORM_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface ApplicationFormExtractedData {
  student_name: string | null;
  user_gender: "Male" | "Female" | null;
  user_category: string | null;
  user_home_university: string | null;
  percentile_cet: number | null;
  percentile_ai: number | null;
  is_ews: boolean;
  minority_detected: string | null;
}

export interface ApplicationFormExtractResponse {
  success: boolean;
  extracted_data?: ApplicationFormExtractedData;
  confidence?: "high" | "medium" | "low";
  error?: string;
}

export async function extractApplicationForm(
  file: File,
): Promise<ApplicationFormExtractResponse> {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type) && !file.type.startsWith("image/")) {
    throw new Error("Please upload a JPEG, PNG, or WEBP image.");
  }

  if (file.size > APP_FORM_MAX_FILE_SIZE_BYTES) {
    throw new Error("The uploaded file must be 10 MB or smaller.");
  }

  const mimeType = resolveFcAcknowledgeMimeType(file.name, file.type);
  if (!mimeType) {
    throw new Error("Unsupported file format. Please upload an image file.");
  }

  const payload = {
    file_name: file.name,
    mime_type: mimeType,
    file_data: await readFileAsBase64(file),
  };

  const extractionUrl = new URL(
    "/api/v1/extract-application-form",
    window.location.origin,
  );

  const res = await fetch(extractionUrl.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await parseErrorDetail(res);
    throw new ApiError(
      res.status,
      typeof detail === "string" && detail.trim()
        ? detail
        : "Could not extract data from the uploaded image. Please ensure it is a clear photo of your MHT-CET Application Form.",
      detail,
    );
  }

  const data = await res.json();
  return data as ApplicationFormExtractResponse;
}

export async function sendChatQuery(query: string, history: ChatMessage[] = []): Promise<ChatResponse> {
  const res = await fetch(buildApiUrl("/v1/chat").toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, history }),
  });

  if (!res.ok) {
    const detail = await parseErrorDetail(res);
    throw new ApiError(res.status, `Chat failed (${res.status})`, detail);
  }

  return res.json();
}

export const CATEGORIES = [
  "GOPEN",
  "LOPEN",
  "GOBCH",
  "LOBCH",
  "GSEBC",
  "LSEBC",
  "GSC",
  "LSC",
  "GST",
  "LST",
  "GVJN",
  "LVJN",
  "GNT1",
  "LNT1",
  "GNT2",
  "LNT2",
  "GNT3",
  "LNT3",
  "GOBC",
  "LOBC",
  "GEWS",
  "LEWS",
  "TFWS",
];

export const HOME_UNIVERSITIES = [
  "Dr. Babasaheb Ambedkar Marathwada University",
  "Dr. Babasaheb Ambedkar Technological University,Lonere",
  "Gondwana University",
  "Kavayitri Bahinabai Chaudhari North Maharashtra University, Jalgaon",
  "Mumbai University",
  "Punyashlok Ahilyadevi Holkar Solapur University",
  "Rashtrasant Tukadoji Maharaj Nagpur University",
  "SNDT Women's University",
  "Sant Gadge Baba Amravati University",
  "Savitribai Phule Pune University",
  "Shivaji University",
  "Swami Ramanand Teerth Marathwada University, Nanded",
];

export const BRANCH_FILTERS = [
  { key: "is_tech", label: "Computer / IT" },
  { key: "is_electronic", label: "Electronics" },
  { key: "is_electrical", label: "Electrical" },
  { key: "is_mechanical", label: "Mechanical" },
  { key: "is_civil", label: "Civil" },
  { key: "is_other", label: "Other" },
] as const;

export interface CreateOrderResponse {
  id: string;
  amount: number;
  currency: string;
}

export async function createRazorpayOrder(
  tier: "basic" | "standard" | "pro",
  couponCode?: string
): Promise<CreateOrderResponse> {
  const url = new URL("/api/v1/payment/create-order", window.location.origin).toString();
  const body: Record<string, string> = { tier };
  if (couponCode) body.coupon_code = couponCode;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await parseErrorDetail(res);
    throw new ApiError(res.status, `Failed to create Razorpay order (${res.status})`, detail);
  }

  return res.json();
}

export async function verifyRazorpaySignature(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ status: string }> {
  const url = new URL("/api/v1/payment/verify-signature", window.location.origin).toString();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await parseErrorDetail(res);
    throw new ApiError(res.status, `Payment signature verification failed (${res.status})`, detail);
  }

  return res.json();
}

export async function claimFreeCoupon(
  couponCode: string,
  tier: "basic" | "standard" | "pro"
): Promise<{ success: boolean; credits: number }> {
  const url = new URL("/api/v1/payment/claim-free-coupon", window.location.origin).toString();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ coupon_code: couponCode, tier }),
  });

  if (!res.ok) {
    const detail = await parseErrorDetail(res);
    throw new ApiError(res.status, detail || "Failed to claim free coupon.", detail);
  }

  return res.json();
}

