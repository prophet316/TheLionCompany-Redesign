import Link from "next/link";
import { ConsentSettingsButton } from "@/components/client/consent-controls";
import { TrackedLink } from "@/components/client/tracked-link";
import { destinationRegistry } from "@/content/destinations";
import { isPodcastAnalyticsTarget, isSocialAnalyticsTarget } from "@/lib/analytics/contracts";
import type { DestinationKey } from "@/lib/content/types";
import styles from "./site-shell.module.css";

const channelKeys: readonly DestinationKey[] = [
  "tiktok", "youtube", "applePodcasts", "spotify", "podbean", "instagram", "facebook", "threads", "x",
];

export function SiteFooter() {
  const allowed = new Set<DestinationKey>(channelKeys);
  const channels = destinationRegistry.filter((item) => item.visible && allowed.has(item.key));
  return (
    <footer className={styles.footer}>
      <div className={styles.footerLead}>
        <p className={styles.footerEyebrow}>Seen. Gathered. Formed. Sent.</p>
        <h2>There is a place for you in the work.</h2>
        <p>This ministry is sustained by voluntary givers who choose to carry teaching, prayer, discipleship, and Christian unity forward.</p>
        <div className={styles.footerActions}>
          <TrackedLink href="/teachings" eventName="cta_click" eventProperties={{ target: "teachings", placement: "footer" }}>Begin with a teaching</TrackedLink>
          <TrackedLink href="/prayer" eventName="cta_click" eventProperties={{ target: "prayer", placement: "footer" }}>Ask for prayer</TrackedLink>
          <TrackedLink href="/connect#newsletter" eventName="cta_click" eventProperties={{ target: "newsletter", placement: "footer" }}>Join the monthly letter</TrackedLink>
          <TrackedLink href="/give" eventName="cta_click" eventProperties={{ target: "give", placement: "footer" }}>Give to The Lion Company</TrackedLink>
          <TrackedLink href="/store" eventName="cta_click" eventProperties={{ target: "store", placement: "footer" }}>Visit the store</TrackedLink>
          <TrackedLink href="/connect" eventName="cta_click" eventProperties={{ target: "connect", placement: "footer" }}>Contact the ministry</TrackedLink>
        </div>
      </div>
      <div className={styles.footerGrid}>
        <div>
          <strong>The Lion Company</strong>
          <p>A Jesus-centered ministry pursuing Christian unity. Texas-based, serving globally.</p>
        </div>
        <nav aria-label="Social and listening channels">
          <ul>
            {channels.map((channel) => {
              if (isPodcastAnalyticsTarget(channel.key)) return <li key={channel.key}><TrackedLink href={channel.href} eventName="podcast_platform_click" eventProperties={{ target: channel.key, placement: "footer" }}>{channel.label}</TrackedLink></li>;
              if (isSocialAnalyticsTarget(channel.key)) return <li key={channel.key}><TrackedLink href={channel.href} eventName="social_click" eventProperties={{ target: channel.key, placement: "footer" }}>{channel.label}</TrackedLink></li>;
              return null;
            })}
          </ul>
        </nav>
        <nav aria-label="Policies">
          <ul>
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/terms">Terms</Link></li>
            <li><Link href="/accessibility">Accessibility</Link></li>
            <li><ConsentSettingsButton /></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
