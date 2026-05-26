import { extractApplicationFormFromGemini } from "../_shared/applicationFormExtract.js";

const sendJson = (res: any, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { detail: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body && typeof req.body === "object"
          ? req.body
          : {};

    const result = await extractApplicationFormFromGemini(body, {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL,
    });

    return sendJson(res, 200, result);
  } catch (error) {
    console.error("[extract-application-form] Failed to extract details:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Could not extract data from the uploaded image. Please ensure it is a clear photo of your MHT-CET Application Form.";
    return sendJson(res, 400, {
      success: false,
      error: message,
    });
  }
}
