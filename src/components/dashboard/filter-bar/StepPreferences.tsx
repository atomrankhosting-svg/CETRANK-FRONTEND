import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Info, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BRANCH_FILTERS } from "@/lib/api";
import { FilterCard, MultiSelectItem, SelectedChip } from "./filterBarShared";
import type { FilterFormState } from "./useFilterFormState";

type StepPreferencesProps = Pick<
  FilterFormState,
  | "selectedCities"
  | "setSelectedCities"
  | "selectedDivisions"
  | "setSelectedDivisions"
  | "citySearch"
  | "setCitySearch"
  | "divisionSearch"
  | "setDivisionSearch"
  | "showCityDropdown"
  | "setShowCityDropdown"
  | "showDivisionDropdown"
  | "setShowDivisionDropdown"
  | "availableCities"
  | "filteredCities"
  | "filteredDivisions"
  | "divisions"
  | "metadataDivisions"
  | "branches"
  | "setBranches"
  | "courseType"
  | "selectedPharmacyCourses"
  | "setSelectedPharmacyCourses"
  | "locationFlexibility"
  | "setLocationFlexibility"
  | "capRound"
  | "setCapRound"
  | "isEws"
  | "setIsEws"
  | "isTfws"
  | "setIsTfws"
  | "cityRef"
  | "divisionRef"
  | "closeOtherDropdowns"
  | "toggleArrayItem"
>;

export function StepPreferences({
  selectedCities,
  setSelectedCities,
  selectedDivisions,
  setSelectedDivisions,
  citySearch,
  setCitySearch,
  divisionSearch,
  setDivisionSearch,
  showCityDropdown,
  setShowCityDropdown,
  showDivisionDropdown,
  setShowDivisionDropdown,
  availableCities,
  filteredCities,
  filteredDivisions,
  divisions,
  metadataDivisions,
  branches,
  setBranches,
  courseType,
  selectedPharmacyCourses,
  setSelectedPharmacyCourses,
  locationFlexibility,
  setLocationFlexibility,
  capRound,
  setCapRound,
  isEws,
  setIsEws,
  isTfws,
  setIsTfws,
  cityRef,
  divisionRef,
  closeOtherDropdowns,
  toggleArrayItem,
}: StepPreferencesProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div ref={cityRef} className="relative">
          <FilterCard>
            <Label className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Preferred City
              {selectedCities.length > 0 && (
                <span className="ml-auto text-primary font-bold">{selectedCities.length}</span>
              )}
            </Label>

            {selectedCities.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedCities.map((c) => (
                  <SelectedChip
                    key={c}
                    label={c}
                    onRemove={() => setSelectedCities((prev) => prev.filter((x) => x !== c))}
                  />
                ))}
              </div>
            )}

            <div
              className="relative cursor-pointer"
              onClick={() => {
                closeOtherDropdowns("city");
                setShowCityDropdown(!showCityDropdown);
              }}
            >
              <Input
                placeholder={availableCities.length > 0 ? "Search cities…" : "Type city name"}
                value={citySearch}
                onChange={(e) => {
                  setCitySearch(e.target.value);
                  if (!showCityDropdown) setShowCityDropdown(true);
                }}
                onClick={(e) => e.stopPropagation()}
                className="pr-8 rounded-2xl border-border/80 bg-white/90 focus-visible:ring-primary/40"
              />
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>

            <AnimatePresence>
              {showCityDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-30 top-full mt-2 left-0 right-0 max-h-48 overflow-y-auto rounded-2xl glass-strong shadow-2xl border border-border/50"
                >
                  {!citySearch && availableCities.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedCities.length === availableCities.length) {
                          setSelectedCities([]);
                        } else {
                          setSelectedCities(availableCities);
                        }
                      }}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-primary/10 transition-colors flex items-center gap-2 border-b border-border/50 text-primary font-medium bg-primary/5 sticky top-0 z-10"
                    >
                      <span className="truncate">
                        {selectedCities.length === availableCities.length ? "Deselect All" : "Select All"}
                      </span>
                    </button>
                  )}
                  {filteredCities.length > 0 ? (
                    filteredCities.map((c) => (
                      <MultiSelectItem
                        key={c}
                        label={c}
                        selected={selectedCities.includes(c)}
                        onClick={() => toggleArrayItem(selectedCities, setSelectedCities, c)}
                      />
                    ))
                  ) : citySearch ? (
                    <div className="px-3 py-3 text-sm text-muted-foreground text-center">
                      No matching cities
                    </div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </FilterCard>
        </div>

        <div ref={divisionRef} className="relative xl:col-span-2">
          <FilterCard>
            <Label className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Preferred Division</span>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center p-0.5 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-200"
                    title="View cities in divisions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="z-[100] w-[calc(100vw-2.5rem)] max-w-80 overflow-hidden rounded-2xl border border-border/40 p-0 glass-strong shadow-2xl">
                  <div className="p-3 border-b border-border/50 bg-primary/5">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                      Divisions & Cities
                    </h4>
                  </div>
                  <div className="p-4 space-y-5 overflow-y-auto max-h-[320px] scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
                    {Object.entries(metadataDivisions)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([div, cities]) => (
                        <div key={div} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
                            <span className="text-[11px] font-bold text-foreground uppercase tracking-tight">
                              {div}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pl-3.5">
                            {cities.sort().map((city) => (
                              <span
                                key={city}
                                className="text-[10px] px-2.5 py-1 rounded-lg bg-secondary/40 text-muted-foreground border border-border/40 hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all duration-200"
                              >
                                {city}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
              {selectedDivisions.length > 0 && (
                <span className="ml-auto text-primary font-bold">{selectedDivisions.length}</span>
              )}
            </Label>

            {selectedDivisions.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedDivisions.map((d) => (
                  <SelectedChip
                    key={d}
                    label={d}
                    onRemove={() => setSelectedDivisions((prev) => prev.filter((x) => x !== d))}
                  />
                ))}
              </div>
            )}

            <div
              className="relative cursor-pointer"
              onClick={() => {
                closeOtherDropdowns("division");
                setShowDivisionDropdown(!showDivisionDropdown);
              }}
            >
              <Input
                placeholder={divisions.length > 0 ? "Search divisions…" : "No divisions loaded"}
                value={divisionSearch}
                onChange={(e) => {
                  setDivisionSearch(e.target.value);
                  if (!showDivisionDropdown) setShowDivisionDropdown(true);
                }}
                onClick={(e) => e.stopPropagation()}
                className="pr-8 rounded-2xl border-border/80 bg-white/90 focus-visible:ring-primary/40"
              />
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>

            <AnimatePresence>
              {showDivisionDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-30 top-full mt-2 left-0 right-0 max-h-48 overflow-y-auto rounded-2xl glass-strong shadow-2xl border border-border/50"
                >
                  {!divisionSearch && divisions.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedDivisions.length === divisions.length) {
                          setSelectedDivisions([]);
                        } else {
                          setSelectedDivisions(divisions);
                        }
                      }}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-primary/10 transition-colors flex items-center gap-2 border-b border-border/50 text-primary font-medium bg-primary/5 sticky top-0 z-10"
                    >
                      <span className="truncate">
                        {selectedDivisions.length === divisions.length ? "Deselect All" : "Select All"}
                      </span>
                    </button>
                  )}
                  {filteredDivisions.length > 0 ? (
                    filteredDivisions.map((d) => (
                      <MultiSelectItem
                        key={d}
                        label={d}
                        selected={selectedDivisions.includes(d)}
                        onClick={() => toggleArrayItem(selectedDivisions, setSelectedDivisions, d)}
                      />
                    ))
                  ) : divisionSearch ? (
                    <div className="px-3 py-3 text-sm text-muted-foreground text-center">
                      No matching divisions
                    </div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </FilterCard>
        </div>
      </div>

      {courseType === "engineering" && (
        <FilterCard className="md:p-5">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 block">
            Branch Filters
          </Label>
          <div className="flex flex-wrap gap-2">
            {BRANCH_FILTERS.map((b) => (
              <motion.button
                key={b.key}
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setBranches((prev) => ({ ...prev, [b.key]: !prev[b.key] }))}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                  branches[b.key]
                    ? "bg-primary text-primary-foreground border-primary glow-subtle"
                    : "bg-secondary/30 text-muted-foreground border-border hover:border-primary/40 hover:bg-primary/5"
                }`}
              >
                {b.label}
              </motion.button>
            ))}
          </div>
        </FilterCard>
      )}

      {courseType === "pharmacy" && (
        <FilterCard className="md:p-5">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 block">
            Pharmacy Course Selection <span className="text-red-500">*</span>
          </Label>
          <div className="flex flex-wrap gap-2">
            {["Pharmacy", "Pharm D ( Doctor of Pharmacy)"].map((course) => (
              <motion.button
                key={course}
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() =>
                  setSelectedPharmacyCourses((prev) =>
                    prev.includes(course) ? prev.filter((c) => c !== course) : [...prev, course],
                  )
                }
                className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                  selectedPharmacyCourses.includes(course)
                    ? "bg-primary text-primary-foreground border-primary glow-subtle"
                    : "bg-secondary/30 text-muted-foreground border-border hover:border-primary/40 hover:bg-primary/5"
                }`}
              >
                {course}
              </motion.button>
            ))}
          </div>
        </FilterCard>
      )}

      <FilterCard className="md:p-5">
        <Label className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Location Flexibility
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { label: "Strict (Local Only)", value: 1 },
            { label: "Moderate", value: 2 },
            { label: "Flexible (Prestige Upgrades)", value: 3 },
          ].map((lf) => (
            <Button
              key={lf.value}
              variant={locationFlexibility === lf.value ? "default" : "outline"}
              size="sm"
              className={`rounded-xl transition-all ${
                locationFlexibility === lf.value ? "glow-subtle" : ""
              }`}
              onClick={() => setLocationFlexibility(lf.value as 1 | 2 | 3)}
            >
              {lf.label}
            </Button>
          ))}
        </div>
      </FilterCard>

      <FilterCard className="md:p-5">
        <Label className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          <Target className="w-3.5 h-3.5 text-primary" />
          CAP Round
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center p-0.5 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-200"
                title="About CAP Round"
                onClick={(e) => e.stopPropagation()}
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="z-[100] w-72 rounded-2xl border border-border/40 p-4 glass-strong shadow-2xl">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                CAP Round Selection
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Select a CAP round to receive additional top-tier college recommendations tailored to
                that specific admission round. Click a selected round again to deselect.
              </p>
            </PopoverContent>
          </Popover>
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Round 1", value: 1 },
            { label: "Round 2", value: 2 },
            { label: "Round 3", value: 3 },
          ].map((cr) => (
            <Button
              key={cr.label}
              variant={capRound === cr.value ? "default" : "outline"}
              size="sm"
              className={`rounded-xl transition-all ${capRound === cr.value ? "glow-subtle" : ""}`}
              onClick={() => setCapRound(capRound === cr.value ? null : (cr.value as 1 | 2 | 3))}
            >
              {cr.label}
            </Button>
          ))}
        </div>
      </FilterCard>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-[22px] border border-border/70 bg-slate-50/95 p-4 sm:rounded-[26px] sm:p-5">
        <div className="flex items-start gap-3 sm:items-center">
          <Switch
            id="ews-quota-switch"
            checked={isEws}
            onCheckedChange={setIsEws}
            aria-labelledby="ews-quota-label"
            aria-describedby="ews-quota-help"
          />
          <div>
            <Label id="ews-quota-label" htmlFor="ews-quota-switch" className="text-xs text-foreground font-medium">
              EWS Quota
            </Label>
            <p id="ews-quota-help" className="text-[11px] text-muted-foreground">
              Include EWS seat consideration in the shortlist.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 sm:items-center">
          <Switch
            id="tfws-quota-switch"
            checked={isTfws}
            onCheckedChange={setIsTfws}
            aria-labelledby="tfws-quota-label"
            aria-describedby="tfws-quota-help"
          />
          <div>
            <Label id="tfws-quota-label" htmlFor="tfws-quota-switch" className="text-xs text-foreground font-medium">
              TFWS
            </Label>
            <p id="tfws-quota-help" className="text-[11px] text-muted-foreground">
              Include Tuition Fee Waiver Scheme seats in search.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
