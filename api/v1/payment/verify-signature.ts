import crypto from "crypto";
import { getRazorpayConfig, incrementCouponUses, sendJson } from "../../_shared/paymentUtils.js";

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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return sendJson(res, 400, { detail: "Missing signature verification details." });
    }

    const { keyId, keySecret } = getRazorpayConfig();
    if (!keySecret) {
      return sendJson(res, 500, { detail: "Razorpay credentials are not configured on the server." });
    }

    const hmac = crypto.createHmac("sha256", keySecret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const computedSignature = hmac.digest("hex");

    if (computedSignature !== razorpay_signature) {
      console.warn(`Signature verification failed for order: ${razorpay_order_id}`);
      return sendJson(res, 400, { detail: "Payment signature verification failed. Invalid transaction." });
    }

    console.log(`Signature verified successfully for order: ${razorpay_order_id}`);

    try {
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const resp = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });
      if (resp.ok) {
        const orderData: any = await resp.json();
        const notes = orderData.notes || {};
        const couponCode = notes.coupon_code;
        if (couponCode) {
          await incrementCouponUses(couponCode);
        }
      }
    } catch (e) {
      console.error("Failed to fetch order details to verify coupon increment:", e);
    }

    return sendJson(res, 200, { status: "verified" });
  } catch (error: any) {
    console.error("Error during signature verification:", error);
    return sendJson(res, 500, { detail: error.message || "Internal server error." });
  }
}
