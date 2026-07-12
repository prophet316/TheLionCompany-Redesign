import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { destinationRegistry } from "../../../content/destinations";
import {
  INDEXABLE_SMOKE_ROUTES,
  RELEASE_VIEWPORTS,
  seedProtectedDeploymentCookie,
  collectBrowserLeaks,
  denyAnalytics,
  expectNoGa,
  expectNoHorizontalOverflow,
} from "../support/release-helpers";

test.beforeEach(async ({ context }) => seedProtectedDeploymentCookie(context));
const subsplashURL = destinationRegistry.find((destination) => destination.key === "subsplash")!.href;

const LAUNCH_TEACHING_SLUG = "when-gods-will-doesnt-go-your-way";
const LAUNCH_YOUTUBE_ID = "TOj6tefx3rI";

/** True only when authorized complete-listen-through evidence exists for the launch teaching. */
function hasAuthorizedLaunchTeachingEvidence(): boolean {
  try {
    const records = JSON.parse(
      readFileSync(join(process.cwd(), "content/evidence/teaching-transcript-reviews.json"), "utf8"),
    ) as unknown;
    if (!Array.isArray(records)) return false;
    return records.some(
      (record) =>
        record !== null &&
        typeof record === "object" &&
        (record as { slug?: string }).slug === LAUNCH_TEACHING_SLUG &&
        (record as { youtubeId?: string }).youtubeId === LAUNCH_YOUTUBE_ID &&
        (record as { reviewMethod?: string }).reviewMethod === "complete-listen-through" &&
        (record as { decision?: string }).decision === "approved-complete-text-alternative",
    );
  } catch {
    return false;
  }
}

const launchTeachingHasEvidence = hasAuthorizedLaunchTeachingEvidence();

for (const viewport of RELEASE_VIEWPORTS) {
  test.describe(`${viewport.name} ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const path of INDEXABLE_SMOKE_ROUTES) {
      test(`${path} has one visible h1, clean console, and no overflow`, async ({ page }) => {
        const leaks = collectBrowserLeaks(page);
        await page.goto(path, { waitUntil: "domcontentloaded" });
        await denyAnalytics(page);
        await expect(page.locator("h1:visible")).toHaveCount(1);
        await expect(page.locator("main")).toBeVisible();
        await expectNoHorizontalOverflow(page);
        expect(leaks.consoleErrors).toEqual([]);
        expect(leaks.pageErrors).toEqual([]);
      });
    }
  });
}

test("every indexable page shell exposes the internal giving path", async ({ page }) => {
  test.setTimeout(90_000);
  for (const path of INDEXABLE_SMOKE_ROUTES) {
    await page.goto(path);
    await expect(page.locator('a[href="/give"]').first(), `${path} lacks the shell giving path`).toBeVisible();
  }
});

for (const viewport of [{ width: 320, height: 800 }, { width: 1440, height: 900 }]) {
  test(`giving action is exact, above fold, and keyboard reachable at ${viewport.width}px`, async ({ page, browserName }) => {
    test.skip(browserName === "webkit", "Playwright WebKit does not model the OS full-keyboard-access setting; Chromium and Firefox own this keyboard proof.");
    await page.setViewportSize(viewport);
    await page.goto("/give");
    const giving = page.locator(`a[href="${subsplashURL}"]`).first();
    await expect(giving).toBeVisible();
    const box = await giving.boundingBox();
    expect(box && box.y + box.height <= viewport.height, JSON.stringify(box)).toBeTruthy();
    for (let index = 0; index < 30 && !(await giving.evaluate((element) => element === document.activeElement)); index += 1) await page.keyboard.press("Tab");
    await expect(giving).toBeFocused();
  });
}

test("keyboard-only mobile navigation and dialog restore focus", async ({ page, browserName }) => {
  test.skip(browserName === "webkit", "Playwright WebKit does not model the OS full-keyboard-access setting; Chromium and Firefox own this keyboard proof.");
  await page.setViewportSize({ width: 360, height: 800 });
  await page.addInitScript(() => {
    localStorage.setItem("tlc:prompts:v1", JSON.stringify({
      version: 1,
      visitId: "release-keyboard-visit",
      visitCount: 1,
      lastActivityAt: Date.now(),
    }));
  });
  await page.goto("/");
  await denyAnalytics(page);
  // denyAnalytics clicks the consent control and leaves focus there; reload into a fresh
  // document (consent already stored) so the first Tab reaches the skip link.
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  await page.keyboard.press("Tab");
  const menu = page.getByRole("button", { name: "Open menu" });
  while (!(await menu.evaluate((element) => element === document.activeElement))) {
    await page.keyboard.press("Tab");
  }
  await page.keyboard.press("Enter");
  await expect(page.getByRole("navigation", { name: "Mobile" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();

  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight * 0.7));
  const invitation = page.getByRole("complementary", { name: "Monthly field notes" });
  await expect(invitation).toBeVisible({ timeout: 20_000 });
  const open = invitation.getByRole("button", { name: "Open" });
  await open.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Monthly field notes" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(open).toBeFocused();
});

test("same-tab denial removes GA cookies in every browser", async ({ page, context }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Decline analytics" }).click();
  const origin = new URL(page.url()).origin;
  await context.addCookies([{
    name: "_ga",
    value: "preview-host-only",
    url: origin,
    secure: origin.startsWith("https:"),
  }]);
  await page.getByRole("button", { name: "Analytics settings" }).click();
  await page.getByRole("button", { name: "Decline analytics" }).click();
  await expect.poll(async () =>
    (await context.cookies()).filter((cookie) => cookie.name.startsWith("_ga")),
  ).toEqual([]);
});

test("consent denied, granted, revoked, re-granted, expired, and cross-tab synchronized are exact", async ({ browser, browserName }) => {
  test.skip(browserName === "webkit", "Chromium and Firefox own cross-tab storage synchronization; WebKit runs the same-tab cookie-removal proof.");
  test.setTimeout(90_000);
  const context = await browser.newContext();
  await seedProtectedDeploymentCookie(context);
  const page = await context.newPage();
  const peer = await context.newPage();
  const analyticsRequests: string[] = [];
  for (const candidate of [page, peer]) {
    candidate.on("request", (request) => {
      if (/google-analytics|googletagmanager/.test(request.url())) analyticsRequests.push(request.url());
    });
    await candidate.route("https://www.googletagmanager.com/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/javascript", body: "" }),
    );
    await candidate.goto("/");
    await candidate.evaluate(() => {
      const target = window as typeof window & { __releaseConsentEvents?: string[] };
      target.__releaseConsentEvents = [];
      window.addEventListener("storage", (event) => {
        if (event.key === "tlc:analytics-consent:v1" && event.newValue) {
          target.__releaseConsentEvents?.push(event.newValue);
        }
      });
    });
  }

  await page.getByRole("button", { name: "Decline analytics" }).click();
  await page.getByRole("link", { name: /support the mission/i }).first().click({ noWaitAfter: true });
  await expectNoGa(page, analyticsRequests);
  await expect.poll(() => peer.evaluate(() =>
    (window as typeof window & { __releaseConsentEvents?: string[] }).__releaseConsentEvents?.some((value) =>
      value.includes('"state":"denied"'),
    ),
  )).toBe(true);
  await expect(peer.getByRole("button", { name: "Analytics settings" })).toBeVisible();

  await page.getByRole("button", { name: "Analytics settings" }).click();
  await page.getByRole("button", { name: "Allow analytics" }).click();
  await expectNoGa(page, analyticsRequests);
  await expect.poll(() => peer.evaluate(() =>
    (window as typeof window & { __releaseConsentEvents?: string[] }).__releaseConsentEvents?.some((value) =>
      value.includes('"state":"analytics-granted"'),
    ),
  )).toBe(true);
  const origin = new URL(page.url()).origin;
  await context.addCookies([{ name: "_ga", value: "preview-host-only", url: origin, secure: origin.startsWith("https:") }]);
  await peer.getByRole("button", { name: "Analytics settings" }).click();
  await peer.getByRole("button", { name: "Decline analytics" }).click();
  await expect.poll(() => page.evaluate(() =>
    (window as typeof window & { __releaseConsentEvents?: string[] }).__releaseConsentEvents?.some((value) =>
      value.includes('"state":"denied"'),
    ),
  )).toBe(true);
  expect((await context.cookies()).filter((cookie) => cookie.name.startsWith("_ga"))).toEqual([]);

  await page.getByRole("button", { name: "Analytics settings" }).click();
  await page.getByRole("button", { name: "Allow analytics" }).click();
  await expect.poll(() => peer.evaluate(() =>
    (window as typeof window & { __releaseConsentEvents?: string[] }).__releaseConsentEvents?.filter((value) =>
      value.includes('"state":"analytics-granted"'),
    ).length,
  )).toBeGreaterThanOrEqual(2);

  await page.evaluate(() => localStorage.setItem("tlc:analytics-consent:v1", JSON.stringify({
    state: "analytics-granted",
    version: 0,
    decidedAt: "2025-01-01T00:00:00.000Z",
  })));
  await page.reload();
  await expect(page.getByRole("button", { name: "Allow analytics" })).toBeVisible();
  await context.close();
});

test("@canonical-consent canonical withdrawal removes host and parent-domain GA cookies", async ({ browser }) => {
  test.skip(process.env.RELEASE_MODE !== "production", "parent-domain cookie proof runs only on the promoted canonical host");
  const context = await browser.newContext();
  const page = await context.newPage();
  const peer = await context.newPage();
  for (const candidate of [page, peer]) {
    await candidate.route("https://www.googletagmanager.com/**", (route) => route.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
    await candidate.goto("https://www.thelioncompany.org/");
  }
  await page.getByRole("button", { name: "Decline analytics" }).click();
  await page.getByRole("button", { name: "Analytics settings" }).click();
  await page.getByRole("button", { name: "Allow analytics" }).click();
  await expect.poll(() => peer.evaluate(() => window.dataLayer?.some((entry) => entry[0] === "consent" && (entry[2] as { analytics_storage?: string }).analytics_storage === "granted"))).toBe(true);
  await context.addCookies([
    { name: "_ga", value: "canonical-host", domain: "www.thelioncompany.org", path: "/", secure: true },
    { name: "_ga_MNK2G065ES", value: "canonical-parent", domain: ".thelioncompany.org", path: "/", secure: true },
  ]);
  await peer.getByRole("button", { name: "Analytics settings" }).click();
  await peer.getByRole("button", { name: "Decline analytics" }).click();
  await expect.poll(() => page.evaluate(() => window.dataLayer?.some((entry) => entry[0] === "consent" && (entry[2] as { analytics_storage?: string }).analytics_storage === "denied"))).toBe(true);
  expect((await context.cookies()).filter((cookie) => cookie.name === "_ga" || cookie.name.startsWith("_ga_"))).toEqual([]);
  await page.getByRole("button", { name: "Analytics settings" }).click();
  await page.getByRole("button", { name: "Allow analytics" }).click();
  await expect.poll(() => peer.evaluate(() => window.dataLayer?.filter((entry) => entry[0] === "consent" && (entry[2] as { analytics_storage?: string }).analytics_storage === "granted").length)).toBeGreaterThanOrEqual(2);
  await context.close();
});

test("storage failure leaves analytics denied and both promotional invitations absent", async ({ browser }) => {
  test.setTimeout(90_000);
  const context = await browser.newContext();
  await seedProtectedDeploymentCookie(context);
  await context.addInitScript(() => {
    Object.defineProperty(Storage.prototype, "getItem", { value() { throw new Error("blocked"); } });
    Object.defineProperty(Storage.prototype, "setItem", { value() { throw new Error("blocked"); } });
  });
  const page = await context.newPage();
  const analyticsRequests: string[] = [];
  page.on("request", (request) => {
    if (/google-analytics|googletagmanager/.test(request.url())) analyticsRequests.push(request.url());
  });
  await page.goto("/");
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(61_000);
  await expect(page.getByRole("complementary")).toHaveCount(0);
  await expectNoGa(page, analyticsRequests);
  await context.close();
});

test("reduced motion preserves the hierarchy and leaves no continuous animation", async ({ page }) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await denyAnalytics(page);
  for (const heading of [
    "Love is the beginning.",
    "Relationship is the place.",
    "Discipleship is the way.",
    "Education equips the work.",
  ]) await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === "running").length)).toBe(0);
});

test("eligible teaching requests no YouTube resource until play, then uses youtube-nocookie", async ({ page }) => {
  test.setTimeout(90_000);
  test.skip(
    !launchTeachingHasEvidence,
    "authorized complete-listen-through transcript evidence is still pending",
  );
  const youtubeRequests: string[] = [];
  page.on("request", (request) => {
    if (/youtube|ytimg/.test(request.url())) youtubeRequests.push(request.url());
  });
  await page.goto(`/teachings/${LAUNCH_TEACHING_SLUG}`);
  expect(youtubeRequests).toEqual([]);
  await expect(page.locator("iframe")).toHaveCount(0);
  const play = page.getByRole("button", { name: /^Play / });
  await expect(play).toBeVisible();
  await play.click();
  await expect(page.locator('iframe[src*="youtube-nocookie.com"]')).toBeVisible();
  expect(youtubeRequests.some((url) => url.includes("youtube-nocookie.com"))).toBe(true);
});

test("launch teaching stays direct-link-only while transcript evidence is pending", async ({ page }) => {
  test.skip(
    launchTeachingHasEvidence,
    "authorized transcript evidence is present; eligible embed path owns this assertion",
  );
  const youtubeRequests: string[] = [];
  page.on("request", (request) => {
    if (/youtube|ytimg/.test(request.url())) youtubeRequests.push(request.url());
  });
  await page.goto(`/teachings/${LAUNCH_TEACHING_SLUG}`);
  expect(youtubeRequests).toEqual([]);
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Play / })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Watch directly on YouTube" })).toHaveAttribute(
    "href",
    new RegExp(LAUNCH_YOUTUBE_ID),
  );
});

test("ineligible teaching stays direct-link-only", async ({ page }) => {
  const youtubeRequests: string[] = [];
  page.on("request", (request) => { if (/youtube|ytimg/.test(request.url())) youtubeRequests.push(request.url()); });
  await page.goto("/teachings/heart-over-hammer");
  expect(youtubeRequests).toEqual([]);
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Play / })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Watch directly on YouTube" })).toHaveAttribute("href", /zP4ZiKek3Lg/);
});
