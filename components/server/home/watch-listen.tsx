import Link from "next/link";
import { VideoFacade } from "@/components/client/video-facade";
import type { PodcastEpisode, Teaching } from "@/lib/content/types";
import { getDestination } from "@/lib/content";
import styles from "./home.module.css";

export function WatchListen({ featured, latestEpisode }: { readonly featured: Teaching; readonly latestEpisode?: PodcastEpisode }) {
  return (
    <section className={"section " + styles.watchListen} id="podcast" aria-labelledby="watch-listen-title" data-gathering-stage="waveform">
      <header><p className={styles.eyebrow}>Watch and listen</p><h2 id="watch-listen-title">Formation beyond the moment.</h2></header>
      <div className={styles.mediaGrid}>
        <article>
          <VideoFacade teaching={featured} placement="home" />
          <h3>{featured.title}</h3>
          <p>{featured.summary}</p>
          <Link href={"/teachings/" + featured.slug}>Open teaching and transcript</Link>
        </article>
        <article className={styles.podcastFeature}>
          <p>Latest podcast</p>
          <h3>{latestEpisode?.title ?? "The Lion Company Podcast"}</h3>
          <p>{latestEpisode?.description ?? "Listen to Jesus-centered conversations and teaching."}</p>
          <Link href={latestEpisode ? "/podcast/" + latestEpisode.slug : "/podcast"}>Listen to the podcast</Link>
        </article>
      </div>
      <p><a href={getDestination("youtube").href}>Explore hundreds of teachings on YouTube</a></p>
    </section>
  );
}
