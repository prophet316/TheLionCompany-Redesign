import { describe, expect, it } from "vitest";
import { getServerEnv } from "../../../lib/env";
import {
  contactSchema,
  newsletterSchema,
  prayerSchema,
} from "../../../lib/forms/contracts";

const base = {
  NODE_ENV: "test",
  VERCEL_ENV: "preview",
  VERCEL_URL: "immutable-preview.vercel.app",
  NEXT_PUBLIC_SITE_URL: "https://www.thelioncompany.org",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  NEXT_PUBLIC_FORM_MODE: "no-send",
  FORM_DELIVERY_MODE: "no-send",
  FORM_ALLOWED_ORIGINS:
    "http://localhost:3000,https://www.thelioncompany.org,https://preview.example.test",
  TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
  TURNSTILE_EXPECTED_HOSTNAMES: "localhost,www.thelioncompany.org,preview.example.test",
  FORM_IDEMPOTENCY_SECRET:
    "test-only-idempotency-secret-with-more-than-thirty-two-characters",
  BREVO_CONSENT_VERSION: "2026-07-11",
} as const;

describe("form contracts", () => {
  it("normalizes newsletter email and optional name", () => {
    const value = newsletterSchema.parse({
      submissionId: "9a7449c2-6a48-4970-92ea-6919a22e7f55",
      email: "  PERSON@Example.COM ",
      firstName: "  Ada  ",
      consent: true,
      placement: "inline",
      turnstileToken: "token",
      website: "",
    });
    expect(value.email).toBe("person@example.com");
    expect(value.firstName).toBe("Ada");
  });

  it("rejects missing consent, extra keys, and overlong email", () => {
    expect(() =>
      newsletterSchema.parse({
        submissionId: crypto.randomUUID(),
        email: `${"a".repeat(246)}@example.com`,
        consent: false,
        placement: "inline",
        turnstileToken: "token",
        website: "",
        role: "admin",
      }),
    ).toThrow();
    expect(
      newsletterSchema.safeParse({
        submissionId: crypto.randomUUID(),
        email: "person@example.org",
        consent: true,
        placement: "inline",
        turnstileToken: "token",
        website: "",
        role: "admin",
      }).success,
    ).toBe(false);
  });

  it("requires email only when prayer follow-up is requested", () => {
    expect(
      prayerSchema.safeParse({
        submissionId: crypto.randomUUID(),
        displayName: "",
        email: "",
        request: "Please pray for wisdom and peace this week.",
        followUpRequested: false,
        turnstileToken: "token",
        website: "",
      }).success,
    ).toBe(true);
    expect(
      prayerSchema.safeParse({
        submissionId: crypto.randomUUID(),
        displayName: "",
        email: "",
        request: "Please pray for wisdom and peace this week.",
        followUpRequested: true,
        turnstileToken: "token",
        website: "",
      }).success,
    ).toBe(false);
  });

  it("accepts only enumerated contact reasons and message length", () => {
    expect(
      contactSchema.safeParse({
        submissionId: crypto.randomUUID(),
        name: "Ada Lovelace",
        email: "ada@example.com",
        reason: "partnership",
        message: "I would like to discuss a ministry partnership.",
        turnstileToken: "token",
        website: "",
      }).success,
    ).toBe(true);
    expect(
      contactSchema.safeParse({
        submissionId: crypto.randomUUID(),
        name: "Ada Lovelace",
        email: "ada@example.com",
        reason: "sales",
        message: "I would like to discuss a ministry partnership.",
        turnstileToken: "token",
        website: "",
      }).success,
    ).toBe(false);
  });
});

describe("server environment", () => {
  it("allows no-send preview without provider credentials", () => {
    expect(getServerEnv(base).deliveryMode).toBe("no-send");
  });

  it("ignores unrelated platform variables while validating the declared form environment", () => {
    expect(getServerEnv({ ...base, VERCEL_GIT_COMMIT_SHA: "abc123", CI: "true" }).deliveryMode).toBe(
      "no-send",
    );
  });

  it("derives the immutable Vercel preview origin and Turnstile hostname", () => {
    const env = getServerEnv({
      ...base,
      FORM_ALLOWED_ORIGINS: "http://localhost:3000,https://www.thelioncompany.org",
      TURNSTILE_EXPECTED_HOSTNAMES: "localhost,www.thelioncompany.org",
    });
    expect(env.allowedOrigins).toContain("https://immutable-preview.vercel.app");
    expect(env.turnstileExpectedHostnames).toContain("immutable-preview.vercel.app");
    expect(env.siteUrl.toString()).toBe("https://immutable-preview.vercel.app/");
  });

  it("rejects a non-Vercel hostname presented as VERCEL_URL", () => {
    expect(() => getServerEnv({ ...base, VERCEL_URL: "attacker.example.org" })).toThrow(
      /VERCEL_URL must be a Vercel system hostname/,
    );
  });

  it("never trusts the generated Vercel hostname as a production browser origin", () => {
    const productionSource = {
      ...base,
      VERCEL_ENV: "production",
      VERCEL_URL: "production-generated.vercel.app",
      NEXT_PUBLIC_FORM_MODE: "live",
      FORM_DELIVERY_MODE: "live",
      FORM_ALLOWED_ORIGINS: "https://www.thelioncompany.org",
      TURNSTILE_EXPECTED_HOSTNAMES: "www.thelioncompany.org",
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "scoped-token",
      BREVO_API_KEY: "production-key-placeholder",
      BREVO_NEWSLETTER_LIST_ID: "12",
      BREVO_DOI_TEMPLATE_ID: "34",
      BREVO_SENDER_EMAIL: "forms@thelioncompany.org",
      BREVO_SENDER_NAME: "The Lion Company",
      FORM_PRAYER_RECIPIENT: "prayer@thelioncompany.org",
      FORM_CONTACT_RECIPIENT: "contact@thelioncompany.org",
      MAILBOX_PROVIDER_PUBLIC_NAME: "Restricted mailbox provider",
      MAILBOX_BACKUP_AND_DELETION_PUBLIC: "Mailbox trash and provider backups complete final deletion within the verified provider window.",
      BREVO_BACKUP_AND_DELETION_PUBLIC: "Brevo deletion and backup expiry follow the verified account retention window.",
      MARKETING_POSTAL_ADDRESS_VERIFIED: "true",
      DATA_STEWARD_NAME: "Authorized steward",
      MAILBOX_ADMIN_NAME: "Authorized administrator",
    };
    const env = getServerEnv(productionSource);
    expect(env.allowedOrigins).toEqual(["https://www.thelioncompany.org"]);
    expect(env.turnstileExpectedHostnames).toEqual(["www.thelioncompany.org"]);
    expect(() => getServerEnv({
      ...productionSource,
      FORM_ALLOWED_ORIGINS: "https://www.thelioncompany.org,https://extra.example.org",
      TURNSTILE_EXPECTED_HOSTNAMES: "www.thelioncompany.org,extra.example.org",
    })).toThrow(/production forms allow only the canonical origin and hostname/);
  });

  it("rejects live delivery outside production", () => {
    expect(() =>
      getServerEnv({
        ...base,
        NEXT_PUBLIC_FORM_MODE: "live",
        FORM_DELIVERY_MODE: "live",
      }),
    ).toThrow(/live delivery requires VERCEL_ENV=production/);
  });

  it("rejects mismatched public and server delivery modes", () => {
    expect(() =>
      getServerEnv({ ...base, NEXT_PUBLIC_FORM_MODE: "test-recipient" }),
    ).toThrow(/must match/);
  });
});
