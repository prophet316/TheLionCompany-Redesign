import { describe, expect, it } from "vitest";
import {
  canEmbedTeaching,
  canPlayPodcast,
  youtubeEmbedUrl,
} from "@/lib/media/eligibility";
import type { PodcastEpisode, Teaching } from "@/lib/content/types";

const teaching: Teaching = {
  slug: "unity",
  title: "Unity",
  summary: "A teaching about unity.",
  youtubeId: "abcdefghijk",
  posterPath: "/images/teachings/unity.jpg",
  publishedAt: "2026-07-01T00:00:00Z",
  topics: ["church-reform-and-unity"],
  series: null,
  captionsVerified: true,
  transcriptUrl: "https://www.thelioncompany.org/teachings/unity#transcript",
  featured: true,
};

describe("media eligibility", () => {
  it("requires both verified captions and a transcript for video", () => {
    expect(canEmbedTeaching(teaching)).toBe(true);
    expect(canEmbedTeaching({ ...teaching, captionsVerified: false })).toBe(false);
    expect(canEmbedTeaching({ ...teaching, transcriptUrl: null })).toBe(false);
    expect(canEmbedTeaching({ ...teaching, transcriptUrl: "https://www.youtube.com/watch?v=abcdefghijk" })).toBe(false);
  });

  it("requires audio and a transcript for podcast playback", () => {
    const episode: PodcastEpisode = {
      slug: "episode",
      title: "Episode",
      description: "Description",
      publishedAt: "2026-07-01T00:00:00Z",
      durationSeconds: null,
      pageUrl: "https://thelioncompany.podbean.com/e/episode",
      audioUrl: "https://www.thelioncompany.org/media/episode.mp3",
      imageUrl: null,
      episodeNumber: null,
      transcriptUrl: "https://example.com/transcript",
    };
    expect(canPlayPodcast(episode)).toBe(true);
    expect(canPlayPodcast({ ...episode, transcriptUrl: null })).toBe(false);
    expect(canPlayPodcast({ ...episode, audioUrl: "https://mcdn.podbean.com/episode.mp3" })).toBe(false);
  });

  it("uses the privacy-enhanced YouTube host", () => {
    expect(youtubeEmbedUrl("abcdefghijk")).toBe(
      "https://www.youtube-nocookie.com/embed/abcdefghijk?autoplay=1&rel=0",
    );
  });
});
