import { supabase } from "@/lib/supabase";

export type PricingTier = "basic" | "standard" | "pro";

export type TierPrices = Record<PricingTier, number>;

export const DEFAULT_TIER_PRICES: TierPrices = {
  basic: 500,
  standard: 500,
  pro: 500,
};

const PRICING_TABLE = "list_pricing";

const isPricingTier = (value: string): value is PricingTier =>
  value === "basic" || value === "standard" || value === "pro";

export async function fetchTierPrices(): Promise<TierPrices> {
  const { data, error } = await supabase
    .from(PRICING_TABLE)
    .select("tier, price_in_paise");

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return DEFAULT_TIER_PRICES;
  }

  const mergedPrices: TierPrices = { ...DEFAULT_TIER_PRICES };

  for (const row of data) {
    const tierValue = typeof row.tier === "string" ? row.tier : "";
    const priceValue = typeof row.price_in_paise === "number" ? row.price_in_paise : NaN;
    if (isPricingTier(tierValue) && Number.isFinite(priceValue) && priceValue >= 0) {
      mergedPrices[tierValue] = Math.round(priceValue);
    }
  }

  return mergedPrices;
}

export async function saveTierPrices(prices: TierPrices): Promise<void> {
  const payload = (Object.entries(prices) as [PricingTier, number][]).map(([tier, priceInPaise]) => ({
    tier,
    price_in_paise: Math.round(priceInPaise),
  }));

  const { error } = await supabase.from(PRICING_TABLE).upsert(payload, { onConflict: "tier" });
  if (error) {
    throw error;
  }
}
