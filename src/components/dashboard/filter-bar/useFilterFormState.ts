import { useEffect, useRef, useState, type ChangeEvent, type Dispatch, type SetStateAction } from "react";
import { toast } from "@/hooks/use-toast";
import {
  ApiError,
  CATEGORIES,
  HOME_UNIVERSITIES,
  extractFcAcknowledgeDetails,
  getMetadata,
} from "@/lib/api";
import type { CutoffRequest } from "@/lib/api";
import type { FcAcknowledgeAutofillData } from "@/lib/fcAcknowledge";
import {
  CATEGORY_API_MAP,
  EMPTY_BRANCHES,
  GENDER_API_MAP,
  LANGUAGE_OPTIONS,
  MANUAL_TFWS_STORAGE_KEY,
  RELIGION_OPTIONS,
  normalizeCategoryOption,
  sortSearchResults,
  type BranchFilters,
  type FormStep,
} from "./filterBarShared";
import {
  clearFilterFormDraft,
  loadFilterFormDraft,
  saveFilterFormDraft,
  type FilterFormDraft,
} from "@/lib/filterFormDraft";

interface UseFilterFormStateOptions {
  onSearch: (filters: CutoffRequest) => void;
  currentStep?: FormStep;
}

const getInitialField = <K extends keyof FilterFormDraft>(
  key: K,
  fallback: FilterFormDraft[K],
): FilterFormDraft[K] => {
  const draft = loadFilterFormDraft();
  if (draft && draft[key] !== undefined && draft[key] !== null) {
    return draft[key];
  }
  return fallback;
};

export function useFilterFormState({ onSearch, currentStep = 1 }: UseFilterFormStateOptions) {
  const [studentName, setStudentName] = useState(() => getInitialField("studentName", ""));
  const [category, setCategory] = useState(() => getInitialField("category", ""));
  const [university, setUniversity] = useState(() => getInitialField("university", ""));
  const [selectedCities, setSelectedCities] = useState<string[]>(() =>
    getInitialField("selectedCities", []),
  );
  const [religion, setReligion] = useState<string>(() =>
    getInitialField("religion", "Not Applicable"),
  );
  const [language, setLanguage] = useState<string>(() =>
    getInitialField("language", "Not Applicable"),
  );
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>(() =>
    getInitialField("selectedDivisions", []),
  );
  const [gender, setGender] = useState(() => getInitialField("gender", ""));
  const [percentile, setPercentile] = useState<string | number>(() =>
    getInitialField("percentile", ""),
  );
  const [jeePercentile, setJeePercentile] = useState<string | number>(() =>
    getInitialField("jeePercentile", ""),
  );
  const [branches, setBranches] = useState<BranchFilters>(() =>
    getInitialField("branches", EMPTY_BRANCHES),
  );
  const [isEws, setIsEws] = useState(() => getInitialField("isEws", false));
  const [isTfws, setIsTfws] = useState(() => getInitialField("isTfws", false));
  const [locationFlexibility, setLocationFlexibility] = useState<1 | 2 | 3>(() =>
    getInitialField("locationFlexibility", 3),
  );
  const [capRound, setCapRound] = useState<1 | 2 | 3 | null>(() =>
    getInitialField("capRound", null),
  );
  const [courseType, setCourseType] = useState<"engineering" | "pharmacy">(() =>
    getInitialField("courseType", "engineering"),
  );
  const [selectedPharmacyCourses, setSelectedPharmacyCourses] = useState<string[]>(() =>
    getInitialField("selectedPharmacyCourses", ["Pharmacy", "Pharm D ( Doctor of Pharmacy)"]),
  );
  const [isExtractingDocument, setIsExtractingDocument] = useState(false);
  const [uploadedDocumentName, setUploadedDocumentName] = useState("");

  const [categorySearch, setCategorySearch] = useState("");
  const [uniSearch, setUniSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [religionSearch, setReligionSearch] = useState("");
  const [languageSearch, setLanguageSearch] = useState("");
  const [divisionSearch, setDivisionSearch] = useState("");

  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [showUniDropdown, setShowUniDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showReligionDropdown, setShowReligionDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showDivisionDropdown, setShowDivisionDropdown] = useState(false);

  const [universities, setUniversities] = useState(HOME_UNIVERSITIES);
  const [allCities, setAllCities] = useState<string[]>([]);
  const [metadataDivisions, setMetadataDivisions] = useState<Record<string, string[]>>({});

  const [pulseKey, setPulseKey] = useState(0);

  const categoryRef = useRef<HTMLDivElement>(null);
  const universityRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const religionRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const divisionRef = useRef<HTMLDivElement>(null);
  const fcAcknowledgeInputRef = useRef<HTMLInputElement>(null);

  const divisions = Object.keys(metadataDivisions).sort();

  const availableCities =
    selectedDivisions.length > 0
      ? Array.from(new Set(selectedDivisions.flatMap((d) => metadataDivisions[d] || []))).sort()
      : allCities.length > 0
        ? allCities
        : Array.from(new Set(Object.values(metadataDivisions).flat())).sort();

  const uniqueCategories = Array.from(
    new Set(CATEGORIES.map(normalizeCategoryOption).filter((c) => c !== "TFWS")),
  );

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

  useEffect(() => {
    if (selectedDivisions.length > 0 && selectedCities.length > 0) {
      const validCities = selectedCities.filter((city) => availableCities.includes(city));
      if (validCities.length !== selectedCities.length) {
        setSelectedCities(validCities);
      }
    }
  }, [selectedDivisions, availableCities, selectedCities]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (categoryRef.current && !categoryRef.current.contains(target)) setShowCatDropdown(false);
      if (universityRef.current && !universityRef.current.contains(target)) setShowUniDropdown(false);
      if (cityRef.current && !cityRef.current.contains(target)) setShowCityDropdown(false);
      if (religionRef.current && !religionRef.current.contains(target)) setShowReligionDropdown(false);
      if (languageRef.current && !languageRef.current.contains(target)) setShowLanguageDropdown(false);
      if (divisionRef.current && !divisionRef.current.contains(target)) setShowDivisionDropdown(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedTfws = window.localStorage.getItem(MANUAL_TFWS_STORAGE_KEY);
    if (savedTfws === "true") {
      setIsTfws(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(MANUAL_TFWS_STORAGE_KEY, String(isTfws));
  }, [isTfws]);

  useEffect(() => {
    saveFilterFormDraft({
      currentStep,
      studentName,
      category,
      university,
      selectedCities,
      religion,
      language,
      selectedDivisions,
      gender,
      percentile,
      jeePercentile,
      branches,
      isEws,
      isTfws,
      locationFlexibility,
      capRound,
      courseType,
      selectedPharmacyCourses,
    });
  }, [
    currentStep,
    studentName,
    category,
    university,
    selectedCities,
    religion,
    language,
    selectedDivisions,
    gender,
    percentile,
    jeePercentile,
    branches,
    isEws,
    isTfws,
    locationFlexibility,
    capRound,
    courseType,
    selectedPharmacyCourses,
  ]);

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
    setter: Dispatch<SetStateAction<string[]>>,
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
    setIsTfws((data.user_category ?? "").toUpperCase() === "TFWS");

    if (data.course_type) {
      setCourseType(data.course_type);
      if (data.course_type === "pharmacy") {
        setSelectedPharmacyCourses(["Pharmacy", "Pharm D ( Doctor of Pharmacy)"]);
      }
    }
  };

  const handleFcAcknowledgeUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedDocumentName(file.name);
    setIsExtractingDocument(true);

    try {
      const extracted = await extractFcAcknowledgeDetails(file);
      applyAutofillData(extracted);

      toast({
        title: "Details autofilled",
        description:
          "Review the extracted data and manually complete preferred city, preferred division, branch filters, and location flexibility.",
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

  const buildFilters = (): CutoffRequest => {
    const pCet = Number.parseFloat(String(percentile));
    const pAi = Number.parseFloat(String(jeePercentile));

    return {
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
      is_tfws: isTfws,
      location_flexibility: locationFlexibility,
      cap_no: capRound,
    };
  };

  const handleSearch = () => {
    setPulseKey((k) => k + 1);
    const filters = buildFilters();
    console.log("[FilterBar] Sending filters:", JSON.stringify(filters, null, 2));
    onSearch(filters);
  };

  const resetFilters = () => {
    setStudentName("");
    setCategory("");
    setUniversity("");
    setSelectedCities([]);
    setReligion("Not Applicable");
    setLanguage("Not Applicable");
    setSelectedDivisions([]);
    setGender("");
    setPercentile("");
    setJeePercentile("");
    setBranches(EMPTY_BRANCHES);
    setIsEws(false);
    setIsTfws(false);
    setLocationFlexibility(3);
    setCapRound(null);
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
    clearFilterFormDraft();
  };

  const canProceedStep = (step: FormStep) => {
    switch (step) {
      case 1:
        return Boolean(category);
      case 2:
        return Boolean(studentName.trim() && university && gender);
      case 3:
        return courseType === "engineering" || selectedPharmacyCourses.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const canSearch = Boolean(
    studentName.trim() &&
      category &&
      university &&
      gender &&
      (courseType === "engineering" || (courseType === "pharmacy" && selectedPharmacyCourses.length > 0)),
  );

  const handlePercentileChange = (
    setter: Dispatch<SetStateAction<string | number>>,
    raw: string,
  ) => {
    if (raw === "") {
      setter("");
      return;
    }
    if (/^\d*\.?\d*$/.test(raw)) {
      const parsed = parseFloat(raw);
      if (!isNaN(parsed) && parsed > 100) {
        setter("100");
      } else {
        setter(raw);
      }
    }
  };

  return {
    studentName,
    setStudentName,
    category,
    setCategory,
    university,
    setUniversity,
    selectedCities,
    setSelectedCities,
    religion,
    setReligion,
    language,
    setLanguage,
    selectedDivisions,
    setSelectedDivisions,
    gender,
    setGender,
    percentile,
    setPercentile,
    jeePercentile,
    setJeePercentile,
    branches,
    setBranches,
    isEws,
    setIsEws,
    isTfws,
    setIsTfws,
    locationFlexibility,
    setLocationFlexibility,
    capRound,
    setCapRound,
    courseType,
    setCourseType,
    selectedPharmacyCourses,
    setSelectedPharmacyCourses,
    isExtractingDocument,
    uploadedDocumentName,
    categorySearch,
    setCategorySearch,
    uniSearch,
    setUniSearch,
    citySearch,
    setCitySearch,
    religionSearch,
    setReligionSearch,
    languageSearch,
    setLanguageSearch,
    divisionSearch,
    setDivisionSearch,
    showCatDropdown,
    setShowCatDropdown,
    showUniDropdown,
    setShowUniDropdown,
    showCityDropdown,
    setShowCityDropdown,
    showReligionDropdown,
    setShowReligionDropdown,
    showLanguageDropdown,
    setShowLanguageDropdown,
    showDivisionDropdown,
    setShowDivisionDropdown,
    metadataDivisions,
    divisions,
    availableCities,
    universities,
    filteredCategories,
    filteredUniversities,
    filteredCities,
    filteredReligions,
    filteredLanguages,
    filteredDivisions,
    pulseKey,
    categoryRef,
    universityRef,
    cityRef,
    religionRef,
    languageRef,
    divisionRef,
    fcAcknowledgeInputRef,
    closeOtherDropdowns,
    toggleArrayItem,
    handleFcAcknowledgeUpload,
    handleSearch,
    resetFilters,
    canProceedStep,
    canSearch,
    handlePercentileChange,
  };
}

export type FilterFormState = ReturnType<typeof useFilterFormState>;
