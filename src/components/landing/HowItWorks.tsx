import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, SlidersHorizontal, UserCheck } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const steps = [
  {
    icon: UserCheck,
    title: "Enter your Details",
    description: "Choose your category, home university and the preferences that matter.",
  },
  {
    icon: SlidersHorizontal,
    title: "Filter the shortlist",
    description: "Apply branch and percentile filters to narrow the result set quickly.",
  },
  {
    icon: GraduationCap,
    title: "Review the results",
    description: "Compare colleges in a cleaner format and export the list once it feels right.",
  },
];

function StepCard({
  step,
  index,
  isMobile,
}: {
  step: (typeof steps)[number];
  index: number;
  isMobile: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!isMobile) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isMobile]);

  const content = (
    <div className="rounded-[30px] border border-border/70 bg-white/80 p-6 shadow-[0_18px_48px_rgba(148,163,184,0.12)] backdrop-blur-xl">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <step.icon className="h-5 w-5" />
      </div>
      <div className="mt-5 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        Step {index + 1}
      </div>
      <h3 className="mt-2 text-xl font-semibold text-foreground">{step.title}</h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.description}</p>
    </div>
  );

  if (isMobile) {
    return (
      <div
        ref={ref}
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? "none" : "translateY(24px)",
          transition: `opacity 0.5s ease-out ${index * 0.08}s, transform 0.5s ease-out ${index * 0.08}s`,
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <motion.div
      key={step.title}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      {content}
    </motion.div>
  );
}

export function HowItWorks() {
  const isMobile = useIsMobile();

  return (
    <section id="how-it-works" className="relative px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="section-title">
            How it <span className="text-gradient">works</span>
          </h2>
          <p className="section-copy mt-4">
            A simple three-step flow that takes you from raw cutoff data to a usable shortlist.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <StepCard key={step.title} step={step} index={index} isMobile={isMobile} />
          ))}
        </div>
      </div>
    </section>
  );
}
