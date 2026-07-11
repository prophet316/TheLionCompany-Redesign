import type { Metadata } from "next";
import { NewsletterForm } from "../../../components/client/forms/newsletter-form";

export const metadata: Metadata = {
  title: "Request a New Confirmation — The Lion Company",
  robots: { index: false, follow: false },
};

export default function NewsletterExpiredPage() {
  return (
    <section className="section shell">
      <h1 id="newsletter-recovery-heading">That confirmation link is invalid or expired.</h1>
      <p>Request a fresh email below. This page does not reveal whether an address is already on the list.</p>
      <NewsletterForm placement="connect" headingId="newsletter-recovery-heading" />
    </section>
  );
}
