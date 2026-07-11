import { siteContent } from "@/content/site";
import type { PodcastEpisode, Teaching } from "@/lib/content/types";

export function canEmbedTeaching(
  teaching: Teaching,
): teaching is Teaching & { captionsVerified: true; transcriptUrl: string } {
  return teaching.captionsVerified && Boolean(teaching.transcriptUrl) && new URL(teaching.transcriptUrl!).origin === siteContent.canonicalOrigin;
}

export function canPlayPodcast(
  episode: PodcastEpisode,
): episode is PodcastEpisode & { transcriptUrl: string } {
  return Boolean(episode.transcriptUrl) && new URL(episode.audioUrl).origin === siteContent.canonicalOrigin;
}

export function youtubeEmbedUrl(id: string) {
  return (
    "https://www.youtube-nocookie.com/embed/" +
    encodeURIComponent(id) +
    "?autoplay=1&rel=0"
  );
}
