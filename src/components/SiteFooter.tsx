import { Link } from "react-router-dom";
import { AppLogo } from "@/components/AppLogo";

const LEGAL_LINKS = [
  { label: "Terms", to: "/terms" },
  { label: "Privacy", to: "/privacy" },
  { label: "Refund Policy", to: "/refund" },
  { label: "Disclaimer", to: "/disclaimer" },
] as const;

export function SiteFooter() {
  return (
    <footer className="relative px-4 pb-10 pt-6">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-border/70 bg-white/80 px-6 py-8 backdrop-blur-xl md:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <AppLogo imageClassName="h-10 w-10 rounded-[18px]" />
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:gap-10">
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
            <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              {LEGAL_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground lg:text-right">
            © {new Date().getFullYear()} CETRANK.IN
          </p>
        </div>
      </div>
    </footer>
  );
}

export function LegalFooterLinks({ className }: { className?: string }) {
  return (
    <div className={`flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground ${className ?? ""}`}>
      {LEGAL_LINKS.map((link) => (
        <Link key={link.to} to={link.to} className="hover:text-foreground hover:underline">
          {link.label}
        </Link>
      ))}
    </div>
  );
}
