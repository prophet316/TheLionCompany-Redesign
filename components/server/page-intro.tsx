import type { ReactNode } from "react";
import styles from "./site-shell.module.css";

export function PageIntro({
  eyebrow,
  title,
  description,
  children,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly description?: string;
  readonly children?: ReactNode;
}) {
  return (
    <header className={styles.pageIntro}>
      <p>{eyebrow}</p>
      <h1>{title}</h1>
      <div className={styles.introLine} aria-hidden="true" />
      <div className={styles.pageIntroBody}>
        {description ? <p>{description}</p> : null}
        {children}
      </div>
    </header>
  );
}
