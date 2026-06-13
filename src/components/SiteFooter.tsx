import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { AppLogo } from "@/components/AppLogo";

export const SUPPORT_EMAIL = "cetranklist@gmail.com";

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
          <div className="flex flex-col gap-3">
            <AppLogo imageClassName="h-10 w-10 rounded-[18px]" />
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail className="h-4 w-4 shrink-0" aria-hidden />
              {SUPPORT_EMAIL}
            </a>
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
    <div className={`flex flex-col items-center gap-3 ${className ?? ""}`}>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {LEGAL_LINKS.map((link) => (
          <Link key={link.to} to={link.to} className="hover:text-foreground hover:underline">
            {link.label}
          </Link>
        ))}
      </div>
      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground hover:underline"
      >
        <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {SUPPORT_EMAIL}
      </a>
    </div>
  );
}
