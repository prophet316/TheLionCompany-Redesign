"use client";

import type { ReactNode } from "react";
import { AnalyticsProvider } from "./analytics-provider";
import { ConsentControls } from "./consent-controls";
import { PromptController } from "./prompt-controller";
import { WebVitalsReporter } from "./web-vitals-reporter";

export function ExperienceProviders({
  children,
  analyticsEnabled,
}: {
  readonly children: ReactNode;
  readonly analyticsEnabled: boolean;
}) {
  return (
    <AnalyticsProvider enabled={analyticsEnabled}>
      <WebVitalsReporter />
      {children}
      <PromptController />
      <ConsentControls />
    </AnalyticsProvider>
  );
}
