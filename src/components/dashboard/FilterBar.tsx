import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, RotateCcw, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { CutoffRequest } from "@/lib/api";
import { FormStepper } from "./filter-bar/FormStepper";
import { StepCourseScore } from "./filter-bar/StepCourseScore";
import { StepPersonalDetails } from "./filter-bar/StepPersonalDetails";
import { StepLocationBranch } from "./filter-bar/StepLocationBranch";
import { StepFinalFilters } from "./filter-bar/StepFinalFilters";
import { useFilterFormState } from "./filter-bar/useFilterFormState";
import type { FormStep } from "./filter-bar/filterBarShared";
import { loadFilterFormDraft } from "@/lib/filterFormDraft";

interface FilterBarProps {
  onSearch: (filters: CutoffRequest) => void;
  isLoading: boolean;
}

const TOTAL_STEPS = 4;

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
  }),
};

export function FilterBar({ onSearch, isLoading }: FilterBarProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>(
    () => loadFilterFormDraft()?.currentStep ?? 1,
  );
  const [direction, setDirection] = useState(0);
  const form = useFilterFormState({ onSearch, currentStep });

  const handleReset = () => {
    form.resetFilters();
    setCurrentStep(1);
    setDirection(0);
  };

  const handleNext = () => {
    if (!form.canProceedStep(currentStep)) {
      toast({
        title: "Required fields missing",
        description: "Please complete all required fields before continuing.",
        variant: "destructive",
      });
      return;
    }

    if (currentStep < TOTAL_STEPS) {
      setDirection(1);
      setCurrentStep((s) => (s + 1) as FormStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((s) => (s - 1) as FormStep);
    }
  };

  const handleGenerate = () => {
    if (!form.canSearch) {
      toast({
        title: "Required fields missing",
        description: "Please complete all required fields before generating your list.",
        variant: "destructive",
      });
      return;
    }
    form.handleSearch();
  };

  return (
    <motion.div layout className="panel-surface overflow-hidden relative">
      <AnimatePresence>
        {form.pulseKey > 0 && (
          <motion.div
            key={form.pulseKey}
            initial={{ opacity: 0.4, scale: 1 }}
            animate={{ opacity: 0, scale: 1.01 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 border-2 border-primary rounded-[30px] pointer-events-none z-20"
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4 border-b border-border/70 p-4 sm:p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/10">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
          </div>
          <div>
            <span className="font-semibold text-base block">Intelligent Filters</span>
            <span className="text-xs text-muted-foreground">Step {currentStep} of {TOTAL_STEPS}</span>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={handleReset} className="h-10 rounded-full px-4 sm:h-9">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      <FormStepper currentStep={currentStep} />

      <div className="px-4 pb-5 pt-4 sm:px-5 sm:pb-6 sm:pt-5 md:px-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {currentStep === 1 && <StepCourseScore {...form} />}
            {currentStep === 2 && <StepPersonalDetails {...form} />}
            {currentStep === 3 && <StepLocationBranch {...form} />}
            {currentStep === 4 && <StepFinalFilters {...form} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="sticky bottom-0 z-10 border-t border-border/70 bg-white/95 backdrop-blur-sm px-4 py-4 sm:px-5 md:px-6">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="h-11 flex-1 rounded-2xl sm:flex-none sm:min-w-[120px]"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
          </div>

          <div className="flex gap-2 sm:ml-auto">
            {currentStep < TOTAL_STEPS ? (
              <Button
                onClick={handleNext}
                className="h-11 flex-1 rounded-2xl glow-primary sm:flex-none sm:min-w-[140px]"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="flex-1 sm:flex-none">
                <Button
                  onClick={handleGenerate}
                  disabled={isLoading || !form.canSearch}
                  className="relative h-11 w-full min-w-0 overflow-hidden rounded-2xl px-6 glow-primary group sm:min-w-[220px]"
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
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
