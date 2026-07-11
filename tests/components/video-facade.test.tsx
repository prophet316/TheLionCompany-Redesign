import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AnalyticsProvider } from "@/components/client/analytics-provider";
import { VideoFacade } from "@/components/client/video-facade";
import type { Teaching } from "@/lib/content/types";

vi.mock("next/image", () => ({
  default: function MockImage(props: { alt?: string; src: string }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={props.alt ?? ""} src={props.src} />;
  },
}));

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

describe("VideoFacade", () => {
  it("does not create an iframe before activation", async () => {
    render(
      <AnalyticsProvider enabled={false}>
        <VideoFacade teaching={teaching} placement="teaching-detail" />
      </AnalyticsProvider>,
    );
    expect(screen.queryByTitle(/unity video/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /play unity/i }));
    expect(screen.getByTitle(/unity video/i)).toHaveAttribute(
      "src",
      expect.stringContaining("youtube-nocookie.com"),
    );
  });
});
