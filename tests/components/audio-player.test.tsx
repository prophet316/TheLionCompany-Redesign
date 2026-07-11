import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AudioPlayer } from "@/components/client/audio-player";

const episode = {
  slug: "formed",
  title: "Formed in love",
  description: "An episode about love.",
  publishedAt: "2026-07-01T00:00:00Z",
  durationSeconds: 1800,
  pageUrl: "https://thelioncompany.podbean.com/e/formed",
  audioUrl: "https://www.thelioncompany.org/media/formed.mp3",
  imageUrl: null,
  episodeNumber: 8,
  transcriptUrl: "https://example.com/formed-transcript",
} as const;

describe("AudioPlayer", () => {
  it("uses preload none only when a complete transcript exists", () => {
    const { rerender } = render(<AudioPlayer episode={episode} />);
    expect(screen.getByLabelText(/listen to formed in love/i)).toHaveAttribute("preload", "none");
    rerender(<AudioPlayer episode={{ ...episode, transcriptUrl: null }} />);
    expect(screen.queryByLabelText(/listen to/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /listen on podbean/i })).toBeVisible();
  });
});
