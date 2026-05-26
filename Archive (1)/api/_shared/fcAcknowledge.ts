import {
  extractJsonObject,
  normalizeAutofillData,
  resolveFcAcknowledgeMimeType,
  type FcAcknowledgeAutofillData,
  type FcAcknowledgeUploadPayload,
} from "../../src/lib/fcAcknowledge.js";
import { generateGeminiContent } from "./geminiUtils.js";

interface ExtractFcAcknowledgeOptions {
  apiKey?: string;
  model?: string;
  fetchImpl?: typeof fetch;
}

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

const FC_ACK_PROMPT = `
Analyze this FC acknowledgement document and extract the student's admission-related details.

Return strict JSON with this exact shape:
{
  "student_name": string | null,
  "user_gender": "Male" | "Female" | null,
  "user_category": "OPEN" | "OBC" | "SEBC" | "SC" | "ST" | "VJNT" | "NT1" | "NT2" | "NT3" | "EWS" | "TFWS" | null,
  "user_home_university": string | null,
  "user_minority_list": string[],
  "percentile_cet": number | null,
  "percentile_ai": number | null,
  "course_type": "engineering" | "pharmacy" | null,
  "is_ews": boolean | null
}

Rules:
- Use null when a field is not clearly visible in the document.
- Use [] when no minority value is clearly visible.
- Do not guess or invent values.
- If the document includes a quota or category code, convert it to the normalized category values above.
- Put religion and linguistic minority values into user_minority_list only when clearly shown.
- percentile_cet should be the MHT-CET percentile.
- percentile_ai should be the JEE/Main or All India percentile only if clearly visible as a percentile.
- course_type should be "pharmacy" only for pharmacy-related admissions; otherwise use "engineering" when engineering is clear.
- Return JSON only. No markdown, no explanation.
`.trim();

const getGeminiText = (response: any) => {
  const textPart = response?.candidates
    ?.flatMap((candidate: any) => candidate?.content?.parts ?? [])
    ?.find((part: any) => typeof part?.text === "string");

  if (typeof textPart?.text === "string" && textPart.text.trim()) {
    return textPart.text;
  }

  const blockReason = response?.promptFeedback?.blockReason;
  if (blockReason) {
    throw new Error(`Gemini blocked the document analysis (${blockReason}).`);
  }

  throw new Error("Gemini did not return any extractable text.");
};

export async function extractFcAcknowledgeDetailsFromGemini(
  payload: FcAcknowledgeUploadPayload,
  options: ExtractFcAcknowledgeOptions = {},
): Promise<FcAcknowledgeAutofillData> {
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
    throw new Error("A valid FC acknowledgement file is required.");
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
          text: FC_ACK_PROMPT,
        },
      ],
    },
  ];

  const result = await generateGeminiContent(options.apiKey, contents, {
    model: options.model,
    temperature: 0.1,
    responseMimeType: "application/json",
  }, fetchImpl);

  return normalizeAutofillData(extractJsonObject(getGeminiText(result)));
}
