import { describe, expect, it, vi } from "vitest";
import { BrevoFormProvider } from "../../../lib/forms/brevo";
import { renderPrayerEmail } from "../../../lib/forms/email-templates";
import { NoSendFormProvider } from "../../../lib/forms/no-send";

const submissionId = "9a7449c2-6a48-4970-92ea-6919a22e7f55";

function client() {
  return {
    contacts: { createDoiContact: vi.fn(async () => ({})) },
    transactionalEmails: {
      sendTransacEmail: vi.fn(async () => ({ messageId: "provider-message-1" })),
    },
  };
}

const config = {
  mode: "test-recipient" as const,
  siteUrl: new URL("https://www.thelioncompany.org"),
  newsletterListId: 12,
  doiTemplateId: 34,
  sender: { email: "forms@thelioncompany.org", name: "The Lion Company" },
  prayerRecipient: "prayer@thelioncompany.org",
  contactRecipient: "contact@thelioncompany.org",
  testRecipient: "reviewer@example.org",
};

describe("Brevo form provider", () => {
  it("uses native DOI with consent metadata and the canonical confirmation route", async () => {
    const fake = client();
    const provider = new BrevoFormProvider(fake, config);
    await provider.requestNewsletter({
      submissionId,
      email: "person@example.org",
      firstName: "Ada",
      placement: "inline",
      consentVersion: "2026-07-11",
      consentTimestamp: "2026-07-11T12:00:00.000Z",
    });
    expect(fake.contacts.createDoiContact).toHaveBeenCalledWith({
      email: "reviewer@example.org",
      includeListIds: [12],
      redirectionUrl: "https://www.thelioncompany.org/newsletter/confirmed",
      templateId: 34,
      attributes: {
        FIRSTNAME: "Ada",
        CONSENT_VERSION: "2026-07-11",
        CONSENT_TIMESTAMP: "2026-07-11T12:00:00.000Z",
        CONSENT_PLACEMENT: "inline",
        CONSENT_SOURCE: "website",
      },
    });
  });

  it("rewrites transactional recipients in preview and passes Brevo idempotency", async () => {
    const fake = client();
    const provider = new BrevoFormProvider(fake, config);
    await provider.deliverPrayer({
      submissionId,
      requestIdentifier: "P-0123456789ABCDEF",
      displayName: "Ada",
      email: "ada@example.org",
      request: "Please pray for <wisdom> & peace this week.",
      followUpRequested: true,
    });
    expect(fake.transactionalEmails.sendTransacEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Prayer request P-0123456789ABCDEF",
        to: [{ email: "reviewer@example.org" }],
        replyTo: { email: "ada@example.org" },
        headers: { "Idempotency-Key": submissionId },
        textContent: expect.stringContaining("Please pray for <wisdom> & peace"),
        htmlContent: expect.stringContaining("&lt;wisdom&gt; &amp; peace"),
      }),
      { maxRetries: 1, timeoutInSeconds: 8 },
    );
  });

  it("returns the same DOI receipt for only the provider duplicate code", async () => {
    const fake = client();
    fake.contacts.createDoiContact.mockRejectedValueOnce({
      body: { code: "duplicate_parameter" },
    });
    const provider = new BrevoFormProvider(fake, config);
    await expect(
      provider.requestNewsletter({
        submissionId,
        email: "person@example.org",
        placement: "connect",
        consentVersion: "2026-07-11",
        consentTimestamp: "2026-07-11T12:00:00.000Z",
      }),
    ).resolves.toEqual({ providerMessageId: `doi:${submissionId}` });
    fake.contacts.createDoiContact.mockRejectedValueOnce({ body: { code: "invalid_parameter" } });
    await expect(
      provider.requestNewsletter({
        submissionId,
        email: "person@example.org",
        placement: "connect",
        consentVersion: "2026-07-11",
        consentTimestamp: "2026-07-11T12:00:00.000Z",
      }),
    ).rejects.toMatchObject({ name: "ProviderFault" });
  });
});

describe("controlled messages and no-send", () => {
  it("never places prayer text or name in a subject", () => {
    const email = renderPrayerEmail({
      requestIdentifier: "P-0123456789ABCDEF",
      displayName: "Ada",
      request: "Please pray for wisdom and peace this week.",
      followUpRequested: false,
    });
    expect(email.subject).toBe("Prayer request P-0123456789ABCDEF");
    expect(email.subject).not.toContain("Ada");
    expect(email.subject).not.toContain("wisdom");
  });

  it("makes no network request in no-send mode", async () => {
    const provider = new NoSendFormProvider();
    await expect(
      provider.requestNewsletter({
        submissionId,
        email: "person@example.org",
        placement: "prompt",
        consentVersion: "2026-07-11",
        consentTimestamp: "2026-07-11T12:00:00.000Z",
      }),
    ).resolves.toEqual({ providerMessageId: `no-send:${submissionId}` });
  });
});
