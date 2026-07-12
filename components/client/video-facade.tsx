"use client";

import Image from "next/image";
import { useState } from "react";
import type { Teaching } from "@/lib/content/types";
import {
  canEmbedTeaching,
  youtubeEmbedUrl,
} from "@/lib/media/eligibility";
import { useAnalytics } from "./analytics-provider";
import styles from "./video-facade.module.css";

export function VideoFacade({
  teaching,
  placement,
}: {
  readonly teaching: Teaching;
  readonly placement: "home" | "teaching-detail";
}) {
  const [playing, setPlaying] = useState(false);
  const analytics = useAnalytics();
  const eligible = canEmbedTeaching(teaching);

  if (!eligible) {
    return (
      <div className={styles.unavailable}>
        <p>This teaching opens on YouTube while its complete text alternative is prepared.</p>
        <a href={"https://www.youtube.com/watch?v=" + teaching.youtubeId}>Watch directly on YouTube</a>
      </div>
    );
  }

  if (playing) {
    return (
      <div className={styles.frame}>
        <iframe
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          src={youtubeEmbedUrl(teaching.youtubeId)}
          title={teaching.title + " video"}
        />
      </div>
    );
  }

  return (
    <button
      className={styles.facade}
      type="button"
      aria-label={"Play " + teaching.title}
      onClick={() => {
        setPlaying(true);
        analytics.track("video_start", { placement });
      }}
    >
      <Image
        src={teaching.posterPath}
        alt=""
        fill
        sizes={placement === "home" ? "(max-width: 64rem) 100vw, 66vw" : "(max-width: 64rem) 100vw, 72rem"}
      />
      <span aria-hidden="true">Play</span>
    </button>
  );
}
