# The Gathering Forms, Privacy, and Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace email-client forms with secure, accessible newsletter, prayer, and contact workflows that use Turnstile, opaque Redis idempotency, Brevo delivery, honest preview behavior, enforceable privacy controls, and production security headers.

**Architecture:** Next.js App Router route handlers share strict transport, schema, Turnstile, idempotency, provider, and safe-response layers; no prayer, contact, name, or email content enters site-owned persistence. Client forms are isolated local state machines with stable logical-submission UUIDs, accessible errors, explicit test-mode notices, and exact component contracts consumed by the experience plan. Operational controls that cannot live in application code—Vercel WAF limits, mailbox deletion, Brevo retention, domain authentication, and quarterly evidence—are release gates with auditable runbooks.

**Tech Stack:** Node.js 22, Next.js App Router, TypeScript, React, npm, Zod 4.4.3, `@getbrevo/brevo` 6.0.2, `@upstash/redis` 1.38.0, `@marsidev/react-turnstile` 1.5.3, Vitest, Testing Library, Playwright, Vercel, Brevo, Cloudflare Turnstile, Upstash Redis.

## Global Constraints

- Work from `/Users/jonathangibson/Antigravity/TheLionCompany` on `codex/the-gathering-rebuild`; do not change Wix DNS or deploy production from this plan.
- Node is `>=22 <23`; npm and `package-lock.json` are authoritative; root-level `app/`, `components/`, `config/`, `content/`, `lib/`, and `tests/` are the project layout.
- Public pages remain prerenderable Server Components by default; only form controls and outcome storage markers become Client Components; do not use `output: "export"`.
- `POST application/json` is the only form transport; the decoded UTF-8 request body is capped at 16,384 bytes before JSON parsing.
- Accept only an exact configured `Origin`; send no CORS response headers and define no `OPTIONS` handler.
- In production the origin list is exactly `https://www.thelioncompany.org` and the Turnstile hostname list is exactly `www.thelioncompany.org`; generated Vercel hosts and configured extras are rejected rather than merely ignored.
- Every request uses a strict Zod object, an empty honeypot, server-side Turnstile validation, and the endpoint-specific action and hostname allowlist.
- Turnstile tokens are at most 2,048 characters, expire after five minutes, are single-use, and are validated with `idempotency_key` equal to the logical submission UUID; the client resets the widget after expiry, duplicate-token, or failed submission responses.
- Vercel WAF is the source-based rate limiter: five prayer/contact attempts and ten newsletter attempts per source per ten minutes; the sixth or eleventh request returns 429 before application/provider execution.
- Redis stores only HMAC-derived keys, safe status, timestamps, lock tokens, and provider message identifiers; processing locks expire after five minutes and accepted records after 24 hours; no backups or exports are allowed.
- Prayer/contact content, names, email addresses, Turnstile tokens, and raw provider errors never enter application logs, analytics, URLs, browser storage, Redis, source maps, or Git.
- Brevo native DOI is the newsletter system of record. A DOI request acceptance is not confirmed membership, and duplicate/pending/existing addresses receive the same response.
- Transactional prayer/contact mail contains a generic subject with a non-reversible request identifier, validated email only as `Reply-To`, escaped dynamic HTML, and a complete text alternative; no visitor acknowledgement is sent in this release.
- Preview and development default to `no-send`; `test-recipient` requires isolated preview Brevo resources and a restricted test address; `live` is rejected outside `VERCEL_ENV=production`.
- Production activation requires an approved Brevo account, authenticated sending domain, isolated API key, confirmed list and DOI template, restricted mailboxes with MFA, verified legal postal address, named data steward, named mailbox administrator, and evidence that retention automation works.
- Prayer mailbox retention is 90 days unless labeled `active-follow-up`; active follow-up is reviewed every 30 days and may not exceed 12 months without a documented legal or safety hold.
- Contact messages are deleted 12 months after resolution; unresolved messages receive quarterly owner review; pending DOI contacts purge after 30 days; Brevo transactional logs retain one month; email previews are disabled.
- Analytics receives no form values or identifiers. Prayer acceptance is only an aggregate first-party endpoint/day/count operational metric; form UI may emit only the approved safe, enumerated analytics events through the experience plan's consent guard.
- Form labels persist, errors retain entered text, an error summary and first invalid field receive focus in order, feedback uses live regions, and forms remain operable at 320 CSS pixels and 400% zoom under WCAG 2.2 AA.
- The browser policy includes only first-party, GA4, Turnstile, and `youtube-nocookie` browser connections; Brevo is server-only and must never appear in `connect-src`.
- Preview uses `Content-Security-Policy-Report-Only`; production enforces a CSP with deterministic build-generated inline-script hashes and no wildcard or script `unsafe-inline` fallback.
- Launch HSTS is exactly `max-age=31536000`, without `includeSubDomains` or preload.
- No paid plan, provider account, WAF upgrade, DNS mutation, secret creation, campaign send, or production activation is authorized by executing this plan.
- Forms are not an emergency service; prayer copy directs immediate-danger visitors to local emergency resources without giving crisis counseling.
- Testimony submission grants no publication rights; publication requires a separate written-consent workflow outside this release.

---

## Exact File Map

The foundation plan creates the root Next.js application, test configuration, and `next.config.ts`. This plan owns only the following form/privacy/security surface.

| Path | Action | Single responsibility |
|---|---|---|
| `package.json` | Modify | Pin form/provider dependencies and replace the build command with the deterministic CSP build wrapper. |
| `package-lock.json` | Modify | Lock exact dependency graph. |
| `.env.example` | Create | Document safe non-secret local/no-send variables and every production gate variable. |
| `.gitignore` | Modify | Exclude generated CSP hash manifest and local release evidence. |
| `next.config.ts` | Modify | Extend the foundation `nextConfig` object with generated CSP, HSTS, and security headers. |
| `config/routes.ts` | Modify | Add prayer, connect, privacy, terms, and accessibility to the indexable sitemap source while excluding utility outcomes. |
| `config/security-headers.ts` | Create | Produce exact preview/production header sets from a supplied hash list. |
| `lib/env.ts` | Create | Parse server environment and reject unsafe delivery/environment combinations. |
| `lib/forms/public-config.ts` | Create | Parse the two public form variables used by Client Components. |
| `lib/forms/contracts.ts` | Create | Export strict schemas, input/output types, safe result union, placements, reasons, and endpoints. |
| `lib/forms/errors.ts` | Create | Map internal safe error classes to privacy-safe status codes and messages. |
| `lib/forms/request.ts` | Create | Enforce method/content type/body cap/origin/JSON/honeypot transport rules. |
| `lib/forms/content.ts` | Create | Normalize text, escape HTML, reject header controls, and derive stable request identifiers. |
| `lib/forms/turnstile.ts` | Create | Validate Turnstile token, hostname, and action through Siteverify. |
| `lib/forms/idempotency.ts` | Create | Define memory/Redis stores and HMAC-based lock/accept/release behavior. |
| `lib/forms/email-templates.ts` | Create | Render controlled prayer/contact text and HTML messages. |
| `lib/forms/provider.ts` | Create | Define the replaceable delivery interface and provider-safe input/receipt types. |
| `lib/forms/brevo.ts` | Create | Implement native DOI and transactional sends with Brevo. |
| `lib/forms/no-send.ts` | Create | Implement honest preview acceptance without network delivery. |
| `lib/forms/logger.ts` | Create | Emit only safe request metadata. |
| `lib/forms/handler.ts` | Create | Orchestrate transport, schema, Turnstile, idempotency, provider, and response mapping. |
| `lib/forms/services.ts` | Create | Build production or preview dependencies from validated environment. |
| `app/api/forms/newsletter/route.ts` | Create | Bind newsletter schema/action/provider to the shared handler. |
| `app/api/forms/prayer/route.ts` | Create | Bind prayer schema/action/provider to the shared handler. |
| `app/api/forms/contact/route.ts` | Create | Bind contact schema/action/provider to the shared handler. |
| `components/client/forms/use-form-machine.ts` | Create | Manage stable submission UUID, retry, edit, error, and accepted states. |
| `components/client/forms/turnstile-field.tsx` | Create | Render/reset the endpoint-specific managed Turnstile widget. |
| `components/client/forms/form-feedback.tsx` | Create | Render accessible environment notice, error summary, and status. |
| `components/client/forms/newsletter-form.tsx` | Create | Newsletter fields and exact experience-plan API. |
| `components/client/forms/prayer-form.tsx` | Create | Anonymous/follow-up-aware prayer fields and exact experience-plan API. |
| `components/client/forms/contact-form.tsx` | Create | Contact-reason fields and exact experience-plan API. |
| `components/client/forms/forms.module.css` | Create | Form-only responsive, focus, honeypot, summary, and status styles. |
| `components/client/forms/newsletter-outcome-marker.tsx` | Create | Mark confirmed membership in the prompt controller's versioned storage. |
| `app/prayer/page.tsx` | Create | Render the dedicated private prayer journey and frozen `PrayerForm` API. |
| `app/newsletter/confirmed/page.tsx` | Create | Noindex confirmation outcome and permanent browser suppression marker. |
| `app/newsletter/expired/page.tsx` | Create | Noindex expired/invalid recovery with a fresh DOI form. |
| `app/newsletter/unsubscribed/page.tsx` | Create | Noindex unsubscribe outcome and optional fresh DOI form. |
| `content/legal.ts` | Create | Versioned legal/accessibility copy and operational-disclosure builder. |
| `app/privacy/page.tsx` | Create | Indexable privacy policy with configured mailbox-provider disclosure. |
| `app/terms/page.tsx` | Create | Indexable website terms. |
| `app/accessibility/page.tsx` | Create | Indexable accessibility commitment and contact path. |
| `scripts/build-with-csp.mjs` | Create | Run deterministic discovery/final builds and verify all inline hashes. |
| `scripts/form-preview-soak.mjs` | Create | Run protected-preview form volume/concurrency/failure soak without a code bypass. |
| `docs/operations/forms-privacy-runbook.md` | Create | Data map, retention, provider, mailbox, escalation, deletion, and production gates. |
| `docs/operations/vercel-waf-runbook.md` | Create | Exact dashboard WAF rules, preview exception process, evidence, and rollback. |
| `docs/operations/quarterly-privacy-audit.md` | Create | Repeatable privacy-safe quarterly evidence record. |
| `tests/unit/forms/contracts.test.ts` | Create | Schema and normalization contracts. |
| `tests/unit/forms/request.test.ts` | Create | Transport/origin/body/honeypot rules. |
| `tests/unit/forms/content.test.ts` | Create | Escaping, header defense, and request identifiers. |
| `tests/unit/forms/turnstile.test.ts` | Create | Siteverify success/failure/expiry/action/hostname behavior. |
| `tests/unit/forms/idempotency.test.ts` | Create | Opaque keys, lock TTL, replay, concurrency, release, and crash window. |
| `tests/unit/forms/provider.test.ts` | Create | Brevo/no-send mapping, DOI privacy, test-recipient rewrite, and safe errors. |
| `tests/unit/forms/handler.test.ts` | Create | End-to-end handler order, statuses, replay, provider failure, and safe logs. |
| `tests/components/forms.test.tsx` | Create | Accessible state-machine behavior for all three forms. |
| `tests/integration/form-routes.test.ts` | Create | Route binding/no-store/cross-origin/non-JSON/oversize/provider behavior. |
| `tests/integration/security-headers.test.ts` | Create | Exact CSP/header policy and Brevo browser exclusion. |
| `tests/integration/legal-content.test.ts` | Create | Processor, retention, noindex outcome, and sitemap contracts. |
| `tests/integration/experience-form-handoff.test.ts` | Create | Dedicated prayer/connect pages consume the frozen form APIs. |
| `tests/e2e/forms.spec.ts` | Create | Browser keyboard, retry, retained values, outcomes, no-send, and no-JS behavior. |

## Interfaces Shared With the Experience Plan

These names and types are frozen. The experience implementation imports them; this plan must not rename or widen them.

```ts
// components/client/forms/newsletter-form.tsx
export type NewsletterFormProps = {
  placement: "inline" | "prompt" | "connect";
  onAccepted?: () => void;
  headingId?: string;
  className?: string;
};
export function NewsletterForm(props: NewsletterFormProps): React.ReactElement;

// components/client/forms/prayer-form.tsx
export type PrayerFormProps = {
  placement: "home" | "prayer";
  className?: string;
};
export function PrayerForm(props: PrayerFormProps): React.ReactElement;

// components/client/forms/contact-form.tsx
export type ContactFormProps = {
  defaultReason?: ContactReason;
  className?: string;
};
export function ContactForm(props: ContactFormProps): React.ReactElement;

// lib/forms/contracts.ts
export type ContactReason =
  | "speaking"
  | "partnership"
  | "media"
  | "testimony"
  | "general";

export type FormSubmitResult =
  | {
      ok: true;
      status: "accepted";
      submissionId: string;
      deliveryMode: "no-send" | "test-recipient" | "live";
      replayed: boolean;
      message: string;
    }
  | {
      ok: false;
      status: "error";
      code: SafeFormErrorCode;
      retryable: boolean;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

// Owned by the experience plan in lib/prompts/storage.ts.
export function markNewsletterRequestAccepted(): void; // seven-day suppression
export function markNewsletterConfirmed(): void; // indefinite suppression

// Owned by the experience plan in components/client/analytics-provider.tsx.
export function useAnalytics(): {
  track(event: AnalyticsEventName, properties?: AnalyticsProperties): void;
};
```

`NewsletterForm` calls `onAccepted` exactly once after an HTTP 202 `accepted` result; the prompt controller passes `markNewsletterRequestAccepted` through that callback. `/newsletter/confirmed` calls `markNewsletterConfirmed` on mount. The outcome route does not infer or publish Brevo membership; Brevo redirects there only after its DOI action.

Form analytics uses only the consent-gated `track` method: newsletter events carry `{ placement }` and optional enumerated safe `{ code }`; contact events carry `{ reason }` and optional enumerated safe `{ code }`. Prayer forms emit no GA event. The safe server request log is aggregated by endpoint and UTC platform timestamp for the operational prayer accepted count; the aggregate contains no form, browser, or session identifier.

## Server Interfaces Used Across Tasks

```ts
export type FormEndpoint = "newsletter" | "prayer" | "contact";
export type TurnstileAction = "newsletter_submit" | "prayer_submit" | "contact_submit";

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

export type IdempotencyClaim =
  | { state: "acquired"; key: string; lockValue: string }
  | { state: "accepted"; key: string; providerMessageId: string }
  | { state: "processing"; key: string };

export interface IdempotencyStore {
  claim(endpoint: FormEndpoint, submissionId: string): Promise<IdempotencyClaim>;
  accept(claim: Extract<IdempotencyClaim, { state: "acquired" }>, providerMessageId: string): Promise<void>;
  release(claim: Extract<IdempotencyClaim, { state: "acquired" }>): Promise<void>;
}

export interface FormDeliveryProvider {
  requestNewsletter(input: NewsletterDeliveryInput): Promise<ProviderReceipt>;
  deliverPrayer(input: PrayerDeliveryInput): Promise<ProviderReceipt>;
  deliverContact(input: ContactDeliveryInput): Promise<ProviderReceipt>;
}

export type ProviderReceipt = { providerMessageId: string };
```

### Task 1: Pin dependencies, validate environment, and freeze form contracts

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `.env.example`
- Create: `lib/env.ts`
- Create: `lib/forms/public-config.ts`
- Create: `lib/forms/contracts.ts`
- Create: `tests/unit/forms/contracts.test.ts`

**Interfaces:**
- Consumes: foundation scripts `test`, `test:unit`, `typecheck`, `build`; root-level project layout; Node 22.
- Produces: `getServerEnv(source?: NodeJS.ProcessEnv): ServerEnv`, `publicFormConfig`, all schemas/types in the shared interface section, and exact dependency versions.

- [ ] **Step 1: Install exact runtime dependencies**

Run:

```bash
npm install --save-exact @getbrevo/brevo@6.0.2 @upstash/redis@1.38.0 @marsidev/react-turnstile@1.5.3 zod@4.4.3
```

Expected: npm exits 0; `package.json` contains the four exact versions without `^` or `~`; `package-lock.json` changes.

- [ ] **Step 2: Write the failing contract and environment tests**

Create `tests/unit/forms/contracts.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getServerEnv } from "../../../lib/env";
import {
  contactSchema,
  newsletterSchema,
  prayerSchema,
} from "../../../lib/forms/contracts";

const base = {
  NODE_ENV: "test",
  VERCEL_ENV: "preview",
  VERCEL_URL: "immutable-preview.vercel.app",
  NEXT_PUBLIC_SITE_URL: "https://www.thelioncompany.org",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  NEXT_PUBLIC_FORM_MODE: "no-send",
  FORM_DELIVERY_MODE: "no-send",
  FORM_ALLOWED_ORIGINS:
    "http://localhost:3000,https://www.thelioncompany.org,https://preview.example.test",
  TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
  TURNSTILE_EXPECTED_HOSTNAMES: "localhost,www.thelioncompany.org,preview.example.test",
  FORM_IDEMPOTENCY_SECRET:
    "test-only-idempotency-secret-with-more-than-thirty-two-characters",
  BREVO_CONSENT_VERSION: "2026-07-11",
};

describe("form contracts", () => {
  it("normalizes newsletter email and optional name", () => {
    const value = newsletterSchema.parse({
      submissionId: "9a7449c2-6a48-4970-92ea-6919a22e7f55",
      email: "  PERSON@Example.COM ",
      firstName: "  Ada  ",
      consent: true,
      placement: "inline",
      turnstileToken: "token",
      website: "",
    });
    expect(value.email).toBe("person@example.com");
    expect(value.firstName).toBe("Ada");
  });

  it("rejects missing consent, extra keys, and overlong email", () => {
    expect(() =>
      newsletterSchema.parse({
        submissionId: crypto.randomUUID(),
        email: `${"a".repeat(246)}@example.com`,
        consent: false,
        placement: "inline",
        turnstileToken: "token",
        website: "",
        role: "admin",
      }),
    ).toThrow();
    expect(
      newsletterSchema.safeParse({
        submissionId: crypto.randomUUID(),
        email: "person@example.org",
        consent: true,
        placement: "inline",
        turnstileToken: "token",
        website: "",
        role: "admin",
      }).success,
    ).toBe(false);
  });

  it("requires email only when prayer follow-up is requested", () => {
    expect(
      prayerSchema.safeParse({
        submissionId: crypto.randomUUID(),
        displayName: "",
        email: "",
        request: "Please pray for wisdom and peace this week.",
        followUpRequested: false,
        turnstileToken: "token",
        website: "",
      }).success,
    ).toBe(true);
    expect(
      prayerSchema.safeParse({
        submissionId: crypto.randomUUID(),
        displayName: "",
        email: "",
        request: "Please pray for wisdom and peace this week.",
        followUpRequested: true,
        turnstileToken: "token",
        website: "",
      }).success,
    ).toBe(false);
  });

  it("accepts only enumerated contact reasons and message length", () => {
    expect(
      contactSchema.safeParse({
        submissionId: crypto.randomUUID(),
        name: "Ada Lovelace",
        email: "ada@example.com",
        reason: "partnership",
        message: "I would like to discuss a ministry partnership.",
        turnstileToken: "token",
        website: "",
      }).success,
    ).toBe(true);
    expect(
      contactSchema.safeParse({
        submissionId: crypto.randomUUID(),
        name: "Ada Lovelace",
        email: "ada@example.com",
        reason: "sales",
        message: "I would like to discuss a ministry partnership.",
        turnstileToken: "token",
        website: "",
      }).success,
    ).toBe(false);
  });
});

describe("server environment", () => {
  it("allows no-send preview without provider credentials", () => {
    expect(getServerEnv(base).deliveryMode).toBe("no-send");
  });

  it("ignores unrelated platform variables while validating the declared form environment", () => {
    expect(getServerEnv({ ...base, VERCEL_GIT_COMMIT_SHA: "abc123", CI: "true" }).deliveryMode).toBe(
      "no-send",
    );
  });

  it("derives the immutable Vercel preview origin and Turnstile hostname", () => {
    const env = getServerEnv({
      ...base,
      FORM_ALLOWED_ORIGINS: "http://localhost:3000,https://www.thelioncompany.org",
      TURNSTILE_EXPECTED_HOSTNAMES: "localhost,www.thelioncompany.org",
    });
    expect(env.allowedOrigins).toContain("https://immutable-preview.vercel.app");
    expect(env.turnstileExpectedHostnames).toContain("immutable-preview.vercel.app");
    expect(env.siteUrl.toString()).toBe("https://immutable-preview.vercel.app/");
  });

  it("rejects a non-Vercel hostname presented as VERCEL_URL", () => {
    expect(() => getServerEnv({ ...base, VERCEL_URL: "attacker.example.org" })).toThrow(
      /VERCEL_URL must be a Vercel system hostname/,
    );
  });

  it("never trusts the generated Vercel hostname as a production browser origin", () => {
    const productionSource = {
      ...base,
      VERCEL_ENV: "production",
      VERCEL_URL: "production-generated.vercel.app",
      NEXT_PUBLIC_FORM_MODE: "live",
      FORM_DELIVERY_MODE: "live",
      FORM_ALLOWED_ORIGINS: "https://www.thelioncompany.org",
      TURNSTILE_EXPECTED_HOSTNAMES: "www.thelioncompany.org",
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "scoped-token",
      BREVO_API_KEY: "production-key-placeholder",
      BREVO_NEWSLETTER_LIST_ID: "12",
      BREVO_DOI_TEMPLATE_ID: "34",
      BREVO_SENDER_EMAIL: "forms@thelioncompany.org",
      BREVO_SENDER_NAME: "The Lion Company",
      FORM_PRAYER_RECIPIENT: "prayer@thelioncompany.org",
      FORM_CONTACT_RECIPIENT: "contact@thelioncompany.org",
      MAILBOX_PROVIDER_PUBLIC_NAME: "Restricted mailbox provider",
      MAILBOX_BACKUP_AND_DELETION_PUBLIC: "Mailbox trash and provider backups complete final deletion within the verified provider window.",
      BREVO_BACKUP_AND_DELETION_PUBLIC: "Brevo deletion and backup expiry follow the verified account retention window.",
      MARKETING_POSTAL_ADDRESS_VERIFIED: "true",
      DATA_STEWARD_NAME: "Authorized steward",
      MAILBOX_ADMIN_NAME: "Authorized administrator",
    };
    const env = getServerEnv(productionSource);
    expect(env.allowedOrigins).toEqual(["https://www.thelioncompany.org"]);
    expect(env.turnstileExpectedHostnames).toEqual(["www.thelioncompany.org"]);
    expect(() => getServerEnv({
      ...productionSource,
      FORM_ALLOWED_ORIGINS: "https://www.thelioncompany.org,https://extra.example.org",
      TURNSTILE_EXPECTED_HOSTNAMES: "www.thelioncompany.org,extra.example.org",
    })).toThrow(/production forms allow only the canonical origin and hostname/);
  });

  it("rejects live delivery outside production", () => {
    expect(() =>
      getServerEnv({
        ...base,
        NEXT_PUBLIC_FORM_MODE: "live",
        FORM_DELIVERY_MODE: "live",
      }),
    ).toThrow(/live delivery requires VERCEL_ENV=production/);
  });

  it("rejects mismatched public and server delivery modes", () => {
    expect(() =>
      getServerEnv({ ...base, NEXT_PUBLIC_FORM_MODE: "test-recipient" }),
    ).toThrow(/must match/);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test -- tests/unit/forms/contracts.test.ts`

Expected: FAIL because `lib/env.ts` and `lib/forms/contracts.ts` do not exist.

- [ ] **Step 4: Add the safe environment example**

Create `.env.example`:

```dotenv
NODE_ENV=development
VERCEL_ENV=development
VERCEL_URL=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
NEXT_PUBLIC_FORM_MODE=no-send
FORM_DELIVERY_MODE=no-send
FORM_ALLOWED_ORIGINS=http://localhost:3000,https://www.thelioncompany.org
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
TURNSTILE_EXPECTED_HOSTNAMES=localhost,www.thelioncompany.org
FORM_IDEMPOTENCY_SECRET=local-only-secret-change-before-shared-preview-1234567890
BREVO_CONSENT_VERSION=2026-07-11
UPSTASH_REDIS_REST_URL=https://example-only.upstash.io
UPSTASH_REDIS_REST_TOKEN=example-only-scoped-token
BREVO_API_KEY=example-only-environment-specific-api-key
BREVO_NEWSLETTER_LIST_ID=1
BREVO_DOI_TEMPLATE_ID=1
BREVO_SENDER_EMAIL=forms@example.org
BREVO_SENDER_NAME=The Lion Company
FORM_PRAYER_RECIPIENT=prayer@example.org
FORM_CONTACT_RECIPIENT=contact@example.org
FORM_TEST_RECIPIENT=reviewer@example.org
MAILBOX_PROVIDER_PUBLIC_NAME=Example restricted mailbox provider
MAILBOX_BACKUP_AND_DELETION_PUBLIC=Replace with verified public mailbox backup and final-deletion timing
BREVO_BACKUP_AND_DELETION_PUBLIC=Replace with verified public Brevo backup and final-deletion timing
MARKETING_POSTAL_ADDRESS_VERIFIED=false
DATA_STEWARD_NAME=Example data steward
MAILBOX_ADMIN_NAME=Example mailbox administrator
```

The `example.org` and `example-only` values are intentionally non-operational. Never copy them into Vercel production unchanged.

Create a non-committed local no-send environment only when one does not already exist:

```bash
test -e .env.local || cp .env.example .env.local
git check-ignore .env.local
```

Expected: `.env.local` supplies Cloudflare's documented always-pass test keys and no-send mode for local builds; `git check-ignore` prints `.env.local`. Never overwrite an existing local environment and never stage this file.

- [ ] **Step 5: Implement strict schemas and shared response types**

Create `lib/forms/contracts.ts`:

```ts
import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalName = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1).max(80).optional(),
);
const optionalEmail = z.preprocess(
  emptyToUndefined,
  z.string().trim().toLowerCase().email().max(254).optional(),
);
const email = z.string().trim().toLowerCase().email().max(254);
const shared = {
  submissionId: z.string().uuid(),
  turnstileToken: z.string().min(1).max(2_048),
  website: z.string().max(200),
};

export const formEndpointSchema = z.enum(["newsletter", "prayer", "contact"]);
export const newsletterPlacementSchema = z.enum(["inline", "prompt", "connect"]);
export const prayerPlacementSchema = z.enum(["home", "prayer"]);
export const contactReasonSchema = z.enum([
  "speaking",
  "partnership",
  "media",
  "testimony",
  "general",
]);
export const turnstileActionSchema = z.enum([
  "newsletter_submit",
  "prayer_submit",
  "contact_submit",
]);
export const deliveryModeSchema = z.enum(["no-send", "test-recipient", "live"]);

export const newsletterSchema = z
  .object({
    ...shared,
    email,
    firstName: optionalName,
    consent: z.literal(true),
    placement: newsletterPlacementSchema,
  })
  .strict();

export const prayerSchema = z
  .object({
    ...shared,
    displayName: optionalName,
    email: optionalEmail,
    request: z.string().trim().min(20).max(4_000),
    followUpRequested: z.boolean(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.followUpRequested && !value.email) {
      context.addIssue({
        code: "custom",
        path: ["email"],
        message: "Enter an email address if you would like follow-up.",
      });
    }
  });

export const contactSchema = z
  .object({
    ...shared,
    name: z.string().trim().min(1).max(80),
    email,
    reason: contactReasonSchema,
    message: z.string().trim().min(20).max(4_000),
  })
  .strict();

export const safeFormErrorCodeSchema = z.enum([
  "invalid_origin",
  "invalid_content_type",
  "body_too_large",
  "invalid_json",
  "invalid_fields",
  "bot_rejected",
  "turnstile_failed",
  "turnstile_expired",
  "already_processing",
  "provider_unavailable",
  "configuration_error",
  "network_error",
]);

export type FormEndpoint = z.infer<typeof formEndpointSchema>;
export type NewsletterPlacement = z.infer<typeof newsletterPlacementSchema>;
export type PrayerPlacement = z.infer<typeof prayerPlacementSchema>;
export type ContactReason = z.infer<typeof contactReasonSchema>;
export type TurnstileAction = z.infer<typeof turnstileActionSchema>;
export type DeliveryMode = z.infer<typeof deliveryModeSchema>;
export type NewsletterInput = z.infer<typeof newsletterSchema>;
export type PrayerInput = z.infer<typeof prayerSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type SafeFormErrorCode = z.infer<typeof safeFormErrorCodeSchema>;

export type FormSubmitResult =
  | {
      ok: true;
      status: "accepted";
      submissionId: string;
      deliveryMode: DeliveryMode;
      replayed: boolean;
      message: string;
    }
  | {
      ok: false;
      status: "error";
      code: SafeFormErrorCode;
      retryable: boolean;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };
```

- [ ] **Step 6: Implement public and server environment validation**

Create `lib/forms/public-config.ts`:

```ts
import { deliveryModeSchema } from "./contracts";

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const mode = deliveryModeSchema.safeParse(process.env.NEXT_PUBLIC_FORM_MODE);

if (!siteKey) {
  throw new Error("NEXT_PUBLIC_TURNSTILE_SITE_KEY is required");
}
if (!mode.success) {
  throw new Error("NEXT_PUBLIC_FORM_MODE must be no-send, test-recipient, or live");
}

export const publicFormConfig = Object.freeze({
  turnstileSiteKey: siteKey,
  deliveryMode: mode.data,
});
```

Create `lib/env.ts`:

```ts
import "server-only";
import { z } from "zod";
import { deliveryModeSchema } from "./forms/contracts";

const optionalNonempty = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);
const optionalPositiveInt = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : Number(value)),
  z.number().int().positive().optional(),
);
const environmentSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    VERCEL_ENV: z.enum(["development", "preview", "production"]).default("development"),
    VERCEL_URL: optionalNonempty,
    NEXT_PUBLIC_SITE_URL: z.string().url(),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
    NEXT_PUBLIC_FORM_MODE: deliveryModeSchema,
    FORM_DELIVERY_MODE: deliveryModeSchema,
    FORM_ALLOWED_ORIGINS: z.string().min(1),
    TURNSTILE_SECRET_KEY: z.string().min(1),
    TURNSTILE_EXPECTED_HOSTNAMES: z.string().min(1),
    FORM_IDEMPOTENCY_SECRET: z.string().min(32),
    BREVO_CONSENT_VERSION: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    UPSTASH_REDIS_REST_URL: optionalNonempty,
    UPSTASH_REDIS_REST_TOKEN: optionalNonempty,
    BREVO_API_KEY: optionalNonempty,
    BREVO_NEWSLETTER_LIST_ID: optionalPositiveInt,
    BREVO_DOI_TEMPLATE_ID: optionalPositiveInt,
    BREVO_SENDER_EMAIL: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().email().optional(),
    ),
    BREVO_SENDER_NAME: optionalNonempty,
    FORM_PRAYER_RECIPIENT: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().email().optional(),
    ),
    FORM_CONTACT_RECIPIENT: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().email().optional(),
    ),
    FORM_TEST_RECIPIENT: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().email().optional(),
    ),
    MAILBOX_PROVIDER_PUBLIC_NAME: optionalNonempty,
    MAILBOX_BACKUP_AND_DELETION_PUBLIC: optionalNonempty,
    BREVO_BACKUP_AND_DELETION_PUBLIC: optionalNonempty,
    MARKETING_POSTAL_ADDRESS_VERIFIED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    DATA_STEWARD_NAME: optionalNonempty,
    MAILBOX_ADMIN_NAME: optionalNonempty,
  })
  .strip();

export type ServerEnv = ReturnType<typeof getServerEnv>;

function splitCsv(value: string): string[] {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

function exactOrigins(value: string): string[] {
  return splitCsv(value).map((candidate) => {
    const url = new URL(candidate);
    if (url.origin !== candidate || (url.protocol !== "https:" && url.hostname !== "localhost")) {
      throw new Error(`FORM_ALLOWED_ORIGINS contains a non-origin value: ${candidate}`);
    }
    return candidate;
  });
}

function exactHostnames(value: string): string[] {
  return splitCsv(value).map((candidate) => {
    if (!/^(localhost|[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?)$/i.test(candidate)) {
      throw new Error(`TURNSTILE_EXPECTED_HOSTNAMES contains an invalid hostname: ${candidate}`);
    }
    return candidate.toLowerCase();
  });
}

export function getServerEnv(source: NodeJS.ProcessEnv = process.env) {
  const value = environmentSchema.parse(source);
  const configuredOrigins = exactOrigins(value.FORM_ALLOWED_ORIGINS);
  const configuredHostnames = exactHostnames(value.TURNSTILE_EXPECTED_HOSTNAMES);
  let previewHostname: string | undefined;
  if (value.VERCEL_ENV === "preview" && value.VERCEL_URL) {
    const previewUrl = new URL(`https://${value.VERCEL_URL}`);
    if (
      !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.vercel\.app$/.test(value.VERCEL_URL) ||
      previewUrl.hostname !== value.VERCEL_URL.toLowerCase() ||
      previewUrl.pathname !== "/" ||
      previewUrl.search ||
      previewUrl.hash
    ) {
      throw new Error("VERCEL_URL must be a Vercel system hostname without a scheme or path");
    }
    previewHostname = previewUrl.hostname;
  }
  const allowedOrigins = [...new Set([
    ...configuredOrigins,
    ...(previewHostname ? [`https://${previewHostname}`] : []),
  ])];
  const turnstileExpectedHostnames = [...new Set([
    ...configuredHostnames,
    ...(previewHostname ? [previewHostname] : []),
  ])];
  if (value.NEXT_PUBLIC_FORM_MODE !== value.FORM_DELIVERY_MODE) {
    throw new Error("NEXT_PUBLIC_FORM_MODE and FORM_DELIVERY_MODE must match");
  }
  if (value.FORM_DELIVERY_MODE === "live" && value.VERCEL_ENV !== "production") {
    throw new Error("live delivery requires VERCEL_ENV=production");
  }
  if (value.VERCEL_ENV === "production" && value.FORM_DELIVERY_MODE !== "live") {
    throw new Error("production requires live form delivery");
  }
  if (
    value.VERCEL_ENV === "production" &&
    (value.NEXT_PUBLIC_SITE_URL !== "https://www.thelioncompany.org" ||
      allowedOrigins.length !== 1 ||
      allowedOrigins[0] !== "https://www.thelioncompany.org" ||
      turnstileExpectedHostnames.length !== 1 ||
      turnstileExpectedHostnames[0] !== "www.thelioncompany.org")
  ) {
    throw new Error("production forms allow only the canonical origin and hostname");
  }
  const providerFields = [
    value.UPSTASH_REDIS_REST_URL,
    value.UPSTASH_REDIS_REST_TOKEN,
    value.BREVO_API_KEY,
    value.BREVO_NEWSLETTER_LIST_ID,
    value.BREVO_DOI_TEMPLATE_ID,
    value.BREVO_SENDER_EMAIL,
    value.BREVO_SENDER_NAME,
  ];
  if (value.FORM_DELIVERY_MODE !== "no-send" && providerFields.some((item) => !item)) {
    throw new Error("test-recipient and live delivery require Redis and Brevo configuration");
  }
  if (value.FORM_DELIVERY_MODE === "test-recipient" && !value.FORM_TEST_RECIPIENT) {
    throw new Error("test-recipient delivery requires FORM_TEST_RECIPIENT");
  }
  if (
    value.FORM_DELIVERY_MODE === "live" &&
    (!value.FORM_PRAYER_RECIPIENT ||
      !value.FORM_CONTACT_RECIPIENT ||
      !value.MAILBOX_PROVIDER_PUBLIC_NAME ||
      !value.MAILBOX_BACKUP_AND_DELETION_PUBLIC ||
      !value.BREVO_BACKUP_AND_DELETION_PUBLIC ||
      !value.MARKETING_POSTAL_ADDRESS_VERIFIED ||
      !value.DATA_STEWARD_NAME ||
      !value.MAILBOX_ADMIN_NAME)
  ) {
    throw new Error("live delivery requires mailbox, legal, and named-owner gates");
  }
  return Object.freeze({
    nodeEnv: value.NODE_ENV,
    vercelEnv: value.VERCEL_ENV,
    siteUrl: new URL(previewHostname ? `https://${previewHostname}` : value.NEXT_PUBLIC_SITE_URL),
    deliveryMode: value.FORM_DELIVERY_MODE,
    allowedOrigins,
    turnstileSecretKey: value.TURNSTILE_SECRET_KEY,
    turnstileExpectedHostnames,
    idempotencySecret: value.FORM_IDEMPOTENCY_SECRET,
    consentVersion: value.BREVO_CONSENT_VERSION,
    redisUrl: value.UPSTASH_REDIS_REST_URL,
    redisToken: value.UPSTASH_REDIS_REST_TOKEN,
    brevoApiKey: value.BREVO_API_KEY,
    newsletterListId: value.BREVO_NEWSLETTER_LIST_ID,
    doiTemplateId: value.BREVO_DOI_TEMPLATE_ID,
    senderEmail: value.BREVO_SENDER_EMAIL,
    senderName: value.BREVO_SENDER_NAME,
    prayerRecipient: value.FORM_PRAYER_RECIPIENT,
    contactRecipient: value.FORM_CONTACT_RECIPIENT,
    testRecipient: value.FORM_TEST_RECIPIENT,
    mailboxProviderName: value.MAILBOX_PROVIDER_PUBLIC_NAME,
    mailboxBackupAndDeletionPublic: value.MAILBOX_BACKUP_AND_DELETION_PUBLIC,
    brevoBackupAndDeletionPublic: value.BREVO_BACKUP_AND_DELETION_PUBLIC,
    dataStewardName: value.DATA_STEWARD_NAME,
    mailboxAdminName: value.MAILBOX_ADMIN_NAME,
  });
}
```

- [ ] **Step 7: Run contract checks**

Run:

```bash
npm test -- tests/unit/forms/contracts.test.ts
npm run typecheck
```

Expected: contract tests PASS; typecheck exits 0.

- [ ] **Step 8: Commit the dependency and contract boundary**

```bash
git add package.json package-lock.json .env.example lib/env.ts lib/forms/public-config.ts lib/forms/contracts.ts tests/unit/forms/contracts.test.ts
git commit -m "feat: define secure form contracts"
```

### Task 2: Enforce transport safety and content isolation

**Files:**
- Create: `lib/forms/errors.ts`
- Create: `lib/forms/request.ts`
- Create: `lib/forms/content.ts`
- Create: `tests/unit/forms/request.test.ts`
- Create: `tests/unit/forms/content.test.ts`

**Interfaces:**
- Consumes: `SafeFormErrorCode`, `FormSubmitResult`, `FormEndpoint` from `lib/forms/contracts.ts`.
- Produces: `FormFault`, `toErrorResult`, `readFormJson(request, allowedOrigins)`, `escapeHtml`, `normalizeMultiline`, `assertSafeHeader`, and `deriveRequestIdentifier`.

- [ ] **Step 1: Write failing transport and content tests**

Create `tests/unit/forms/request.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { FormFault } from "../../../lib/forms/errors";
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
  await expect(promise).rejects.toMatchObject<FormFault>({ code, status });
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
```

Create `tests/unit/forms/content.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  assertSafeHeader,
  deriveRequestIdentifier,
  escapeHtml,
  normalizeMultiline,
} from "../../../lib/forms/content";

describe("form content safety", () => {
  it("escapes every HTML metacharacter and preserves line meaning", () => {
    expect(escapeHtml(`<script>alert("x")</script> & 'quoted'`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;quoted&#39;",
    );
    expect(normalizeMultiline("one\r\ntwo\0three")).toBe("one\ntwothree");
  });

  it("rejects header control characters", () => {
    expect(() => assertSafeHeader("safe subject")).not.toThrow();
    expect(() => assertSafeHeader("safe\r\nBcc: attacker@example.test")).toThrow(/header controls/);
  });

  it("derives stable endpoint-scoped non-reversible identifiers", () => {
    const id = "9a7449c2-6a48-4970-92ea-6919a22e7f55";
    const secret = "test-only-secret-with-more-than-thirty-two-characters";
    expect(deriveRequestIdentifier("prayer", id, secret)).toMatch(/^P-[A-F0-9]{16}$/);
    expect(deriveRequestIdentifier("prayer", id, secret)).toBe(
      deriveRequestIdentifier("prayer", id, secret),
    );
    expect(deriveRequestIdentifier("prayer", id, secret)).not.toBe(
      deriveRequestIdentifier("contact", id, secret),
    );
    expect(deriveRequestIdentifier("prayer", id, secret)).not.toContain(id);
  });
});
```

- [ ] **Step 2: Run tests to verify the modules are missing**

Run: `npm test -- tests/unit/forms/request.test.ts tests/unit/forms/content.test.ts`

Expected: FAIL with unresolved imports for `errors`, `request`, and `content`.

- [ ] **Step 3: Implement privacy-safe faults and request parsing**

Create `lib/forms/errors.ts`:

```ts
import type { FormSubmitResult, SafeFormErrorCode } from "./contracts";

const messages: Record<SafeFormErrorCode, string> = {
  invalid_origin: "This submission could not be verified. Refresh the page and try again.",
  invalid_content_type: "This form sent an unsupported request. Refresh the page and try again.",
  body_too_large: "This submission is too large. Shorten the message and try again.",
  invalid_json: "This submission could not be read. Refresh the page and try again.",
  invalid_fields: "Review the highlighted fields and try again.",
  bot_rejected: "This submission could not be accepted.",
  turnstile_failed: "Complete the security check and try again.",
  turnstile_expired: "The security check expired. Complete the new check and try again.",
  already_processing: "This submission is still processing. Wait a moment and try again.",
  provider_unavailable: "We could not deliver this right now. Your text is still here; please try again.",
  configuration_error: "This form is temporarily unavailable. Please try again later.",
  network_error: "The network request did not finish. Check your connection and try again.",
};

export class FormFault extends Error {
  constructor(
    public readonly code: SafeFormErrorCode,
    public readonly status: number,
    public readonly retryable: boolean,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(messages[code]);
    this.name = "FormFault";
  }
}

export function toErrorResult(fault: FormFault): Extract<FormSubmitResult, { ok: false }> {
  return {
    ok: false,
    status: "error",
    code: fault.code,
    retryable: fault.retryable,
    message: messages[fault.code],
    ...(fault.fieldErrors ? { fieldErrors: fault.fieldErrors } : {}),
  };
}
```

Create `lib/forms/request.ts`:

```ts
import "server-only";
import { FormFault } from "./errors";

const MAX_BODY_BYTES = 16_384;

export async function readFormJson(
  request: Request,
  allowedOrigins: readonly string[],
): Promise<Record<string, unknown>> {
  if (request.method !== "POST") {
    throw new FormFault("invalid_content_type", 405, false);
  }
  const origin = request.headers.get("origin");
  if (!origin || !allowedOrigins.includes(origin)) {
    throw new FormFault("invalid_origin", 403, false);
  }
  const mediaType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (mediaType !== "application/json") {
    throw new FormFault("invalid_content_type", 415, false);
  }
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new FormFault("body_too_large", 413, false);
  }
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new FormFault("body_too_large", 413, false);
      }
      chunks.push(value);
    }
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new FormFault("invalid_json", 400, false);
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new FormFault("invalid_json", 400, false);
  }
  const record = value as Record<string, unknown>;
  if (typeof record.website === "string" && record.website.trim() !== "") {
    throw new FormFault("bot_rejected", 400, false);
  }
  return record;
}
```

- [ ] **Step 4: Implement content normalization, escaping, and identifiers**

Create `lib/forms/content.ts`:

```ts
import "server-only";
import { createHmac } from "node:crypto";
import type { FormEndpoint } from "./contracts";

export function normalizeMultiline(value: string): string {
  return value.replace(/\0/g, "").replace(/\r\n?/g, "\n").trim();
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export function assertSafeHeader(value: string): string {
  if (/[\r\n\0]/.test(value)) throw new Error("header controls are not allowed");
  return value;
}

export function deriveRequestIdentifier(
  endpoint: Extract<FormEndpoint, "prayer" | "contact">,
  submissionId: string,
  secret: string,
): string {
  const prefix = endpoint === "prayer" ? "P" : "C";
  const digest = createHmac("sha256", secret)
    .update(`${endpoint}:${submissionId}`)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();
  return `${prefix}-${digest}`;
}
```

- [ ] **Step 5: Run the focused tests**

Run:

```bash
npm test -- tests/unit/forms/request.test.ts tests/unit/forms/content.test.ts
npm run typecheck
```

Expected: all focused tests PASS; typecheck exits 0.

- [ ] **Step 6: Commit the transport boundary**

```bash
git add lib/forms/errors.ts lib/forms/request.ts lib/forms/content.ts tests/unit/forms/request.test.ts tests/unit/forms/content.test.ts
git commit -m "feat: enforce safe form transport"
```

### Task 3: Validate Turnstile and make retries idempotent

**Files:**
- Create: `lib/forms/turnstile.ts`
- Create: `lib/forms/idempotency.ts`
- Create: `tests/unit/forms/turnstile.test.ts`
- Create: `tests/unit/forms/idempotency.test.ts`

**Interfaces:**
- Consumes: `TurnstileAction`, `FormEndpoint`, validated Turnstile/Redis environment.
- Produces: `TurnstileVerifier`, `createTurnstileVerifier`, `IdempotencyStore`, `MemoryIdempotencyStore`, `RedisIdempotencyStore`, `opaqueIdempotencyKey`, and `IdempotencyClaim` exactly as declared above.

- [ ] **Step 1: Write failing Turnstile and idempotency tests**

Create `tests/unit/forms/turnstile.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { createTurnstileVerifier } from "../../../lib/forms/turnstile";

const submissionId = "9a7449c2-6a48-4970-92ea-6919a22e7f55";

function verifier(response: object) {
  const fetcher = vi.fn(async () =>
    new Response(JSON.stringify(response), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
  return {
    fetcher,
    verifier: createTurnstileVerifier({
      secret: "test-secret",
      hostnames: ["www.thelioncompany.org"],
      fetcher,
    }),
  };
}

describe("Turnstile verifier", () => {
  it("sends no remote IP and validates action, hostname, and idempotency key", async () => {
    const fixture = verifier({
      success: true,
      hostname: "www.thelioncompany.org",
      action: "prayer_submit",
      "error-codes": [],
    });
    await expect(
      fixture.verifier.verify({ token: "token", action: "prayer_submit", submissionId }),
    ).resolves.toEqual({ ok: true });
    const init = fixture.fetcher.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(init.body))).toEqual({
      secret: "test-secret",
      response: "token",
      idempotency_key: submissionId,
    });
  });

  it("rejects action and hostname mismatches", async () => {
    for (const response of [
      { success: true, hostname: "attacker.test", action: "prayer_submit", "error-codes": [] },
      { success: true, hostname: "www.thelioncompany.org", action: "contact_submit", "error-codes": [] },
    ]) {
      const fixture = verifier(response);
      await expect(
        fixture.verifier.verify({ token: "token", action: "prayer_submit", submissionId }),
      ).resolves.toEqual({ ok: false, code: "turnstile_failed" });
    }
  });

  it("maps timeout-or-duplicate to an expiring/resettable result", async () => {
    const fixture = verifier({
      success: false,
      hostname: "www.thelioncompany.org",
      action: "prayer_submit",
      "error-codes": ["timeout-or-duplicate"],
    });
    await expect(
      fixture.verifier.verify({ token: "token", action: "prayer_submit", submissionId }),
    ).resolves.toEqual({ ok: false, code: "turnstile_expired" });
  });
});
```

Create `tests/unit/forms/idempotency.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the focused tests to verify failure**

Run: `npm test -- tests/unit/forms/turnstile.test.ts tests/unit/forms/idempotency.test.ts`

Expected: FAIL because both modules are absent.

- [ ] **Step 3: Implement strict server-side Turnstile verification**

Create `lib/forms/turnstile.ts`:

```ts
import "server-only";
import { z } from "zod";
import type { TurnstileAction } from "./contracts";

const responseSchema = z.object({
  success: z.boolean(),
  hostname: z.string().optional(),
  action: z.string().optional(),
  "error-codes": z.array(z.string()).default([]),
});

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
          !parsed.data.hostname ||
          !config.hostnames.includes(parsed.data.hostname) ||
          parsed.data.action !== input.action
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
```

- [ ] **Step 4: Implement HMAC locks for memory and Redis**

Create `lib/forms/idempotency.ts`:

```ts
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
```

Both accepted-state promotion and release are compare-and-set operations. A worker whose five-minute lease has expired cannot overwrite or delete a replacement owner's lock. The same submission UUID is also passed as Brevo's idempotency key, and the stable request identifier lets responders investigate the rare provider-accepted/store-indeterminate case without exposing form content.

- [ ] **Step 5: Run focused and type checks**

Run:

```bash
npm test -- tests/unit/forms/turnstile.test.ts tests/unit/forms/idempotency.test.ts
npm run typecheck
```

Expected: all focused tests PASS; typecheck exits 0.

- [ ] **Step 6: Commit the abuse-control core**

```bash
git add lib/forms/turnstile.ts lib/forms/idempotency.ts tests/unit/forms/turnstile.test.ts tests/unit/forms/idempotency.test.ts
git commit -m "feat: add turnstile and idempotency controls"
```

### Task 4: Encapsulate Brevo DOI and transactional delivery

**Files:**
- Create: `lib/forms/provider.ts`
- Create: `lib/forms/email-templates.ts`
- Create: `lib/forms/brevo.ts`
- Create: `lib/forms/no-send.ts`
- Create: `tests/unit/forms/provider.test.ts`

**Interfaces:**
- Consumes: normalized validated form fields, `DeliveryMode`, `ContactReason`, content-safety helpers.
- Produces: `FormDeliveryProvider`, three delivery input types, `ProviderReceipt`, `ProviderFault`, `BrevoFormProvider`, `NoSendFormProvider`, `renderPrayerEmail`, and `renderContactEmail`.

- [ ] **Step 1: Write failing provider tests**

Create `tests/unit/forms/provider.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { BrevoFormProvider } from "../../../lib/forms/brevo";
import { renderPrayerEmail } from "../../../lib/forms/email-templates";
import { NoSendFormProvider } from "../../../lib/forms/no-send";

const submissionId = "9a7449c2-6a48-4970-92ea-6919a22e7f55";

function client() {
  return {
    contacts: { createDoiContact: vi.fn(async () => ({})) },
    transactionalEmails: {
      sendTransacEmail: vi.fn(async () => ({ messageId: "provider-message-1" })),
    },
  };
}

const config = {
  mode: "test-recipient" as const,
  siteUrl: new URL("https://www.thelioncompany.org"),
  newsletterListId: 12,
  doiTemplateId: 34,
  sender: { email: "forms@thelioncompany.org", name: "The Lion Company" },
  prayerRecipient: "prayer@thelioncompany.org",
  contactRecipient: "contact@thelioncompany.org",
  testRecipient: "reviewer@example.org",
};

describe("Brevo form provider", () => {
  it("uses native DOI with consent metadata and the canonical confirmation route", async () => {
    const fake = client();
    const provider = new BrevoFormProvider(fake, config);
    await provider.requestNewsletter({
      submissionId,
      email: "person@example.org",
      firstName: "Ada",
      placement: "inline",
      consentVersion: "2026-07-11",
      consentTimestamp: "2026-07-11T12:00:00.000Z",
    });
    expect(fake.contacts.createDoiContact).toHaveBeenCalledWith({
      email: "reviewer@example.org",
      includeListIds: [12],
      redirectionUrl: "https://www.thelioncompany.org/newsletter/confirmed",
      templateId: 34,
      attributes: {
        FIRSTNAME: "Ada",
        CONSENT_VERSION: "2026-07-11",
        CONSENT_TIMESTAMP: "2026-07-11T12:00:00.000Z",
        CONSENT_PLACEMENT: "inline",
        CONSENT_SOURCE: "website",
      },
    });
  });

  it("rewrites transactional recipients in preview and passes Brevo idempotency", async () => {
    const fake = client();
    const provider = new BrevoFormProvider(fake, config);
    await provider.deliverPrayer({
      submissionId,
      requestIdentifier: "P-0123456789ABCDEF",
      displayName: "Ada",
      email: "ada@example.org",
      request: "Please pray for <wisdom> & peace this week.",
      followUpRequested: true,
    });
    expect(fake.transactionalEmails.sendTransacEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Prayer request P-0123456789ABCDEF",
        to: [{ email: "reviewer@example.org" }],
        replyTo: { email: "ada@example.org" },
        headers: { "Idempotency-Key": submissionId },
        textContent: expect.stringContaining("Please pray for <wisdom> & peace"),
        htmlContent: expect.stringContaining("&lt;wisdom&gt; &amp; peace"),
      }),
      { maxRetries: 1, timeoutInSeconds: 8 },
    );
  });

  it("returns the same DOI receipt for only the provider duplicate code", async () => {
    const fake = client();
    fake.contacts.createDoiContact.mockRejectedValueOnce({
      body: { code: "duplicate_parameter" },
    });
    const provider = new BrevoFormProvider(fake, config);
    await expect(
      provider.requestNewsletter({
        submissionId,
        email: "person@example.org",
        placement: "connect",
        consentVersion: "2026-07-11",
        consentTimestamp: "2026-07-11T12:00:00.000Z",
      }),
    ).resolves.toEqual({ providerMessageId: `doi:${submissionId}` });
    fake.contacts.createDoiContact.mockRejectedValueOnce({ body: { code: "invalid_parameter" } });
    await expect(
      provider.requestNewsletter({
        submissionId,
        email: "person@example.org",
        placement: "connect",
        consentVersion: "2026-07-11",
        consentTimestamp: "2026-07-11T12:00:00.000Z",
      }),
    ).rejects.toMatchObject({ name: "ProviderFault" });
  });
});

describe("controlled messages and no-send", () => {
  it("never places prayer text or name in a subject", () => {
    const email = renderPrayerEmail({
      requestIdentifier: "P-0123456789ABCDEF",
      displayName: "Ada",
      request: "Please pray for wisdom and peace this week.",
      followUpRequested: false,
    });
    expect(email.subject).toBe("Prayer request P-0123456789ABCDEF");
    expect(email.subject).not.toContain("Ada");
    expect(email.subject).not.toContain("wisdom");
  });

  it("makes no network request in no-send mode", async () => {
    const provider = new NoSendFormProvider();
    await expect(
      provider.requestNewsletter({
        submissionId,
        email: "person@example.org",
        placement: "prompt",
        consentVersion: "2026-07-11",
        consentTimestamp: "2026-07-11T12:00:00.000Z",
      }),
    ).resolves.toEqual({ providerMessageId: `no-send:${submissionId}` });
  });
});
```

- [ ] **Step 2: Run the provider tests to verify failure**

Run: `npm test -- tests/unit/forms/provider.test.ts`

Expected: FAIL because provider and template modules do not exist.

- [ ] **Step 3: Define the provider boundary and controlled message renderers**

Create `lib/forms/provider.ts`:

```ts
import type { ContactReason, NewsletterPlacement } from "./contracts";

export type NewsletterDeliveryInput = {
  submissionId: string;
  email: string;
  firstName?: string;
  placement: NewsletterPlacement;
  consentVersion: string;
  consentTimestamp: string;
};

export type PrayerDeliveryInput = {
  submissionId: string;
  requestIdentifier: string;
  displayName?: string;
  email?: string;
  request: string;
  followUpRequested: boolean;
};

export type ContactDeliveryInput = {
  submissionId: string;
  requestIdentifier: string;
  name: string;
  email: string;
  reason: ContactReason;
  message: string;
};

export type ProviderReceipt = { providerMessageId: string };

export interface FormDeliveryProvider {
  requestNewsletter(input: NewsletterDeliveryInput): Promise<ProviderReceipt>;
  deliverPrayer(input: PrayerDeliveryInput): Promise<ProviderReceipt>;
  deliverContact(input: ContactDeliveryInput): Promise<ProviderReceipt>;
}

export class ProviderFault extends Error {
  constructor() {
    super("provider unavailable");
    this.name = "ProviderFault";
  }
}
```

Create `lib/forms/email-templates.ts`:

```ts
import "server-only";
import { assertSafeHeader, escapeHtml, normalizeMultiline } from "./content";
import type { ContactDeliveryInput, PrayerDeliveryInput } from "./provider";

type Message = { subject: string; textContent: string; htmlContent: string };

function paragraph(value: string): string {
  return escapeHtml(normalizeMultiline(value)).replace(/\n/g, "<br>");
}

export function renderPrayerEmail(
  input: Omit<PrayerDeliveryInput, "submissionId" | "email">,
): Message {
  const subject = assertSafeHeader(`Prayer request ${input.requestIdentifier}`);
  const name = input.displayName ?? "Anonymous";
  const followUp = input.followUpRequested ? "Yes" : "No";
  return {
    subject,
    textContent: [
      `Request: ${input.requestIdentifier}`,
      `Name: ${name}`,
      `Follow-up requested: ${followUp}`,
      "",
      normalizeMultiline(input.request),
    ].join("\n"),
    htmlContent: [
      "<!doctype html><html><body>",
      `<p><strong>Request:</strong> ${escapeHtml(input.requestIdentifier)}</p>`,
      `<p><strong>Name:</strong> ${escapeHtml(name)}</p>`,
      `<p><strong>Follow-up requested:</strong> ${followUp}</p>`,
      `<p>${paragraph(input.request)}</p>`,
      "</body></html>",
    ].join(""),
  };
}

export function renderContactEmail(
  input: Omit<ContactDeliveryInput, "submissionId" | "email">,
): Message {
  const subject = assertSafeHeader(`Contact request ${input.requestIdentifier}`);
  return {
    subject,
    textContent: [
      `Request: ${input.requestIdentifier}`,
      `Name: ${input.name}`,
      `Reason: ${input.reason}`,
      "",
      normalizeMultiline(input.message),
    ].join("\n"),
    htmlContent: [
      "<!doctype html><html><body>",
      `<p><strong>Request:</strong> ${escapeHtml(input.requestIdentifier)}</p>`,
      `<p><strong>Name:</strong> ${escapeHtml(input.name)}</p>`,
      `<p><strong>Reason:</strong> ${escapeHtml(input.reason)}</p>`,
      `<p>${paragraph(input.message)}</p>`,
      "</body></html>",
    ].join(""),
  };
}
```

- [ ] **Step 4: Implement Brevo and no-send adapters**

Create `lib/forms/brevo.ts`:

```ts
import "server-only";
import type { DeliveryMode } from "./contracts";
import { renderContactEmail, renderPrayerEmail } from "./email-templates";
import type {
  ContactDeliveryInput,
  FormDeliveryProvider,
  NewsletterDeliveryInput,
  PrayerDeliveryInput,
  ProviderReceipt,
} from "./provider";
import { ProviderFault } from "./provider";

type BrevoLike = {
  contacts: {
    createDoiContact(input: {
      email: string;
      includeListIds: number[];
      redirectionUrl: string;
      templateId: number;
      attributes: Record<string, string>;
    }): Promise<unknown>;
  };
  transactionalEmails: {
    sendTransacEmail(
      input: {
        sender: { email: string; name: string };
        to: Array<{ email: string }>;
        replyTo?: { email: string };
        subject: string;
        textContent: string;
        htmlContent: string;
        headers: { "Idempotency-Key": string };
        tags: string[];
      },
      options: { maxRetries: number; timeoutInSeconds: number },
    ): Promise<{ messageId?: string }>;
  };
};

type Config = {
  mode: Extract<DeliveryMode, "test-recipient" | "live">;
  siteUrl: URL;
  newsletterListId: number;
  doiTemplateId: number;
  sender: { email: string; name: string };
  prayerRecipient: string;
  contactRecipient: string;
  testRecipient?: string;
};

function isDuplicateDoi(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("body" in error)) return false;
  const body = (error as { body?: unknown }).body;
  return Boolean(
    body &&
      typeof body === "object" &&
      "code" in body &&
      (body as { code?: unknown }).code === "duplicate_parameter",
  );
}

export class BrevoFormProvider implements FormDeliveryProvider {
  constructor(
    private readonly client: BrevoLike,
    private readonly config: Config,
  ) {}

  async requestNewsletter(input: NewsletterDeliveryInput): Promise<ProviderReceipt> {
    const recipient =
      this.config.mode === "test-recipient" ? this.config.testRecipient : input.email;
    if (!recipient) throw new ProviderFault();
    try {
      await this.client.contacts.createDoiContact({
        email: recipient,
        includeListIds: [this.config.newsletterListId],
        redirectionUrl: new URL("/newsletter/confirmed", this.config.siteUrl).toString(),
        templateId: this.config.doiTemplateId,
        attributes: {
          ...(input.firstName ? { FIRSTNAME: input.firstName } : {}),
          CONSENT_VERSION: input.consentVersion,
          CONSENT_TIMESTAMP: input.consentTimestamp,
          CONSENT_PLACEMENT: input.placement,
          CONSENT_SOURCE: "website",
        },
      });
      return { providerMessageId: `doi:${input.submissionId}` };
    } catch (error) {
      if (isDuplicateDoi(error)) return { providerMessageId: `doi:${input.submissionId}` };
      throw new ProviderFault();
    }
  }

  async deliverPrayer(input: PrayerDeliveryInput): Promise<ProviderReceipt> {
    const message = renderPrayerEmail(input);
    return this.send({
      submissionId: input.submissionId,
      recipient: this.config.prayerRecipient,
      replyTo: input.email,
      tag: "form-prayer",
      ...message,
    });
  }

  async deliverContact(input: ContactDeliveryInput): Promise<ProviderReceipt> {
    const message = renderContactEmail(input);
    return this.send({
      submissionId: input.submissionId,
      recipient: this.config.contactRecipient,
      replyTo: input.email,
      tag: "form-contact",
      ...message,
    });
  }

  private async send(input: {
    submissionId: string;
    recipient: string;
    replyTo?: string;
    tag: string;
    subject: string;
    textContent: string;
    htmlContent: string;
  }): Promise<ProviderReceipt> {
    const recipient =
      this.config.mode === "test-recipient" ? this.config.testRecipient : input.recipient;
    if (!recipient) throw new ProviderFault();
    try {
      const result = await this.client.transactionalEmails.sendTransacEmail(
        {
          sender: this.config.sender,
          to: [{ email: recipient }],
          ...(input.replyTo ? { replyTo: { email: input.replyTo } } : {}),
          subject: input.subject,
          textContent: input.textContent,
          htmlContent: input.htmlContent,
          headers: { "Idempotency-Key": input.submissionId },
          tags: [input.tag],
        },
        { maxRetries: 1, timeoutInSeconds: 8 },
      );
      if (!result.messageId) throw new ProviderFault();
      return { providerMessageId: result.messageId };
    } catch {
      throw new ProviderFault();
    }
  }
}
```

Create `lib/forms/no-send.ts`:

```ts
import "server-only";
import type {
  ContactDeliveryInput,
  FormDeliveryProvider,
  NewsletterDeliveryInput,
  PrayerDeliveryInput,
  ProviderReceipt,
} from "./provider";

function receipt(submissionId: string): ProviderReceipt {
  return { providerMessageId: `no-send:${submissionId}` };
}

export class NoSendFormProvider implements FormDeliveryProvider {
  async requestNewsletter(input: NewsletterDeliveryInput): Promise<ProviderReceipt> {
    return receipt(input.submissionId);
  }
  async deliverPrayer(input: PrayerDeliveryInput): Promise<ProviderReceipt> {
    return receipt(input.submissionId);
  }
  async deliverContact(input: ContactDeliveryInput): Promise<ProviderReceipt> {
    return receipt(input.submissionId);
  }
}
```

- [ ] **Step 5: Run provider checks**

Run:

```bash
npm test -- tests/unit/forms/provider.test.ts
npm run typecheck
```

Expected: provider tests PASS; typecheck exits 0; test output contains no submitted email, name, prayer, or contact content.

- [ ] **Step 6: Commit the replaceable provider boundary**

```bash
git add lib/forms/provider.ts lib/forms/email-templates.ts lib/forms/brevo.ts lib/forms/no-send.ts tests/unit/forms/provider.test.ts
git commit -m "feat: add brevo form delivery adapters"
```

### Task 5: Orchestrate safe handlers and bind all three routes

**Files:**
- Create: `lib/forms/logger.ts`
- Create: `lib/forms/handler.ts`
- Create: `lib/forms/services.ts`
- Create: `app/api/forms/newsletter/route.ts`
- Create: `app/api/forms/prayer/route.ts`
- Create: `app/api/forms/contact/route.ts`
- Create: `tests/unit/forms/handler.test.ts`
- Create: `tests/integration/form-routes.test.ts`

**Interfaces:**
- Consumes: every server interface from Tasks 1–4.
- Produces: `handleFormRequest(request, endpoint, dependencies): Promise<Response>`, `getFormServices()`, and the three POST endpoints with `runtime="nodejs"`, `dynamic="force-dynamic"`, and `Cache-Control: no-store`.

- [ ] **Step 1: Write failing handler tests**

Create `tests/unit/forms/handler.test.ts`:

```ts
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

function dependencies(): FormHandlerDependencies & {
  provider: FormHandlerDependencies["provider"] & {
    requestNewsletter: ReturnType<typeof vi.fn>;
    deliverPrayer: ReturnType<typeof vi.fn>;
    deliverContact: ReturnType<typeof vi.fn>;
  };
  logger: { log: ReturnType<typeof vi.fn>; countPrayerAccepted: ReturnType<typeof vi.fn> };
} {
  const receipt = async () => ({ providerMessageId: "provider-message-1" });
  return {
    allowedOrigins: [origin],
    deliveryMode: "live",
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
    logger: { log: vi.fn(), countPrayerAccepted: vi.fn() },
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
```

- [ ] **Step 2: Run the handler test to verify failure**

Run: `npm test -- tests/unit/forms/handler.test.ts`

Expected: FAIL because `handler.ts` and `logger.ts` do not exist.

- [ ] **Step 3: Implement safe logging and orchestration**

Create `lib/forms/logger.ts`:

```ts
import "server-only";
import type { FormEndpoint, SafeFormErrorCode } from "./contracts";

export type SafeFormLog = {
  requestId: string;
  endpoint: FormEndpoint;
  status: number;
  durationMs: number;
  errorClass?: SafeFormErrorCode;
};

export interface SafeFormLogger {
  log(record: SafeFormLog): void;
  countPrayerAccepted(utcDay: string): void;
}

export const safeFormLogger: SafeFormLogger = {
  log(record) {
    console.info(JSON.stringify({ event: "form_request", ...record }));
  },
  countPrayerAccepted(utcDay) {
    console.info(JSON.stringify({ event: "prayer_accepted", endpoint: "prayer", utcDay, acceptedCount: 1 }));
  },
};
```

Create `lib/forms/handler.ts`:

```ts
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
      throw new FormFault("invalid_fields", 422, false, parsed.error.flatten().fieldErrors);
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
```

- [ ] **Step 4: Build validated runtime services**

Create `lib/forms/services.ts`:

```ts
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
```

- [ ] **Step 5: Bind three minimal route handlers**

Create `app/api/forms/newsletter/route.ts`:

```ts
import { handleFormRequest } from "../../../../lib/forms/handler";
import { getFormServices } from "../../../../lib/forms/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleFormRequest(request, "newsletter", getFormServices());
}
```

Create `app/api/forms/prayer/route.ts`:

```ts
import { handleFormRequest } from "../../../../lib/forms/handler";
import { getFormServices } from "../../../../lib/forms/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleFormRequest(request, "prayer", getFormServices());
}
```

Create `app/api/forms/contact/route.ts`:

```ts
import { handleFormRequest } from "../../../../lib/forms/handler";
import { getFormServices } from "../../../../lib/forms/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleFormRequest(request, "contact", getFormServices());
}
```

- [ ] **Step 6: Add route-contract integration tests**

Create `tests/integration/form-routes.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const routes = ["newsletter", "prayer", "contact"] as const;

describe("form route bindings", () => {
  for (const endpoint of routes) {
    it(`${endpoint} is a dynamic Node POST-only binding`, async () => {
      const source = await readFile(
        resolve(`app/api/forms/${endpoint}/route.ts`),
        "utf8",
      );
      expect(source).toContain('export const runtime = "nodejs"');
      expect(source).toContain('export const dynamic = "force-dynamic"');
      expect(source).toContain("export async function POST");
      expect(source).not.toContain("function GET");
      expect(source).not.toContain("function OPTIONS");
      expect(source).toContain(`handleFormRequest(request, "${endpoint}"`);
    });
  }
});
```

- [ ] **Step 7: Run server-side form verification**

Run:

```bash
npm test -- tests/unit/forms/handler.test.ts tests/integration/form-routes.test.ts
npm run typecheck
npm run lint
```

Expected: tests PASS; typecheck and lint exit 0; no response contains a provider identifier or submitted value.

- [ ] **Step 8: Commit the working server endpoints**

```bash
git add lib/forms/logger.ts lib/forms/handler.ts lib/forms/services.ts app/api/forms tests/unit/forms/handler.test.ts tests/integration/form-routes.test.ts
git commit -m "feat: add secure form endpoints"
```

### Task 6: Build accessible local form state machines

**Files:**
- Create: `components/client/forms/use-form-machine.ts`
- Create: `components/client/forms/turnstile-field.tsx`
- Create: `components/client/forms/form-feedback.tsx`
- Create: `components/client/forms/newsletter-form.tsx`
- Create: `components/client/forms/prayer-form.tsx`
- Create: `components/client/forms/contact-form.tsx`
- Create: `components/client/forms/forms.module.css`
- Create: `tests/components/forms.test.tsx`

**Interfaces:**
- Consumes: `FormSubmitResult`, endpoint/placement/reason types, `publicFormConfig`, and normal same-origin anchors/layout from the experience plan.
- Produces: the three frozen experience-plan component APIs, a stable retry UUID, error retention/focus, Turnstile reset behavior, and visible preview mode.

- [ ] **Step 1: Write failing state-machine component tests**

Create `tests/components/forms.test.tsx`:

```tsx
import React, { act, forwardRef, useImperativeHandle } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/forms/public-config", () => ({
  publicFormConfig: { turnstileSiteKey: "test-site-key", deliveryMode: "no-send" },
}));

vi.mock("../../components/client/analytics-provider", () => ({
  useAnalytics: () => ({ track: vi.fn() }),
}));

vi.mock("@marsidev/react-turnstile", () => ({
  Turnstile: forwardRef(function MockTurnstile(
    props: { onSuccess(token: string): void; onExpire(): void },
    ref: React.ForwardedRef<{ reset(): void }>,
  ) {
    useImperativeHandle(ref, () => ({ reset: vi.fn() }));
    return (
      <button type="button" onClick={() => props.onSuccess("turnstile-token")}>
        Complete security check
      </button>
    );
  }),
}));

import { ContactForm } from "../../components/client/forms/contact-form";
import { NewsletterForm } from "../../components/client/forms/newsletter-form";
import { PrayerForm } from "../../components/client/forms/prayer-form";

const accepted = {
  ok: true,
  status: "accepted",
  submissionId: "9a7449c2-6a48-4970-92ea-6919a22e7f55",
  deliveryMode: "no-send",
  replayed: false,
  message: "Preview test accepted — no message was sent.",
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json(accepted, { status: 202 })));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

async function completeSecurity() {
  fireEvent.click(screen.getByRole("button", { name: /complete security check/i }));
}

describe("form components", () => {
  it("emits unique IDs when inline and prompt newsletter forms coexist", () => {
    const { container } = render(
      <>
        <NewsletterForm placement="inline" />
        <NewsletterForm placement="prompt" />
      </>,
    );
    const ids = [...container.querySelectorAll<HTMLElement>("[id]")].map(
      (element) => element.id,
    );
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("submits newsletter consent, announces no-send, and calls onAccepted once", async () => {
    const onAccepted = vi.fn();
    render(<NewsletterForm placement="inline" onAccepted={onAccepted} />);
    expect(screen.getByText(/preview test mode/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "person@example.org" },
    });
    fireEvent.click(screen.getByLabelText(/send me the monthly field notes/i));
    await completeSecurity();
    fireEvent.submit(screen.getByRole("form", { name: /monthly field notes/i }));
    expect(await screen.findByRole("heading", { name: /preview test accepted/i })).toHaveFocus();
    expect(onAccepted).toHaveBeenCalledTimes(1);
  });

  it("locks all fields and coalesces rapid duplicate submit events", async () => {
    let resolveFetch!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(
      () => new Promise<Response>((resolve) => { resolveFetch = resolve; }),
    );
    render(<NewsletterForm placement="inline" />);
    const email = screen.getByLabelText(/email address/i);
    fireEvent.change(email, { target: { value: "person@example.org" } });
    fireEvent.click(screen.getByLabelText(/send me the monthly field notes/i));
    await completeSecurity();
    const form = screen.getByRole("form", { name: /monthly field notes/i });
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(email).toBeDisabled();
    resolveFetch(Response.json(accepted, { status: 202 }));
    expect(await screen.findByRole("heading", { name: /preview test accepted/i })).toHaveFocus();
  });

  it("never treats malformed success JSON or a non-202 response as acceptance", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({ ok: true, message: "false success" }, { status: 500 }),
    );
    render(<NewsletterForm placement="inline" />);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "person@example.org" } });
    fireEvent.click(screen.getByLabelText(/send me the monthly field notes/i));
    await completeSecurity();
    fireEvent.submit(screen.getByRole("form", { name: /monthly field notes/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/network request did not finish/i);
    expect(screen.queryByText("false success")).not.toBeInTheDocument();
  });

  it("times out a hung request after ten seconds without clearing private text", async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockImplementationOnce((_input, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    }));
    render(<PrayerForm placement="prayer" />);
    const request = screen.getByLabelText(/prayer request/i);
    fireEvent.change(request, { target: { value: "Please pray for wisdom and peace this week." } });
    await completeSecurity();
    fireEvent.submit(screen.getByRole("form", { name: /private prayer request/i }));
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(screen.getByRole("alert")).toHaveTextContent(/network request did not finish/i);
    expect(request).toHaveValue("Please pray for wisdom and peace this week.");
  });

  it("retains prayer text and reuses the UUID for an unedited retry", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        Response.json(
          {
            ok: false,
            status: "error",
            code: "provider_unavailable",
            retryable: true,
            message: "We could not deliver this right now. Your text is still here; please try again.",
          },
          { status: 503 },
        ),
      )
      .mockResolvedValueOnce(Response.json(accepted, { status: 202 }));
    render(<PrayerForm placement="prayer" />);
    const textarea = screen.getByLabelText(/prayer request/i);
    fireEvent.change(textarea, {
      target: { value: "Please pray for wisdom and peace this week." },
    });
    await completeSecurity();
    fireEvent.submit(screen.getByRole("form", { name: /private prayer request/i }));
    expect(await screen.findByText(/could not deliver/i)).toBeInTheDocument();
    expect(textarea).toHaveValue("Please pray for wisdom and peace this week.");
    await completeSecurity();
    fireEvent.submit(screen.getByRole("form", { name: /private prayer request/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const first = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    const second = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    expect(first.submissionId).toBe(second.submissionId);
  });

  it("focuses the first invalid contact field and preserves values", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json(
        {
          ok: false,
          status: "error",
          code: "invalid_fields",
          retryable: false,
          message: "Review the highlighted fields and try again.",
          fieldErrors: { message: ["Enter at least 20 characters."] },
        },
        { status: 422 },
      ),
    );
    render(<ContactForm defaultReason="general" />);
    fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "ada@example.org" },
    });
    fireEvent.change(screen.getByLabelText(/^message/i), { target: { value: "short" } });
    await completeSecurity();
    fireEvent.submit(screen.getByRole("form", { name: /contact the lion company/i }));
    await waitFor(() => expect(screen.getByLabelText(/^message/i)).toHaveFocus());
    expect(screen.getByLabelText(/^name/i)).toHaveValue("Ada");
  });
});
```

- [ ] **Step 2: Run the component test to verify failure**

Run: `npm test -- tests/components/forms.test.tsx`

Expected: FAIL because the client form modules do not exist.

- [ ] **Step 3: Implement the stable local submission machine**

Create `components/client/forms/use-form-machine.ts`:

```ts
"use client";

import { useCallback, useRef, useState } from "react";
import {
  deliveryModeSchema,
  safeFormErrorCodeSchema,
  type FormEndpoint,
  type FormSubmitResult,
  type SafeFormErrorCode,
} from "../../../lib/forms/contracts";

type State =
  | { name: "editing" }
  | { name: "submitting" }
  | { name: "accepted"; result: Extract<FormSubmitResult, { ok: true }> }
  | { name: "error"; result: Extract<FormSubmitResult, { ok: false }> };

const networkError: Extract<FormSubmitResult, { ok: false }> = {
  ok: false,
  status: "error",
  code: "network_error",
  retryable: true,
  message: "The network request did not finish. Check your connection and try again.",
};

function parseResult(value: unknown, response: Response, submissionId: string): FormSubmitResult | null {
  if (!value || typeof value !== "object") return null;
  const result = value as Record<string, unknown>;
  if (result.ok === true) {
    if (
      response.status !== 202 ||
      result.status !== "accepted" ||
      result.submissionId !== submissionId ||
      typeof result.replayed !== "boolean" ||
      typeof result.message !== "string" ||
      !deliveryModeSchema.safeParse(result.deliveryMode).success
    ) return null;
    return result as Extract<FormSubmitResult, { ok: true }>;
  }
  if (
    response.ok ||
    result.ok !== false ||
    result.status !== "error" ||
    typeof result.retryable !== "boolean" ||
    typeof result.message !== "string" ||
    !safeFormErrorCodeSchema.safeParse(result.code).success
  ) return null;
  return result as Extract<FormSubmitResult, { ok: false }>;
}

export function useFormMachine(
  endpoint: FormEndpoint,
  callbacks: { onAccepted?: () => void; onError?: (code: SafeFormErrorCode) => void } = {},
) {
  const [submissionId, setSubmissionId] = useState(() => crypto.randomUUID());
  const [state, setState] = useState<State>({ name: "editing" });
  const [resetSignal, setResetSignal] = useState(0);
  const attempted = useRef(false);
  const inFlight = useRef(false);
  const responseVersion = useRef(0);
  const acceptedCallback = useRef(callbacks.onAccepted);
  const errorCallback = useRef(callbacks.onError);
  acceptedCallback.current = callbacks.onAccepted;
  errorCallback.current = callbacks.onError;

  const markEdited = useCallback(() => {
    if (inFlight.current || !attempted.current) return;
    attempted.current = false;
    responseVersion.current += 1;
    setSubmissionId(crypto.randomUUID());
    setState({ name: "editing" });
    setResetSignal((value) => value + 1);
  }, []);

  const submit = useCallback(
    async (payload: Record<string, unknown>) => {
      if (inFlight.current || state.name === "submitting" || state.name === "accepted") return;
      inFlight.current = true;
      const version = ++responseVersion.current;
      attempted.current = true;
      setState({ name: "submitting" });
      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 10_000);
        let response: Response;
        try {
          response = await fetch(`/api/forms/${endpoint}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ ...payload, submissionId }),
            signal: controller.signal,
          });
        } finally {
          window.clearTimeout(timeout);
        }
        const raw: unknown = await response.json();
        const value = parseResult(raw, response, submissionId);
        if (!value) throw new Error("invalid safe response");
        if (version !== responseVersion.current) return;
        if (value.ok) {
          setState({ name: "accepted", result: value });
          acceptedCallback.current?.();
          return;
        }
        setResetSignal((current) => current + 1);
        setState({ name: "error", result: value });
        errorCallback.current?.(value.code);
      } catch {
        if (version !== responseVersion.current) return;
        setResetSignal((current) => current + 1);
        setState({ name: "error", result: networkError });
        errorCallback.current?.(networkError.code);
      } finally {
        if (version === responseVersion.current) inFlight.current = false;
      }
    },
    [endpoint, state.name, submissionId],
  );

  return { state, submissionId, resetSignal, locked: state.name === "submitting", markEdited, submit };
}
```

- [ ] **Step 4: Implement Turnstile and shared feedback**

Create `components/client/forms/turnstile-field.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import type { TurnstileAction } from "../../../lib/forms/contracts";
import { publicFormConfig } from "../../../lib/forms/public-config";

export function TurnstileField(props: {
  action: TurnstileAction;
  resetSignal: number;
  onToken(token: string): void;
}) {
  const widget = useRef<TurnstileInstance>(null);
  const [message, setMessage] = useState("Complete the security check before submitting.");
  useEffect(() => {
    widget.current?.reset();
    props.onToken("");
    setMessage("Complete the new security check before retrying.");
  }, [props.onToken, props.resetSignal]);
  return (
    <div>
      <Turnstile
        ref={widget}
        siteKey={publicFormConfig.turnstileSiteKey}
        options={{ action: props.action, appearance: "interaction-only", theme: "light" }}
        onSuccess={(token) => {
          props.onToken(token);
          setMessage("Security check complete.");
        }}
        onExpire={() => {
          props.onToken("");
          setMessage("The security check expired. Complete it again.");
          widget.current?.reset();
        }}
        onError={() => {
          props.onToken("");
          setMessage("The security check could not load. Check your connection and try again.");
        }}
      />
      <p aria-live="polite">{message}</p>
    </div>
  );
}
```

Create `components/client/forms/form-feedback.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import type { DeliveryMode, FormSubmitResult } from "../../../lib/forms/contracts";
import styles from "./forms.module.css";

export type FeedbackState =
  | { name: "editing" }
  | { name: "submitting" }
  | { name: "accepted"; result: Extract<FormSubmitResult, { ok: true }> }
  | { name: "error"; result: Extract<FormSubmitResult, { ok: false }> };

export function fieldErrorProps(state: FeedbackState, name: string, errorId: string) {
  const invalid = state.name === "error" && Boolean(state.result.fieldErrors?.[name]);
  return invalid ? { "aria-invalid": true as const, "aria-describedby": errorId } : {};
}

export function FieldError(props: { state: FeedbackState; name: string; id: string }) {
  const messages = props.state.name === "error" ? props.state.result.fieldErrors?.[props.name] : undefined;
  if (!messages?.length) return null;
  return <p id={props.id} className={styles.fieldError}>{messages[0]}</p>;
}

export function FormEnvironmentNotice({ mode }: { mode: DeliveryMode }) {
  if (mode === "live") return null;
  return (
    <p className={styles.environment} role="status">
      Preview test mode: {mode === "no-send" ? "no message will be sent" : "messages go only to the restricted test recipient"}.
    </p>
  );
}

export function FormFeedback(props: {
  state: FeedbackState;
  form: HTMLFormElement | null;
}) {
  const summary = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (props.state.name !== "error") return;
    const first = Object.keys(props.state.result.fieldErrors ?? {})[0];
    const field = first
      ? props.form?.querySelector<HTMLElement>(`[name="${CSS.escape(first)}"]`)
      : null;
    (field ?? summary.current)?.focus();
  }, [props.form, props.state]);
  if (props.state.name === "submitting") {
    return <p role="status" aria-live="polite">Sending securely…</p>;
  }
  if (props.state.name !== "error") return null;
  return (
    <div ref={summary} className={styles.errorSummary} role="alert" tabIndex={-1}>
      <p>{props.state.result.message}</p>
      {Object.entries(props.state.result.fieldErrors ?? {}).map(([field, messages]) => (
        <button
          key={field}
          type="button"
          onClick={() => props.form?.querySelector<HTMLElement>(`[name="${CSS.escape(field)}"]`)?.focus()}
        >
          {messages[0]}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Implement newsletter, prayer, and contact forms**

Create `components/client/forms/newsletter-form.tsx`:

```tsx
"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useAnalytics } from "../analytics-provider";
import type { NewsletterPlacement } from "../../../lib/forms/contracts";
import { publicFormConfig } from "../../../lib/forms/public-config";
import { FieldError, FormEnvironmentNotice, FormFeedback, fieldErrorProps } from "./form-feedback";
import { TurnstileField } from "./turnstile-field";
import { useFormMachine } from "./use-form-machine";
import styles from "./forms.module.css";

export type NewsletterFormProps = {
  placement: NewsletterPlacement;
  onAccepted?: () => void;
  headingId?: string;
  className?: string;
};

export function NewsletterForm(props: NewsletterFormProps): React.ReactElement {
  const id = useId();
  const ids = {
    firstName: `${id}-first-name`,
    firstNameError: `${id}-first-name-error`,
    email: `${id}-email`,
    emailError: `${id}-email-error`,
    consentError: `${id}-consent-error`,
  };
  const { track } = useAnalytics();
  const started = useRef(false);
  const machine = useFormMachine("newsletter", {
    onAccepted: () => {
      track("newsletter_request_accepted", { placement: props.placement });
      props.onAccepted?.();
    },
    onError: (code) => track("newsletter_error", { placement: props.placement, code }),
  });
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const [token, setToken] = useState("");
  useEffect(() => {
    if (machine.state.name === "accepted") successRef.current?.focus();
  }, [machine.state]);
  if (machine.state.name === "accepted") {
    return <h3 ref={successRef} tabIndex={-1}>{machine.state.result.message}</h3>;
  }
  return (
    <form
      ref={formRef}
      className={`${styles.form} ${props.className ?? ""}`}
      aria-label="Monthly field notes"
      aria-labelledby={props.headingId}
      noValidate
      onInput={() => {
        machine.markEdited();
        if (!started.current) {
          started.current = true;
          track("newsletter_form_start", { placement: props.placement });
        }
      }}
      onSubmit={(event) => {
        event.preventDefault();
        track("newsletter_submit", { placement: props.placement });
        const data = new FormData(event.currentTarget);
        void machine.submit({
          email: String(data.get("email") ?? ""),
          firstName: String(data.get("firstName") ?? ""),
          consent: data.get("consent") === "on",
          placement: props.placement,
          turnstileToken: token,
          website: String(data.get("website") ?? ""),
        });
      }}
    >
      <FormEnvironmentNotice mode={publicFormConfig.deliveryMode} />
      <FormFeedback state={machine.state} form={formRef.current} />
      <fieldset className={styles.fields} disabled={machine.locked}>
      <label htmlFor={ids.firstName}>First name <span>(optional)</span></label>
      <input id={ids.firstName} name="firstName" autoComplete="given-name" maxLength={80} {...fieldErrorProps(machine.state, "firstName", ids.firstNameError)} />
      <FieldError state={machine.state} name="firstName" id={ids.firstNameError} />
      <label htmlFor={ids.email}>Email address</label>
      <input id={ids.email} name="email" type="email" autoComplete="email" required maxLength={254} {...fieldErrorProps(machine.state, "email", ids.emailError)} />
      <FieldError state={machine.state} name="email" id={ids.emailError} />
      <label className={styles.checkbox}>
        <input name="consent" type="checkbox" required {...fieldErrorProps(machine.state, "consent", ids.consentError)} />
        Send me the monthly field notes. I can unsubscribe at any time.
      </label>
      <FieldError state={machine.state} name="consent" id={ids.consentError} />
      <label className={styles.honeypot} aria-hidden="true">
        Website<input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <TurnstileField action="newsletter_submit" resetSignal={machine.resetSignal} onToken={setToken} />
      <button type="submit" disabled={!token || machine.state.name === "submitting"}>Request confirmation email</button>
      </fieldset>
      <noscript><p>JavaScript is required for the security check. No form text is placed in email or a URL.</p></noscript>
    </form>
  );
}
```

Create `components/client/forms/prayer-form.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { PrayerPlacement } from "../../../lib/forms/contracts";
import { publicFormConfig } from "../../../lib/forms/public-config";
import { FieldError, FormEnvironmentNotice, FormFeedback, fieldErrorProps } from "./form-feedback";
import { TurnstileField } from "./turnstile-field";
import { useFormMachine } from "./use-form-machine";
import styles from "./forms.module.css";

export type PrayerFormProps = { placement: PrayerPlacement; className?: string };

export function PrayerForm(props: PrayerFormProps): React.ReactElement {
  const machine = useFormMachine("prayer");
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const [token, setToken] = useState("");
  const [followUp, setFollowUp] = useState(false);
  useEffect(() => {
    if (machine.state.name === "accepted") successRef.current?.focus();
  }, [machine.state]);
  if (machine.state.name === "accepted") {
    return <h3 ref={successRef} tabIndex={-1}>{machine.state.result.message}</h3>;
  }
  return (
    <form
      ref={formRef}
      className={`${styles.form} ${props.className ?? ""}`}
      aria-label="Private prayer request"
      noValidate
      onInput={machine.markEdited}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        void machine.submit({
          displayName: String(data.get("displayName") ?? ""),
          email: String(data.get("email") ?? ""),
          request: String(data.get("request") ?? ""),
          followUpRequested: data.get("followUpRequested") === "on",
          turnstileToken: token,
          website: String(data.get("website") ?? ""),
        });
      }}
    >
      <p>Your request goes to a restricted ministry mailbox. You may remain anonymous.</p>
      <p>This inbox is not continuously monitored and is not an emergency service. If you are in immediate danger, contact local emergency services now.</p>
      <FormEnvironmentNotice mode={publicFormConfig.deliveryMode} />
      <FormFeedback state={machine.state} form={formRef.current} />
      <fieldset className={styles.fields} disabled={machine.locked}>
      <label htmlFor="displayName">Name <span>(optional)</span></label>
      <input id="displayName" name="displayName" autoComplete="name" maxLength={80} {...fieldErrorProps(machine.state, "displayName", "displayName-error")} />
      <FieldError state={machine.state} name="displayName" id="displayName-error" />
      <label htmlFor="prayer-email">Email address <span>(required only for follow-up)</span></label>
      <input id="prayer-email" name="email" type="email" autoComplete="email" required={followUp} maxLength={254} {...fieldErrorProps(machine.state, "email", "prayer-email-error")} />
      <FieldError state={machine.state} name="email" id="prayer-email-error" />
      <label htmlFor="request">Prayer request</label>
      <textarea id="request" name="request" minLength={20} maxLength={4000} required rows={8} {...fieldErrorProps(machine.state, "request", "request-error")} />
      <FieldError state={machine.state} name="request" id="request-error" />
      <label className={styles.checkbox}>
        <input
          name="followUpRequested"
          type="checkbox"
          checked={followUp}
          onChange={(event) => {
            setFollowUp(event.currentTarget.checked);
            machine.markEdited();
          }}
        />
        I would like a ministry responder to follow up by email.
      </label>
      <label className={styles.honeypot} aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <TurnstileField action="prayer_submit" resetSignal={machine.resetSignal} onToken={setToken} />
      <button type="submit" disabled={!token || machine.state.name === "submitting"}>Send private request</button>
      </fieldset>
      <noscript><p>JavaScript is required for the security check. Your prayer is never placed in an email link or URL.</p></noscript>
    </form>
  );
}
```

Create `components/client/forms/contact-form.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useAnalytics } from "../analytics-provider";
import { contactReasonSchema, type ContactReason } from "../../../lib/forms/contracts";
import { publicFormConfig } from "../../../lib/forms/public-config";
import { FieldError, FormEnvironmentNotice, FormFeedback, fieldErrorProps } from "./form-feedback";
import { TurnstileField } from "./turnstile-field";
import { useFormMachine } from "./use-form-machine";
import styles from "./forms.module.css";

export type ContactFormProps = { defaultReason?: ContactReason; className?: string };
const reasons: Array<[ContactReason, string]> = [
  ["speaking", "Speaking invitation"],
  ["partnership", "Partnership"],
  ["media", "Media inquiry"],
  ["testimony", "Share a testimony"],
  ["general", "General question"],
];

export function ContactForm(props: ContactFormProps): React.ReactElement {
  const { track } = useAnalytics();
  const started = useRef(false);
  const [reason, setReason] = useState<ContactReason>(props.defaultReason ?? "general");
  const machine = useFormMachine("contact", {
    onAccepted: () => track("contact_success", { reason }),
    onError: (code) => track("contact_error", { reason, code }),
  });
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const [token, setToken] = useState("");
  useEffect(() => {
    if (machine.state.name === "accepted") successRef.current?.focus();
  }, [machine.state]);
  if (machine.state.name === "accepted") {
    return <h3 ref={successRef} tabIndex={-1}>{machine.state.result.message}</h3>;
  }
  return (
    <form
      ref={formRef}
      className={`${styles.form} ${props.className ?? ""}`}
      aria-label="Contact The Lion Company"
      noValidate
      onInput={() => {
        machine.markEdited();
        if (!started.current) {
          started.current = true;
          track("contact_form_start", { reason });
        }
      }}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        track("contact_submit", { reason });
        void machine.submit({
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          reason,
          message: String(data.get("message") ?? ""),
          turnstileToken: token,
          website: String(data.get("website") ?? ""),
        });
      }}
    >
      <FormEnvironmentNotice mode={publicFormConfig.deliveryMode} />
      <FormFeedback state={machine.state} form={formRef.current} />
      <fieldset className={styles.fields} disabled={machine.locked}>
      <label htmlFor="name">Name</label>
      <input id="name" name="name" autoComplete="name" required maxLength={80} {...fieldErrorProps(machine.state, "name", "name-error")} />
      <FieldError state={machine.state} name="name" id="name-error" />
      <label htmlFor="contact-email">Email address</label>
      <input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254} {...fieldErrorProps(machine.state, "email", "contact-email-error")} />
      <FieldError state={machine.state} name="email" id="contact-email-error" />
      <label htmlFor="reason">Reason for contacting us</label>
      <select
        id="reason"
        name="reason"
        value={reason}
        onChange={(event) => {
          const parsed = contactReasonSchema.safeParse(event.currentTarget.value);
          if (parsed.success) setReason(parsed.data);
          machine.markEdited();
        }}
        {...fieldErrorProps(machine.state, "reason", "reason-error")}
      >
        {reasons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <FieldError state={machine.state} name="reason" id="reason-error" />
      <p>Submitting a testimony does not grant permission to publish it. Publication requires separate written consent.</p>
      <label htmlFor="message">Message</label>
      <textarea id="message" name="message" minLength={20} maxLength={4000} required rows={8} {...fieldErrorProps(machine.state, "message", "message-error")} />
      <FieldError state={machine.state} name="message" id="message-error" />
      <label className={styles.honeypot} aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <TurnstileField action="contact_submit" resetSignal={machine.resetSignal} onToken={setToken} />
      <button type="submit" disabled={!token || machine.state.name === "submitting"}>Send message</button>
      </fieldset>
      <noscript><p>JavaScript is required for the security check. No message text is placed in email or a URL.</p></noscript>
    </form>
  );
}
```

- [ ] **Step 6: Add responsive, visible focus and hidden-honeypot styles**

Create `components/client/forms/forms.module.css`:

```css
.form { display: grid; gap: .75rem; width: 100%; max-width: 42rem; }
.fields { display: grid; gap: .75rem; min-inline-size: 0; padding: 0; margin: 0; border: 0; }
.form input, .form select, .form textarea, .form button { font: inherit; }
.form input, .form select, .form textarea { width: 100%; min-height: 2.75rem; padding: .75rem; border: 1px solid currentColor; border-radius: .25rem; background: var(--surface, #f4eddf); color: var(--ink, #251c25); }
.form textarea { resize: vertical; }
.form button { min-height: 2.75rem; padding: .75rem 1rem; border: 0; border-radius: 999px; cursor: pointer; }
.form button:disabled { cursor: not-allowed; opacity: .55; }
.form :focus-visible { outline: 3px solid var(--accent, #a84f3f); outline-offset: 3px; }
.checkbox { display: grid; grid-template-columns: 1.5rem 1fr; gap: .625rem; align-items: start; }
.checkbox input { width: 1.5rem; min-height: 1.5rem; margin: 0; }
.environment { padding: .75rem; border-inline-start: .25rem solid var(--accent, #a84f3f); }
.errorSummary { display: grid; gap: .5rem; padding: 1rem; border: 2px solid #8d1b1b; }
.errorSummary a { color: inherit; text-decoration-thickness: .12em; }
.fieldError { margin: -.5rem 0 0; color: #8d1b1b; font-weight: 650; }
.honeypot { position: absolute !important; inline-size: 1px !important; block-size: 1px !important; overflow: hidden !important; clip-path: inset(50%) !important; white-space: nowrap !important; }
@media (max-width: 20rem) { .form { gap: .625rem; } .form input, .form select, .form textarea, .form button { max-width: 100%; } }
@media (forced-colors: active) { .form :focus-visible { outline: 3px solid Highlight; } .errorSummary { border-color: CanvasText; } }
```

- [ ] **Step 7: Run client verification**

Run:

```bash
npm test -- tests/components/forms.test.tsx
npm run typecheck
npm run lint
```

Expected: component tests PASS; typecheck and lint exit 0; accepted focus lands on the success heading; failed requests retain values; unedited retry bodies reuse one UUID.

- [ ] **Step 8: Commit the reusable form UI**

```bash
git add components/client/forms tests/components/forms.test.tsx
git commit -m "feat: add accessible form state machines"
```

### Task 7: Add newsletter outcomes, legal copy, and retention evidence

**Files:**
- Create: `components/client/forms/newsletter-outcome-marker.tsx`
- Create: `app/prayer/page.tsx`
- Create: `app/newsletter/confirmed/page.tsx`
- Create: `app/newsletter/expired/page.tsx`
- Create: `app/newsletter/unsubscribed/page.tsx`
- Create: `content/legal.ts`
- Create: `app/privacy/page.tsx`
- Create: `app/terms/page.tsx`
- Create: `app/accessibility/page.tsx`
- Modify: `config/routes.ts`
- Create: `docs/operations/forms-privacy-runbook.md`
- Create: `docs/operations/quarterly-privacy-audit.md`
- Create: `tests/integration/legal-content.test.ts`

**Interfaces:**
- Consumes: experience-owned `markNewsletterConfirmed()` from `lib/prompts/storage.ts`, `NewsletterForm`, foundation-owned `indexableStaticRoutes`.
- Produces: the dedicated private prayer journey, noindex outcome pages, indexable legal routes, exact public retention disclosure, and a restricted-evidence operating process.

- [ ] **Step 1: Write the failing legal/outcome contract test**

Create `tests/integration/legal-content.test.ts`:

```ts
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

async function source(path: string) {
  return readFile(resolve(path), "utf8");
}

describe("legal and newsletter utility routes", () => {
  it("names every processor and exact retention boundary", async () => {
    const legal = await source("content/legal.ts");
    for (const name of [
      "Vercel",
      "Brevo",
      "Cloudflare Turnstile",
      "Google Analytics",
      "YouTube",
      "Printify",
      "Subsplash",
    ]) {
      expect(legal).toContain(name);
    }
    expect(legal).toContain("90 days");
    expect(legal).toContain("12 months after resolution");
    expect(legal).toContain("30 days");
    expect(legal).toContain("one month");
    expect(legal).toContain("Texas-based, serving globally");
    expect(legal).toContain("MAILBOX_BACKUP_AND_DELETION_PUBLIC");
    expect(legal).toContain("BREVO_BACKUP_AND_DELETION_PUBLIC");
    expect(legal).toContain("backup and final deletion");
  });

  it("makes every outcome noindex and marks only confirmed membership", async () => {
    const confirmed = await source("app/newsletter/confirmed/page.tsx");
    const expired = await source("app/newsletter/expired/page.tsx");
    const unsubscribed = await source("app/newsletter/unsubscribed/page.tsx");
    for (const page of [confirmed, expired, unsubscribed]) {
      expect(page).toContain("index: false");
      expect(page).toContain("follow: false");
    }
    expect(confirmed).toContain("NewsletterOutcomeMarker");
    expect(expired).not.toContain("NewsletterOutcomeMarker");
    expect(unsubscribed).not.toContain("NewsletterOutcomeMarker");
  });

  it("indexes legal and experience routes but not newsletter outcomes", async () => {
    const routes = await source("config/routes.ts");
    for (const route of ["/prayer", "/connect", "/privacy", "/terms", "/accessibility"]) {
      expect(routes).toContain(`"${route}"`);
    }
    expect(routes).not.toContain('"/newsletter/confirmed"');
    expect(routes).not.toContain('"/newsletter/expired"');
    expect(routes).not.toContain('"/newsletter/unsubscribed"');
  });

  it("renders the dedicated prayer journey with explicit privacy and emergency limits", async () => {
    const prayer = await source("app/prayer/page.tsx");
    expect(prayer).toContain("PrayerForm");
    expect(prayer).toContain('placement="prayer"');
    expect(prayer).toContain("restricted ministry mailbox");
    expect(prayer).toContain("local emergency services");
  });
});
```

- [ ] **Step 2: Run the contract test to verify failure**

Run: `npm test -- tests/integration/legal-content.test.ts`

Expected: FAIL because legal content and outcome pages do not exist and the routes are not registered.

- [ ] **Step 3: Implement confirmation, expiry, and unsubscribe outcomes**

Create `app/prayer/page.tsx`:

```tsx
import { PrayerForm } from "@/components/client/forms/prayer-form";
import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";

const description = "Share a private prayer request with The Lion Company's restricted ministry response team.";

export const metadata = createPageMetadata({
  title: "Prayer",
  description,
  path: "/prayer",
});

export default function PrayerPage() {
  return (
    <>
      <JsonLd id="prayer-schema" data={[webPageSchema({ path: "/prayer", title: "Prayer", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Prayer", path: "/prayer" }])]} />
      <PageIntro
        eyebrow="Prayer"
        title="You do not have to carry this alone."
        description="Share only what you choose. You may remain anonymous, and follow-up is always optional."
      />
      <section className="section shell" aria-labelledby="prayer-form-title">
        <h2 id="prayer-form-title">Send a private prayer request</h2>
        <p>Your request goes to a restricted ministry mailbox and is handled under the published retention schedule.</p>
        <p>This inbox is not continuously monitored and is not an emergency service. If you or someone else is in immediate danger, contact local emergency services now.</p>
        <PrayerForm placement="prayer" />
      </section>
    </>
  );
}
```

Create `components/client/forms/newsletter-outcome-marker.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { markNewsletterConfirmed } from "../../../lib/prompts/storage";

export function NewsletterOutcomeMarker(): null {
  useEffect(() => {
    markNewsletterConfirmed();
  }, []);
  return null;
}
```

Create `app/newsletter/confirmed/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterOutcomeMarker } from "../../../components/client/forms/newsletter-outcome-marker";

export const metadata: Metadata = {
  title: "Monthly Field Notes Confirmed — The Lion Company",
  robots: { index: false, follow: false },
};

export default function NewsletterConfirmedPage() {
  return (
    <section className="section shell">
      <NewsletterOutcomeMarker />
      <h1>Your monthly field notes are confirmed.</h1>
      <p>Brevo has completed the double opt-in action. Watch your inbox for the next monthly letter.</p>
      <Link href="/teachings">Begin with a teaching</Link>
    </section>
  );
}
```

Create `app/newsletter/expired/page.tsx`:

```tsx
import type { Metadata } from "next";
import { NewsletterForm } from "../../../components/client/forms/newsletter-form";

export const metadata: Metadata = {
  title: "Request a New Confirmation — The Lion Company",
  robots: { index: false, follow: false },
};

export default function NewsletterExpiredPage() {
  return (
    <section className="section shell">
      <h1 id="newsletter-recovery-heading">That confirmation link is invalid or expired.</h1>
      <p>Request a fresh email below. This page does not reveal whether an address is already on the list.</p>
      <NewsletterForm placement="connect" headingId="newsletter-recovery-heading" />
    </section>
  );
}
```

Create `app/newsletter/unsubscribed/page.tsx`:

```tsx
import type { Metadata } from "next";
import { NewsletterForm } from "../../../components/client/forms/newsletter-form";

export const metadata: Metadata = {
  title: "Unsubscribed — The Lion Company",
  robots: { index: false, follow: false },
};

export default function NewsletterUnsubscribedPage() {
  return (
    <section className="section shell">
      <h1 id="newsletter-unsubscribed-heading">You have been unsubscribed.</h1>
      <p>Brevo will keep only the suppression data needed to honor your choice. You may request a new double opt-in email below.</p>
      <NewsletterForm placement="connect" headingId="newsletter-unsubscribed-heading" />
    </section>
  );
}
```

Brevo campaign configuration must redirect its successful DOI action to `/newsletter/confirmed`, invalid/expired DOI action to `/newsletter/expired`, and provider-managed unsubscribe completion to `/newsletter/unsubscribed`. Never add email, contact ID, token, or status query values to those URLs.

- [ ] **Step 4: Create versioned legal and accessibility copy**

Create `content/legal.ts`:

```ts
export const legalEffectiveDate = "July 11, 2026";

export function mailboxProviderDisclosure(): string {
  const mode = process.env.NEXT_PUBLIC_FORM_MODE ?? "no-send";
  const provider = process.env.MAILBOX_PROVIDER_PUBLIC_NAME?.trim();
  if (mode === "live" && !provider) {
    throw new Error("MAILBOX_PROVIDER_PUBLIC_NAME is required for live legal disclosure");
  }
  return provider ?? "No ministry mailbox provider receives submissions in no-send preview mode";
}

export function providerDeletionDisclosures() {
  const mode = process.env.NEXT_PUBLIC_FORM_MODE ?? "no-send";
  const mailbox = process.env.MAILBOX_BACKUP_AND_DELETION_PUBLIC?.trim();
  const brevo = process.env.BREVO_BACKUP_AND_DELETION_PUBLIC?.trim();
  if (mode === "live" && (!mailbox || !brevo)) {
    throw new Error("verified public provider backup and final-deletion timing is required for live forms");
  }
  return {
    mailbox: mailbox ?? "No prayer or contact message reaches a mailbox provider in no-send preview mode.",
    brevo: brevo ?? "No Brevo contact or transactional record is created in no-send preview mode.",
  };
}

export function privacySections(
  mailboxProvider: string,
  deletion: ReturnType<typeof providerDeletionDisclosures>,
) {
  return [
    {
      heading: "Who we are",
      paragraphs: [
        "The Lion Company is a Texas-based Christian ministry serving people globally. This policy explains the website data practices for thelioncompany.org. Legal and tax-status details are not claimed here until current authoritative verification is recorded and approved.",
      ],
    },
    {
      heading: "What we collect and why",
      paragraphs: [
        "Newsletter requests include an email address, optional first name, consent version, consent time, and form placement so Brevo can send and record double opt-in confirmation.",
        "Prayer requests may include a name, email address, prayer text, and a separate follow-up choice. Contact requests include name, email address, inquiry reason, and message. These submissions are used only to respond, pray, administer the ministry, prevent abuse, and maintain required records.",
        "Cloudflare Turnstile processes security signals and a short-lived token to prevent automated abuse. Opaque HMAC-based submission states remain in Redis for no more than 24 hours and contain no form content or visitor identity.",
      ],
    },
    {
      heading: "Analytics and external media",
      paragraphs: [
        "Google Analytics loads only after an affirmative analytics choice. Form values and identifiers are never sent to analytics. YouTube uses a privacy-enhanced facade and makes no request until you choose to play media.",
        "Printify operates the external store and Subsplash operates the external giving destination. Their policies apply after you follow those links.",
      ],
    },
    {
      heading: "Service providers",
      paragraphs: [
        `The website uses Vercel for hosting, Brevo for newsletter double opt-in and form delivery, Cloudflare Turnstile for abuse protection, Google Analytics for consented measurement, YouTube for user-started video, Printify for merchandise, Subsplash for giving, Upstash Redis for opaque short-lived idempotency, and ${mailboxProvider} for restricted prayer and contact mail.`,
      ],
    },
    {
      heading: "Retention",
      paragraphs: [
        "Prayer mail is deleted after 90 days unless labeled active-follow-up. Active follow-up is reviewed every 30 days and may remain no more than 12 months without a documented legal or safety hold; it is deleted within 30 days after the conversation closes.",
        "Resolved contact mail is deleted 12 months after resolution; unresolved messages receive a quarterly review. Pending double-opt-in contacts purge after 30 days. Confirmed newsletter consent remains until unsubscribe or deletion request, and suppression data remains only as needed to honor opt-out. Brevo transactional logs retain one month, and message previews are disabled. Opaque Redis records expire after 24 hours and are not backed up or exported.",
        `Mailbox provider backup and final deletion: ${deletion.mailbox}`,
        `Brevo backup and final deletion: ${deletion.brevo}`,
      ],
    },
    {
      heading: "Your choices and rights",
      paragraphs: [
        "You may decline analytics, withdraw analytics consent, unsubscribe through every campaign, or use the contact form to request access, correction, or deletion. Prayer, contact, newsletter, and analytics choices remain separate.",
        "We do not sell personal information, create advertising audiences from prayer or contact submissions, or publish testimony text without a separate written permission process.",
      ],
    },
    {
      heading: "Children, safety, and changes",
      paragraphs: [
        "The website is not directed to children under 13, and we do not knowingly collect their information without appropriate guardian involvement. Prayer and contact forms are not emergency services; contact local emergency services if anyone is in immediate danger.",
        "Reasonable technical and organizational safeguards reduce risk but no internet transmission is guaranteed completely secure. Material policy changes receive a new effective date and, when required, a renewed consent choice.",
      ],
    },
  ] as const;
}

export const termsSections = [
  ["Purpose", "This website provides Christian teaching, ministry information, prayer and contact paths, newsletter enrollment, and links to independent store and giving services."],
  ["Appropriate use", "Do not submit unlawful, threatening, abusive, deceptive, automated, privacy-invasive, or security-testing content through public forms. Do not interfere with the website or impersonate another person."],
  ["Ministry and emergency limits", "Website content and prayer responses are pastoral resources, not medical, legal, financial, mental-health, or emergency services. Contact qualified local professionals or emergency services when needed."],
  ["External services", "YouTube, Brevo, Printify, Subsplash, podcast platforms, and social channels operate under their own terms. Merchandise purchases, refunds, and payment handling occur with Printify; giving transactions occur with Subsplash."],
  ["Content and testimony", "The Lion Company and its licensors retain rights in website content. A testimony submission does not grant publication rights; publication requires separate written permission."],
  ["Availability and changes", "The website may change or be unavailable. These terms may change with a new effective date. Texas law governs to the extent legally permitted."],
] as const;

export const accessibilitySections = [
  ["Our commitment", "The Lion Company targets WCAG 2.2 Level AA and designs content, navigation, dialogs, media paths, and forms for keyboard, screen reader, zoom, contrast, and reduced-motion access."],
  ["Known dependencies", "Some linked media, store, giving, podcast, and social services are operated by third parties. We still provide meaningful direct links and text context when an embedded experience is not accessible."],
  ["Feedback", "If a page or feature creates an accessibility barrier, use the general contact form and choose General question. Include the page and the task you were trying to complete; do not include sensitive prayer content in an accessibility report."],
] as const;
```

- [ ] **Step 5: Render legal routes and register indexable paths**

Create `app/privacy/page.tsx`:

```tsx
import { JsonLd } from "@/components/server/json-ld";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import { legalEffectiveDate, mailboxProviderDisclosure, privacySections, providerDeletionDisclosures } from "../../content/legal";

const description = "How The Lion Company handles website, prayer, contact, newsletter, and analytics data.";
export const metadata = createPageMetadata({ title: "Privacy", description, path: "/privacy" });

export default function PrivacyPage() {
  const sections = privacySections(mailboxProviderDisclosure(), providerDeletionDisclosures());
  return <><JsonLd id="privacy-schema" data={[webPageSchema({ path: "/privacy", title: "Privacy", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Privacy", path: "/privacy" }])]} /><article className="section shell"><h1>Privacy</h1><p>Effective {legalEffectiveDate}</p>{sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}</article></>;
}
```

Create `app/terms/page.tsx`:

```tsx
import { JsonLd } from "@/components/server/json-ld";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import { legalEffectiveDate, termsSections } from "../../content/legal";

const description = "Terms for using The Lion Company website and ministry forms.";
export const metadata = createPageMetadata({ title: "Website terms", description, path: "/terms" });

export default function TermsPage() {
  return <><JsonLd id="terms-schema" data={[webPageSchema({ path: "/terms", title: "Website terms", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Terms", path: "/terms" }])]} /><article className="section shell"><h1>Website terms</h1><p>Effective {legalEffectiveDate}</p>{termsSections.map(([heading, paragraph]) => <section key={heading}><h2>{heading}</h2><p>{paragraph}</p></section>)}</article></>;
}
```

Create `app/accessibility/page.tsx`:

```tsx
import Link from "next/link";
import { JsonLd } from "@/components/server/json-ld";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import { accessibilitySections, legalEffectiveDate } from "../../content/legal";

const description = "The Lion Company's accessibility commitment and feedback path.";
export const metadata = createPageMetadata({ title: "Accessibility", description, path: "/accessibility" });

export default function AccessibilityPage() {
  return <><JsonLd id="accessibility-schema" data={[webPageSchema({ path: "/accessibility", title: "Accessibility", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Accessibility", path: "/accessibility" }])]} /><article className="section shell"><h1>Accessibility</h1><p>Reviewed {legalEffectiveDate}</p>{accessibilitySections.map(([heading, paragraph]) => <section key={heading}><h2>{heading}</h2><p>{paragraph}</p></section>)}<Link href="/connect">Report an accessibility barrier</Link></article></>;
}
```

Modify the foundation's `config/routes.ts` array to exactly:

```ts
export const indexableStaticRoutes = [
  "/",
  "/start-here",
  "/live",
  "/teachings",
  "/podcast",
  "/prayer",
  "/connect",
  "/store",
  "/give",
  "/privacy",
  "/terms",
  "/accessibility",
] as const;
```

- [ ] **Step 6: Write the enforceable operating and quarterly evidence artifacts**

Create `docs/operations/forms-privacy-runbook.md`:

```markdown
# Forms and privacy operating runbook

## Production activation gate

Production form delivery remains disabled until the release record proves: authorized Brevo account and billing choice; authenticated sender domain; isolated production API key; confirmed-list ID and DOI template; restricted prayer/contact mailboxes with MFA; verified public backup behavior and final-deletion timing for both the mailbox provider and Brevo; verified marketing postal address; named data steward; named mailbox administrator; Upstash TLS/scoped credentials/24-hour TTL/no-export setting; Turnstile production widget and exact hostnames; and two published Vercel WAF rules.

Preview defaults to `no-send`. `test-recipient` uses separate preview Brevo resources and the restricted test recipient. A production Brevo key must never be scoped to a preview deployment.

## Data flow

Newsletter fields go from browser to Vercel, then Turnstile and Brevo native DOI. Brevo alone stores email, optional first name, consent version/time/placement/source, confirmation, bounce, and suppression status.

Prayer/contact fields go from browser to Vercel, then Turnstile and Brevo transactional delivery, then the restricted mailbox provider. Vercel retains no form body. Redis receives only an HMAC key, safe state, timestamps, lock token, and provider message ID.

## Mailbox rules

Prayer mail receives a 90-day deletion rule. `active-follow-up` is reviewed every 30 days, closes within 12 months unless the data steward records a legal or safety hold, and deletes within 30 days after closure. Contact responders label resolved mail; deletion runs 12 months after resolution. Unresolved contact mail receives quarterly review.

Disable auto-forwarding, offline archives, personal mailbox copies, and ad hoc exports. Restrict mailbox access to named responders with MFA. The mailbox administrator performs one synthetic deletion test each quarter.

## Brevo rules

Purge unconfirmed DOI contacts after 30 days. Retain confirmed consent until unsubscribe/deletion request. Retain suppression only to honor opt-out. Set transactional log retention to one month and disable email previews for prayer/contact. Every campaign includes the verified postal address and provider-managed unsubscribe action. Configure the exact success, expired, and unsubscribe outcome routes without query identifiers.

## Redis rules

Use TLS and a form-only token. Processing locks expire after 300 seconds; accepted records expire after 86,400 seconds. Disable backups and exports for this database. Never inspect or enrich opaque keys.

## Requests and deletion

Use `/connect` for access, correction, and deletion requests. Verify the requester without asking for prayer text. Apply the request independently to Brevo, the restricted mailbox, and any legally required suppression record. Record only date, systems checked, aggregate outcome, and owner in restricted evidence.

## Prayer safety

The mailbox is not continuously monitored. Public copy directs immediate danger to local emergency services. Responders follow the ministry's approved escalation practice; the website does not diagnose, counsel, or promise response timing.

## Incident and rollback

False success, content in logs/analytics/URLs/storage, unintended recipient, broken consent separation, or retention failure blocks activation and triggers immediate rollback to the recorded prior Vercel deployment. Preserve provider message IDs and safe operational timestamps; never paste message bodies into tickets.
```

Create `docs/operations/quarterly-privacy-audit.md`:

```markdown
# Quarterly privacy audit procedure

Create one dated restricted release-evidence record each quarter; do not commit names, addresses, credentials, screenshots, request text, or provider exports.

- Confirm the named data steward and mailbox administrator still have the role and MFA.
- Capture restricted screenshots of prayer 90-day deletion and contact 12-month-after-resolution deletion rules.
- Record aggregate deletion count, aggregate active-follow-up exception count, oldest exception age, and aggregate unresolved contact count.
- Confirm every active-follow-up item was reviewed within 30 days and none exceeds 12 months without a recorded legal or safety hold.
- Submit one synthetic prayer and one synthetic contact message containing visibly synthetic, non-sensitive content; verify delivery, then verify scheduled/manual deletion and record only provider message ID plus outcome.
- Confirm Brevo pending DOI purge at 30 days, transactional log retention at one month, disabled message previews, verified sender, campaign postal address, and unsubscribe suppression.
- Confirm Redis 300-second lock TTL, 86,400-second accepted TTL, scoped token, TLS, and no backups/exports.
- Confirm Turnstile hostnames/actions and review unexpected-hostname analytics.
- Confirm Vercel WAF thresholds using the production-equivalent suite and verify blocked requests created no function/provider call.
- Search Vercel logs, analytics event schemas, URLs, source maps, Redis value shapes, and repository history for synthetic canary values; any hit is an incident.
- Record owner, UTC completion time, evidence location, exceptions, remediation owner, and due date in the restricted record.
```

- [ ] **Step 7: Run legal and route verification**

Run:

```bash
npm test -- tests/integration/legal-content.test.ts
npm run typecheck
npm run lint
```

Expected: tests PASS; typecheck and lint exit 0; newsletter outcomes are absent from `indexableStaticRoutes`.

- [ ] **Step 8: Commit outcomes and privacy foundations**

```bash
git add components/client/forms/newsletter-outcome-marker.tsx app/prayer app/newsletter app/privacy app/terms app/accessibility content/legal.ts config/routes.ts docs/operations/forms-privacy-runbook.md docs/operations/quarterly-privacy-audit.md tests/integration/legal-content.test.ts
git commit -m "feat: add form privacy and legal routes"
```

### Task 8: Enforce browser policy and prove preview/release behavior

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`
- Modify: `next.config.ts`
- Create: `config/security-headers.ts`
- Create: `scripts/build-with-csp.mjs`
- Create: `scripts/form-preview-soak.mjs`
- Create: `docs/operations/vercel-waf-runbook.md`
- Create: `tests/integration/security-headers.test.ts`
- Create: `tests/integration/experience-form-handoff.test.ts`
- Create: `tests/e2e/forms.spec.ts`

**Interfaces:**
- Consumes: foundation `nextConfig` object, forms-owned `/prayer`, experience-owned `/connect`, all prior form layers, and Vercel preview protection.
- Produces: deterministic hash CSP build, report-only preview headers, enforcing production headers, exact WAF operations, protected-preview soak, and the final cross-plan verification gate.

- [ ] **Step 1: Write failing policy and experience-handoff tests**

Create `tests/integration/security-headers.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { securityHeaders } from "../../config/security-headers";

function map(headers: Array<{ key: string; value: string }>) {
  return new Map(headers.map((header) => [header.key, header.value]));
}

describe("security headers", () => {
  it("uses report-only CSP on preview without HSTS", () => {
    const headers = map(securityHeaders({ production: false, hashes: ["'sha256-testhash='"] }));
    expect(headers.has("Content-Security-Policy-Report-Only")).toBe(true);
    expect(headers.has("Content-Security-Policy")).toBe(false);
    expect(headers.has("Strict-Transport-Security")).toBe(false);
  });

  it("enforces exact production protections and keeps Brevo server-only", () => {
    const headers = map(securityHeaders({ production: true, hashes: ["'sha256-testhash='"] }));
    const csp = headers.get("Content-Security-Policy") ?? "";
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'sha256-testhash='");
    expect(csp).toContain("https://www.googletagmanager.com");
    expect(csp).toContain("https://challenges.cloudflare.com");
    expect(csp).toContain("frame-src https://www.youtube-nocookie.com https://challenges.cloudflare.com");
    expect(csp).toContain("media-src 'self'");
    expect(csp).not.toContain("ytimg.com");
    expect(csp).not.toContain("mcdn.podbean.com");
    expect(csp).not.toContain("brevo");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toMatch(/\s\*\s/);
    expect(headers.get("Strict-Transport-Security")).toBe("max-age=31536000");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Permissions-Policy")).toBe(
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    );
  });

  it("refuses production enforcement without generated hashes", () => {
    expect(() => securityHeaders({ production: true, hashes: [] })).toThrow(/CSP hashes/);
  });
});
```

Create `tests/integration/experience-form-handoff.test.ts`:

```ts
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("experience to forms handoff", () => {
  it("renders the dedicated private prayer form", async () => {
    const source = await readFile(resolve("app/prayer/page.tsx"), "utf8");
    expect(source).toContain("PrayerForm");
    expect(source).toContain('placement="prayer"');
  });

  it("renders contact and permanent newsletter forms on connect", async () => {
    const source = await readFile(resolve("app/connect/page.tsx"), "utf8");
    expect(source).toContain("ContactForm");
    expect(source).toContain("NewsletterForm");
    expect(source).toContain('placement="connect"');
  });
});
```

- [ ] **Step 2: Run the policy tests to verify failure**

Run: `npm test -- tests/integration/security-headers.test.ts tests/integration/experience-form-handoff.test.ts`

Expected: FAIL because security configuration is absent; the handoff test also fails until forms Task 7 has created `/prayer` and experience Task 9 has created `/connect`.

- [ ] **Step 3: Implement the exact CSP and response-header builder**

Create `config/security-headers.ts`:

```ts
type Header = { key: string; value: string };

function csp(hashes: readonly string[]): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src 'self' ${hashes.join(" ")} https://www.googletagmanager.com https://challenges.cloudflare.com`,
    "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://challenges.cloudflare.com",
    "img-src 'self' data: blob: https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "frame-src https://www.youtube-nocookie.com https://challenges.cloudflare.com",
    "media-src 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function securityHeaders(input: {
  production: boolean;
  hashes: readonly string[];
}): Header[] {
  if (input.production && input.hashes.length === 0) {
    throw new Error("production CSP hashes are required");
  }
  const headers: Header[] = [
    {
      key: input.production
        ? "Content-Security-Policy"
        : "Content-Security-Policy-Report-Only",
      value: csp(input.hashes),
    },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    },
    { key: "X-Frame-Options", value: "DENY" },
  ];
  if (input.production) {
    headers.push({ key: "Strict-Transport-Security", value: "max-age=31536000" });
  }
  return headers;
}
```

Modify the foundation `next.config.ts` without replacing its `poweredByHeader`, `images`, or redirect behavior. Add these imports and helpers:

```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { securityHeaders } from "./config/security-headers";

const hashFile = resolve("config/.generated-csp-hashes.json");
const hashes: string[] = existsSync(hashFile)
  ? JSON.parse(readFileSync(hashFile, "utf8"))
  : [];
const finalProductionBuild =
  process.env.VERCEL_ENV === "production" && process.env.CSP_PHASE === "final";
```

Add these exact properties inside the existing `nextConfig` object:

```ts
generateBuildId: async () =>
  process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.NEXT_BUILD_ID ?? "local-csp-build",
async headers() {
  return [
    {
      source: "/(.*)",
      headers: securityHeaders({ production: finalProductionBuild, hashes }),
    },
  ];
},
```

Do not add a nonce middleware: it would force otherwise static public routes into request-time rendering. Do not add `unsafe-inline` to `script-src`.
`media-src 'self'` is intentionally closed. Current Podbean audio remains a normal outbound link; an on-site player becomes eligible only for transcript-backed audio hosted first-party, and no third-party media exception is introduced silently.

- [ ] **Step 4: Add a deterministic two-pass hash build**

Create `scripts/build-with-csp.mjs`:

```js
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const output = resolve(root, ".next/server/app");
const manifest = resolve(root, "config/.generated-csp-hashes.json");

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = resolve(directory, entry.name);
      return entry.isDirectory() ? files(path) : Promise.resolve([path]);
    }),
  );
  return nested.flat();
}

async function collectHashes() {
  const htmlFiles = (await files(output)).filter((path) => path.endsWith(".html"));
  const hashes = new Set();
  for (const path of htmlFiles) {
    const html = await readFile(path, "utf8");
    for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (/\bsrc\s*=/i.test(match[1]) || match[2].length === 0) continue;
      const digest = createHash("sha256").update(match[2], "utf8").digest("base64");
      hashes.add(`'sha256-${digest}'`);
    }
  }
  return [...hashes].sort();
}

function build(phase) {
  const result = spawnSync(resolve(root, "node_modules/.bin/next"), ["build", "--webpack"], {
    cwd: root,
    env: { ...process.env, CSP_PHASE: phase },
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

build("discover");
const discovered = await collectHashes();
if (discovered.length === 0) throw new Error("no inline scripts were discovered");
await writeFile(manifest, `${JSON.stringify(discovered, null, 2)}\n`, "utf8");
build("final");
const finalHashes = await collectHashes();
if (JSON.stringify(finalHashes) !== JSON.stringify(discovered)) {
  throw new Error("final inline scripts differ from discovered CSP hashes");
}
```

Run:

```bash
npm pkg set scripts.build="node scripts/build-with-csp.mjs"
```

Append to `.gitignore`:

```gitignore
config/.generated-csp-hashes.json
.private-release-evidence/
```

- [ ] **Step 5: Write the exact Vercel WAF operating rule**

Create `docs/operations/vercel-waf-runbook.md`:

```markdown
# Vercel WAF form rules

These are dashboard controls, not application middleware. Production activation is blocked if the current Vercel plan cannot publish both rules. Obtain explicit billing approval before any plan change.

## Rule 1: prayer and contact

Match method `POST` and path equal to `/api/forms/prayer` or `/api/forms/contact`. Use Fixed Window, source IP as the counting key, ten-minute window, request limit 5, action 429. Name the rule `forms-prayer-contact-5-per-10m`.

## Rule 2: newsletter

Match method `POST` and path equal to `/api/forms/newsletter`. Use Fixed Window, source IP as the counting key, ten-minute window, request limit 10, action 429. Name the rule `forms-newsletter-10-per-10m`.

Publish and capture the rule names, conditions, thresholds, UTC publication time, Vercel project, owner, and rollback revision in restricted release evidence. Do not copy IP addresses into the repository.

## Production-equivalent verification

On a deployment-protected preview, publish identical thresholds. From one controlled source, send five valid prayer/contact requests; request six must return 429. Send ten valid newsletter requests; request eleven must return 429. Compare Vercel function invocation count and isolated provider acceptance count before/after: a 429 must produce neither invocation nor provider traffic.

## Volume soak exception

For the 25-per-form soak only, create a time-boxed preview-only exception bound to the authenticated runner's controlled source. Record automatic expiry no later than two hours after creation. The exception must not match the production hostname and must be removed immediately after the run. No application environment variable, header, cookie, source branch, or client parameter bypasses WAF.

CI scans production build output and Vercel production environment names for `SOAK_BYPASS`, `WAF_BYPASS`, and `RATE_LIMIT_BYPASS`; any match fails release.

## Rollback

If a rule blocks ordinary form use or fails the exact threshold, restore the recorded WAF revision. A WAF rollback never enables an application bypass and never changes form validation, Turnstile, or Redis idempotency.
```

- [ ] **Step 6: Add the aggregate-only protected-preview soak runner**

Create `scripts/form-preview-soak.mjs`:

```js
import { performance } from "node:perf_hooks";

const target = process.env.FORM_SOAK_TARGET_URL;
const token = process.env.FORM_SOAK_TURNSTILE_TOKEN;
const newsletterAddress = process.env.FORM_SOAK_NEWSLETTER_EMAIL;
if (!target || !token || !newsletterAddress) {
  throw new Error("FORM_SOAK_TARGET_URL, FORM_SOAK_TURNSTILE_TOKEN, and FORM_SOAK_NEWSLETTER_EMAIL are required");
}
if (!target.includes("vercel.app")) throw new Error("soak target must be a Vercel preview");

const latencies = [];
const origin = new URL(target).origin;

function payload(endpoint, index, submissionId = crypto.randomUUID()) {
  const shared = { submissionId, turnstileToken: token, website: "" };
  if (endpoint === "newsletter") {
    const [local, domain] = newsletterAddress.split("@");
    return { ...shared, email: `${local}+soak-${index}@${domain}`, consent: true, placement: "connect" };
  }
  if (endpoint === "prayer") {
    return { ...shared, displayName: "Synthetic Test", email: "", request: `Synthetic non-sensitive prayer delivery test number ${index}.`, followUpRequested: false };
  }
  return { ...shared, name: "Synthetic Test", email: newsletterAddress, reason: "general", message: `Synthetic non-sensitive contact delivery test number ${index}.` };
}

async function send(endpoint, body, expected = [202]) {
  const started = performance.now();
  const response = await fetch(`${origin}/api/forms/${endpoint}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(body),
  });
  latencies.push(performance.now() - started);
  if (!expected.includes(response.status)) throw new Error(`${endpoint} returned ${response.status}`);
  return response;
}

async function sendRaw(endpoint, init, expectedStatus) {
  const response = await fetch(`${origin}/api/forms/${endpoint}`, init);
  if (response.status !== expectedStatus) {
    throw new Error(`${endpoint} raw case returned ${response.status}`);
  }
}

for (const endpoint of ["newsletter", "prayer", "contact"]) {
  for (let index = 1; index <= 25; index += 1) await send(endpoint, payload(endpoint, index));
  await Promise.all(Array.from({ length: 10 }, (_, index) => send(endpoint, payload(endpoint, 100 + index))));
  const repeatedId = crypto.randomUUID();
  await Promise.all(
    Array.from({ length: 10 }, (_, index) =>
      send(endpoint, payload(endpoint, 200 + index, repeatedId), [202, 409]),
    ),
  );
  await send(endpoint, payload(endpoint, 300, repeatedId), [202]);
}

await send("contact", { ...payload("contact", 400), website: "bot-filled" }, [400]);
await send("contact", { ...payload("contact", 401), message: "short" }, [422]);
await send("contact", { ...payload("contact", 402), turnstileToken: "invalid-token" }, [400]);
await send("contact", {
  ...payload("contact", 403),
  message: "Synthetic <script>alert('test')</script> & CRLF\r\nBcc: test@example.org content.",
}, [202]);
await sendRaw("contact", {
  method: "POST",
  headers: { "content-type": "text/plain", origin },
  body: "not json",
}, 415);
await sendRaw("contact", {
  method: "POST",
  headers: { "content-type": "application/json", origin },
  body: JSON.stringify({ ...payload("contact", 404), message: "x".repeat(16_385) }),
}, 413);
await sendRaw("contact", {
  method: "POST",
  headers: { "content-type": "application/json", origin: "https://cross-origin.example.org" },
  body: JSON.stringify(payload("contact", 405)),
}, 403);

latencies.sort((a, b) => a - b);
const p95 = latencies[Math.ceil(latencies.length * 0.95) - 1];
if (p95 >= 2_500) throw new Error(`p95 ${Math.round(p95)}ms exceeds 2500ms`);
console.log(JSON.stringify({ acceptedScenarioCount: latencies.length, p95Ms: Math.round(p95) }));
```

The runner emits counts and latency only. `FORM_SOAK_TURNSTILE_TOKEN` is Cloudflare's documented always-pass dummy token paired only with the test secret; production widgets still issue a fresh single-use token for every attempt. Run the soak first in `no-send`, then on an isolated `test-recipient` preview. Provider-outage evidence uses a separate protected preview with an intentionally invalid preview-only Brevo credential and expects HTTP 503 plus retained UI values; never change a healthy preview credential in place.

- [ ] **Step 7: Add browser form verification**

Create `tests/e2e/forms.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("prayer failure retains private text and accessible retry", async ({ page }) => {
  await page.route("**/api/forms/prayer", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        ok: false,
        status: "error",
        code: "provider_unavailable",
        retryable: true,
        message: "We could not deliver this right now. Your text is still here; please try again.",
      }),
    });
  });
  await page.goto("/prayer");
  const request = page.getByLabel("Prayer request");
  await request.fill("Please pray for wisdom and peace this week.");
  await expect(page.getByText(/preview test mode/i)).toBeVisible();
  await page.getByRole("button", { name: /send private request/i }).evaluate((button) => {
    (button as HTMLButtonElement).disabled = false;
  });
  await page.getByRole("button", { name: /send private request/i }).click();
  await expect(page.getByRole("alert")).toContainText("could not deliver");
  await expect(request).toHaveValue("Please pray for wisdom and peace this week.");
});

test("connect exposes both permanent form paths", async ({ page }) => {
  await page.goto("/connect");
  await expect(page.getByRole("form", { name: "Contact The Lion Company" })).toBeVisible();
  await expect(page.getByRole("form", { name: "Monthly field notes" })).toBeVisible();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("keeps content and direct navigation while explaining protected forms", async ({ page }) => {
    await page.goto("/prayer");
    await expect(page.getByRole("heading", { name: /prayer/i })).toBeVisible();
    await expect(page.getByText(/javascript is required for the security check/i)).toBeVisible();
    await expect(page.locator("a[href='/teachings']").first()).toBeVisible();
  });
});
```

The first browser test stubs only the API response to prove client retention; handler/provider integration is covered by Vitest and the protected-preview soak. Do not make a browser test bypass Turnstile in deployed code.

- [ ] **Step 8: Run the complete local release gate**

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
rg -n --hidden 'SOAK_BYPASS|WAF_BYPASS|RATE_LIMIT_BYPASS|xkeysib-' app components config content lib .next
```

Expected: all unit/component/integration/e2e tests PASS; typecheck/lint/build exit 0; the two-pass build reports no hash drift; the restricted source/build scan returns exit 1 with no matches. Inspect the final production-equivalent CSP and confirm browser console shows no required-origin violation before switching from report-only to enforcement.

Run the protected preview gates after Vercel environment setup:

```bash
FORM_SOAK_TARGET_URL="https://protected-preview.vercel.app" FORM_SOAK_TURNSTILE_TOKEN="1x0000000000000000000000000000000AA" FORM_SOAK_NEWSLETTER_EMAIL="controlled-soak@example.org" node scripts/form-preview-soak.mjs
```

Expected: aggregate JSON only, 25 accepted submissions per form, ten concurrent unique submissions per form, repeated-ID concurrency with one provider acceptance, and p95 below 2,500 ms. Replace the example preview URL/address with restricted test resources in the command environment; do not commit them.

Then execute the WAF production-equivalent sequence from `docs/operations/vercel-waf-runbook.md`, provider-outage preview, keyboard-only/VoiceOver/NVDA form pass, 320-pixel/400%-zoom pass, and one synthetic deletion cycle. Attach privacy-safe evidence to `.private-release-evidence/`; production activation remains blocked until every operational dependency is proven.

- [ ] **Step 9: Commit security and verification artifacts**

```bash
git add package.json package-lock.json .gitignore next.config.ts config/security-headers.ts scripts/build-with-csp.mjs scripts/form-preview-soak.mjs docs/operations/vercel-waf-runbook.md tests/integration/security-headers.test.ts tests/integration/experience-form-handoff.test.ts tests/e2e/forms.spec.ts
git commit -m "feat: enforce form security release gates"
```

## Final Verification Matrix

Before this subsystem is accepted, record evidence for every row; absence of evidence means incomplete.

| Requirement | Authoritative evidence |
|---|---|
| Strict schemas/normalization/16 KiB/origin/honeypot | Focused unit tests plus route HTTP responses |
| Turnstile hostname/action/expiry/single-use retry | Unit request-body assertions plus Cloudflare preview analytics |
| Five/ten WAF limits and no provider traffic on 429 | Vercel WAF revision, HTTP sequence, function invocation and isolated provider counts |
| Opaque Redis data, 5-minute lock, 24-hour acceptance | Unit concurrency/clock tests plus restricted Upstash configuration screenshot |
| New/duplicate/pending DOI privacy and confirmation | Provider adapter test plus isolated Brevo confirmation, membership, expired-link, and unsubscribe evidence |
| No false prayer/contact success | Provider-outage handler/browser/preview evidence |
| No content in storage/logs/analytics/URLs | Synthetic canary search across Vercel, GA schema, Redis shape, URLs, build output, and repository |
| Retry value retention and stable UUID | Component and browser failure/retry assertions |
| Accessible labels/errors/focus/no-JS | Testing Library, Playwright, Axe suite from foundation, keyboard, VoiceOver, NVDA, zoom matrix |
| Preview no-send honesty | Visible UI notice, no-send provider test, zero provider requests |
| CSP and headers | Unit exact-string test, two-pass hash verifier, preview report-only console audit, production-equivalent header fetch |
| Retention and ownership | Named restricted evidence, deletion rules, synthetic deletion, quarterly record |
| Legal/outcome behavior | Legal content tests, noindex response metadata, Brevo redirect configuration, sitemap output |

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-11-the-gathering-forms-privacy-security.md`.

Use **superpowers:subagent-driven-development** to execute one reviewer-sized task at a time, with specification review followed by code-quality review after every task. If executing inline instead, use **superpowers:executing-plans** and stop at each commit/checkpoint for review. Do not activate live delivery, buy services, mutate DNS, publish WAF changes, or send a campaign without explicit authorization.
