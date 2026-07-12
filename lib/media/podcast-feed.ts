import { XMLParser } from "fast-xml-parser";
import { podcastFallback } from "@/content/podcast-fallback";
import { destinationRegistry } from "@/content/destinations";
import { podcastEpisodeSchema } from "@/lib/content/schemas";
import type { PodcastEpisode } from "@/lib/content/types";

const RSS_URL = destinationRegistry.find((item) => item.key === "podcastRss")!.href;
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "", processEntities: true, trimValues: true });

function text(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object" && "#text" in value) return String((value as { "#text": unknown })["#text"]);
  return "";
}

function stripMarkup(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseDuration(value: unknown): number | null {
  const raw = text(value);
  if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(raw)) {
    const parts = raw.split(":").map(Number);
    return parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
  }
  const seconds = Number.parseInt(raw, 10);
  return Number.isInteger(seconds) && seconds >= 300 && seconds <= 14_400 ? seconds : null;
}

export function parsePodcastFeed(xml: string): PodcastEpisode[] {
  const parsed = parser.parse(xml) as { rss?: { channel?: { item?: unknown | unknown[] } } };
  const rawItems = parsed.rss?.channel?.item;
  const items = rawItems ? (Array.isArray(rawItems) ? rawItems : [rawItems]) : [];
  const episodes = items.flatMap((raw) => {
    const item = raw as Record<string, unknown>;
    const enclosure = item.enclosure as Record<string, unknown> | undefined;
    const image = item["itunes:image"] as Record<string, unknown> | undefined;
    const title = text(item.title);
    const published = new Date(text(item.pubDate));
    const candidate = {
      slug: slugify(title),
      title,
      description: stripMarkup(text(item["itunes:summary"] ?? item.description)),
      publishedAt: Number.isNaN(published.valueOf()) ? "" : published.toISOString(),
      durationSeconds: parseDuration(item["itunes:duration"]),
      audioUrl: text(enclosure?.url),
      pageUrl: text(item.link),
      imageUrl: text(image?.href) || null,
      episodeNumber: Number.parseInt(text(item["itunes:episode"]), 10) || null,
      transcriptUrl: null,
    };
    const result = podcastEpisodeSchema.safeParse(candidate);
    return result.success ? [result.data] : [];
  });
  const unique = new Map(episodes.map((episode) => [episode.slug, episode]));
  return [...unique.values()].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

export function getPublishedPodcastEpisodes(): readonly PodcastEpisode[] {
  return podcastFallback;
}

export async function fetchPodcastFeedForRefresh(fetcher: typeof fetch = fetch): Promise<readonly PodcastEpisode[]> {
  const response = await fetcher(RSS_URL, {
    headers: { accept: "application/rss+xml, application/xml;q=0.9" },
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error(`Podbean RSS refresh failed with ${response.status}`);
  const episodes = parsePodcastFeed(await response.text());
  if (episodes.length === 0) throw new Error("Podbean RSS refresh failed validation");
  return episodes;
}
