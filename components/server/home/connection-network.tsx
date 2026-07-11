import { TrackedLink } from "@/components/client/tracked-link";
import { ChannelMark } from "@/components/ui/channel-mark";
import { isPodcastAnalyticsTarget, isSocialAnalyticsTarget } from "@/lib/analytics/contracts";
import type { Destination } from "@/lib/content/types";
import styles from "./home.module.css";

export function ConnectionNetwork({ channels }: { readonly channels: readonly Destination[] }) {
  const connectionChannels = channels.filter(
    (channel) => channel.visible && (isSocialAnalyticsTarget(channel.key) || isPodcastAnalyticsTarget(channel.key)),
  );
  return (
    <section className={"section " + styles.network} id="contact" aria-labelledby="network-title" data-gathering-stage="network">
      <p className={styles.eyebrow}>Stay connected</p>
      <h2 id="network-title">Choose the channel that fits the moment.</h2>
      <div>
        {connectionChannels.map((channel) => (
          <article key={channel.key}>
            <ChannelMark label={channel.label} />
            <h3>{channel.label}</h3>
            <p>{channel.purpose}</p>
            {isPodcastAnalyticsTarget(channel.key) ? (
              <TrackedLink href={channel.href} eventName="podcast_platform_click" eventProperties={{ target: channel.key, placement: "home-network" }}>Open {channel.label}</TrackedLink>
            ) : isSocialAnalyticsTarget(channel.key) ? (
              <TrackedLink href={channel.href} eventName="social_click" eventProperties={{ target: channel.key, placement: "home-network" }}>Open {channel.label}</TrackedLink>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
