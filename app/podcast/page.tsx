import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { PodcastCard } from "@/components/server/podcast-card";
import { TrackedLink } from "@/components/client/tracked-link";
import { getDestination } from "@/lib/content";
import { getPublishedPodcastEpisodes } from "@/lib/media/podcast-feed";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, podcastSeriesSchema, webPageSchema } from "@/lib/seo/schema";

const description = "Listen to The Lion Company Podcast on your preferred platform.";

export const metadata = createPageMetadata({
  title: "Podcast",
  description,
  path: "/podcast",
});

export default function PodcastPage() {
  const episodes = getPublishedPodcastEpisodes();
  const platforms = ["applePodcasts", "spotify", "podbean", "podcastRss", "youtube"] as const;
  return (
    <>
      <JsonLd id="podcast-schema" data={[webPageSchema({ path: "/podcast", title: "Podcast", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Podcast", path: "/podcast" }]), podcastSeriesSchema()]} />
      <PageIntro eyebrow="Listen" title="Formation for the road." description="Jesus-centered conversations and teachings, available wherever you listen." />
      <nav className="container" aria-label="Podcast platforms">
        {platforms.map((key) => {
          const destination = getDestination(key);
          return (
            <TrackedLink href={destination.href} key={key} eventName="podcast_platform_click" eventProperties={{ target: key, placement: "podcast-index" }}>
              {destination.label}
            </TrackedLink>
          );
        })}
      </nav>
      <section className="container section" aria-labelledby="podcast-episodes">
        <h2 id="podcast-episodes">Episodes</h2>
        {episodes.map((episode) => <PodcastCard episode={episode} key={episode.slug} />)}
      </section>
    </>
  );
}
