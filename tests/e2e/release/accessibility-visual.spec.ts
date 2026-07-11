import { expect, test } from "@playwright/test";
import {
  INDEXABLE_SMOKE_ROUTES,
  seedProtectedDeploymentCookie,
  denyAnalytics,
  expectNoBlockingAxeFindings,
  expectNoHorizontalOverflow,
  stabilizeForScreenshot,
} from "../support/release-helpers";

test.beforeEach(async ({ context }) => seedProtectedDeploymentCookie(context));

for (const path of INDEXABLE_SMOKE_ROUTES) {
  test(`${path} has no blocking Axe finding`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(path);
    await denyAnalytics(page);
    await expectNoBlockingAxeFindings(page);
  });
}

test("320 CSS pixels retain one horizontal viewport", async ({ page }) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => {
    localStorage.setItem("tlc:analytics-consent:v1", JSON.stringify({
      state: "denied",
      version: 1,
      decidedAt: new Date().toISOString(),
    }));
  });
  await page.setViewportSize({ width: 320, height: 800 });
  for (const path of ["/", "/prayer", "/connect", "/teachings"]) {
    await page.goto(path);
    await denyAnalytics(page);
    await expectNoHorizontalOverflow(page);
    await expect(page.locator("main")).toBeVisible();
  }
});

test("Chromium 400% emulation maps a 1280px reference to a 320 CSS pixel reflow viewport", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Chromium DevTools device-metrics proof; all engines run the 320 CSS pixel reflow test.");
  const session = await page.context().newCDPSession(page);
  await session.send("Emulation.setDeviceMetricsOverride", {
    width: 320,
    height: 225,
    screenWidth: 1280,
    screenHeight: 900,
    deviceScaleFactor: 1,
    mobile: false,
    scale: 4,
  });
  await page.addInitScript(() => {
    localStorage.setItem("tlc:analytics-consent:v1", JSON.stringify({
      state: "denied",
      version: 1,
      decidedAt: new Date().toISOString(),
    }));
  });

  for (const path of ["/", "/prayer", "/connect", "/teachings"]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const metrics = await page.evaluate(() => ({
      screenWidth: screen.width,
      innerWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(metrics).toEqual({ screenWidth: 1280, innerWidth: 320, clientWidth: 320 });
    await expectNoHorizontalOverflow(page);
    await expect(page.locator("main")).toBeVisible();
  }

  await session.send("Emulation.clearDeviceMetricsOverride");
});

test("increased text spacing and forced colors keep controls visible", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/connect");
  await denyAnalytics(page);
  await page.addStyleTag({ content: `
    * { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; }
    p { margin-bottom: 2em !important; }
  ` });
  await expect(page.getByRole("form", { name: "Monthly field notes" })).toBeVisible();
  await expect(page.getByRole("form", { name: "Contact The Lion Company" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

for (const shot of [
  { name: "home-mobile", path: "/", width: 360, height: 800 },
  { name: "home-desktop", path: "/", width: 1440, height: 900 },
  { name: "prayer-mobile", path: "/prayer", width: 360, height: 800 },
  { name: "connect-desktop", path: "/connect", width: 1440, height: 900 },
] as const) {
  test(`${shot.name} matches the reviewed visual baseline`, async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Canonical visual baselines use Chromium; functional parity runs in all engines.");
    await page.setViewportSize({ width: shot.width, height: shot.height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(shot.path, { waitUntil: "networkidle" });
    await denyAnalytics(page);
    await stabilizeForScreenshot(page);
    await expect(page).toHaveScreenshot(`${shot.name}.png`, {
      animations: "disabled",
      caret: "hide",
      fullPage: true,
      maxDiffPixelRatio: 0.005,
    });
  });
}
