import { ContactForm } from "@/components/client/forms/contact-form";
import { NewsletterForm } from "@/components/client/forms/newsletter-form";
import { TrackedLink } from "@/components/client/tracked-link";
import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { destinationRegistry } from "@/content/destinations";
import { isPodcastAnalyticsTarget, isSocialAnalyticsTarget } from "@/lib/analytics/contracts";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import styles from "../participation.module.css";

const description = "Join the monthly letter, contact The Lion Company, or connect through an active ministry channel.";

export const metadata = createPageMetadata({
  title: "Connect",
  description,
  path: "/connect",
});

export default function ConnectPage() {
  return (
    <>
      <JsonLd id="connect-schema" data={[webPageSchema({ path: "/connect", title: "Connect", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Connect", path: "/connect" }])]} />
      <PageIntro eyebrow="Connect" title="Choose the kind of connection you need." description="Monthly formation, a direct inquiry, or a channel for the rhythm of your day." />
      <section className={styles.split} id="newsletter" aria-labelledby="connect-newsletter">
        <div><p>Monthly field notes</p><h2 id="connect-newsletter">One thoughtful letter, not a crowded inbox.</h2><p>Receive one monthly teaching, current live guidance, new resources and podcast releases, ministry updates, and occasional store or support news. Confirm by email to join.</p></div>
        <NewsletterForm placement="connect" />
      </section>
      <section className={styles.split} aria-labelledby="contact-title">
        <div><p>Direct contact</p><h2 id="contact-title">Start a clear conversation.</h2><p>Use this form for speaking, partnership, media, testimony, or a general message. A testimony submission does not grant publication permission.</p></div>
        <ContactForm />
      </section>
      <section className={styles.channels} aria-labelledby="connect-channels">
        <h2 id="connect-channels">Meet us in the right place.</h2>
        <div>
          {destinationRegistry.filter((item) => item.visible && !["printify", "subsplash", "podcastRss"].includes(item.key)).map((channel) => (
            <article key={channel.key}>
              <h3>{channel.label}</h3><p>{channel.purpose}</p>
              {isPodcastAnalyticsTarget(channel.key) ? (
                <TrackedLink href={channel.href} eventName="podcast_platform_click" eventProperties={{ target: channel.key, placement: "connect" }}>Open {channel.label}</TrackedLink>
              ) : isSocialAnalyticsTarget(channel.key) ? (
                <TrackedLink href={channel.href} eventName="social_click" eventProperties={{ target: channel.key, placement: "connect" }}>Open {channel.label}</TrackedLink>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
