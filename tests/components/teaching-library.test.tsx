import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TeachingLibrary } from "@/components/client/teaching-library";
import type { Teaching, TopicDefinition } from "@/lib/content/types";

vi.mock("next/image", () => ({
  default: function MockImage(props: { alt?: string; src: string }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={props.alt ?? ""} src={props.src} />;
  },
}));

const topics: readonly TopicDefinition[] = [
  { slug: "fear-and-trust", label: "Fear and trust", prompt: "I need courage", description: "Trust Jesus." },
  { slug: "church-reform-and-unity", label: "Church reform and unity", prompt: "I want unity", description: "Become one." },
];
const teachings: readonly Teaching[] = [
  { slug: "peace", title: "Peace in fear", summary: "Trust in fear", youtubeId: "abcdefghijk", posterPath: "/images/teachings/peace.jpg", publishedAt: "2026-07-01T00:00:00Z", topics: ["fear-and-trust"], series: null, captionsVerified: true, transcriptUrl: "https://example.com", featured: true },
  { slug: "one-body", title: "One body", summary: "Unity in Christ", youtubeId: "lmnopqrstuv", posterPath: "/images/teachings/one-body.jpg", publishedAt: null, topics: ["church-reform-and-unity"], series: null, captionsVerified: false, transcriptUrl: null, featured: false },
];

describe("TeachingLibrary", () => {
  beforeEach(() => window.history.replaceState({}, "", "/teachings"));
  afterEach(() => cleanup());

  it("combines text and topic filters with a visible result count", async () => {
    render(<TeachingLibrary teachings={teachings} topics={topics} />);
    await userEvent.type(screen.getByRole("searchbox"), "peace");
    expect(screen.getByRole("status")).toHaveTextContent("1 teaching");
    expect(screen.getByRole("link", { name: /peace in fear/i })).toBeVisible();
    expect(screen.queryByRole("link", { name: /one body/i })).not.toBeInTheDocument();
  });

  it("hydrates a validated topic deep link without making the route dynamic", async () => {
    window.history.replaceState({}, "", "/teachings?topic=church-reform-and-unity");
    render(<TeachingLibrary teachings={teachings} topics={topics} />);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("1 teaching"));
    expect(screen.getByRole("link", { name: /one body/i })).toBeVisible();
    expect(screen.queryByRole("link", { name: /peace in fear/i })).not.toBeInTheDocument();
  });
});
