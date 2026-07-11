import { describe, expect, it } from "vitest";
import { getServerEnv } from "../../../lib/env";

const common = {
  NODE_ENV: "test",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
  TURNSTILE_EXPECTED_HOSTNAMES: "localhost,the-lion-company-candidate-abc.vercel.app,www.thelioncompany.org",
  FORM_IDEMPOTENCY_SECRET: "release-origin-contract-secret-more-than-thirty-two-characters",
  BREVO_CONSENT_VERSION: "2026-07-11",
} as const;

describe("immutable preview Origin", () => {
  it("derives the exact HTTPS origin from validated VERCEL_URL in preview", () => {
    const env = getServerEnv({
      ...common,
      VERCEL_ENV: "preview",
      VERCEL_URL: "the-lion-company-candidate-abc.vercel.app",
      NEXT_PUBLIC_SITE_URL: "https://the-lion-company-candidate-abc.vercel.app",
      NEXT_PUBLIC_FORM_MODE: "no-send",
      FORM_DELIVERY_MODE: "no-send",
      FORM_ALLOWED_ORIGINS: "http://localhost:3000",
    });
    expect(env.allowedOrigins).toContain("https://the-lion-company-candidate-abc.vercel.app");
  });

  it("rejects a non-Vercel system hostname in preview", () => {
    expect(() => getServerEnv({
      ...common,
      VERCEL_ENV: "preview",
      VERCEL_URL: "attacker.example.org",
      NEXT_PUBLIC_SITE_URL: "https://attacker.example.org",
      NEXT_PUBLIC_FORM_MODE: "no-send",
      FORM_DELIVERY_MODE: "no-send",
      FORM_ALLOWED_ORIGINS: "http://localhost:3000",
    })).toThrow(/VERCEL_URL/);
  });

  it("never adds a preview origin in production", () => {
    const env = getServerEnv({
      ...common,
      VERCEL_ENV: "production",
      VERCEL_URL: "the-lion-company-candidate-abc.vercel.app",
      NEXT_PUBLIC_SITE_URL: "https://www.thelioncompany.org",
      NEXT_PUBLIC_FORM_MODE: "live",
      FORM_DELIVERY_MODE: "live",
      FORM_ALLOWED_ORIGINS: "https://www.thelioncompany.org",
      // Production Turnstile hostnames must be canonical-only (forms plan contract).
      TURNSTILE_EXPECTED_HOSTNAMES: "www.thelioncompany.org",
      UPSTASH_REDIS_REST_URL: "https://release-contract.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "synthetic-scoped-token",
      BREVO_API_KEY: "synthetic-provider-key",
      BREVO_NEWSLETTER_LIST_ID: "1",
      BREVO_DOI_TEMPLATE_ID: "1",
      BREVO_SENDER_EMAIL: "forms@example.org",
      BREVO_SENDER_NAME: "The Lion Company",
      FORM_PRAYER_RECIPIENT: "prayer@example.org",
      FORM_CONTACT_RECIPIENT: "contact@example.org",
      MAILBOX_PROVIDER_PUBLIC_NAME: "Restricted mailbox provider",
      MAILBOX_BACKUP_AND_DELETION_PUBLIC: "Verified mailbox backup and final-deletion timing.",
      BREVO_BACKUP_AND_DELETION_PUBLIC: "Verified Brevo backup and final-deletion timing.",
      MARKETING_POSTAL_ADDRESS_VERIFIED: "true",
      DATA_STEWARD_NAME: "Restricted role owner",
      MAILBOX_ADMIN_NAME: "Restricted role owner",
    });
    expect(env.allowedOrigins).toEqual(["https://www.thelioncompany.org"]);
  });
});
