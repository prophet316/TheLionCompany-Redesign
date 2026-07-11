import type { ContactReason, NewsletterPlacement } from "./contracts";

export type NewsletterDeliveryInput = {
  submissionId: string;
  email: string;
  firstName?: string;
  placement: NewsletterPlacement;
  consentVersion: string;
  consentTimestamp: string;
};

export type PrayerDeliveryInput = {
  submissionId: string;
  requestIdentifier: string;
  displayName?: string;
  email?: string;
  request: string;
  followUpRequested: boolean;
};

export type ContactDeliveryInput = {
  submissionId: string;
  requestIdentifier: string;
  name: string;
  email: string;
  reason: ContactReason;
  message: string;
};

export type ProviderReceipt = { providerMessageId: string };

export interface FormDeliveryProvider {
  requestNewsletter(input: NewsletterDeliveryInput): Promise<ProviderReceipt>;
  deliverPrayer(input: PrayerDeliveryInput): Promise<ProviderReceipt>;
  deliverContact(input: ContactDeliveryInput): Promise<ProviderReceipt>;
}

export class ProviderFault extends Error {
  constructor() {
    super("provider unavailable");
    this.name = "ProviderFault";
  }
}
