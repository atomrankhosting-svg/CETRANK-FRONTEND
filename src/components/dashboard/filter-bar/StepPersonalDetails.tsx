import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FilterCard } from "./filterBarShared";
import type { FilterFormState } from "./useFilterFormState";

type StepPersonalDetailsProps = Pick<
  FilterFormState,
  | "studentName"
  | "setStudentName"
  | "university"
  | "setUniversity"
  | "gender"
  | "setGender"
  | "religion"
  | "setReligion"
  | "language"
  | "setLanguage"
  | "uniSearch"
  | "setUniSearch"
  | "religionSearch"
  | "setReligionSearch"
  | "languageSearch"
  | "setLanguageSearch"
  | "showUniDropdown"
  | "setShowUniDropdown"
  | "showReligionDropdown"
  | "setShowReligionDropdown"
  | "showLanguageDropdown"
  | "setShowLanguageDropdown"
  | "filteredUniversities"
  | "filteredReligions"
  | "filteredLanguages"
  | "universityRef"
  | "religionRef"
  | "languageRef"
  | "closeOtherDropdowns"
>;

export function StepPersonalDetails({
  studentName,
  setStudentName,
  university,
  setUniversity,
  gender,
  setGender,
  religion,
  setReligion,
  language,
  setLanguage,
  uniSearch,
  setUniSearch,
  religionSearch,
  setReligionSearch,
  languageSearch,
  setLanguageSearch,
  showUniDropdown,
  setShowUniDropdown,
  showReligionDropdown,
  setShowReligionDropdown,
  showLanguageDropdown,
  setShowLanguageDropdown,
  filteredUniversities,
  filteredReligions,
  filteredLanguages,
  universityRef,
  religionRef,
  languageRef,
  closeOtherDropdowns,
}: StepPersonalDetailsProps) {
  const isReligionDefault = religion === "Not Applicable";
  const isLanguageDefault = language === "Not Applicable";

  return (
    <div className="space-y-5">
      <FilterCard className="max-w-xl mx-auto">
        <Label className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Student Full Name <span className="text-red-500">*</span>
        </Label>
        <Input
          placeholder="Enter student's full name"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          className="rounded-2xl border-border/80 bg-white/90 focus-visible:ring-primary/40"
        />
      </FilterCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div ref={universityRef} className="relative">
          <FilterCard>
            <Label className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Home University <span className="text-red-500">*</span>
            </Label>
            <div
              className="relative cursor-pointer"
              onClick={() => {
                closeOtherDropdowns("uni");
                setShowUniDropdown(!showUniDropdown);
              }}
            >
              <Input
                placeholder="Select home university"
                value={showUniDropdown ? uniSearch : university}
                onChange={(e) => setUniSearch(e.target.value)}
                className="pr-8 rounded-2xl border-border/80 bg-white/90 focus-visible:ring-primary/40"
              />
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            <AnimatePresence>
              {showUniDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-30 top-full mt-2 left-0 right-0 max-h-48 overflow-y-auto rounded-2xl glass-strong shadow-2xl border border-border/50"
                >
                  {filteredUniversities.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUniversity(u);
                        setUniSearch("");
                        setShowUniDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-sm hover:bg-primary/10 transition-colors ${
                        u === university ? "text-primary font-medium bg-primary/5" : ""
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </FilterCard>
        </div>

        <FilterCard>
          <Label className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Gender <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Male", value: "Male" },
              { label: "Female", value: "Female" },
            ].map((g) => (
              <Button
                key={g.label}
                variant={gender === g.value ? "default" : "outline"}
                size="sm"
                className={`flex-1 rounded-xl transition-all ${
                  gender === g.value ? "glow-subtle" : ""
                }`}
                onClick={() => setGender(g.value)}
              >
                {g.label}
              </Button>
            ))}
          </div>
        </FilterCard>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div ref={religionRef} className="relative">
          <FilterCard
            className={cn(
              "transition-opacity",
              isReligionDefault && "opacity-70 bg-secondary/20 border-dashed",
            )}
          >
            <Label className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Minority Religion
              <span className="ml-auto text-[9px] font-normal normal-case tracking-normal text-muted-foreground/80">
                Optional
              </span>
            </Label>
            <div
              className="relative cursor-pointer"
              onClick={() => {
                closeOtherDropdowns("religion");
                setShowReligionDropdown(!showReligionDropdown);
              }}
            >
              <Input
                placeholder="Not Applicable"
                value={showReligionDropdown ? religionSearch : religion}
                onChange={(e) => setReligionSearch(e.target.value)}
                className={cn(
                  "pr-8 rounded-2xl border-border/80 focus-visible:ring-primary/40",
                  isReligionDefault ? "bg-secondary/30 text-muted-foreground" : "bg-white/90",
                )}
              />
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            <AnimatePresence>
              {showReligionDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-30 top-full mt-2 left-0 right-0 max-h-48 overflow-y-auto rounded-2xl glass-strong shadow-2xl border border-border/50"
                >
                  {filteredReligions.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReligion(r);
                        setReligionSearch("");
                        setShowReligionDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-sm hover:bg-primary/10 transition-colors flex items-center gap-2 ${
                        r === religion ? "text-primary font-medium bg-primary/5" : ""
                      }`}
                    >
                      <span className="truncate">{r}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </FilterCard>
        </div>

        <div ref={languageRef} className="relative">
          <FilterCard
            className={cn(
              "transition-opacity",
              isLanguageDefault && "opacity-70 bg-secondary/20 border-dashed",
            )}
          >
            <Label className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-wrap">
              Minority Language / Ethnicity
              <span className="ml-auto text-[9px] font-normal normal-case tracking-normal text-muted-foreground/80">
                Optional
              </span>
            </Label>
            <div
              className="relative cursor-pointer"
              onClick={() => {
                closeOtherDropdowns("language");
                setShowLanguageDropdown(!showLanguageDropdown);
              }}
            >
              <Input
                placeholder="Not Applicable"
                value={showLanguageDropdown ? languageSearch : language}
                onChange={(e) => setLanguageSearch(e.target.value)}
                className={cn(
                  "pr-8 rounded-2xl border-border/80 focus-visible:ring-primary/40",
                  isLanguageDefault ? "bg-secondary/30 text-muted-foreground" : "bg-white/90",
                )}
              />
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            <AnimatePresence>
              {showLanguageDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-30 top-full mt-2 left-0 right-0 max-h-48 overflow-y-auto rounded-2xl glass-strong shadow-2xl border border-border/50"
                >
                  {filteredLanguages.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLanguage(l);
                        setLanguageSearch("");
                        setShowLanguageDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-sm hover:bg-primary/10 transition-colors flex items-center gap-2 ${
                        l === language ? "text-primary font-medium bg-primary/5" : ""
                      }`}
                    >
                      <span className="truncate">{l}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </FilterCard>
        </div>
      </div>
    </div>
  );
}
