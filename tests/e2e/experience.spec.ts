import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { getDestination } from "@/lib/content";

async function expectNoBlockingAxeFindings(page: Page) {
  const result = await new AxeBuilder({ page }).analyze();
  const blocking = result.violations.filter((violation) =>
    violation.impact === "critical" || violation.impact === "serious" || violation.impact === "moderate",
  );
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
}

test.describe("Gathering experience", () => {
  for (const path of ["/", "/teachings", "/podcast", "/connect", "/store", "/give"]) {
    test(path + " has one h1, no blocking Axe findings, and no horizontal overflow", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
      await expectNoBlockingAxeFindings(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }

  test("mobile navigation closes with Escape and restores focus", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Open menu" });
    await trigger.click();
    await expect(page.getByRole("navigation", { name: "Mobile" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  });

  test("YouTube makes no third-party request before intent and stays direct-link-only until transcript review", async ({ page }) => {
    const youtubeRequests: string[] = [];
    page.on("request", (request) => {
      if (/youtube|ytimg/.test(request.url())) youtubeRequests.push(request.url());
    });
    await page.goto("/teachings/when-gods-will-doesnt-go-your-way");
    expect(youtubeRequests).toEqual([]);
    // Authorized-human transcript gate remains pending: no embed path, only the direct YouTube action.
    await expect(page.getByRole("button", { name: /^Play / })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /watch directly on youtube/i })).toBeVisible();
    await expect(page.locator("iframe")).toHaveCount(0);
  });

  test("denied consent produces no GA script, request, or cookie", async ({ page }) => {
    const analyticsRequests: string[] = [];
    page.on("request", (request) => {
      if (/google-analytics|googletagmanager/.test(request.url())) analyticsRequests.push(request.url());
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Decline analytics" }).click();
    await page.getByRole("link", { name: /support the mission/i }).first().click();
    expect(analyticsRequests).toEqual([]);
    expect((await page.context().cookies()).filter((cookie) => cookie.name.startsWith("_ga"))).toEqual([]);
  });

  test("giving is obvious, calm, and reaches the verified Subsplash handoff", async ({ page }) => {
    const giving = getDestination("subsplash");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("banner").getByRole("link", { name: "Give", exact: true })).toHaveAttribute("href", "/give");
    await page.getByRole("banner").getByRole("link", { name: "Give", exact: true }).click();
    const handoff = page.getByRole("link", { name: /give securely through subsplash/i });
    await expect(handoff).toBeVisible();
    await expect(handoff).toHaveAttribute("href", giving.href);
    const desktopBox = await handoff.boundingBox();
    expect(desktopBox && desktopBox.y + desktopBox.height <= 900).toBe(true);
    await expect(page.getByText(/sustained by voluntary givers/i).first()).toBeVisible();
    await expect(page.locator("main")).not.toContainText(/urgent|before it’s too late|act now|fundraising deadline/i);

    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    // Mobile Give sits in the disclosure panel beside the mobile nav list.
    await expect(page.getByRole("banner").getByRole("link", { name: /give to the lion company/i })).toHaveAttribute("href", "/give");
  });

  test("every completed page shell keeps giving one obvious step away", async ({ page }) => {
    for (const path of ["/", "/start-here", "/live", "/teachings", "/podcast", "/prayer", "/connect", "/store", "/give", "/privacy", "/terms", "/accessibility"]) {
      await page.goto(path);
      // Desktop header CTA is exact "Give"; mobile disclosure uses a longer name and is hidden when closed.
      await expect(page.getByRole("banner").getByRole("link", { name: "Give", exact: true })).toHaveCount(1);
      await expect(page.getByRole("contentinfo").getByRole("link", { name: /give/i })).toHaveCount(1);
    }
  });

  test("cross-tab prompt claim allows exactly one invitation", async ({ context }) => {
    test.setTimeout(90_000);
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "locks", { value: undefined, configurable: true });
      // Pre-deny analytics so the consent card cannot block promotional invitations.
      localStorage.setItem(
        "tlc:analytics-consent:v1",
        JSON.stringify({ state: "denied", version: 1, decidedAt: "2026-07-11T00:00:00.000Z" }),
      );
    });
    const first = await context.newPage();
    const second = await context.newPage();
    await Promise.all([first.goto("/"), second.goto("/")]);
    // Wait for consent hydrate so data-consent-active is removed from the tree.
    await Promise.all([
      first.waitForFunction(() => !document.querySelector('[data-consent-active="true"]')),
      second.waitForFunction(() => !document.querySelector('[data-consent-active="true"]')),
    ]);
    await Promise.all([
      first.evaluate(() => {
        window.getSelection()?.removeAllRanges();
        (document.activeElement as HTMLElement | null)?.blur?.();
        scrollTo(0, document.documentElement.scrollHeight);
      }),
      second.evaluate(() => {
        window.getSelection()?.removeAllRanges();
        (document.activeElement as HTMLElement | null)?.blur?.();
        scrollTo(0, document.documentElement.scrollHeight);
      }),
    ]);
    // Progress ≥55% with ≥15s inactivity qualifies newsletter without waiting a full visible minute.
    await first.waitForTimeout(18_000);
    await expect.poll(async () =>
      (await first.getByRole("complementary").count()) +
      (await second.getByRole("complementary").count()),
      { timeout: 25_000 },
    ).toBe(1);
  });

  test("reduced motion keeps the hierarchy and removes scrubbed line state", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Love is the beginning." })).toBeVisible();
    await expect(page.locator('[data-testid="gathering-line"] path').first()).not.toHaveCSS("stroke-dashoffset", "1px");
  });

  test("forms announce no-send honesty on connect", async ({ page }) => {
    await page.goto("/connect");
    await expect(page.getByText(/preview test mode/i).first()).toBeVisible();
    await expect(page.getByText(/no message will be sent/i).first()).toBeVisible();
  });
});

test.describe("JavaScript disabled", () => {
  test.use({ javaScriptEnabled: false });
  test("core content and direct actions remain available", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /join today’s live/i })).toBeVisible();
    await expect(page.getByText("Live daily on TikTok")).toBeVisible();
    await expect(page.getByRole("link", { name: /support the mission/i }).first()).toBeVisible();
    await expect(page.locator("iframe")).toHaveCount(0);
  });

  test("the giving path remains a normal two-step handoff", async ({ page }) => {
    const giving = getDestination("subsplash");
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/");
    await expect(page.locator('a[href="/give"]').first()).toBeAttached();
    await page.goto("/give");
    const handoff = page.getByRole("link", { name: /give securely through subsplash/i });
    await expect(handoff).toHaveAttribute("href", giving.href);
    const mobileBox = await handoff.boundingBox();
    expect(mobileBox && mobileBox.y + mobileBox.height <= 800).toBe(true);
  });
});
