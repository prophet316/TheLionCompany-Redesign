import {
  beginVisit,
  parsePromptRecord,
  suppressPrompt,
  type PromptKind,
  type PromptRecord,
} from "./model";

export const PROMPT_STORAGE_KEY = "tlc:prompts:v1";
const PROMPT_CLAIM_LEASE_KEY = PROMPT_STORAGE_KEY + ":claim-lease";
const CLAIM_SETTLE_MS = 75;

export function readPromptRecord(now = Date.now()) {
  return parsePromptRecord(localStorage.getItem(PROMPT_STORAGE_KEY), now);
}

export function writePromptRecord(record: PromptRecord) {
  localStorage.setItem(PROMPT_STORAGE_KEY, JSON.stringify(record));
}

export function openVisit(now = Date.now()) {
  const record = beginVisit(readPromptRecord(now), now, crypto.randomUUID());
  writePromptRecord(record);
  return record;
}

function commitPromptClaim(kind: PromptKind, now: number, token: string) {
  const record = readPromptRecord(now);
  if (record.claim?.visitId === record.visitId) return false;
  writePromptRecord({ ...record, claim: { visitId: record.visitId, kind, token, claimedAt: now } });
  return readPromptRecord(now).claim?.token === token;
}

async function claimWithStorageLease(kind: PromptKind, now: number) {
  const token = crypto.randomUUID();
  const lease = JSON.stringify({ token, expiresAt: now + 2_000 });
  localStorage.setItem(PROMPT_CLAIM_LEASE_KEY, lease);
  await new Promise<void>((resolve) => {
    setTimeout(resolve, CLAIM_SETTLE_MS);
  });
  const current = JSON.parse(localStorage.getItem(PROMPT_CLAIM_LEASE_KEY) ?? "null") as { token?: string; expiresAt?: number } | null;
  if (!current || current.token !== token || !current.expiresAt || current.expiresAt < Date.now()) return false;
  try {
    return commitPromptClaim(kind, Date.now(), token);
  } finally {
    const owner = JSON.parse(localStorage.getItem(PROMPT_CLAIM_LEASE_KEY) ?? "null") as { token?: string } | null;
    if (owner?.token === token) localStorage.removeItem(PROMPT_CLAIM_LEASE_KEY);
  }
}

export async function claimPrompt(kind: PromptKind, now = Date.now()) {
  const attempt = () => {
    const token = crypto.randomUUID();
    return commitPromptClaim(kind, now, token);
  };
  try {
    const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
    if (locks && typeof locks.request === "function") {
      return locks.request(PROMPT_STORAGE_KEY + ":claim", { ifAvailable: true }, (lock) => (lock ? attempt() : false));
    }
    return claimWithStorageLease(kind, now);
  } catch {
    return false;
  }
}

export function recordPromptActivity(now = Date.now()) {
  const record = readPromptRecord(now);
  writePromptRecord({ ...record, lastActivityAt: now });
}

function safelyUpdate(update: (record: PromptRecord) => PromptRecord) {
  try {
    writePromptRecord(update(readPromptRecord()));
    window.dispatchEvent(new StorageEvent("storage", { key: PROMPT_STORAGE_KEY }));
  } catch {
    return;
  }
}

export function dismissPrompt(kind: PromptKind) {
  safelyUpdate((record) => suppressPrompt(record, kind, "dismissed", Date.now()));
}

export function markNewsletterRequestAccepted() {
  safelyUpdate((record) => suppressPrompt(record, "newsletter", "requested", Date.now()));
}

export function markNewsletterConfirmed() {
  safelyUpdate((record) => suppressPrompt(record, "newsletter", "confirmed", Date.now()));
}
