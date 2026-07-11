import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnalyticsProvider } from "@/components/client/analytics-provider";
import HomePage from "@/app/page";

vi.mock("next/image", () => ({
  default: function MockImage(props: { alt?: string; src: string }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={props.alt ?? ""} src={typeof props.src === "string" ? props.src : ""} />;
  },
}));

vi.mock("@/lib/media/podcast-feed", () => ({
  getPublishedPodcastEpisodes: () => [{
    slug: "formed",
    title: "Formed in love",
    description: "An episode about formation.",
    publishedAt: "2026-07-01T00:00:00Z",
    durationSeconds: 1800,
    audioUrl: "https://cdn.example.com/formed.mp3",
    pageUrl: "https://thelioncompany.podbean.com/e/formed",
    imageUrl: null,
    episodeNumber: 8,
    transcriptUrl: null,
  }],
}));

vi.mock("@/lib/forms/public-config", () => ({
  publicFormConfig: { turnstileSiteKey: "test-site-key", deliveryMode: "no-send" },
}));

vi.mock("@marsidev/react-turnstile", () => ({
  Turnstile: () => <div data-testid="turnstile-stub" />,
}));

describe("homepage journey", () => {
  afterEach(() => cleanup());

  it("renders the entire Seen, Gathered, Formed, Sent hierarchy without motion", async () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent() { return false; },
        onchange: null,
      }),
    });
    render(<AnalyticsProvider enabled={false}><HomePage /></AnalyticsProvider>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/whatever doesn't cause you/i);
    expect(screen.getByRole("heading", { name: /what are you carrying today/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /love is the beginning/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /submit a prayer request/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /support the mission/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /watch directly on youtube/i })).toBeVisible();
    expect(document.querySelector("iframe")).toBeNull();
  });
});
