import { describe, expect, it } from "vitest";
import {
  parseCspHashManifest,
  securityHeaderRules,
  securityHeaders,
} from "../../config/security-headers";

function map(headers: Array<{ key: string; value: string }>) {
  return new Map(headers.map((header) => [header.key, header.value]));
}

describe("security headers", () => {
  it("uses report-only CSP on preview without HSTS", () => {
    const headers = map(securityHeaders({ production: false, hashes: ["'sha256-testhash='"] }));
    expect(headers.has("Content-Security-Policy-Report-Only")).toBe(true);
    expect(headers.get("Content-Security-Policy-Report-Only")).not.toContain("upgrade-insecure-requests");
    expect(headers.has("Content-Security-Policy")).toBe(false);
    expect(headers.has("Strict-Transport-Security")).toBe(false);
  });

  it("enforces exact production protections and keeps Brevo server-only", () => {
    const headers = map(securityHeaders({ production: true, hashes: ["'sha256-testhash='"] }));
    const csp = headers.get("Content-Security-Policy") ?? "";
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'sha256-testhash='");
    expect(csp).toContain("https://www.googletagmanager.com");
    expect(csp).toContain("https://challenges.cloudflare.com");
    expect(csp).toContain("frame-src https://www.youtube-nocookie.com https://challenges.cloudflare.com");
    expect(csp).toContain("media-src 'self'");
    expect(csp).not.toContain("ytimg.com");
    expect(csp).not.toContain("mcdn.podbean.com");
    expect(csp).not.toContain("brevo");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toMatch(/\s\*\s/);
    expect(headers.get("Strict-Transport-Security")).toBe("max-age=31536000");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Permissions-Policy")).toBe(
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    );
  });

  it("refuses production enforcement without generated hashes", () => {
    expect(() => securityHeaders({ production: true, hashes: [] })).toThrow(/CSP hashes/);
  });

  it("scopes inline hashes to each route and keeps every policy bounded", () => {
    const manifest = parseCspHashManifest({
      version: 1,
      routes: {
        "/": ["'sha256-home='"],
        "/give": ["'sha256-give='"],
      },
      fallback: ["'sha256-not-found='"],
    });
    expect(manifest).not.toBeNull();
    const rules = securityHeaderRules({ production: true, manifest });
    const policy = (source: string) =>
      map(rules.find((rule) => rule.source === source)!.headers).get(
        "Content-Security-Policy",
      ) ?? "";
    expect(policy("/(.*)")).toContain("'sha256-not-found='");
    expect(policy("/")).toContain("'sha256-home='");
    expect(policy("/")).not.toContain("'sha256-give='");
    expect(policy("/give")).toContain("'sha256-give='");
    expect(policy("/give")).not.toContain("'sha256-home='");
    expect(Math.max(...rules.map((rule) => policy(rule.source).length))).toBeLessThan(8_192);
  });
});
