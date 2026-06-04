import type { LegalDocument } from "./types";

const CONTACT = "cetranklist@gmail.com";

export const privacyDocument: LegalDocument = {
  slug: "privacy",
  title: "Privacy Policy",
  lastUpdated: "May 25, 2025",
  intro: [
    'CET RANK ("CET RANK," "we," "us," or "our") is committed to safeguarding your privacy and ensuring the security of your personal data. This Privacy Policy describes how we collect, use, disclose, retain and protect information when you access or use our website, mobile application, or any related services (collectively, the "Service"). By registering for or using the Service, you acknowledge that you have read, understood, and agree to this Privacy Policy. If you do not agree with any part of this policy, please discontinue use of the Service immediately.',
  ],
  sections: [
    {
      id: "definitions",
      title: "Definitions",
      bullets: [
        '"Personal Data": Any information that identifies or can reasonably identify an individual (e.g., name, email, mobile number).',
        '"Sensitive Personal Data or Information (SPDI)": As defined under the Information Technology Rules, 2011 (e.g., financial information, official identifiers).',
        '"Usage Data": Data collected automatically when you access or use the Service, such as IP address, device identifiers, browser type, and pages visited.',
        '"Aggregate Data": Non-personal, de-identified information derived from Personal Data, used for statistical purposes.',
      ],
    },
    {
      id: "information-collected",
      title: "Information We Collect",
      subsections: [
        {
          title: "2.1 Information You Provide",
          bullets: [
            "Registration Data: Mobile number, one-time password (OTP), region, category, religion, mother tongue, gender, branch preferences.",
            "Academic Data: MHT CET percentile, JEE Main percentile (optional), TFWS eligibility, previous academic history.",
            "Profile and Support: Name, email address, feedback, and correspondence with our support team.",
          ],
        },
        {
          title: "2.2 Automatically Collected Data",
          bullets: [
            "Usage Data: IP address, device type, operating system, browser version, pages viewed, times and dates of access, referral URLs.",
            "Cookies & Tracking Technologies: Cookies, web beacons, local storage, and similar technologies to personalize content, remember preferences, and analyze trends.",
          ],
        },
        {
          title: "2.3 Third-Party Sources",
          bullets: [
            "Analytics & Advertising: Google Analytics, Facebook Pixel, and other third-party analytics providers for performance monitoring.",
            "Payment Processors: Transaction identifiers and payment confirmation details from Razorpay, or similar gateways.",
          ],
        },
      ],
    },
    {
      id: "how-we-use",
      title: "How We Use Your Information",
      paragraphs: ["We process your Personal Data for the following lawful purposes:"],
      subsections: [
        {
          title: "Service Delivery",
          bullets: [
            "Generate personalized college preference lists and recommendations.",
            "Process payments, subscriptions, and refunds.",
          ],
        },
        {
          title: "Communication",
          bullets: [
            "Send account-related notifications, OTPs, security alerts, and Service updates.",
            "Respond to your inquiries, feedback, or complaints.",
          ],
        },
        {
          title: "Analytics & Improvement",
          bullets: [
            "Monitor usage patterns to optimize performance, features, and user experience.",
            "Conduct research, troubleshooting, and data analysis.",
          ],
        },
        {
          title: "Marketing & Promotions",
          bullets: [
            "With your consent, send newsletters, promotional offers, and educational content.",
            "Provide opt-out mechanisms in every marketing communication.",
          ],
        },
        {
          title: "Legal Compliance & Protection",
          bullets: [
            "Comply with applicable laws, regulations, and court orders.",
            "Detect, prevent, and address fraud, security or technical issues, and enforce our Terms & Conditions.",
          ],
        },
      ],
    },
    {
      id: "disclosure",
      title: "Disclosure of Information",
      paragraphs: [
        "We do not sell, rent, or trade your Personal Data. We may share your information in the following circumstances:",
      ],
      bullets: [
        "Service Providers & Subprocessors: Engaged under written contracts to support operations (hosting, payment processing, SMS/email delivery), bound by confidentiality and limited-use obligations.",
        "Legal & Regulatory Authorities: When required by law, regulation, or governmental request, or to protect the rights, property, or safety of CET RANK, our users, or others.",
        "Business Transfers: In connection with a merger, acquisition, or sale of assets, provided that the successor entity agrees to this Privacy Policy or a materially similar one.",
        "Aggregate or De-identified Data: Shared publicly or with partners for research, operational benchmarking, or statistical purposes—without personal identifiers.",
      ],
    },
    {
      id: "retention-security",
      title: "Data Retention & Security",
      subsections: [
        {
          title: "5.1 Retention Period",
          paragraphs: [
            "We retain your Personal Data only as long as necessary to fulfill the purposes outlined above, comply with legal obligations, resolve disputes, and enforce agreements.",
            "Academic recommendation data may be retained for up to five (5) years for audit and improvement purposes, unless you request earlier deletion.",
          ],
        },
        {
          title: "5.2 Security Measures",
          bullets: [
            "Technical Controls: TLS encryption in transit, AES-256 encryption at rest, firewalls, intrusion detection.",
            "Organizational Controls: Role-based access, background checks, security training for employees.",
            "Physical Controls: Secure data centers with restricted access and environmental safeguards.",
          ],
          paragraphs: [
            "While we strive to protect your data, no system can guarantee absolute security. We disclaim liability for unauthorized access beyond our reasonable control.",
          ],
        },
      ],
    },
    {
      id: "your-rights",
      title: "Your Rights & Choices",
      paragraphs: ["Under applicable Indian laws and the Information Technology Rules, you have:"],
      subsections: [
        {
          title: "",
          bullets: [
            "Right to Access: Request copies of your Personal Data.",
            "Right to Correction: Update or rectify inaccurate or incomplete data.",
            'Right to Erasure ("Right to be Forgotten"): Request deletion of Personal Data, subject to legal retention requirements.',
            "Right to Restrict Processing: Limit processing for certain purposes.",
            "Right to Data Portability: Receive your data in a structured, machine-readable format.",
            "Right to Object: Opt out of direct marketing, profiling, or automated decision-making.",
          ],
          paragraphs: [
            `To exercise any right, contact us at ${CONTACT}. We will respond within 30 days, or as mandated by law.`,
          ],
        },
      ],
    },
    {
      id: "cookies",
      title: "Cookies & Tracking",
      paragraphs: [
        "We use cookies and similar technologies to enable core site functionality, remember preferences, and analyze site usage.",
        "You may control or disable cookies through your browser settings; however, certain features may not function properly if cookies are blocked.",
      ],
    },
    {
      id: "children",
      title: "Children's Privacy",
      paragraphs: [
        "Our Service is not directed to children under 13 years of age. We do not knowingly collect Personal Data from children. If we learn that we have inadvertently collected data from a child under 13, we will promptly delete that information.",
      ],
    },
    {
      id: "third-party-links",
      title: "Third-Party Links",
      paragraphs: [
        "Our Service may contain links to third-party websites, apps, or services not owned or controlled by CET RANK. We are not responsible for their privacy practices. We encourage you to review the privacy policies of any third-party sites you visit.",
      ],
    },
    {
      id: "changes",
      title: "Changes to This Policy",
      paragraphs: [
        'We may update this Privacy Policy at any time by posting a revised version with a new "Last updated" date. Significant changes will be communicated via email or an in-app notification. Your continued use of the Service after such changes constitutes acceptance of the revised policy.',
      ],
    },
    {
      id: "no-liability",
      title: "No Liability",
      paragraphs: [
        "To the fullest extent permitted by law, CET RANK disclaims all liability arising from your use of or reliance on the Service, any third-party content, or any breach of security beyond our reasonable control.",
      ],
    },
    {
      id: "contact",
      title: "Contact Us",
      paragraphs: [
        "For privacy inquiries, to exercise your rights, or to report concerns, please contact:",
      ],
    },
  ],
  closing: [
    "Thank you for trusting CET RANK with your educational journey. We are committed to protecting your privacy and earning your confidence.",
  ],
  contactEmail: CONTACT,
};
