import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useMagicArea } from "./effects/MagicArea";
import { Button } from "./ui/button";
import { AppLogo } from "./AppLogo";
import { useAuth } from "@/contexts/AuthContext"; // Imported Auth Context
import { useIsMobile } from "@/hooks/use-mobile";

type NavLink = {
  label: string;
  to: string;
  active: boolean;
};

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth(); // Destructured auth state and actions
  const isMobile = useIsMobile();
  
  const isListGenerator = location.pathname === "/list-generator";
  const isMyLists = location.pathname === "/my-lists";
  const isInternalPage = isListGenerator || isMyLists;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const update = () => {
      setScrolled(window.scrollY > 20);

      // Skip progress calculation on mobile — avoids extra setState per frame
      if (!isMobile) {
        const doc = document.documentElement;
        const maxScroll = doc.scrollHeight - window.innerHeight;
        setScrollProgress(maxScroll > 0 ? window.scrollY / maxScroll : 0);
      }
    };

    const handler = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler);

    return () => {
      window.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
      cancelAnimationFrame(rafRef.current);
    };
  }, [isMobile]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  const handleSignOut = async () => {
    await signOut();
    setMobileOpen(false);
    navigate("/");
  };

  const navLinks: NavLink[] = isInternalPage
    ? [
        { label: "Home", to: "/", active: location.pathname === "/" && !location.hash },
        { label: "List Generator", to: "/list-generator", active: isListGenerator },
        ...(user ? [{ label: "My Lists", to: "/my-lists", active: isMyLists }] : []),
      ]
    : [];

  const { containerRef: magicContainerRef, magicRef } = useMagicArea({
    tweenBack: true,
  });

  const headerStatus = isInternalPage;

  return (
    <>
      <motion.nav
        initial={isMobile ? false : { y: -100 }}
        animate={{ y: 0 }}
        transition={isMobile ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 30 }}
        className="fixed inset-x-0 top-0 z-50 px-2 pt-2 transition-all duration-500 sm:px-4 sm:pt-3"
      >
        <div
          className={`mx-auto max-w-7xl overflow-hidden rounded-[24px] border transition-all duration-500 sm:rounded-[30px] ${
            scrolled
              ? "glass-strong border-border/80 shadow-[0_24px_72px_rgba(148,163,184,0.22)]"
              : "border-border/70 bg-white/75 shadow-[0_16px_48px_rgba(148,163,184,0.18)] backdrop-blur-xl"
          }`}
        >
          {!isMobile && (
            <div
              className="h-px origin-left bg-gradient-to-r from-primary via-cyan-300 to-teal-300 transition-transform duration-300"
              style={{ transform: `scaleX(${Math.max(scrollProgress, 0.08)})` }}
            />
          )}

          <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-5">
            <div className="flex items-center gap-3">
              <AppLogo imageClassName="h-12 w-12 rounded-[20px]" />
              
            </div>

            <div
              ref={magicContainerRef}
              className="relative hidden items-center gap-1 md:flex"
            >
              <div
                ref={magicRef}
                className="c-magic-area c-magic-area--menu"
                aria-hidden="true"
              />

              {navLinks.map((link) => (
                <motion.div
                  key={link.label}
                  whileHover={{ y: -1 }}
                  style={{ position: "relative", zIndex: 1 }}
                >
                  <Link
                    to={link.to}
                    className={`magic-item block rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                      link.active
                        ? "active text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="hidden items-center gap-3 md:flex">
              

              {!isInternalPage ? (
                <Button
                  asChild
                  className="rounded-full px-5 shadow-[0_16px_36px_rgba(59,130,246,0.24)]"
                >
                  <Link to="/list-generator">
                    Open List Generator
                  </Link>
                </Button>
              ) : null}

              {/* Desktop Auth Buttons */}
              {user ? (
                <Button 
                  variant="outline" 
                  className="rounded-full px-5 border-border/70"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              ) : (
                <Button 
                  asChild 
                  variant="secondary" 
                  className="rounded-full px-5 bg-slate-100 hover:bg-slate-200 text-slate-900"
                >
                  <Link to="/auth">Sign In</Link>
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="rounded-2xl border border-border/80 bg-white/85 p-2.5 shadow-sm transition-colors hover:bg-primary/5"
                aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/12 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
              aria-label="Close mobile menu"
            />

            <motion.div
              initial={{ opacity: 0, y: -18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -18, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              className="fixed left-2 right-2 top-[5.5rem] z-50 overflow-hidden rounded-[28px] border border-border/80 bg-white/95 p-4 shadow-[0_30px_80px_rgba(148,163,184,0.28)] backdrop-blur-2xl md:hidden"
            >
              <div className="mb-4 rounded-[26px] border border-border/70 bg-slate-50/90 p-4">
                <div className="flex items-center justify-between gap-3">
                  <AppLogo imageClassName="h-11 w-11" textClassName="text-left" />
                </div>
                
              </div>

              <div className="flex flex-col gap-2">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className={`block rounded-2xl border px-4 py-3.5 text-sm font-semibold transition-colors ${
                        link.active
                          ? "border-primary/20 bg-primary/10 text-foreground"
                          : "border-transparent text-foreground hover:border-primary/10 hover:bg-primary/5"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="mt-4 rounded-[24px] border border-border/70 bg-gradient-to-r from-primary/10 to-teal-400/10 p-4">
                <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary">
                  {headerStatus}
                </div>
                
                
                {!isInternalPage ? (
                  <Button asChild className="mt-4 h-12 w-full rounded-2xl">
                    <Link to="/list-generator" onClick={() => setMobileOpen(false)}>
                      Open List Generator
                    </Link>
                  </Button>
                ) : null}

                {/* Mobile Auth Buttons */}
                <div className="mt-3 pt-3 border-t border-primary/10">
                  {user ? (
                    <Button 
                      variant="outline" 
                      className="h-12 w-full rounded-2xl bg-white/50" 
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  ) : (
                    <Button 
                      asChild 
                      variant="outline" 
                      className="h-12 w-full rounded-2xl bg-white hover:bg-slate-50"
                    >
                      <Link to="/auth" onClick={() => setMobileOpen(false)}>
                        <LogIn className="h-4 w-4 mr-2" />
                        Sign In / Register
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
