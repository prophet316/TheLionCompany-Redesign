"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import type {
  AnalyticsEventName,
  AnalyticsProperties,
} from "@/lib/analytics/contracts";
import { useAnalytics } from "./analytics-provider";

export type TrackedLinkProps<Event extends AnalyticsEventName> =
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "href"> & {
  readonly children: ReactNode;
  readonly href: string;
  readonly eventName: Event;
  readonly eventProperties: AnalyticsProperties<Event>;
};

export function TrackedLink<Event extends AnalyticsEventName>({
  children,
  href,
  eventName,
  eventProperties,
  onClick,
  ...anchorProps
}: TrackedLinkProps<Event>) {
  const analytics = useAnalytics();
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (!event.defaultPrevented) analytics.track(eventName, eventProperties);
  }
  return href.startsWith("/") ? (
    <Link href={href} {...anchorProps} onClick={handleClick}>{children}</Link>
  ) : (
    <a href={href} {...anchorProps} onClick={handleClick}>{children}</a>
  );
}
