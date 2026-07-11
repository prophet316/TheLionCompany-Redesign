import { describe, expect, it } from "vitest";
import {
  assertSafeHeader,
  deriveRequestIdentifier,
  escapeHtml,
  normalizeMultiline,
} from "../../../lib/forms/content";

describe("form content safety", () => {
  it("escapes every HTML metacharacter and preserves line meaning", () => {
    expect(escapeHtml(`<script>alert("x")</script> & 'quoted'`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;quoted&#39;",
    );
    expect(normalizeMultiline("one\r\ntwo\0three")).toBe("one\ntwothree");
  });

  it("rejects header control characters", () => {
    expect(() => assertSafeHeader("safe subject")).not.toThrow();
    expect(() => assertSafeHeader("safe\r\nBcc: attacker@example.test")).toThrow(/header controls/);
  });

  it("derives stable endpoint-scoped non-reversible identifiers", () => {
    const id = "9a7449c2-6a48-4970-92ea-6919a22e7f55";
    const secret = "test-only-secret-with-more-than-thirty-two-characters";
    expect(deriveRequestIdentifier("prayer", id, secret)).toMatch(/^P-[A-F0-9]{16}$/);
    expect(deriveRequestIdentifier("prayer", id, secret)).toBe(
      deriveRequestIdentifier("prayer", id, secret),
    );
    expect(deriveRequestIdentifier("prayer", id, secret)).not.toBe(
      deriveRequestIdentifier("contact", id, secret),
    );
    expect(deriveRequestIdentifier("prayer", id, secret)).not.toContain(id);
  });
});
