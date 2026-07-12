import "server-only";
import { z } from "zod";
import type { TurnstileAction } from "./contracts";

const responseSchema = z.object({
  success: z.boolean(),
  hostname: z.string().optional(),
  action: z.string().optional(),
  "error-codes": z.array(z.string()).default([]),
});

const alwaysPassTestSecret = "1x0000000000000000000000000000000AA";

export interface TurnstileVerifier {
  verify(input: {
    token: string;
    action: TurnstileAction;
    submissionId: string;
  }): Promise<
    | { ok: true }
    | { ok: false; code: "turnstile_failed" | "turnstile_expired" }
  >;
}

export function createTurnstileVerifier(config: {
  secret: string;
  hostnames: readonly string[];
  fetcher?: typeof fetch;
}): TurnstileVerifier {
  const fetcher = config.fetcher ?? fetch;
  const usesAlwaysPassTestSecret = config.secret === alwaysPassTestSecret;
  return {
    async verify(input) {
      try {
        const response = await fetcher(
          "https://challenges.cloudflare.com/turnstile/v0/siteverify",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              secret: config.secret,
              response: input.token,
              idempotency_key: input.submissionId,
            }),
            signal: AbortSignal.timeout(4_000),
          },
        );
        if (!response.ok) return { ok: false, code: "turnstile_failed" };
        const parsed = responseSchema.safeParse(await response.json());
        if (!parsed.success) return { ok: false, code: "turnstile_failed" };
        if (parsed.data["error-codes"].includes("timeout-or-duplicate")) {
          return { ok: false, code: "turnstile_expired" };
        }
        if (
          !parsed.data.success ||
          (!usesAlwaysPassTestSecret &&
            (!parsed.data.hostname ||
              !config.hostnames.includes(parsed.data.hostname) ||
              parsed.data.action !== input.action))
        ) {
          return { ok: false, code: "turnstile_failed" };
        }
        return { ok: true };
      } catch {
        return { ok: false, code: "turnstile_failed" };
      }
    },
  };
}
