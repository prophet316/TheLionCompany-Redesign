import { notFound } from "next/navigation";
import { AudioPlayer } from "@/components/client/audio-player";
import { TrackedLink } from "@/components/client/tracked-link";
import { JsonLd } from "@/components/server/json-ld";
import { getDestination } from "@/lib/content";
import { getPublishedPodcastEpisodes } from "@/lib/media/podcast-feed";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, podcastEpisodeSchema, webPageSchema } from "@/lib/seo/schema";

export const dynamicParams = false;
export function generateStaticParams() {
  return getPublishedPodcastEpisodes().map((episode) => ({ slug: episode.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const episode = getPublishedPodcastEpisodes().find((item) => item.slug === slug);
  return episode
    ? createPageMetadata({ title: episode.title, description: episode.description, path: "/podcast/" + slug, image: episode.imageUrl ?? undefined })
    : {};
}

export default async function PodcastEpisodePage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const episode = getPublishedPodcastEpisodes().find((item) => item.slug === slug);
  if (!episode) notFound();
  return (
    <>
      <JsonLd id="podcast-episode-schema" data={[webPageSchema({ path: "/podcast/" + episode.slug, title: episode.title, description: episode.description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Podcast", path: "/podcast" }, { name: episode.title, path: "/podcast/" + episode.slug }]), podcastEpisodeSchema(episode)]} />
      <article className="container section">
        <p>Podcast episode</p>
        <h1>{episode.title}</h1>
        <time dateTime={episode.publishedAt}>
          {new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(episode.publishedAt))}
        </time>
        <p>{episode.description}</p>
        <AudioPlayer episode={episode} />
        <nav aria-label="Listen to this podcast">
          <TrackedLink href={episode.pageUrl} eventName="podcast_platform_click" eventProperties={{ target: "podbean", placement: "podcast-detail" }}>Open this episode on Podbean</TrackedLink>
          {(["applePodcasts", "spotify", "podcastRss", "youtube"] as const).map((key) => {
            const destination = getDestination(key);
            return <TrackedLink href={destination.href} eventName="podcast_platform_click" eventProperties={{ target: key, placement: "podcast-detail" }} key={key}>{destination.label}</TrackedLink>;
          })}
        </nav>
      </article>
    </>
  );
}
