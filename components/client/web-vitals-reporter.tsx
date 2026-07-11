"use client";

import { useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { useAnalytics } from "./analytics-provider";

type Reporter = Parameters<typeof useReportWebVitals>[0];

export function WebVitalsReporter() {
  const pathname = usePathname();
  const { track } = useAnalytics();
  const current = useRef({ pathname, track });
  current.current = { pathname, track };

  const report = useCallback<Reporter>((metric) => {
    const state = current.current;
    if (state.pathname !== "/" || metric.name !== "INP") return;
    state.track("web_vital", {
      metric_name: "INP",
      metric_value_ms: Math.round(metric.value),
      metric_rating: metric.rating,
      page_group: "home",
    });
  }, []);

  useReportWebVitals(report);
  return null;
}
