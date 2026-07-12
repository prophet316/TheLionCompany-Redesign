import { podcastFallback } from "@/content/podcast-fallback";
import { teachings } from "@/content/teachings";
import { indexableStaticRoutes } from "@/config/routes";
import manifest from "@/app/manifest";
import { createRobots } from "@/app/robots";
import { createSitemap } from "@/app/sitemap";
import { describe, expect, it } from "vitest";

describe("technical SEO resources", () => {
  it("allows canonical production crawling and blocks previews", () => {
    expect(createRobots(true)).toMatchObject({ host: "https://www.thelioncompany.org", sitemap: "https://www.thelioncompany.org/sitemap.xml" });
    expect(createRobots(false)).toMatchObject({ rules: { userAgent: "*", disallow: "/" } });
  });

  it("lists every and only implemented canonical indexable route", () => {
    const sitemap = createSitemap(podcastFallback);
    const urls = sitemap.map((entry) => entry.url);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toHaveLength(indexableStaticRoutes.length + teachings.length + podcastFallback.length);
    expect(urls.every((url) => url.startsWith("https://www.thelioncompany.org/"))).toBe(true);
    expect(urls.some((url) => url.includes("/newsletter/"))).toBe(false);
  });

  it("publishes the Gathering manifest colors and generated icon", () => {
    expect(manifest()).toMatchObject({ name: "The Lion Company", theme_color: "#24151f", background_color: "#f3e9d7" });
    expect(manifest().icons).toContainEqual({ src: "/icon", sizes: "32x32", type: "image/png" });
  });
});
