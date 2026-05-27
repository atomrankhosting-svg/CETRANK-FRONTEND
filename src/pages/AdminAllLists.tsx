import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useAdminAccess } from "@/hooks/use-admin-access";
import { SiteBackdrop } from "@/components/effects/SiteBackdrop";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 20;

export default function AdminAllLists() {
  const { user, loading: accessLoading, allowed } = useAdminAccess();
  const [loading, setLoading] = useState(true);
  const [lists, setLists] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!allowed || !user) {
      setLoading(false);
      return;
    }

    const fetchLists = async () => {
      try {
        setLoading(true);

        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, count, error } = await supabase
          .from("college_lists")
          .select("id, user_id, created_at, list_data", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(from, to);

        if (error) throw error;

        setLists(data || []);
        if (count !== null) setTotalCount(count);
      } catch (error) {
        console.error("Error fetching global lists:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchLists();
  }, [user, allowed, page]);

  if (accessLoading || (loading && lists.length === 0)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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
              Global Lists Archive
            </h1>
            <p className="text-muted-foreground">
              Showing {lists.length} lists on this page (Total across platform:{" "}
              {totalCount}).
            </p>
          </div>
        </div>

        <div className="glass overflow-hidden rounded-[24px] border border-border/70">
          <div className="divide-y divide-border/50">
            {lists.map((list) => {
              const collegeCount = Array.isArray(list.list_data)
                ? list.list_data.length
                : list.list_data?.results?.length || 0;

              return (
                <div
                  key={list.id}
                  className="flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-white/40 sm:flex-row sm:items-center sm:p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="hidden items-center justify-center rounded-full bg-primary/10 p-3 text-primary sm:flex">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="mb-1 text-base font-semibold text-foreground">
                        {collegeCount} Colleges Generated
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                        <UserCircle className="w-3.5 h-3.5" />
                        {list.user_id}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 rounded-full bg-secondary/50 px-3 py-1.5 text-left text-sm font-medium text-muted-foreground sm:text-right">
                    {new Date(list.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              );
            })}

            {lists.length === 0 && (
              <div className="p-12 text-center font-medium text-muted-foreground">
                No lists have been generated yet.
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full"
            disabled={page === 0 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <span className="rounded-full border border-border/50 bg-white/50 px-4 py-2 text-sm font-semibold text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full"
            disabled={page >= totalPages - 1 || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </main>
    </div>
  );
}
