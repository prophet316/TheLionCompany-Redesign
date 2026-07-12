import { describe, expect, it } from "vitest";
import { readFormJson } from "../../../lib/forms/request";

const origin = "https://www.thelioncompany.org";
const body = { website: "", message: "safe" };

function request(overrides: {
  origin?: string | null;
  contentType?: string;
  body?: string;
  method?: string;
} = {}) {
  const headers = new Headers({
    "content-type": overrides.contentType ?? "application/json; charset=utf-8",
  });
  if (overrides.origin !== null) headers.set("origin", overrides.origin ?? origin);
  return new Request(`${origin}/api/forms/contact`, {
    method: overrides.method ?? "POST",
    headers,
    body: overrides.body ?? JSON.stringify(body),
  });
}

async function expectFault(promise: Promise<unknown>, code: string, status: number) {
  await expect(promise).rejects.toMatchObject({ code, status });
}

describe("readFormJson", () => {
  it("accepts exact origin and JSON with a charset", async () => {
    await expect(readFormJson(request(), [origin])).resolves.toEqual(body);
  });

  it("rejects missing and lookalike origins", async () => {
    await expectFault(readFormJson(request({ origin: null }), [origin]), "invalid_origin", 403);
    await expectFault(
      readFormJson(request({ origin: "https://www.thelioncompany.org.attacker.test" }), [origin]),
      "invalid_origin",
      403,
    );
  });

  it("rejects non-JSON, invalid JSON, and bodies over 16 KiB", async () => {
    await expectFault(
      readFormJson(request({ contentType: "text/plain" }), [origin]),
      "invalid_content_type",
      415,
    );
    await expectFault(readFormJson(request({ body: "{" }), [origin]), "invalid_json", 400);
    await expectFault(
      readFormJson(request({ body: JSON.stringify({ website: "", value: "x".repeat(16_384) }) }), [origin]),
      "body_too_large",
      413,
    );
  });

  it("rejects a filled honeypot before schema validation", async () => {
    await expectFault(
      readFormJson(request({ body: JSON.stringify({ website: "https://spam.test" }) }), [origin]),
      "bot_rejected",
      400,
    );
  });
});
