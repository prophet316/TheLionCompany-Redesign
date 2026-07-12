import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("experience to forms handoff", () => {
  it("renders the dedicated private prayer form", async () => {
    const source = await readFile(resolve("app/prayer/page.tsx"), "utf8");
    expect(source).toContain("PrayerForm");
    expect(source).toContain('placement="prayer"');
  });

  it("renders contact and permanent newsletter forms on connect", async () => {
    const source = await readFile(resolve("app/connect/page.tsx"), "utf8");
    expect(source).toContain("ContactForm");
    expect(source).toContain("NewsletterForm");
    expect(source).toContain('placement="connect"');
  });
});
