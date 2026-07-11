export const PROMPT_VERSION = 1;
export const VISIT_GAP_MS = 30 * 60 * 1000;
export const DISMISS_MS = 30 * 24 * 60 * 60 * 1000;
export const DOI_REQUEST_MS = 7 * 24 * 60 * 60 * 1000;

export type PromptKind = "newsletter" | "store";
export interface PromptRecord {
  readonly version: 1;
  readonly visitId: string;
  readonly visitCount: number;
  readonly lastActivityAt: number;
  readonly claim?: { readonly visitId: string; readonly kind: PromptKind; readonly token: string; readonly claimedAt: number };
  readonly newsletterDismissedUntil?: number;
  readonly newsletterRequestedUntil?: number;
  readonly newsletterConfirmed?: true;
  readonly storeDismissedUntil?: number;
}

export function createPromptRecord(now: number): PromptRecord {
  return { version: PROMPT_VERSION, visitId: "", visitCount: 0, lastActivityAt: now };
}

export function parsePromptRecord(raw: string | null, now: number): PromptRecord {
  if (!raw) return createPromptRecord(now);
  try {
    const value = JSON.parse(raw) as PromptRecord;
    return value.version === PROMPT_VERSION && Number.isFinite(value.lastActivityAt)
      ? value
      : createPromptRecord(now);
  } catch {
    return createPromptRecord(now);
  }
}

export function beginVisit(record: PromptRecord, now: number, newId: string): PromptRecord {
  const isNew = !record.visitId || now - record.lastActivityAt >= VISIT_GAP_MS;
  return {
    ...record,
    visitId: isNew ? newId : record.visitId,
    visitCount: isNew ? record.visitCount + 1 : record.visitCount,
    lastActivityAt: now,
    claim: isNew ? undefined : record.claim,
  };
}

export function newsletterSuppressed(record: PromptRecord, now: number) {
  return Boolean(
    record.newsletterConfirmed ||
    (record.newsletterDismissedUntil && record.newsletterDismissedUntil > now) ||
    (record.newsletterRequestedUntil && record.newsletterRequestedUntil > now),
  );
}

export function canShowNewsletter(
  record: PromptRecord,
  now: number,
  input: { readonly visibleMs: number; readonly progress: number; readonly inactiveMs: number },
) {
  return (
    !newsletterSuppressed(record, now) &&
    !record.claim &&
    input.inactiveMs >= 15_000 &&
    (input.visibleMs >= 60_000 || input.progress >= 0.55)
  );
}

export function canShowStore(
  record: PromptRecord,
  now: number,
  input: { readonly sectionVisibleMs: number; readonly exitIntent: boolean; readonly progress: number },
) {
  return (
    record.visitCount >= 2 &&
    newsletterSuppressed(record, now) &&
    (!record.storeDismissedUntil || record.storeDismissedUntil <= now) &&
    !record.claim &&
    (input.sectionVisibleMs >= 8_000 || (input.exitIntent && input.progress >= 0.6))
  );
}

export function suppressPrompt(
  record: PromptRecord,
  kind: PromptKind,
  reason: "dismissed" | "requested" | "confirmed",
  now: number,
): PromptRecord {
  if (kind === "store") return { ...record, storeDismissedUntil: now + DISMISS_MS };
  if (reason === "confirmed") return { ...record, newsletterConfirmed: true };
  if (reason === "requested") return { ...record, newsletterRequestedUntil: now + DOI_REQUEST_MS };
  return { ...record, newsletterDismissedUntil: now + DISMISS_MS };
}
