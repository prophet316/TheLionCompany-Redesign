import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

async function source(path: string) {
  return readFile(resolve(path), "utf8");
}

describe("legal and newsletter utility routes", () => {
  it("names every processor and exact retention boundary", async () => {
    const legal = await source("content/legal.ts");
    for (const name of [
      "Vercel",
      "Brevo",
      "Cloudflare Turnstile",
      "Google Analytics",
      "YouTube",
      "Printify",
      "Subsplash",
    ]) {
      expect(legal).toContain(name);
    }
    expect(legal).toContain("90 days");
    expect(legal).toContain("12 months after resolution");
    expect(legal).toContain("30 days");
    expect(legal).toContain("one month");
    expect(legal).toContain("Texas-based, serving globally");
    expect(legal).toContain("MAILBOX_BACKUP_AND_DELETION_PUBLIC");
    expect(legal).toContain("BREVO_BACKUP_AND_DELETION_PUBLIC");
    expect(legal).toContain("backup and final deletion");
  });

  it("makes every outcome noindex and marks only confirmed membership", async () => {
    const confirmed = await source("app/newsletter/confirmed/page.tsx");
    const expired = await source("app/newsletter/expired/page.tsx");
    const unsubscribed = await source("app/newsletter/unsubscribed/page.tsx");
    for (const page of [confirmed, expired, unsubscribed]) {
      expect(page).toContain("index: false");
      expect(page).toContain("follow: false");
    }
    expect(confirmed).toContain("NewsletterOutcomeMarker");
    expect(expired).not.toContain("NewsletterOutcomeMarker");
    expect(unsubscribed).not.toContain("NewsletterOutcomeMarker");
  });

  it("indexes legal and experience routes but not newsletter outcomes", async () => {
    const routes = await source("config/routes.ts");
    for (const route of ["/prayer", "/connect", "/privacy", "/terms", "/accessibility"]) {
      expect(routes).toContain(`"${route}"`);
    }
    expect(routes).not.toContain('"/newsletter/confirmed"');
    expect(routes).not.toContain('"/newsletter/expired"');
    expect(routes).not.toContain('"/newsletter/unsubscribed"');
  });

  it("renders the dedicated prayer journey with explicit privacy and emergency limits", async () => {
    const prayer = await source("app/prayer/page.tsx");
    expect(prayer).toContain("PrayerForm");
    expect(prayer).toContain('placement="prayer"');
    expect(prayer).toContain("restricted ministry mailbox");
    expect(prayer).toContain("published retention schedule");
  });

  it("keeps prayer retention on the page and privacy/emergency language only on the form", async () => {
    const page = await source("app/prayer/page.tsx");
    const form = await source("components/client/forms/prayer-form.tsx");

    // Page owns the single retention / mailbox statement.
    expect(page).toContain("restricted ministry mailbox");
    expect(page).toContain("published retention schedule");
    expect(page).not.toContain("not an emergency service");
    expect(page).not.toContain("local emergency services");

    // Form owns the single privacy / emergency statement (not weakened).
    expect(form).toContain("not continuously monitored");
    expect(form).toContain("not an emergency service");
    expect(form).toContain("local emergency services");
    expect(form).toContain("If you or someone else is in immediate danger");
    expect(form).not.toContain("restricted ministry mailbox");
    expect(form).not.toContain("published retention schedule");
  });
});
