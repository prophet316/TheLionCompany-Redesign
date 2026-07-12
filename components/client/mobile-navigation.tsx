"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { TrackedLink } from "@/components/client/tracked-link";
import type { AnalyticsProperties } from "@/lib/analytics/contracts";
import styles from "./mobile-navigation.module.css";

export interface NavigationItem {
  readonly href: string;
  readonly label: string;
  readonly analyticsTarget: AnalyticsProperties<"nav_click">["target"];
}

export function MobileNavigation({ items }: { readonly items: readonly NavigationItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close the disclosure when the route changes so focus cannot remain trapped off-page.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- route change is an external signal
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    document.body.dataset.scrollLock = "true";
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      delete document.body.dataset.scrollLock;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.mobile}>
      <button
        ref={triggerRef}
        className={styles.trigger}
        type="button"
        aria-controls={panelId}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">{open ? "Close" : "Menu"}</span>
      </button>
      <div ref={panelRef} className={styles.panel} id={panelId} hidden={!open}>
        <nav aria-label="Mobile">
          <ul>
            {items.map((item) => (
              <li key={item.href}>
                <TrackedLink href={item.href} eventName="nav_click" eventProperties={{ target: item.analyticsTarget, placement: "mobile" }}>
                  {item.label}
                </TrackedLink>
              </li>
            ))}
          </ul>
        </nav>
        <TrackedLink className={styles.live} href="/live" eventName="cta_click" eventProperties={{ target: "live", placement: "mobile" }}>
          Join today’s live
        </TrackedLink>
        <TrackedLink className={styles.give} href="/give" eventName="cta_click" eventProperties={{ target: "give", placement: "mobile" }}>
          Give to The Lion Company
        </TrackedLink>
      </div>
    </div>
  );
}
