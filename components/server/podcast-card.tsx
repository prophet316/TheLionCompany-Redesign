import Link from "next/link";
import type { PodcastEpisode } from "@/lib/content/types";
import styles from "./podcast-card.module.css";

export function PodcastCard({ episode }: { readonly episode: PodcastEpisode }) {
  return (
    <article className={styles.card}>
      <p>
        {episode.episodeNumber ? "Episode " + episode.episodeNumber + " · " : ""}
        <time dateTime={episode.publishedAt}>
          {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(episode.publishedAt))}
        </time>
      </p>
      <h2><Link href={"/podcast/" + episode.slug}>{episode.title}</Link></h2>
      <p>{episode.description}</p>
    </article>
  );
}
