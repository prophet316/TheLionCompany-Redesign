import { cleanup, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnalyticsProvider } from "@/components/client/analytics-provider";
import { LiveStatus } from "@/components/client/live-status";

const schedule = {
  startsAt: "2026-07-11T18:00:00.000Z",
  endsAt: "2026-07-11T19:00:00.000Z",
  sourceTimeZone: "America/Chicago",
  verifiedAt: "2026-07-11",
  topic: "Unity through Christ",
  url: "https://www.tiktok.com/@thelioncompanytx",
} as const;

function renderLiveStatus(ui: ReactElement) {
  return render(<AnalyticsProvider enabled={false}>{ui}</AnalyticsProvider>);
}

describe("LiveStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("server-renders the evergreen truth before hydration", () => {
    vi.setSystemTime(new Date("2026-07-11T17:00:00Z"));
    renderLiveStatus(<LiveStatus schedule={null} replay={null} placement="hero" />);
    expect(screen.getByText("Live daily on TikTok")).toBeVisible();
    expect(screen.queryByText("Live now")).not.toBeInTheDocument();
  });

  it("server-renders an already build-validated replay for no-JavaScript visitors", () => {
    renderLiveStatus(<LiveStatus schedule={null} replay={{ title: "Recent teaching", url: "https://www.tiktok.com/@thelioncompanytx/video/1", publishedAt: "2026-07-10T00:00:00Z", expiresAt: "2026-07-12T00:00:00Z" }} placement="hero" />);
    expect(screen.getByRole("link", { name: /watch recent replay: recent teaching/i })).toBeVisible();
  });

  it("keeps an active replay visible while a verified next or live state is shown", async () => {
    vi.setSystemTime(new Date("2026-07-11T17:00:00Z"));
    renderLiveStatus(<LiveStatus schedule={schedule} replay={{ title: "Recent teaching", url: "https://www.tiktok.com/@thelioncompanytx/video/1", publishedAt: "2026-07-10T00:00:00Z", expiresAt: "2026-07-12T00:00:00Z" }} placement="hero" />);
    expect(await screen.findByText("Next live")).toBeVisible();
    expect(screen.getByRole("link", { name: /watch recent replay: recent teaching/i })).toBeVisible();
  });
});
