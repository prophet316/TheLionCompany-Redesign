import Link from "next/link";
import type { Teaching } from "@/lib/content/types";

export function TeachingCard({ teaching }: { teaching: Teaching }) {
  return <article><p className="eyebrow">{teaching.series ?? "Teaching"}</p><h2><Link href={`/teachings/${teaching.slug}`}>{teaching.title}</Link></h2><p>{teaching.summary}</p><ul className="cluster">{teaching.topics.map((topic) => <li key={topic}>{topic.replaceAll("-", " ")}</li>)}</ul></article>;
}
