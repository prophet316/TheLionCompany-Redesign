import "server-only";
import { z } from "zod";
import { deliveryModeSchema } from "./forms/contracts";

const optionalNonempty = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);
const optionalPositiveInt = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : Number(value)),
  z.number().int().positive().optional(),
);
const turnstileTestSiteKeys = new Set([
  "1x00000000000000000000AA",
  "2x00000000000000000000AB",
  "1x00000000000000000000BB",
  "2x00000000000000000000BB",
  "3x00000000000000000000FF",
]);
const turnstileTestSecretKeys = new Set([
  "1x0000000000000000000000000000000AA",
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA",
]);
const environmentSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    VERCEL_ENV: z.enum(["development", "preview", "production"]).default("development"),
    VERCEL_URL: optionalNonempty,
    NEXT_PUBLIC_SITE_URL: z.string().url(),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
    NEXT_PUBLIC_FORM_MODE: deliveryModeSchema,
    FORM_DELIVERY_MODE: deliveryModeSchema,
    FORM_ALLOWED_ORIGINS: z.string().min(1),
    TURNSTILE_SECRET_KEY: z.string().min(1),
    TURNSTILE_EXPECTED_HOSTNAMES: z.string().min(1),
    FORM_IDEMPOTENCY_SECRET: z.string().min(32),
    BREVO_CONSENT_VERSION: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    UPSTASH_REDIS_REST_URL: optionalNonempty,
    UPSTASH_REDIS_REST_TOKEN: optionalNonempty,
    BREVO_API_KEY: optionalNonempty,
    BREVO_NEWSLETTER_LIST_ID: optionalPositiveInt,
    BREVO_DOI_TEMPLATE_ID: optionalPositiveInt,
    BREVO_SENDER_EMAIL: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().email().optional(),
    ),
    BREVO_SENDER_NAME: optionalNonempty,
    FORM_PRAYER_RECIPIENT: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().email().optional(),
    ),
    FORM_CONTACT_RECIPIENT: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().email().optional(),
    ),
    FORM_TEST_RECIPIENT: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().email().optional(),
    ),
    MAILBOX_PROVIDER_PUBLIC_NAME: optionalNonempty,
    MAILBOX_BACKUP_AND_DELETION_PUBLIC: optionalNonempty,
    BREVO_BACKUP_AND_DELETION_PUBLIC: optionalNonempty,
    MARKETING_POSTAL_ADDRESS_VERIFIED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    DATA_STEWARD_NAME: optionalNonempty,
    MAILBOX_ADMIN_NAME: optionalNonempty,
  })
  .strip();

export type ServerEnv = ReturnType<typeof getServerEnv>;

function splitCsv(value: string): string[] {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

function exactOrigins(value: string): string[] {
  return splitCsv(value).map((candidate) => {
    const url = new URL(candidate);
    if (url.origin !== candidate || (url.protocol !== "https:" && url.hostname !== "localhost")) {
      throw new Error(`FORM_ALLOWED_ORIGINS contains a non-origin value: ${candidate}`);
    }
    return candidate;
  });
}

function exactHostnames(value: string): string[] {
  return splitCsv(value).map((candidate) => {
    if (!/^(localhost|[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?)$/i.test(candidate)) {
      throw new Error(`TURNSTILE_EXPECTED_HOSTNAMES contains an invalid hostname: ${candidate}`);
    }
    return candidate.toLowerCase();
  });
}

export function getServerEnv(source: NodeJS.ProcessEnv = process.env) {
  const value = environmentSchema.parse(source);
  const configuredOrigins = exactOrigins(value.FORM_ALLOWED_ORIGINS);
  const configuredHostnames = exactHostnames(value.TURNSTILE_EXPECTED_HOSTNAMES);
  let previewHostname: string | undefined;
  if (value.VERCEL_ENV === "preview" && value.VERCEL_URL) {
    const previewUrl = new URL(`https://${value.VERCEL_URL}`);
    if (
      !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.vercel\.app$/.test(value.VERCEL_URL) ||
      previewUrl.hostname !== value.VERCEL_URL.toLowerCase() ||
      previewUrl.pathname !== "/" ||
      previewUrl.search ||
      previewUrl.hash
    ) {
      throw new Error("VERCEL_URL must be a Vercel system hostname without a scheme or path");
    }
    previewHostname = previewUrl.hostname;
  }
  const allowedOrigins = [...new Set([
    ...configuredOrigins,
    ...(previewHostname ? [`https://${previewHostname}`] : []),
  ])];
  const turnstileExpectedHostnames = [...new Set([
    ...configuredHostnames,
    ...(previewHostname ? [previewHostname] : []),
  ])];
  if (value.NEXT_PUBLIC_FORM_MODE !== value.FORM_DELIVERY_MODE) {
    throw new Error("NEXT_PUBLIC_FORM_MODE and FORM_DELIVERY_MODE must match");
  }
  if (value.FORM_DELIVERY_MODE === "live" && value.VERCEL_ENV !== "production") {
    throw new Error("live delivery requires VERCEL_ENV=production");
  }
  if (value.VERCEL_ENV === "production" && value.FORM_DELIVERY_MODE !== "live") {
    throw new Error("production requires live form delivery");
  }
  if (
    value.VERCEL_ENV === "production" &&
    (turnstileTestSiteKeys.has(value.NEXT_PUBLIC_TURNSTILE_SITE_KEY) ||
      turnstileTestSecretKeys.has(value.TURNSTILE_SECRET_KEY))
  ) {
    throw new Error("production cannot use Turnstile test credentials");
  }
  if (
    value.VERCEL_ENV === "production" &&
    (value.NEXT_PUBLIC_SITE_URL !== "https://www.thelioncompany.org" ||
      allowedOrigins.length !== 1 ||
      allowedOrigins[0] !== "https://www.thelioncompany.org" ||
      turnstileExpectedHostnames.length !== 1 ||
      turnstileExpectedHostnames[0] !== "www.thelioncompany.org")
  ) {
    throw new Error("production forms allow only the canonical origin and hostname");
  }
  const providerFields = [
    value.UPSTASH_REDIS_REST_URL,
    value.UPSTASH_REDIS_REST_TOKEN,
    value.BREVO_API_KEY,
    value.BREVO_NEWSLETTER_LIST_ID,
    value.BREVO_DOI_TEMPLATE_ID,
    value.BREVO_SENDER_EMAIL,
    value.BREVO_SENDER_NAME,
  ];
  if (value.FORM_DELIVERY_MODE !== "no-send" && providerFields.some((item) => !item)) {
    throw new Error("test-recipient and live delivery require Redis and Brevo configuration");
  }
  if (value.FORM_DELIVERY_MODE === "test-recipient" && !value.FORM_TEST_RECIPIENT) {
    throw new Error("test-recipient delivery requires FORM_TEST_RECIPIENT");
  }
  if (
    value.FORM_DELIVERY_MODE === "live" &&
    (!value.FORM_PRAYER_RECIPIENT ||
      !value.FORM_CONTACT_RECIPIENT ||
      !value.MAILBOX_PROVIDER_PUBLIC_NAME ||
      !value.MAILBOX_BACKUP_AND_DELETION_PUBLIC ||
      !value.BREVO_BACKUP_AND_DELETION_PUBLIC ||
      !value.MARKETING_POSTAL_ADDRESS_VERIFIED ||
      !value.DATA_STEWARD_NAME ||
      !value.MAILBOX_ADMIN_NAME)
  ) {
    throw new Error("live delivery requires mailbox, legal, and named-owner gates");
  }
  return Object.freeze({
    nodeEnv: value.NODE_ENV,
    vercelEnv: value.VERCEL_ENV,
    siteUrl: new URL(previewHostname ? `https://${previewHostname}` : value.NEXT_PUBLIC_SITE_URL),
    deliveryMode: value.FORM_DELIVERY_MODE,
    allowedOrigins,
    turnstileSecretKey: value.TURNSTILE_SECRET_KEY,
    turnstileExpectedHostnames,
    idempotencySecret: value.FORM_IDEMPOTENCY_SECRET,
    consentVersion: value.BREVO_CONSENT_VERSION,
    redisUrl: value.UPSTASH_REDIS_REST_URL,
    redisToken: value.UPSTASH_REDIS_REST_TOKEN,
    brevoApiKey: value.BREVO_API_KEY,
    newsletterListId: value.BREVO_NEWSLETTER_LIST_ID,
    doiTemplateId: value.BREVO_DOI_TEMPLATE_ID,
    senderEmail: value.BREVO_SENDER_EMAIL,
    senderName: value.BREVO_SENDER_NAME,
    prayerRecipient: value.FORM_PRAYER_RECIPIENT,
    contactRecipient: value.FORM_CONTACT_RECIPIENT,
    testRecipient: value.FORM_TEST_RECIPIENT,
    mailboxProviderName: value.MAILBOX_PROVIDER_PUBLIC_NAME,
    mailboxBackupAndDeletionPublic: value.MAILBOX_BACKUP_AND_DELETION_PUBLIC,
    brevoBackupAndDeletionPublic: value.BREVO_BACKUP_AND_DELETION_PUBLIC,
    dataStewardName: value.DATA_STEWARD_NAME,
    mailboxAdminName: value.MAILBOX_ADMIN_NAME,
  });
}
