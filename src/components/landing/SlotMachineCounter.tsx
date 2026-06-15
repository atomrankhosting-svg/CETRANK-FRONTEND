import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

function SlotReel({
  targetDigit,
  spinDelay,
  active,
}: {
  targetDigit: number;
  spinDelay: number;
  active: boolean;
}) {
  const cycles = 4;
  const strip: number[] = [];

  for (let cycle = 0; cycle < cycles; cycle += 1) {
    strip.push(...DIGITS);
  }

  for (let digit = 0; digit <= targetDigit; digit += 1) {
    strip.push(digit);
  }

  const targetIndex = strip.length - 1;

  return (
    <div className="relative h-[1.05em] w-[0.78em] overflow-hidden rounded-xl border border-primary/25 bg-white/90 shadow-[inset_0_2px_10px_rgba(15,23,42,0.1),0_4px_16px_rgba(37,99,235,0.08)]">
      <div
        className="flex flex-col"
        style={{
          transform: active
            ? `translateY(-${(targetIndex / strip.length) * 100}%)`
            : "translateY(0)",
          transition: active
            ? `transform 2000ms cubic-bezier(0.16, 1, 0.3, 1) ${spinDelay}ms`
            : "none",
        }}
      >
        {strip.map((digit, index) => (
          <span
            key={index}
            className="flex h-[1.05em] items-center justify-center font-['JetBrains_Mono'] leading-none"
          >
            {digit}
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-white/90 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-white/90 to-transparent" />
    </div>
  );
}

interface SlotMachineCounterProps {
  target?: number;
  className?: string;
}

export function SlotMachineCounter({ target = 900, className }: SlotMachineCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const digits = String(target)
    .padStart(3, "0")
    .split("")
    .map((value) => Number(value));

  return (
    <div
      ref={ref}
      className={cn("inline-flex items-center gap-1.5 sm:gap-2", className)}
      aria-label={`${target}+ students`}
    >
      {digits.map((digit, index) => (
        <SlotReel
          key={index}
          targetDigit={digit}
          spinDelay={index * 220}
          active={active}
        />
      ))}
      <span className="text-gradient font-black leading-none">+</span>
    </div>
  );
}
