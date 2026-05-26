import { Navbar } from "@/components/Navbar";
import { ScrollHero } from "@/components/landing/ScrollHero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ArrowRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, useInView } from "framer-motion";
import { useEffect, useRef } from "react";
import { AppLogo } from "@/components/AppLogo";
import { SiteBackdrop } from "@/components/effects/SiteBackdrop";
import { LottieAsset } from "@/components/effects/LottieAsset";
import { useIsMobile } from "@/hooks/use-mobile";

function CTASection() {
  const isMobile = useIsMobile();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // On mobile: skip framer-motion scroll-linked animation entirely
  const shouldAnimate = !isMobile && isInView;

  return (
    <motion.section ref={ref} className="px-4 py-28 relative overflow-hidden">
      <div className="mx-auto max-w-5xl relative">
        <motion.div
          initial={isMobile ? false : { opacity: 0, y: 40, scale: 0.95 }}
          animate={isMobile ? { opacity: 1, y: 0, scale: 1 } : (shouldAnimate ? { opacity: 1, y: 0, scale: 1 } : {})}
          transition={isMobile ? { duration: 0 } : { duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="panel-surface relative overflow-hidden rounded-[36px] noise"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.55),transparent)]" />
          <div className="relative grid gap-8 p-8 md:p-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:p-16">
            <div className="text-center lg:text-left">
              <AppLogo
                className="mx-auto mb-6 w-fit lg:mx-0"
                imageClassName="h-16 w-16 rounded-[24px]"
                textClassName="text-left"
              />

              <h2 className="section-title max-w-2xl">
                Turn raw cutoff data into a <span className="text-gradient">confident shortlist</span>.
              </h2>
              <p className="section-copy mt-4 max-w-xl text-center lg:text-left">
                Start exploring personalised recommendations, probability-led college matches, and a cleaner counselling workflow built for speed.
              </p>

              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
                <Link to="/list-generator">
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-block"
                  >
                    <Button
                      size="lg"
                      className="group relative h-14 rounded-2xl px-8 text-base glow-primary overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        Launch List Generator
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </span>
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </div>

            <div className="rounded-[30px] border border-border/70 bg-white/75 p-5">
              <LottieAsset
                src="/seo search.json"
                className="mx-auto aspect-square w-full max-w-[380px]"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

function Footer() {
  return (
    <footer className="relative px-4 pb-10 pt-6">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-border/70 bg-white/80 px-6 py-8 backdrop-blur-xl md:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <AppLogo imageClassName="h-10 w-10 rounded-[18px]" />
          </div>

          <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
            <Link to="/#features" className="transition-colors hover:text-foreground">
              Features
            </Link>
            <Link to="/#how-it-works" className="transition-colors hover:text-foreground">
              How It Works
            </Link>
            <Link to="/list-generator" className="transition-colors hover:text-foreground">
              List Generator
            </Link>
          </div>

          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            © {new Date().getFullYear()} CETRANK.IN
          </p>
        </div>
      </div>
    </footer>
  );
}

const Index = () => {
  const location = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const elementId = location.hash.replace("#", "");
    const scrollToSection = () => {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const timeoutId = window.setTimeout(scrollToSection, 100);
    return () => window.clearTimeout(timeoutId);
  }, [location.hash]);

  return (
    <div className="app-shell">
      <SiteBackdrop particleCount={isMobile ? 0 : 14} />
      <div className="relative z-10">
        <Navbar />
        <ScrollHero />
        <HowItWorks />
        <CTASection />
        <Footer />
      </div>
    </div>
  );
};

export default Index;
