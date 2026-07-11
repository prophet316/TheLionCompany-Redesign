"use client";

import { useEffect, useState } from "react";
import type { LiveSchedule, RecentReplay } from "@/lib/content/types";
import { activeReplayAt, deriveLiveStatus, nextLiveBoundary } from "@/lib/live/status";
import { TrackedLink } from "./tracked-link";
import styles from "./live-status.module.css";

export function LiveStatus({
  schedule,
  replay,
  placement,
}: {
  readonly schedule: LiveSchedule | null;
  readonly replay: RecentReplay | null;
  readonly placement: "hero" | "live-page";
}) {
  const [now, setNow] = useState<number | null>(null);
  const state = now === null
    ? { kind: "evergreen" as const, label: "Live daily on TikTok" as const }
    : deriveLiveStatus(schedule, now);
  const destination = schedule?.url ?? "https://www.tiktok.com/@thelioncompanytx";
  const activeReplay = now === null ? replay : activeReplayAt(replay, now);

  useEffect(() => {
    let boundaryTimer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      const current = Date.now();
      setNow(current);
      const boundary = nextLiveBoundary(schedule, current);
      if (boundary) {
        boundaryTimer = setTimeout(update, Math.min(boundary - current, 2_147_000_000));
      }
    };
    update();
    const minute = setInterval(update, 60_000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") update();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", update);
    return () => {
      clearInterval(minute);
      if (boundaryTimer) clearTimeout(boundaryTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", update);
    };
  }, [schedule]);

  return (
    <section className={styles.status} aria-label="Daily TikTok teaching">
      <p className={styles.label} data-state={state.kind}>{state.label}</p>
      {state.kind === "next" ? (
        <p>
          <time dateTime={state.startsAt}>
            {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
              new Date(state.startsAt),
            )}
          </time>
          <span> · Source time ({state.sourceTimeZone}): {new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: state.sourceTimeZone, timeZoneName: "short" }).format(new Date(state.startsAt))}</span>
        </p>
      ) : null}
      {"topic" in state && state.topic ? <p>{state.topic}</p> : null}
      <TrackedLink
        href={destination}
        eventName="tiktok_live_click"
        eventProperties={{ state: state.kind, placement }}
      >
        {state.kind === "live" ? "Join live on TikTok" : "See today’s live on TikTok"}
      </TrackedLink>
      {activeReplay ? (
        <a href={activeReplay.url}>Watch recent replay: {activeReplay.title}</a>
      ) : null}
    </section>
  );
}
