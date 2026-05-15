import {
  extractJsonObject,
  resolveFcAcknowledgeMimeType,
} from "../../src/lib/fcAcknowledge.js";
import { generateGeminiContent } from "./geminiUtils.js";

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

export interface ApplicationFormUploadPayload {
  file_name: string;
  mime_type: string;
  file_data: string; // base64
}

interface ExtractOptions {
  apiKey?: string;
  model?: string;
  fetchImpl?: typeof fetch;
}

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

const APPLICATION_FORM_PROMPT = `
You are an expert data extraction system. You are given an image of an MHT-CET 2026
FC Center Acknowledgement receipt. Extract the following fields and return them
as a JSON object. Be precise with numbers — preserve all decimal places.

Extract these fields:
1. student_name: The candidate's full name (from "Candidate's Full Name" row).
2. user_gender: "Male" or "Female" (from "Gender" row).
3. user_category: The reservation category (from "Category" row OR "Category for Admission" row).
   Extremely important: Look for values like SBC, OPEN, OBC, SC, ST, VJ, NT1, NT2, NT3, SEBC.
   If both "Category" and "Category for Admission" are present, use the value from "Category for Admission".
4. user_home_university: The full university name (from "Home University" row).
5. percentile_cet: The MHT-CET  PCM/PCB Total percentile (from the scores section, look for "Total" value).
6. percentile_ai: The JEE Main  Total percentile (from the scores section, look for "Total" value).
7. is_ews: true if "Applied for EWS" is "Yes".
8. minority_detected: The minority name if "Minority Candidature Type" is anything other than "No".

Return ONLY a valid JSON object with exactly these 8 keys. No markdown, no explanation.
Example:
{
  "student_name": "DONGARE OM DILIP",
  "user_gender": "Male",
  "user_category": "SBC",
  "user_home_university": "Sant Gadge Baba Amravati University",
  "percentile_cet": 86.6827486,
  "percentile_ai": 73.0983775,
  "is_ews": false,
  "minority_detected": null
}
`.trim();

const getGeminiText = (response: any): string => {
  if (!response) {
    throw new Error("Gemini returned an empty response.");
  }

  const candidate = response?.candidates?.[0];
  if (!candidate) {
    const errorMsg = response?.error?.message || "No candidates returned by Gemini.";
    throw new Error(`Gemini Error: ${errorMsg}`);
  }

  const textPart = candidate?.content?.parts?.find((part: any) => typeof part?.text === "string");

  if (typeof textPart?.text === "string" && textPart.text.trim()) {
    return textPart.text;
  }

  const finishReason = candidate?.finishReason;
  if (finishReason && finishReason !== "STOP") {
    throw new Error(`Gemini stopped unexpectedly (Reason: ${finishReason}).`);
  }

  const blockReason = response?.promptFeedback?.blockReason;
  if (blockReason) {
    throw new Error(`Gemini blocked the document analysis (${blockReason}).`);
  }

  throw new Error("Gemini did not return any extractable text. Please try a clearer image.");
};

const normalizeCategory = (value: unknown): string | null => {
  if (typeof value !== "string" || !value.trim()) return null;
  const upper = value.trim().toUpperCase();

  const patterns: Array<[RegExp, string]> = [
    [/\bOPEN\b/i, "OPEN"],
    [/\bOBC\b/i, "OBC"],
    [/\bSBC\b/i, "SBC"],
    [/\bSC\b/i, "SC"],
    [/\bST\b/i, "ST"],
    [/\bVJ\b/i, "VJNT"],
    [/\bVJNT\b/i, "VJNT"],
    [/\bNT-?1\b/i, "NT1"],
    [/\bNT-?2\b/i, "NT2"],
    [/\bNT-?3\b/i, "NT3"],
    [/\bEWS\b/i, "EWS"],
    [/\bSEBC\b/i, "SEBC"],
  ];

  for (const [pattern, normalized] of patterns) {
    if (pattern.test(upper)) return normalized;
  }

  // Fallback: strip G/L and try again
  const cleaned = upper.replace(/^[GL]/, "");
  for (const [pattern, normalized] of patterns) {
    if (pattern.test(cleaned)) return normalized;
  }

  return upper || null;
};

const normalizeGender = (value: unknown): "Male" | "Female" | null => {
  if (typeof value !== "string" || !value.trim()) return null;
  const lower = value.trim().toLowerCase();
  if (lower.startsWith("m")) return "Male";
  if (lower.startsWith("f")) return "Female";
  return null;
};

const normalizePercentile = (value: unknown): number | null => {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return Math.min(100, Math.max(0, value));
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value.replace(/[^\d.]/g, ""));
    if (!Number.isFinite(parsed)) return null;
    return Math.min(100, Math.max(0, parsed));
  }
  return null;
};

const determineConfidence = (
  data: ApplicationFormExtractedData,
): "high" | "medium" | "low" => {
  let missingCount = 0;
  if (!data.student_name) missingCount++;
  if (!data.user_gender) missingCount++;
  if (!data.user_category) missingCount++;
  if (!data.user_home_university) missingCount++;
  if (data.percentile_cet === null) missingCount++;
  if (data.percentile_ai === null) missingCount++;

  // Also check if percentiles are in valid range
  if (data.percentile_cet !== null && (data.percentile_cet < 0 || data.percentile_cet > 100)) {
    missingCount++;
  }
  if (data.percentile_ai !== null && (data.percentile_ai < 0 || data.percentile_ai > 100)) {
    missingCount++;
  }

  if (missingCount >= 3) return "low";
  if (missingCount >= 1) return "medium";
  return "high";
};

export async function extractApplicationFormFromGemini(
  payload: ApplicationFormUploadPayload,
  options: ExtractOptions = {},
): Promise<ApplicationFormExtractResponse> {
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
  const model = options.model ?? process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
  const fetchImpl = options.fetchImpl ?? fetch;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const fileName = payload?.file_name?.trim();
  const mimeType = resolveFcAcknowledgeMimeType(fileName ?? "", payload?.mime_type);
  const fileData = payload?.file_data?.trim();

  if (!fileName || !mimeType || !fileData) {
    throw new Error("A valid application form image is required.");
  }

  const contents = [
    {
      parts: [
        {
          inline_data: {
            mime_type: mimeType,
            data: fileData,
          },
        },
        {
          text: APPLICATION_FORM_PROMPT,
        },
      ],
    },
  ];

  const result = await generateGeminiContent(options.apiKey, contents, {
    model: options.model,
    temperature: 0.1,
    responseMimeType: "application/json",
  }, fetchImpl);

  const raw = extractJsonObject(getGeminiText(result));

  const extracted: ApplicationFormExtractedData = {
    student_name: typeof raw.student_name === "string" ? raw.student_name.trim() || null : null,
    user_gender: normalizeGender(raw.user_gender),
    user_category: normalizeCategory(raw.user_category),
    user_home_university:
      typeof raw.user_home_university === "string"
        ? raw.user_home_university.trim() || null
        : null,
    percentile_cet: normalizePercentile(raw.percentile_cet) ?? 0,
    percentile_ai: normalizePercentile(raw.percentile_ai) ?? 0,
    is_ews: raw.is_ews === true,
    minority_detected:
      typeof raw.minority_detected === "string" && raw.minority_detected.trim().toLowerCase() !== "no"
        ? raw.minority_detected.trim()
        : null,
  };

  console.log("[AI Extraction] Raw Data:", raw);
  console.log("[AI Extraction] Normalized Data:", extracted);

  return {
    success: true,
    extracted_data: extracted,
    confidence: determineConfidence(extracted),
  };
}
