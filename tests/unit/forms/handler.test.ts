import { describe, expect, it, vi } from "vitest";
import type { FormEndpoint } from "../../../lib/forms/contracts";
import { MemoryIdempotencyStore } from "../../../lib/forms/idempotency";
import { handleFormRequest, type FormHandlerDependencies } from "../../../lib/forms/handler";
import { ProviderFault } from "../../../lib/forms/provider";

const origin = "https://www.thelioncompany.org";
const secret = "test-only-secret-with-more-than-thirty-two-characters";

function body(endpoint: FormEndpoint, submissionId = crypto.randomUUID()) {
  const shared = { submissionId, turnstileToken: "token", website: "" };
  if (endpoint === "newsletter") {
    return { ...shared, email: "person@example.org", consent: true, placement: "inline" };
  }
  if (endpoint === "prayer") {
    return {
      ...shared,
      displayName: "Ada",
      email: "ada@example.org",
      request: "Please pray for wisdom and peace this week.",
      followUpRequested: true,
    };
  }
  return {
    ...shared,
    name: "Ada",
    email: "ada@example.org",
    reason: "general",
    message: "I would like to ask a general ministry question.",
  };
}

function request(value: object, requestOrigin = origin) {
  return new Request(`${origin}/api/forms/test`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: requestOrigin },
    body: JSON.stringify(value),
  });
}

function dependencies() {
  const receipt = async () => ({ providerMessageId: "provider-message-1" });
  const logger = {
    log: vi.fn(),
    countPrayerAccepted: vi.fn(),
  };
  return {
    allowedOrigins: [origin] as const,
    deliveryMode: "live" as const,
    consentVersion: "2026-07-11",
    idempotencySecret: secret,
    now: () => new Date("2026-07-11T12:00:00.000Z"),
    turnstile: { verify: vi.fn(async () => ({ ok: true as const })) },
    idempotency: new MemoryIdempotencyStore(secret),
    provider: {
      requestNewsletter: vi.fn(receipt),
      deliverPrayer: vi.fn(receipt),
      deliverContact: vi.fn(receipt),
    },
    logger,
  } satisfies FormHandlerDependencies & {
    provider: FormHandlerDependencies["provider"] & {
      requestNewsletter: ReturnType<typeof vi.fn>;
      deliverPrayer: ReturnType<typeof vi.fn>;
      deliverContact: ReturnType<typeof vi.fn>;
    };
    logger: typeof logger;
  };
}

describe("handleFormRequest", () => {
  it("accepts only after provider acceptance and replays without a second provider call", async () => {
    const deps = dependencies();
    const value = body("newsletter");
    const first = await handleFormRequest(request(value), "newsletter", deps);
    const second = await handleFormRequest(request(value), "newsletter", deps);
    expect(first.status).toBe(202);
    expect(await first.json()).toMatchObject({ ok: true, replayed: false, message: "Check your email to confirm." });
    expect(await second.json()).toMatchObject({ ok: true, replayed: true });
    expect(deps.provider.requestNewsletter).toHaveBeenCalledTimes(1);
  });

  it("returns field errors without provider traffic", async () => {
    const deps = dependencies();
    const response = await handleFormRequest(
      request({ ...body("contact"), message: "short" }),
      "contact",
      deps,
    );
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      ok: false,
      code: "invalid_fields",
      fieldErrors: { message: expect.any(Array) },
    });
    expect(deps.provider.deliverContact).not.toHaveBeenCalled();
  });

  it("releases a provider failure for deliberate retry and never returns false success", async () => {
    const deps = dependencies();
    deps.provider.deliverPrayer.mockRejectedValueOnce(new ProviderFault());
    const value = body("prayer");
    const failed = await handleFormRequest(request(value), "prayer", deps);
    const retried = await handleFormRequest(request(value), "prayer", deps);
    expect(failed.status).toBe(503);
    expect(await failed.json()).toMatchObject({ ok: false, code: "provider_unavailable" });
    expect(retried.status).toBe(202);
    expect(deps.provider.deliverPrayer).toHaveBeenCalledTimes(2);
  });

  it("does not validate Turnstile or call provider for cross-origin input", async () => {
    const deps = dependencies();
    const response = await handleFormRequest(
      request(body("contact"), "https://attacker.test"),
      "contact",
      deps,
    );
    expect(response.status).toBe(403);
    expect(deps.turnstile.verify).not.toHaveBeenCalled();
    expect(deps.provider.deliverContact).not.toHaveBeenCalled();
  });

  it("logs only safe operational fields", async () => {
    const deps = dependencies();
    await handleFormRequest(request(body("prayer")), "prayer", deps);
    const serialized = JSON.stringify(deps.logger.log.mock.calls);
    expect(serialized).not.toContain("ada@example.org");
    expect(serialized).not.toContain("Please pray");
    expect(serialized).toMatch(/requestId/);
    expect(serialized).toMatch(/durationMs/);
  });
});
