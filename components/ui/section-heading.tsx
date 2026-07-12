import styles from "./section-heading.module.css";

export interface SectionHeadingProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly body?: string;
  readonly align?: "start" | "center";
  readonly id?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  align = "start",
  id,
}: SectionHeadingProps) {
  return (
    <header className={styles[align]}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h2 className={styles.title} id={id}>
        {title}
      </h2>
      {body ? <p className={styles.body}>{body}</p> : null}
    </header>
  );
}
