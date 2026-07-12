import Link from "next/link";
import { GatheringLine } from "@/components/client/gathering-line";
import { NewsletterForm } from "@/components/client/forms/newsletter-form";
import { PrayerForm } from "@/components/client/forms/prayer-form";
import { ConnectionNetwork } from "@/components/server/home/connection-network";
import { FinalInvitation } from "@/components/server/home/final-invitation";
import { Hero } from "@/components/server/home/hero";
import { ParticipationPaths } from "@/components/server/home/participation-paths";
import { TopicFinder } from "@/components/server/home/topic-finder";
import { WatchListen } from "@/components/server/home/watch-listen";
import { JsonLd } from "@/components/server/json-ld";
import { destinationRegistry } from "@/content/destinations";
import { liveSchedule, recentReplay } from "@/content/live";
import { siteContent } from "@/content/site";
import { teachings } from "@/content/teachings";
import { topicDefinitions } from "@/content/topics";
import { activeReplayAt } from "@/lib/live/status";
import { getTeachingReviewBundle } from "@/lib/media/transcripts.server";
import { getPublishedPodcastEpisodes } from "@/lib/media/podcast-feed";
import { createPageMetadata } from "@/lib/seo/metadata";
import { organizationSchema, webPageSchema, websiteSchema } from "@/lib/seo/schema";
import styles from "@/components/server/home/home.module.css";

export const metadata = createPageMetadata({
  title: siteContent.homeTitle,
  description: siteContent.homeDescription,
  path: "/",
});

export default function HomePage() {
  const featuredBase = teachings.find((teaching) => teaching.featured) ?? teachings[0];
  if (!featuredBase) throw new Error("The homepage requires one validated teaching");
  const featured = getTeachingReviewBundle(featuredBase).teaching;
  const episodes = getPublishedPodcastEpisodes();
  const buildActiveReplay = activeReplayAt(recentReplay);
  return (
    <>
      <JsonLd id="home-identity" data={[organizationSchema(), websiteSchema(), webPageSchema({ path: "/", title: siteContent.homeTitle, description: siteContent.homeDescription })]} />
      <div id="home-journey" className={styles.journey}>
        <GatheringLine rootId="home-journey" />
      <Hero schedule={liveSchedule} replay={buildActiveReplay} />
      <ParticipationPaths />
      <section className={"section " + styles.manifesto} id="mission" aria-labelledby="manifesto-title" data-manifesto>
        <p className={styles.eyebrow}>Gathered around Jesus</p>
        <h2 id="manifesto-title">The life we practice together.</h2>
        <ol>
          <li data-reveal-mask><h3>Love is the beginning.</h3><p>We learn to look like Jesus by receiving and giving his love.</p></li>
          <li data-reveal-mask><h3>Relationship is the place.</h3><p>Formation happens among people who are willing to know and be known.</p></li>
          <li data-reveal-mask><h3>Discipleship is the way.</h3><p>We practice truth until it becomes a lived witness.</p></li>
          <li data-reveal-mask><h3>Education equips the work.</h3><p>Clear teaching helps the whole body grow toward unity.</p></li>
        </ol>
      </section>
      <div id="media">
        <TopicFinder topics={topicDefinitions} teachings={teachings} />
      </div>
      <div id="podcast">
        <WatchListen featured={featured} latestEpisode={episodes[0]} />
      </div>
      <section className={"section " + styles.prayer} id="prayer">
        <div><p className={styles.eyebrow}>Prayer</p><h2>You do not have to carry it alone.</h2><p>A restricted ministry prayer team receives your request. This form is not continuously monitored or an emergency service.</p><Link href="/prayer">Open the private prayer page</Link></div>
        <PrayerForm placement="home" />
      </section>
      <div id="contact">
        <ConnectionNetwork channels={destinationRegistry} />
      </div>
      <section className={"section " + styles.store} id="store">
        <div><p className={styles.eyebrow}>Wear the vision</p><h2>Carry a visible reminder of unity.</h2><p>Explore real Lion Company merchandise and the story behind it.</p></div>
        <Link href="/store">Visit the editorial store page</Link>
      </section>
      <section className={"section " + styles.newsletter} id="newsletter">
        <div><p className={styles.eyebrow}>Monthly field notes</p><h2>One thoughtful letter each month.</h2><p>Teaching, current live guidance, resources, podcast releases, and ministry updates. Confirmation is required.</p></div>
        <NewsletterForm placement="inline" />
      </section>
        <FinalInvitation />
      </div>
    </>
  );
}
