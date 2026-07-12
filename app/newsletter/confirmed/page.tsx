import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterOutcomeMarker } from "../../../components/client/forms/newsletter-outcome-marker";

export const metadata: Metadata = {
  title: "Monthly Field Notes Confirmed — The Lion Company",
  robots: { index: false, follow: false },
};

export default function NewsletterConfirmedPage() {
  return (
    <section className="section shell">
      <NewsletterOutcomeMarker />
      <h1>Your monthly field notes are confirmed.</h1>
      <p>Brevo has completed the double opt-in action. Watch your inbox for the next monthly letter.</p>
      <Link href="/teachings">Begin with a teaching</Link>
    </section>
  );
}
