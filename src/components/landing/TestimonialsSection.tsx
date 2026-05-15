import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Quote, Sparkles, Star } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const testimonials = [
  {
    name: "Priya Sharma",
    college: "COEP, Pune",
    branch: "Computer Engineering",
    text: "CETRANK predicted my exact college with 92% accuracy. The AI counselor helped me understand my options when I was confused about the counselling process.",
    rating: 5,
    avatar: "PS",
    color: "from-blue-500 to-blue-700",
  },
  {
    name: "Arjun Patil",
    college: "VJTI, Mumbai",
    branch: "Electronics & Telecom",
    text: "The probability gauges were incredibly helpful. I could see exactly where I stood for each college and made informed decisions during each CAP round.",
    rating: 5,
    avatar: "AP",
    color: "from-sky-500 to-cyan-600",
  },
  {
    name: "Sneha Kulkarni",
    college: "WCE, Sangli",
    branch: "Information Technology",
    text: "What sets CETRANK apart is the explainable reports. I did not just get recommendations, I understood why each college was suggested.",
    rating: 5,
    avatar: "SK",
    color: "from-emerald-500 to-teal-600",
  },
];

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

export function TestimonialsSection() {
  const isMobile = useIsMobile();
  const sectionRef = useRef<HTMLDivElement>(null);

  // Desktop: GSAP scroll animations (lazy-loaded)
  useEffect(() => {
    if (isMobile) return;
    if (!sectionRef.current) return;

    let ctx: any;

    const loadGsap = async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        gsap.from(".testimonial-card", {
          y: 60,
          opacity: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        });
      }, sectionRef);
    };

    loadGsap();
    return () => ctx?.revert();
  }, [isMobile]);

  return (
    <section ref={sectionRef} className="py-28 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial opacity-30 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        <div className="text-center mb-16">
          <div className="section-badge mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Testimonials
          </div>
          <h2 className="section-title">
            Trusted by <span className="text-gradient">students</span>
          </h2>
          <p className="section-copy max-w-2xl mx-auto mt-4">
            The strongest UX signal is confidence after use. These stories reflect the kind of clarity the product is designed to create.
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {[
            { label: "Prediction confidence", value: "92% exact match story" },
            { label: "Round support", value: "Useful through CAP decisions" },
            { label: "Student sentiment", value: "Clearer and more trustworthy" },
          ].map((item) => (
            <div key={item.label} className="rounded-[24px] border border-border/70 bg-white/75 p-5">
              <div className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {item.label}
              </div>
              <div className="mt-2 text-base font-semibold text-foreground">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, index) => (
            <TestimonialCard key={t.name} t={t} index={index} isMobile={isMobile} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  t,
  index,
  isMobile,
}: {
  t: (typeof testimonials)[number];
  index: number;
  isMobile: boolean;
}) {
  const { ref, revealed } = useReveal(0.12);

  const mobileStyle: React.CSSProperties | undefined = isMobile
    ? {
        opacity: revealed ? 1 : 0,
        transform: revealed ? "none" : "translateY(24px)",
        transition: `opacity 0.5s ease-out ${index * 0.1}s, transform 0.5s ease-out ${index * 0.1}s`,
      }
    : undefined;

  return (
    <div ref={ref} style={mobileStyle}>
      <motion.div
        whileHover={isMobile ? undefined : { y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="testimonial-card glass rounded-[30px] p-6 relative group card-beam"
      >
        <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Quote className="w-10 h-10" />
        </div>

        <div className="flex gap-1 mb-4">
          {Array.from({ length: t.rating }).map((_, j) => (
            <Star
              key={j}
              className="w-4 h-4 fill-amber-400 text-amber-400"
            />
          ))}
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          "{t.text}"
        </p>

        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-bold`}
          >
            {t.avatar}
          </div>
          <div>
            <div className="text-sm font-semibold">{t.name}</div>
            <div className="text-xs text-muted-foreground">
              {t.college} / {t.branch}
            </div>
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-border/70 bg-white/80 px-3 py-3 text-xs text-slate-700">
          Student takeaway: clearer decisions with less uncertainty.
        </div>
      </motion.div>
    </div>
  );
}
