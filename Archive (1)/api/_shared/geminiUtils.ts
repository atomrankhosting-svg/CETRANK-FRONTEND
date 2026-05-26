/**
 * Gemini API Key Rotation and Request Utility
 */

export interface GeminiRequestOptions {
  model?: string;
  temperature?: number;
  responseMimeType?: string;
}

const DEFAULT_MODEL = "gemini-2.0-flash";

/**
 * Returns a randomly selected API key from the GEMINI_API_KEY environment variable.
 * Supports comma-separated keys for rotation.
 */
export function getRotatedGeminiKey(providedKey?: string): string {
  // Use provided key if available (e.g. from options)
  if (providedKey) return providedKey;

  const envKey = process.env.GEMINI_API_KEY;
  if (!envKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }

  // Split by comma and filter out empty strings
  const keys = envKey.split(",").map(k => k.trim()).filter(Boolean);
  
  if (keys.length === 0) {
    throw new Error("GEMINI_API_KEY is empty or invalid.");
  }

  // Random selection for simple rotation
  const randomIndex = Math.floor(Math.random() * keys.length);
  return keys[randomIndex];
}

/**
 * Common Gemini generation function with key rotation
 */
export async function generateGeminiContent(
  apiKey: string | undefined,
  contents: any[],
  options: GeminiRequestOptions = {},
  fetchImpl: typeof fetch = fetch
) {
  const key = getRotatedGeminiKey(apiKey);
  const model = options.model || process.env.GEMINI_MODEL || DEFAULT_MODEL;
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;

  const response = await fetchImpl(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.1,
        responseMimeType: options.responseMimeType ?? "application/json",
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    // Special handling for rate limits or invalid keys to help debugging
    if (response.status === 429) {
      throw new Error("Gemini API rate limit exceeded. Consider adding more keys for rotation.");
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error("Gemini API key is invalid or lacks permissions.");
    }
    throw new Error(`Gemini request failed (${response.status}): ${detail}`);
  }

  const result = await response.json();
  if (result.error) {
    throw new Error(`Gemini API Error: ${result.error.message || JSON.stringify(result.error)}`);
  }
  return result;
}
