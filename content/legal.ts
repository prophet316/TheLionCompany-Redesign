export const legalEffectiveDate = "July 11, 2026";

export function mailboxProviderDisclosure(): string {
  const mode = process.env.NEXT_PUBLIC_FORM_MODE ?? "no-send";
  const provider = process.env.MAILBOX_PROVIDER_PUBLIC_NAME?.trim();
  if (mode === "live" && !provider) {
    throw new Error("MAILBOX_PROVIDER_PUBLIC_NAME is required for live legal disclosure");
  }
  return provider ?? "No ministry mailbox provider receives submissions in no-send preview mode";
}

export function providerDeletionDisclosures() {
  const mode = process.env.NEXT_PUBLIC_FORM_MODE ?? "no-send";
  const mailbox = process.env.MAILBOX_BACKUP_AND_DELETION_PUBLIC?.trim();
  const brevo = process.env.BREVO_BACKUP_AND_DELETION_PUBLIC?.trim();
  if (mode === "live" && (!mailbox || !brevo)) {
    throw new Error("verified public provider backup and final-deletion timing is required for live forms");
  }
  return {
    mailbox: mailbox ?? "No prayer or contact message reaches a mailbox provider in no-send preview mode.",
    brevo: brevo ?? "No Brevo contact or transactional record is created in no-send preview mode.",
  };
}

export function privacySections(
  mailboxProvider: string,
  deletion: ReturnType<typeof providerDeletionDisclosures>,
) {
  return [
    {
      heading: "Who we are",
      paragraphs: [
        "The Lion Company is Texas-based, serving globally. This policy explains the website data practices for thelioncompany.org. Legal and tax-status details are not claimed here until current authoritative verification is recorded and approved.",
      ],
    },
    {
      heading: "What we collect and why",
      paragraphs: [
        "Newsletter requests include an email address, optional first name, consent version, consent time, and form placement so Brevo can send and record double opt-in confirmation.",
        "Prayer requests may include a name, email address, prayer text, and a separate follow-up choice. Contact requests include name, email address, inquiry reason, and message. These submissions are used only to respond, pray, administer the ministry, prevent abuse, and maintain required records.",
        "Cloudflare Turnstile processes security signals and a short-lived token to prevent automated abuse. Opaque HMAC-based submission states remain in Redis for no more than 24 hours and contain no form content or visitor identity.",
      ],
    },
    {
      heading: "Analytics and external media",
      paragraphs: [
        "Google Analytics loads only after an affirmative analytics choice. Form values and identifiers are never sent to analytics. YouTube uses a privacy-enhanced facade and makes no request until you choose to play media.",
        "Printify operates the external store and Subsplash operates the external giving destination. Their policies apply after you follow those links.",
      ],
    },
    {
      heading: "Service providers",
      paragraphs: [
        `The website uses Vercel for hosting, Brevo for newsletter double opt-in and form delivery, Cloudflare Turnstile for abuse protection, Google Analytics for consented measurement, YouTube for user-started video, Printify for merchandise, Subsplash for giving, Upstash Redis for opaque short-lived idempotency, and ${mailboxProvider} for restricted prayer and contact mail.`,
      ],
    },
    {
      heading: "Retention",
      paragraphs: [
        "Prayer mail is deleted after 90 days unless labeled active-follow-up. Active follow-up is reviewed every 30 days and may remain no more than 12 months without a documented legal or safety hold; it is deleted within 30 days after the conversation closes.",
        "Resolved contact mail is deleted 12 months after resolution; unresolved messages receive a quarterly review. Pending double-opt-in contacts purge after 30 days. Confirmed newsletter consent remains until unsubscribe or deletion request, and suppression data remains only as needed to honor opt-out. Brevo transactional logs retain one month, and message previews are disabled. Opaque Redis records expire after 24 hours and are not backed up or exported.",
        `Mailbox provider backup and final deletion: ${deletion.mailbox}`,
        `Brevo backup and final deletion: ${deletion.brevo}`,
      ],
    },
    {
      heading: "Your choices and rights",
      paragraphs: [
        "You may decline analytics, withdraw analytics consent, unsubscribe through every campaign, or use the contact form to request access, correction, or deletion. Prayer, contact, newsletter, and analytics choices remain separate.",
        "We do not sell personal information, create advertising audiences from prayer or contact submissions, or publish testimony text without a separate written permission process.",
      ],
    },
    {
      heading: "Children, safety, and changes",
      paragraphs: [
        "The website is not directed to children under 13, and we do not knowingly collect their information without appropriate guardian involvement. Prayer and contact forms are not emergency services; contact local emergency services if anyone is in immediate danger.",
        "Reasonable technical and organizational safeguards reduce risk but no internet transmission is guaranteed completely secure. Material policy changes receive a new effective date and, when required, a renewed consent choice.",
      ],
    },
  ] as const;
}

export const termsSections = [
  ["Purpose", "This website provides Christian teaching, ministry information, prayer and contact paths, newsletter enrollment, and links to independent store and giving services."],
  ["Appropriate use", "Do not submit unlawful, threatening, abusive, deceptive, automated, privacy-invasive, or security-testing content through public forms. Do not interfere with the website or impersonate another person."],
  ["Ministry and emergency limits", "Website content and prayer responses are pastoral resources, not medical, legal, financial, mental-health, or emergency services. Contact qualified local professionals or emergency services when needed."],
  ["External services", "YouTube, Brevo, Printify, Subsplash, podcast platforms, and social channels operate under their own terms. Merchandise purchases, refunds, and payment handling occur with Printify; giving transactions occur with Subsplash."],
  ["Content and testimony", "The Lion Company and its licensors retain rights in website content. A testimony submission does not grant publication rights; publication requires separate written permission."],
  ["Availability and changes", "The website may change or be unavailable. These terms may change with a new effective date. Texas law governs to the extent legally permitted."],
] as const;

export const accessibilitySections = [
  ["Our commitment", "The Lion Company targets WCAG 2.2 Level AA and designs content, navigation, dialogs, media paths, and forms for keyboard, screen reader, zoom, contrast, and reduced-motion access."],
  ["Known dependencies", "Some linked media, store, giving, podcast, and social services are operated by third parties. We still provide meaningful direct links and text context when an embedded experience is not accessible."],
  ["Feedback", "If a page or feature creates an accessibility barrier, use the general contact form and choose General question. Include the page and the task you were trying to complete; do not include sensitive prayer content in an accessibility report."],
] as const;
