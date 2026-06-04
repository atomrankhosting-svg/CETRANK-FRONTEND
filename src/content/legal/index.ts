import type { LegalDocument, LegalSlug } from "./types";
import { termsDocument } from "./terms";
import { privacyDocument } from "./privacy";
import { refundDocument } from "./refund";
import { disclaimerDocument } from "./disclaimer";

export const LEGAL_DOCUMENTS: Record<LegalSlug, LegalDocument> = {
  terms: termsDocument,
  privacy: privacyDocument,
  refund: refundDocument,
  disclaimer: disclaimerDocument,
};

export const LEGAL_SLUGS = Object.keys(LEGAL_DOCUMENTS) as LegalSlug[];

export function getLegalDocument(slug: string): LegalDocument | undefined {
  if (slug in LEGAL_DOCUMENTS) {
    return LEGAL_DOCUMENTS[slug as LegalSlug];
  }
  return undefined;
}

export type { LegalDocument, LegalSlug, LegalSection } from "./types";
