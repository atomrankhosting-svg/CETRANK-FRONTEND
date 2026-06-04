import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useAdminAccess } from "@/hooks/use-admin-access";
import { SiteBackdrop } from "@/components/effects/SiteBackdrop";
import {
  ArrowLeft,
  Loader2,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Ban,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type PaymentStatus =
  | "pending"
  | "success"
  | "failed"
  | "cancelled"
  | "credits_failed";

interface PaymentTransaction {
  id: string;
  user_id: string;
  user_email: string | null;
  status: PaymentStatus;
  tier: "basic" | "standard" | "pro";
  credits: number;
  amount_in_paise: number;
  currency: string;
  coupon_code: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  success: {
    label: "Success",
    icon: CheckCircle2,
    className: "text-emerald-600 bg-emerald-500/10",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "text-amber-600 bg-amber-500/10",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    className: "text-red-600 bg-red-500/10",
  },
  cancelled: {
    label: "Cancelled",
    icon: Ban,
    className: "text-muted-foreground bg-muted/60",
  },
  credits_failed: {
    label: "Credits Failed",
    icon: AlertTriangle,
    className: "text-orange-600 bg-orange-500/10",
  },
};

const formatAmount = (paise: number, currency: string) => {
  if (paise <= 0) return "Free";
  return `${currency} ${(paise / 100).toFixed(2)}`;
};

const formatDateTime = (value: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function AdminPayments() {
  const { loading: accessLoading, allowed } = useAdminAccess();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments((data as PaymentTransaction[]) || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast({
        title: "Error",
        description:
          "Failed to fetch payment records. Ensure the payment_transactions table exists.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (allowed) {
      void fetchPayments();
    }
  }, [allowed]);

  const filteredPayments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return payments.filter((payment) => {
      const matchesStatus =
        statusFilter === "all" || payment.status === statusFilter;
      const matchesSearch =
        !query ||
        payment.user_email?.toLowerCase().includes(query) ||
        payment.razorpay_order_id?.toLowerCase().includes(query) ||
        payment.razorpay_payment_id?.toLowerCase().includes(query) ||
        payment.coupon_code?.toLowerCase().includes(query) ||
        payment.tier.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [payments, searchTerm, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: payments.length };
    for (const payment of payments) {
      counts[payment.status] = (counts[payment.status] || 0) + 1;
    }
    return counts;
  }, [payments]);

  if (accessLoading || loading) {
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

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-12 pt-32">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/admin"
              className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Payment Records
            </h1>
            <p className="mt-2 text-muted-foreground">
              All payment attempts — success, pending, failed, and cancelled.
            </p>
          </div>
          <Button variant="outline" onClick={() => void fetchPayments()}>
            Refresh
          </Button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {(
            [
              ["all", "Total"],
              ["success", "Success"],
              ["pending", "Pending"],
              ["failed", "Failed"],
              ["cancelled", "Cancelled"],
            ] as const
          ).map(([key, label]) => (
            <div
              key={key}
              className="glass rounded-xl border border-border/50 p-4"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 text-2xl font-bold">{statusCounts[key] || 0}</p>
            </div>
          ))}
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by email, order ID, payment ID, coupon..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-11 w-full rounded-xl border bg-background/60 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 min-w-[180px] appearance-none rounded-xl border bg-background/60 pl-10 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All statuses</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
              <option value="credits_failed">Credits Failed</option>
            </select>
          </div>
        </div>

        <div className="glass overflow-hidden rounded-2xl border border-border/50">
          {filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <CreditCard className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">No payment records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Tier</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Coupon</th>
                    <th className="px-4 py-3 font-semibold">Order ID</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-4 py-3 font-semibold">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => {
                    const config = STATUS_CONFIG[payment.status];
                    const StatusIcon = config.icon;

                    return (
                      <tr
                        key={payment.id}
                        className="border-b border-border/30 hover:bg-muted/20"
                      >
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                              config.className,
                            )}
                          >
                            <StatusIcon className="h-3.5 w-3.5" />
                            {config.label}
                          </span>
                          {payment.error_message && (
                            <p
                              className="mt-1 max-w-[200px] truncate text-xs text-muted-foreground"
                              title={payment.error_message}
                            >
                              {payment.error_message}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{payment.user_email || "—"}</p>
                          <p className="text-xs text-muted-foreground">
                            {payment.credits} credit{payment.credits > 1 ? "s" : ""}
                          </p>
                        </td>
                        <td className="px-4 py-3 capitalize">{payment.tier}</td>
                        <td className="px-4 py-3 font-medium">
                          {formatAmount(payment.amount_in_paise, payment.currency)}
                        </td>
                        <td className="px-4 py-3">
                          {payment.coupon_code || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <p className="max-w-[140px] truncate font-mono text-xs">
                            {payment.razorpay_order_id || "—"}
                          </p>
                          {payment.razorpay_payment_id && (
                            <p
                              className="max-w-[140px] truncate font-mono text-xs text-muted-foreground"
                              title={payment.razorpay_payment_id}
                            >
                              {payment.razorpay_payment_id}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {formatDateTime(payment.created_at)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {formatDateTime(payment.completed_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
