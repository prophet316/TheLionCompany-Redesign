import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { getDestination } from "@/lib/content";
import { getPublishedPodcastEpisodes } from "@/lib/media/podcast-feed";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, podcastEpisodeSchema, webPageSchema } from "@/lib/seo/schema";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return getPublishedPodcastEpisodes().map((episode) => ({ slug: episode.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { slug } = await params; const episode = getPublishedPodcastEpisodes().find((item) => item.slug === slug); if (!episode) return {}; return createPageMetadata({ title: episode.title, description: episode.description, path: `/podcast/${slug}` }); }
export default async function PodcastEpisodePage({ params }: Props) { const { slug } = await params; const episode = getPublishedPodcastEpisodes().find((item) => item.slug === slug); if (!episode) notFound(); return <><JsonLd id="podcast-episode-schema" data={[webPageSchema({ path: `/podcast/${slug}`, title: episode.title, description: episode.description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Podcast", path: "/podcast" }, { name: episode.title, path: `/podcast/${slug}` }]), podcastEpisodeSchema(episode)]} /><PageIntro eyebrow={episode.episodeNumber ? `Episode ${episode.episodeNumber}` : "Podcast episode"} title={episode.title}><p>{episode.description}</p><time dateTime={episode.publishedAt}>{new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(episode.publishedAt))}</time></PageIntro><section className="section shell"><h2>Listen on your preferred platform</h2><p>{episode.transcriptUrl ? <a href={episode.transcriptUrl}>Read the complete transcript</a> : "A complete transcript has not been verified, so the site does not embed an audio player."}</p><div className="cluster"><a className="button" href={episode.pageUrl}>Open this episode on Podbean</a><a href={getDestination("applePodcasts").href}>Apple Podcasts</a><a href={getDestination("spotify").href}>Spotify</a><a href={getDestination("podcastRss").href}>RSS</a><a href={getDestination("youtube").href}>YouTube</a><Link href="/podcast">All episodes</Link></div></section></>; }
