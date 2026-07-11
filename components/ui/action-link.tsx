import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./action-link.module.css";

export interface ActionLinkProps {
  readonly href: string;
  readonly children: ReactNode;
  readonly tone?: "ink" | "clay" | "quiet";
  readonly external?: boolean;
  readonly className?: string;
}

export function ActionLink({
  href,
  children,
  tone = "ink",
  external = false,
  className,
}: ActionLinkProps) {
  const classes = [styles.action, styles[tone], className].filter(Boolean).join(" ");
  const content = (
    <>
      <span>{children}</span>
      <span aria-hidden="true">↗</span>
    </>
  );

  if (external) {
    return (
      <a className={classes} href={href} rel="noreferrer" target="_blank">
        {content}
      </a>
    );
  }

  return (
    <Link className={classes} href={href}>
      {content}
    </Link>
  );
}
