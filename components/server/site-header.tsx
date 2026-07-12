import Link from "next/link";
import { MobileNavigation, type NavigationItem } from "@/components/client/mobile-navigation";
import { TrackedLink } from "@/components/client/tracked-link";
import styles from "./site-shell.module.css";

export const primaryNavigation: readonly NavigationItem[] = [
  { href: "/start-here", label: "Start here", analyticsTarget: "start-here" },
  { href: "/live", label: "Live", analyticsTarget: "live" },
  { href: "/teachings", label: "Teachings", analyticsTarget: "teachings" },
  { href: "/podcast", label: "Podcast", analyticsTarget: "podcast" },
  { href: "/prayer", label: "Prayer", analyticsTarget: "prayer" },
  { href: "/connect", label: "Connect", analyticsTarget: "connect" },
  { href: "/store", label: "Store", analyticsTarget: "store" },
];

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link className={styles.brand} href="/" aria-label="The Lion Company home" prefetch={false}>
          <span aria-hidden="true" className={styles.brandMark}>LC</span>
          <span>The Lion Company</span>
        </Link>
        <nav className={styles.desktopNav} aria-label="Primary">
          <ul>
            {primaryNavigation.map((item) => (
              <li key={item.href}><TrackedLink href={item.href} eventName="nav_click" eventProperties={{ target: item.analyticsTarget, placement: "header" }}>{item.label}</TrackedLink></li>
            ))}
          </ul>
        </nav>
        <TrackedLink className={styles.headerAction} href="/give" eventName="cta_click" eventProperties={{ target: "give", placement: "header" }}>Give</TrackedLink>
        <MobileNavigation items={primaryNavigation} />
      </div>
    </header>
  );
}
