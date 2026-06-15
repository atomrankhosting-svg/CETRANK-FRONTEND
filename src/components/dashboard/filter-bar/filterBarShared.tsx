import { Check, X } from "lucide-react";
import type { ReactNode } from "react";
import type { CutoffRequest } from "@/lib/api";
import {
  FC_ACK_DEPLOYED_MAX_FILE_SIZE_BYTES,
  FC_ACK_LANGUAGE_OPTIONS,
  FC_ACK_MAX_FILE_SIZE_BYTES,
  FC_ACK_RELIGION_OPTIONS,
} from "@/lib/fcAcknowledge";

export type BranchFilters = Pick<
  CutoffRequest,
  "is_tech" | "is_electronic" | "is_other" | "is_civil" | "is_mechanical" | "is_electrical"
>;

export const EMPTY_BRANCHES: BranchFilters = {
  is_tech: false,
  is_electronic: false,
  is_other: false,
  is_civil: false,
  is_mechanical: false,
  is_electrical: false,
};

export const CATEGORY_API_MAP: Record<string, string> = {
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

export const GENDER_API_MAP: Record<string, string> = {
  Male: "Male",
  Female: "Female",
};

export const RELIGION_OPTIONS = FC_ACK_RELIGION_OPTIONS;
export const LANGUAGE_OPTIONS = FC_ACK_LANGUAGE_OPTIONS;

export const FC_ACK_UPLOAD_DISPLAY_LIMIT_BYTES = import.meta.env.DEV
  ? FC_ACK_MAX_FILE_SIZE_BYTES
  : FC_ACK_DEPLOYED_MAX_FILE_SIZE_BYTES;

export const MANUAL_TFWS_STORAGE_KEY = "cetrank:manual:is_tfws";

export const FORM_STEPS = [
  { id: 1, label: "Course & Score" },
  { id: 2, label: "About You" },
  { id: 3, label: "Location & Branch" },
  { id: 4, label: "Final Filters" },
] as const;

export type FormStep = (typeof FORM_STEPS)[number]["id"];

export const normalizeCategoryOption = (value: string) => {
  if (value === "GOBCH" || value === "LOBCH") {
    return "OBC";
  }

  if (value.length > 1 && ["G", "L"].includes(value[0])) {
    return value.slice(1);
  }

  return value;
};

export const formatPercentile = (value: number | string) => {
  if (String(value).trim() === "") {
    return "-";
  }

  const num = Number.parseFloat(String(value));
  if (!Number.isFinite(num)) {
    return "-";
  }

  return Number.isInteger(num) ? String(num) : num.toFixed(2);
};

export const sortSearchResults = (results: string[], searchTerm: string) => {
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

export function SelectedChip({ label, onRemove }: { label: string; onRemove: () => void }) {
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

export function MultiSelectItem({
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

export function FilterCard({
  children,
  className = "",
}: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[22px] border border-border/70 bg-white/80 p-4 sm:rounded-[26px] sm:p-5 ${className}`}>
      {children}
    </div>
  );
}
