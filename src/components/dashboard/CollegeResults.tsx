import { motion, AnimatePresence } from "framer-motion";
import { CollegeCard } from "./CollegeCard";
import { ListUnlockBanner } from "./ListUnlockBanner";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ChevronLeft, ChevronRight, Download, GraduationCap, Search } from "lucide-react";
import type { CollegeResult } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { BROADEN_FILTERS_ADVICE, MIN_LIST_OPTIONS_FOR_CREDIT, PREVIEW_COLLEGE_COUNT } from "@/lib/listConstants";

interface CollegeResultsProps {
  results: CollegeResult[];
  isLoading: boolean;
  hasSearched: boolean;
  creditNotCharged?: boolean;
  isLocked?: boolean;
  totalCount?: number;
  lockedCount?: number;
  hasCredits?: boolean;
  onUnlock?: () => void;
  onDownloadPdf: () => void | Promise<void>;
  isDownloadingPdf: boolean;
}

export function CollegeResults({
  results,
  isLoading,
  hasSearched,
  creditNotCharged = false,
  isLocked = false,
  totalCount = 0,
  lockedCount = 0,
  hasCredits = false,
  onUnlock,
  onDownloadPdf,
  isDownloadingPdf,
}: CollegeResultsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const displayTotal = isLocked ? totalCount : results.length;
  const visibleResults = isLocked ? results.slice(0, PREVIEW_COLLEGE_COUNT) : results;
  const totalPages = Math.max(1, Math.ceil(visibleResults.length / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const paginatedResults = visibleResults.slice(pageStart, pageStart + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [results]);

  if (isLoading) {
    return (
      <div className="space-y-3 relative">
        <motion.div
          initial={{ top: 0 }}
          animate={{ top: "100%" }}
          transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
          className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent z-10 rounded-full shadow-lg shadow-primary/30"
        />
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl p-5 space-y-3"
          >
            <div className="flex justify-between">
              <Skeleton className="h-4 w-52 rounded-lg" />
              <Skeleton className="h-4 w-24 rounded-lg" />
            </div>
            <Skeleton className="h-3 w-36 rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass rounded-[32px] border border-border/70 flex flex-col items-center justify-center py-24 px-6 text-center"
      >
        
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600/10 to-teal-500/10 flex items-center justify-center mb-6 shadow-lg shadow-blue-600/5">
            <GraduationCap className="w-10 h-10 text-primary" />
          </div>
        <h3 className="text-xl font-bold mb-2 font-['Outfit']">Start Building Your List</h3>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
          Set your filters above and click <span className="text-primary font-medium">Generate List </span>
          to generate a cleaner shortlist with realistic options.
        </p>
      </motion.div>
    );
  }

  if (results.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-[32px] border border-border/70 flex flex-col items-center justify-center py-24 px-6 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground max-w-md leading-relaxed">
          No results found for the current profile. Try adjusting your percentile or enabling more branches.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">

      <div className="mb-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-muted-foreground font-medium">
              {isLocked
                ? `Showing ${PREVIEW_COLLEGE_COUNT} of ${displayTotal} colleges`
                : `${results.length} college${results.length !== 1 ? "s" : ""} found`}
            </span>
          </div>

          {results.length > 0 && results.length < MIN_LIST_OPTIONS_FOR_CREDIT && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-1.5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] font-medium text-amber-700 dark:text-amber-400 sm:items-center sm:rounded-full sm:py-1"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>
                {creditNotCharged
                  ? `Below ${MIN_LIST_OPTIONS_FOR_CREDIT} options — no credit used. ${BROADEN_FILTERS_ADVICE}`
                  : BROADEN_FILTERS_ADVICE}
              </span>
            </motion.div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-full border-border/70 bg-white/85 sm:w-auto"
          onClick={onDownloadPdf}
          disabled={isDownloadingPdf || isLocked}
          title={isLocked ? "Unlock the full list to download PDF" : undefined}
        >
          <Download className="h-4 w-4" />
          {isDownloadingPdf ? "Preparing PDF..." : "Download PDF"}
        </Button>
      </div>

      <AnimatePresence mode="popLayout">
        <div className="space-y-3">
          {paginatedResults.map((college, index) => (
            <CollegeCard key={pageStart + index} college={college} index={pageStart + index} pageIndex={index} />
          ))}
        </div>
      </AnimatePresence>

      {isLocked && onUnlock && (
        <ListUnlockBanner
          lockedCount={lockedCount}
          hasCredits={hasCredits}
          onUnlock={onUnlock}
        />
      )}

      {!isLocked && visibleResults.length > pageSize && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-xs text-muted-foreground text-center font-medium">
            Showing {pageStart + 1} - {Math.min(pageStart + pageSize, visibleResults.length)} of {visibleResults.length} results.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
              .map((page, index, pages) => (
                <div key={page} className="flex items-center gap-2">
                  {index > 0 && page - pages[index - 1] > 1 ? (
                    <span className="px-1 text-sm text-muted-foreground">...</span>
                  ) : null}
                  <Button
                    type="button"
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    className="min-w-10 rounded-full"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                </div>
              ))}

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
