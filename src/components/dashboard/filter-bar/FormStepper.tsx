import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { FORM_STEPS, type FormStep } from "./filterBarShared";

interface FormStepperProps {
  currentStep: FormStep;
}

export function FormStepper({ currentStep }: FormStepperProps) {
  return (
    <div className="px-4 pt-4 sm:px-5 sm:pt-5 md:px-6">
      <div className="relative">
        <div className="absolute left-0 right-0 top-5 hidden h-0.5 bg-border/60 sm:block" aria-hidden />
        <div
          className="absolute left-0 top-5 hidden h-0.5 bg-primary transition-all duration-500 sm:block"
          style={{ width: `${((currentStep - 1) / (FORM_STEPS.length - 1)) * 100}%` }}
          aria-hidden
        />

        <ol className="relative grid grid-cols-3 gap-2 sm:gap-4">
          {FORM_STEPS.map((step) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <li key={step.id} className="flex flex-col items-center text-center">
                <div
                  className={cn(
                    "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300",
                    isCompleted && "border-primary bg-primary text-primary-foreground",
                    isCurrent && "border-primary bg-primary/10 text-primary shadow-[0_0_0_4px_rgba(37,99,235,0.12)]",
                    !isCompleted && !isCurrent && "border-border/80 bg-white text-muted-foreground",
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span
                  className={cn(
                    "mt-2 text-[10px] font-semibold uppercase tracking-wider leading-tight sm:text-[11px]",
                    isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
