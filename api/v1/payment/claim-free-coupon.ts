import { TIERS, getAndValidateCoupon, incrementCouponUses, sendJson } from "../../_shared/paymentUtils.js";

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

    const { coupon_code, tier: rawTier } = body;
    const tier = rawTier?.toLowerCase();

    if (!tier || !TIERS[tier as keyof typeof TIERS]) {
      return sendJson(res, 400, { detail: "Invalid tier selected." });
    }

    if (!coupon_code) {
      return sendJson(res, 400, { detail: "Coupon code is required." });
    }

    const tierInfo = TIERS[tier as keyof typeof TIERS];
    const originalAmount = tierInfo.amount;

    let coupon;
    try {
      coupon = await getAndValidateCoupon(coupon_code);
    } catch (err: any) {
      return sendJson(res, 400, { detail: err.message || "Failed to validate coupon." });
    }

    const discountType = coupon.discount_type;
    const discountValue = Number(coupon.discount_value);
    let discountedAmount = originalAmount;

    if (discountType === "percentage") {
      discountedAmount = Math.floor((originalAmount * (100 - discountValue)) / 100);
    } else {
      discountedAmount = Math.max(0, Math.floor(originalAmount - discountValue * 100));
    }

    if (discountedAmount > 0) {
      return sendJson(res, 400, {
        detail: "This coupon does not make this transaction free. Please pay the remaining balance.",
      });
    }

    await incrementCouponUses(coupon_code);

    console.log(`Free transaction completed using coupon ${coupon_code} for tier ${tier}`);
    return sendJson(res, 200, { success: true, credits: tierInfo.credits });
  } catch (error: any) {
    console.error("Error claiming free coupon:", error);
    return sendJson(res, 500, { detail: error.message || "Internal server error." });
  }
}
