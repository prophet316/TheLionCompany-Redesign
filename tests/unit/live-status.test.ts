import { describe, expect, it } from "vitest";
import { activeReplayAt, deriveLiveStatus, nextLiveBoundary } from "@/lib/live/status";

const schedule = {
  startsAt: "2026-07-11T18:00:00.000Z",
  endsAt: "2026-07-11T19:00:00.000Z",
  sourceTimeZone: "America/Chicago",
  verifiedAt: "2026-07-11",
  topic: "Unity through Christ",
  url: "https://www.tiktok.com/@thelioncompanytx",
} as const;

describe("live status boundaries", () => {
  it.each([
    ["2026-07-11T17:59:59.999Z", "next"],
    ["2026-07-11T18:00:00.000Z", "live"],
    ["2026-07-11T18:59:59.999Z", "live"],
    ["2026-07-11T19:00:00.000Z", "ended"],
    ["2026-07-11T19:15:00.000Z", "ended"],
    ["2026-07-11T19:15:00.001Z", "evergreen"],
  ])("maps %s to %s", (instant, expected) => {
    expect(deriveLiveStatus(schedule, Date.parse(instant)).kind).toBe(expected);
  });

  it("returns honest evergreen state for missing or invalid data", () => {
    expect(deriveLiveStatus(null, Date.now()).kind).toBe("evergreen");
    expect(
      deriveLiveStatus({ ...schedule, endsAt: schedule.startsAt }, Date.now()).kind,
    ).toBe("evergreen");
  });

  it("chooses the next transition boundary", () => {
    expect(nextLiveBoundary(schedule, Date.parse("2026-07-11T17:00:00Z"))).toBe(
      Date.parse(schedule.startsAt),
    );
    expect(nextLiveBoundary(schedule, Date.parse("2026-07-11T18:30:00Z"))).toBe(
      Date.parse(schedule.endsAt),
    );
  });

  it("preserves the named source timezone alongside the UTC transport instant", () => {
    expect(deriveLiveStatus(schedule, Date.parse("2026-07-11T17:00:00Z"))).toMatchObject({
      kind: "next",
      sourceTimeZone: "America/Chicago",
    });
  });

  it("includes a replay only inside its explicit publication window", () => {
    const replay = { title: "Replay", url: "https://www.tiktok.com/@thelioncompanytx/video/1", publishedAt: "2026-07-10T00:00:00Z", expiresAt: "2026-07-12T00:00:00Z" };
    expect(activeReplayAt(replay, Date.parse("2026-07-11T00:00:00Z"))).toEqual(replay);
    expect(activeReplayAt(replay, Date.parse(replay.expiresAt))).toBeNull();
  });
});
