import { describe, expect, it } from "vitest";
import {
  MemoryIdempotencyStore,
  opaqueIdempotencyKey,
} from "../../../lib/forms/idempotency";

const id = "9a7449c2-6a48-4970-92ea-6919a22e7f55";
const secret = "test-only-secret-with-more-than-thirty-two-characters";

describe("idempotency store", () => {
  it("uses an opaque endpoint-scoped key", () => {
    const key = opaqueIdempotencyKey("prayer", id, secret);
    expect(key).toMatch(/^forms:v1:[a-f0-9]{64}$/);
    expect(key).not.toContain(id);
    expect(key).not.toBe(opaqueIdempotencyKey("contact", id, secret));
  });

  it("allows one concurrent owner, replays accepted results, and expires in 24 hours", async () => {
    let now = 1_000;
    const store = new MemoryIdempotencyStore(secret, () => now);
    const [first, second] = await Promise.all([
      store.claim("prayer", id),
      store.claim("prayer", id),
    ]);
    const acquired = [first, second].find((claim) => claim.state === "acquired");
    const processing = [first, second].find((claim) => claim.state === "processing");
    expect(acquired?.state).toBe("acquired");
    expect(processing?.state).toBe("processing");
    if (!acquired || acquired.state !== "acquired") throw new Error("missing acquired claim");
    await store.accept(acquired, "provider-message-1");
    await expect(store.claim("prayer", id)).resolves.toMatchObject({
      state: "accepted",
      providerMessageId: "provider-message-1",
    });
    now += 86_400_001;
    await expect(store.claim("prayer", id)).resolves.toMatchObject({ state: "acquired" });
  });

  it("releases a rejected provider attempt and recovers an indeterminate crash after five minutes", async () => {
    let now = 10_000;
    const store = new MemoryIdempotencyStore(secret, () => now);
    const first = await store.claim("contact", id);
    if (first.state !== "acquired") throw new Error("missing first claim");
    await store.release(first);
    await expect(store.claim("contact", id)).resolves.toMatchObject({ state: "acquired" });

    const crashStore = new MemoryIdempotencyStore(secret, () => now);
    await crashStore.claim("contact", id);
    now += 300_001;
    await expect(crashStore.claim("contact", id)).resolves.toMatchObject({ state: "acquired" });
  });

  it("never lets a stale owner overwrite a replacement lock", async () => {
    let now = 20_000;
    const store = new MemoryIdempotencyStore(secret, () => now);
    const stale = await store.claim("prayer", id);
    if (stale.state !== "acquired") throw new Error("missing stale claim");
    now += 300_001;
    const replacement = await store.claim("prayer", id);
    if (replacement.state !== "acquired") throw new Error("missing replacement claim");

    await store.accept(stale, "stale-provider-message");
    await expect(store.claim("prayer", id)).resolves.toMatchObject({ state: "processing" });

    await store.accept(replacement, "replacement-provider-message");
    await expect(store.claim("prayer", id)).resolves.toMatchObject({
      state: "accepted",
      providerMessageId: "replacement-provider-message",
    });
  });
});
