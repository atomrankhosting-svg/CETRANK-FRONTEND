export type PricingTier = "basic" | "standard" | "pro";

export const DEFAULT_TIER_PRICES: Record<PricingTier, number> = {
  basic: 500,
  standard: 500,
  pro: 500,
};

export const TIER_CREDITS: Record<PricingTier, number> = {
  basic: 1,
  standard: 3,
  pro: 5,
};

export const isPricingTier = (tier: string): tier is PricingTier =>
  tier === "basic" || tier === "standard" || tier === "pro";

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
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = getEnv("SUPABASE_ANON_KEY") || getEnv("VITE_SUPABASE_ANON_KEY");
  // Server-side coupon reads/writes should use the service role key so RLS
  // does not block validation that already succeeded in the authenticated client.
  const key = serviceRoleKey || anonKey;
  return { url, key, usingServiceRole: Boolean(serviceRoleKey) };
};

export const getRazorpayConfig = () => {
  const keyId = getEnv("RAZORPAY_KEY_ID") || getEnv("VITE_RAZORPAY_KEY_ID");
  const keySecret = getEnv("RAZORPAY_KEY_SECRET");
  return { keyId, keySecret };
};

export async function fetchTierPrices(): Promise<Record<PricingTier, number>> {
  const { url, key } = getSupabaseConfig();

  if (!url || !key) {
    console.warn("Supabase config missing — using default tier prices.");
    return { ...DEFAULT_TIER_PRICES };
  }

  const queryUrl = `${url.replace(/\/+$/, "")}/rest/v1/list_pricing?select=tier,price_in_paise`;
  const response = await fetch(queryUrl, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to fetch tier prices from Supabase:", errorText);
    return { ...DEFAULT_TIER_PRICES };
  }

  const rows: { tier?: string; price_in_paise?: number }[] = await response.json();
  const prices: Record<PricingTier, number> = { ...DEFAULT_TIER_PRICES };

  for (const row of rows) {
    const tierValue = typeof row.tier === "string" ? row.tier : "";
    const priceValue = typeof row.price_in_paise === "number" ? row.price_in_paise : NaN;
    if (isPricingTier(tierValue) && Number.isFinite(priceValue) && priceValue >= 0) {
      prices[tierValue] = Math.round(priceValue);
    }
  }

  return prices;
}

export function applyCouponToAmount(amountInPaise: number, coupon: Coupon): number {
  const discountValue = Number(coupon.discount_value);

  if (coupon.discount_type === "percentage") {
    return Math.floor((amountInPaise * (100 - discountValue)) / 100);
  }

  return Math.max(0, Math.floor(amountInPaise - discountValue * 100));
}

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
      Authorization: `Bearer ${key}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to query coupon from Supabase:", errorText);
    throw new Error("Database error while validating coupon.");
  }

  const coupons: Coupon[] = await response.json();
  if (!coupons || coupons.length === 0) {
    const { usingServiceRole } = getSupabaseConfig();
    if (!usingServiceRole) {
      console.error(
        "Coupon lookup returned no rows. Server is using anon key — RLS may be blocking reads. Set SUPABASE_SERVICE_ROLE_KEY or add a select policy on coupons.",
      );
    }
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
        Authorization: `Bearer ${key}`,
      },
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
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ use_count: newUseCount }),
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

export type PaymentStatus =
  | "pending"
  | "success"
  | "failed"
  | "cancelled"
  | "credits_failed";

export interface PaymentTransactionInput {
  user_id: string;
  user_email?: string | null;
  status: PaymentStatus;
  tier: PricingTier;
  credits: number;
  amount_in_paise: number;
  currency?: string;
  coupon_code?: string | null;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  error_message?: string | null;
}

export interface PaymentTransaction extends PaymentTransactionInput {
  id: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

const supabaseRestHeaders = (key: string, prefer?: string) => ({
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  ...(prefer ? { Prefer: prefer } : {}),
});

export async function insertPaymentTransaction(
  input: PaymentTransactionInput,
): Promise<string | null> {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    console.error("Supabase config missing — cannot record payment transaction.");
    return null;
  }

  const now = new Date().toISOString();
  const payload = {
    user_id: input.user_id,
    user_email: input.user_email ?? null,
    status: input.status,
    tier: input.tier,
    credits: input.credits,
    amount_in_paise: input.amount_in_paise,
    currency: input.currency ?? "INR",
    coupon_code: input.coupon_code ?? null,
    razorpay_order_id: input.razorpay_order_id ?? null,
    razorpay_payment_id: input.razorpay_payment_id ?? null,
    error_message: input.error_message ?? null,
    updated_at: now,
    completed_at: input.status === "success" ? now : null,
  };

  try {
    const response = await fetch(`${url.replace(/\/+$/, "")}/rest/v1/payment_transactions`, {
      method: "POST",
      headers: supabaseRestHeaders(key, "return=representation"),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to insert payment transaction:", errorText);
      return null;
    }

    const rows: { id?: string }[] = await response.json();
    return rows[0]?.id ?? null;
  } catch (error) {
    console.error("Failed to insert payment transaction:", error);
    return null;
  }
}

export async function updatePaymentByOrderId(
  razorpayOrderId: string,
  updates: Partial<
    Pick<
      PaymentTransactionInput,
      | "status"
      | "razorpay_payment_id"
      | "error_message"
      | "coupon_code"
      | "amount_in_paise"
      | "credits"
    >
  >,
): Promise<boolean> {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    console.error("Supabase config missing — cannot update payment transaction.");
    return false;
  }

  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    ...updates,
    updated_at: now,
  };

  if (updates.status === "success" || updates.status === "failed" || updates.status === "cancelled") {
    payload.completed_at = now;
  }

  try {
    const response = await fetch(
      `${url.replace(/\/+$/, "")}/rest/v1/payment_transactions?razorpay_order_id=eq.${encodeURIComponent(razorpayOrderId)}`,
      {
        method: "PATCH",
        headers: supabaseRestHeaders(key),
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to update payment for order ${razorpayOrderId}:`, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Failed to update payment for order ${razorpayOrderId}:`, error);
    return false;
  }
}

export function sendJson(res: any, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}
