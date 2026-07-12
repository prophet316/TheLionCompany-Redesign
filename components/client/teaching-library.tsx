"use client";

import { useEffect, useMemo, useState } from "react";
import type { Teaching, TopicDefinition, TopicSlug } from "@/lib/content/types";
import { TeachingCard } from "@/components/server/teaching-card";
import styles from "./teaching-library.module.css";

export function TeachingLibrary({
  teachings,
  topics,
}: {
  readonly teachings: readonly Teaching[];
  readonly topics: readonly TopicDefinition[];
}) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<TopicSlug | "all">("all");
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("topic");
    if (requested && topics.some((candidate) => candidate.slug === requested)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate validated deep-link query once
      setTopic(requested as TopicSlug);
    }
  }, [topics]);
  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return teachings.filter((teaching) => {
      const topicMatch = topic === "all" || teaching.topics.includes(topic);
      const text = (teaching.title + " " + teaching.summary).toLocaleLowerCase();
      return topicMatch && (!normalized || text.includes(normalized));
    });
  }, [query, teachings, topic]);

  return (
    <section className={styles.library} aria-labelledby="teaching-library-title">
      <h2 className="sr-only" id="teaching-library-title">Teaching library</h2>
      <div className={styles.controls}>
        <label>
          <span>Search teachings</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search a title or question"
          />
        </label>
        <label>
          <span>Topic</span>
          <select value={topic} onChange={(event) => setTopic(event.currentTarget.value as TopicSlug | "all")}>
            <option value="all">All topics</option>
            {topics.map((item) => <option value={item.slug} key={item.slug}>{item.label}</option>)}
          </select>
        </label>
      </div>
      <p className={styles.status} role="status" aria-live="polite">
        {results.length} {results.length === 1 ? "teaching" : "teachings"}
      </p>
      {results.length ? (
        <div className={styles.grid}>{results.map((item) => <TeachingCard teaching={item} key={item.slug} />)}</div>
      ) : (
        <div className={styles.empty}>
          <h3>No teaching matches those filters.</h3>
          <button type="button" onClick={() => { setQuery(""); setTopic("all"); }}>Clear filters</button>
        </div>
      )}
    </section>
  );
}
