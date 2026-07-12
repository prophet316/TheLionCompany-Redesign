"use client";

import type { PodcastEpisode } from "@/lib/content/types";
import { canPlayPodcast } from "@/lib/media/eligibility";

export function AudioPlayer({ episode }: { readonly episode: PodcastEpisode }) {
  if (!canPlayPodcast(episode)) {
    return <p><a href={episode.pageUrl}>Listen on Podbean</a></p>;
  }
  return (
    <div>
      <audio aria-label={"Listen to " + episode.title} controls preload="none" src={episode.audioUrl}>
        <a href={episode.audioUrl}>Download the episode audio</a>
      </audio>
      <p><a href={episode.transcriptUrl}>Read the complete transcript</a></p>
    </div>
  );
}
