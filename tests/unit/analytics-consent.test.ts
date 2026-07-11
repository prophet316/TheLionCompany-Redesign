import { describe, expect, it, vi } from "vitest";
import { safeProperties } from "@/lib/analytics/contracts";
import {
  CONSENT_VERSION,
  readConsent,
  removeGaCookies,
} from "@/lib/analytics/consent";

describe("analytics consent", () => {
  it("treats absent, malformed, expired, and old-version values as denied", () => {
    expect(readConsent(null, Date.UTC(2026, 6, 11))).toBe("unknown");
    expect(readConsent("{", Date.UTC(2026, 6, 11))).toBe("unknown");
    expect(
      readConsent(
        JSON.stringify({
          state: "analytics-granted",
          version: CONSENT_VERSION - 1,
          decidedAt: "2026-07-10T00:00:00.000Z",
        }),
        Date.UTC(2026, 6, 11),
      ),
    ).toBe("unknown");
    expect(
      readConsent(
        JSON.stringify({
          state: "analytics-granted",
          version: CONSENT_VERSION,
          decidedAt: "2025-01-01T00:00:00.000Z",
        }),
        Date.UTC(2026, 6, 11),
      ),
    ).toBe("unknown");
  });

  it("removes every first-party _ga cookie", () => {
    const writes: string[] = [];
    const documentLike = {
      cookie: "_ga=one; _ga_MNK2G065ES=two; session=keep",
    };
    Object.defineProperty(documentLike, "cookie", {
      get: () => "_ga=one; _ga_MNK2G065ES=two; session=keep",
      set: vi.fn((value: string) => writes.push(value)),
      configurable: true,
    });
    removeGaCookies(documentLike as Document, "www.thelioncompany.org");
    expect(writes).toHaveLength(6);
    expect(writes.every((value) => value.includes("Max-Age=0"))).toBe(true);
    expect(writes.some((value) => value.includes("Domain=.www.thelioncompany.org"))).toBe(true);
    expect(writes.some((value) => value.includes("Domain=.thelioncompany.org"))).toBe(true);
  });

  it("rejects hostile or free-form values even when the property name is allowed", () => {
    expect(safeProperties("give_click", { target: "person@example.org", placement: "test" })).toBeNull();
    expect(safeProperties("newsletter_error", { placement: "inline", code: "raw provider error" })).toBeNull();
    expect(safeProperties("web_vital", { metric_name: "INP", metric_value_ms: 187, metric_rating: "good", page_group: "home" })).toEqual({ metric_name: "INP", metric_value_ms: 187, metric_rating: "good", page_group: "home" });
  });
});
