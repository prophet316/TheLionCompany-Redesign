import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import {
  AnalyticsProvider,
  useAnalytics,
} from "@/components/client/analytics-provider";

function Probe() {
  const analytics = useAnalytics();
  return (
    <>
      <output>{analytics.consent}</output>
      <button onClick={() => analytics.setConsent("analytics-granted")}>Grant</button>
      <button onClick={() => analytics.setConsent("denied")}>Deny</button>
      <button onClick={() => analytics.track("give_click", { target: "subsplash", placement: "test" })}>
        Track
      </button>
    </>
  );
}

describe("AnalyticsProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.querySelectorAll("script[data-ga4]").forEach((script) => script.remove());
    delete window.gtag;
    delete window.dataLayer;
  });

  it("does not load or dispatch before consent, then loads only after grant", async () => {
    render(
      <AnalyticsProvider enabled>
        <Probe />
      </AnalyticsProvider>,
    );
    expect(screen.getByText("unknown")).toBeVisible();
    expect(document.querySelector("script[data-ga4]")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Track" }));
    expect(window.dataLayer).toBeUndefined();

    await userEvent.click(screen.getByRole("button", { name: "Grant" }));
    expect(document.querySelector("script[data-ga4]")).not.toBeNull();
    expect(window.dataLayer).toContainEqual(["consent", "update", { analytics_storage: "granted" }]);
    await userEvent.click(screen.getByRole("button", { name: "Track" }));
    expect(window.dataLayer?.at(-1)?.[1]).toBe("give_click");

    await userEvent.click(screen.getByRole("button", { name: "Deny" }));
    expect(window.dataLayer).toContainEqual(["consent", "update", { analytics_storage: "denied" }]);
    localStorage.setItem("tlc:analytics-consent:v1", JSON.stringify({ state: "analytics-granted", version: 1, decidedAt: new Date().toISOString() }));
    window.dispatchEvent(new StorageEvent("storage", { key: "tlc:analytics-consent:v1", newValue: localStorage.getItem("tlc:analytics-consent:v1") }));
    expect(await screen.findByText("analytics-granted")).toBeVisible();
    expect(window.dataLayer?.at(-1)).toEqual(["consent", "update", { analytics_storage: "granted" }]);
  });
});
