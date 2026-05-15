import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
  Gauge,
  X,
  Check,
  Info,
  Upload,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { toast } from "@/hooks/use-toast";
import {
  ApiError,
  BRANCH_FILTERS,
  CATEGORIES,
  HOME_UNIVERSITIES,
  extractFcAcknowledgeDetails,
  getMetadata,
} from "@/lib/api";
import type { CutoffRequest } from "@/lib/api";
import {
  FC_ACK_DEPLOYED_MAX_FILE_SIZE_BYTES,
  FC_ACK_LANGUAGE_OPTIONS,
  FC_ACK_MAX_FILE_SIZE_BYTES,
  FC_ACK_RELIGION_OPTIONS,
  type FcAcknowledgeAutofillData,
} from "@/lib/fcAcknowledge";

interface FilterBarProps {
  onSearch: (filters: CutoffRequest) => void;
  isLoading: boolean;
}

type BranchFilters = Pick<
  CutoffRequest,
  "is_tech" | "is_electronic" | "is_other" | "is_civil" | "is_mechanical" | "is_electrical"
>;

const CATEGORY_API_MAP: Record<string, string> = {
  GOPEN: "OPEN",
  LOPEN: "OPEN",
  GOBCH: "OBC",
  LOBCH: "OBC",
  GOBC: "OBC",
  LOBC: "OBC",
  GSEBC: "SEBC",
  LSEBC: "SEBC",
  GSC: "SC",
  LSC: "SC",
  GST: "ST",
  LST: "ST",
  GVJN: "VJNT",
  LVJN: "VJNT",
  GNT1: "NT1",
  LNT1: "NT1",
  GNT2: "NT2",
  LNT2: "NT2",
  GNT3: "NT3",
  LNT3: "NT3",
  GEWS: "EWS",
  LEWS: "EWS",
  TFWS: "TFWS",
};

const GENDER_API_MAP: Record<string, string> = {
  Male: "Male",
  Female: "Female",
};

const RELIGION_OPTIONS = FC_ACK_RELIGION_OPTIONS;

const LANGUAGE_OPTIONS = FC_ACK_LANGUAGE_OPTIONS;
const FC_ACK_UPLOAD_DISPLAY_LIMIT_BYTES = import.meta.env.DEV
  ? FC_ACK_MAX_FILE_SIZE_BYTES
  : FC_ACK_DEPLOYED_MAX_FILE_SIZE_BYTES;

const normalizeCategoryOption = (value: string) => {
  if (value === "GOBCH" || value === "LOBCH") {
    return "OBC";
  }

  if (value.length > 1 && ["G", "L"].includes(value[0])) {
    return value.slice(1);
  }

  return value;
};

const formatPercentile = (value: number | string) => {
  const num = Number.parseFloat(String(value));
  if (!Number.isFinite(num)) {
    return "0";
  }

  return Number.isInteger(num) ? String(num) : num.toFixed(2);
};

/* ── Reusable chip for selected multi-select items ── */
function SelectedChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium leading-tight max-w-[160px]">
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="flex-shrink-0 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

/* ── Reusable multi-select dropdown item ── */
function MultiSelectItem({
  label,
  selected,
  onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`w-full text-left px-3 py-2.5 text-sm hover:bg-primary/10 transition-colors flex items-center gap-2 ${
        selected ? "text-primary font-medium bg-primary/5" : ""
      }`}
    >
      <div
        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
          selected ? "bg-primary border-primary" : "border-border/80"
        }`}
      >
        {selected && <Check className="w-3 h-3 text-white" />}
      </div>
      <span className="truncate">{label}</span>
    </button>
  );
}

/* ── Card wrapper for filter sections ── */
function FilterCard({
  children,
  className = "",
}: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[22px] border border-border/70 bg-white/80 p-4 sm:rounded-[26px] sm:p-5 ${className}`}>
      {children}
    </div>
  );
}

export function FilterBar({ onSearch, isLoading }: FilterBarProps) {
  const emptyBranches: BranchFilters = {
    is_tech: false,
    is_electronic: false,
    is_other: false,
    is_civil: false,
    is_mechanical: false,
    is_electrical: false,
  };

  const [expanded, setExpanded] = useState(true);
  const [studentName, setStudentName] = useState("");
  const [category, setCategory] = useState("");
  const [university, setUniversity] = useState("");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [religion, setReligion] = useState<string>("Not Applicable");
  const [language, setLanguage] = useState<string>("Not Applicable");
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);
  const [gender, setGender] = useState("");
  const [percentile, setPercentile] = useState<string | number>(75);
  const [jeePercentile, setJeePercentile] = useState<string | number>(0);
  const [branches, setBranches] = useState<BranchFilters>(emptyBranches);
  const [isEws, setIsEws] = useState(false);
  const [locationFlexibility, setLocationFlexibility] = useState<1 | 2 | 3>(3);
  const [courseType, setCourseType] = useState<"engineering" | "pharmacy">("engineering");
  const [selectedPharmacyCourses, setSelectedPharmacyCourses] = useState<string[]>(["Pharmacy", "Pharm D ( Doctor of Pharmacy)"]);
  const [isExtractingDocument, setIsExtractingDocument] = useState(false);
  const [uploadedDocumentName, setUploadedDocumentName] = useState("");

  /* search terms */
  const [categorySearch, setCategorySearch] = useState("");
  const [uniSearch, setUniSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [religionSearch, setReligionSearch] = useState("");
  const [languageSearch, setLanguageSearch] = useState("");
  const [divisionSearch, setDivisionSearch] = useState("");

  /* dropdown visibility */
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [showUniDropdown, setShowUniDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showReligionDropdown, setShowReligionDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showDivisionDropdown, setShowDivisionDropdown] = useState(false);

  /* data lists */
  const [universities, setUniversities] = useState(HOME_UNIVERSITIES);
  const [allCities, setAllCities] = useState<string[]>([]);
  const [metadataDivisions, setMetadataDivisions] = useState<Record<string, string[]>>({});

  const [pulseKey, setPulseKey] = useState(0);

  /* refs */
  const categoryRef = useRef<HTMLDivElement>(null);
  const universityRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const religionRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const divisionRef = useRef<HTMLDivElement>(null);
  const fcAcknowledgeInputRef = useRef<HTMLInputElement>(null);

  /* derived filtered lists */
  const divisions = Object.keys(metadataDivisions).sort();
  
  // Cities available based on selected divisions (or all cities if none selected)
  const availableCities = selectedDivisions.length > 0
    ? Array.from(new Set(selectedDivisions.flatMap(d => metadataDivisions[d] || []))).sort()
    : (allCities.length > 0 
        ? allCities 
        : Array.from(new Set(Object.values(metadataDivisions).flat())).sort()
      );

  const uniqueCategories = Array.from(
    new Set(CATEGORIES.map(normalizeCategoryOption).filter((c) => c !== "TFWS")),
  );

  const sortSearchResults = (results: string[], searchTerm: string) => {
    if (!searchTerm) return results;
    const s = searchTerm.toLowerCase();
    return results.sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const aStarts = aLower.startsWith(s);
      const bStarts = bLower.startsWith(s);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.localeCompare(b);
    });
  };

  const filteredCategories = sortSearchResults(
    uniqueCategories.filter((c) => c.toLowerCase().includes(categorySearch.toLowerCase())),
    categorySearch,
  );
  const filteredUniversities = sortSearchResults(
    universities.filter((u) => u.toLowerCase().includes(uniSearch.toLowerCase())),
    uniSearch,
  );
  const filteredCities = sortSearchResults(
    availableCities.filter((c) => c.toLowerCase().includes(citySearch.toLowerCase())),
    citySearch,
  );
  const filteredReligions = sortSearchResults(
    [...RELIGION_OPTIONS].filter((r) => r.toLowerCase().includes(religionSearch.toLowerCase())),
    religionSearch,
  );
  const filteredLanguages = sortSearchResults(
    [...LANGUAGE_OPTIONS].filter((l) => l.toLowerCase().includes(languageSearch.toLowerCase())),
    languageSearch,
  );
  const filteredDivisions = sortSearchResults(
    divisions.filter((d) => d.toLowerCase().includes(divisionSearch.toLowerCase())),
    divisionSearch,
  );

  /* ── Cleanup selected cities when they become unavailable ── */
  useEffect(() => {
    if (selectedDivisions.length > 0 && selectedCities.length > 0) {
      const validCities = selectedCities.filter(city => availableCities.includes(city));
      if (validCities.length !== selectedCities.length) {
        setSelectedCities(validCities);
      }
    }
  }, [selectedDivisions, availableCities, selectedCities]);

  /* ── Close dropdowns on outside click ── */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (categoryRef.current && !categoryRef.current.contains(target))
        setShowCatDropdown(false);
      if (universityRef.current && !universityRef.current.contains(target))
        setShowUniDropdown(false);
      if (cityRef.current && !cityRef.current.contains(target))
        setShowCityDropdown(false);
      if (religionRef.current && !religionRef.current.contains(target))
        setShowReligionDropdown(false);
      if (languageRef.current && !languageRef.current.contains(target))
        setShowLanguageDropdown(false);
      if (divisionRef.current && !divisionRef.current.contains(target))
        setShowDivisionDropdown(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ── Load metadata ── */
  useEffect(() => {
    let isMounted = true;

    const loadMetadata = async () => {
      try {
        const metadata = await getMetadata(courseType);
        if (!isMounted) return;
        
        setUniversities(metadata.universities.length > 0 ? metadata.universities : HOME_UNIVERSITIES);
        setAllCities(metadata.cities || []);
        setMetadataDivisions(metadata.divisions || {});
      } catch (error) {
        console.warn("Unable to load live filter metadata. Using fallback options.", error);
      }
    };

    void loadMetadata();
    return () => {
      isMounted = false;
    };
  }, [courseType]);

  /* ── Helpers ── */
  const closeOtherDropdowns = (keep: string) => {
    if (keep !== "cat") setShowCatDropdown(false);
    if (keep !== "uni") setShowUniDropdown(false);
    if (keep !== "city") setShowCityDropdown(false);
    if (keep !== "religion") setShowReligionDropdown(false);
    if (keep !== "language") setShowLanguageDropdown(false);
    if (keep !== "division") setShowDivisionDropdown(false);
  };

  const toggleArrayItem = (
    arr: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    item: string,
  ) => {
    setter(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);
  };

  const applyAutofillData = (data: FcAcknowledgeAutofillData) => {
    setStudentName(data.student_name ?? "");
    setCategory(data.user_category ?? "");
    setUniversity(data.user_home_university ?? "");
    setGender(data.user_gender ?? "");
    setPercentile(data.percentile_cet !== null ? String(data.percentile_cet) : "");
    setJeePercentile(data.percentile_ai !== null ? String(data.percentile_ai) : "");

    const extractedReligion =
      data.user_minority_list.find((item) =>
        RELIGION_OPTIONS.includes(item as (typeof RELIGION_OPTIONS)[number]),
      ) ?? "Not Applicable";
    const extractedLanguage =
      data.user_minority_list.find((item) =>
        LANGUAGE_OPTIONS.includes(item as (typeof LANGUAGE_OPTIONS)[number]),
      ) ?? "Not Applicable";

    setReligion(extractedReligion);
    setLanguage(extractedLanguage);
    setIsEws(data.is_ews ?? data.user_category === "EWS");

    if (data.course_type) {
      setCourseType(data.course_type);
      if (data.course_type === "pharmacy") {
        setSelectedPharmacyCourses(["Pharmacy", "Pharm D ( Doctor of Pharmacy)"]);
      }
    }
  };

  const handleFcAcknowledgeUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadedDocumentName(file.name);
    setIsExtractingDocument(true);

    try {
      const extracted = await extractFcAcknowledgeDetails(file);
      applyAutofillData(extracted);

      toast({
        title: "Details autofilled",
        description:
          "Review the extracted data and manually complete preferred city, division, branch filters, and location flexibility.",
      });
    } catch (error) {
      console.error("[FilterBar] FC acknowledgement extraction failed:", error);
      toast({
        title: "Autofill failed",
        description:
          error instanceof ApiError
            ? error.detail || error.message
            : error instanceof Error
              ? error.message
            : "We couldn't extract details from that FC acknowledgement file.",
        variant: "destructive",
      });
    } finally {
      setIsExtractingDocument(false);
      event.target.value = "";
    }
  };

  /* ── Search handler ── */
  const handleSearch = () => {
    setPulseKey((k) => k + 1);

    const pCet = Number.parseFloat(String(percentile));
    const pAi = Number.parseFloat(String(jeePercentile));

    const filters: CutoffRequest = {
      course_type: courseType,
      course_names: courseType === "pharmacy" ? selectedPharmacyCourses : undefined,
      user_category: CATEGORY_API_MAP[category] ?? category,
      student_name: studentName,
      user_minority_list: [
        ...(religion !== "Not Applicable" ? [religion] : []),
        ...(language !== "Not Applicable" ? [language] : []),
      ],
      user_home_university: university,
      user_gender: GENDER_API_MAP[gender] ?? gender,
      city: selectedCities.length > 0 ? selectedCities : null,
      division: selectedDivisions.length > 0 ? selectedDivisions : null,
      percentile_cet: Number.isNaN(pCet) ? 0 : Math.min(100, Math.max(0, pCet)),
      percentile_ai: Number.isNaN(pAi) ? 0 : Math.min(100, Math.max(0, pAi)),
      ...branches,
      is_ews: isEws,
      location_flexibility: locationFlexibility,
    };

    console.log("[FilterBar] Sending filters:", JSON.stringify(filters, null, 2));
    onSearch(filters);
  };

  /* ── Reset ── */
  const resetFilters = () => {
    setStudentName("");
    setCategory("");
    setUniversity("");
    setSelectedCities([]);
    setReligion("Not Applicable");
    setLanguage("Not Applicable");
    setSelectedDivisions([]);
    setGender("");
    setPercentile(75);
    setJeePercentile(0);
    setBranches(emptyBranches);
    setIsEws(false);
    setLocationFlexibility(3);
    setCourseType("engineering");
    setSelectedPharmacyCourses(["Pharmacy", "Pharm D ( Doctor of Pharmacy)"]);
    setCategorySearch("");
    setUniSearch("");
    setCitySearch("");
    setReligionSearch("");
    setLanguageSearch("");
    setDivisionSearch("");
    setShowReligionDropdown(false);
    setShowLanguageDropdown(false);
    setShowUniDropdown(false);
    setShowCityDropdown(false);
    setShowCatDropdown(false);
    setShowDivisionDropdown(false);
    setUploadedDocumentName("");
  };

  const canSearch = Boolean(
    studentName.trim() &&
    category &&
    university &&
    gender &&
    (courseType === "engineering" || (courseType === "pharmacy" && selectedPharmacyCourses.length > 0))
  );

  /* ── Percentile change handler (clamped 0–100) ── */
  const handlePercentileChange = (
    setter: React.Dispatch<React.SetStateAction<string | number>>,
    raw: string,
  ) => {
    if (raw === "") {
      setter("");
      return;
    }
    // Only allow digits and at most one decimal point
    if (/^\d*\.?\d*$/.test(raw)) {
      const parsed = parseFloat(raw);
      if (!isNaN(parsed) && parsed > 100) {
        setter("100");
      } else {
        setter(raw);
      }
    }
  };

  return (
    <motion.div layout className="panel-surface overflow-hidden relative">
      <AnimatePresence>
        {pulseKey > 0 && (
          <motion.div
            key={pulseKey}
            initial={{ opacity: 0.4, scale: 1 }}
            animate={{ opacity: 0, scale: 1.01 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 border-2 border-primary rounded-[30px] pointer-events-none z-20"
          />
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 border-b border-border/70 p-4 sm:p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/10">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
          </div>
          <div>
            <span className="font-semibold text-base block">Intelligent Filters</span>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] items-center gap-2 sm:flex sm:flex-wrap">
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-10 rounded-full px-4 sm:h-9">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
            className="rounded-full"
          >
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </Button>
        </div>
      </div>

      {/* ── Collapsible body ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-5 px-4 pb-5 pt-4 sm:px-5 sm:pb-6 sm:pt-5 md:px-6 md:space-y-6">



              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FilterCard>
                  <Label className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Course Type <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {[
                      { label: "Engineering", value: "engineering" },
                      { label: "Pharmacy", value: "pharmacy" },
                    ].map((c) => (
                      <Button
                        key={c.value}
                        variant={courseType === c.value ? "default" : "outline"}
                        size="sm"
                        className={`flex-1 rounded-xl transition-all ${
                          courseType === c.value ? "glow-subtle" : ""
                        }`}
                        onClick={() => setCourseType(c.value as "engineering" | "pharmacy")}
                      >
                        {c.label}
                      </Button>
                    ))}
                  </div>
                </FilterCard>

                <FilterCard>
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
              </div>

              {/* ── Row 1: Category · University · Gender ── */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

                {/* Category (single select) */}
                <div ref={categoryRef} className="relative">
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

                {/* University (single select) */}
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

                {/* Gender (single select buttons) */}
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

              {/* ── Row 2: City (multi) · Minority (multi) · Division (multi) ── */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

                {/* City — multi-select */}
                <div ref={cityRef} className="relative">
                  <FilterCard>
                    <Label className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Preferred City
                      {selectedCities.length > 0 && (
                        <span className="ml-auto text-primary font-bold">{selectedCities.length}</span>
                      )}
                    </Label>

                    {/* Selected chips */}
                    {selectedCities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {selectedCities.map((c) => (
                          <SelectedChip
                            key={c}
                            label={c}
                            onRemove={() =>
                              setSelectedCities((prev) => prev.filter((x) => x !== c))
                            }
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
                                onClick={() =>
                                  toggleArrayItem(selectedCities, setSelectedCities, c)
                                }
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

                {/* Religion — single select */}
                <div ref={religionRef} className="relative">
                  <FilterCard>
                    <Label className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Minority Religion
                    </Label>
                    <div
                      className="relative cursor-pointer"
                      onClick={() => {
                        closeOtherDropdowns("religion");
                        setShowReligionDropdown(!showReligionDropdown);
                      }}
                    >
                      <Input
                        placeholder="Select religion"
                        value={showReligionDropdown ? religionSearch : religion}
                        onChange={(e) => setReligionSearch(e.target.value)}
                        className="pr-8 rounded-2xl border-border/80 bg-white/90 focus-visible:ring-primary/40"
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

                {/* Language — single select */}
                <div ref={languageRef} className="relative">
                  <FilterCard>
                    <Label className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-wrap">
                      Minority Language / Ethnicity
                    </Label>
                    <div
                      className="relative cursor-pointer"
                      onClick={() => {
                        closeOtherDropdowns("language");
                        setShowLanguageDropdown(!showLanguageDropdown);
                      }}
                    >
                      <Input
                        placeholder="Select language"
                        value={showLanguageDropdown ? languageSearch : language}
                        onChange={(e) => setLanguageSearch(e.target.value)}
                        className="pr-8 rounded-2xl border-border/80 bg-white/90 focus-visible:ring-primary/40"
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

              {/* ── Row 3: Division · CET Percentile · JEE Percentile ── */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {/* Division — multi-select */}
                <div ref={divisionRef} className="relative">
                  <FilterCard>
                    <Label className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      <span>Division</span>
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
                            onRemove={() =>
                              setSelectedDivisions((prev) => prev.filter((x) => x !== d))
                            }
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
                                onClick={() =>
                                  toggleArrayItem(selectedDivisions, setSelectedDivisions, d)
                                }
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
                      value={jeePercentile}
                      onChange={(e) => handlePercentileChange(setJeePercentile, e.target.value)}
                      className="rounded-2xl border-border/80 bg-white/90 focus-visible:ring-primary/40"
                    />
                  </FilterCard>
                )}
              </div>

              {/* ── Row 4: Branch Filters (Engineering) ── */}
              {courseType === "engineering" && (
                <FilterCard className="md:p-5">
                  <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 block">
                    Branch Filters
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {BRANCH_FILTERS.map((b) => (
                      <motion.button
                        key={b.key}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() =>
                          setBranches((prev) => ({ ...prev, [b.key]: !prev[b.key] }))
                        }
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

              {/* ── Row 4: Course Selection (Pharmacy) ── */}
              {courseType === "pharmacy" && (
                <FilterCard className="md:p-5">
                  <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 block">
                    Pharmacy Course Selection
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Pharmacy",
                      "Pharm D ( Doctor of Pharmacy)"
                    ].map((course) => (
                      <motion.button
                        key={course}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() =>
                          setSelectedPharmacyCourses((prev) =>
                            prev.includes(course)
                              ? prev.filter((c) => c !== course)
                              : [...prev, course]
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

              {/* ── Row 4.5: Location Flexibility ── */}
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

              {/* ── Row 5: EWS + Generate ── */}
              <div className="flex flex-col gap-4 rounded-[22px] border border-border/70 bg-slate-50/95 p-4 sm:rounded-[26px] sm:p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3 sm:items-center">
                  <Switch checked={isEws} onCheckedChange={setIsEws} />
                  <div>
                    <Label className="text-xs text-foreground font-medium">EWS Quota</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Include EWS seat consideration in the shortlist.
                    </p>
                  </div>
                </div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full md:w-auto md:text-right"
                >
                  <Button
                    onClick={handleSearch}
                    disabled={isLoading || !canSearch}
                    className="relative h-12 w-full min-w-0 overflow-hidden rounded-2xl px-6 glow-primary group sm:min-w-[220px] sm:w-auto sm:px-8"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full"
                      />
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-1.5" />
                        Generate List
                      </>
                    )}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
