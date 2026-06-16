import {
  AuthError,
  UpstreamError,
  MIN_LIST_OPTIONS_FOR_CREDIT,
  buildListResponse,
  fetchCutoffsFromBackend,
  getUserCredits,
  saveListAndDeductCredit,
  verifySupabaseUser,
  type CutoffFilters,
} from "../../_shared/listAccess.js";
import { sendJson } from "../../_shared/paymentUtils.js";

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

    const filters = body.filters as CutoffFilters | undefined;
    if (!filters || typeof filters !== "object") {
      return sendJson(res, 400, { detail: "filters is required." });
    }

    const { userId, accessToken } = await verifySupabaseUser(req);
    const credits = await getUserCredits(userId, accessToken);

    if (credits < 1) {
      return sendJson(res, 402, { detail: "Insufficient credits to unlock this list." });
    }

    const backend = await fetchCutoffsFromBackend(filters, req);

    if (backend.results.length < MIN_LIST_OPTIONS_FOR_CREDIT) {
      return sendJson(res, 400, {
        detail: `Lists with fewer than ${MIN_LIST_OPTIONS_FOR_CREDIT} options do not require unlocking.`,
      });
    }

    const { newCreditBalance } = await saveListAndDeductCredit(
      userId,
      {
        results: backend.results,
        user_details: backend.user_details,
        count: backend.count,
      },
      credits,
      accessToken,
    );

    return sendJson(
      res,
      200,
      buildListResponse(backend, {
        isLocked: false,
        creditsRemaining: newCreditBalance,
      }),
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return sendJson(res, 401, { detail: error.message });
    }
    if (error instanceof UpstreamError) {
      return sendJson(res, error.status, { detail: error.message });
    }
    console.error("[lists/unlock] Request failed:", error);
    return sendJson(res, 500, {
      detail: error instanceof Error ? error.message : "Failed to unlock college list.",
    });
  }
}
