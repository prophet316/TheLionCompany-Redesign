import { describe, expect, it, vi } from "vitest";
import { createTurnstileVerifier } from "../../../lib/forms/turnstile";

const submissionId = "9a7449c2-6a48-4970-92ea-6919a22e7f55";

function verifier(response: object) {
  const fetcher = vi.fn(async () =>
    new Response(JSON.stringify(response), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
  return {
    fetcher,
    verifier: createTurnstileVerifier({
      secret: "test-secret",
      hostnames: ["www.thelioncompany.org"],
      fetcher,
    }),
  };
}

describe("Turnstile verifier", () => {
  it("accepts Cloudflare's documented always-pass response only with the test secret", async () => {
    const fetcher = vi.fn(async () =>
      Response.json({
        success: true,
        hostname: "localhost",
        action: "test",
        "error-codes": [],
      }),
    );
    const testVerifier = createTurnstileVerifier({
      secret: "1x0000000000000000000000000000000AA",
      hostnames: ["preview.example.test"],
      fetcher,
    });

    await expect(
      testVerifier.verify({ token: "XXXX.DUMMY.TOKEN.XXXX", action: "prayer_submit", submissionId }),
    ).resolves.toEqual({ ok: true });
  });

  it("accepts Cloudflare's live dummy response shape with the test secret", async () => {
    const fetcher = vi.fn(async () =>
      Response.json({
        success: true,
        hostname: "example.com",
        "error-codes": [],
      }),
    );
    const testVerifier = createTurnstileVerifier({
      secret: "1x0000000000000000000000000000000AA",
      hostnames: ["preview.example.test"],
      fetcher,
    });

    await expect(
      testVerifier.verify({ token: "XXXX.DUMMY.TOKEN.XXXX", action: "prayer_submit", submissionId }),
    ).resolves.toEqual({ ok: true });
  });

  it("sends no remote IP and validates action, hostname, and idempotency key", async () => {
    const fixture = verifier({
      success: true,
      hostname: "www.thelioncompany.org",
      action: "prayer_submit",
      "error-codes": [],
    });
    await expect(
      fixture.verifier.verify({ token: "token", action: "prayer_submit", submissionId }),
    ).resolves.toEqual({ ok: true });
    const call = fixture.fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(call[1].body))).toEqual({
      secret: "test-secret",
      response: "token",
      idempotency_key: submissionId,
    });
  });

  it("rejects action and hostname mismatches", async () => {
    for (const response of [
      { success: true, hostname: "attacker.test", action: "prayer_submit", "error-codes": [] },
      { success: true, hostname: "www.thelioncompany.org", action: "contact_submit", "error-codes": [] },
    ]) {
      const fixture = verifier(response);
      await expect(
        fixture.verifier.verify({ token: "token", action: "prayer_submit", submissionId }),
      ).resolves.toEqual({ ok: false, code: "turnstile_failed" });
    }
  });

  it("maps timeout-or-duplicate to an expiring/resettable result", async () => {
    const fixture = verifier({
      success: false,
      hostname: "www.thelioncompany.org",
      action: "prayer_submit",
      "error-codes": ["timeout-or-duplicate"],
    });
    await expect(
      fixture.verifier.verify({ token: "token", action: "prayer_submit", submissionId }),
    ).resolves.toEqual({ ok: false, code: "turnstile_expired" });
  });
});
