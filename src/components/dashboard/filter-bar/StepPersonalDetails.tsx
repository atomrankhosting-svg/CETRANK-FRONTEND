import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { FilterCard, LANGUAGE_OPTIONS, RELIGION_OPTIONS, sortSearchResults } from "./filterBarShared";
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
  | "universities"
>;

function MinoritySelect({
  id,
  label,
  value,
  onChange,
  options,
  isDefault,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  isDefault: boolean;
}) {
  return (
    <FilterCard
      className={cn(
        "transition-opacity",
        isDefault && "opacity-70 bg-secondary/20 border-dashed",
      )}
    >
      <Label
        htmlFor={id}
        className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {label}
        <span className="ml-auto text-[9px] font-normal normal-case tracking-normal text-muted-foreground/80">
          Optional
        </span>
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id={id}
          className={cn(
            "h-10 rounded-2xl border-border/80 focus:ring-primary/40",
            isDefault ? "bg-secondary/30 text-muted-foreground" : "bg-white/90",
          )}
        >
          <SelectValue placeholder="Not Applicable" />
        </SelectTrigger>
        <SelectContent
          position="popper"
          className="z-[100] max-h-48 rounded-2xl border-border/50 bg-white shadow-2xl"
        >
          {options.map((option) => (
            <SelectItem key={option} value={option} className="rounded-xl">
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FilterCard>
  );
}

function UniversityCombobox({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = sortSearchResults(
    options.filter((option) => option.toLowerCase().includes(search.toLowerCase())),
    search,
  );

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-2xl border border-border/80 bg-white/90 px-3 py-2 text-left text-sm ring-offset-background transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
            !value && "text-muted-foreground",
          )}
        >
          <span className="truncate pr-2">{value || "Select home university"}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-[100] w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-2xl border border-border/50 p-0 shadow-2xl"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search universities..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-48">
            <CommandEmpty>No matching universities</CommandEmpty>
            {filteredOptions.map((option) => (
              <CommandItem
                key={option}
                value={option}
                onSelect={() => {
                  onChange(option);
                  setOpen(false);
                  setSearch("");
                }}
                className="rounded-xl"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 text-primary",
                    value === option ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="truncate">{option}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

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
  universities,
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
        <FilterCard>
          <Label className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Home University <span className="text-red-500">*</span>
          </Label>
          <UniversityCombobox
            value={university}
            onChange={setUniversity}
            options={universities}
          />
        </FilterCard>

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
        <MinoritySelect
          id="minority-religion"
          label="Minority Religion"
          value={religion}
          onChange={setReligion}
          options={RELIGION_OPTIONS}
          isDefault={isReligionDefault}
        />
        <MinoritySelect
          id="minority-language"
          label="Minority Language / Ethnicity"
          value={language}
          onChange={setLanguage}
          options={LANGUAGE_OPTIONS}
          isDefault={isLanguageDefault}
        />
      </div>
    </div>
  );
}
