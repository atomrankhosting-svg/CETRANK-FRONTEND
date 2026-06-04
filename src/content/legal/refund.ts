import type { LegalDocument } from "./types";

const CONTACT = "cetranklist@gmail.com";

export const refundDocument: LegalDocument = {
  slug: "refund",
  title: "Refund Policy",
  lastUpdated: "May 25, 2025",
  intro: [
    'This Refund Policy ("Policy") applies to all purchases of services and products (collectively, "Services") offered by CET RANK ("CET RANK," "we," "us," or "our") via the CET RANK website, mobile application, or any other platform. By purchasing our Services, you agree to the terms of this Policy.',
  ],
  sections: [
    {
      id: "overview",
      title: "Overview",
      subsections: [
        {
          title: "1.1",
          paragraphs: [
            "All fees for our predictive college preference list generation, data reports, and related services are generally non-refundable, except as expressly provided herein or as required by applicable Indian consumer protection laws (including the Consumer Protection Act, 2019).",
          ],
        },
        {
          title: "1.2",
          paragraphs: [
            "This Policy is incorporated into and forms part of the CET RANK Terms & Conditions.",
          ],
        },
      ],
    },
    {
      id: "payment-billing",
      title: "Payment & Billing",
      subsections: [
        {
          title: "2.1 Payment Methods",
          paragraphs: [
            "We accept UPI, debit/credit cards, net banking, and other authorized payment channels.",
          ],
        },
      ],
    },
    {
      id: "refund-eligibility",
      title: "Refund Eligibility",
      subsections: [
        {
          title: "3.1 Full Refund",
          paragraphs: ["You are entitled to a full refund of the Service fee if:"],
          bullets: [
            "We fail to deliver the paid Service within seven (7) business days of your payment, and you notify us in writing within seven (7) days of the delivery deadline.",
            "A verifiable technical error on our part renders the Service inaccessible and we fail to correct such error within seven (7) business days of your notice.",
          ],
        },
        {
          title: "3.3 No Refund",
          paragraphs: ["Refunds will not be issued for:"],
          bullets: [
            "Change of mind, dissatisfaction with outcomes, or disagreement with predictive recommendations.",
            "Delay or failure in seat allocation by government counseling authorities or educational institutions.",
            "Failure to meet external eligibility criteria, counseling deadlines, or participation requirements.",
            "Any third-party fees or charges (e.g., payment gateway charges, bank fees).",
          ],
        },
      ],
    },
    {
      id: "how-to-request",
      title: "How to Request a Refund",
      subsections: [
        {
          title: "4.1 Submission",
          paragraphs: [
            `Send your request in writing to ${CONTACT} within the timelines specified above. Include:`,
          ],
          bullets: [
            "Your full name and registered mobile number or email.",
            "Date of payment and transaction ID.",
            "Description of the issue and reason for refund.",
          ],
        },
        {
          title: "4.2 Acknowledgment",
          paragraphs: [
            "We will acknowledge receipt of your request within three (3) business days.",
          ],
        },
        {
          title: "4.3 Review & Decision",
          paragraphs: [
            "We will review your request and notify you of our decision within seven (7) business days of acknowledgment.",
            "We may request additional information to verify eligibility.",
          ],
        },
        {
          title: "4.4 Refund Execution",
          paragraphs: [
            "Approved refunds will be processed within fourteen (14) business days of approval.",
            "Refunds will be issued via the original payment method. If the original method is unavailable, we will refund via bank transfer to an account you designate.",
          ],
        },
      ],
    },
    {
      id: "chargebacks",
      title: "Chargebacks",
      subsections: [
        {
          title: "5.1 Notification Requirement",
          paragraphs: [
            `Before initiating a chargeback with your bank or payment provider, you must notify us in writing at ${CONTACT} and provide us the opportunity to resolve your concerns.`,
          ],
        },
        {
          title: "5.2 Consequences",
          paragraphs: ["Unauthorized chargebacks may result in:"],
          bullets: [
            "Suspension or termination of your account and access to Services.",
            "Recovery of fees via collection or legal proceedings, including any chargeback fees levied by banks.",
          ],
        },
      ],
    },
    {
      id: "consumer-rights",
      title: "Consumer Rights & Dispute Resolution",
      subsections: [
        {
          title: "6.1",
          paragraphs: [
            "Nothing in this Policy limits your rights under the Consumer Protection Act, 2019 or any other applicable Indian law.",
          ],
        },
        {
          title: "6.2",
          paragraphs: [
            "In case of a dispute regarding a refund, you agree to first engage in good-faith negotiations with us for thirty (30) days prior to initiating any legal action.",
          ],
        },
        {
          title: "6.3",
          paragraphs: [
            "Any unresolved disputes shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra, India.",
          ],
        },
      ],
    },
    {
      id: "modifications",
      title: "Modifications to This Policy",
      paragraphs: [
        'We reserve the right to modify this Refund Policy at any time by posting an updated version on our website with a revised "Last updated" date. Your continued use of the Service after such changes constitutes acceptance of the updated Policy.',
      ],
    },
    {
      id: "contact",
      title: "Contact Us",
      paragraphs: ["For all refund-related inquiries, please contact:"],
    },
  ],
  closing: [
    "Thank you for choosing CET RANK. We strive to deliver quality predictive services and to address any concerns with transparency and fairness.",
  ],
  contactEmail: CONTACT,
};
