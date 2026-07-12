import type { LiveSchedule, RecentReplay } from "@/lib/content/types";

export type LiveState =
  | { readonly kind: "evergreen"; readonly label: "Live daily on TikTok" }
  | { readonly kind: "next"; readonly label: "Next live"; readonly startsAt: string; readonly sourceTimeZone: string; readonly topic?: string }
  | { readonly kind: "live"; readonly label: "Live now"; readonly topic?: string }
  | { readonly kind: "ended"; readonly label: "Today’s live has ended" };

const GRACE_MS = 15 * 60 * 1000;
const MAX_EVENT_MS = 8 * 60 * 60 * 1000;

function instants(schedule: LiveSchedule) {
  const start = Date.parse(schedule.startsAt);
  const end = Date.parse(schedule.endsAt);
  const valid =
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    end > start &&
    end - start <= MAX_EVENT_MS;
  return { start, end, valid };
}

export function deriveLiveStatus(
  schedule: LiveSchedule | null,
  now = Date.now(),
): LiveState {
  if (!schedule) return { kind: "evergreen", label: "Live daily on TikTok" };
  const { start, end, valid } = instants(schedule);
  if (!valid || now > end + GRACE_MS) {
    return { kind: "evergreen", label: "Live daily on TikTok" };
  }
  if (now < start) {
    return { kind: "next", label: "Next live", startsAt: schedule.startsAt, sourceTimeZone: schedule.sourceTimeZone, topic: schedule.topic };
  }
  if (now < end) return { kind: "live", label: "Live now", topic: schedule.topic };
  return { kind: "ended", label: "Today’s live has ended" };
}

export function nextLiveBoundary(schedule: LiveSchedule | null, now = Date.now()) {
  if (!schedule) return null;
  const { start, end, valid } = instants(schedule);
  if (!valid) return null;
  if (now < start) return start;
  if (now < end) return end;
  if (now <= end + GRACE_MS) return end + GRACE_MS + 1;
  return null;
}

export function activeReplayAt(replay: RecentReplay | null, now = Date.now()) {
  if (!replay) return null;
  const published = Date.parse(replay.publishedAt);
  const expires = Date.parse(replay.expiresAt);
  return Number.isFinite(published) && Number.isFinite(expires) && published <= now && now < expires
    ? replay
    : null;
}
