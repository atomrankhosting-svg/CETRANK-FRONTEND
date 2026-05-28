import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useAdminAccess } from "@/hooks/use-admin-access";
import { SiteBackdrop } from "@/components/effects/SiteBackdrop";
import {
  ArrowLeft,
  Loader2,
  Trash2,
  Plus,
  Ticket,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "flat";
  discount_value: number;
  max_uses: number | null;
  use_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export default function AdminCoupons() {
  const { loading: accessLoading, allowed } = useAdminAccess();
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  
  // Form states
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "flat">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const sanitizeIntegerInput = (rawValue: string) => rawValue.replace(/[^\d]/g, "");

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast({
        title: "Error",
        description: "Failed to fetch coupons list.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    void fetchCoupons();
  }, [allowed]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountValue) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const val = parseFloat(discountValue);
    if (isNaN(val) || val < 0) {
      toast({
        title: "Validation Error",
        description: "Discount value must be a positive number.",
        variant: "destructive"
      });
      return;
    }

    if (discountType === "percentage" && val > 100) {
      toast({
        title: "Validation Error",
        description: "Percentage discount cannot exceed 100%.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        code: code.toUpperCase().trim(),
        discount_type: discountType,
        discount_value: val,
        max_uses: maxUses ? parseInt(maxUses) : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        is_active: true
      };

      const { error } = await supabase.from("coupons").insert(payload);
      if (error) throw error;

      toast({
        title: "Success",
        description: `Coupon "${payload.code}" created successfully!`
      });

      // Reset form
      setCode("");
      setDiscountValue("");
      setMaxUses("");
      setExpiresAt("");
      
      // Refresh list
      await fetchCoupons();
    } catch (error: any) {
      console.error("Error creating coupon:", error);
      toast({
        title: "Failed to create coupon",
        description: error.message || "A coupon with this code may already exist.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("coupons")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Coupon status toggled to ${!currentStatus ? "Active" : "Inactive"}.`
      });

      // Update state locally
      setCoupons(prev =>
        prev.map(c => (c.id === id ? { ...c, is_active: !currentStatus } : c))
      );
    } catch (error) {
      console.error("Error updating coupon status:", error);
      toast({
        title: "Update Failed",
        description: "Could not change active status.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCoupon = async (id: string, couponCode: string) => {
    if (!confirm(`Are you sure you want to delete coupon "${couponCode}"?`)) return;

    try {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;

      toast({
        title: "Coupon Deleted",
        description: `Coupon "${couponCode}" has been removed.`
      });

      setCoupons(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the coupon.",
        variant: "destructive"
      });
    }
  };

  if (accessLoading || (loading && coupons.length === 0)) {
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
          <Link
            to="/admin"
            className="mb-6 inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Manage Coupon Codes
            </h1>
            <p className="text-muted-foreground">
              Create, configure, and monitor discount coupons for user checkouts.
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Create Coupon Column */}
          <div className="lg:col-span-1">
            <div className="glass rounded-[24px] border border-border/70 p-6">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground">
                <Plus className="w-5 h-5 text-primary" />
                Create Coupon
              </h2>
              <form onSubmit={handleCreateCoupon} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GET30"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    className="w-full h-11 px-4 rounded-xl border bg-background/50 text-sm font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Discount Type
                    </label>
                    <select
                      value={discountType}
                      onChange={e => setDiscountType(e.target.value as "percentage" | "flat")}
                      className="w-full h-11 px-3 rounded-xl border bg-background/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat (Rs)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Discount Value *
                    </label>
                    <input
                      type="text"
                      required
                      inputMode="decimal"
                      placeholder={discountType === "percentage" ? "e.g. 20" : "e.g. 5"}
                      value={discountValue}
                      onChange={e => setDiscountValue(sanitizeDecimalInput(e.target.value))}
                      className="w-full h-11 px-4 rounded-xl border bg-background/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Max Uses (Optional)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 100 (Blank for Unlimited)"
                    value={maxUses}
                    onChange={e => setMaxUses(sanitizeIntegerInput(e.target.value))}
                    className="w-full h-11 px-4 rounded-xl border bg-background/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={e => setExpiresAt(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border bg-background/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl font-semibold shadow-md mt-6"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Create Coupon"
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Coupons List Column */}
          <div className="lg:col-span-2">
            <div className="glass rounded-[24px] border border-border/70 overflow-hidden">
              <div className="divide-y divide-border/50">
                {coupons.map(coupon => {
                  const isExpired = coupon.expires_at
                    ? new Date(coupon.expires_at) < new Date()
                    : false;
                  const isUsageExceeded = coupon.max_uses
                    ? coupon.use_count >= coupon.max_uses
                    : false;
                  const isValid = coupon.is_active && !isExpired && !isUsageExceeded;

                  return (
                    <div
                      key={coupon.id}
                      className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6 transition-colors hover:bg-white/40"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`flex items-center justify-center rounded-xl p-3 ${isValid ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          <Ticket className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold tracking-wide uppercase text-foreground">
                              {coupon.code}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-secondary/80 px-2 py-0.5 text-xs font-semibold text-primary">
                              {coupon.discount_type === "percentage"
                                ? `${coupon.discount_value}% OFF`
                                : `Rs ${coupon.discount_value} OFF`}
                            </span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>
                              Uses: <strong>{coupon.use_count}</strong> /{" "}
                              {coupon.max_uses ?? "∞"}
                            </span>
                            {coupon.expires_at && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                Expires:{" "}
                                {new Date(coupon.expires_at).toLocaleDateString(
                                  "en-IN",
                                  { day: "numeric", month: "short", year: "numeric" }
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleActive(coupon.id, coupon.is_active)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title={coupon.is_active ? "Deactivate" : "Activate"}
                          >
                            {coupon.is_active ? (
                              <ToggleRight className="w-8 h-8 text-primary" />
                            ) : (
                              <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                            className="rounded-lg p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Status Label */}
                        <div className="shrink-0">
                          {isValid ? (
                            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-500">
                              Active
                            </span>
                          ) : (
                            <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-500">
                              {isExpired
                                ? "Expired"
                                : isUsageExceeded
                                ? "Usage Full"
                                : "Disabled"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {coupons.length === 0 && (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                    <Info className="w-8 h-8 mb-2 text-muted-foreground/50" />
                    <p className="font-semibold text-sm">No coupons found.</p>
                    <p className="text-xs">Create your first coupon code on the left.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
