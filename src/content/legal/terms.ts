import type { LegalDocument } from "./types";

const CONTACT = "cetranklist@gmail.com";

export const termsDocument: LegalDocument = {
  slug: "terms",
  title: "Terms & Conditions",
  lastUpdated: "May 25, 2025",
  intro: [
    'Please read these Terms & Conditions ("Terms") carefully before using the CET RANK website, mobile application, or any related services (collectively, the "Service"). By registering for or using our Service, you agree to be bound by these Terms. If you do not agree to any part of these Terms, you must immediately cease use of the Service.',
  ],
  sections: [
    {
      id: "introduction",
      title: "Introduction & Acceptance",
      subsections: [
        {
          title: "1.1",
          paragraphs: [
            "CET RANK is an independent educational counseling platform offering predictive, data-driven college preference lists based on historical cutoffs published by the State Common Entrance Test Cell, Government of Maharashtra. We have no tie-up with any governmental body, college, or university.",
          ],
        },
        {
          title: "1.2",
          paragraphs: [
            'These Terms form a legally binding agreement between you ("User", "you", "your") and CET RANK ("we", "us", "our").',
          ],
        },
        {
          title: "1.3",
          paragraphs: [
            "By accessing or using the Service, you acknowledge that you have read, understood, and consent to these Terms in full.",
          ],
        },
      ],
    },
    {
      id: "eligibility",
      title: "Eligibility & Registration",
      subsections: [
        {
          title: "2.1 Age Requirement",
          paragraphs: [
            "You must be at least 13 years old to use the Service. Users under 18 must have parental or guardian consent.",
          ],
        },
        {
          title: "2.2 Account Information",
          paragraphs: [
            "During registration you must provide accurate and complete information (mobile number, region, category, percentiles, etc.).",
          ],
        },
        {
          title: "2.3 Account Security",
          paragraphs: [
            "You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account. Notify us immediately of any unauthorized use.",
          ],
        },
      ],
    },
    {
      id: "service-overview",
      title: "Service Overview",
      subsections: [
        {
          title: "3.1 Core Offering",
          bullets: [
            "Generation of personalized college preference lists based on your MHT CET percentile and optional JEE Main percentile.",
            "Display of historical cutoff percentages, approximate rank ranges, branch availability, college names, and locations.",
          ],
        },
        {
          title: "3.2 Advisory Nature & Scope",
          bullets: [
            "Predictive Only: All recommendations are predictions derived from previous years' data and statistical modeling. They do not guarantee admission, seat allocation, or ranking.",
            "Independent Counselor: We operate as an independent counseling resource. We provide data-driven insights only—no one-on-one personal counseling, interview coaching, or direct negotiation with institutions.",
            "No Tie-Up: We have no formal partnerships or endorsement from the Government of Maharashtra, State Common Entrance Test Cell, or any educational institution.",
          ],
        },
        {
          title: "3.3 User Inputs",
          bullets: [
            "Mandatory: Home Region, Category, Religion, Mother Tongue, Gender, MHT CET Percentile, Branch Preferences.",
            "Optional: JEE Main Percentile, TFWS Eligibility, Additional Regions (up to 2).",
          ],
        },
      ],
    },
    {
      id: "fees",
      title: "Fees, Billing & Refunds",
      subsections: [
        {
          title: "4.1 Service Fee",
          paragraphs: [
            "Access to the complete recommendation report requires payment of INR 599 per session.",
          ],
        },
        {
          title: "4.2 Payment Methods",
          paragraphs: [
            "UPI, debit/credit cards, net banking, or other authorized channels.",
          ],
        },
        {
          title: "4.3 Refund Policy",
          paragraphs: [
            "All fees are non-refundable except if we fail to deliver the paid Service within seven (7) business days, or a verifiable technical error leads to inaccessible or incorrect recommendations.",
            `Refund requests must be submitted in writing to ${CONTACT} within seven (7) days of the transaction date.`,
          ],
        },
      ],
    },
    {
      id: "privacy",
      title: "Privacy & Data Protection",
      subsections: [
        {
          title: "5.1",
          paragraphs: [
            "Your use of personal information is governed by our Privacy Policy, incorporated by reference.",
          ],
        },
        {
          title: "5.2 Data Collected",
          paragraphs: [
            "Registration inputs, usage logs, device identifiers, transaction records.",
          ],
        },
        {
          title: "5.3 Purpose",
          paragraphs: [
            "Generate recommendations, process payments, communicate service updates, conduct analytics, and improve platform performance.",
          ],
        },
        {
          title: "5.4 Third-Party Sharing",
          paragraphs: [
            "Only with service providers under confidentiality obligations or if required by law.",
          ],
        },
        {
          title: "5.5 Retention",
          paragraphs: [
            "Data retained for as long as necessary for Service delivery, legal compliance, and dispute resolution.",
          ],
        },
        {
          title: "5.6 Your Rights",
          paragraphs: [
            "Access, correction, deletion (subject to legal retention), and portability of personal data.",
          ],
        },
      ],
    },
    {
      id: "ip",
      title: "Intellectual Property",
      subsections: [
        {
          title: "6.1",
          paragraphs: [
            "All Service content—including software, algorithms, designs, text, graphics, and logos—is the property of CET RANK or its licensors.",
          ],
        },
        {
          title: "6.2",
          paragraphs: [
            "You are granted a limited, non-exclusive, non-transferable license to use the Service for personal, non-commercial purposes only.",
          ],
        },
        {
          title: "6.3",
          paragraphs: [
            "Unauthorized copying, distribution, modification, or derivative works are strictly prohibited.",
          ],
        },
      ],
    },
    {
      id: "conduct",
      title: "User Conduct & Obligations",
      subsections: [
        {
          title: "7.1 Lawful Use",
          paragraphs: [
            "Use the Service only for lawful purposes and in compliance with these Terms and all applicable Indian laws and regulations.",
          ],
        },
        {
          title: "7.2 Prohibited Activities",
          bullets: [
            "Scraping, crawling, reverse-engineering, or otherwise attempting to extract or replicate our data or algorithms.",
            "Uploading or transmitting any viruses, malicious code, or harmful content.",
            "Harassment, hate speech, defamation, or infringing on others' rights.",
            "Impersonation, providing fraudulent information, or unauthorized account access.",
          ],
        },
        {
          title: "7.3",
          paragraphs: [
            "Violation may result in immediate suspension or termination of your account without refund.",
          ],
        },
      ],
    },
    {
      id: "disclaimers",
      title: "Disclaimers & Limitation of Liability",
      subsections: [
        {
          title: "8.1 No Warranty",
          paragraphs: [
            'The Service is provided "as-is" and "as-available" without any warranties, express or implied.',
            "We disclaim all warranties of accuracy, completeness, merchantability, or fitness for a particular purpose.",
          ],
        },
        {
          title: "8.2 Limitation of Liability",
          paragraphs: [
            "To the fullest extent permitted under Indian law, CET RANK and its affiliates shall not be liable for any direct, indirect, incidental, consequential, special, punitive, or exemplary damages arising from or related to your use of the Service.",
            "Our aggregate liability for any claim arising under these Terms shall not exceed the total fees paid by you in the twelve (12) months preceding the claim.",
          ],
        },
        {
          title: "8.3 No Guarantee of Admission",
          paragraphs: [
            "Actual admission decisions rest with the Government counseling authority and individual institutions. We assume no responsibility for any outcome.",
          ],
        },
      ],
    },
    {
      id: "indemnification",
      title: "Indemnification",
      paragraphs: [
        "You agree to defend, indemnify, and hold harmless CET RANK, its officers, directors, employees, and agents from any claims, losses, liabilities, damages, or expenses (including legal fees) arising out of your breach of these Terms, your misuse of the Service, or your violation of any third-party rights.",
      ],
    },
    {
      id: "modifications",
      title: "Service Modifications & Availability",
      subsections: [
        {
          title: "10.1",
          paragraphs: [
            "We strive for reliable Service availability but cannot guarantee uninterrupted access.",
          ],
        },
        {
          title: "10.2",
          paragraphs: [
            "We may modify, suspend, or discontinue any aspect of the Service (including pricing and features) at any time, with or without notice, for operational, security, or legal reasons.",
          ],
        },
      ],
    },
    {
      id: "termination",
      title: "Termination",
      subsections: [
        {
          title: "11.1 By You",
          paragraphs: ["You may deactivate your account at any time."],
        },
        {
          title: "11.2 By Us",
          paragraphs: [
            "We may suspend or terminate your account for violations of these Terms or harmful activity.",
          ],
        },
        {
          title: "11.3 Survival",
          paragraphs: [
            "Sections on Fees & Refunds, Privacy, IP, Disclaimers, Liability, Indemnity, and Governing Law survive termination.",
          ],
        },
      ],
    },
    {
      id: "governing-law",
      title: "Governing Law & Dispute Resolution",
      subsections: [
        {
          title: "12.1",
          paragraphs: [
            "These Terms are governed by the laws of the Republic of India, without regard to conflict-of-law rules.",
          ],
        },
        {
          title: "12.2",
          paragraphs: [
            "Any dispute shall be exclusively resolved by the courts in Mumbai, Maharashtra.",
          ],
        },
        {
          title: "12.3",
          paragraphs: [
            "Prior to formal legal action, parties agree to attempt in good faith to resolve disputes through informal negotiation for at least thirty (30) days.",
          ],
        },
      ],
    },
    {
      id: "severability",
      title: "Severability",
      paragraphs: [
        "If any provision of these Terms is held invalid or unenforceable, that provision shall be limited or severed to the minimum extent necessary so that the remaining Terms remain in full force and effect.",
      ],
    },
    {
      id: "entire-agreement",
      title: "Entire Agreement",
      paragraphs: [
        "These Terms, together with any expressly incorporated documents (including the Privacy Policy and Refund Policy), constitute the entire agreement between you and CET RANK regarding the Service and supersede all prior or contemporaneous agreements.",
      ],
    },
    {
      id: "contact",
      title: "Contact Us",
      paragraphs: ["For questions, support, or legal notices, please contact:"],
    },
  ],
  closing: [
    "Thank you for choosing CET RANK. We remain committed to providing transparent, data-driven guidance to help you navigate your higher-education journey.",
  ],
  contactEmail: CONTACT,
};
