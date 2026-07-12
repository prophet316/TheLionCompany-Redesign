import { expect, test } from "@playwright/test";
import { destinationRegistry } from "../../../content/destinations";
import { seedProtectedDeploymentCookie } from "../support/release-helpers";

const subsplashURL = destinationRegistry.find((destination) => destination.key === "subsplash")!.href;

test.describe("JavaScript disabled release contract", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 360, height: 800 } });
  test.beforeEach(async ({ context }) => seedProtectedDeploymentCookie(context));

  test("home remains truthful, crawlable, and actionable", async ({ page }) => {
    const thirdParty: string[] = [];
    page.on("request", (request) => {
      if (/google-analytics|googletagmanager|youtube-nocookie/.test(request.url())) thirdParty.push(request.url());
    });
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByText("Live daily on TikTok")).toBeVisible();
    await expect(page.getByRole("link", { name: /join today’s live/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /support the mission/i }).first()).toBeVisible();
    await expect(page.locator("iframe, audio[autoplay], video[autoplay]")).toHaveCount(0);
    expect(thirdParty).toEqual([]);
  });

  test("protected forms explain the requirement without leaking text into a URL", async ({ page }) => {
    await page.goto("/prayer");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("You do not have to carry this alone.");
    await expect(page.getByRole("heading", { level: 2, name: "Send a private prayer request" })).toBeVisible();
    await expect(page.getByText(/javascript is required for the security check/i)).toBeVisible();
    expect(new URL(page.url()).pathname).toBe("/prayer");
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  });

  test("teaching, podcast, store, giving, and social anchors remain real", async ({ page }) => {
    for (const path of ["/teachings", "/podcast", "/store", "/give", "/connect"]) {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator('a[href^="http"]')).not.toHaveCount(0);
    }
  });

  test("giving remains exact and above fold at 320px without JavaScript", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/give");
    const giving = page.locator(`a[href="${subsplashURL}"]`).first();
    await expect(giving).toBeVisible();
    const box = await giving.boundingBox();
    expect(box && box.y + box.height <= 800, JSON.stringify(box)).toBeTruthy();
  });
});
