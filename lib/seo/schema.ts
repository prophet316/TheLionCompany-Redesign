import { activeSameAs } from "@/content/destinations";
import { siteContent } from "@/content/site";
import { getDestination, isTeachingEmbeddable } from "@/lib/content";
import type { PodcastEpisode, Teaching } from "@/lib/content/types";
import { canonicalUrl } from "./metadata";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteContent.canonicalOrigin}/#organization`,
    name: siteContent.name,
    url: `${siteContent.canonicalOrigin}/`,
    description: siteContent.homeDescription,
    areaServed: "Worldwide",
    sameAs: activeSameAs,
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteContent.canonicalOrigin}/#website`,
    name: siteContent.name,
    url: `${siteContent.canonicalOrigin}/`,
    publisher: { "@id": `${siteContent.canonicalOrigin}/#organization` },
    inLanguage: "en-US",
  };
}

export function webPageSchema(input: { path: string; title: string; description: string }) {
  const url = canonicalUrl(input.path);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: input.title,
    description: input.description,
    isPartOf: { "@id": `${siteContent.canonicalOrigin}/#website` },
    about: { "@id": `${siteContent.canonicalOrigin}/#organization` },
    inLanguage: "en-US",
  };
}

export function breadcrumbSchema(items: readonly { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}

export function videoSchema(teaching: Teaching) {
  if (!isTeachingEmbeddable(teaching) || !teaching.publishedAt) return null;
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: teaching.title,
    description: teaching.summary,
    uploadDate: teaching.publishedAt,
    thumbnailUrl: canonicalUrl(teaching.posterPath),
    contentUrl: `https://www.youtube.com/watch?v=${teaching.youtubeId}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${teaching.youtubeId}`,
    accessibilityFeature: ["captions", "transcript"],
  };
}

export function podcastSeriesSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "PodcastSeries",
    "@id": `${siteContent.canonicalOrigin}/podcast#series`,
    name: "The Lion Company Podcast",
    description: "Raw, faith-filled conversations about relationships, purpose, discipleship, and following Jesus in real life.",
    url: canonicalUrl("/podcast"),
    webFeed: getDestination("podcastRss").href,
    sameAs: [getDestination("applePodcasts").href, getDestination("spotify").href, getDestination("podbean").href],
  };
}

export function podcastEpisodeSchema(episode: PodcastEpisode) {
  return {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: episode.title,
    description: episode.description,
    datePublished: episode.publishedAt,
    url: canonicalUrl(`/podcast/${episode.slug}`),
    partOfSeries: { "@id": `${siteContent.canonicalOrigin}/podcast#series` },
    ...(episode.episodeNumber ? { episodeNumber: episode.episodeNumber } : {}),
  };
}
