import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { SiteBackdrop } from "@/components/effects/SiteBackdrop";
import { Users, FileText, Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminStats {
  total_users: number;
  total_lists: number;
}

const AdminDashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        if (!profile?.is_admin) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        setIsAdmin(true);

        const { data, error } = await supabase.rpc("get_admin_stats");

        if (error) throw error;
        setStats(data as AdminStats);
      } catch (error) {
        console.error("Error fetching admin stats:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchAdminData();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || isAdmin === false) {
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

        <div className="mt-12 flex justify-center">
          <Link to="/admin/all-lists">
            <Button
              size="lg"
              className="h-14 rounded-full px-8 text-base shadow-lg transition-all hover:shadow-primary/25"
            >
              See All Generated Lists
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
