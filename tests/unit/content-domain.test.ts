import { destinationRegistry, activeSameAs } from "@/content/destinations";
import { liveSchedule, recentReplay } from "@/content/live";
import { siteContent } from "@/content/site";
import { topicDefinitions } from "@/content/topics";
import { liveScheduleSchema } from "@/lib/content/schemas";
import { validateContentBundle } from "@/lib/content";
import { describe, expect, it } from "vitest";

describe("content domain", () => {
  it("validates centralized site, destination, and topic content", () => {
    expect(validateContentBundle({
      site: siteContent,
      destinations: destinationRegistry,
      topics: topicDefinitions,
      teachings: [],
      live: liveSchedule,
      replay: recentReplay,
    })).toBe(true);
  });

  it("preserves required audited destinations and active identity URLs", () => {
    expect(destinationRegistry.find((item) => item.key === "tiktok")?.href)
      .toBe("https://www.tiktok.com/@thelioncompanytx");
    expect(destinationRegistry.find((item) => item.key === "instagram")?.href)
      .toBe("https://www.instagram.com/thelioncompanyglobal/");
    expect(activeSameAs).toContain("https://www.youtube.com/@TheLionCompany");
    expect(activeSameAs).not.toContain("https://feed.podbean.com/thelioncompany/feed.xml");
  });

  it("uses the honest evergreen live state until an event is verified", () => {
    expect(liveSchedule).toBeNull();
    expect(recentReplay).toBeNull();
  });

  it("rejects a live interval longer than eight hours", () => {
    expect(() => liveScheduleSchema.parse({
      startsAt: "2026-07-11T12:00:00Z",
      endsAt: "2026-07-11T21:00:01Z",
      sourceTimeZone: "America/Chicago",
      verifiedAt: "2026-07-11",
      topic: "Prayer",
      url: "https://www.tiktok.com/@thelioncompanytx",
    })).toThrow(/eight hours/);
  });
});
