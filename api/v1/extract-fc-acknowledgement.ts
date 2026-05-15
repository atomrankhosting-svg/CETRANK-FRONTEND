import { extractFcAcknowledgeDetailsFromGemini } from "../_shared/fcAcknowledge.js";

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

    const data = await extractFcAcknowledgeDetailsFromGemini(body, {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL,
    });

    return sendJson(res, 200, { data });
  } catch (error) {
    console.error("[extract-fc-acknowledgement] Failed to extract details:", error);
    const message = error instanceof Error ? error.message : "Unable to extract details.";
    return sendJson(res, 400, { detail: message });
  }
}
