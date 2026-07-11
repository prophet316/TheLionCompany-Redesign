import type { Metadata } from "next";
import { NewsletterForm } from "../../../components/client/forms/newsletter-form";

export const metadata: Metadata = {
  title: "Unsubscribed — The Lion Company",
  robots: { index: false, follow: false },
};

export default function NewsletterUnsubscribedPage() {
  return (
    <section className="section shell">
      <h1 id="newsletter-unsubscribed-heading">You have been unsubscribed.</h1>
      <p>Brevo will keep only the suppression data needed to honor your choice. You may request a new double opt-in email below.</p>
      <NewsletterForm placement="connect" headingId="newsletter-unsubscribed-heading" />
    </section>
  );
}
