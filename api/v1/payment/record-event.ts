import {
  TIER_CREDITS,
  insertPaymentTransaction,
  isPricingTier,
  sendJson,
  updatePaymentByOrderId,
  type PaymentStatus,
} from "../../_shared/paymentUtils.js";

const UPDATABLE_STATUSES: PaymentStatus[] = [
  "cancelled",
  "failed",
  "credits_failed",
  "success",
];

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

    const {
      user_id,
      user_email,
      status: rawStatus,
      tier: rawTier,
      amount_in_paise,
      coupon_code,
      razorpay_order_id,
      razorpay_payment_id,
      error_message,
    } = body;

    const tier = rawTier?.toLowerCase();
    const status = rawStatus as PaymentStatus;

    if (!user_id || typeof user_id !== "string") {
      return sendJson(res, 400, { detail: "user_id is required." });
    }

    if (!status || !UPDATABLE_STATUSES.includes(status)) {
      return sendJson(res, 400, { detail: "Invalid payment status." });
    }

    if (!tier || !isPricingTier(tier)) {
      return sendJson(res, 400, { detail: "Invalid tier selected." });
    }

    const credits = TIER_CREDITS[tier];
    const amount = typeof amount_in_paise === "number" ? amount_in_paise : 0;

    if (razorpay_order_id) {
      const updated = await updatePaymentByOrderId(razorpay_order_id, {
        status,
        razorpay_payment_id: razorpay_payment_id ?? undefined,
        error_message: error_message ?? undefined,
      });

      if (updated) {
        return sendJson(res, 200, { recorded: true, updated: true });
      }
    }

    await insertPaymentTransaction({
      user_id,
      user_email,
      status,
      tier,
      credits,
      amount_in_paise: amount,
      coupon_code: coupon_code ?? null,
      razorpay_order_id: razorpay_order_id ?? null,
      razorpay_payment_id: razorpay_payment_id ?? null,
      error_message: error_message ?? null,
    });

    return sendJson(res, 200, { recorded: true, updated: false });
  } catch (error: any) {
    console.error("Error recording payment event:", error);
    return sendJson(res, 500, { detail: error.message || "Internal server error." });
  }
}
