import { motion } from "framer-motion";
import { MapPin, TrendingUp, BadgeCheck } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { CollegeResult } from "@/lib/api";

interface CollegeCardProps {
  college: CollegeResult;
  index: number;
  pageIndex?: number;
}

function AllocationTimeline({ data }: { data: CollegeResult }) {
  const steps = [
    { label: "Home Univ.", value: data.home_university || data.University || "Validated", status: true },
    { label: "Category", value: data.category || data.Category || "Applied", status: true },
    { label: "Branch", value: data.branch_name || data.Branch || "Matched", status: true },
    { label: "Seat Status", value: data.status || "Available", status: true },
  ];

  return (
    <div className="mt-4 space-y-3 border-t border-border/50 pt-4">
      
      
    </div>
  );
}

export function CollegeCard({ college, index, pageIndex }: CollegeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isCapTop = college.is_cap_top === true;
  // Use local page position for delay so page 2+ cards don't have a huge delay
  const localIndex = pageIndex !== undefined ? pageIndex : index % 50;

  const cutoffValue =
    college.CET_Percentile ??
    college.cet_percentile ??
    college.cutoff_percentile ??
    college.Percentile ??
    college.percentile ??
    0;

  const cutoff = Number.isInteger(Number(cutoffValue)) ? String(cutoffValue) : Number(cutoffValue).toFixed(2);

  const probability =
    Number(cutoffValue) > 0
      ? Math.min(95, Math.max(20, Math.round(100 - Math.abs(Number(cutoffValue) - 85) * 2)))
      : 50;

  const collegeName =
    college.college_name ||
    college.College ||
    college.Name ||
    college.name ||
    "Unknown College";

  const branchName = college.branch_name || college.Branch || college.branch || college.course_name || "";
  const city = college.city || college.City || "";
  const category =
    college.category ||
    college.Category ||
    college.seat_type ||
    college.SeatType ||
    college.reservation_category ||
    college.user_category ||
    "";
  const isTfwsEntry =
    college.is_tfws === true ||
    String(college.category ?? college.Category ?? college.seat_type ?? college.SeatType ?? college.reservation_category ?? "")
      .toUpperCase()
      .includes("TFWS");
  const year = college.year || college.Year || "";
  const round = college.round || college.Round || college.round_no || "";
  const rank = college.rank || college.Rank || college.merit_no || college.merit_rank || college.cap_rank || "";
  const fitLabel =
    probability >= 80 ? "Strong fit" : probability >= 60 ? "Worth comparing" : "Stretch option";

  return (
    <motion.div
      layout
      layoutId={`college-${index}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: localIndex * 0.02, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className="glass rounded-[30px] overflow-hidden cursor-pointer group card-beam transition-shadow hover:shadow-lg hover:shadow-primary/5 border border-border/70"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-4 sm:p-5 md:p-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[10px]">
                #{index + 1}
              </Badge>
              <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[10px] bg-white/80">
                {fitLabel}
              </Badge>
              {isCapTop && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="secondary"
                        className="rounded-full px-1.5 py-1 text-[10px] cursor-help bg-primary/10 text-primary border border-primary/20"
                      >
                        <BadgeCheck className="w-3.5 h-3.5" />
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-w-[260px] rounded-xl border border-border/50 bg-white px-3 py-2 text-xs text-muted-foreground shadow-xl"
                    >
                      This is a top-tier recommendation for your selected branches, shown regardless of location or rank constraints.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <h3 className="font-semibold text-base leading-snug pr-3 group-hover:text-primary transition-colors">
              {collegeName}
            </h3>
            {branchName && (
              <p className="text-sm text-muted-foreground mt-1.5">{branchName}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {city && (
            <Badge variant="secondary" className="text-[10px] gap-1 rounded-full px-2.5 py-1">
              <MapPin className="w-3 h-3" /> {city}
            </Badge>
          )}
          {category && (
            <Badge variant="outline" className="text-[10px] rounded-full px-2.5 py-1">{category}</Badge>
          )}
          {isTfwsEntry && (
            <Badge variant="outline" className="text-[10px] rounded-full px-2.5 py-1 border-violet-500/40 bg-violet-500/10 text-violet-700">
              TFWS
            </Badge>
          )}
          {year && (
            <Badge variant="outline" className="text-[10px] rounded-full px-2.5 py-1">{year}</Badge>
          )}
          {round && (
            <Badge variant="outline" className="text-[10px] rounded-full px-2.5 py-1">R{round}</Badge>
          )}
          {cutoff ? (
            <Badge variant="secondary" className="text-[10px] gap-1 rounded-full px-2.5 py-1">
              <TrendingUp className="w-3 h-3" /> {cutoff}
            </Badge>
          ) : null}
          {rank && (
            <Badge variant="outline" className="text-[10px] rounded-full px-2.5 py-1 border-primary/20 bg-primary/5 text-primary">
              Rank {rank}
            </Badge>
          )}
          {college.is_local !== undefined && (
            <Badge variant={college.is_local ? "outline" : "default"} className={`text-[10px] rounded-full px-2.5 py-1 ${college.is_local ? 'border-green-500/30 bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600 border-amber-500/30'}`}>
              {college.is_local ? "Local Match" : "Prestige Upgrade"}
            </Badge>
          )}
        </div>

      </div>

      
    </motion.div>
  );
}
