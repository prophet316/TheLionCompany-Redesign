import "server-only";
import { createHmac, randomUUID } from "node:crypto";
import type { Redis } from "@upstash/redis";
import type { FormEndpoint } from "./contracts";

const LOCK_TTL_SECONDS = 300;
const ACCEPTED_TTL_SECONDS = 86_400;

type Stored =
  | { status: "processing"; lockToken: string; startedAt: number }
  | { status: "accepted"; providerMessageId: string; acceptedAt: number };

export type IdempotencyClaim =
  | { state: "acquired"; key: string; lockValue: string }
  | { state: "accepted"; key: string; providerMessageId: string }
  | { state: "processing"; key: string };

type Acquired = Extract<IdempotencyClaim, { state: "acquired" }>;

export interface IdempotencyStore {
  claim(endpoint: FormEndpoint, submissionId: string): Promise<IdempotencyClaim>;
  accept(claim: Acquired, providerMessageId: string): Promise<void>;
  release(claim: Acquired): Promise<void>;
}

export function opaqueIdempotencyKey(
  endpoint: FormEndpoint,
  submissionId: string,
  secret: string,
): string {
  const digest = createHmac("sha256", secret)
    .update(`${endpoint}:${submissionId}`)
    .digest("hex");
  return `forms:v1:${digest}`;
}

function decode(value: string | null): Stored | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Stored;
    return parsed.status === "processing" || parsed.status === "accepted" ? parsed : null;
  } catch {
    return null;
  }
}

export class MemoryIdempotencyStore implements IdempotencyStore {
  private readonly values = new Map<string, { value: string; expiresAt: number }>();
  constructor(
    private readonly secret: string,
    private readonly now: () => number = Date.now,
  ) {}

  async claim(endpoint: FormEndpoint, submissionId: string): Promise<IdempotencyClaim> {
    const key = opaqueIdempotencyKey(endpoint, submissionId, this.secret);
    const current = this.values.get(key);
    if (current && current.expiresAt <= this.now()) this.values.delete(key);
    const stored = decode(this.values.get(key)?.value ?? null);
    if (stored?.status === "accepted") {
      return { state: "accepted", key, providerMessageId: stored.providerMessageId };
    }
    if (stored?.status === "processing") return { state: "processing", key };
    const lockValue = JSON.stringify({
      status: "processing",
      lockToken: randomUUID(),
      startedAt: this.now(),
    } satisfies Stored);
    this.values.set(key, { value: lockValue, expiresAt: this.now() + LOCK_TTL_SECONDS * 1_000 });
    return { state: "acquired", key, lockValue };
  }

  async accept(claim: Acquired, providerMessageId: string): Promise<void> {
    const current = this.values.get(claim.key);
    if (
      !current ||
      current.expiresAt <= this.now() ||
      current.value !== claim.lockValue
    ) {
      return;
    }
    const value = JSON.stringify({
      status: "accepted",
      providerMessageId,
      acceptedAt: this.now(),
    } satisfies Stored);
    this.values.set(claim.key, {
      value,
      expiresAt: this.now() + ACCEPTED_TTL_SECONDS * 1_000,
    });
  }

  async release(claim: Acquired): Promise<void> {
    if (this.values.get(claim.key)?.value === claim.lockValue) this.values.delete(claim.key);
  }
}

export class RedisIdempotencyStore implements IdempotencyStore {
  constructor(
    private readonly redis: Redis,
    private readonly secret: string,
    private readonly now: () => number = Date.now,
  ) {}

  async claim(endpoint: FormEndpoint, submissionId: string): Promise<IdempotencyClaim> {
    const key = opaqueIdempotencyKey(endpoint, submissionId, this.secret);
    const lockValue = JSON.stringify({
      status: "processing",
      lockToken: randomUUID(),
      startedAt: this.now(),
    } satisfies Stored);
    const acquired = await this.redis.set(key, lockValue, { nx: true, ex: LOCK_TTL_SECONDS });
    if (acquired === "OK") return { state: "acquired", key, lockValue };
    const stored = decode(await this.redis.get<string>(key));
    if (stored?.status === "accepted") {
      return { state: "accepted", key, providerMessageId: stored.providerMessageId };
    }
    return { state: "processing", key };
  }

  async accept(claim: Acquired, providerMessageId: string): Promise<void> {
    const value = JSON.stringify({
      status: "accepted",
      providerMessageId,
      acceptedAt: this.now(),
    } satisfies Stored);
    await this.redis.eval(
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('set', KEYS[1], ARGV[2], 'EX', ARGV[3]) else return false end",
      [claim.key],
      [claim.lockValue, value, String(ACCEPTED_TTL_SECONDS)],
    );
  }

  async release(claim: Acquired): Promise<void> {
    await this.redis.eval(
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
      [claim.key],
      [claim.lockValue],
    );
  }
}
