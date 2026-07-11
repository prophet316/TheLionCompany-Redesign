import { expect, test } from "@playwright/test";

test("home is semantic, canonical, and preserves legacy fragments", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveCount(1);
  // Next.js resolves root absolute URLs via result.origin (no trailing slash),
  // matching the approved slashless canonical host contract.
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://www.thelioncompany.org");
  for (const id of ["mission", "podcast", "media", "prayer", "store", "contact", "newsletter"]) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
  const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(() => JSON.parse(jsonLd ?? "")).not.toThrow();
});

test("legacy redirect is one hop and preserves query parameters", async ({ request }) => {
  const response = await request.get("/media.html?utm_source=legacy", { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toContain("/teachings");
  expect(response.headers().location).toContain("utm_source=legacy");
});

test("retired source artifacts are 410 while unknown paths are 404", async ({ request }) => {
  expect((await request.get("/generate_html.py")).status()).toBe(410);
  expect((await request.get("/never-recorded-as-a-real-page")).status()).toBe(404);
});

test("preview robots block crawling and technical resources respond", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Disallow: /");
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("https://www.thelioncompany.org/teachings");
  expect((await request.get("/manifest.webmanifest")).status()).toBe(200);
  expect((await request.get("/opengraph-image")).status()).toBe(200);
});

test("archive details are crawlable and do not embed inaccessible media", async ({ page }) => {
  await page.goto("/teachings/heart-over-hammer");
  await expect(page.getByRole("heading", { level: 1, name: "Heart over Hammer" })).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Watch directly on YouTube" })).toHaveAttribute("href", /zP4ZiKek3Lg/);
  await page.goto("/podcast/when-gods-will-doesnt-go-your-way");
  await expect(page.locator("audio")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Open this episode on Podbean" })).toBeVisible();
});
