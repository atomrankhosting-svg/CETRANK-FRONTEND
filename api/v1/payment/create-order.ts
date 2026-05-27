import { TIERS, getAndValidateCoupon, getRazorpayConfig, sendJson } from "../../_shared/paymentUtils.js";

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

    const { tier: rawTier, coupon_code } = body;
    const tier = rawTier?.toLowerCase();

    if (!tier || !TIERS[tier as keyof typeof TIERS]) {
      return sendJson(res, 400, {
        detail: "Invalid tier selected. Must be 'basic', 'standard', or 'pro'.",
      });
    }

    const tierInfo = TIERS[tier as keyof typeof TIERS];
    let amount = tierInfo.amount;
    const creditsToAdd = tierInfo.credits;
    let appliedCoupon: string | null = null;

    if (coupon_code) {
      try {
        const coupon = await getAndValidateCoupon(coupon_code);
        const discountType = coupon.discount_type;
        const discountValue = Number(coupon.discount_value);
        appliedCoupon = coupon.code;

        if (discountType === "percentage") {
          amount = Math.floor((amount * (100 - discountValue)) / 100);
        } else {
          amount = Math.max(0, Math.floor(amount - discountValue * 100));
        }

        if (amount <= 0) {
          return sendJson(res, 400, {
            detail: "This coupon reduces the price to Rs 0. Please use the free claim route.",
          });
        }
      } catch (err: any) {
        return sendJson(res, 400, { detail: err.message || "Failed to validate coupon." });
      }
    }

    const { keyId, keySecret } = getRazorpayConfig();
    if (!keyId || !keySecret) {
      return sendJson(res, 500, { detail: "Razorpay credentials are not configured on the server." });
    }

    const payload = {
      amount,
      currency: "INR",
      receipt: `receipt_${tier}`,
      notes: {
        tier,
        credits: String(creditsToAdd),
        coupon_code: appliedCoupon || "",
      },
    };

    console.log(`Initiating Razorpay order for tier: ${tier} (amount: ${amount} paise, coupon: ${appliedCoupon})`);

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Razorpay order creation failed. Status: ${response.status}, Body: ${errorText}`);
      return sendJson(res, 500, { detail: "Failed to create payment order with gateway." });
    }

    const orderData: any = await response.json();
    console.log(`Razorpay order created successfully: ${orderData.id}`);

    return sendJson(res, 200, {
      id: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
    });
  } catch (error: any) {
    console.error("Unexpected error while calling Razorpay API:", error);
    return sendJson(res, 500, { detail: error.message || "Internal payment gateway error." });
  }
}
