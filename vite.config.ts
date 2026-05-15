import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { extractFcAcknowledgeDetailsFromGemini } from "./api/_shared/fcAcknowledge";
import { extractApplicationFormFromGemini } from "./api/_shared/applicationFormExtract";

const FC_ACK_ROUTE = "/api/v1/extract-fc-acknowledgement";
const APP_FORM_ROUTE = "/api/v1/extract-application-form";

const jsonResponse = (res: any, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl = env.VITE_API_BASE_URL || env.BACKEND_URL;

  if (!backendUrl && mode === "development") {
    console.warn("Warning: VITE_API_BASE_URL is not defined in your .env file.");
  }

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
      proxy: {
        "^/api/(?!v1/extract-fc-acknowledgement$|v1/extract-application-form$)": {
          target: backendUrl,
          changeOrigin: true,
          secure: true,
        },
      },
    },
    plugins: [
      react(),
      {
        name: "fc-acknowledgement-dev-api",
        apply: "serve",
        configureServer(server) {
          server.middlewares.use(FC_ACK_ROUTE, (req, res, next) => {
            if (req.method !== "POST") {
              jsonResponse(res, 405, { detail: "Method not allowed" });
              return;
            }

            const chunks: Uint8Array[] = [];
            req.on("data", (chunk) => chunks.push(chunk));
            req.on("end", async () => {
              try {
                const rawBody = Buffer.concat(chunks).toString("utf8");
                const body = rawBody ? JSON.parse(rawBody) : {};
                const data = await extractFcAcknowledgeDetailsFromGemini(body, {
                  apiKey: env.GEMINI_API_KEY,
                  model: env.GEMINI_MODEL,
                });

                jsonResponse(res, 200, { data });
              } catch (error) {
                console.error("[vite fc-acknowledgement-dev-api] Request failed:", error);
                jsonResponse(res, 400, {
                  detail:
                    error instanceof Error
                      ? error.message
                      : "Unable to extract FC acknowledgement details.",
                });
              }
            });
            req.on("error", next);
          });

          /* ── Application Form extraction dev endpoint ── */
          server.middlewares.use(APP_FORM_ROUTE, (req, res, next) => {
            if (req.method !== "POST") {
              jsonResponse(res, 405, { detail: "Method not allowed" });
              return;
            }

            const chunks: Uint8Array[] = [];
            req.on("data", (chunk) => chunks.push(chunk));
            req.on("end", async () => {
              try {
                const rawBody = Buffer.concat(chunks).toString("utf8");
                const body = rawBody ? JSON.parse(rawBody) : {};
                const result = await extractApplicationFormFromGemini(body, {
                  apiKey: env.GEMINI_API_KEY,
                  model: env.GEMINI_MODEL,
                });

                jsonResponse(res, 200, result);
              } catch (error) {
                console.error("[vite app-form-extract-dev-api] Request failed:", error);
                jsonResponse(res, 400, {
                  success: false,
                  error:
                    error instanceof Error
                      ? error.message
                      : "Unable to extract application form details.",
                });
              }
            });
            req.on("error", next);
          });
        },
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
  };
});
