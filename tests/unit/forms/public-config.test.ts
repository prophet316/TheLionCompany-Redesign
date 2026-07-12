import { afterEach, describe, expect, it, vi } from "vitest";

describe("public form configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses safe no-send defaults when Vercel preview variables are absent", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_FORM_MODE", "");

    const { publicFormConfig } = await import("../../../lib/forms/public-config");

    expect(publicFormConfig).toEqual({
      turnstileSiteKey: "1x00000000000000000000AA",
      deliveryMode: "no-send",
    });
  });

  it("still requires explicit form configuration in production", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_FORM_MODE", "");

    await expect(import("../../../lib/forms/public-config")).rejects.toThrow(
      /NEXT_PUBLIC_TURNSTILE_SITE_KEY is required/,
    );
  });
});
