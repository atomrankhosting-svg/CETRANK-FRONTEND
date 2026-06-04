import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SiteBackdrop } from "@/components/effects/SiteBackdrop";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import type { LegalDocument, LegalSlug } from "@/content/legal";
import { LEGAL_SLUGS } from "@/content/legal";

const SLUG_LABELS: Record<LegalSlug, string> = {
  terms: "Terms",
  privacy: "Privacy",
  refund: "Refund Policy",
  disclaimer: "Disclaimer",
};

type Props = {
  document: LegalDocument;
};

function renderEmailParagraph(text: string, email?: string) {
  if (!email || !text.includes(email)) {
    return <p>{text}</p>;
  }
  const parts = text.split(email);
  return (
    <p>
      {parts[0]}
      <a href={`mailto:${email}`} className="text-primary hover:underline">
        {email}
      </a>
      {parts[1]}
    </p>
  );
}

export function LegalDocumentPage({ document: doc }: Props) {
  const isMobile = useIsMobile();
  const otherSlugs = LEGAL_SLUGS.filter((s) => s !== doc.slug);

  return (
    <div className="app-shell min-h-screen">
      <SiteBackdrop particleCount={isMobile ? 0 : 10} />
      <Navbar />

      <div className="relative z-10 mx-auto max-w-3xl px-4 pb-16 pt-28 sm:pt-32">
        <div className="panel-surface legal-prose p-6 sm:p-10">
          <header className="mb-8 border-b border-border/60 pb-6">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{doc.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Last updated: {doc.lastUpdated}</p>
          </header>

          {doc.intro?.map((paragraph, i) => (
            <p key={`intro-${i}`}>{paragraph}</p>
          ))}

          {doc.sections.map((section, index) => (
            <section key={section.id} className="legal-section">
              <h2>
                {index + 1}. {section.title}
              </h2>

              {section.paragraphs?.map((paragraph, i) => (
                <div key={`p-${section.id}-${i}`}>
                  {renderEmailParagraph(paragraph, doc.contactEmail)}
                </div>
              ))}

              {section.bullets && (
                <ul>
                  {section.bullets.map((item, i) => (
                    <li key={`b-${section.id}-${i}`}>{item}</li>
                  ))}
                </ul>
              )}

              {section.subsections?.map((sub, i) => (
                <div key={`sub-${section.id}-${i}`} className="legal-subsection">
                  {sub.title ? <h3>{sub.title}</h3> : null}
                  {sub.paragraphs?.map((paragraph, j) => (
                    <div key={`sp-${section.id}-${i}-${j}`}>
                      {renderEmailParagraph(paragraph, doc.contactEmail)}
                    </div>
                  ))}
                  {sub.bullets && (
                    <ul>
                      {sub.bullets.map((item, k) => (
                        <li key={`sb-${section.id}-${i}-${k}`}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}

              {section.id === "contact" && doc.contactEmail && (
                <p>
                  Email:{" "}
                  <a href={`mailto:${doc.contactEmail}`} className="text-primary hover:underline">
                    {doc.contactEmail}
                  </a>
                </p>
              )}
            </section>
          ))}

          {doc.closing?.map((paragraph, i) => (
            <p key={`closing-${i}`} className="mt-6 text-muted-foreground">
              {paragraph}
            </p>
          ))}

          <nav
            className="mt-10 flex flex-col gap-4 border-t border-border/60 pt-8 sm:flex-row sm:items-center sm:justify-between"
            aria-label="Related policies"
          >
            <div className="flex flex-wrap gap-3 text-sm">
              {otherSlugs.map((slug) => (
                <Link
                  key={slug}
                  to={`/${slug}`}
                  className="rounded-full border border-border/80 px-3 py-1.5 text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                >
                  {SLUG_LABELS[slug]}
                </Link>
              ))}
            </div>
            <Button asChild variant="outline" className="rounded-2xl w-fit">
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </nav>
        </div>

        <div className="mt-8">
          <SiteFooter />
        </div>
      </div>
    </div>
  );
}
