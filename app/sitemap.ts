import type { MetadataRoute } from "next";
import { teachings } from "@/content/teachings";
import { indexableStaticRoutes } from "@/config/routes";
import type { PodcastEpisode } from "@/lib/content/types";
import { getPublishedPodcastEpisodes } from "@/lib/media/podcast-feed";
import { canonicalUrl } from "@/lib/seo/metadata";

export function createSitemap(episodes: readonly PodcastEpisode[]): MetadataRoute.Sitemap {
  return [
    ...indexableStaticRoutes.map((path) => ({ url: canonicalUrl(path) })),
    ...teachings.map((teaching) => ({ url: canonicalUrl(`/teachings/${teaching.slug}`) })),
    ...episodes.map((episode) => ({ url: canonicalUrl(`/podcast/${episode.slug}`) })),
  ];
}

export default function sitemap(): MetadataRoute.Sitemap {
  return createSitemap(getPublishedPodcastEpisodes());
}
