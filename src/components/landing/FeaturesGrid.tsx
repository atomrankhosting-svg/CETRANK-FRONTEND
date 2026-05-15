import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Brain, Filter, FileText, BarChart3 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const features = [
  {
    icon: BarChart3,
    title: "Prediction Engine",
    description:
      "Confidence-led recommendation cards paired with historical cutoff framing, so every option is easier to evaluate quickly.",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600",
    tag: "Confidence",
    bullets: ["Probability-led ranking", "Historical context", "Faster compare flow"],
  },
  {
    icon: Brain,
    title: "AI Counselor",
    description:
      "A guided assistant surface that helps translate profile inputs and counselling logic into clearer next actions.",
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-500",
    tag: "Guided",
    bullets: ["Intent-aware prompts", "Friendly explanations", "Decision support"],
  },
  {
    icon: Filter,
    title: "Smart Filters",
    description:
      "Structured filters keep category, university, percentile, and branch selection in one compact flow instead of scattered controls.",
    iconBg: "bg-teal-500/10",
    iconColor: "text-teal-500",
    tag: "Focused",
    bullets: ["Compact workflow", "Fewer dead ends", "Clearer active state"],
  },
  {
    icon: FileText,
    title: "Explainable Reports",
    description:
      "Results are packaged like a decision brief with readable structure, quick-read insights, and a more professional presentation.",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
    tag: "Readable",
    bullets: ["Clean summaries", "Better information hierarchy", "Presentation-ready"],
  },
];

/* ── Lightweight reveal hook using IntersectionObserver ── */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, revealed };
}

export function FeaturesGrid() {
  const isMobile = useIsMobile();
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const { ref: titleRevealRef, revealed: titleRevealed } = useReveal(0.2);

  // Desktop: GSAP scroll animations (lazy-loaded)
  useEffect(() => {
    if (isMobile) return;
    if (!sectionRef.current || !cardsRef.current) return;

    let ctx: any;

    const loadGsap = async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      gsap.registerPlugin(ScrollTrigger);

      const cards = cardsRef.current!.querySelectorAll(".feature-card");

      ctx = gsap.context(() => {
        gsap.from(sectionRef.current!.querySelector(".features-title"), {
          y: 60,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        });

        gsap.from(cards, {
          y: 80,
          opacity: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        });
      }, sectionRef);
    };

    loadGsap();
    return () => ctx?.revert();
  }, [isMobile]);

  return (
    <section id="features" ref={sectionRef} className="py-28 px-4 relative">
      <div className="absolute inset-0 bg-gradient-radial opacity-50 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        <div
          ref={titleRevealRef}
          className="features-title text-center mb-16"
          style={
            isMobile
              ? {
                  opacity: titleRevealed ? 1 : 0,
                  transform: titleRevealed ? "none" : "translateY(24px)",
                  transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
                }
              : undefined
          }
        >
          <h2 className="section-title">
            Built for <span className="text-gradient">precision under pressure</span>
          </h2>
          <p className="section-copy max-w-2xl mx-auto mt-4">
            The product is designed to lower noise, increase confidence, and help students reach better shortlist decisions faster.
          </p>
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} isMobile={isMobile} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  feature,
  index,
  isMobile,
}: {
  feature: (typeof features)[number];
  index: number;
  isMobile: boolean;
}) {
  const { ref, revealed } = useReveal(0.12);

  /* On mobile: CSS transition reveal. On desktop: GSAP handles it. */
  const mobileStyle: React.CSSProperties | undefined = isMobile
    ? {
        opacity: revealed ? 1 : 0,
        transform: revealed ? "none" : "translateY(28px)",
        transition: `opacity 0.5s ease-out ${index * 0.08}s, transform 0.5s ease-out ${index * 0.08}s`,
      }
    : undefined;

  return (
    <div ref={ref} style={mobileStyle}>
      <motion.div
        whileHover={isMobile ? undefined : { y: -6, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="feature-card group relative rounded-[30px] glass card-beam p-8 cursor-pointer"
      >
        <div
          className="absolute inset-0 rounded-[30px] bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 p-[1px]"
          style={{
            background: `linear-gradient(135deg, hsl(var(--primary) / 0.2), transparent, hsl(var(--glow-secondary) / 0.2))`,
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            padding: "1px",
            borderRadius: "1.75rem",
          }}
        />

        <div className="flex items-start justify-between mb-5">
          <div
            className={`w-14 h-14 rounded-2xl ${feature.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
          >
            <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full">
            {feature.tag}
          </span>
        </div>

        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
          {feature.title}
        </h3>
        <p className="text-muted-foreground leading-relaxed text-sm">
          {feature.description}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {feature.bullets.map((bullet) => (
            <div
              key={bullet}
              className="rounded-full border border-border/70 bg-white/80 px-3 py-1.5 text-xs text-slate-700"
            >
              {bullet}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
