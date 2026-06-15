import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilterCard, formatPercentile } from "./filterBarShared";
import type { FilterFormState } from "./useFilterFormState";

type StepScoresCategoryProps = Pick<
  FilterFormState,
  | "category"
  | "setCategory"
  | "percentile"
  | "jeePercentile"
  | "courseType"
  | "categorySearch"
  | "setCategorySearch"
  | "showCatDropdown"
  | "setShowCatDropdown"
  | "filteredCategories"
  | "categoryRef"
  | "closeOtherDropdowns"
  | "handlePercentileChange"
  | "setPercentile"
  | "setJeePercentile"
>;

export function StepScoresCategory({
  category,
  setCategory,
  percentile,
  jeePercentile,
  courseType,
  categorySearch,
  setCategorySearch,
  showCatDropdown,
  setShowCatDropdown,
  filteredCategories,
  categoryRef,
  closeOtherDropdowns,
  handlePercentileChange,
  setPercentile,
  setJeePercentile,
}: StepScoresCategoryProps) {
  return (
    <div className="space-y-5">
      <div ref={categoryRef} className="relative max-w-xl mx-auto">
        <FilterCard>
          <Label className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Category <span className="text-red-500">*</span>
          </Label>
          <div
            className="relative cursor-pointer"
            onClick={() => {
              closeOtherDropdowns("cat");
              setShowCatDropdown(!showCatDropdown);
            }}
          >
            <Input
              placeholder="Select category"
              value={showCatDropdown ? categorySearch : category}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="pr-8 rounded-2xl border-border/80 bg-white/90 focus-visible:ring-primary/40"
            />
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
          <AnimatePresence>
            {showCatDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="absolute z-30 top-full mt-2 left-0 right-0 max-h-48 overflow-y-auto rounded-2xl glass-strong shadow-2xl border border-border/50"
              >
                {filteredCategories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCategory(c);
                      setCategorySearch("");
                      setShowCatDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-sm hover:bg-primary/10 transition-colors ${
                      c === category ? "text-primary font-medium bg-primary/5" : ""
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </FilterCard>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 max-w-2xl mx-auto">
        <FilterCard className="md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-3">
            <Label className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              CET Percentile
            </Label>
            <span className="text-sm font-mono font-bold text-primary tabular-nums">
              {formatPercentile(percentile)}
            </span>
          </div>
          <Input
            type="text"
            inputMode="decimal"
            placeholder="Enter your MHT-CET percentile"
            value={percentile}
            onChange={(e) => handlePercentileChange(setPercentile, e.target.value)}
            className="rounded-2xl border-border/80 bg-white/90 focus-visible:ring-primary/40"
          />
        </FilterCard>

        {courseType === "engineering" && (
          <FilterCard className="md:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <Label className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                JEE Percentile
              </Label>
              <span className="text-sm font-mono font-bold text-primary tabular-nums">
                {formatPercentile(jeePercentile)}
              </span>
            </div>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Optional — JEE Main percentile"
              value={jeePercentile}
              onChange={(e) => handlePercentileChange(setJeePercentile, e.target.value)}
              className="rounded-2xl border-border/80 bg-white/90 focus-visible:ring-primary/40"
            />
          </FilterCard>
        )}
      </div>
    </div>
  );
}
