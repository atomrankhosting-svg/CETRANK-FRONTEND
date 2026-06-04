import {
  TIER_CREDITS,
  applyCouponToAmount,
  fetchTierPrices,
  getAndValidateCoupon,
  incrementCouponUses,
  insertPaymentTransaction,
  isPricingTier,
  sendJson,
} from "../../_shared/paymentUtils.js";

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

    const { coupon_code, tier: rawTier, user_id, user_email } = body;
    const tier = rawTier?.toLowerCase();

    if (!tier || !isPricingTier(tier)) {
      return sendJson(res, 400, { detail: "Invalid tier selected." });
    }

    if (!coupon_code) {
      return sendJson(res, 400, { detail: "Coupon code is required." });
    }

    const tierPrices = await fetchTierPrices();
    const originalAmount = tierPrices[tier];

    let coupon;
    try {
      coupon = await getAndValidateCoupon(coupon_code);
    } catch (err: any) {
      return sendJson(res, 400, { detail: err.message || "Failed to validate coupon." });
    }

    const discountedAmount = applyCouponToAmount(originalAmount, coupon);

    if (discountedAmount > 0) {
      return sendJson(res, 400, {
        detail: "This coupon does not make this transaction free. Please pay the remaining balance.",
      });
    }

    await incrementCouponUses(coupon_code);

    if (user_id) {
      await insertPaymentTransaction({
        user_id,
        user_email,
        status: "success",
        tier,
        credits: TIER_CREDITS[tier],
        amount_in_paise: 0,
        coupon_code: coupon.code,
      });
    }

    console.log(`Free transaction completed using coupon ${coupon_code} for tier ${tier}`);
    return sendJson(res, 200, { success: true, credits: TIER_CREDITS[tier] });
  } catch (error: any) {
    console.error("Error claiming free coupon:", error);
    return sendJson(res, 500, { detail: error.message || "Internal server error." });
  }
}
