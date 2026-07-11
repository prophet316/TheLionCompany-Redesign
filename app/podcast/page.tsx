import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { PodcastCard } from "@/components/server/podcast-card";
import { getDestination } from "@/lib/content";
import { getPublishedPodcastEpisodes } from "@/lib/media/podcast-feed";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, podcastSeriesSchema, webPageSchema } from "@/lib/seo/schema";

const description = "Listen to The Lion Company Podcast and explore faith-filled conversations about relationships, purpose, discipleship, and real life.";
export const metadata = createPageMetadata({ title: "Podcast", description, path: "/podcast" });
export default function PodcastPage() { const episodes = getPublishedPodcastEpisodes(); return <><JsonLd id="podcast-schema" data={[webPageSchema({ path: "/podcast", title: "Podcast", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Podcast", path: "/podcast" }]), podcastSeriesSchema()]} /><PageIntro eyebrow="Watch and listen" title="Raw conversations where faith meets real life."><p>Choose a verified platform or read the checked episode notes on this site.</p><div className="cluster"><a href={getDestination("applePodcasts").href}>Apple Podcasts</a><a href={getDestination("spotify").href}>Spotify</a><a href={getDestination("podbean").href}>Podbean</a><a href={getDestination("podcastRss").href}>RSS</a><a href={getDestination("youtube").href}>YouTube</a></div></PageIntro><section className="section shell" aria-label="Podcast episodes">{episodes.map((episode) => <PodcastCard key={episode.slug} episode={episode} />)}</section></>; }
