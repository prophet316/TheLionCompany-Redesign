"use client";

import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { AnalyticsProvider, useAnalytics } from "./analytics-provider";
import { ConsentControls } from "./consent-controls";

const PromptController = lazy(() => import("./prompt-controller").then((module) => ({ default: module.PromptController })));
const WebVitalsReporter = lazy(() => import("./web-vitals-reporter").then((module) => ({ default: module.WebVitalsReporter })));

function ConsentGatedWebVitals({ enabled }: { readonly enabled: boolean }) {
  const analytics = useAnalytics();
  if (!enabled || analytics.consent !== "analytics-granted") return null;
  return <Suspense fallback={null}><WebVitalsReporter /></Suspense>;
}

function DeferredPromptController() {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (active) return;
    const activate = () => setActive(true);
    const events = ["scroll", "keydown", "touchstart"] as const;
    for (const event of events) window.addEventListener(event, activate, { passive: true, once: true });
    const timer = window.setTimeout(activate, 15_000);
    return () => {
      window.clearTimeout(timer);
      for (const event of events) window.removeEventListener(event, activate);
    };
  }, [active]);
  return active ? <Suspense fallback={null}><PromptController /></Suspense> : null;
}

export function ExperienceProviders({
  children,
  analyticsEnabled,
}: {
  readonly children: ReactNode;
  readonly analyticsEnabled: boolean;
}) {
  return (
    <AnalyticsProvider enabled={analyticsEnabled}>
      <ConsentGatedWebVitals enabled={analyticsEnabled} />
      {children}
      <DeferredPromptController />
      <ConsentControls />
    </AnalyticsProvider>
  );
}
