import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WebVitalsReporter } from "@/components/client/web-vitals-reporter";

const testState = vi.hoisted(() => ({
  track: vi.fn(),
  report: undefined as ((metric: { name: string; value: number; rating: string }) => void) | undefined,
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("next/web-vitals", () => ({ useReportWebVitals: (callback: typeof testState.report) => { testState.report = callback; } }));
vi.mock("@/components/client/analytics-provider", () => ({ useAnalytics: () => ({ track: testState.track }) }));

describe("WebVitalsReporter", () => {
  it("emits only the rounded home INP aggregate shape", () => {
    render(<WebVitalsReporter />);
    act(() => testState.report?.({ name: "LCP", value: 1200, rating: "good" }));
    expect(testState.track).not.toHaveBeenCalled();
    act(() => testState.report?.({ name: "INP", value: 187.4, rating: "good" }));
    expect(testState.track).toHaveBeenCalledWith("web_vital", {
      metric_name: "INP",
      metric_value_ms: 187,
      metric_rating: "good",
      page_group: "home",
    });
  });
});
