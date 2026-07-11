import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnalyticsProvider } from "@/components/client/analytics-provider";
import { PromptController } from "@/components/client/prompt-controller";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/lib/forms/public-config", () => ({
  publicFormConfig: { turnstileSiteKey: "test-site-key", deliveryMode: "no-send" },
}));
vi.mock("@marsidev/react-turnstile", () => ({
  Turnstile: () => <div data-testid="turnstile-stub" />,
}));

describe("PromptController", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-11T12:00:00.000Z"));
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    Object.defineProperty(navigator, "locks", {
      value: { request: async (_name: string, _options: object, callback: (lock: object) => boolean) => callback({}) },
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("never appears on initial load and becomes eligible after 60 visible seconds", async () => {
    render(<AnalyticsProvider enabled={false}><PromptController /></AnalyticsProvider>);
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(screen.getByRole("complementary", { name: /monthly field notes/i })).toBeVisible();
  });

  it("fails closed when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    render(<AnalyticsProvider enabled={false}><PromptController /></AnalyticsProvider>);
    act(() => vi.advanceTimersByTime(61_000));
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });

  it("uses the storage lease fallback when Web Locks is unavailable", async () => {
    Object.defineProperty(navigator, "locks", { value: undefined, configurable: true, writable: true });
    render(<AnalyticsProvider enabled={false}><PromptController /></AnalyticsProvider>);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    // Eligibility schedules the storage-lease settle timeout after the 60s interval ticks.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
      await Promise.resolve();
    });
    expect(screen.getByRole("complementary", { name: /monthly field notes/i })).toBeVisible();
  });

  it("unmounts an eligible invitation when another disclosure expands", async () => {
    render(
      <AnalyticsProvider enabled={false}>
        <button type="button" aria-expanded="false">Menu</button>
        <PromptController />
      </AnalyticsProvider>,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(screen.getByRole("complementary", { name: /monthly field notes/i })).toBeVisible();

    const menu = screen.getByRole("button", { name: "Menu" });
    menu.setAttribute("aria-expanded", "true");
    fireEvent.click(menu);
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });
});
