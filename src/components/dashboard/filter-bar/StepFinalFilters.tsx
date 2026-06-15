import { Info, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FilterCard } from "./filterBarShared";
import type { FilterFormState } from "./useFilterFormState";

type StepFinalFiltersProps = Pick<
  FilterFormState,
  "capRound" | "setCapRound" | "isEws" | "setIsEws" | "isTfws" | "setIsTfws"
>;

export function StepFinalFilters({
  capRound,
  setCapRound,
  isEws,
  setIsEws,
  isTfws,
  setIsTfws,
}: StepFinalFiltersProps) {
  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <p className="text-sm text-muted-foreground text-center">
        Quick toggles — adjust these in about 30 seconds, then generate your list.
      </p>

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
