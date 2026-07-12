import Link from "next/link";
import type { Teaching, TopicDefinition } from "@/lib/content/types";
import styles from "./home.module.css";

export function TopicFinder({ topics, teachings }: { readonly topics: readonly TopicDefinition[]; readonly teachings: readonly Teaching[] }) {
  const available = topics.filter((topic) => teachings.some((item) => item.topics.includes(topic.slug)));
  return (
    <section className={"section " + styles.topics} aria-labelledby="topic-finder-title">
      <p className={styles.eyebrow}>Find a path</p>
      <h2 id="topic-finder-title">What are you carrying today?</h2>
      <div>
        {available.map((topic) => (
          <Link href={"/teachings?topic=" + topic.slug} key={topic.slug}>
            <span>{topic.prompt}</span><strong>{topic.label}</strong>
          </Link>
        ))}
      </div>
    </section>
  );
}
