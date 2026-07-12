import { existsSync, readFileSync } from "node:fs";
import { teachings } from "@/content/teachings";
import { podcastFallback } from "@/content/podcast-fallback";
import { describe, expect, it } from "vitest";

const routes = [
  "app/page.tsx", "app/start-here/page.tsx", "app/live/page.tsx", "app/store/page.tsx",
  "app/give/page.tsx", "app/teachings/page.tsx", "app/teachings/[slug]/page.tsx",
  "app/podcast/page.tsx", "app/podcast/[slug]/page.tsx",
];

describe("server-rendered route shells", () => {
  it("creates every foundation route", () => {
    for (const route of routes) expect(existsSync(route), route).toBe(true);
  });

  it("preserves every meaningful legacy homepage fragment", () => {
    const home = readFileSync("app/page.tsx", "utf8");
    for (const id of ["mission", "podcast", "media", "prayer", "store", "contact", "newsletter"]) {
      expect(home).toContain(`id="${id}"`);
    }
  });

  it("has static detail data for every current archive record", () => {
    expect(teachings.map((item) => item.slug)).toHaveLength(32);
    expect(podcastFallback.map((item) => item.slug)).toHaveLength(7);
  });
});
