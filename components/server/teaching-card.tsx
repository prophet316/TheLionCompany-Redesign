import Image from "next/image";
import Link from "next/link";
import type { Teaching } from "@/lib/content/types";
import styles from "./teaching-card.module.css";

export function TeachingCard({ teaching }: { readonly teaching: Teaching }) {
  return (
    <article className={styles.card}>
      <div className={styles.image} aria-hidden="true">
        <Image
          src={teaching.posterPath}
          alt=""
          fill
          sizes="(max-width: 38rem) 100vw, (max-width: 58rem) 50vw, 33vw"
        />
      </div>
      <div className={styles.body}>
        {teaching.publishedAt ? (
          <p><time dateTime={teaching.publishedAt}>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(teaching.publishedAt))}</time></p>
        ) : (
          <p>Archive teaching</p>
        )}
        <h3><Link href={"/teachings/" + teaching.slug}>{teaching.title}</Link></h3>
        <p>{teaching.summary}</p>
      </div>
    </article>
  );
}
