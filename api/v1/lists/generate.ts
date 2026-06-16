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

    const { userId } = await verifySupabaseUser(req);
    const credits = await getUserCredits(userId);
    const backend = await fetchCutoffsFromBackend(filters, req);
    const resultCount = backend.results.length;

    if (resultCount === 0) {
      return sendJson(
        res,
        200,
        buildListResponse(backend, { isLocked: false }),
      );
    }

    if (resultCount < MIN_LIST_OPTIONS_FOR_CREDIT) {
      return sendJson(
        res,
        200,
        buildListResponse(backend, { isLocked: false, creditNotCharged: true }),
      );
    }

    if (credits > 0) {
      const { newCreditBalance } = await saveListAndDeductCredit(
        userId,
        {
          results: backend.results,
          user_details: backend.user_details,
          count: backend.count,
        },
        credits,
      );

      return sendJson(
        res,
        200,
        buildListResponse(backend, {
          isLocked: false,
          creditsRemaining: newCreditBalance,
        }),
      );
    }

    return sendJson(
      res,
      200,
      buildListResponse(backend, { isLocked: true }),
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return sendJson(res, 401, { detail: error.message });
    }
    if (error instanceof UpstreamError) {
      return sendJson(res, error.status, { detail: error.message });
    }
    console.error("[lists/generate] Request failed:", error);
    return sendJson(res, 500, {
      detail: error instanceof Error ? error.message : "Failed to generate college list.",
    });
  }
}
