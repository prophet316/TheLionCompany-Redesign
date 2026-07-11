export const CONSENT_VERSION = 1;
export const CONSENT_KEY = "tlc:analytics-consent:v1";
export const CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

export type ConsentState = "unknown" | "denied" | "analytics-granted";

interface StoredConsent {
  readonly state: Exclude<ConsentState, "unknown">;
  readonly version: number;
  readonly decidedAt: string;
}

export function readConsent(raw: string | null, now = Date.now()): ConsentState {
  if (!raw) return "unknown";
  try {
    const parsed = JSON.parse(raw) as Partial<StoredConsent>;
    const decidedAt = Date.parse(parsed.decidedAt ?? "");
    if (
      parsed.version !== CONSENT_VERSION ||
      (parsed.state !== "denied" && parsed.state !== "analytics-granted") ||
      !Number.isFinite(decidedAt) ||
      now - decidedAt > CONSENT_MAX_AGE_MS
    ) {
      return "unknown";
    }
    return parsed.state;
  } catch {
    return "unknown";
  }
}

export function writeConsent(state: Exclude<ConsentState, "unknown">, now = Date.now()) {
  return JSON.stringify({
    state,
    version: CONSENT_VERSION,
    decidedAt: new Date(now).toISOString(),
  } satisfies StoredConsent);
}

export function removeGaCookies(documentLike: Document, hostname = location.hostname) {
  const domains = [undefined, `.${hostname}`];
  if (hostname === "www.thelioncompany.org") domains.push(".thelioncompany.org");
  documentLike.cookie
    .split(";")
    .map((part) => part.trim().split("=")[0])
    .filter((name) => name === "_ga" || name.startsWith("_ga_"))
    .forEach((name) => domains.forEach((domain) => {
      documentLike.cookie = name + "=; Path=/; " + (domain ? `Domain=${domain}; ` : "") + "Max-Age=0; SameSite=Lax; Secure";
    }));
}
