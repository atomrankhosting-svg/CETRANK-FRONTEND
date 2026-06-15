import type { CutoffRequest } from "@/lib/api";
import type { BranchFilters, FormStep } from "@/components/dashboard/filter-bar/filterBarShared";

export const FILTER_FORM_DRAFT_STORAGE_KEY = "cetrank:filter-form:draft";
export const PENDING_GENERATE_STORAGE_KEY = "cetrank:filter-form:pending-generate";

export interface FilterFormDraft {
  currentStep: FormStep;
  studentName: string;
  category: string;
  university: string;
  selectedCities: string[];
  religion: string;
  language: string;
  selectedDivisions: string[];
  gender: string;
  percentile: string | number;
  jeePercentile: string | number;
  branches: BranchFilters;
  isEws: boolean;
  isTfws: boolean;
  locationFlexibility: 1 | 2 | 3;
  capRound: 1 | 2 | 3 | null;
  courseType: "engineering" | "pharmacy";
  selectedPharmacyCourses: string[];
}

const readStorage = <T>(key: string): T | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("[filterFormDraft] Failed to write localStorage:", error);
  }
};

export const loadFilterFormDraft = (): FilterFormDraft | null => {
  const draft = readStorage<FilterFormDraft>(FILTER_FORM_DRAFT_STORAGE_KEY);
  if (!draft || typeof draft !== "object") return null;
  return draft;
};

export const saveFilterFormDraft = (draft: FilterFormDraft) => {
  writeStorage(FILTER_FORM_DRAFT_STORAGE_KEY, draft);
};

export const clearFilterFormDraft = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(FILTER_FORM_DRAFT_STORAGE_KEY);
};

export const savePendingGenerate = (filters: CutoffRequest) => {
  writeStorage(PENDING_GENERATE_STORAGE_KEY, filters);
};

export const loadPendingGenerate = (): CutoffRequest | null => {
  return readStorage<CutoffRequest>(PENDING_GENERATE_STORAGE_KEY);
};

export const clearPendingGenerate = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PENDING_GENERATE_STORAGE_KEY);
};
