import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { SiteBackdrop } from "@/components/effects/SiteBackdrop";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { CollegeCard } from "@/components/dashboard/CollegeCard";
import { downloadCollegeListPdf } from "@/lib/collegePdf";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  FileText,
  History,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CollegeResult, UserDetails } from "@/lib/api";

interface SavedListPayload {
  results: CollegeResult[];
  user_details?: UserDetails | null;
  count?: number;
}

interface SavedList {
  id: string;
  created_at: string;
  list_data: CollegeResult[] | SavedListPayload;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const relativeTime = (iso: string) => {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
};

const getSavedColleges = (listData: SavedList["list_data"]) =>
  Array.isArray(listData) ? listData : listData.results ?? [];

const getSavedFilters = (listData: SavedList["list_data"]) =>
  Array.isArray(listData) ? null : listData.user_details ?? null;

const MyLists = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [lists, setLists] = useState<SavedList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchLists = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("college_lists")
        .select("id, created_at, list_data")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch lists:", error);
        toast({
          title: "Error",
          description: "Couldn't load your saved lists.",
          variant: "destructive",
        });
      } else {
        setLists((data as SavedList[]) || []);
      }

      setIsLoading(false);
    };

    fetchLists();
  }, [user]);

  const handleDownload = async (list: SavedList) => {
    setDownloadingId(list.id);
    try {
      const colleges = getSavedColleges(list.list_data);
      const userDetails = getSavedFilters(list.list_data);

      await downloadCollegeListPdf({
        results: colleges,
        userDetails,
        filters: userDetails as any,
      });
      toast({ title: "Downloaded", description: "PDF saved successfully." });
    } catch (error) {
      console.error(error);
      toast({
        title: "Download failed",
        description: "Couldn't generate the PDF.",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (listId: string) => {
    setDeletingId(listId);
    const { error } = await supabase
      .from("college_lists")
      .delete()
      .eq("id", listId)
      .eq("user_id", user!.id);

    if (error) {
      toast({
        title: "Delete failed",
        description: "Couldn't remove this list.",
        variant: "destructive",
      });
    } else {
      setLists((prev) => prev.filter((l) => l.id !== listId));
      if (expandedId === listId) setExpandedId(null);
      toast({ title: "Deleted", description: "List removed from history." });
    }
    setDeletingId(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // ── Loading State ──
  if (isLoading) {
    return (
      <div className="app-shell">
        <SiteBackdrop particleCount={isMobile ? 0 : 10} variant="focused" />
        <Navbar />
        <div className="relative z-10 mx-auto flex max-w-5xl items-center justify-center px-4 pt-36 pb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 text-muted-foreground"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Loading your lists…</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <SiteBackdrop particleCount={isMobile ? 0 : 10} variant="focused" />
      <Navbar />

      <div className="relative z-10 mx-auto max-w-5xl px-3 pb-24 pt-24 sm:px-4 sm:pb-12 sm:pt-28">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <div className="mb-2 flex items-start gap-3 sm:items-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-teal-400/15 shadow-sm">
              <History className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold font-['Outfit']">My Lists</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-lg">
            All the college lists you've generated so far. Expand any list to preview or download it again.
          </p>
        </motion.div>

        {/* Empty State */}
        {lists.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass rounded-[32px] border border-border/70 flex flex-col items-center justify-center py-24 px-6 text-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600/10 to-teal-500/10 flex items-center justify-center mb-6 shadow-lg shadow-blue-600/5">
              <FileText className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2 font-['Outfit']">
              No Lists Yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Head to the{" "}
              <a
                href="/list-generator"
                className="text-primary font-medium hover:underline"
              >
                List Generator
              </a>{" "}
              to create your first personalised college list.
            </p>
          </motion.div>
        )}

        {/* Lists */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {lists.map((list, idx) => {
              const isExpanded = expandedId === list.id;
              const colleges = getSavedColleges(list.list_data);
              const savedFilters = getSavedFilters(list.list_data);
              const previewColleges = colleges.slice(0, 3);

              // Try to extract a meaningful summary from the first result
              const firstCollege = colleges[0];
              const category =
                savedFilters?.user_category ||
                firstCollege?.user_category ||
                firstCollege?.category ||
                firstCollege?.Category ||
                "";

              return (
                <motion.div
                  key={list.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{
                    delay: idx * 0.04,
                    duration: 0.45,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="glass rounded-[26px] border border-border/70 overflow-hidden transition-shadow hover:shadow-lg hover:shadow-primary/5"
                >
                  {/* Card Header */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(list.id)}
                    className="group flex w-full flex-col gap-4 px-4 py-4 text-left sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-cyan-400/10 text-primary font-bold text-sm shadow-sm">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm group-hover:text-primary transition-colors">
                            {colleges.length} college
                            {colleges.length !== 1 ? "s" : ""}
                          </span>
                          {category && (
                            <span className="text-[10px] font-medium uppercase tracking-wider rounded-full border border-border/60 bg-white/80 px-2 py-0.5 text-muted-foreground">
                              {category}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          <span title={formatDate(list.created_at)}>
                            {relativeTime(list.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:shrink-0 sm:self-auto">
                      {/* Action buttons — stop propagation so they don't toggle expand */}
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full border-border/60"
                        disabled={downloadingId === list.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(list);
                        }}
                        title="Download PDF"
                      >
                        {downloadingId === list.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                        disabled={deletingId === list.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(list.id);
                        }}
                        title="Delete list"
                      >
                        {deletingId === list.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>

                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground transition-transform" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-3 border-t border-border/50 px-4 py-4 sm:px-6 sm:py-5">
                          <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs text-muted-foreground font-medium">
                              Showing all {colleges.length} college
                              {colleges.length !== 1 ? "s" : ""} in this list
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 rounded-full text-xs"
                              disabled={downloadingId === list.id}
                              onClick={() => handleDownload(list)}
                            >
                              <Download className="h-3.5 w-3.5 mr-1.5" />
                              Download PDF
                            </Button>
                          </div>

                          {colleges.map((college, cIdx) => (
                            <CollegeCard
                              key={cIdx}
                              college={college}
                              index={cIdx}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Collapsed preview — show first 3 college names */}
                  {!isExpanded && previewColleges.length > 0 && (
                    <div className="border-t border-border/40 px-4 py-3 sm:px-6">
                      <div className="flex flex-wrap gap-1.5">
                        {previewColleges.map((c, i) => {
                          const name =
                            c.college_name ||
                            c.College ||
                            c.Name ||
                            c.name ||
                            "College";
                          return (
                            <span
                              key={i}
                              className="inline-block max-w-[200px] truncate rounded-full bg-slate-100/80 px-2.5 py-1 text-[10px] font-medium text-muted-foreground"
                            >
                              {name}
                            </span>
                          );
                        })}
                        {colleges.length > 3 && (
                          <span className="inline-block rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                            +{colleges.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default MyLists;
