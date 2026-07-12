import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AnalyticsProvider } from "@/components/client/analytics-provider";
import PodcastPage from "@/app/podcast/page";

vi.mock("@/lib/media/podcast-feed", () => ({
  getPublishedPodcastEpisodes: () => [{
    slug: "formed",
    title: "Formed in love",
    description: "An episode about love.",
    publishedAt: "2026-07-01T00:00:00Z",
    durationSeconds: 1800,
    audioUrl: "https://cdn.example.com/formed.mp3",
    pageUrl: "https://thelioncompany.podbean.com/e/formed",
    imageUrl: null,
    episodeNumber: 8,
    transcriptUrl: null,
  }],
}));

describe("podcast routes", () => {
  it("renders crawlable episode links from the validated adapter", async () => {
    render(<AnalyticsProvider enabled={false}><PodcastPage /></AnalyticsProvider>);
    expect(screen.getByRole("link", { name: /formed in love/i })).toHaveAttribute("href", "/podcast/formed");
  });
});
