import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useAdminAccess } from "@/hooks/use-admin-access";
import { SiteBackdrop } from "@/components/effects/SiteBackdrop";
import { Users, FileText, Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  DEFAULT_TIER_PRICES,
  fetchTierPrices,
  saveTierPrices,
  type PricingTier,
  type TierPrices,
} from "@/lib/listPricing";

interface AdminStats {
  total_users: number;
  total_lists: number;
}

const PRICE_TIERS: PricingTier[] = ["basic", "standard", "pro"];

const formatTierPriceInputs = (prices: TierPrices): Record<PricingTier, string> => ({
  basic: (prices.basic / 100).toFixed(2),
  standard: (prices.standard / 100).toFixed(2),
  pro: (prices.pro / 100).toFixed(2),
});

const sanitizeDecimalInput = (rawValue: string) => {
  const cleanedValue = rawValue.replace(/[^\d.]/g, "");
  const decimalIndex = cleanedValue.indexOf(".");

  if (decimalIndex === -1) {
    return cleanedValue;
  }

  const integerPart = cleanedValue.slice(0, decimalIndex + 1);
  const decimalPart = cleanedValue.slice(decimalIndex + 1).replace(/\./g, "");
  return `${integerPart}${decimalPart}`;
};

const AdminDashboard = () => {
  const { user, loading: accessLoading, allowed } = useAdminAccess();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [tierPrices, setTierPrices] = useState<TierPrices>(DEFAULT_TIER_PRICES);
  const [tierPriceInputs, setTierPriceInputs] = useState<Record<PricingTier, string>>(
    formatTierPriceInputs(DEFAULT_TIER_PRICES),
  );
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingSaving, setPricingSaving] = useState(false);

  useEffect(() => {
    if (!allowed || !user) {
      setStatsLoading(false);
      return;
    }

    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const { data, error } = await supabase.rpc("get_admin_stats");
        if (error) throw error;
        setStats(data as AdminStats);
      } catch (error) {
        console.error("Error fetching admin stats:", error);
        setStats(null);
      } finally {
        setStatsLoading(false);
      }
    };

    void fetchStats();
  }, [user, allowed]);

  useEffect(() => {
    if (!allowed || !user) {
      setPricingLoading(false);
      return;
    }

    const loadTierPrices = async () => {
      setPricingLoading(true);
      try {
        const prices = await fetchTierPrices();
        setTierPrices(prices);
        setTierPriceInputs(formatTierPriceInputs(prices));
      } catch (error) {
        console.error("Error loading pricing:", error);
        toast({
          title: "Pricing Unavailable",
          description: "Could not load list pricing. Showing default prices.",
          variant: "destructive",
        });
        setTierPrices(DEFAULT_TIER_PRICES);
        setTierPriceInputs(formatTierPriceInputs(DEFAULT_TIER_PRICES));
      } finally {
        setPricingLoading(false);
      }
    };

    void loadTierPrices();
  }, [allowed, user]);

  const handlePriceChange = (tier: PricingTier, value: string) => {
    const sanitizedValue = sanitizeDecimalInput(value);
    setTierPriceInputs((previousInputs) => ({
      ...previousInputs,
      [tier]: sanitizedValue,
    }));

    const parsedValue = Number.parseFloat(sanitizedValue);
    const priceInPaise = Number.isFinite(parsedValue)
      ? Math.max(0, Math.round(parsedValue * 100))
      : 0;
    setTierPrices((previousPrices) => ({
      ...previousPrices,
      [tier]: priceInPaise,
    }));
  };

  const handleSavePricing = async () => {
    const normalizedTierPrices = { ...tierPrices };

    for (const tier of PRICE_TIERS) {
      const rawValue = tierPriceInputs[tier].trim();
      if (!rawValue) {
        toast({
          title: "Invalid Price",
          description: "Each tier must have a price before saving.",
          variant: "destructive",
        });
        return;
      }

      const parsedValue = Number.parseFloat(rawValue);
      if (!Number.isFinite(parsedValue) || parsedValue < 0) {
        toast({
          title: "Invalid Price",
          description: "Each price must be a valid non-negative number.",
          variant: "destructive",
        });
        return;
      }

      normalizedTierPrices[tier] = Math.round(parsedValue * 100);
    }

    const hasInvalidValue = (Object.values(normalizedTierPrices) as number[]).some(
      (price) => !Number.isFinite(price) || price < 0,
    );
    if (hasInvalidValue) {
      toast({
        title: "Invalid Price",
        description: "Each price must be a valid non-negative number.",
        variant: "destructive",
      });
      return;
    }

    setPricingSaving(true);
    try {
      await saveTierPrices(normalizedTierPrices);
      setTierPrices(normalizedTierPrices);
      setTierPriceInputs(formatTierPriceInputs(normalizedTierPrices));
      toast({
        title: "Pricing Updated",
        description: "List prices have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving pricing:", error);
      toast({
        title: "Save Failed",
        description: "Could not save list prices. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPricingSaving(false);
    }
  };

  if (accessLoading || statsLoading || pricingLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="app-shell min-h-screen">
      <SiteBackdrop particleCount={10} variant="focused" />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-5xl px-4 pb-12 pt-32">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Overview of CETRANK platform metrics.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="glass flex items-center gap-4 rounded-2xl border border-border/50 p-6">
            <div className="rounded-full bg-blue-500/10 p-3 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Signups</p>
              <h3 className="text-3xl font-bold">{stats?.total_users || 0}</h3>
            </div>
          </div>

          <div className="glass flex items-center gap-4 rounded-2xl border border-border/50 p-6">
            <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Lists Generated</p>
              <h3 className="text-3xl font-bold">{stats?.total_lists || 0}</h3>
            </div>
          </div>

          <div className="glass flex items-center gap-4 rounded-2xl border border-border/50 p-6">
            <div className="rounded-full bg-purple-500/10 p-3 text-purple-600">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Lists / User</p>
              <h3 className="text-3xl font-bold">
                {stats?.total_users ? (stats.total_lists / stats.total_users).toFixed(1) : 0}
              </h3>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
          <Link to="/admin/all-lists">
            <Button
              size="lg"
              className="h-14 w-full rounded-full px-8 text-base shadow-lg transition-all hover:shadow-primary/25 sm:w-auto"
            >
              See All Generated Lists
            </Button>
          </Link>
          <Link to="/admin/coupons">
            <Button
              size="lg"
              variant="outline"
              className="h-14 w-full rounded-full border-border/80 px-8 text-base hover:bg-muted/50 sm:w-auto"
            >
              Manage Coupon Codes
            </Button>
          </Link>
          <Link to="/admin/support">
            <Button
              size="lg"
              variant="outline"
              className="h-14 w-full rounded-full border-border/80 px-8 text-base hover:bg-muted/50 sm:w-auto"
            >
              Support Tickets
            </Button>
          </Link>
        </div>

        <div className="mt-10 glass rounded-2xl border border-border/50 p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-foreground">List Pricing</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Update credit package prices shown in the list purchase modal.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {([["basic", "Basic"], ["standard", "Standard"], ["pro", "Pro"]] as [PricingTier, string][]).map(([tierKey, tierLabel]) => (
              <div key={tierKey} className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {tierLabel} Price (Rs)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={tierPriceInputs[tierKey]}
                  onChange={(event) => handlePriceChange(tierKey, event.target.value)}
                  className="w-full h-11 rounded-xl border bg-background/60 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-end">
            <Button onClick={handleSavePricing} disabled={pricingSaving}>
              {pricingSaving ? "Saving..." : "Save Prices"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
