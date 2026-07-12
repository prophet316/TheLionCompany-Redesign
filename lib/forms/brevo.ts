import "server-only";
import type { DeliveryMode } from "./contracts";
import { renderContactEmail, renderPrayerEmail } from "./email-templates";
import type {
  ContactDeliveryInput,
  FormDeliveryProvider,
  NewsletterDeliveryInput,
  PrayerDeliveryInput,
  ProviderReceipt,
} from "./provider";
import { ProviderFault } from "./provider";

type BrevoLike = {
  contacts: {
    createDoiContact(input: {
      email: string;
      includeListIds: number[];
      redirectionUrl: string;
      templateId: number;
      attributes: Record<string, string>;
    }): Promise<unknown>;
  };
  transactionalEmails: {
    sendTransacEmail(
      input: {
        sender: { email: string; name: string };
        to: Array<{ email: string }>;
        replyTo?: { email: string };
        subject: string;
        textContent: string;
        htmlContent: string;
        headers: { "Idempotency-Key": string };
        tags: string[];
      },
      options: { maxRetries: number; timeoutInSeconds: number },
    ): Promise<{ messageId?: string }>;
  };
};

type Config = {
  mode: Extract<DeliveryMode, "test-recipient" | "live">;
  siteUrl: URL;
  newsletterListId: number;
  doiTemplateId: number;
  sender: { email: string; name: string };
  prayerRecipient: string;
  contactRecipient: string;
  testRecipient?: string;
};

function isDuplicateDoi(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("body" in error)) return false;
  const body = (error as { body?: unknown }).body;
  return Boolean(
    body &&
      typeof body === "object" &&
      "code" in body &&
      (body as { code?: unknown }).code === "duplicate_parameter",
  );
}

export class BrevoFormProvider implements FormDeliveryProvider {
  constructor(
    private readonly client: BrevoLike,
    private readonly config: Config,
  ) {}

  async requestNewsletter(input: NewsletterDeliveryInput): Promise<ProviderReceipt> {
    const recipient =
      this.config.mode === "test-recipient" ? this.config.testRecipient : input.email;
    if (!recipient) throw new ProviderFault();
    try {
      await this.client.contacts.createDoiContact({
        email: recipient,
        includeListIds: [this.config.newsletterListId],
        redirectionUrl: new URL("/newsletter/confirmed", this.config.siteUrl).toString(),
        templateId: this.config.doiTemplateId,
        attributes: {
          ...(input.firstName ? { FIRSTNAME: input.firstName } : {}),
          CONSENT_VERSION: input.consentVersion,
          CONSENT_TIMESTAMP: input.consentTimestamp,
          CONSENT_PLACEMENT: input.placement,
          CONSENT_SOURCE: "website",
        },
      });
      return { providerMessageId: `doi:${input.submissionId}` };
    } catch (error) {
      if (isDuplicateDoi(error)) return { providerMessageId: `doi:${input.submissionId}` };
      throw new ProviderFault();
    }
  }

  async deliverPrayer(input: PrayerDeliveryInput): Promise<ProviderReceipt> {
    const message = renderPrayerEmail(input);
    return this.send({
      submissionId: input.submissionId,
      recipient: this.config.prayerRecipient,
      replyTo: input.email,
      tag: "form-prayer",
      ...message,
    });
  }

  async deliverContact(input: ContactDeliveryInput): Promise<ProviderReceipt> {
    const message = renderContactEmail(input);
    return this.send({
      submissionId: input.submissionId,
      recipient: this.config.contactRecipient,
      replyTo: input.email,
      tag: "form-contact",
      ...message,
    });
  }

  private async send(input: {
    submissionId: string;
    recipient: string;
    replyTo?: string;
    tag: string;
    subject: string;
    textContent: string;
    htmlContent: string;
  }): Promise<ProviderReceipt> {
    const recipient =
      this.config.mode === "test-recipient" ? this.config.testRecipient : input.recipient;
    if (!recipient) throw new ProviderFault();
    try {
      const result = await this.client.transactionalEmails.sendTransacEmail(
        {
          sender: this.config.sender,
          to: [{ email: recipient }],
          ...(input.replyTo ? { replyTo: { email: input.replyTo } } : {}),
          subject: input.subject,
          textContent: input.textContent,
          htmlContent: input.htmlContent,
          headers: { "Idempotency-Key": input.submissionId },
          tags: [input.tag],
        },
        { maxRetries: 1, timeoutInSeconds: 8 },
      );
      if (!result.messageId) throw new ProviderFault();
      return { providerMessageId: result.messageId };
    } catch {
      throw new ProviderFault();
    }
  }
}
