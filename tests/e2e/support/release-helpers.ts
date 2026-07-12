import AxeBuilder from "@axe-core/playwright";
import { expect, type BrowserContext, type Page } from "@playwright/test";

export const RELEASE_VIEWPORTS = [
  { name: "phone", width: 360, height: 800 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

export const INDEXABLE_SMOKE_ROUTES = [
  "/", "/start-here", "/live", "/teachings", "/podcast", "/prayer",
  "/connect", "/store", "/give", "/privacy", "/terms", "/accessibility",
] as const;

export async function seedProtectedDeploymentCookie(context: BrowserContext) {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (!secret) return;
  const configured = process.env.PLAYWRIGHT_BASE_URL;
  if (!configured) throw new Error("PLAYWRIGHT_BASE_URL is required when seeding a deployment-protection cookie");
  const target = new URL(configured);
  if (target.protocol !== "https:" || !target.hostname.endsWith(".vercel.app") || target.username || target.password) {
    throw new Error("deployment-protection cookie target must be the exact HTTPS Vercel deployment origin");
  }
  const seed = new URL("/", target);
  const response = await context.request.get(seed.toString(), {
    maxRedirects: 0,
    failOnStatusCode: false,
    headers: {
      "x-vercel-protection-bypass": secret,
      "x-vercel-set-bypass-cookie": "true",
    },
  });
  if (response.status() !== 200 || response.url() !== seed.toString()) {
    throw new Error(`deployment-protection seed did not return exact-origin 200: ${response.status()}`);
  }
  const cookies = await context.cookies(target.origin);
  const bypass = cookies.find((cookie) => cookie.name === "_vercel_jwt");
  if (!bypass || !bypass.secure || bypass.domain.replace(/^\./, "") !== target.hostname) {
    throw new Error("origin-scoped Vercel bypass cookie was not established");
  }
}

export function collectBrowserLeaks(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.name));
  return { consoleErrors, pageErrors };
}

export async function denyAnalytics(page: Page) {
  const decline = page.getByRole("button", { name: "Decline analytics" });
  if (!(await decline.isVisible({ timeout: 1_000 }).catch(() => false))) return;
  try {
    await decline.click({ timeout: 5_000 });
  } catch (error) {
    if (await decline.isVisible({ timeout: 250 }).catch(() => false)) throw error;
  }
}

export async function expectNoGa(page: Page, requests: readonly string[]) {
  expect(requests).toEqual([]);
  const cookies = await page.context().cookies();
  expect(cookies.filter((cookie) => cookie.name === "_ga" || cookie.name.startsWith("_ga_"))).toEqual([]);
}

export async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

export async function expectNoBlockingAxeFindings(page: Page) {
  const result = await new AxeBuilder({ page }).analyze();
  const blocking = result.violations.filter((violation) =>
    violation.impact === "critical" || violation.impact === "serious" || violation.impact === "moderate",
  );
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
}

export async function stabilizeForScreenshot(page: Page) {
  await page.addStyleTag({ content: `
    *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }
    [aria-live] { transition: none !important; }
    body::before { display: none !important; mix-blend-mode: normal !important; }
    body > header { position: static !important; background: var(--paper) !important; backdrop-filter: none !important; }
  ` });
  await page.evaluate(async () => {
    await document.fonts.ready;
    scrollTo(0, 0);
  });
  await page.waitForTimeout(200);
}
