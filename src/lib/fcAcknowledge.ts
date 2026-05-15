export const FC_ACK_MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const FC_ACK_VERCEL_BODY_LIMIT_BYTES = Math.floor(4.5 * 1024 * 1024);
export const FC_ACK_VERCEL_SAFE_PAYLOAD_BYTES = FC_ACK_VERCEL_BODY_LIMIT_BYTES - 256 * 1024;
export const FC_ACK_DEPLOYED_MAX_FILE_SIZE_BYTES = Math.floor((FC_ACK_VERCEL_SAFE_PAYLOAD_BYTES * 3) / 4);

export interface FcAcknowledgeUploadPayload {
  file_name: string;
  mime_type: string;
  file_data: string;
}

export interface FcAcknowledgeAutofillData {
  student_name: string | null;
  user_gender: "Male" | "Female" | null;
  user_category: string | null;
  user_home_university: string | null;
  user_minority_list: string[];
  percentile_cet: number | null;
  percentile_ai: number | null;
  course_type: "engineering" | "pharmacy" | null;
  is_ews: boolean | null;
}

export const estimateFcAcknowledgePayloadBytes = (fileSize: number) =>
  Math.ceil(fileSize / 3) * 4 + 32 * 1024;

export const FC_ACK_RELIGION_OPTIONS = ["Not Applicable", "Muslim", "Jain", "Christian"] as const;

export const FC_ACK_LANGUAGE_OPTIONS = [
  "Not Applicable",
  "Gujarathi",
  "Gujar",
  "Hindi",
  "Sindhi",
  "Punjabi",
  "Tamil",
  "Malyalam",
  "Roman",
] as const;

const CATEGORY_NORMALIZERS: Array<[RegExp, FcAcknowledgeAutofillData["user_category"]]> = [
  [/\bTFWS\b/, "TFWS"],
  [/\bEWS\b/, "EWS"],
  [/\bOPEN\b|\bGOPEN\b|\bLOPEN\b/, "OPEN"],
  [/\bOBC\b|\bGOBCH\b|\bLOBCH\b|\bGOBC\b|\bLOBC\b/, "OBC"],
  [/\bSEBC\b|\bGSEBC\b|\bLSEBC\b/, "SEBC"],
  [/\bSC\b|\bGSC\b|\bLSC\b/, "SC"],
  [/\bST\b|\bGST\b|\bLST\b/, "ST"],
  [/\bVJNT\b|\bVJN?T\b|\bGVJN\b|\bLVJN\b/, "VJNT"],
  [/\bNT1\b|\bGNT1\b|\bLNT1\b/, "NT1"],
  [/\bNT2\b|\bGNT2\b|\bLNT2\b/, "NT2"],
  [/\bNT3\b|\bGNT3\b|\bLNT3\b/, "NT3"],
];

const MINORITY_ALIASES = new Map<string, string>([
  ["muslim", "Muslim"],
  ["jain", "Jain"],
  ["christian", "Christian"],
  ["gujarathi", "Gujarathi"],
  ["gujarati", "Gujarathi"],
  ["gujarathi linguistic minority", "Gujarathi"],
  ["gujar", "Gujar"],
  ["hindi", "Hindi"],
  ["sindhi", "Sindhi"],
  ["punjabi", "Punjabi"],
  ["tamil", "Tamil"],
  ["malyalam", "Malyalam"],
  ["malayalam", "Malyalam"],
  ["roman", "Roman"],
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const cleanString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const isSupportedFcAcknowledgeMimeType = (mimeType: string | null | undefined) =>
  mimeType === "application/pdf" || Boolean(mimeType && mimeType.startsWith("image/"));

export const resolveFcAcknowledgeMimeType = (fileName: string, mimeType?: string | null) => {
  if (isSupportedFcAcknowledgeMimeType(mimeType)) {
    return mimeType as string;
  }

  const lowered = fileName.toLowerCase();
  if (lowered.endsWith(".pdf")) return "application/pdf";
  if (lowered.endsWith(".png")) return "image/png";
  if (lowered.endsWith(".jpg") || lowered.endsWith(".jpeg")) return "image/jpeg";
  if (lowered.endsWith(".webp")) return "image/webp";
  if (lowered.endsWith(".heic")) return "image/heic";
  if (lowered.endsWith(".heif")) return "image/heif";
  return null;
};

export const extractJsonObject = (raw: string) => {
  const trimmed = raw.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1]?.trim() ?? trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    const objectMatch = candidate.match(/\{[\s\S]*\}/);
    if (!objectMatch) {
      throw new Error("Gemini response did not contain valid JSON.");
    }

    return JSON.parse(objectMatch[0]);
  }
};

export const normalizeCategory = (value: unknown): FcAcknowledgeAutofillData["user_category"] => {
  const cleaned = cleanString(value);
  if (!cleaned) {
    return null;
  }

  const upper = cleaned.toUpperCase();
  for (const [pattern, normalized] of CATEGORY_NORMALIZERS) {
    if (pattern.test(upper)) {
      return normalized;
    }
  }

  return null;
};

export const normalizeGender = (value: unknown): FcAcknowledgeAutofillData["user_gender"] => {
  const cleaned = cleanString(value)?.toLowerCase();
  if (!cleaned) {
    return null;
  }

  if (cleaned.startsWith("m")) return "Male";
  if (cleaned.startsWith("f")) return "Female";
  return null;
};

export const normalizeMinorityList = (value: unknown) => {
  const sourceItems = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,\n/]+/)
      : [];

  const normalized = new Set<string>();
  for (const item of sourceItems) {
    const cleaned = cleanString(item)?.toLowerCase();
    if (!cleaned) continue;

    const alias = MINORITY_ALIASES.get(cleaned);
    if (alias) {
      normalized.add(alias);
    }
  }

  return Array.from(normalized);
};

export const normalizePercentile = (value: unknown) => {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return Math.min(100, Math.max(0, Number(value.toFixed(2))));
  }

  const cleaned = cleanString(value);
  if (!cleaned) {
    return null;
  }

  const parsed = Number.parseFloat(cleaned.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.min(100, Math.max(0, Number(parsed.toFixed(2))));
};

export const normalizeCourseType = (value: unknown): FcAcknowledgeAutofillData["course_type"] => {
  const cleaned = cleanString(value)?.toLowerCase();
  if (!cleaned) {
    return null;
  }

  if (cleaned.includes("pharmacy") || cleaned.includes("pharm")) {
    return "pharmacy";
  }

  if (
    cleaned.includes("engineering") ||
    cleaned.includes("b.e") ||
    cleaned.includes("b.e.") ||
    cleaned.includes("btech") ||
    cleaned.includes("b.tech")
  ) {
    return "engineering";
  }

  return null;
};

export const normalizeAutofillData = (value: unknown): FcAcknowledgeAutofillData => {
  const input = isRecord(value) ? value : {};
  const normalizedCategory = normalizeCategory(input.user_category ?? input.category ?? input.category_name);

  return {
    student_name: cleanString(input.student_name ?? input.name ?? input.studentName),
    user_gender: normalizeGender(input.user_gender ?? input.gender),
    user_category: normalizedCategory,
    user_home_university: cleanString(
      input.user_home_university ?? input.home_university ?? input.university,
    ),
    user_minority_list: normalizeMinorityList(
      input.user_minority_list ?? input.minority ?? input.minority_list,
    ),
    percentile_cet: normalizePercentile(
      input.percentile_cet ?? input.cet_percentile ?? input.mht_cet_percentile,
    ),
    percentile_ai: normalizePercentile(
      input.percentile_ai ?? input.jee_percentile ?? input.ai_percentile,
    ),
    course_type: normalizeCourseType(input.course_type ?? input.course ?? input.course_name),
    is_ews:
      typeof input.is_ews === "boolean"
        ? input.is_ews
        : normalizedCategory === "EWS"
          ? true
          : null,
  };
};
