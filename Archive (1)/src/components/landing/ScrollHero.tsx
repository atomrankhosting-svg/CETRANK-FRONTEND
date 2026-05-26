import { useRef, useEffect, useCallback, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SiteBackdrop } from "@/components/effects/SiteBackdrop";
import { LottieAsset } from "@/components/effects/LottieAsset";
import { useIsMobile } from "@/hooks/use-mobile";

const SECTIONS = [
  {
    id: "intelligence",
    title: "CETRANK",
    subtitle: "The admission intelligence layer",
    description:
      "Navigate Maharashtra CET counselling with a product that converts dense cutoff data into a calmer, clearer shortlist workflow.",
    animationPath: "/online study.json",
  },
  {
    id: "features",
    title: "Precision Reports",
    subtitle: "Engineering and pharmacy ready",
    description:
      "Capture ranked options, branch context, and supporting signals in a format that feels closer to a professional decision brief than a raw table.",
    animationPath: "/Business Analytics.json",
  },
  {
    id: "hero-cta",
    title: "Ready to",
    subtitle: "Refine your rank?",
    description: "",
    isCTA: true,
    animationPath: "/Ready for Career.json",
  },
];

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function interpolate(p: number, stops: [number, number][]) {
  if (p <= stops[0][0]) return stops[0][1];
  if (p >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];

  for (let i = 0; i < stops.length - 1; i++) {
    if (p >= stops[i][0] && p <= stops[i + 1][0]) {
      const t = (p - stops[i][0]) / (stops[i + 1][0] - stops[i][0]);
      return lerp(stops[i][1], stops[i + 1][1], t);
    }
  }

  return stops[stops.length - 1][1];
}

function computeStyles(raw: number) {
  const p = easeInOut(raw);

  return {
    opacity: 1,
    filter: "none",
    transform: `translate3d(${interpolate(p, [[0, 100], [0.5, 0], [1, -100]])}%, 0, 0)`,
  };
}

/* ────────────────────────────────────────────
   Desktop HeroPanel — original fixed-panel parallax
   ──────────────────────────────────────────── */
function HeroPanel({
  section,
}: {
  section: (typeof SECTIONS)[number];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const currentProgressRef = useRef(0);
  const targetProgressRef = useRef(0);

  useEffect(() => {
    let scrollRaf = 0;
    let animationFrame = 0;

    const render = () => {
      const con = contentRef.current;
      if (!con) return;

      currentProgressRef.current = lerp(
        currentProgressRef.current,
        targetProgressRef.current,
        0.12,
      );
      const styles = computeStyles(currentProgressRef.current);

      con.style.opacity = String(styles.opacity);
      con.style.filter = styles.filter;
      con.style.transform = styles.transform;
      con.style.visibility =
        currentProgressRef.current > 0.02 && currentProgressRef.current < 0.98
          ? "visible"
          : "hidden";
      con.style.pointerEvents =
        currentProgressRef.current > 0.3 && currentProgressRef.current < 0.7
          ? "auto"
          : "none";

      if (Math.abs(currentProgressRef.current - targetProgressRef.current) > 0.001) {
        animationFrame = requestAnimationFrame(render);
      }
    };

    const updateTarget = () => {
      const sec = sectionRef.current;
      if (!sec) return;

      const rect = sec.getBoundingClientRect();
      const vh = window.innerHeight;
      targetProgressRef.current = Math.max(0, Math.min(1, (vh - rect.top) / (vh + rect.height)));
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(render);
    };

    const onScroll = () => {
      cancelAnimationFrame(scrollRaf);
      scrollRaf = requestAnimationFrame(updateTarget);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    updateTarget();

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(scrollRaf);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  const isCTASection = "isCTA" in section && section.isCTA;

  return (
    <section ref={sectionRef} data-hero-section style={{ height: "100dvh" }}>
      <div
        ref={contentRef}
        className="fixed inset-0 overflow-hidden bg-background"
        style={{ zIndex: 5, willChange: "transform, opacity, filter" }}
      >
        <SiteBackdrop particleCount={10} className="opacity-100" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.5),transparent_18%),radial-gradient(circle_at_80%_28%,rgba(45,212,191,0.08),transparent_20%)]" />

        <div className="relative flex h-full items-center justify-center p-6 pt-28">
          <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="max-w-3xl text-center lg:text-left">

              <h2 className="font-['Outfit'] text-5xl font-black tracking-[-0.05em] md:text-7xl lg:text-[5.5rem]">
                <span className="block text-foreground">{section.title}</span>
                <span className="block text-gradient">{section.subtitle}</span>
              </h2>

              {section.description && (
                <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground md:text-[1.35rem] lg:mx-0 mx-auto">
                  {section.description}
                </p>
              )}

              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
                {isCTASection ? (
                  <Link to="/list-generator">
                    <Button
                      size="lg"
                      className="group h-14 rounded-2xl px-8 text-base glow-primary animate-glow-pulse"
                    >
                      Launch List Generator
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="panel-surface relative overflow-hidden rounded-[36px] p-5 sm:p-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.65),transparent)]" />
              <div className="relative">
                

                <div className="mt-6 rounded-[28px] border border-border/70 bg-white/85 p-4">
                  <LottieAsset
                    src={section.animationPath}
                    className="mx-auto aspect-square w-full max-w-[360px]"
                  />
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────
   Mobile HeroCard — lightweight stacked card
   Uses CSS transitions + IntersectionObserver
   ──────────────────────────────────────────── */
function MobileHeroCard({
  section,
}: {
  section: (typeof SECTIONS)[number];
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isCTASection = "isCTA" in section && section.isCTA;

  return (
    <div
      ref={cardRef}
      className="mobile-hero-card px-4 py-10 sm:py-12"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(32px)",
        transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
      }}
    >
      <div className="text-center">
        <h2 className="font-['Outfit'] text-[2.35rem] font-black tracking-[-0.04em] sm:text-5xl">
          <span className="block text-foreground">{section.title}</span>
          <span className="block text-gradient">{section.subtitle}</span>
        </h2>

        {section.description && (
          <p className="mt-4 text-base leading-7 text-muted-foreground mx-auto max-w-lg">
            {section.description}
          </p>
        )}

        <div className="mt-6 flex justify-center">
          {isCTASection ? (
            <Link to="/list-generator" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="group h-14 w-full rounded-2xl px-8 text-base glow-primary sm:w-auto"
              >
                Launch List Generator
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-8 rounded-[24px] border border-border/70 bg-white/80 p-4 shadow-[0_12px_36px_rgba(148,163,184,0.14)] sm:rounded-[28px]">
        <LottieAsset
          src={section.animationPath}
          className="mx-auto aspect-square w-full max-w-[320px]"
        />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Desktop scroll navigation dots + snap logic
   ──────────────────────────────────────────── */
function DesktopScrollNav({
  activeIndex,
  heroVisible,
  snapTo,
}: {
  activeIndex: number;
  heroVisible: boolean;
  snapTo: (index: number) => void;
}) {
  return (
    <>
      <div
        className="fixed left-8 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-3 transition-opacity duration-500 lg:flex"
        style={{ opacity: heroVisible ? 1 : 0 }}
      >
        {SECTIONS.map((_, i) => (
          <button
            key={i}
            onClick={() => snapTo(i)}
            className={`w-2 rounded-full transition-all duration-500 cursor-pointer hover:bg-primary/70 ${
              i === activeIndex ? "h-8 bg-primary" : "h-2 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </>
  );
}

export function ScrollHero() {
  const isMobile = useIsMobile();
  const [activeIndex, setActiveIndex] = useState(0);
  const [heroVisible, setHeroVisible] = useState(true);
  const snapIndexRef = useRef(0);
  const isSnappingRef = useRef(false);
  const touchStartYRef = useRef(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const snapTo = useCallback((index: number) => {
    const els = document.querySelectorAll<HTMLElement>("[data-hero-section]");
    if (!els[index]) return;

    isSnappingRef.current = true;
    const top = els[index].getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: "smooth" });
    snapIndexRef.current = index;

    setTimeout(() => {
      isSnappingRef.current = false;
    }, 800);
  }, []);

  // Desktop-only: wheel + touch snap handlers
  useEffect(() => {
    if (isMobile) return; // Skip all scroll hijacking on mobile

    const getHeroBounds = () => {
      const els = document.querySelectorAll<HTMLElement>("[data-hero-section]");
      if (!els.length) return { top: 0, bottom: 0 };

      const first = els[0].getBoundingClientRect().top + window.scrollY;
      const last = els[els.length - 1].getBoundingClientRect().bottom + window.scrollY;
      return { top: first, bottom: last };
    };

    const onWheel = (e: WheelEvent) => {
      const { top, bottom } = getHeroBounds();
      const scrollY = window.scrollY;
      const vh = window.innerHeight;

      if (scrollY < top - 10 || scrollY >= bottom - vh + 10) return;

      const els = document.querySelectorAll<HTMLElement>("[data-hero-section]");
      const count = els.length;

      if (isSnappingRef.current) {
        e.preventDefault();
        return;
      }

      const dir = e.deltaY > 0 ? 1 : -1;
      const next = snapIndexRef.current + dir;

      if (next >= 0 && next < count) {
        e.preventDefault();
        snapTo(next);
      } else if (next >= count) {
        isSnappingRef.current = false;
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const { top, bottom } = getHeroBounds();
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      if (scrollY < top - 10 || scrollY >= bottom - vh + 10) return;
      if (isSnappingRef.current) return;

      const dy = touchStartYRef.current - e.changedTouches[0].clientY;
      if (Math.abs(dy) < 30) return;

      const els = document.querySelectorAll<HTMLElement>("[data-hero-section]");
      const count = els.length;
      const dir = dy > 0 ? 1 : -1;
      const next = snapIndexRef.current + dir;

      if (next >= 0 && next < count) {
        snapTo(next);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [snapTo, isMobile]);

  // Desktop-only: track active section index
  useEffect(() => {
    if (isMobile) return;

    const onScroll = () => {
      const vh = window.innerHeight;
      const els = document.querySelectorAll("[data-hero-section]");
      let best = 0;
      let bestDist = Infinity;
      let anyVisible = false;

      els.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        const p = (vh - rect.top) / (vh + rect.height);
        if (p > 0.1 && p < 0.9) anyVisible = true;
        const d = Math.abs(p - 0.5);
        if (d < bestDist && p > 0.05 && p < 0.95) {
          bestDist = d;
          best = i;
        }
      });

      if (!isSnappingRef.current) snapIndexRef.current = best;
      setActiveIndex(best);
      setHeroVisible(anyVisible);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [isMobile]);

  /* ── Mobile: simple stacked layout ── */
  if (isMobile) {
    return (
      <div ref={wrapperRef} className="mobile-hero-stack">
        {SECTIONS.map((section) => (
          <MobileHeroCard key={section.id} section={section} />
        ))}
      </div>
    );
  }

  /* ── Desktop: original parallax panels ── */
  return (
    <div ref={wrapperRef}>
      <DesktopScrollNav
        activeIndex={activeIndex}
        heroVisible={heroVisible}
        snapTo={snapTo}
      />

      {SECTIONS.map((section) => (
        <HeroPanel key={section.id} section={section} />
      ))}
    </div>
  );
}
