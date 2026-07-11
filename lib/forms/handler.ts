import "server-only";
import { randomUUID } from "node:crypto";
import {
  contactSchema,
  newsletterSchema,
  prayerSchema,
  type DeliveryMode,
  type FormEndpoint,
  type FormSubmitResult,
  type TurnstileAction,
} from "./contracts";
import { deriveRequestIdentifier } from "./content";
import { FormFault, toErrorResult } from "./errors";
import type { IdempotencyStore } from "./idempotency";
import type { SafeFormLogger } from "./logger";
import type { FormDeliveryProvider, ProviderReceipt } from "./provider";
import { ProviderFault } from "./provider";
import { readFormJson } from "./request";
import type { TurnstileVerifier } from "./turnstile";

const actionByEndpoint: Record<FormEndpoint, TurnstileAction> = {
  newsletter: "newsletter_submit",
  prayer: "prayer_submit",
  contact: "contact_submit",
};

export type FormHandlerDependencies = {
  allowedOrigins: readonly string[];
  deliveryMode: DeliveryMode;
  consentVersion: string;
  idempotencySecret: string;
  now: () => Date;
  turnstile: TurnstileVerifier;
  idempotency: IdempotencyStore;
  provider: FormDeliveryProvider;
  logger: SafeFormLogger;
};

function acceptedMessage(endpoint: FormEndpoint, mode: DeliveryMode): string {
  if (mode === "no-send") return "Preview test accepted — no message was sent.";
  if (mode === "test-recipient") return "Preview test accepted and routed to the restricted test recipient.";
  if (endpoint === "newsletter") return "Check your email to confirm.";
  if (endpoint === "prayer") return "Your prayer request was delivered.";
  return "Your message was delivered.";
}

function json(result: FormSubmitResult, status: number, requestId: string): Response {
  return Response.json(result, {
    status,
    headers: {
      "cache-control": "no-store, max-age=0",
      "x-request-id": requestId,
      "x-content-type-options": "nosniff",
    },
  });
}

function fieldErrorsFromZod(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  const flattened = error.flatten().fieldErrors;
  const fieldErrors: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(flattened)) {
    if (messages?.length) fieldErrors[key] = messages;
  }
  return fieldErrors;
}

export async function handleFormRequest(
  request: Request,
  endpoint: FormEndpoint,
  dependencies: FormHandlerDependencies,
): Promise<Response> {
  const started = performance.now();
  const requestId = randomUUID();
  let status = 500;
  let errorClass: FormFault["code"] | undefined;
  let acquired: Extract<Awaited<ReturnType<IdempotencyStore["claim"]>>, { state: "acquired" }> | undefined;
  try {
    const raw = await readFormJson(request, dependencies.allowedOrigins);
    const schema =
      endpoint === "newsletter" ? newsletterSchema : endpoint === "prayer" ? prayerSchema : contactSchema;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      throw new FormFault("invalid_fields", 422, false, fieldErrorsFromZod(parsed.error));
    }
    const verified = await dependencies.turnstile.verify({
      token: parsed.data.turnstileToken,
      action: actionByEndpoint[endpoint],
      submissionId: parsed.data.submissionId,
    });
    if (!verified.ok) {
      throw new FormFault(verified.code, 400, true);
    }
    const claim = await dependencies.idempotency.claim(endpoint, parsed.data.submissionId);
    if (claim.state === "accepted") {
      status = 202;
      return json(
        {
          ok: true,
          status: "accepted",
          submissionId: parsed.data.submissionId,
          deliveryMode: dependencies.deliveryMode,
          replayed: true,
          message: acceptedMessage(endpoint, dependencies.deliveryMode),
        },
        status,
        requestId,
      );
    }
    if (claim.state === "processing") {
      throw new FormFault("already_processing", 409, true);
    }
    acquired = claim;
    let receipt: ProviderReceipt;
    if (endpoint === "newsletter") {
      const value = newsletterSchema.parse(parsed.data);
      receipt = await dependencies.provider.requestNewsletter({
        submissionId: value.submissionId,
        email: value.email,
        firstName: value.firstName,
        placement: value.placement,
        consentVersion: dependencies.consentVersion,
        consentTimestamp: dependencies.now().toISOString(),
      });
    } else if (endpoint === "prayer") {
      const value = prayerSchema.parse(parsed.data);
      receipt = await dependencies.provider.deliverPrayer({
        submissionId: value.submissionId,
        requestIdentifier: deriveRequestIdentifier("prayer", value.submissionId, dependencies.idempotencySecret),
        displayName: value.displayName,
        email: value.email,
        request: value.request,
        followUpRequested: value.followUpRequested,
      });
    } else {
      const value = contactSchema.parse(parsed.data);
      receipt = await dependencies.provider.deliverContact({
        submissionId: value.submissionId,
        requestIdentifier: deriveRequestIdentifier("contact", value.submissionId, dependencies.idempotencySecret),
        name: value.name,
        email: value.email,
        reason: value.reason,
        message: value.message,
      });
    }
    await dependencies.idempotency.accept(acquired, receipt.providerMessageId);
    if (endpoint === "prayer") {
      dependencies.logger.countPrayerAccepted(dependencies.now().toISOString().slice(0, 10));
    }
    status = 202;
    return json(
      {
        ok: true,
        status: "accepted",
        submissionId: parsed.data.submissionId,
        deliveryMode: dependencies.deliveryMode,
        replayed: false,
        message: acceptedMessage(endpoint, dependencies.deliveryMode),
      },
      status,
      requestId,
    );
  } catch (error) {
    if (acquired) await dependencies.idempotency.release(acquired);
    const fault =
      error instanceof FormFault
        ? error
        : error instanceof ProviderFault
          ? new FormFault("provider_unavailable", 503, true)
          : new FormFault("configuration_error", 503, true);
    status = fault.status;
    errorClass = fault.code;
    return json(toErrorResult(fault), status, requestId);
  } finally {
    dependencies.logger.log({
      requestId,
      endpoint,
      status,
      durationMs: Math.round(performance.now() - started),
      ...(errorClass ? { errorClass } : {}),
    });
  }
}
