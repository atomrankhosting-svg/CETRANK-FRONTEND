import crypto from "crypto";

export const TIERS = {
  basic: { amount: 500, credits: 1 },
  standard: { amount: 500, credits: 3 },
  pro: { amount: 500, credits: 5 }
};

export interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "flat";
  discount_value: number;
  is_active: boolean;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
}

export function getEnv(key: string): string {
  return process.env[key] || "";
}

export const getSupabaseConfig = () => {
  const url = getEnv("SUPABASE_URL") || getEnv("VITE_SUPABASE_URL");
  const key = getEnv("SUPABASE_ANON_KEY") || getEnv("VITE_SUPABASE_ANON_KEY");
  return { url, key };
};

export const getRazorpayConfig = () => {
  const keyId = getEnv("RAZORPAY_KEY_ID") || getEnv("VITE_RAZORPAY_KEY_ID");
  const keySecret = getEnv("RAZORPAY_KEY_SECRET");
  return { keyId, keySecret };
};

export async function getAndValidateCoupon(couponCode: string): Promise<Coupon> {
  const code = couponCode.toUpperCase().trim();
  const { url, key } = getSupabaseConfig();

  if (!url || !key) {
    throw new Error("Supabase configuration is missing.");
  }

  const queryUrl = `${url.replace(/\/+$/, "")}/rest/v1/coupons?code=eq.${encodeURIComponent(code)}&select=*`;
  const response = await fetch(queryUrl, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to query coupon from Supabase:", errorText);
    throw new Error("Database error while validating coupon.");
  }

  const coupons: Coupon[] = await response.json();
  if (!coupons || coupons.length === 0) {
    throw new Error("Invalid coupon code.");
  }

  const coupon = coupons[0];

  if (!coupon.is_active) {
    throw new Error("This coupon is no longer active.");
  }

  if (coupon.expires_at) {
    const expiresAt = new Date(coupon.expires_at);
    if (new Date() > expiresAt) {
      throw new Error("This coupon has expired.");
    }
  }

  if (coupon.max_uses !== null && coupon.use_count >= coupon.max_uses) {
    throw new Error("This coupon has reached its usage limit.");
  }

  return coupon;
}

export async function incrementCouponUses(couponCode: string): Promise<void> {
  const code = couponCode.toUpperCase().trim();
  const { url, key } = getSupabaseConfig();

  if (!url || !key) {
    console.error("Supabase config missing during coupon increment");
    return;
  }

  try {
    const queryUrl = `${url.replace(/\/+$/, "")}/rest/v1/coupons?code=eq.${encodeURIComponent(code)}`;
    const response = await fetch(queryUrl, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    });

    if (response.ok) {
      const coupons: Coupon[] = await response.json();
      if (coupons && coupons.length > 0) {
        const coupon = coupons[0];
        const couponId = coupon.id;
        const newUseCount = coupon.use_count + 1;

        const patchUrl = `${url.replace(/\/+$/, "")}/rest/v1/coupons?id=eq.${couponId}`;
        const patchResponse = await fetch(patchUrl, {
          method: "PATCH",
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ use_count: newUseCount })
        });

        if (!patchResponse.ok) {
          const patchErr = await patchResponse.text();
          console.error(`Failed to increment coupon use count: ${patchErr}`);
        } else {
          console.log(`Incremented use count for coupon ${code} to ${newUseCount}`);
        }
      }
    }
  } catch (error) {
    console.error("Failed to increment coupon uses:", error);
  }
}

export function sendJson(res: any, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}
