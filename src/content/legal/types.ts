export type LegalSubsection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  subsections?: LegalSubsection[];
};

export type LegalSlug = "terms" | "privacy" | "refund" | "disclaimer";

export type LegalDocument = {
  slug: LegalSlug;
  title: string;
  lastUpdated: string;
  intro?: string[];
  sections: LegalSection[];
  closing?: string[];
  contactEmail?: string;
};
