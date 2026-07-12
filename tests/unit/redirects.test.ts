import { legacyRouteLedger } from "@/config/redirects";
import { getLegacyOutcome, renderGoneHtml, toNextRedirects } from "@/lib/redirects";
import { describe, expect, it } from "vitest";

describe("legacy route ledger", () => {
  it("maps every equivalent route directly to its canonical target", () => {
    const redirects = toNextRedirects(legacyRouteLedger);
    expect(redirects).toContainEqual({ source: "/index.html", destination: "/", permanent: true });
    expect(redirects).toContainEqual({ source: "/MEDIA.HTML", destination: "/teachings", permanent: true });
    expect(redirects).toContainEqual({ source: "/product-page/the-lion-company-t-shirt", destination: "/store", permanent: true });
    expect(redirects.every((rule) => !rule.destination.includes("?"))).toBe(true);
  });

  it("distinguishes finite retired artifacts from unknown routes", () => {
    expect(getLegacyOutcome("/generate_html.py")?.statusCode).toBe(410);
    expect(getLegacyOutcome("/a-page-that-never-existed")).toBeUndefined();
    expect(renderGoneHtml("/generate_html.py")).toContain("This retired source artifact is no longer published");
  });
});
