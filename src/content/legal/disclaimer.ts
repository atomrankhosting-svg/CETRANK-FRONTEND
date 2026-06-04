import type { LegalDocument } from "./types";

export const disclaimerDocument: LegalDocument = {
  slug: "disclaimer",
  title: "Disclaimer",
  lastUpdated: "May 25, 2025",
  sections: [
    {
      id: "nature-of-service",
      title: "Nature of Service",
      paragraphs: [
        "CET RANK is an independent, third-party educational advisory platform that provides predictive college preference lists based exclusively on historical cutoff data published by the State Common Entrance Test Cell, Government of Maharashtra. We do not offer personal counseling services, interview coaching, or any guarantee of admission.",
      ],
    },
    {
      id: "no-affiliation",
      title: "No Affiliation or Endorsement",
      paragraphs: [
        "CET RANK has no tie-up, partnership, or formal affiliation with any government body, college, university, or examination authority. All references to government agencies or educational institutions are purely for informational context.",
      ],
    },
    {
      id: "informational-only",
      title: "Informational & Predictive Only",
      paragraphs: [
        'All content, recommendations, rankings, cut-off trends, and analytics ("Recommendations") are provided for informational purposes only. They are derived from past data and statistical modeling and do not constitute professional, legal, financial, or academic advice. Admission decisions rest solely with the official centralized counseling software and the individual institutions.',
      ],
    },
    {
      id: "accuracy",
      title: "Accuracy & Completeness",
      paragraphs: [
        "While we strive to source and present accurate, up-to-date data, CET RANK makes no warranties—express or implied—regarding the completeness, reliability, or accuracy of any Recommendations or third-party content. Cutoff trends may change annually; actual results may differ.",
      ],
    },
    {
      id: "no-guarantee",
      title: "No Guarantee of Outcomes",
      paragraphs: [
        "Use of CET RANK's Services does not guarantee seat allocation, ranking, or admission to any program. You acknowledge and accept that your reliance on any Recommendation is at your own risk, and you will independently verify all information before making application decisions.",
      ],
    },
    {
      id: "limitation-of-liability",
      title: "Limitation of Liability",
      paragraphs: [
        "To the fullest extent permitted under Indian law, CET RANK, its directors, officers, employees, agents, and affiliates shall not be liable for any direct, indirect, incidental, consequential, special, punitive, or exemplary damages—whether arising in contract, tort, negligence, strict liability, or otherwise—resulting from:",
      ],
      bullets: [
        "Your use of, or inability to use, our Service;",
        "Your reliance on any Recommendations;",
        "Errors, omissions, or inaccuracies in data;",
        "Technical failures, interruptions, or unauthorized access;",
        "Actions or omissions of third parties or official bodies.",
      ],
    },
    {
      id: "indemnification",
      title: "Indemnification",
      paragraphs: [
        "You agree to defend, indemnify, and hold harmless CET RANK and its affiliates from any claim, demand, liability, loss, or expense (including reasonable legal fees) arising out of or related to your use of the Service, your violation of this Disclaimer, or your infringement of any third-party rights.",
      ],
    },
    {
      id: "changes",
      title: "Changes to This Disclaimer",
      paragraphs: [
        'We may update this Disclaimer at any time by posting the revised version with a new "Last updated" date. Continued use of the Service after changes constitutes your acceptance of the updated terms.',
      ],
    },
  ],
  closing: [
    "By using CET RANK, you expressly acknowledge that you have read, understood, and agree to this Disclaimer in its entirety.",
  ],
};
