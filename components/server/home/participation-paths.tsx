import Link from "next/link";
import styles from "./home.module.css";

const paths = [
  { label: "Watch", title: "Begin with today’s teaching", href: "/live", className: styles.pathWide },
  { label: "Pray", title: "Let someone stand with you", href: "/prayer", className: styles.pathTall },
  { label: "Grow", title: "Find teaching for real life", href: "/teachings", className: "" },
  { label: "Give", title: "Help sustain the work", href: "/give", className: "" },
] as const;

export function ParticipationPaths() {
  return (
    <section className={"section " + styles.participation} aria-labelledby="participation-title" data-gathering-stage="connection">
      <header><p className={styles.eyebrow}>Not an audience</p><h2 id="participation-title">A place to participate.</h2></header>
      <div className={styles.pathGrid}>
        {paths.map((path, index) => (
          <article className={[styles.path, path.className].filter(Boolean).join(" ")} key={path.label}>
            <span aria-hidden="true">0{index + 1}</span>
            <p>{path.label}</p>
            <h3><Link href={path.href}>{path.title}</Link></h3>
          </article>
        ))}
      </div>
    </section>
  );
}
