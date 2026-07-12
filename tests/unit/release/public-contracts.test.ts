import { describe, expect, it } from "vitest";
import {
  assertCanonicalDocument,
  assertSecurityHeaders,
  extractSitemapUrls,
} from "../../../scripts/lib/public-contracts.mjs";

const canonical = "https://www.thelioncompany.org/teachings";
const document = `<!doctype html><html lang="en"><head>
  <title>Teachings | The Lion Company</title>
  <meta name="description" content="Jesus-centered teaching for real life.">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="Teachings | The Lion Company">
  <meta property="og:description" content="Jesus-centered teaching for real life.">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="https://www.thelioncompany.org/opengraph-image">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Teachings | The Lion Company">
  <meta name="twitter:description" content="Jesus-centered teaching for real life.">
  <meta name="twitter:image" content="https://www.thelioncompany.org/opengraph-image">
</head><body><main><h1>Teachings</h1><a href="/prayer">Prayer</a>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","url":"${canonical}"}</script>
</main></body></html>`;

describe("public release contracts", () => {
  it("requires one canonical, title, description, h1, and valid JSON-LD", () => {
    expect(assertCanonicalDocument(document, canonical)).toMatchObject({
      canonical,
      h1: "Teachings",
      schemaTypes: ["WebPage"],
    });
    expect(() => assertCanonicalDocument(document.replace("<h1>Teachings</h1>", ""), canonical)).toThrow(/one h1/);
    expect(() => assertCanonicalDocument(document.replace(canonical, `${canonical}?utm=test`), canonical)).toThrow(/canonical/);
    expect(() => assertCanonicalDocument(document.replace(/<script type="application\/ld\+json">.*?<\/script>/s, ""), canonical)).toThrow(/JSON-LD/);
  });

  it("extracts unique canonical sitemap URLs", () => {
    const xml = `<urlset><url><loc>https://www.thelioncompany.org/</loc></url><url><loc>${canonical}</loc></url></urlset>`;
    expect(extractSitemapUrls(xml)).toEqual(["https://www.thelioncompany.org/", canonical]);
  });

  it("keeps the sitemap root slash while requiring slashless home metadata", () => {
    const homeCanonical = "https://www.thelioncompany.org";
    const home = document
      .replaceAll(canonical, homeCanonical)
      .replace(
        '{"@context":"https://schema.org","@type":"WebPage","url":"https://www.thelioncompany.org"}',
        '[{"@context":"https://schema.org","@type":"Organization"},{"@context":"https://schema.org","@type":"WebSite"},{"@context":"https://schema.org","@type":"WebPage","url":"https://www.thelioncompany.org"}]',
      );
    expect(assertCanonicalDocument(home, homeCanonical)).toMatchObject({
      canonical: homeCanonical,
      schemaTypes: ["Organization", "WebSite", "WebPage"],
    });
  });

  it("distinguishes preview report-only and production enforcement", () => {
    const common = {
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
      "x-frame-options": "DENY",
      "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    };
    expect(() => assertSecurityHeaders(new Headers({
      ...common,
      "content-security-policy-report-only": "default-src 'self'; script-src 'self' 'sha256-test='; connect-src 'self' https://www.google-analytics.com; frame-src https://www.youtube-nocookie.com https://challenges.cloudflare.com",
    }), "preview")).not.toThrow();
    expect(() => assertSecurityHeaders(new Headers({
      ...common,
      "content-security-policy-report-only": "default-src 'self'; script-src 'self' 'sha256-test='; frame-src https://www.youtube-nocookie.com https://challenges.cloudflare.com",
      "content-security-policy": "default-src 'self'",
    }), "preview")).toThrow(/preview unexpectedly enforces CSP/);
    expect(() => assertSecurityHeaders(new Headers({
      ...common,
      "content-security-policy": "default-src 'self'; script-src 'self' 'sha256-test='; connect-src 'self' https://www.google-analytics.com; frame-src https://www.youtube-nocookie.com https://challenges.cloudflare.com",
      "strict-transport-security": "max-age=31536000",
    }), "production")).not.toThrow();
  });
});
