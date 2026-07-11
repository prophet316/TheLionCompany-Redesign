import { existsSync, readFileSync } from "node:fs";
import { teachings } from "@/content/teachings";
import { podcastFallback } from "@/content/podcast-fallback";
import { getTeachingBySlug, getTeachingSlugs, isTeachingEmbeddable } from "@/lib/content";
import { fetchPodcastFeedForRefresh, getPublishedPodcastEpisodes, parsePodcastFeed } from "@/lib/media/podcast-feed";
import { getTeachingReviewBundle } from "@/lib/media/transcripts.server";
import { describe, expect, it, vi } from "vitest";

describe("curated teaching manifest", () => {
  it("contains the 32 unique production videos and every visitor topic", () => {
    expect(teachings).toHaveLength(32);
    expect(new Set(teachings.map((item) => item.youtubeId)).size).toBe(32);
    expect(new Set(teachings.flatMap((item) => item.topics)).size).toBe(6);
    expect(getTeachingSlugs()).toHaveLength(32);
    expect(getTeachingBySlug("heart-over-hammer")?.youtubeId).toBe("zP4ZiKek3Lg");
  });

  it("enables no manifest seed and exactly one hash-bound, fully reviewed text alternative", () => {
    expect(teachings.filter(isTeachingEmbeddable)).toHaveLength(0);
    const base = getTeachingBySlug("when-gods-will-doesnt-go-your-way")!;
    const reviewed = getTeachingReviewBundle(base);
    expect(isTeachingEmbeddable(reviewed.teaching)).toBe(true);
    expect(reviewed.transcript?.trim().split(/\s+/).length).toBeGreaterThan(1_000);
    expect(reviewed.evidence).toMatchObject({
      youtubeId: "TOj6tefx3rI",
      sourceWatchUrl: "https://www.youtube.com/watch?v=TOj6tefx3rI",
      sourceDurationSeconds: 2223,
      reviewMethod: "complete-listen-through",
      decision: "approved-complete-text-alternative",
    });
    expect(reviewed.evidence?.reviewer.trim().length).toBeGreaterThan(1);
  });

  it("ships one first-party ledgered poster for every teaching", () => {
    for (const teaching of teachings) {
      expect(existsSync(`public${teaching.posterPath}`), teaching.posterPath).toBe(true);
    }
  });
});

describe("Podbean content", () => {
  const fixture = readFileSync("tests/fixtures/podbean-feed.xml", "utf8");

  it("normalizes RSS items and rejects implausible numeric durations", () => {
    const episodes = parsePodcastFeed(fixture);
    expect(episodes).toHaveLength(2);
    expect(episodes[0]).toMatchObject({ slug: "when-gods-will-doesnt-go-your-way", durationSeconds: 2222, episodeNumber: 7 });
    expect(episodes[1].durationSeconds).toBeNull();
  });

  it("uses only the checked-in snapshot for public rendering", () => {
    expect(getPublishedPodcastEpisodes()).toEqual(podcastFallback);
  });

  it("fails a maintainer refresh without mutating the published snapshot", async () => {
    const fetcher = vi.fn(async () => new Response("down", { status: 503 }));
    await expect(fetchPodcastFeedForRefresh(fetcher as unknown as typeof fetch)).rejects.toThrow(/Podbean RSS refresh failed/);
    expect(getPublishedPodcastEpisodes()).toEqual(podcastFallback);
  });
});
