import "server-only";
import type {
  ContactDeliveryInput,
  FormDeliveryProvider,
  NewsletterDeliveryInput,
  PrayerDeliveryInput,
  ProviderReceipt,
} from "./provider";

function receipt(submissionId: string): ProviderReceipt {
  return { providerMessageId: `no-send:${submissionId}` };
}

export class NoSendFormProvider implements FormDeliveryProvider {
  async requestNewsletter(input: NewsletterDeliveryInput): Promise<ProviderReceipt> {
    return receipt(input.submissionId);
  }
  async deliverPrayer(input: PrayerDeliveryInput): Promise<ProviderReceipt> {
    return receipt(input.submissionId);
  }
  async deliverContact(input: ContactDeliveryInput): Promise<ProviderReceipt> {
    return receipt(input.submissionId);
  }
}
