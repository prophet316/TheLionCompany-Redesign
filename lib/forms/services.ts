import "server-only";
import { BrevoClient } from "@getbrevo/brevo";
import { Redis } from "@upstash/redis";
import { getServerEnv } from "../env";
import { BrevoFormProvider } from "./brevo";
import type { FormHandlerDependencies } from "./handler";
import { MemoryIdempotencyStore, RedisIdempotencyStore } from "./idempotency";
import { safeFormLogger } from "./logger";
import { NoSendFormProvider } from "./no-send";
import { createTurnstileVerifier } from "./turnstile";

let cached: FormHandlerDependencies | undefined;

export function getFormServices(): FormHandlerDependencies {
  if (cached) return cached;
  const env = getServerEnv();
  const turnstile = createTurnstileVerifier({
    secret: env.turnstileSecretKey,
    hostnames: env.turnstileExpectedHostnames,
  });
  if (env.deliveryMode === "no-send") {
    cached = {
      allowedOrigins: env.allowedOrigins,
      deliveryMode: env.deliveryMode,
      consentVersion: env.consentVersion,
      idempotencySecret: env.idempotencySecret,
      now: () => new Date(),
      turnstile,
      idempotency: new MemoryIdempotencyStore(env.idempotencySecret),
      provider: new NoSendFormProvider(),
      logger: safeFormLogger,
    };
    return cached;
  }
  if (
    !env.redisUrl ||
    !env.redisToken ||
    !env.brevoApiKey ||
    !env.newsletterListId ||
    !env.doiTemplateId ||
    !env.senderEmail ||
    !env.senderName
  ) {
    throw new Error("validated provider configuration is unavailable");
  }
  const redis = new Redis({
    url: env.redisUrl,
    token: env.redisToken,
    automaticDeserialization: false,
  });
  const brevo = new BrevoClient({
    apiKey: env.brevoApiKey,
    maxRetries: 1,
    timeoutInSeconds: 8,
  });
  const testRecipient = env.testRecipient;
  cached = {
    allowedOrigins: env.allowedOrigins,
    deliveryMode: env.deliveryMode,
    consentVersion: env.consentVersion,
    idempotencySecret: env.idempotencySecret,
    now: () => new Date(),
    turnstile,
    idempotency: new RedisIdempotencyStore(redis, env.idempotencySecret),
    provider: new BrevoFormProvider(brevo, {
      mode: env.deliveryMode,
      siteUrl: env.siteUrl,
      newsletterListId: env.newsletterListId,
      doiTemplateId: env.doiTemplateId,
      sender: { email: env.senderEmail, name: env.senderName },
      prayerRecipient: env.prayerRecipient ?? testRecipient ?? "",
      contactRecipient: env.contactRecipient ?? testRecipient ?? "",
      testRecipient,
    }),
    logger: safeFormLogger,
  };
  return cached;
}
