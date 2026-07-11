import Link from "next/link";
import type { PodcastEpisode } from "@/lib/content/types";

export function PodcastCard({ episode }: { episode: PodcastEpisode }) {
  return <article><p className="eyebrow">{episode.episodeNumber ? `Episode ${episode.episodeNumber}` : "Podcast episode"}</p><h2><Link href={`/podcast/${episode.slug}`}>{episode.title}</Link></h2><p>{episode.description}</p><time dateTime={episode.publishedAt}>{new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(episode.publishedAt))}</time></article>;
}
