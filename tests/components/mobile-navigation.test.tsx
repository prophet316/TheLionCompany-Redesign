import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AnalyticsProvider } from "@/components/client/analytics-provider";
import { MobileNavigation } from "@/components/client/mobile-navigation";

const items = [
  { href: "/start-here", label: "Start here", analyticsTarget: "start-here" },
  { href: "/teachings", label: "Teachings", analyticsTarget: "teachings" },
] as const;

describe("MobileNavigation", () => {
  it("opens accessibly, closes with Escape, and restores trigger focus", async () => {
    const user = userEvent.setup();
    render(<AnalyticsProvider enabled={false}><MobileNavigation items={items} /></AnalyticsProvider>);
    const trigger = screen.getByRole("button", { name: /open menu/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: /mobile/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /give to the lion company/i })).toHaveAttribute("href", "/give");
    expect(document.body).toHaveAttribute("data-scroll-lock", "true");
    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
    expect(document.body).not.toHaveAttribute("data-scroll-lock");
  });
});
