# The Gathering Verification and Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the deterministic CI, cross-browser acceptance, accessibility, performance, security, form-soak, privacy-evidence, immutable-deployment, observability, rollback, and completion-proof system that can safely release The Gathering rebuild.

**Architecture:** Verification is a separate release layer over the three completed subsystem plans: it consumes their fixed scripts, routes, content registries, form endpoints, security policy, and browser interfaces without changing application behavior. Pure evaluators define every numerical gate, browser and HTTP runners collect evidence from built or immutable deployments, and a private hash-sealed release record prevents intent or an incomplete green check from being mistaken for completion. A protected ordinary Preview carries no-send/test-recipient and high-volume QA. Only after separate, explicit production-candidate authorization, `vercel --prod --skip-domain` creates a protected staged Production deployment with Production build settings but no custom domains; Production-safe gates run against that exact deployment ID and SHA, and `vercel promote <staged-id-or-url>` later assigns the canonical domain without rebuilding it.

**Tech Stack:** Node.js `>=22 <23`, npm, Next.js `16.2.10`, React `19.2.7`, TypeScript `5.9.3`, Vitest `4.1.10`, Playwright `1.61.1`, `@axe-core/playwright` `4.12.1`, HTML Validate `11.5.5`, Lighthouse CI `0.15.1`, Cheerio `1.2.0`, Ajv `8.20.0`, Gitleaks `8.30.1`, Vercel CLI `55.0.0`, GitHub Actions, Chrome DevTools Protocol, Android Debug Bridge.

## Global Constraints

- Work on `codex/the-gathering-rebuild`; `main` remains the production branch and production stays in the existing Vercel project.
- Use Node.js `>=22 <23`, Next.js `16.2.10`, React and React DOM `19.2.7`, TypeScript `5.9.3`, GSAP `3.15.0`, Vitest `4.1.10`, Playwright `1.61.1`, ESLint `10.7.0`, and `eslint-config-next` `16.2.10` exactly.
- Use npm and commit `package-lock.json`; do not introduce a second package manager, `src/` tree, Tailwind, or another component framework.
- Production builds run through the forms plan's deterministic `node scripts/build-with-csp.mjs`; `next.config.ts` retains webpack, SHA-256 SRI, generated CSP hashes, static public pages, and Vercel POST route handlers. Never set `output: "export"`.
- Do not edit application routes, components, content, form handlers, analytics behavior, prompt behavior, or visual behavior in this plan. A verification failure returns to the owning subsystem plan as a new failing test and reviewed fix.
- Canonical URLs are lowercase, extensionless, slashless paths on `https://www.thelioncompany.org`; the home title remains `The Lion Company — Unity Through Christ`.
- Preserve GA4 measurement ID `G-MNK2G065ES`; previews never send to that property, and no analytics request, cookie, or event exists before affirmative consent.
- Before this plan executes, the experience plan must add a consent-gated home-page Web Vitals collector that emits only safe aggregate-ready `web_vital` fields (`metric_name`, integer `metric_value_ms`, `metric_rating`, and `page_group: "home"`) after analytics consent and stops future emission on revocation. It must never include a form value, URL query, user identifier, free text, or preview traffic. This release plan validates the resulting GA4 aggregate; it does not add analytics behavior to the app.
- Prayer/contact content, names, email addresses, Turnstile tokens, raw provider errors, and form state never enter logs, analytics, URLs, browser storage, Redis, source maps, Git, screenshots, or committed release evidence.
- The deployment-protection automation secret may bypass Vercel Deployment Protection only. It is never a WAF, Turnstile, form-validation, idempotency, provider, or application-production bypass. A secret-bearing request is sent only to the exact bound Vercel origin, uses `redirect: "manual"`, and exists only to obtain an origin-scoped bypass cookie. Browser, CDP, and Lighthouse traffic use that cookie and never receive global bypass headers.
- Before this plan executes, the forms plan must validate Vercel's system `VERCEL_URL` and add exactly `https://${VERCEL_URL}` to allowed origins only when `VERCEL_ENV=preview`; production remains canonical-only. Never spoof an Origin or preconfigure a mutable alias to make an immutable preview pass.
- The 25-per-form volume soak uses a preview-only, authenticated-runner, source-bound WAF exception with an expiry no later than two hours; production-equivalent rate-limit runs have no exception and prove the sixth prayer/contact or eleventh newsletter attempt is `429` with no provider call.
- Public pages stay meaningful with JavaScript disabled. A YouTube request occurs only after intent and uses `youtube-nocookie.com`; transcript/caption eligibility remains authoritative.
- Every indexable page shell exposes visible internal `/give` navigation; `/give` exposes the exact centralized Subsplash destination above the fold at 320px and desktop, remains keyboard-operable, and works without JavaScript.
- WCAG 2.2 AA is the launch target. Any keyboard trap, inaccessible form, missing reduced-motion path, critical or serious Axe violation, unreviewed moderate Axe violation, critical contrast failure, horizontal overflow at 320 CSS pixels, or 400%-zoom failure blocks release.
- Browser acceptance runs on Chromium, Firefox, and WebKit at 360x800, 768x1024, and 1440x900, plus JavaScript-disabled, analytics denied/granted/revoked, unavailable-storage, keyboard-only, and reduced-motion paths.
- Manual compatibility evidence covers current iPhone Safari, an iPhone SE-sized viewport, Pixel/Android Chrome, and iPad portrait and landscape, plus VoiceOver on Apple hardware and NVDA on Windows; simulator-only or desktop responsive-mode evidence does not replace the named physical-device/assistive-technology checks.
- Lighthouse uses the median of three mobile Slow 4G, 4x CPU runs: Performance `>=92` on home and `>=95` on static routes; Accessibility, Best Practices, and SEO `100`; LCP `<=2,500 ms`; CLS `<=0.05`; TBT `<=150 ms`.
- Initial compressed JavaScript is `<=180 KB`; initial CSS is `<=60 KB`; the largest initial image response is `<=300 KB`; transfer before user-started media is `<=1.5 MB`; initial requests are `<=60`; no primary-scroll long task exceeds `200 ms`.
- The physical-device motion gate is three 30-second traces on a cold Chrome process with cleared origin data, battery above 50%, power saver off, thermally normal device, and no background recording. Pixel 6 on Android 15/current stable Chrome—or an explicitly approved slower device—must achieve median `>=55 fps` and median dropped frames `<5%`.
- Axe has zero critical/serious violations and zero unreviewed moderate violations. Visual baselines are generated only from the deterministic production build, reviewed by a human, and committed; CI never updates them.
- Preview CSP remains report-only until the browser audit proves no required violation. Both staged and canonical Production enforce CSP with generated hashes, no wildcard, no script `unsafe-inline`, and no Brevo browser origin; launch HSTS is exactly `max-age=31536000` without `includeSubDomains` or preload.
- Ordinary Preview QA and staged Production are different immutable deployments and are recorded with different IDs even though they use the same exact Git SHA. Preview-only evidence never masquerades as staged-candidate evidence.
- Creating the staged Production deployment requires explicit production-candidate authorization because `vercel --prod --skip-domain` uses Production environment variables and resources. It must assign no custom Production domain, and its generated Vercel URL must remain Deployment Protected; stop if either condition is false.
- Promotion uses `vercel promote <staged-production-id-or-url>` against the already verified staged Production deployment. It must preserve that deployment ID and Git SHA without a rebuild. Do not run ordinary `vercel --prod` for promotion, change DNS, delete submissions, or promote a mutable branch alias.
- Production form handlers accept only `https://www.thelioncompany.org`, and Turnstile accepts only `www.thelioncompany.org`. Never spoof `Origin`, weaken those contracts, or run form E2E against the staged `.vercel.app` URL. The first controlled live-provider form E2E runs immediately after promotion on the canonical host and rolls back immediately on any failure.
- Production sending, promotion, rollback, WAF publication, paid-service changes, DNS/email-authentication changes, Search Console submission, and provider configuration require the explicit authorization and credentials defined in the approved specification; this plan never infers them from a green preview.
- Rollback means promoting the recorded prior Vercel deployment. Availability loss, false form success, a privacy leak, wrong canonical, accidental `noindex`, redirect loop, or consent/CSP blocking core content bypasses sample floors and triggers immediate rollback.
- Private release evidence lives only under `.private-release-evidence/`, contains no credentials or raw personal data, and is hash-sealed. Repository documentation contains procedures and finite requirement mappings, never private screenshots, names, addresses, tokens, IPs, provider exports, or message bodies.
- Full goal completion requires both a seven-day monitoring window and at least 200 consented measured home views with a field INP p75 `<=200 ms`; passing CI, a preview, promotion, immediate smoke, or a pending low-sample report is not proof of completion.

---

## Exact File Map

| Path | Action | Responsibility |
|---|---|---|
| `package.json`, `package-lock.json` | Modify | Pin release-only tooling and expose deterministic verification scripts. |
| `playwright.config.ts` | Modify | Preserve the three browser project names while supporting local builds, protected immutable deployments, origin-scoped protection cookies, reports, traces, and snapshot paths. |
| `htmlvalidate.config.mjs` | Create | Validate prerendered HTML without weakening semantic rules for framework-owned inline data. |
| `.gitleaks.toml` | Create | Extend default secret rules with only exact synthetic-fixture allowlisting; no path-wide or history baseline exemption. |
| `.github/workflows/quality.yml` | Create | Required unit/type/lint/build/HTML/security and three-browser CI gates with uploaded evidence. |
| `.github/workflows/visual-baselines.yml` | Create | Generate canonical Chromium snapshots only on the same pinned Ubuntu/Node/Playwright image used by CI. |
| `.github/workflows/release-candidate.yml` | Create | Manual, read-only verification of one authorized staged Production deployment and Git SHA; never creates or promotes it. |
| `tests/unit/release/tooling-contract.test.ts` | Create | Exact dependency, script, Playwright, and CI contract. |
| `tests/unit/release/preview-origin-contract.test.ts` | Create | Cross-plan proof that the current immutable Vercel preview Origin is accepted without weakening production. |
| `tests/e2e/support/release-helpers.ts` | Create | Shared Axe, console, GA, overflow, viewport, and deterministic-visual helpers. |
| `tests/e2e/release/experience-matrix.spec.ts` | Create | Three-engine x three-size keyboard, navigation, dialog, consent, media, prompt, and reduced-motion flows. |
| `tests/e2e/release/no-javascript.spec.ts` | Create | JavaScript-disabled content, direct actions, honest live state, form notice, and analytics absence. |
| `tests/e2e/release/accessibility-visual.spec.ts` | Create | Axe, landmarks, 320-pixel overflow, 400%-zoom, forced-colors, text-spacing, and reviewed screenshot baselines. |
| `tests/e2e/release/csp-console.spec.ts` | Create | Required-route console, request-failure, and `securitypolicyviolation` audit. |
| `scripts/lib/public-contracts.mjs` | Create | Pure canonical, sitemap, redirect, JSON-LD, link, robots, and security-header assertions. |
| `scripts/lib/public-contracts.d.mts` | Create | TypeScript declarations for the Node ESM public-contract evaluator. |
| `scripts/check-public-contracts.mjs` | Create | Local/preview/staged-production/canonical-production HTTP verifier with exact-origin protection-cookie support and privacy-safe JSON evidence. |
| `scripts/check-static-media-architecture.mjs` | Create | Prove reviewed podcast slugs are prerendered, unknown detail slugs reject, and runtime UI cannot import the network refresh function. |
| `tests/unit/release/public-contracts.test.ts` | Create | Focused public-contract evaluator tests. |
| `scripts/form-preview-soak.mjs` | Modify | Add explicit volume/rate-limit/outage modes and Vercel Deployment Protection headers without an application bypass. |
| `scripts/brevo-doi-lifecycle.mjs` | Create | Exercise new/pending duplicate DOI, confirmation, expired recovery, unsubscribe suppression, and 30-day pending purge in an isolated Brevo preview. |
| `scripts/submit-pii-canaries.mjs` | Create | Submit runtime-only canaries through the real protected no-send handlers and bind the exact Vercel log window. |
| `scripts/check-pii-canaries.mjs` | Create | Search build, reports, exported logs, and source for runtime-only synthetic canaries without printing them. |
| `config/retention-evidence.schema.json` | Create | Exact privacy-safe operational evidence schema for mailbox, Brevo, Redis, ownership, and synthetic deletion. |
| `scripts/lib/retention-evidence.mjs` | Create | Validate retention evidence plus attachment hashes. |
| `scripts/lib/retention-evidence.d.mts` | Create | TypeScript declarations for retention evidence tests. |
| `scripts/validate-retention-evidence.mjs` | Create | CLI wrapper for the private retention record. |
| `tests/unit/release/retention-evidence.test.ts` | Create | Retention constants, forbidden-PII, and attachment-integrity tests. |
| `tests/e2e/release/privacy-leaks.spec.ts` | Create | Browser storage, URL, console, cookie, and third-party-body canary assertions. |
| `docs/operations/release-form-soak.md` | Create | Exact protected-preview, WAF, provider-outage, canary, and retention evidence sequence. |
| `lighthouserc.cjs` | Create | Three-run mobile Slow 4G/4x CPU collection against every authoritative indexable static route. |
| `scripts/lighthouse-auth.cjs` | Create | Seed an exact-origin Vercel bypass cookie for Lighthouse without global credential headers. |
| `lib/release/performance.mjs` | Create | Pure median Lighthouse, resource-budget, long-task, and physical-trace evaluators. |
| `lib/release/performance.d.mts` | Create | TypeScript declarations for performance evaluator tests. |
| `scripts/check-lighthouse-results.mjs` | Create | Validate `.lighthouseci` JSON and write the aggregate release result. |
| `scripts/check-bundle-budgets.mjs` | Create | Brotli-measure initial Next route JS/CSS before Lighthouse. |
| `scripts/capture-pixel-motion.mjs` | Create | ADB/CDP device preflight, three 30-second traces, trace files, and threshold summary. |
| `tests/unit/release/performance-gates.test.ts` | Create | Boundary tests for every numerical performance and trace gate. |
| `lib/release/health.mjs` | Create | Exact rollback-threshold evaluator. |
| `lib/release/health.d.mts` | Create | TypeScript declarations for deployment/health tests. |
| `scripts/release-smoke.mjs` | Create | Bind Vercel deployment metadata, Git SHA, immutable URL/canonical alias, and production smoke. |
| `scripts/evaluate-release-health.mjs` | Create | Evaluate dashboard/provider samples and emit rollback/pass evidence. |
| `tests/unit/release/release-health.test.ts` | Create | Deployment binding and every immediate/statistical rollback boundary. |
| `docs/operations/release-rollout-runbook.md` | Create | Preview QA, staged Production authorization/deploy, no-rebuild promotion, canonical smoke, monitoring cadence, alert ownership, and rollback. |
| `lib/release/evidence.mjs` | Create | Finite launch/closeout gate registry and integrity checks. |
| `lib/release/evidence.d.mts` | Create | TypeScript declarations for completion-audit tests. |
| `scripts/seal-release-evidence.mjs` | Create | SHA-256 manifest for the private evidence directory. |
| `scripts/verify-completion-evidence.mjs` | Create | Requirement-by-requirement launch or seven-day closeout audit. |
| `tests/unit/release/completion-evidence.test.ts` | Create | Missing, mismatched, fabricated-shape, and complete evidence cases. |
| `docs/release/completion-evidence-matrix.md` | Create | Human-readable mapping from every approved requirement to authoritative current-state evidence. |

## Interfaces Consumed From Earlier Plans

The following are fixed inputs, not reimplemented here:

```ts
// Foundation
export const indexableStaticRoutes: readonly string[];
export const legacyRouteLedger: readonly LegacyRoute[];
export function canonicalUrl(path: string): string;
export const destinationRegistry: readonly Destination[];

// Experience
export type ConsentState = "unknown" | "denied" | "analytics-granted";
export function markNewsletterConfirmed(): void;
export function markNewsletterRequestAccepted(): void;

// Forms/security
export type FormEndpoint = "newsletter" | "prayer" | "contact";
export type FormSubmitResult =
  | { ok: true; status: "accepted"; submissionId: string; deliveryMode: "no-send" | "test-recipient" | "live"; replayed: boolean; message: string }
  | { ok: false; status: "error"; code: SafeFormErrorCode; retryable: boolean; message: string; fieldErrors?: Record<string, string[]> };
export function securityHeaders(input: { production: boolean; hashes: readonly string[] }): Array<{ key: string; value: string }>;
```

Every evidence-producing CLI writes this common envelope when `RELEASE_EVIDENCE_DIR` is set:

```ts
export type GateEvidence = {
  schemaVersion: 1;
  gate: string;
  status: "pass" | "fail";
  recordedAt: string;
  deploymentScope: "local" | "preview-qa" | "staged-production" | "production";
  deploymentId: string;
  commitSha: string;
  assertions: readonly string[];
  metrics?: Readonly<Record<string, unknown>>;
};
```

### Task 1: Pin the release toolchain and establish required CI

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `playwright.config.ts`
- Create: `htmlvalidate.config.mjs`
- Create: `.gitleaks.toml`
- Create: `.github/workflows/quality.yml`
- Create: `.github/workflows/visual-baselines.yml`
- Create: `tests/unit/release/tooling-contract.test.ts`
- Create: `tests/unit/release/preview-origin-contract.test.ts`

**Interfaces:**
- Consumes: the final `package.json` scripts and deterministic CSP `build` command from the forms plan; `getServerEnv()` with validated preview-only `VERCEL_URL` derivation; the `chromium`, `firefox`, and `webkit` Playwright project names from the foundation plan.
- Produces: scripts `check:html`, `check:public`, `check:static-media`, `check:pii`, `bundle:check`, `lighthouse:collect`, `lighthouse:ci`, `test:e2e:release`, `release:doi`, `release:smoke`, `release:health`, `release:evidence:seal`, and `release:evidence:verify`; a Playwright base URL/protection-header contract; required `quality / static` and `quality / browser (<engine>)` checks.

- [ ] **Step 1: Write the failing release-tooling contract**

```ts
// tests/unit/release/tooling-contract.test.ts
import { readFileSync } from "node:fs";
import packageJson from "../../../package.json";
import { describe, expect, it } from "vitest";

const playwright = readFileSync("playwright.config.ts", "utf8");
const workflow = readFileSync(".github/workflows/quality.yml", "utf8");
const visualWorkflow = readFileSync(".github/workflows/visual-baselines.yml", "utf8");

describe("release tooling contract", () => {
  it("pins every verification dependency", () => {
    expect(packageJson.devDependencies).toMatchObject({
      "@axe-core/playwright": "4.12.1",
      "@lhci/cli": "0.15.1",
      "ajv": "8.20.0",
      "cheerio": "1.2.0",
      "html-validate": "11.5.5",
      "tsx": "4.23.0",
      "vercel": "55.0.0",
      "wait-on": "9.0.10",
    });
  });

  it("retains deterministic CSP build and exposes every release command", () => {
    expect(packageJson.scripts.build).toBe("node scripts/build-with-csp.mjs");
    for (const script of [
      "check:html", "check:public", "check:static-media", "check:pii", "bundle:check",
      "lighthouse:collect", "lighthouse:ci", "test:e2e:release",
      "release:doi", "release:smoke", "release:health", "release:evidence:seal",
      "release:evidence:verify",
    ]) expect(packageJson.scripts[script], script).toBeTruthy();
  });

  it("keeps stable engine names and supports immutable remote targets", () => {
    for (const name of ["chromium", "firefox", "webkit"]) {
      expect(playwright).toContain(`name: "${name}"`);
    }
    expect(playwright).toContain("PLAYWRIGHT_BASE_URL");
    expect(playwright).toContain("VERCEL_AUTOMATION_BYPASS_SECRET");
    expect(playwright).toContain("snapshotPathTemplate");
    expect(playwright).toContain("{platform}");
  });

  it("runs static and all three browser checks without production secrets", () => {
    expect(workflow).toContain("quality / static");
    expect(workflow).toContain("quality / browser (${{ matrix.browser }})");
    expect(workflow).toContain("browser: [chromium, firefox, webkit]");
    expect(workflow).toContain("FORM_DELIVERY_MODE: no-send");
    expect(workflow).toContain("gitleaks_8.30.1_linux_x64.tar.gz");
    expect(workflow).toContain('git --log-opts="--all"');
    expect(workflow).toContain("--redact=100");
    expect(workflow).not.toContain("BREVO_API_KEY");
    expect(workflow).not.toContain("VERCEL_ACCESS_TOKEN");
  });

  it("generates canonical baselines only in the pinned CI-equivalent Linux job", () => {
    expect(visualWorkflow).toContain("workflow_dispatch");
    expect(visualWorkflow).toContain("runs-on: ubuntu-24.04");
    expect(visualWorkflow).toContain("node-version: 22.22.3");
    expect(visualWorkflow).toContain("mcr.microsoft.com/playwright:v1.61.1-noble");
    expect(visualWorkflow).toContain("playwright install --with-deps chromium");
    expect(visualWorkflow).toContain("--update-snapshots");
    expect(visualWorkflow).not.toContain("git push");
  });
});
```

- [ ] **Step 2: Add the immutable-preview Origin regression test**

```ts
// tests/unit/release/preview-origin-contract.test.ts
import { describe, expect, it } from "vitest";
import { getServerEnv } from "../../../lib/env";

const common = {
  NODE_ENV: "test",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
  TURNSTILE_EXPECTED_HOSTNAMES: "localhost,the-lion-company-candidate-abc.vercel.app,www.thelioncompany.org",
  FORM_IDEMPOTENCY_SECRET: "release-origin-contract-secret-more-than-thirty-two-characters",
  BREVO_CONSENT_VERSION: "2026-07-11",
};

describe("immutable preview Origin", () => {
  it("derives the exact HTTPS origin from validated VERCEL_URL in preview", () => {
    const env = getServerEnv({
      ...common,
      VERCEL_ENV: "preview",
      VERCEL_URL: "the-lion-company-candidate-abc.vercel.app",
      NEXT_PUBLIC_SITE_URL: "https://the-lion-company-candidate-abc.vercel.app",
      NEXT_PUBLIC_FORM_MODE: "no-send",
      FORM_DELIVERY_MODE: "no-send",
      FORM_ALLOWED_ORIGINS: "http://localhost:3000",
    });
    expect(env.allowedOrigins).toContain("https://the-lion-company-candidate-abc.vercel.app");
  });

  it("rejects a non-Vercel system hostname in preview", () => {
    expect(() => getServerEnv({
      ...common,
      VERCEL_ENV: "preview",
      VERCEL_URL: "attacker.example.org",
      NEXT_PUBLIC_SITE_URL: "https://attacker.example.org",
      NEXT_PUBLIC_FORM_MODE: "no-send",
      FORM_DELIVERY_MODE: "no-send",
      FORM_ALLOWED_ORIGINS: "http://localhost:3000",
    })).toThrow(/VERCEL_URL/);
  });

  it("never adds a preview origin in production", () => {
    const env = getServerEnv({
      ...common,
      VERCEL_ENV: "production",
      VERCEL_URL: "the-lion-company-candidate-abc.vercel.app",
      NEXT_PUBLIC_SITE_URL: "https://www.thelioncompany.org",
      NEXT_PUBLIC_FORM_MODE: "live",
      FORM_DELIVERY_MODE: "live",
      FORM_ALLOWED_ORIGINS: "https://www.thelioncompany.org",
      UPSTASH_REDIS_REST_URL: "https://release-contract.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "synthetic-scoped-token",
      BREVO_API_KEY: "synthetic-provider-key",
      BREVO_NEWSLETTER_LIST_ID: "1",
      BREVO_DOI_TEMPLATE_ID: "1",
      BREVO_SENDER_EMAIL: "forms@example.org",
      BREVO_SENDER_NAME: "The Lion Company",
      FORM_PRAYER_RECIPIENT: "prayer@example.org",
      FORM_CONTACT_RECIPIENT: "contact@example.org",
      MAILBOX_PROVIDER_PUBLIC_NAME: "Restricted mailbox provider",
      MAILBOX_BACKUP_AND_DELETION_PUBLIC: "Verified mailbox backup and final-deletion timing.",
      BREVO_BACKUP_AND_DELETION_PUBLIC: "Verified Brevo backup and final-deletion timing.",
      MARKETING_POSTAL_ADDRESS_VERIFIED: "true",
      DATA_STEWARD_NAME: "Restricted role owner",
      MAILBOX_ADMIN_NAME: "Restricted role owner",
    });
    expect(env.allowedOrigins).toEqual(["https://www.thelioncompany.org"]);
  });
});
```

This test is a hard prerequisite routed back to the forms/privacy plan. If it fails, do not spoof the `Origin` header, add a wildcard, or edit `lib/env.ts` in this verification plan; amend and review the owning plan first.

- [ ] **Step 3: Run both focused tests and verify missing contracts fail**

Run: `npm test -- tests/unit/release/tooling-contract.test.ts tests/unit/release/preview-origin-contract.test.ts`

Expected: FAIL because the release dependencies/workflow/scripts are absent and, until the forms plan is corrected, the immutable preview origin is not derived from validated `VERCEL_URL`.

- [ ] **Step 4: Install the exact verification dependencies**

Run:

```bash
npm install --save-dev --save-exact @axe-core/playwright@4.12.1 @lhci/cli@0.15.1 ajv@8.20.0 cheerio@1.2.0 html-validate@11.5.5 tsx@4.23.0 vercel@55.0.0 wait-on@9.0.10
```

Expected: npm exits 0; `package.json` and `package-lock.json` contain the exact versions without `^` or `~`.

- [ ] **Step 5: Add the exact release scripts without replacing the CSP build**

Run:

```bash
npm pkg set 'scripts.check:html=html-validate ".next/server/app/**/*.html"'
npm pkg set 'scripts.check:public=tsx scripts/check-public-contracts.mjs'
npm pkg set 'scripts.check:static-media=tsx scripts/check-static-media-architecture.mjs'
npm pkg set 'scripts.check:pii=node scripts/check-pii-canaries.mjs'
npm pkg set 'scripts.bundle:check=node scripts/check-bundle-budgets.mjs'
npm pkg set 'scripts.lighthouse:collect=lhci collect --config=./lighthouserc.cjs'
npm pkg set 'scripts.lighthouse:ci=npm run lighthouse:collect && tsx scripts/check-lighthouse-results.mjs'
npm pkg set 'scripts.test:e2e:release=playwright test tests/e2e/release'
npm pkg set 'scripts.release:doi=node scripts/brevo-doi-lifecycle.mjs'
npm pkg set 'scripts.release:smoke=tsx scripts/release-smoke.mjs'
npm pkg set 'scripts.release:health=node scripts/evaluate-release-health.mjs'
npm pkg set 'scripts.release:evidence:seal=node scripts/seal-release-evidence.mjs'
npm pkg set 'scripts.release:evidence:verify=node scripts/verify-completion-evidence.mjs'
```

Expected: npm exits 0; `npm pkg get scripts.build` still prints `"node scripts/build-with-csp.mjs"`.

- [ ] **Step 6: Replace the browser configuration with the complete local/immutable-target contract**

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

const remoteBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = remoteBaseURL ?? "http://localhost:3000";
const protectionSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "test-results/playwright",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 45_000,
  expect: { timeout: 10_000, toHaveScreenshot: { maxDiffPixelRatio: 0.005 } },
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never", outputFolder: "playwright-report" }], ["json", { outputFile: "test-results/playwright/results.json" }]]
    : [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}-{projectName}-{platform}{ext}",
  use: {
    baseURL,
    colorScheme: "light",
    locale: "en-US",
    timezoneId: "America/Chicago",
    trace: protectionSecret ? "off" : "retain-on-failure",
    screenshot: protectionSecret ? "off" : "only-on-failure",
    video: protectionSecret ? "off" : "retain-on-failure",
    serviceWorkers: "block",
  },
  webServer: remoteBaseURL
    ? undefined
    : {
        command: process.env.PLAYWRIGHT_SERVER_COMMAND ?? "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI && !process.env.PLAYWRIGHT_SERVER_COMMAND,
        timeout: 180_000,
      },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
```

- [ ] **Step 7: Add the generated-HTML validation policy**

```js
// htmlvalidate.config.mjs
export default {
  extends: ["html-validate:recommended"],
  elements: ["html5"],
  rules: {
    "no-inline-style": "off",
    "no-trailing-whitespace": "error",
    "prefer-native-element": "error",
    "valid-id": "error",
    "wcag/h30": "error",
    "wcag/h32": "error",
    "wcag/h37": "error",
    "wcag/h63": "error",
    "wcag/h71": "error",
  },
};
```

```toml
# .gitleaks.toml
title = "The Lion Company full-history secret policy"

[extend]
useDefault = true

[allowlist]
description = "Exact public Turnstile test keys and synthetic non-production fixtures only"
regexTarget = "match"
regexes = [
  '''1x0+AA''',
  '''ci-only-idempotency-secret-2026-07-11-not-for-production''',
  '''visual-only-idempotency-secret-2026-07-11-not-for-production''',
  '''release-origin-contract-secret-more-than-thirty-two-characters''',
]
```

Do not add a path allowlist, commit baseline, generic entropy exemption, or `gitleaks:allow` marker. A historical finding must be rotated and removed from history under an explicitly approved incident procedure; it is never hidden merely to make CI green.

- [ ] **Step 8: Add the required quality workflow**

```yaml
# .github/workflows/quality.yml
name: quality

on:
  pull_request:
  push:
    branches: [main, codex/the-gathering-rebuild]

permissions:
  contents: read

concurrency:
  group: quality-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_ENV: test
  VERCEL_ENV: preview
  NEXT_PUBLIC_SITE_URL: http://localhost:3000
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: 1x00000000000000000000AA
  NEXT_PUBLIC_FORM_MODE: no-send
  FORM_DELIVERY_MODE: no-send
  FORM_ALLOWED_ORIGINS: http://localhost:3000
  TURNSTILE_SECRET_KEY: 1x0000000000000000000000000000000AA
  TURNSTILE_EXPECTED_HOSTNAMES: localhost
  FORM_IDEMPOTENCY_SECRET: ci-only-idempotency-secret-2026-07-11-not-for-production
  BREVO_CONSENT_VERSION: 2026-07-11

jobs:
  static:
    name: quality / static
    runs-on: ubuntu-24.04
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with:
          node-version: 22.22.3
          cache: npm
      - run: npm ci
      - name: Scan the complete Git history for secrets
        run: |
          curl --fail --silent --show-error --location --output /tmp/gitleaks.tar.gz https://github.com/gitleaks/gitleaks/releases/download/v8.30.1/gitleaks_8.30.1_linux_x64.tar.gz
          echo "551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb  /tmp/gitleaks.tar.gz" | sha256sum --check
          tar -xzf /tmp/gitleaks.tar.gz -C /tmp gitleaks
          mkdir -p test-results
          /tmp/gitleaks --config .gitleaks.toml --redact=100 --no-banner --max-decode-depth=2 --max-archive-depth=1 --report-format=json --report-path=test-results/gitleaks-history.json git --log-opts="--all" .
      - run: npm test
      - run: npm run typecheck
      - run: npm run lint
      - run: npm audit --audit-level=high --omit=dev
      - run: npm run build
      - run: npm run check:assets
      - run: npm run check:html
      - run: npm run bundle:check
      - name: Reject production bypasses and provider secrets
        run: |
          if rg -n 'SOAK_BYPASS|WAF_BYPASS|RATE_LIMIT_BYPASS|xkeysib-' app components config content lib .next; then
            exit 1
          fi
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: static-evidence
          path: |
            .next/build-manifest.json
            .next/routes-manifest.json
            test-results
          if-no-files-found: error
          retention-days: 14

  browser:
    name: quality / browser (${{ matrix.browser }})
    runs-on: ubuntu-24.04
    container:
      image: mcr.microsoft.com/playwright:v1.61.1-noble
    timeout-minutes: 30
    strategy:
      fail-fast: false
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22.22.3
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps ${{ matrix.browser }}
      - run: npm run build
      - name: Run the complete browser suite against the production server
        env:
          PLAYWRIGHT_SERVER_COMMAND: npm run start
        run: npx playwright test --project=${{ matrix.browser }}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: browser-${{ matrix.browser }}-evidence
          path: |
            playwright-report
            test-results/playwright
          if-no-files-found: error
          retention-days: 14
```

- [ ] **Step 9: Add canonical Linux-only visual-baseline generation**

```yaml
# .github/workflows/visual-baselines.yml
name: visual-baselines

on:
  workflow_dispatch:
    inputs:
      commit_sha:
        description: Exact commit to render
        required: true
        type: string

permissions:
  contents: read

jobs:
  generate:
    name: visual-baselines / canonical-linux
    runs-on: ubuntu-24.04
    container:
      image: mcr.microsoft.com/playwright:v1.61.1-noble
    timeout-minutes: 30
    env:
      NODE_ENV: test
      VERCEL_ENV: preview
      NEXT_PUBLIC_SITE_URL: http://localhost:3000
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: 1x00000000000000000000AA
      NEXT_PUBLIC_FORM_MODE: no-send
      FORM_DELIVERY_MODE: no-send
      FORM_ALLOWED_ORIGINS: http://localhost:3000
      TURNSTILE_SECRET_KEY: 1x0000000000000000000000000000000AA
      TURNSTILE_EXPECTED_HOSTNAMES: localhost
      FORM_IDEMPOTENCY_SECRET: visual-only-idempotency-secret-2026-07-11-not-for-production
      BREVO_CONSENT_VERSION: 2026-07-11
    steps:
      - uses: actions/checkout@v4
        with: { ref: "${{ inputs.commit_sha }}" }
      - uses: actions/setup-node@v4
        with:
          node-version: 22.22.3
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - name: Generate canonical Linux snapshots without repository write access
        env:
          PLAYWRIGHT_SERVER_COMMAND: npm run start
        run: npx playwright test tests/e2e/release/accessibility-visual.spec.ts --project=chromium --grep 'visual baseline' --update-snapshots
      - uses: actions/upload-artifact@v4
        with:
          name: canonical-linux-visual-baselines
          path: tests/e2e/release/accessibility-visual.spec.ts-snapshots/*-chromium-linux.png
          if-no-files-found: error
          retention-days: 14
```

Expected: the workflow has read-only repository permission, checks out an exact commit, uses the same Ubuntu release, Node version, Playwright version from the lockfile, production build, locale, timezone, fonts, and Chromium installation as the required CI browser job, and uploads snapshots without committing or pushing them.

- [ ] **Step 10: Re-run the focused contract and static configuration checks**

Run: `npm test -- tests/unit/release/tooling-contract.test.ts tests/unit/release/preview-origin-contract.test.ts && npm run typecheck && npm run lint`

Expected: the focused suite passes; typecheck and lint exit 0; the three existing Playwright project names remain selectable; the required static job has full Git history and a checksum-pinned, fully redacted Gitleaks scan with no baseline or path-wide exemption.

- [ ] **Step 11: Commit the toolchain and CI boundary**

```bash
git add package.json package-lock.json playwright.config.ts htmlvalidate.config.mjs .gitleaks.toml .github/workflows/quality.yml .github/workflows/visual-baselines.yml tests/unit/release/tooling-contract.test.ts tests/unit/release/preview-origin-contract.test.ts
git commit -m "test: establish release verification CI"
```

### Task 2: Prove cross-browser, accessibility, no-JavaScript, and visual behavior

**Files:**
- Create: `tests/e2e/support/release-helpers.ts`
- Create: `tests/e2e/release/experience-matrix.spec.ts`
- Create: `tests/e2e/release/no-javascript.spec.ts`
- Create: `tests/e2e/release/accessibility-visual.spec.ts`
- Create after review: `tests/e2e/release/accessibility-visual.spec.ts-snapshots/*.png`

**Interfaces:**
- Consumes: the final `SiteHeader`, `MobileNavigation`, `ConsentControls`, `VideoFacade`, `Dialog`, `PromptController`, `NewsletterForm`, `PrayerForm`, and `ContactForm` browser behavior from the experience/forms plans.
- Produces: `RELEASE_VIEWPORTS`, `INDEXABLE_SMOKE_ROUTES`, `collectBrowserLeaks(page)`, `expectNoBlockingAxeFindings(page)`, `expectNoHorizontalOverflow(page)`, `denyAnalytics(page)`, deterministic Chromium screenshot baselines, and the full three-engine/three-size release matrix.

- [ ] **Step 1: Write the failing three-engine experience matrix**

```ts
// tests/e2e/release/experience-matrix.spec.ts
import { expect, test } from "@playwright/test";
import { destinationRegistry } from "../../../content/destinations";
import {
  INDEXABLE_SMOKE_ROUTES,
  RELEASE_VIEWPORTS,
  seedProtectedDeploymentCookie,
  collectBrowserLeaks,
  denyAnalytics,
  expectNoGa,
  expectNoHorizontalOverflow,
} from "../support/release-helpers";

test.beforeEach(async ({ context }) => seedProtectedDeploymentCookie(context));
const subsplashURL = destinationRegistry.find((destination) => destination.key === "subsplash")!.href;

for (const viewport of RELEASE_VIEWPORTS) {
  test.describe(`${viewport.name} ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const path of INDEXABLE_SMOKE_ROUTES) {
      test(`${path} has one visible h1, clean console, and no overflow`, async ({ page }) => {
        const leaks = collectBrowserLeaks(page);
        await page.goto(path, { waitUntil: "networkidle" });
        await denyAnalytics(page);
        await expect(page.locator("h1:visible")).toHaveCount(1);
        await expect(page.locator("main")).toBeVisible();
        await expectNoHorizontalOverflow(page);
        expect(leaks.consoleErrors).toEqual([]);
        expect(leaks.pageErrors).toEqual([]);
      });
    }
  });
}

test("every indexable page shell exposes the internal giving path", async ({ page }) => {
  for (const path of INDEXABLE_SMOKE_ROUTES) {
    await page.goto(path);
    await expect(page.locator('a[href="/give"]').first(), `${path} lacks the shell giving path`).toBeVisible();
  }
});

for (const viewport of [{ width: 320, height: 800 }, { width: 1440, height: 900 }]) {
  test(`giving action is exact, above fold, and keyboard reachable at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/give");
    const giving = page.locator(`a[href="${subsplashURL}"]`).first();
    await expect(giving).toBeVisible();
    const box = await giving.boundingBox();
    expect(box && box.y + box.height <= viewport.height, JSON.stringify(box)).toBeTruthy();
    for (let index = 0; index < 30 && !(await giving.evaluate((element) => element === document.activeElement)); index += 1) await page.keyboard.press("Tab");
    await expect(giving).toBeFocused();
  });
}

test("keyboard-only mobile navigation and dialog restore focus", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.addInitScript(() => {
    localStorage.setItem("tlc:prompts:v1", JSON.stringify({
      version: 1,
      visitId: "release-keyboard-visit",
      visitCount: 1,
      lastActivityAt: Date.now(),
    }));
  });
  await page.goto("/");
  await denyAnalytics(page);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  await page.keyboard.press("Tab");
  const menu = page.getByRole("button", { name: "Open menu" });
  while (!(await menu.evaluate((element) => element === document.activeElement))) {
    await page.keyboard.press("Tab");
  }
  await page.keyboard.press("Enter");
  await expect(page.getByRole("navigation", { name: "Mobile" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();

  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight * 0.7));
  const invitation = page.getByRole("complementary", { name: "Monthly field notes" });
  await expect(invitation).toBeVisible({ timeout: 20_000 });
  const open = invitation.getByRole("button", { name: "Open" });
  await open.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Monthly field notes" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(open).toBeFocused();
});

test("consent denied, granted, revoked, re-granted, expired, and cross-tab synchronized are exact", async ({ browser }) => {
  const context = await browser.newContext();
  await seedProtectedDeploymentCookie(context);
  const page = await context.newPage();
  const peer = await context.newPage();
  const analyticsRequests: string[] = [];
  for (const candidate of [page, peer]) {
    candidate.on("request", (request) => {
      if (/google-analytics|googletagmanager/.test(request.url())) analyticsRequests.push(request.url());
    });
    await candidate.route("https://www.googletagmanager.com/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/javascript", body: "" }),
    );
    await candidate.goto("/");
  }

  await page.getByRole("button", { name: "Decline analytics" }).click();
  await page.getByRole("link", { name: /support the mission/i }).first().click({ noWaitAfter: true });
  await expectNoGa(page, analyticsRequests);
  await expect(peer.getByRole("button", { name: "Analytics settings" })).toBeVisible();

  await page.getByRole("button", { name: "Analytics settings" }).click();
  await page.getByRole("button", { name: "Allow analytics" }).click();
  await expect.poll(() => analyticsRequests.length).toBeGreaterThan(0);
  await expect.poll(() => peer.evaluate(() => window.dataLayer?.some((entry) => entry[0] === "consent" && entry[1] === "update" && (entry[2] as { analytics_storage?: string }).analytics_storage === "granted"))).toBe(true);
  const origin = new URL(page.url()).origin;
  await context.addCookies([{ name: "_ga", value: "preview-host-only", url: origin, path: "/", secure: origin.startsWith("https:") }]);
  await peer.getByRole("button", { name: "Analytics settings" }).click();
  await peer.getByRole("button", { name: "Decline analytics" }).click();
  await expect.poll(() => page.evaluate(() => window.dataLayer?.some((entry) => entry[0] === "consent" && entry[1] === "update" && (entry[2] as { analytics_storage?: string }).analytics_storage === "denied"))).toBe(true);
  expect((await context.cookies()).filter((cookie) => cookie.name.startsWith("_ga"))).toEqual([]);

  await page.getByRole("button", { name: "Analytics settings" }).click();
  await page.getByRole("button", { name: "Allow analytics" }).click();
  await expect.poll(() => peer.evaluate(() => window.dataLayer?.filter((entry) => entry[0] === "consent" && entry[1] === "update" && (entry[2] as { analytics_storage?: string }).analytics_storage === "granted").length)).toBeGreaterThanOrEqual(2);

  await page.evaluate(() => localStorage.setItem("tlc:analytics-consent:v1", JSON.stringify({
    state: "analytics-granted",
    version: 0,
    decidedAt: "2025-01-01T00:00:00.000Z",
  })));
  await page.reload();
  await expect(page.getByRole("button", { name: "Allow analytics" })).toBeVisible();
  await context.close();
});

test("@canonical-consent canonical withdrawal removes host and parent-domain GA cookies", async ({ browser }) => {
  test.skip(process.env.RELEASE_MODE !== "production", "parent-domain cookie proof runs only on the promoted canonical host");
  const context = await browser.newContext();
  const page = await context.newPage();
  const peer = await context.newPage();
  for (const candidate of [page, peer]) {
    await candidate.route("https://www.googletagmanager.com/**", (route) => route.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
    await candidate.goto("https://www.thelioncompany.org/");
  }
  await page.getByRole("button", { name: "Decline analytics" }).click();
  await page.getByRole("button", { name: "Analytics settings" }).click();
  await page.getByRole("button", { name: "Allow analytics" }).click();
  await expect.poll(() => peer.evaluate(() => window.dataLayer?.some((entry) => entry[0] === "consent" && (entry[2] as { analytics_storage?: string }).analytics_storage === "granted"))).toBe(true);
  await context.addCookies([
    { name: "_ga", value: "canonical-host", domain: "www.thelioncompany.org", path: "/", secure: true },
    { name: "_ga_MNK2G065ES", value: "canonical-parent", domain: ".thelioncompany.org", path: "/", secure: true },
  ]);
  await peer.getByRole("button", { name: "Analytics settings" }).click();
  await peer.getByRole("button", { name: "Decline analytics" }).click();
  await expect.poll(() => page.evaluate(() => window.dataLayer?.some((entry) => entry[0] === "consent" && (entry[2] as { analytics_storage?: string }).analytics_storage === "denied"))).toBe(true);
  expect((await context.cookies()).filter((cookie) => cookie.name === "_ga" || cookie.name.startsWith("_ga_"))).toEqual([]);
  await page.getByRole("button", { name: "Analytics settings" }).click();
  await page.getByRole("button", { name: "Allow analytics" }).click();
  await expect.poll(() => peer.evaluate(() => window.dataLayer?.filter((entry) => entry[0] === "consent" && (entry[2] as { analytics_storage?: string }).analytics_storage === "granted").length)).toBeGreaterThanOrEqual(2);
  await context.close();
});

test("storage failure leaves analytics denied and both promotional invitations absent", async ({ browser }) => {
  const context = await browser.newContext();
  await seedProtectedDeploymentCookie(context);
  await context.addInitScript(() => {
    Object.defineProperty(Storage.prototype, "getItem", { value() { throw new Error("blocked"); } });
    Object.defineProperty(Storage.prototype, "setItem", { value() { throw new Error("blocked"); } });
  });
  const page = await context.newPage();
  const analyticsRequests: string[] = [];
  page.on("request", (request) => {
    if (/google-analytics|googletagmanager/.test(request.url())) analyticsRequests.push(request.url());
  });
  await page.goto("/");
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(61_000);
  await expect(page.getByRole("complementary")).toHaveCount(0);
  await expectNoGa(page, analyticsRequests);
  await context.close();
});

test("reduced motion preserves the hierarchy and leaves no continuous animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await denyAnalytics(page);
  for (const heading of [
    "Love is the beginning.",
    "Relationship is the place.",
    "Discipleship is the way.",
    "Education equips the work.",
  ]) await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === "running").length)).toBe(0);
});

test("eligible teaching requests no YouTube resource until play, then uses youtube-nocookie", async ({ page }) => {
  const youtubeRequests: string[] = [];
  page.on("request", (request) => {
    if (/youtube|ytimg/.test(request.url())) youtubeRequests.push(request.url());
  });
  await page.goto("/teachings/when-gods-will-doesnt-go-your-way");
  expect(youtubeRequests).toEqual([]);
  await expect(page.locator("iframe")).toHaveCount(0);
  const play = page.getByRole("button", { name: /^Play / });
  await expect(play).toBeVisible();
  await play.click();
  await expect(page.locator('iframe[src*="youtube-nocookie.com"]')).toBeVisible();
  expect(youtubeRequests.some((url) => url.includes("youtube-nocookie.com"))).toBe(true);
});

test("ineligible teaching stays direct-link-only", async ({ page }) => {
  const youtubeRequests: string[] = [];
  page.on("request", (request) => { if (/youtube|ytimg/.test(request.url())) youtubeRequests.push(request.url()); });
  await page.goto("/teachings/heart-over-hammer");
  expect(youtubeRequests).toEqual([]);
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Play / })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Watch directly on YouTube" })).toHaveAttribute("href", /zP4ZiKek3Lg/);
});
```

- [ ] **Step 2: Write the failing JavaScript-disabled contract**

```ts
// tests/e2e/release/no-javascript.spec.ts
import { expect, test } from "@playwright/test";
import { destinationRegistry } from "../../../content/destinations";
import { seedProtectedDeploymentCookie } from "../support/release-helpers";

const subsplashURL = destinationRegistry.find((destination) => destination.key === "subsplash")!.href;

test.describe("JavaScript disabled release contract", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 360, height: 800 } });
  test.beforeEach(async ({ context }) => seedProtectedDeploymentCookie(context));

  test("home remains truthful, crawlable, and actionable", async ({ page }) => {
    const thirdParty: string[] = [];
    page.on("request", (request) => {
      if (/google-analytics|googletagmanager|youtube-nocookie/.test(request.url())) thirdParty.push(request.url());
    });
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByText("Live daily on TikTok")).toBeVisible();
    await expect(page.getByRole("link", { name: /join today’s live/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /support the mission/i }).first()).toBeVisible();
    await expect(page.locator("iframe, audio[autoplay], video[autoplay]")).toHaveCount(0);
    expect(thirdParty).toEqual([]);
  });

  test("protected forms explain the requirement without leaking text into a URL", async ({ page }) => {
    await page.goto("/prayer");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("You do not have to carry this alone.");
    await expect(page.getByRole("heading", { level: 2, name: "Send a private prayer request" })).toBeVisible();
    await expect(page.getByText(/javascript is required for the security check/i)).toBeVisible();
    expect(new URL(page.url()).pathname).toBe("/prayer");
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  });

  test("teaching, podcast, store, giving, and social anchors remain real", async ({ page }) => {
    for (const path of ["/teachings", "/podcast", "/store", "/give", "/connect"]) {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator('a[href^="http"]')).not.toHaveCount(0);
    }
  });

  test("giving remains exact and above fold at 320px without JavaScript", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/give");
    const giving = page.locator(`a[href="${subsplashURL}"]`).first();
    await expect(giving).toBeVisible();
    const box = await giving.boundingBox();
    expect(box && box.y + box.height <= 800, JSON.stringify(box)).toBeTruthy();
  });
});
```

- [ ] **Step 3: Write the failing accessibility and visual-regression suite**

```ts
// tests/e2e/release/accessibility-visual.spec.ts
import { expect, test } from "@playwright/test";
import {
  INDEXABLE_SMOKE_ROUTES,
  seedProtectedDeploymentCookie,
  denyAnalytics,
  expectNoBlockingAxeFindings,
  expectNoHorizontalOverflow,
  stabilizeForScreenshot,
} from "../support/release-helpers";

test.beforeEach(async ({ context }) => seedProtectedDeploymentCookie(context));

for (const path of INDEXABLE_SMOKE_ROUTES) {
  test(`${path} has no blocking Axe finding`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(path);
    await denyAnalytics(page);
    await expectNoBlockingAxeFindings(page);
  });
}

test("320 CSS pixels and 400% zoom retain a single horizontal viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const path of ["/", "/prayer", "/connect", "/teachings"]) {
    await page.goto(path);
    await denyAnalytics(page);
    await expectNoHorizontalOverflow(page);
    await expect(page.locator("main")).toBeVisible();
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const path of ["/", "/prayer", "/connect", "/teachings"]) {
    await page.goto(path);
    await denyAnalytics(page);
    await page.evaluate(() => { document.documentElement.style.zoom = "4"; });
    await expectNoHorizontalOverflow(page);
    await expect(page.locator("main")).toBeVisible();
  }
});

test("increased text spacing and forced colors keep controls visible", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/connect");
  await denyAnalytics(page);
  await page.addStyleTag({ content: `
    * { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; }
    p { margin-bottom: 2em !important; }
  ` });
  await expect(page.getByRole("form", { name: "Monthly field notes" })).toBeVisible();
  await expect(page.getByRole("form", { name: "Contact The Lion Company" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

for (const shot of [
  { name: "home-mobile", path: "/", width: 360, height: 800 },
  { name: "home-desktop", path: "/", width: 1440, height: 900 },
  { name: "prayer-mobile", path: "/prayer", width: 360, height: 800 },
  { name: "connect-desktop", path: "/connect", width: 1440, height: 900 },
] as const) {
  test(`${shot.name} matches the reviewed visual baseline`, async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Canonical visual baselines use Chromium; functional parity runs in all engines.");
    await page.setViewportSize({ width: shot.width, height: shot.height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(shot.path, { waitUntil: "networkidle" });
    await denyAnalytics(page);
    await stabilizeForScreenshot(page);
    await expect(page).toHaveScreenshot(`${shot.name}.png`, {
      animations: "disabled",
      caret: "hide",
      fullPage: true,
      maxDiffPixelRatio: 0.005,
    });
  });
}
```

- [ ] **Step 4: Run the release files and verify the missing helper fails first**

Run: `PLAYWRIGHT_SERVER_COMMAND='npm run start' npm run test:e2e:release -- --project=chromium`

Expected: FAIL with module resolution for `tests/e2e/support/release-helpers.ts`; no snapshots are created by this failing run.

- [ ] **Step 5: Implement the complete browser helper layer**

```ts
// tests/e2e/support/release-helpers.ts
import AxeBuilder from "@axe-core/playwright";
import { expect, type BrowserContext, type Page } from "@playwright/test";

export const RELEASE_VIEWPORTS = [
  { name: "phone", width: 360, height: 800 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

export const INDEXABLE_SMOKE_ROUTES = [
  "/", "/start-here", "/live", "/teachings", "/podcast", "/prayer",
  "/connect", "/store", "/give", "/privacy", "/terms", "/accessibility",
] as const;

export async function seedProtectedDeploymentCookie(context: BrowserContext) {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (!secret) return;
  const configured = process.env.PLAYWRIGHT_BASE_URL;
  if (!configured) throw new Error("PLAYWRIGHT_BASE_URL is required when seeding a deployment-protection cookie");
  const target = new URL(configured);
  if (target.protocol !== "https:" || !target.hostname.endsWith(".vercel.app") || target.username || target.password) {
    throw new Error("deployment-protection cookie target must be the exact HTTPS Vercel deployment origin");
  }
  const seed = new URL("/", target);
  const response = await context.request.get(seed.toString(), {
    maxRedirects: 0,
    failOnStatusCode: false,
    headers: {
      "x-vercel-protection-bypass": secret,
      "x-vercel-set-bypass-cookie": "true",
    },
  });
  if (response.status() !== 200 || response.url() !== seed.toString()) {
    throw new Error(`deployment-protection seed did not return exact-origin 200: ${response.status()}`);
  }
  const cookies = await context.cookies(target.origin);
  const bypass = cookies.find((cookie) => cookie.name === "_vercel_jwt");
  if (!bypass || !bypass.secure || bypass.domain.replace(/^\./, "") !== target.hostname) {
    throw new Error("origin-scoped Vercel bypass cookie was not established");
  }
}

export function collectBrowserLeaks(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.name));
  return { consoleErrors, pageErrors };
}

export async function denyAnalytics(page: Page) {
  const decline = page.getByRole("button", { name: "Decline analytics" });
  if (await decline.isVisible().catch(() => false)) await decline.click();
}

export async function expectNoGa(page: Page, requests: readonly string[]) {
  expect(requests).toEqual([]);
  const cookies = await page.context().cookies();
  expect(cookies.filter((cookie) => cookie.name === "_ga" || cookie.name.startsWith("_ga_"))).toEqual([]);
}

export async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

export async function expectNoBlockingAxeFindings(page: Page) {
  const result = await new AxeBuilder({ page }).analyze();
  const blocking = result.violations.filter((violation) =>
    violation.impact === "critical" || violation.impact === "serious" || violation.impact === "moderate",
  );
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
}

export async function stabilizeForScreenshot(page: Page) {
  await page.addStyleTag({ content: `
    *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }
    [aria-live] { transition: none !important; }
  ` });
  await page.evaluate(async () => {
    await document.fonts.ready;
    scrollTo(0, 0);
  });
  await page.waitForTimeout(200);
}
```

- [ ] **Step 6: Build once and run all three engines across every size and mode**

Run:

```bash
npm test -- --run tests/unit/analytics-consent.test.ts tests/components/analytics-provider.test.tsx
npm run build
PLAYWRIGHT_SERVER_COMMAND='npm run start' npm run test:e2e:release
```

Expected: the unit/component boundary proves exact GA cookie-deletion writes for host and parent domains plus denied/granted/revoked/re-granted cross-tab commands; Chromium, Firefox, and WebKit each execute the 360x800, 768x1024, and 1440x900 loops; functional, consent, storage, reduced-motion, eligible/ineligible media, every-shell giving navigation, exact above-fold Subsplash action at 320/desktop/no-JS, JavaScript-disabled, Axe, zoom, forced-colors, and text-spacing assertions pass. The `@canonical-consent` browser case is intentionally skipped here and runs immediately after promotion, when `.thelioncompany.org` cookies can be created honestly. Visual assertions fail only because reviewed baselines do not exist yet.

- [ ] **Step 7: Generate canonical Chromium baselines in the same pinned Linux image as CI**

Run:

```bash
docker run --rm --ipc=host \
  --mount type=bind,source="$PWD",target=/work \
  --mount type=volume,target=/work/node_modules \
  --mount type=volume,target=/work/.next \
  --workdir /work \
  -e CI=1 -e NODE_ENV=test -e VERCEL_ENV=preview \
  -e NEXT_PUBLIC_SITE_URL=http://localhost:3000 \
  -e NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA \
  -e NEXT_PUBLIC_FORM_MODE=no-send -e FORM_DELIVERY_MODE=no-send \
  -e FORM_ALLOWED_ORIGINS=http://localhost:3000 \
  -e TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA \
  -e TURNSTILE_EXPECTED_HOSTNAMES=localhost \
  -e FORM_IDEMPOTENCY_SECRET=visual-only-idempotency-secret-2026-07-11-not-for-production \
  -e BREVO_CONSENT_VERSION=2026-07-11 \
  mcr.microsoft.com/playwright:v1.61.1-noble \
  bash -lc 'npx --yes n@10.2.0 22.22.3 >/dev/null && hash -r && test "$(node --version)" = v22.22.3 && npm ci && npm run build && PLAYWRIGHT_SERVER_COMMAND="npm run start" npx playwright test tests/e2e/release/accessibility-visual.spec.ts --project=chromium --grep "visual baseline" --update-snapshots'
```

Expected: exactly four `*-chromium-linux.png` files appear under `tests/e2e/release/accessibility-visual.spec.ts-snapshots/`. The rendering OS/browser/font environment matches the required browser job; macOS snapshots are never accepted as Linux baselines. The manual `visual-baselines` workflow is the remote reproduction path and uses the same image without repository write permission.

- [ ] **Step 8: Review every baseline at native resolution and prove CI does not rewrite it**

Run:

```bash
git diff --stat -- tests/e2e/release/accessibility-visual.spec.ts-snapshots
# Re-run the Step 7 container command with the final `--update-snapshots` flag removed.
```

Expected: the reviewer inspects all four full-page images at native resolution for crop, overlap, false live state, unapproved temporary assets, contrast, hierarchy, and mobile safe areas; the second pinned-Linux Playwright run passes without modifying any PNG; `git diff --stat` lists only the four intentional Linux baselines.

- [ ] **Step 9: Complete the named physical-device and assistive-technology matrix**

Against the immutable protected Preview QA deployment, record privacy-safe pass/fail evidence for:

- current iPhone Safari at its native viewport and an iPhone SE-sized Safari viewport;
- current iPad Safari in portrait and landscape;
- the prepared Pixel/Android current stable Chrome device;
- VoiceOver with Safari on Apple hardware; and
- NVDA with current Chrome or Firefox on Windows.

On every device, exercise home scroll/motion and reduced motion, mobile/desktop navigation, dialog focus/close behavior, no pre-intent media, direct external actions, newsletter/prayer/contact validation and retry, consent denied/granted/revoked, 320-pixel-equivalent reflow where applicable, and orientation/zoom without clipped controls. Record device model class, OS/browser/AT versions, viewport/orientation, reviewer role, checked flows, failures, and retest result—never a reviewer name, address, token, filled form value, or account content. A simulator may supplement but never replace the named hardware checks.

Expected: every row passes with no keyboard/touch trap, inaccessible form, clipped landscape control, false live/provider state, consent regression, or unreviewed serious/moderate accessibility issue. Place the redacted matrix and screenshots in the private evidence directory for Task 7's `accessibility-manual` gate.

- [ ] **Step 10: Commit the browser release matrix and reviewed baselines**

```bash
git add tests/e2e/support/release-helpers.ts tests/e2e/release/experience-matrix.spec.ts tests/e2e/release/no-javascript.spec.ts tests/e2e/release/accessibility-visual.spec.ts tests/e2e/release/accessibility-visual.spec.ts-snapshots
git commit -m "test: add cross-browser release matrix"
```

### Task 3: Verify public links, redirects, sitemap, canonical/schema, and browser policy

**Files:**
- Create: `scripts/lib/public-contracts.mjs`
- Create: `scripts/lib/public-contracts.d.mts`
- Create: `scripts/check-public-contracts.mjs`
- Create: `scripts/check-static-media-architecture.mjs`
- Create: `tests/unit/release/public-contracts.test.ts`
- Create: `tests/e2e/release/csp-console.spec.ts`
- Modify: `.github/workflows/quality.yml`

**Interfaces:**
- Consumes: canonical public HTML, `config/routes.ts`, `config/redirects.ts`, `config/security-headers.ts`, `/robots.txt`, `/sitemap.xml`, and the centralized audited destination registry as rendered into real anchors.
- Produces: `assertCanonicalDocument(html, canonical)`, `assertSecurityHeaders(headers, mode)`, `extractSitemapUrls(xml)`, `checkPublicContracts(options)`, a privacy-safe `public-contracts-<mode>.json`, and browser evidence of zero required CSP violations.

- [ ] **Step 1: Write the failing pure public-contract tests**

```ts
// tests/unit/release/public-contracts.test.ts
import { describe, expect, it } from "vitest";
import {
  assertCanonicalDocument,
  assertSecurityHeaders,
  extractSitemapUrls,
} from "../../../scripts/lib/public-contracts.mjs";

const canonical = "https://www.thelioncompany.org/teachings";
const document = `<!doctype html><html lang="en"><head>
  <title>Teachings | The Lion Company</title>
  <meta name="description" content="Jesus-centered teaching for real life.">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="Teachings | The Lion Company">
  <meta property="og:description" content="Jesus-centered teaching for real life.">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="https://www.thelioncompany.org/opengraph-image">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Teachings | The Lion Company">
  <meta name="twitter:description" content="Jesus-centered teaching for real life.">
  <meta name="twitter:image" content="https://www.thelioncompany.org/opengraph-image">
</head><body><main><h1>Teachings</h1><a href="/prayer">Prayer</a>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","url":"${canonical}"}</script>
</main></body></html>`;

describe("public release contracts", () => {
  it("requires one canonical, title, description, h1, and valid JSON-LD", () => {
    expect(assertCanonicalDocument(document, canonical)).toMatchObject({
      canonical,
      h1: "Teachings",
      schemaTypes: ["WebPage"],
    });
    expect(() => assertCanonicalDocument(document.replace("<h1>Teachings</h1>", ""), canonical)).toThrow(/one h1/);
    expect(() => assertCanonicalDocument(document.replace(canonical, `${canonical}?utm=test`), canonical)).toThrow(/canonical/);
    expect(() => assertCanonicalDocument(document.replace(/<script type="application\/ld\+json">.*?<\/script>/s, ""), canonical)).toThrow(/JSON-LD/);
  });

  it("extracts unique canonical sitemap URLs", () => {
    const xml = `<urlset><url><loc>https://www.thelioncompany.org/</loc></url><url><loc>${canonical}</loc></url></urlset>`;
    expect(extractSitemapUrls(xml)).toEqual(["https://www.thelioncompany.org/", canonical]);
  });

  it("distinguishes preview report-only and production enforcement", () => {
    const common = {
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
      "x-frame-options": "DENY",
      "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    };
    expect(() => assertSecurityHeaders(new Headers({
      ...common,
      "content-security-policy-report-only": "default-src 'self'; script-src 'self' 'sha256-test='; connect-src 'self' https://www.google-analytics.com; frame-src https://www.youtube-nocookie.com https://challenges.cloudflare.com",
    }), "preview")).not.toThrow();
    expect(() => assertSecurityHeaders(new Headers({
      ...common,
      "content-security-policy": "default-src 'self'; script-src 'self' 'sha256-test='; connect-src 'self' https://www.google-analytics.com; frame-src https://www.youtube-nocookie.com https://challenges.cloudflare.com",
      "strict-transport-security": "max-age=31536000",
    }), "production")).not.toThrow();
  });
});
```

- [ ] **Step 2: Run the focused test and verify the missing module fails**

Run: `npm test -- tests/unit/release/public-contracts.test.ts`

Expected: FAIL because `scripts/lib/public-contracts.mjs` does not exist.

- [ ] **Step 3: Implement the complete pure and network contract verifier**

```js
// scripts/lib/public-contracts.mjs
import { load } from "cheerio";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export const CANONICAL_ORIGIN = "https://www.thelioncompany.org";
const ALLOWED_SCHEMA_TYPES = new Set([
  "Organization", "WebSite", "WebPage", "VideoObject", "PodcastSeries",
  "PodcastEpisode", "BreadcrumbList", "ListItem",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeCanonicalPath(pathname) {
  return pathname === "/" ? "/" : pathname.replace(/\/$/, "");
}

function schemaTypes(value, types = []) {
  if (Array.isArray(value)) value.forEach((item) => schemaTypes(item, types));
  else if (value && typeof value === "object") {
    if (typeof value["@type"] === "string") types.push(value["@type"]);
    Object.values(value).forEach((item) => schemaTypes(item, types));
  }
  return types;
}

export function assertCanonicalDocument(html, expectedCanonical) {
  const $ = load(html);
  const canonicals = $('link[rel="canonical"]');
  invariant(canonicals.length === 1, `expected one canonical for ${expectedCanonical}`);
  invariant(canonicals.attr("href") === expectedCanonical, `canonical mismatch for ${expectedCanonical}`);
  invariant($("title").first().text().trim().length > 0, `missing title for ${expectedCanonical}`);
  const title = $("title").first().text().trim();
  const description = $('meta[name="description"]').attr("content")?.trim();
  invariant(description, `missing description for ${expectedCanonical}`);
  invariant($("html").attr("lang") === "en", `html lang mismatch for ${expectedCanonical}`);
  invariant($("h1").length === 1, `expected one h1 for ${expectedCanonical}`);
  invariant($("h1").first().text().trim().length > 0, `empty h1 for ${expectedCanonical}`);
  invariant($('meta[property="og:title"]').attr("content")?.trim(), `missing Open Graph title for ${expectedCanonical}`);
  invariant($('meta[property="og:description"]').attr("content")?.trim(), `missing Open Graph description for ${expectedCanonical}`);
  invariant($('meta[property="og:url"]').attr("content") === expectedCanonical, `Open Graph URL mismatch for ${expectedCanonical}`);
  invariant(/^https:\/\//.test($('meta[property="og:image"]').attr("content") ?? ""), `missing absolute Open Graph image for ${expectedCanonical}`);
  invariant($('meta[name="twitter:card"]').attr("content") === "summary_large_image", `Twitter card mismatch for ${expectedCanonical}`);
  invariant($('meta[name="twitter:title"]').attr("content")?.trim(), `missing Twitter title for ${expectedCanonical}`);
  invariant($('meta[name="twitter:description"]').attr("content")?.trim(), `missing Twitter description for ${expectedCanonical}`);
  invariant(/^https:\/\//.test($('meta[name="twitter:image"]').attr("content") ?? ""), `missing absolute Twitter image for ${expectedCanonical}`);
  const schemas = [];
  $('script[type="application/ld+json"]').each((_index, element) => {
    const parsed = JSON.parse($(element).text());
    const serialized = JSON.stringify(parsed);
    invariant(!/aggregateRating|reviewCount|ratingValue/.test(serialized), "unsupported rating schema found");
    schemas.push(...schemaTypes(parsed));
  });
  invariant(schemas.length > 0, `missing JSON-LD for ${expectedCanonical}`);
  invariant(schemas.every((type) => ALLOWED_SCHEMA_TYPES.has(type)), `unsupported JSON-LD type for ${expectedCanonical}`);
  invariant(schemas.includes("WebPage"), `JSON-LD missing WebPage for ${expectedCanonical}`);
  if (expectedCanonical === `${CANONICAL_ORIGIN}/`) {
    for (const type of ["Organization", "WebSite", "WebPage"]) {
      invariant(schemas.includes(type), `home JSON-LD missing ${type}`);
    }
  }
  return {
    canonical: canonicals.attr("href"),
    title,
    description,
    h1: $("h1").first().text().trim(),
    robots: $('meta[name="robots"]').attr("content")?.toLowerCase() ?? "",
    schemaTypes: [...new Set(schemas)],
    anchors: $("a[href]").map((_index, element) => $(element).attr("href")).get(),
  };
}

export function extractSitemapUrls(xml) {
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
  invariant(urls.length > 0, "sitemap has no URLs");
  invariant(new Set(urls).size === urls.length, "sitemap contains duplicate URLs");
  return urls;
}

export function assertSecurityHeaders(headers, mode) {
  for (const [name, value] of [
    ["x-content-type-options", "nosniff"],
    ["referrer-policy", "strict-origin-when-cross-origin"],
    ["x-frame-options", "DENY"],
    ["permissions-policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()"],
  ]) invariant(headers.get(name) === value, `${name} mismatch`);
  const productionPolicy = mode === "staged-production" || mode === "production";
  const cspName = productionPolicy ? "content-security-policy" : "content-security-policy-report-only";
  const csp = headers.get(cspName) ?? "";
  invariant(csp.includes("default-src 'self'"), `${cspName} missing default-src`);
  invariant(csp.includes("'sha256-"), `${cspName} missing generated hash`);
  invariant(csp.includes("https://www.youtube-nocookie.com"), `${cspName} missing YouTube privacy host`);
  invariant(csp.includes("https://challenges.cloudflare.com"), `${cspName} missing Turnstile`);
  invariant(!csp.toLowerCase().includes("brevo"), "Brevo leaked into browser CSP");
  invariant(!/script-src[^;]*'unsafe-inline'/.test(csp), "script unsafe-inline is forbidden");
  invariant(!/(^|\s)\*(\s|;|$)/.test(csp), "CSP wildcard is forbidden");
  if (productionPolicy) {
    invariant(headers.get("strict-transport-security") === "max-age=31536000", "production HSTS mismatch");
    invariant(!headers.has("content-security-policy-report-only"), "production still uses report-only CSP");
  }
}

async function seedProtectionCookie(base, secret) {
  if (!secret) return null;
  invariant(base.protocol === "https:" && base.hostname.endsWith(".vercel.app") && !base.username && !base.password, "protected target must be an exact HTTPS Vercel deployment origin");
  const seed = new URL("/", base);
  const response = await fetch(seed, {
    redirect: "manual",
    signal: AbortSignal.timeout(12_000),
    headers: {
      "x-vercel-protection-bypass": secret,
      "x-vercel-set-bypass-cookie": "true",
    },
  });
  invariant(response.status === 200 && !response.headers.has("location"), `deployment-protection seed returned ${response.status}`);
  const setCookies = response.headers.getSetCookie?.() ?? [response.headers.get("set-cookie")].filter(Boolean);
  const line = setCookies.find((value) => /^_vercel_jwt=/i.test(value));
  const value = line?.match(/^(_vercel_jwt=[^;]+)/i)?.[1];
  invariant(value && /;\s*secure(?:;|$)/i.test(line), "origin-scoped secure Vercel bypass cookie was not returned");
  const domain = line.match(/;\s*domain=([^;]+)/i)?.[1]?.replace(/^\./, "").toLowerCase();
  invariant(!domain || domain === base.hostname, "Vercel bypass cookie escaped the exact deployment host");
  return { origin: base.origin, cookie: value };
}

async function fetchWithPolicy(url, session, init = {}) {
  const target = new URL(url);
  const headers = new Headers(init.headers ?? {});
  if (session) {
    invariant(target.origin === session.origin, "refusing to send a deployment-protection cookie off origin");
    headers.set("cookie", session.cookie);
  }
  return fetch(target, {
    ...init,
    redirect: "manual",
    signal: AbortSignal.timeout(12_000),
    headers,
  });
}

export async function checkPublicContracts(options) {
  const base = new URL(options.baseURL);
  const redirects = options.legacyRouteLedger.filter((route) => route.kind === "redirect");
  const goneRoutes = options.legacyRouteLedger.filter((route) => route.kind === "gone");
  const destinations = options.destinations.filter((destination) => destination.visible);
  const assertions = [];
  const external = new Set();
  const protectedDeployment = (options.mode === "preview" || options.mode === "staged-production") && base.hostname.endsWith(".vercel.app");
  if (protectedDeployment) {
    invariant(options.protectionSecret, "protected immutable deployment requires an automation secret for authenticated checks");
    const challenge = await fetchWithPolicy(new URL("/", base), null);
    invariant([401, 403].includes(challenge.status), `unauthenticated deployment did not return a protection challenge: ${challenge.status}`);
    invariant(challenge.headers.has("x-vercel-id") || challenge.headers.get("server")?.toLowerCase() === "vercel", "unauthenticated challenge is not attributable to Vercel protection");
    assertions.push(`unauthenticated immutable ${options.mode} is blocked by Vercel Deployment Protection`);
  }
  const protectionSession = protectedDeployment ? await seedProtectionCookie(base, options.protectionSecret) : null;
  const root = await fetchWithPolicy(new URL("/", base), protectionSession);
  invariant(root.status === 200, `home returned ${root.status}`);
  assertSecurityHeaders(root.headers, options.mode);
  assertions.push("security headers and CSP match environment");

  const robots = await fetchWithPolicy(new URL("/robots.txt", base), protectionSession);
  invariant(robots.status === 200, `robots returned ${robots.status}`);
  const robotsText = await robots.text();
  if (options.mode === "staged-production" || options.mode === "production") {
    invariant(robotsText.includes("Sitemap: https://www.thelioncompany.org/sitemap.xml"), "production robots lacks sitemap");
    invariant(!robotsText.includes("Disallow: /\n"), "production robots blocks all crawling");
  } else invariant(robotsText.includes("Disallow: /"), "preview robots must block crawling");
  assertions.push("robots policy matches environment");

  const sitemapResponse = await fetchWithPolicy(new URL("/sitemap.xml", base), protectionSession);
  invariant(sitemapResponse.status === 200, `sitemap returned ${sitemapResponse.status}`);
  const sitemapUrls = extractSitemapUrls(await sitemapResponse.text());
  for (const path of options.staticRoutes) {
    const expected = new URL(path, CANONICAL_ORIGIN).toString();
    invariant(sitemapUrls.includes(expected), `sitemap missing ${expected}`);
  }
  for (const slug of options.podcastSlugs) {
    const expected = `${CANONICAL_ORIGIN}/podcast/${slug}`;
    invariant(sitemapUrls.includes(expected), `sitemap missing reviewed podcast route ${expected}`);
  }
  invariant(!sitemapUrls.some((url) => new URL(url).pathname.startsWith("/newsletter/")), "newsletter utility route entered sitemap");

  for (const canonical of sitemapUrls) {
    const url = new URL(canonical);
    invariant(url.origin === CANONICAL_ORIGIN, `noncanonical sitemap host: ${canonical}`);
    invariant(url.search === "" && url.hash === "", `tracking state in sitemap: ${canonical}`);
    invariant(normalizeCanonicalPath(url.pathname) === url.pathname, `trailing slash canonical: ${canonical}`);
    const response = await fetchWithPolicy(new URL(url.pathname, base), protectionSession);
    invariant(response.status === 200, `${url.pathname} returned ${response.status}`);
    const result = assertCanonicalDocument(await response.text(), canonical);
    if (options.mode === "preview") {
      invariant(result.robots.includes("noindex") && result.robots.includes("nofollow"), `${url.pathname} preview HTML is not noindex,nofollow`);
    } else {
      invariant(!result.robots.includes("noindex") && !result.robots.includes("nofollow"), `${url.pathname} production HTML blocks indexing`);
    }
    for (const href of result.anchors) {
      const resolved = new URL(href, CANONICAL_ORIGIN);
      if (resolved.origin !== CANONICAL_ORIGIN) external.add(resolved.toString());
    }
  }
  assertions.push(`${sitemapUrls.length} canonical sitemap documents return semantic 200 HTML`);

  for (const route of redirects) {
    const source = new URL(route.source, base);
    source.searchParams.set("utm_source", "release");
    const response = await fetchWithPolicy(source, protectionSession);
    invariant(response.status === route.statusCode, `${route.source} returned ${response.status}`);
    const locationHeader = response.headers.get("location");
    invariant(locationHeader, `${route.source} omitted Location`);
    const location = new URL(locationHeader, base);
    invariant(location.pathname === route.destination, `${route.source} redirected to ${location.pathname}`);
    if (route.preserveQuery) invariant(location.searchParams.get("utm_source") === "release", `${route.source} dropped query string`);
  }
  for (const route of goneRoutes) {
    const response = await fetchWithPolicy(new URL(route.source, base), protectionSession);
    invariant(response.status === route.statusCode, `${route.source} returned ${response.status}`);
  }
  invariant((await fetchWithPolicy(new URL("/release-never-existed", base), protectionSession)).status === 404, "unknown route is not a real 404");
  invariant((await fetchWithPolicy(new URL("/podcast/release-never-existed", base), protectionSession)).status === 404, "unknown podcast detail is not a real 404");
  assertions.push(`${redirects.length} ledger redirects are one-hop 308; ${goneRoutes.length} ledger artifacts are 410; global and podcast-detail unknowns are 404`);

  for (const destination of destinations) {
    invariant([...external].some((href) => href === destination.href || href.replace(/\/$/, "") === destination.href.replace(/\/$/, "")), `rendered anchors missing visible destination ${destination.key}`);
  }
  const manualChallenges = [];
  if (options.checkExternal) {
    for (const destination of destinations) {
      let response = await fetchWithPolicy(destination.href, null, { method: "HEAD" });
      if (response.status === 405) response = await fetchWithPolicy(destination.href, null, { method: "GET" });
      if ([401, 403, 429].includes(response.status)) {
        manualChallenges.push({ key: destination.key, hostname: new URL(destination.href).hostname, required: destination.required });
        continue;
      }
      invariant(response.status >= 200 && response.status < 400, `${destination.key} returned ${response.status}`);
    }
    assertions.push(`${destinations.length} visible external destinations are reachable or require recorded browser challenge review`);
  } else assertions.push(`${destinations.length} visible external destinations are present as crawlable anchors`);

  const result = {
    schemaVersion: 1,
    gate: `public-contracts-${options.mode}`,
    status: "pass",
    recordedAt: new Date().toISOString(),
    deploymentScope: options.mode === "preview" ? "preview-qa" : options.mode,
    deploymentId: options.deploymentId,
    commitSha: options.commitSha,
    assertions,
    metrics: {
      sitemapRoutes: sitemapUrls.length,
      podcastStaticRoutes: options.podcastSlugs.length,
      redirects: redirects.length,
      goneRoutes: goneRoutes.length,
      visibleDestinations: destinations.length,
      requiredDestinations: destinations.filter((destination) => destination.required).length,
      optionalDestinations: destinations.filter((destination) => !destination.required).length,
      manualChallenges: manualChallenges.length,
    },
    manualChallenges,
  };
  if (options.evidenceDir) {
    await mkdir(options.evidenceDir, { recursive: true });
    await writeFile(resolve(options.evidenceDir, `public-contracts-${options.mode}.json`), `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
  }
  return result;
}
```

```ts
// scripts/lib/public-contracts.d.mts
export type SiteCheckMode = "preview" | "staged-production" | "production";
export type PublicDocumentResult = { canonical: string; title: string; description: string; h1: string; robots: string; schemaTypes: string[]; anchors: string[] };
export function assertCanonicalDocument(html: string, expectedCanonical: string): PublicDocumentResult;
export function extractSitemapUrls(xml: string): string[];
export function assertSecurityHeaders(headers: Headers, mode: SiteCheckMode): void;
export function checkPublicContracts(options: {
  baseURL: string;
  mode: SiteCheckMode;
  deploymentId: string;
  commitSha: string;
  staticRoutes: readonly string[];
  podcastSlugs: readonly string[];
  legacyRouteLedger: readonly (
    | { kind: "redirect"; source: string; destination: string; statusCode: 308; preserveQuery: true }
    | { kind: "gone"; source: string; statusCode: 410; preserveQuery: false }
  )[];
  destinations: readonly { key: string; href: string; required: boolean; visible: boolean }[];
  protectionSecret?: string;
  checkExternal: boolean;
  evidenceDir?: string;
}): Promise<{
  schemaVersion: 1;
  gate: string;
  status: "pass";
  recordedAt: string;
  deploymentScope: "preview-qa" | "staged-production" | "production";
  deploymentId: string;
  commitSha: string;
  assertions: string[];
  metrics: { sitemapRoutes: number; podcastStaticRoutes: number; redirects: number; goneRoutes: number; visibleDestinations: number; requiredDestinations: number; optionalDestinations: number; manualChallenges: number };
  manualChallenges: { key: string; hostname: string; required: boolean }[];
}>;
```

```js
// scripts/check-public-contracts.mjs
import { indexableStaticRoutes } from "../config/routes.ts";
import { legacyRouteLedger } from "../config/redirects.ts";
import { destinationRegistry } from "../content/destinations.ts";
import { getPublishedPodcastEpisodes } from "../lib/media/podcast-feed.ts";
import { checkPublicContracts } from "./lib/public-contracts.mjs";

const required = ["SITE_CHECK_BASE_URL", "SITE_CHECK_MODE", "RELEASE_DEPLOYMENT_ID", "RELEASE_COMMIT_SHA"];
for (const name of required) if (!process.env[name]) throw new Error(`${name} is required`);
if (!new Set(["preview", "staged-production", "production"]).has(process.env.SITE_CHECK_MODE)) throw new Error("SITE_CHECK_MODE must be preview, staged-production, or production");

const result = await checkPublicContracts({
  baseURL: process.env.SITE_CHECK_BASE_URL,
  mode: process.env.SITE_CHECK_MODE,
  deploymentId: process.env.RELEASE_DEPLOYMENT_ID,
  commitSha: process.env.RELEASE_COMMIT_SHA,
  staticRoutes: indexableStaticRoutes,
  podcastSlugs: getPublishedPodcastEpisodes().map((episode) => episode.slug),
  legacyRouteLedger,
  destinations: destinationRegistry,
  protectionSecret: process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
  checkExternal: process.env.SITE_CHECK_EXTERNAL === "1",
  evidenceDir: process.env.RELEASE_EVIDENCE_DIR,
});
console.log(JSON.stringify({ status: result.status, assertions: result.assertions.length, metrics: result.metrics }));
```

```js
// scripts/check-static-media-architecture.mjs
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getPublishedPodcastEpisodes } from "../lib/media/podcast-feed.ts";

const invariant = (condition, message) => { if (!condition) throw new Error(message); };
const episodes = getPublishedPodcastEpisodes();
invariant(episodes.length > 0, "published podcast snapshot is empty");
const manifest = JSON.parse(await readFile(resolve(".next/prerender-manifest.json"), "utf8"));
const prerendered = new Set(Object.keys(manifest.routes ?? {}));
for (const episode of episodes) {
  invariant(prerendered.has(`/podcast/${episode.slug}`), `podcast slug is not prerendered: ${episode.slug}`);
}

const detailSource = await readFile(resolve("app/podcast/[slug]/page.tsx"), "utf8");
invariant(/from\s+["']next\/navigation["']/.test(detailSource) && /\bnotFound\b/.test(detailSource), "podcast detail does not import notFound");
invariant(/if\s*\(\s*!episode\s*\)\s*notFound\s*\(\s*\)/.test(detailSource), "podcast detail does not reject an unknown episode");

const offenders = [];
async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await scan(path);
    else if (/\.[cm]?[jt]sx?$/.test(entry.name) && (await readFile(path, "utf8")).includes("fetchPodcastFeedForRefresh")) offenders.push(path);
  }
}
for (const directory of [resolve("app"), resolve("components")]) await scan(directory);
invariant(offenders.length === 0, "runtime app/components import fetchPodcastFeedForRefresh");

const result = {
  schemaVersion: 1,
  gate: "static-media-architecture",
  status: "pass",
  recordedAt: new Date().toISOString(),
  deploymentScope: process.env.RELEASE_DEPLOYMENT_SCOPE ?? "local",
  deploymentId: process.env.RELEASE_DEPLOYMENT_ID ?? "local-production-build",
  commitSha: process.env.RELEASE_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "local",
  assertions: ["every reviewed podcast slug is prerendered", "unknown podcast detail invokes notFound and remote HTTP returns 404", "runtime UI cannot import network podcast refresh"],
  metrics: { publishedPodcastEpisodes: episodes.length, prerenderedPodcastEpisodes: episodes.length, runtimeRefreshImports: 0 },
};
const outputDirectory = resolve(process.env.RELEASE_EVIDENCE_DIR ?? "test-results");
await mkdir(outputDirectory, { recursive: true, mode: 0o700 });
await writeFile(resolve(outputDirectory, "static-media-architecture.json"), `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({ status: "pass", metrics: result.metrics }));
```

Append this immediately after `npm run build` in the `quality / static` job:

```yaml
      - run: npm run check:static-media
```

- [ ] **Step 4: Add the browser CSP and console audit**

```ts
// tests/e2e/release/csp-console.spec.ts
import { expect, test } from "@playwright/test";
import { INDEXABLE_SMOKE_ROUTES, seedProtectedDeploymentCookie, denyAnalytics } from "../support/release-helpers";

test.beforeEach(async ({ context }) => seedProtectedDeploymentCookie(context));

test("required routes emit no CSP violation, uncaught error, or failed first-party request", async ({ page }) => {
  const cspViolations: string[] = [];
  await page.exposeFunction("__recordReleaseCspViolation", (value: string) => cspViolations.push(value));
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) => {
      void (window as typeof window & { __recordReleaseCspViolation(value: string): Promise<void> })
        .__recordReleaseCspViolation(`${event.effectiveDirective}:${event.blockedURI}`);
    });
  });
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedFirstParty: string[] = [];
  const baseURL = test.info().project.use.baseURL;
  if (!baseURL) throw new Error("Playwright baseURL is required");
  const baseOrigin = new URL(baseURL).origin;
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => pageErrors.push(error.name));
  page.on("requestfailed", (request) => {
    if (new URL(request.url()).origin === baseOrigin) failedFirstParty.push(request.url());
  });
  for (const path of INDEXABLE_SMOKE_ROUTES) {
    await page.goto(path, { waitUntil: "networkidle" });
    await denyAnalytics(page);
  }
  expect(cspViolations).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedFirstParty).toEqual([]);
});
```

- [ ] **Step 5: Run the pure evaluator and local preview policy**

Run:

```bash
npm test -- tests/unit/release/public-contracts.test.ts
npm run build
npm run check:static-media
RELEASE_DEPLOYMENT_ID=local-production-build RELEASE_COMMIT_SHA="$(git rev-parse HEAD)" SITE_CHECK_BASE_URL=http://127.0.0.1:3000 SITE_CHECK_MODE=preview sh -c 'npm run start > /tmp/tlc-release-server.log 2>&1 & server=$!; trap "kill $server" EXIT; npx wait-on http://127.0.0.1:3000; npm run check:public'
PLAYWRIGHT_SERVER_COMMAND='npm run start' npx playwright test tests/e2e/release/csp-console.spec.ts --project=chromium
```

Expected: unit tests pass; every reviewed podcast episode is in the prerender manifest, the detail source uses `notFound`, and no runtime UI imports the network refresh function; the HTTP runner reports `status:"pass"`, every authoritative podcast URL is in the sitemap, unknown podcast detail is a real 404, every sitemap route and legacy outcome is checked, preview robots block crawling, every live preview document is `noindex,nofollow`, report-only CSP has zero required violation, and browser console/request arrays remain empty. The local target skips the Vercel challenge assertion; the immutable `.vercel.app` run must additionally fail unauthenticated with a Vercel protection challenge and pass only with the automation header.

- [ ] **Step 6: Run every visible external destination from the protected immutable preview**

Run:

```bash
SITE_CHECK_BASE_URL="$PREVIEW_QA_IMMUTABLE_URL" SITE_CHECK_MODE=preview SITE_CHECK_EXTERNAL=1 RELEASE_DEPLOYMENT_ID="$PREVIEW_QA_DEPLOYMENT_ID" RELEASE_COMMIT_SHA="$RELEASE_COMMIT_SHA" RELEASE_EVIDENCE_DIR="$RELEASE_EVIDENCE_DIR/preview-qa" VERCEL_AUTOMATION_BYPASS_SECRET="$VERCEL_AUTOMATION_BYPASS_SECRET" npm run check:public
```

Expected: the current centralized registry, not a copied list, supplies every visible required and optional destination. Every visible destination has a rendered anchor and returns `200`–`399`; a `401`, `403`, or `429` anti-bot challenge is allowed only when that exact host is opened successfully in a real browser and recorded in the `external-destinations` manual gate before promotion. `404`, `410`, and `5xx` always fail. A dead optional destination is hidden through the owning content plan before rerunning; it is never waved through as “optional.” Evidence stores keys and challenge hostnames without IPs, cookies, response bodies, or account content.

- [ ] **Step 7: Commit the public contract layer**

```bash
git add package.json package-lock.json .github/workflows/quality.yml scripts/lib/public-contracts.mjs scripts/lib/public-contracts.d.mts scripts/check-public-contracts.mjs scripts/check-static-media-architecture.mjs tests/unit/release/public-contracts.test.ts tests/e2e/release/csp-console.spec.ts
git commit -m "test: verify public SEO and security contracts"
```

### Task 4: Soak protected-preview forms and prove PII isolation and retention

**Files:**
- Modify: `scripts/form-preview-soak.mjs`
- Create: `scripts/brevo-doi-lifecycle.mjs`
- Create: `scripts/submit-pii-canaries.mjs`
- Create: `scripts/check-pii-canaries.mjs`
- Create: `config/retention-evidence.schema.json`
- Create: `scripts/lib/retention-evidence.mjs`
- Create: `scripts/lib/retention-evidence.d.mts`
- Create: `scripts/validate-retention-evidence.mjs`
- Create: `tests/unit/release/retention-evidence.test.ts`
- Create: `tests/e2e/release/privacy-leaks.spec.ts`
- Create: `docs/operations/release-form-soak.md`

**Interfaces:**
- Consumes: `POST /api/forms/newsletter`, `POST /api/forms/prayer`, `POST /api/forms/contact`, privacy-safe `FormSubmitResult`, Vercel Deployment Protection, preview-only WAF exception, Turnstile test key/token, isolated preview Brevo/Redis resources, and the forms plan's operating runbooks.
- Produces: one form runner with `volume`, `rate-limit`, and `outage` modes; an isolated phased Brevo DOI lifecycle runner; aggregate-only soak/DOI evidence; `validateRetentionEvidence(record, baseDirectory)`; a runtime-canary scanner; and proof that no 429 reaches the provider, no outage returns false success, DOI privacy/membership/recovery/suppression/purge are real, no browser/analytics/storage surface receives form data, and every exact retention control has current evidence.

- [ ] **Step 1: Write the failing retention and privacy-boundary tests**

```ts
// tests/unit/release/retention-evidence.test.ts
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { validateRetentionEvidence } from "../../../scripts/lib/retention-evidence.mjs";

function sha(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "tlc-retention-"));
  writeFileSync(join(directory, "mailbox-rule.txt"), "restricted screenshot sha fixture");
  return {
    directory,
    record: {
      schemaVersion: 1,
      completedAt: "2026-07-11T12:00:00.000Z",
      ownerRoles: { dataStewardConfirmed: true, mailboxAdministratorConfirmed: true, mfaConfirmed: true },
      mailbox: {
        prayerDeletionDays: 90,
        activeFollowUpReviewDays: 30,
        activeFollowUpMaxMonths: 12,
        activeFollowUpCloseDeletionDays: 30,
        contactDeletionMonthsAfterResolution: 12,
        unresolvedContactQuarterlyReview: true,
        autoForwardingDisabled: true,
        localArchivesDisabled: true,
      },
      brevo: { pendingDoiPurgeDays: 30, transactionalLogRetentionDays: 30, messagePreviewsDisabled: true, unsubscribeSuppressionEnabled: true },
      redis: { processingLockSeconds: 300, acceptedTtlSeconds: 86400, backupsDisabled: true, exportsDisabled: true, tlsRequired: true },
      syntheticDeletion: {
        prayerProviderIdSha256: sha("prayer-provider-id"),
        contactProviderIdSha256: sha("contact-provider-id"),
        completedAt: "2026-07-11T12:30:00.000Z",
        outcome: "deleted",
      },
      evidenceFiles: [{ path: "mailbox-rule.txt", sha256: sha("restricted screenshot sha fixture") }],
    },
  };
}

describe("retention evidence", () => {
  it("accepts the exact policy constants and attachment hashes", async () => {
    const value = fixture();
    await expect(validateRetentionEvidence(value.record, value.directory)).resolves.toMatchObject({ status: "pass" });
  });

  it("rejects weaker retention, missing ownership, raw identifiers, and changed evidence", async () => {
    const value = fixture();
    await expect(validateRetentionEvidence({ ...value.record, mailbox: { ...value.record.mailbox, prayerDeletionDays: 120 } }, value.directory)).rejects.toThrow();
    await expect(validateRetentionEvidence({ ...value.record, ownerRoles: { ...value.record.ownerRoles, mfaConfirmed: false } }, value.directory)).rejects.toThrow();
    await expect(validateRetentionEvidence({ ...value.record, syntheticDeletion: { ...value.record.syntheticDeletion, prayerProviderIdSha256: "raw-provider-id" } }, value.directory)).rejects.toThrow();
    writeFileSync(join(value.directory, "mailbox-rule.txt"), "changed");
    await expect(validateRetentionEvidence(value.record, value.directory)).rejects.toThrow(/hash mismatch/);
  });
});
```

```ts
// tests/e2e/release/privacy-leaks.spec.ts
import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { seedProtectedDeploymentCookie } from "../support/release-helpers";

test.beforeEach(async ({ context }) => seedProtectedDeploymentCookie(context));

function runtimeCanaries() {
  if (process.env.PII_CANARIES_B64) {
    const values = JSON.parse(Buffer.from(process.env.PII_CANARIES_B64, "base64url").toString("utf8"));
    if (Array.isArray(values) && values.length === 4 && values.every((value) => typeof value === "string" && value.length >= 12)) {
      return { prayer: values[0], contact: values[1], email: values[2], name: values[3] };
    }
    throw new Error("PII_CANARIES_B64 must encode exactly four strings of 12 or more characters");
  }
  const nonce = randomUUID();
  return {
    prayer: `SYNTHETIC-PRAYER-${nonce}`,
    contact: `SYNTHETIC-CONTACT-${nonce}`,
    email: `tlc-release-${nonce}@example.org`,
    name: `Synthetic Person ${nonce}`,
  };
}
const canary = runtimeCanaries();

test("form canaries never reach URL, browser storage, cookie, console, or third-party body", async ({ page }) => {
  const consoleText: string[] = [];
  const thirdPartyBodies: string[] = [];
  page.on("console", (message) => consoleText.push(message.text()));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== new URL(page.url()).origin) thirdPartyBodies.push(request.postData() ?? "");
  });
  await page.route("**/api/forms/prayer", (route) => route.fulfill({
    status: 202,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, status: "accepted", submissionId: crypto.randomUUID(), deliveryMode: "no-send", replayed: false, message: "Preview test accepted — no message was sent." }),
  }));
  await page.goto("/prayer");
  await page.evaluate(async (value) => {
    await fetch("/api/forms/prayer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        submissionId: crypto.randomUUID(), displayName: value.name, email: value.email,
        request: value.prayer, followUpRequested: true, turnstileToken: "synthetic-test-token", website: "",
      }),
    });
  }, canary);
  const browserState = await page.evaluate(() => JSON.stringify({
    localStorage: { ...localStorage }, sessionStorage: { ...sessionStorage }, url: location.href, cookie: document.cookie,
  }));
  for (const value of Object.values(canary)) {
    expect(browserState).not.toContain(value);
    expect(consoleText.join("\n")).not.toContain(value);
    expect(thirdPartyBodies.join("\n")).not.toContain(value);
  }
});

test("offline, timeout, and provider outage retain typed text and never announce success", async ({ page, context }) => {
  await page.goto("/prayer");
  const request = page.getByLabel("Prayer request");
  await request.fill(canary.prayer);
  await page.getByRole("button", { name: /send private request/i }).evaluate((button) => { (button as HTMLButtonElement).disabled = false; });

  await context.setOffline(true);
  await page.getByRole("button", { name: /send private request/i }).click();
  await expect(page.getByRole("alert")).toContainText(/network|connection/i);
  await expect(request).toHaveValue(canary.prayer);
  await context.setOffline(false);

  const timeoutHandler = (route: import("@playwright/test").Route) => route.abort("timedout");
  await page.route("**/api/forms/prayer", timeoutHandler);
  await page.getByRole("button", { name: /send private request/i }).evaluate((button) => { (button as HTMLButtonElement).disabled = false; });
  await page.getByRole("button", { name: /send private request/i }).click();
  await expect(page.getByRole("alert")).toContainText(/network|connection/i);
  await expect(request).toHaveValue(canary.prayer);
  await page.unroute("**/api/forms/prayer", timeoutHandler);

  await page.route("**/api/forms/prayer", async (route) => {
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({
      ok: false, status: "error", code: "provider_unavailable", retryable: true,
      message: "We could not deliver this right now. Your text is still here; please try again.",
    }) });
  });
  await page.getByRole("button", { name: /send private request/i }).evaluate((button) => { (button as HTMLButtonElement).disabled = false; });
  await page.getByRole("button", { name: /send private request/i }).click();
  await expect(page.getByRole("alert")).toContainText(/could not deliver/i);
  await expect(request).toHaveValue(canary.prayer);
  await expect(page.getByText(/was delivered/i)).toHaveCount(0);
});
```

- [ ] **Step 2: Run the focused tests and verify the missing validator fails**

Run: `npm test -- tests/unit/release/retention-evidence.test.ts && PLAYWRIGHT_SERVER_COMMAND='npm run start' npx playwright test tests/e2e/release/privacy-leaks.spec.ts --project=chromium`

Expected: Vitest fails on the missing retention module; the browser test is not accepted as a substitute for that failure.

- [ ] **Step 3: Replace the preview soak with explicit volume, rate-limit, and outage modes**

```js
// scripts/form-preview-soak.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { resolve } from "node:path";

const required = [
  "FORM_SOAK_TARGET_URL", "FORM_SOAK_TURNSTILE_TOKEN", "FORM_SOAK_NEWSLETTER_EMAIL",
  "FORM_SOAK_MODE", "RELEASE_DEPLOYMENT_ID", "RELEASE_COMMIT_SHA",
];
for (const name of required) if (!process.env[name]) throw new Error(`${name} is required`);
const mode = process.env.FORM_SOAK_MODE;
if (!new Set(["volume", "rate-limit", "outage"]).has(mode)) throw new Error("FORM_SOAK_MODE must be volume, rate-limit, or outage");
const target = new URL(process.env.FORM_SOAK_TARGET_URL);
if (!target.hostname.endsWith(".vercel.app")) throw new Error("form soak target must be an immutable Vercel preview URL");
const protectionSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
if (!protectionSecret) throw new Error("VERCEL_AUTOMATION_BYPASS_SECRET is required for deployment-protected preview testing");
const seed = await fetch(new URL("/", target), {
  redirect: "manual",
  signal: AbortSignal.timeout(12_000),
  headers: {
    "x-vercel-protection-bypass": protectionSecret,
    "x-vercel-set-bypass-cookie": "true",
  },
});
if (seed.status !== 200 || seed.headers.has("location")) throw new Error(`deployment-protection seed returned ${seed.status}`);
const setCookies = seed.headers.getSetCookie?.() ?? [seed.headers.get("set-cookie")].filter(Boolean);
const protectionCookie = setCookies.find((value) => /^_vercel_jwt=/i.test(value))?.match(/^(_vercel_jwt=[^;]+)/i)?.[1];
if (!protectionCookie) throw new Error("origin-scoped Vercel bypass cookie was not returned");
const token = process.env.FORM_SOAK_TURNSTILE_TOKEN;
const newsletterAddress = process.env.FORM_SOAK_NEWSLETTER_EMAIL;
const latencies = [];
const statuses = new Map();
let attempted = 0;

function headers(origin = target.origin) {
  return {
    "content-type": "application/json",
    origin,
    cookie: protectionCookie,
  };
}

function payload(endpoint, index, submissionId = crypto.randomUUID()) {
  const shared = { submissionId, turnstileToken: token, website: "" };
  if (endpoint === "newsletter") {
    const split = newsletterAddress.lastIndexOf("@");
    return { ...shared, email: `${newsletterAddress.slice(0, split)}+soak-${index}${newsletterAddress.slice(split)}`, consent: true, placement: "connect" };
  }
  if (endpoint === "prayer") return {
    ...shared, displayName: "Synthetic Test", email: "",
    request: `Synthetic non-sensitive prayer delivery test number ${index}.`, followUpRequested: false,
  };
  return {
    ...shared, name: "Synthetic Test", email: newsletterAddress, reason: "general",
    message: `Synthetic non-sensitive contact delivery test number ${index}.`,
  };
}

async function send(endpoint, body, expected) {
  const started = performance.now();
  attempted += 1;
  const response = await fetch(new URL(`/api/forms/${endpoint}`, target), {
    method: "POST", headers: headers(), body: JSON.stringify(body), redirect: "manual", signal: AbortSignal.timeout(12_000),
  });
  latencies.push(performance.now() - started);
  statuses.set(response.status, (statuses.get(response.status) ?? 0) + 1);
  if (!expected.includes(response.status)) throw new Error(`${endpoint} returned ${response.status}; expected ${expected.join(" or ")}`);
  const result = await response.json().catch(() => null);
  if (response.status === 202 && (!result?.ok || result.status !== "accepted")) throw new Error(`${endpoint} returned malformed acceptance`);
  if (response.status >= 400 && result?.ok) throw new Error(`${endpoint} returned false success`);
  return { response, result };
}

async function sendRaw(endpoint, init, expectedStatus) {
  const started = performance.now();
  attempted += 1;
  const { origin = target.origin, headers: caseHeaders = {}, ...requestInit } = init;
  const response = await fetch(new URL(`/api/forms/${endpoint}`, target), {
    ...requestInit,
    headers: { ...headers(origin), ...caseHeaders },
    redirect: "manual",
    signal: AbortSignal.timeout(12_000),
  });
  latencies.push(performance.now() - started);
  statuses.set(response.status, (statuses.get(response.status) ?? 0) + 1);
  if (response.status !== expectedStatus) throw new Error(`${endpoint} raw case returned ${response.status}; expected ${expectedStatus}`);
}

async function volume() {
  const expiry = Date.parse(process.env.FORM_SOAK_WAF_EXCEPTION_EXPIRES_AT ?? "");
  if (!Number.isFinite(expiry) || expiry <= Date.now() || expiry > Date.now() + 2 * 60 * 60 * 1000) {
    throw new Error("volume mode requires a source-bound preview WAF exception expiring within two hours");
  }
  for (const endpoint of ["newsletter", "prayer", "contact"]) {
    for (let index = 1; index <= 25; index += 1) await send(endpoint, payload(endpoint, index), [202]);
    await Promise.all(Array.from({ length: 10 }, (_unused, index) => send(endpoint, payload(endpoint, 100 + index), [202])));
    const repeatedId = crypto.randomUUID();
    const repeated = await Promise.all(Array.from({ length: 10 }, (_unused, index) =>
      send(endpoint, payload(endpoint, 200 + index, repeatedId), [202, 409])));
    if (repeated.filter((item) => item.response.status === 202).length < 1) throw new Error(`${endpoint} repeated-ID run had no accepted owner/replay`);
    const replay = await send(endpoint, payload(endpoint, 300, repeatedId), [202]);
    if (!replay.result.replayed) throw new Error(`${endpoint} final repeated-ID request was not replayed`);
  }
  await send("contact", { ...payload("contact", 400), website: "bot-filled" }, [400]);
  await send("contact", { ...payload("contact", 401), message: "short" }, [422]);
  await send("contact", { ...payload("contact", 402), turnstileToken: "invalid-token" }, [400]);
  await send("contact", { ...payload("contact", 403), message: "Synthetic <script>alert('x')</script> & CRLF\r\nBcc: test@example.org content." }, [202]);
  await sendRaw("contact", { method: "POST", headers: { "content-type": "text/plain" }, body: "not json" }, 415);
  await sendRaw("contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payload("contact", 404), message: "x".repeat(16_385) }) }, 413);
  await sendRaw("contact", { method: "POST", origin: "https://cross-origin.example.org", headers: { "content-type": "application/json" }, body: JSON.stringify(payload("contact", 405)) }, 403);
}

let rateLimitEndpoint = null;
async function rateLimit() {
  if (process.env.FORM_SOAK_WAF_EXCEPTION_EXPIRES_AT) throw new Error("rate-limit mode forbids the volume WAF exception");
  const endpoint = process.env.FORM_RATE_LIMIT_ENDPOINT;
  if (!new Set(["newsletter", "prayer", "contact"]).has(endpoint)) throw new Error("FORM_RATE_LIMIT_ENDPOINT is required");
  rateLimitEndpoint = endpoint;
  const allowed = endpoint === "newsletter" ? 10 : 5;
  for (let index = 1; index <= allowed; index += 1) await send(endpoint, payload(endpoint, 500 + index), [202]);
  const blocked = await send(endpoint, payload(endpoint, 600), [429]);
  if (blocked.result?.ok) throw new Error("WAF 429 contained success");
}

async function outage() {
  if (process.env.FORM_SOAK_WAF_EXCEPTION_EXPIRES_AT) throw new Error("outage mode forbids the volume WAF exception");
  for (const endpoint of ["newsletter", "prayer", "contact"]) {
    const result = await send(endpoint, payload(endpoint, 700), [503]);
    if (result.result?.code !== "provider_unavailable") throw new Error(`${endpoint} outage did not map to provider_unavailable`);
  }
}

await ({ volume, "rate-limit": rateLimit, outage })[mode]();
latencies.sort((a, b) => a - b);
const p95 = latencies[Math.ceil(latencies.length * 0.95) - 1] ?? 0;
if (mode === "volume" && p95 >= 2_500) throw new Error(`p95 ${Math.round(p95)}ms exceeds 2500ms`);
const runKey = mode === "rate-limit" ? `rate-limit-${rateLimitEndpoint}` : mode;
const evidence = {
  schemaVersion: 1,
  gate: `form-soak-${runKey}-run`,
  status: "pass",
  recordedAt: new Date().toISOString(),
  deploymentScope: "preview-qa",
  deploymentId: process.env.RELEASE_DEPLOYMENT_ID,
  commitSha: process.env.RELEASE_COMMIT_SHA,
  assertions: mode === "volume"
    ? ["25 valid submissions per form accepted", "10 concurrent unique submissions per form accepted", "repeated IDs replay without normal-response duplicate", "invalid and injected cases return safe outcomes", "p95 below 2500ms"]
    : mode === "rate-limit"
      ? ["production-equivalent WAF threshold returns 429 without application bypass"]
      : ["provider outage returns 503 and never false success"],
  metrics: { attempted, p95Ms: Math.round(p95), statuses: Object.fromEntries([...statuses].sort((a, b) => a[0] - b[0])) },
};
if (process.env.RELEASE_EVIDENCE_DIR) {
  await mkdir(process.env.RELEASE_EVIDENCE_DIR, { recursive: true });
  await writeFile(resolve(process.env.RELEASE_EVIDENCE_DIR, `form-soak-${runKey}-run.json`), `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });
}
console.log(JSON.stringify({ status: "pass", mode, attempted, p95Ms: Math.round(p95), statuses: evidence.metrics.statuses }));
```

- [ ] **Step 4: Add the isolated Brevo DOI lifecycle runner**

```js
// scripts/brevo-doi-lifecycle.mjs
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const required = [
  "BREVO_DOI_ACTION", "BREVO_API_KEY", "BREVO_DOI_CONFIRMED_LIST_ID",
  "BREVO_DOI_STATE_PATH", "BREVO_DOI_TARGET_URL", "VERCEL_AUTOMATION_BYPASS_SECRET",
  "RELEASE_EVIDENCE_DIR", "RELEASE_DEPLOYMENT_ID", "RELEASE_COMMIT_SHA",
];
for (const name of required) if (!process.env[name]) throw new Error(`${name} is required`);
const action = process.env.BREVO_DOI_ACTION;
const actions = new Set(["request", "confirm", "expired", "unsubscribe", "purge-before", "purge-after", "finalize"]);
if (!actions.has(action)) throw new Error("invalid BREVO_DOI_ACTION");
const evidenceRoot = resolve(process.env.RELEASE_EVIDENCE_DIR);
const phaseRoot = resolve(evidenceRoot, "brevo-doi");
const statePath = resolve(process.env.BREVO_DOI_STATE_PATH);
if (statePath === evidenceRoot || statePath.startsWith(`${evidenceRoot}/`)) throw new Error("raw DOI state must stay outside release evidence");
const listId = Number(process.env.BREVO_DOI_CONFIRMED_LIST_ID);
if (!Number.isInteger(listId) || listId <= 0) throw new Error("BREVO_DOI_CONFIRMED_LIST_ID must be positive");
const target = new URL(process.env.BREVO_DOI_TARGET_URL);
if (target.protocol !== "https:" || !target.hostname.endsWith(".vercel.app")) throw new Error("DOI target must be the immutable HTTPS preview");
const invariant = (condition, message) => { if (!condition) throw new Error(message); };
const sha = (value) => createHash("sha256").update(value).digest("hex");
const protectionSeed = await fetch(new URL("/", target), {
  redirect: "manual",
  signal: AbortSignal.timeout(12_000),
  headers: {
    "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
    "x-vercel-set-bypass-cookie": "true",
  },
});
invariant(protectionSeed.status === 200 && !protectionSeed.headers.has("location"), `deployment-protection seed returned ${protectionSeed.status}`);
const protectionSetCookies = protectionSeed.headers.getSetCookie?.() ?? [protectionSeed.headers.get("set-cookie")].filter(Boolean);
const protectionCookie = protectionSetCookies.find((value) => /^_vercel_jwt=/i.test(value))?.match(/^(_vercel_jwt=[^;]+)/i)?.[1];
invariant(protectionCookie, "origin-scoped Vercel bypass cookie was not returned");

async function secretFile(name) {
  const path = resolve(process.env[name] ?? "");
  invariant(process.env[name] && !path.startsWith(`${evidenceRoot}/`), `${name} must be a restricted file outside evidence`);
  return (await readFile(path, "utf8")).trim();
}

async function state() {
  return JSON.parse(await readFile(statePath, "utf8"));
}

async function saveState(value) {
  await mkdir(resolve(statePath, ".."), { recursive: true, mode: 0o700 });
  await writeFile(statePath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
}

async function brevoContact(email) {
  const response = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
    headers: { accept: "application/json", "api-key": process.env.BREVO_API_KEY },
    signal: AbortSignal.timeout(12_000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Brevo contact lookup returned ${response.status}`);
  return response.json();
}

async function waitForContact(email, predicate, label) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const contact = await brevoContact(email);
    if (predicate(contact)) return contact;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 2500));
  }
  throw new Error(`Brevo state did not reach ${label}`);
}

async function submitNewsletter(email) {
  for (const name of ["BREVO_DOI_TURNSTILE_TOKEN"]) {
    if (!process.env[name]) throw new Error(`${name} is required for request action`);
  }
  const response = await fetch(new URL("/api/forms/newsletter", target), {
    method: "POST",
    headers: {
      "content-type": "application/json", origin: target.origin,
      cookie: protectionCookie,
    },
    body: JSON.stringify({
      submissionId: crypto.randomUUID(), email, firstName: "Synthetic DOI Test", consent: true,
      placement: "connect", turnstileToken: process.env.BREVO_DOI_TURNSTILE_TOKEN, website: "",
    }),
    redirect: "manual",
    signal: AbortSignal.timeout(12_000),
  });
  const body = await response.json().catch(() => null);
  invariant(response.status === 202 && body?.ok && body.deliveryMode === "test-recipient", "isolated DOI request was not safely accepted");
  invariant(!/(already|pending|confirmed|member|exists)/i.test(body.message ?? ""), "DOI response leaks membership state");
  return { httpStatus: response.status, ok: body.ok, status: body.status, deliveryMode: body.deliveryMode, message: body.message };
}

async function followSecretURL(fileName, expectedPath) {
  let current = new URL(await secretFile(fileName));
  invariant(current.protocol === "https:", `${fileName} must contain an HTTPS URL`);
  for (let hop = 0; hop < 8; hop += 1) {
    const response = await fetch(current, {
      redirect: "manual",
      headers: current.origin === target.origin ? { cookie: protectionCookie } : {},
      signal: AbortSignal.timeout(12_000),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      invariant(location, "DOI redirect omitted Location");
      current = new URL(location, current);
      continue;
    }
    invariant(response.status === 200, `DOI outcome returned ${response.status}`);
    invariant(current.origin === target.origin && current.pathname === expectedPath && !current.search && !current.hash, `DOI outcome did not end at the bound preview ${expectedPath}`);
    return response.text();
  }
  throw new Error("DOI outcome exceeded seven redirects");
}

async function writePhase(name, assertions, metrics) {
  await mkdir(phaseRoot, { recursive: true, mode: 0o700 });
  const record = {
    schemaVersion: 1, gate: `brevo-doi-${name}`, status: "pass", recordedAt: new Date().toISOString(),
    deploymentScope: "preview-qa", deploymentId: process.env.RELEASE_DEPLOYMENT_ID, commitSha: process.env.RELEASE_COMMIT_SHA,
    assertions, metrics,
  };
  await writeFile(resolve(phaseRoot, `${name}.json`), `${JSON.stringify(record, null, 2)}\n`, { mode: 0o600 });
}

if (action === "request") {
  const email = await secretFile("BREVO_DOI_TEST_RECIPIENT_FILE");
  invariant((await brevoContact(email)) === null, "fresh DOI recipient already exists; do not auto-delete it");
  const first = await submitNewsletter(email);
  const duplicate = await submitNewsletter(email);
  invariant(JSON.stringify(first) === JSON.stringify(duplicate), "new and duplicate/pending public DOI responses differ");
  const contact = await waitForContact(email, (value) => value && !value.listIds?.includes(listId), "pending and outside confirmed list");
  await saveState({ email, providerContactIdSha256: sha(String(contact.id)), requestedAt: new Date().toISOString() });
  await writePhase("request", ["new and duplicate/pending requests return the same privacy-safe 202", "pending contact is outside the confirmed list"], { requests: 2, status202: 2, publicShapesEqual: true, pendingOutsideConfirmedList: true, providerContactIdSha256: sha(String(contact.id)) });
}

if (action === "confirm") {
  const value = await state();
  await followSecretURL("BREVO_DOI_CONFIRM_URL_FILE", "/newsletter/confirmed");
  const contact = await waitForContact(value.email, (item) => item?.listIds?.includes(listId), "confirmed-list membership");
  await writePhase("confirm", ["real DOI link ends at the query-free confirmation route", "provider contact enters the confirmed list"], { confirmedListMembership: true, providerContactIdSha256: sha(String(contact.id)) });
}

if (action === "expired") {
  const html = await followSecretURL("BREVO_DOI_EXPIRED_URL_FILE", "/newsletter/expired");
  invariant(/invalid or expired/i.test(html) && /<form\b/i.test(html), "expired route lacks recovery form");
  await writePhase("expired", ["expired real DOI link ends at the query-free recovery route", "recovery page renders a fresh DOI form"], { recoveryForm: true });
}

if (action === "unsubscribe") {
  const value = await state();
  await followSecretURL("BREVO_DOI_UNSUBSCRIBE_URL_FILE", "/newsletter/unsubscribed");
  const contact = await waitForContact(value.email, (item) => item?.emailBlacklisted === true && !item.listIds?.includes(listId), "unsubscribe suppression");
  await writePhase("unsubscribe", ["provider-managed unsubscribe ends at the query-free outcome route", "contact leaves the confirmed list and remains suppressed"], { emailBlacklisted: true, confirmedListMembership: false, providerContactIdSha256: sha(String(contact.id)) });
}

if (action === "purge-before") {
  const value = await state();
  const oldEmail = await secretFile("BREVO_PURGE_OLD_PENDING_EMAIL_FILE");
  const freshEmail = await secretFile("BREVO_PURGE_FRESH_PENDING_EMAIL_FILE");
  const oldContact = await brevoContact(oldEmail);
  const freshContact = await brevoContact(freshEmail);
  invariant(oldContact && freshContact, "purge controls must both exist before automation");
  invariant(!oldContact.listIds?.includes(listId) && !freshContact.listIds?.includes(listId), "purge controls must remain pending");
  const oldAgeDays = (Date.now() - Date.parse(oldContact.createdAt)) / 86400000;
  const freshAgeDays = (Date.now() - Date.parse(freshContact.createdAt)) / 86400000;
  invariant(oldAgeDays >= 30 && freshAgeDays < 30, "purge controls do not straddle the 30-day boundary");
  await saveState({ ...value, purge: { oldEmail, freshEmail, oldProviderIdSha256: sha(String(oldContact.id)), freshProviderIdSha256: sha(String(freshContact.id)) } });
  await writePhase("purge-before", ["pending purge canary is at least 30 days old", "fresh pending control is under 30 days", "neither is confirmed"], { oldAgeAtLeast30Days: true, freshAgeUnder30Days: true });
}

if (action === "purge-after") {
  const value = await state();
  const oldContact = await waitForContact(value.purge.oldEmail, (item) => item === null, "30-day pending deletion");
  const freshContact = await brevoContact(value.purge.freshEmail);
  invariant(oldContact === null && freshContact && sha(String(freshContact.id)) === value.purge.freshProviderIdSha256, "30-day purge deleted the wrong cohort");
  const receiptPath = resolve(process.env.BREVO_PURGE_RUN_RECEIPT_PATH ?? "");
  invariant(process.env.BREVO_PURGE_RUN_RECEIPT_PATH && !receiptPath.startsWith(`${evidenceRoot}/`), "raw purge receipt must stay outside release evidence");
  const receipt = await readFile(receiptPath);
  await writePhase("purge-after", ["30-day pending canary is deleted", "under-30-day pending control remains", "automation execution receipt is retained"], { oldPendingDeleted: true, freshPendingPreserved: true, automationReceiptSha256: sha(receipt) });
}

if (action === "finalize") {
  const names = ["request", "confirm", "expired", "unsubscribe", "purge-before", "purge-after"];
  const phaseFiles = [];
  for (const name of names) {
    const path = resolve(phaseRoot, `${name}.json`);
    const bytes = await readFile(path);
    const record = JSON.parse(bytes.toString("utf8"));
    invariant(record.status === "pass" && record.deploymentScope === "preview-qa" && record.deploymentId === process.env.RELEASE_DEPLOYMENT_ID && record.commitSha === process.env.RELEASE_COMMIT_SHA, `${name} DOI phase is not bound to this Preview QA deployment`);
    phaseFiles.push({ path: `brevo-doi/${name}.json`, sha256: sha(bytes) });
  }
  const result = {
    schemaVersion: 1, gate: "brevo-doi-lifecycle-run", status: "pass", recordedAt: new Date().toISOString(),
    deploymentScope: "preview-qa", deploymentId: process.env.RELEASE_DEPLOYMENT_ID, commitSha: process.env.RELEASE_COMMIT_SHA,
    assertions: ["new and pending duplicate privacy parity", "real confirmation and confirmed-list membership", "expired-link recovery", "unsubscribe suppression", "30-day pending purge with fresh control"],
    metrics: { phases: names.length }, phaseFiles,
  };
  await writeFile(resolve(evidenceRoot, "brevo-doi-lifecycle-run.json"), `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
  console.log(JSON.stringify({ status: "pass", phases: names.length }));
}
```

The runner never deletes a contact, prints an address/token/link, or stores those raw values in the evidence directory. The isolated preview must use a fresh `test-recipient` Brevo contact and isolated list/template; production resources are forbidden. The expired-link action uses an actually expired controlled link. The purge actions use a synthetic pending contact created at least 30 days earlier plus a fresh pending control; if no mature canary exists, the launch gate waits rather than backdating or simulating provider age.

- [ ] **Step 5: Add the exact retention evidence schema and validator**

`config/retention-evidence.schema.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "additionalProperties": false,
  "required": ["schemaVersion", "completedAt", "ownerRoles", "mailbox", "brevo", "redis", "syntheticDeletion", "evidenceFiles"],
  "properties": {
    "schemaVersion": { "const": 1 },
    "completedAt": { "type": "string", "format": "date-time" },
    "ownerRoles": {
      "type": "object", "additionalProperties": false,
      "required": ["dataStewardConfirmed", "mailboxAdministratorConfirmed", "mfaConfirmed"],
      "properties": {
        "dataStewardConfirmed": { "const": true },
        "mailboxAdministratorConfirmed": { "const": true },
        "mfaConfirmed": { "const": true }
      }
    },
    "mailbox": {
      "type": "object", "additionalProperties": false,
      "required": ["prayerDeletionDays", "activeFollowUpReviewDays", "activeFollowUpMaxMonths", "activeFollowUpCloseDeletionDays", "contactDeletionMonthsAfterResolution", "unresolvedContactQuarterlyReview", "autoForwardingDisabled", "localArchivesDisabled"],
      "properties": {
        "prayerDeletionDays": { "const": 90 },
        "activeFollowUpReviewDays": { "const": 30 },
        "activeFollowUpMaxMonths": { "const": 12 },
        "activeFollowUpCloseDeletionDays": { "const": 30 },
        "contactDeletionMonthsAfterResolution": { "const": 12 },
        "unresolvedContactQuarterlyReview": { "const": true },
        "autoForwardingDisabled": { "const": true },
        "localArchivesDisabled": { "const": true }
      }
    },
    "brevo": {
      "type": "object", "additionalProperties": false,
      "required": ["pendingDoiPurgeDays", "transactionalLogRetentionDays", "messagePreviewsDisabled", "unsubscribeSuppressionEnabled"],
      "properties": {
        "pendingDoiPurgeDays": { "const": 30 },
        "transactionalLogRetentionDays": { "const": 30 },
        "messagePreviewsDisabled": { "const": true },
        "unsubscribeSuppressionEnabled": { "const": true }
      }
    },
    "redis": {
      "type": "object", "additionalProperties": false,
      "required": ["processingLockSeconds", "acceptedTtlSeconds", "backupsDisabled", "exportsDisabled", "tlsRequired"],
      "properties": {
        "processingLockSeconds": { "const": 300 },
        "acceptedTtlSeconds": { "const": 86400 },
        "backupsDisabled": { "const": true },
        "exportsDisabled": { "const": true },
        "tlsRequired": { "const": true }
      }
    },
    "syntheticDeletion": {
      "type": "object", "additionalProperties": false,
      "required": ["prayerProviderIdSha256", "contactProviderIdSha256", "completedAt", "outcome"],
      "properties": {
        "prayerProviderIdSha256": { "type": "string", "pattern": "^[a-f0-9]{64}$" },
        "contactProviderIdSha256": { "type": "string", "pattern": "^[a-f0-9]{64}$" },
        "completedAt": { "type": "string", "format": "date-time" },
        "outcome": { "const": "deleted" }
      }
    },
    "evidenceFiles": {
      "type": "array", "minItems": 1,
      "items": {
        "type": "object", "additionalProperties": false, "required": ["path", "sha256"],
        "properties": {
          "path": { "type": "string", "pattern": "^[^/].+" },
          "sha256": { "type": "string", "pattern": "^[a-f0-9]{64}$" }
        }
      }
    }
  }
}
```

```js
// scripts/lib/retention-evidence.mjs
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const schema = JSON.parse(await readFile(new URL("../../config/retention-evidence.schema.json", import.meta.url), "utf8"));
const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

export async function validateRetentionEvidence(record, baseDirectory) {
  if (!validate(record)) throw new Error(`retention evidence invalid: ${ajv.errorsText(validate.errors)}`);
  const serialized = JSON.stringify(record);
  if (/@|prayer text|contact text|xkeysib-|turnstile/i.test(serialized)) throw new Error("retention evidence contains forbidden raw data or credentials");
  for (const evidence of record.evidenceFiles) {
    const bytes = await readFile(resolve(baseDirectory, evidence.path));
    const digest = createHash("sha256").update(bytes).digest("hex");
    if (digest !== evidence.sha256) throw new Error(`evidence hash mismatch: ${evidence.path}`);
  }
  return { status: "pass", evidenceFiles: record.evidenceFiles.length };
}
```

```ts
// scripts/lib/retention-evidence.d.mts
export type RetentionEvidence = {
  schemaVersion: 1;
  completedAt: string;
  ownerRoles: { dataStewardConfirmed: true; mailboxAdministratorConfirmed: true; mfaConfirmed: true };
  mailbox: {
    prayerDeletionDays: 90;
    activeFollowUpReviewDays: 30;
    activeFollowUpMaxMonths: 12;
    activeFollowUpCloseDeletionDays: 30;
    contactDeletionMonthsAfterResolution: 12;
    unresolvedContactQuarterlyReview: true;
    autoForwardingDisabled: true;
    localArchivesDisabled: true;
  };
  brevo: { pendingDoiPurgeDays: 30; transactionalLogRetentionDays: 30; messagePreviewsDisabled: true; unsubscribeSuppressionEnabled: true };
  redis: { processingLockSeconds: 300; acceptedTtlSeconds: 86400; backupsDisabled: true; exportsDisabled: true; tlsRequired: true };
  syntheticDeletion: { prayerProviderIdSha256: string; contactProviderIdSha256: string; completedAt: string; outcome: "deleted" };
  evidenceFiles: Array<{ path: string; sha256: string }>;
};
export function validateRetentionEvidence(record: unknown, baseDirectory: string): Promise<{ status: "pass"; evidenceFiles: number }>;
```

`ajv-formats` is a transitive package but must be a declared direct dependency because this file imports it. Install and pin it now:

```bash
npm install --save-dev --save-exact ajv-formats@3.0.1
```

```js
// scripts/validate-retention-evidence.mjs
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { validateRetentionEvidence } from "./lib/retention-evidence.mjs";

const path = process.env.RETENTION_EVIDENCE_PATH;
if (!path) throw new Error("RETENTION_EVIDENCE_PATH is required");
const absolute = resolve(path);
const record = JSON.parse(await readFile(absolute, "utf8"));
const result = await validateRetentionEvidence(record, dirname(absolute));
console.log(JSON.stringify(result));
```

- [ ] **Step 6: Add a real-handler canary submitter and scanner that never print canary values**

```js
// scripts/submit-pii-canaries.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const required = [
  "PII_CANARIES_B64", "PII_CANARY_TARGET_URL", "PII_CANARY_TURNSTILE_TOKEN",
  "VERCEL_AUTOMATION_BYPASS_SECRET", "RELEASE_DEPLOYMENT_ID", "RELEASE_COMMIT_SHA",
  "RELEASE_EVIDENCE_DIR",
];
for (const name of required) if (!process.env[name]) throw new Error(`${name} is required`);
const values = JSON.parse(Buffer.from(process.env.PII_CANARIES_B64, "base64url").toString("utf8"));
if (!Array.isArray(values) || values.length !== 4 || values.some((value) => typeof value !== "string" || value.length < 12)) {
  throw new Error("PII_CANARIES_B64 must encode exactly four strings of 12 or more characters");
}
const [prayer, contact, email, name] = values;
const target = new URL(process.env.PII_CANARY_TARGET_URL);
if (target.protocol !== "https:" || !target.hostname.endsWith(".vercel.app")) throw new Error("PII canaries require the immutable HTTPS Vercel preview");
const protectionSeed = await fetch(new URL("/", target), {
  redirect: "manual",
  signal: AbortSignal.timeout(12_000),
  headers: {
    "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
    "x-vercel-set-bypass-cookie": "true",
  },
});
if (protectionSeed.status !== 200 || protectionSeed.headers.has("location")) throw new Error(`deployment-protection seed returned ${protectionSeed.status}`);
const protectionSetCookies = protectionSeed.headers.getSetCookie?.() ?? [protectionSeed.headers.get("set-cookie")].filter(Boolean);
const protectionCookie = protectionSetCookies.find((value) => /^_vercel_jwt=/i.test(value))?.match(/^(_vercel_jwt=[^;]+)/i)?.[1];
if (!protectionCookie) throw new Error("origin-scoped Vercel bypass cookie was not returned");
const shared = { turnstileToken: process.env.PII_CANARY_TURNSTILE_TOKEN, website: "" };
const payloads = {
  newsletter: { ...shared, submissionId: crypto.randomUUID(), email, firstName: name, consent: true, placement: "connect" },
  prayer: { ...shared, submissionId: crypto.randomUUID(), displayName: name, email, request: prayer, followUpRequested: true },
  contact: { ...shared, submissionId: crypto.randomUUID(), name, email, reason: "general", message: contact },
};
const startedAt = new Date().toISOString();
const statuses = {};
for (const [endpoint, body] of Object.entries(payloads)) {
  const response = await fetch(new URL(`/api/forms/${endpoint}`, target), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: target.origin,
      cookie: protectionCookie,
    },
    body: JSON.stringify(body),
    redirect: "manual",
    signal: AbortSignal.timeout(12_000),
  });
  const result = await response.json().catch(() => null);
  if (response.status !== 202 || !result?.ok || result.deliveryMode !== "no-send") throw new Error(`${endpoint} real-handler canary was not accepted in no-send mode`);
  statuses[endpoint] = response.status;
}
const evidence = {
  schemaVersion: 1,
  gate: "pii-canary-real-handler-run",
  status: "pass",
  recordedAt: new Date().toISOString(),
  deploymentScope: "preview-qa",
  deploymentId: process.env.RELEASE_DEPLOYMENT_ID,
  commitSha: process.env.RELEASE_COMMIT_SHA,
  assertions: ["all four runtime canaries traversed real newsletter, prayer, and contact handlers", "delivery mode remained no-send", "evidence omits canary values and response bodies"],
  metrics: { posts: 3, statuses, startedAt, endedAt: new Date().toISOString() },
};
await mkdir(process.env.RELEASE_EVIDENCE_DIR, { recursive: true, mode: 0o700 });
await writeFile(resolve(process.env.RELEASE_EVIDENCE_DIR, "pii-canary-real-handler-run.json"), `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({ status: "pass", posts: 3, startedAt, endedAt: evidence.metrics.endedAt }));
```

```js
// scripts/check-pii-canaries.mjs
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readdir, readFile, stat, writeFile, mkdir } from "node:fs/promises";
import { resolve, relative } from "node:path";

const encoded = process.env.PII_CANARIES_B64;
if (!encoded) throw new Error("PII_CANARIES_B64 is required");
const canaries = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
if (!Array.isArray(canaries) || canaries.length < 4 || canaries.some((value) => typeof value !== "string" || value.length < 12)) {
  throw new Error("PII_CANARIES_B64 must encode at least four strings of 12 or more characters");
}
let realHandlerPosts = 0;
let boundLogWindow = false;
let boundLogPath = null;
let logExportSha256 = null;
if (process.env.RELEASE_EVIDENCE_DIR) {
  for (const name of ["RELEASE_DEPLOYMENT_ID", "RELEASE_COMMIT_SHA", "VERCEL_LOG_EXPORT", "VERCEL_LOG_EXPORT_STARTED_AT", "VERCEL_LOG_EXPORT_ENDED_AT"]) {
    if (!process.env[name]) throw new Error(`${name} is required for release PII evidence`);
  }
  const evidenceRoot = resolve(process.env.RELEASE_EVIDENCE_DIR);
  const runPath = resolve(evidenceRoot, "pii-canary-real-handler-run.json");
  const logPath = resolve(process.env.VERCEL_LOG_EXPORT);
  if (logPath === evidenceRoot || logPath.startsWith(`${evidenceRoot}/`)) throw new Error("raw Vercel log export must stay outside release evidence");
  const run = JSON.parse(await readFile(runPath, "utf8"));
  if (run.status !== "pass" || run.deploymentScope !== "preview-qa" || run.deploymentId !== process.env.RELEASE_DEPLOYMENT_ID || run.commitSha !== process.env.RELEASE_COMMIT_SHA) {
    throw new Error("real-handler canary run is not bound to this candidate");
  }
  const statuses = run.metrics?.statuses ?? {};
  if (run.metrics?.posts !== 3 || ["newsletter", "prayer", "contact"].some((endpoint) => statuses[endpoint] !== 202)) {
    throw new Error("real-handler canary run lacks three accepted handlers");
  }
  const exportStart = Date.parse(process.env.VERCEL_LOG_EXPORT_STARTED_AT);
  const exportEnd = Date.parse(process.env.VERCEL_LOG_EXPORT_ENDED_AT);
  if (!Number.isFinite(exportStart) || !Number.isFinite(exportEnd) || exportStart > Date.parse(run.metrics.startedAt) || exportEnd < Date.parse(run.metrics.endedAt)) {
    throw new Error("Vercel log export window does not contain the real-handler canary run");
  }
  const logInfo = await stat(logPath).catch(() => null);
  if (!logInfo?.isFile()) throw new Error("Vercel log export is missing");
  realHandlerPosts = 3;
  boundLogWindow = true;
  boundLogPath = logPath;
}
const roots = ["app", "components", "config", "content", "lib", ".next", "playwright-report", "test-results"];
if (process.env.RELEASE_EVIDENCE_DIR) roots.push(process.env.RELEASE_EVIDENCE_DIR);
if (process.env.VERCEL_LOG_EXPORT) roots.push(process.env.VERCEL_LOG_EXPORT);
const hits = [];

async function walk(path) {
  const info = await stat(path).catch(() => null);
  if (!info) return;
  if (info.isDirectory()) {
    for (const entry of await readdir(path)) await walk(resolve(path, entry));
    return;
  }
  const needles = canaries.map((value) => Buffer.from(value));
  const digest = boundLogPath === resolve(path) ? createHash("sha256") : null;
  const overlap = Math.max(...needles.map((needle) => needle.length)) - 1;
  let carry = Buffer.alloc(0);
  for await (const chunk of createReadStream(path, { highWaterMark: 1024 * 1024 })) {
    digest?.update(chunk);
    const bytes = Buffer.concat([carry, chunk]);
    for (const [index, needle] of needles.entries()) {
      if (bytes.includes(needle)) hits.push({ file: relative(process.cwd(), path), canaryIndex: index });
    }
    carry = bytes.subarray(Math.max(0, bytes.length - overlap));
  }
  if (digest) logExportSha256 = digest.digest("hex");
}
for (const root of roots) await walk(resolve(root));
if (boundLogWindow && !/^[a-f0-9]{64}$/.test(logExportSha256 ?? "")) throw new Error("Vercel log export was not completely hashed");
const result = {
  schemaVersion: 1,
  gate: "pii-canary-scan",
  status: hits.length === 0 ? "pass" : "fail",
  recordedAt: new Date().toISOString(),
  deploymentScope: process.env.RELEASE_DEPLOYMENT_SCOPE ?? "local",
  deploymentId: process.env.RELEASE_DEPLOYMENT_ID ?? "local-production-build",
  commitSha: process.env.RELEASE_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "local",
  assertions: ["synthetic canaries absent from source, build, browser reports, test artifacts, and exported Vercel logs"],
  metrics: { filesWithHits: new Set(hits.map((hit) => hit.file)).size, hits: hits.length, realHandlerPosts, boundLogWindow, logExportSha256 },
  hitLocations: hits,
};
if (process.env.RELEASE_EVIDENCE_DIR) {
  await mkdir(process.env.RELEASE_EVIDENCE_DIR, { recursive: true });
  await writeFile(resolve(process.env.RELEASE_EVIDENCE_DIR, "pii-canary-scan.json"), `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
}
console.log(JSON.stringify({ status: result.status, metrics: result.metrics, hitLocations: hits }));
if (hits.length) process.exitCode = 1;
```

- [ ] **Step 7: Write the exact protected-preview, DOI, and retention operating sequence**

```markdown
<!-- docs/operations/release-form-soak.md -->
# Release form soak and privacy evidence

All commands in this form-soak runbook target the immutable protected Preview QA URL recorded in `preview-qa/preview-qa-metadata.json`; none targets the staged Production deployment. The Vercel automation secret bypasses Deployment Protection only. Never create an application header, cookie, query, environment variable, or code path that bypasses WAF, Turnstile, schema validation, idempotency, or delivery.

## Volume run

1. Rehearse the cases once on a protected `no-send` preview to catch unsafe payload or runner mistakes without provider delivery. Treat that rehearsal as safety evidence only; its per-instance memory store is not authoritative idempotency or delivery proof.
2. Create a separate isolated `test-recipient` preview using the preview Brevo account and the same Redis-backed idempotency adapter/configuration as production, with every delivery redirected to the restricted test recipient.
3. Publish the preview-only source-bound WAF exception from `docs/operations/vercel-waf-runbook.md` for the authenticated runner. Record an automatic expiry no later than two hours.
4. Record isolated provider acceptance counts for newsletter, prayer, and contact before the authoritative run.
5. Run `FORM_SOAK_MODE=volume` against the immutable `test-recipient` preview URL with the Turnstile always-pass test token paired only with the test secret, restricted test address, exception expiry, protection secret, deployment ID, Git SHA, and evidence directory.
6. Require 25 sequential plus ten concurrent unique accepted requests per form, repeated-ID replay across the Redis-backed preview, injected/invalid safe outcomes, and p95 below 2,500 ms.
7. Compare provider counts: every unique accepted submission has one provider acceptance; repeated IDs have one provider acceptance; rejected cases have none. Only this isolated provider/Redis run is authoritative for the final gate.
8. Remove the WAF exception immediately and capture privacy-safe rule revision evidence.
9. Preserve `form-soak-volume-run.json`, provider before/after counts, Redis replay evidence, and WAF revision as restricted artifacts. Task 7 combines them into the reviewed `form-soak-volume.json` gate; either HTTP run alone is insufficient.

## Production-equivalent WAF run

Wait for the ten-minute fixed window to reset. With no exception variable, run `FORM_SOAK_MODE=rate-limit FORM_RATE_LIMIT_ENDPOINT=prayer`; request six must be 429. Repeat from a fresh controlled source or after a full reset for `contact`. After another reset run `newsletter`; request eleven must be 429. For every 429, compare Vercel function invocation and provider counts before/after: both deltas must be zero. Preserve each endpoint-specific `*-run.json` plus invocation/provider deltas; Task 7 creates the three reviewed final rate-limit gates.

## Provider outage run

Use a separate protected preview with an intentionally invalid preview-only Brevo credential and healthy Turnstile/Redis. Run `FORM_SOAK_MODE=outage`. Every endpoint must return 503 with `provider_unavailable`; no UI may announce success; typed browser values remain for retry. Preserve `form-soak-outage-run.json` and the retained-value browser report for Task 7's reviewed outage gate. Restore by deleting that preview, not by changing healthy preview or production credentials.

## Isolated Brevo DOI lifecycle

Use a separate Brevo sandbox/test account, confirmed-list ID, DOI template, fresh `test-recipient` preview, and controlled mailbox. Never point the runner at a production key, list, template, contact, or campaign. Keep the raw synthetic address, DOI URLs, and unsubscribe URL in mode-0600 files outside the evidence directory and pass only their file paths. The runner blocks if the fresh contact already exists and never auto-deletes it.

1. At least 31 days before the intended launch, create one visibly synthetic pending DOI canary through the same native DOI configuration and leave it unconfirmed. Shortly before the test, create a second fresh pending control. Do not backdate either provider record.
2. Run `BREVO_DOI_ACTION=request npm run release:doi`. Require the fresh and duplicate/pending requests to produce the same public 202 shape, with no membership words, while the provider contact remains outside the confirmed list.
3. Copy the controlled mailbox's real confirmation URL into the restricted confirmation file, then run `BREVO_DOI_ACTION=confirm npm run release:doi`. Require the query-free `/newsletter/confirmed` destination and confirmed-list membership.
4. Use a genuinely expired controlled DOI link—not a modified token—in the restricted expired file, then run `BREVO_DOI_ACTION=expired npm run release:doi`. Require query-free `/newsletter/expired` plus the fresh recovery form.
5. Send one isolated campaign containing Brevo's provider-managed unsubscribe action to the now-confirmed test contact. Put its real URL in the restricted unsubscribe file, run `BREVO_DOI_ACTION=unsubscribe npm run release:doi`, and require query-free `/newsletter/unsubscribed`, removal from the confirmed list, and retained suppression.
6. Before the scheduled 30-day purge automation runs, provide restricted files for the >=30-day pending canary and <30-day pending control and run `BREVO_DOI_ACTION=purge-before npm run release:doi`. After the real automation execution, retain its raw receipt outside the evidence directory and run `BREVO_DOI_ACTION=purge-after npm run release:doi`; require deletion only of the mature pending contact. Put only a reviewer-redacted copy with no address or provider identifier into evidence.
7. Run `BREVO_DOI_ACTION=finalize npm run release:doi`. Preserve `brevo-doi-lifecycle-run.json`, the six safe phase files, redacted mailbox/outcome screenshots, redacted confirmed-list/suppression views, and the redacted purge receipt. Task 7 combines their hashes into the reviewed `brevo-doi-lifecycle.json` gate. No raw address, provider ID, link, token, API key, or email content enters evidence or Git.

If the mature pending canary, genuine expired link, isolated campaign, provider receipt, or authorized sandbox access is unavailable, this gate is incomplete; unit tests or a shortened automation window do not replace it.

## Canary and retention proof

Use four visibly synthetic runtime canaries. Base64url-encode their JSON array into `PII_CANARIES_B64`; do not put values in shell history, source, issue text, screenshots, or committed files. First run the intercepted browser test to prove URL/storage/cookie/console/third-party-body isolation. That interception is not server evidence.

Against the bound immutable `no-send` preview, run `scripts/submit-pii-canaries.mjs` with the same base64url value, Turnstile test token, protection secret, deployment ID, SHA, and evidence directory. Require three real-handler 202 responses and preserve only `pii-canary-real-handler-run.json`; the script must not print or write the values. After Vercel log ingestion settles, export only that deployment's complete log window from at least the run's `startedAt` through `endedAt` into a restricted temporary file outside the evidence directory. Retain a privacy-safe query/filter receipt, never raw account content.

Run `npm run check:pii` with `VERCEL_LOG_EXPORT` and its UTC query start/end timestamps. The scanner refuses release evidence unless the log window contains the bound real-handler run, then streams and SHA-256-hashes the complete export and every local/browser/build artifact without a size skip. The raw log stays outside the sealed evidence directory; only its digest and aggregate zero-hit result enter evidence. A pass reports `realHandlerPosts:3`, `boundLogWindow:true`, a 64-character `logExportSha256`, and never prints a canary.

Create `retention.json` beside its restricted screenshots/exports using `config/retention-evidence.schema.json`. Provider identifiers are SHA-256 digests only. Run `RETENTION_EVIDENCE_PATH="$RELEASE_EVIDENCE_DIR/retention.json" node scripts/validate-retention-evidence.mjs`. Any weaker number, missing owner/MFA confirmation, raw address/identifier, missing synthetic deletion, or attachment hash mismatch blocks production activation.
```

- [ ] **Step 8: Run local privacy tests and validators**

Run:

```bash
npm test -- tests/unit/release/retention-evidence.test.ts
export PII_CANARIES_B64="$(node -e 'const {randomUUID}=require("node:crypto"); const id=randomUUID(); process.stdout.write(Buffer.from(JSON.stringify([`SYNTHETIC-PRAYER-${id}`,`SYNTHETIC-CONTACT-${id}`,`tlc-release-${id}@example.org`,`Synthetic Person ${id}`])).toString("base64url"))')"
PLAYWRIGHT_SERVER_COMMAND='npm run start' PII_CANARIES_B64="$PII_CANARIES_B64" npx playwright test tests/e2e/release/privacy-leaks.spec.ts --project=chromium
PII_CANARIES_B64="$PII_CANARIES_B64" npm run check:pii
unset PII_CANARIES_B64
```

Expected: Vitest and Playwright pass; offline/outage preserve the request and expose no false success; the canary scanner prints `status:"pass"` and `hits:0` without printing a canary.

- [ ] **Step 9: Run all remote modes and validate restricted operational evidence**

Run the commands exactly as parameterized in the runbook, always using environment variables sourced from the restricted release session rather than literals in shell history. Then run:

```bash
PII_CANARY_TARGET_URL="$PREVIEW_QA_IMMUTABLE_URL" PII_CANARY_TURNSTILE_TOKEN="$FORM_SOAK_TURNSTILE_TOKEN" PII_CANARIES_B64="$PII_CANARIES_B64" VERCEL_AUTOMATION_BYPASS_SECRET="$VERCEL_AUTOMATION_BYPASS_SECRET" RELEASE_DEPLOYMENT_ID="$PREVIEW_QA_DEPLOYMENT_ID" RELEASE_COMMIT_SHA="$RELEASE_COMMIT_SHA" RELEASE_EVIDENCE_DIR="$RELEASE_EVIDENCE_DIR/preview-qa" node scripts/submit-pii-canaries.mjs
# Export the exact deployment log window after ingestion, then use the UTC bounds from the export receipt:
PII_CANARIES_B64="$PII_CANARIES_B64" VERCEL_LOG_EXPORT="$VERCEL_LOG_EXPORT" VERCEL_LOG_EXPORT_STARTED_AT="$VERCEL_LOG_EXPORT_STARTED_AT" VERCEL_LOG_EXPORT_ENDED_AT="$VERCEL_LOG_EXPORT_ENDED_AT" RELEASE_DEPLOYMENT_ID="$PREVIEW_QA_DEPLOYMENT_ID" RELEASE_COMMIT_SHA="$RELEASE_COMMIT_SHA" RELEASE_EVIDENCE_DIR="$RELEASE_EVIDENCE_DIR/preview-qa" npm run check:pii
RETENTION_EVIDENCE_PATH="$RELEASE_EVIDENCE_DIR/retention.json" node scripts/validate-retention-evidence.mjs
```

Expected: raw volume evidence reports 25 accepted submissions per form, unique concurrency, idempotent replay, and p95 `<2500`; three endpoint-specific raw rate-limit records show exact 429 thresholds; outage raw evidence records three safe 503s; the six-phase isolated DOI record proves public response parity, confirmation/list membership, expired recovery, unsubscribe suppression, and the real 30-day purge boundary; the real-handler canary run and its deployment-bound complete Vercel log window produce a release PII scan with `hits:0`, `realHandlerPosts:3`, `boundLogWindow:true`, and a log digest while the raw export remains outside evidence; restricted provider/invocation/UI attachments are available for Task 7's manual final gates; retention validation prints `{"status":"pass","evidenceFiles":<positive integer>}`.

- [ ] **Step 10: Commit form release verification without private evidence**

```bash
git add package.json package-lock.json scripts/form-preview-soak.mjs scripts/brevo-doi-lifecycle.mjs scripts/submit-pii-canaries.mjs scripts/check-pii-canaries.mjs config/retention-evidence.schema.json scripts/lib/retention-evidence.mjs scripts/lib/retention-evidence.d.mts scripts/validate-retention-evidence.mjs tests/unit/release/retention-evidence.test.ts tests/e2e/release/privacy-leaks.spec.ts docs/operations/release-form-soak.md
git commit -m "test: add form soak and privacy evidence gates"
```

Confirm before committing: `git status --short` contains no `.private-release-evidence/`, log export, provider export, screenshot, address, token, raw provider ID, or synthetic message body.

### Task 5: Enforce Lighthouse, transfer, long-task, and physical Pixel motion budgets

**Files:**
- Create: `lighthouserc.cjs`
- Create: `scripts/lighthouse-auth.cjs`
- Create: `lib/release/performance.mjs`
- Create: `lib/release/performance.d.mts`
- Create: `scripts/check-lighthouse-results.mjs`
- Create: `scripts/check-bundle-budgets.mjs`
- Create: `scripts/capture-pixel-motion.mjs`
- Create: `tests/unit/release/performance-gates.test.ts`
- Modify: `.github/workflows/quality.yml`

**Interfaces:**
- Consumes: the final production build, `.next/build-manifest.json`, `.next/routes-manifest.json`, Lighthouse result JSON, one approved physical Android device, ADB, and current Chrome remote debugging.
- Produces: `median(values)`, `evaluateLighthouseRuns(lhrs)`, `evaluatePixelRuns(runs)`, `analyzeTrace(events, durationSeconds)`, `lighthouse-summary.json`, `bundle-summary.json`, three raw physical trace files, `pixel-motion-summary.json`, and a required `quality / performance` CI check.

- [ ] **Step 1: Write failing numerical boundary tests before any collector**

```ts
// tests/unit/release/performance-gates.test.ts
import { describe, expect, it } from "vitest";
import { indexableStaticRoutes } from "../../../config/routes";
import {
  analyzeTrace,
  evaluateLighthouseRuns,
  evaluatePixelRuns,
  median,
} from "../../../lib/release/performance.mjs";

function lhr(path: string, performance: number, overrides: Record<string, number> = {}) {
  const metrics = {
    lcp: 2400, cls: 0.04, tbt: 140, script: 180 * 1024, stylesheet: 60 * 1024,
    total: 1.5 * 1024 * 1024, requests: 60, largestImage: 300 * 1024, longTask: 199,
    ...overrides,
  };
  return {
    finalUrl: `http://127.0.0.1:3000${path}`,
    categories: {
      performance: { score: performance }, accessibility: { score: 1 },
      "best-practices": { score: 1 }, seo: { score: 1 },
    },
    audits: {
      "largest-contentful-paint": { numericValue: metrics.lcp },
      "cumulative-layout-shift": { numericValue: metrics.cls },
      "total-blocking-time": { numericValue: metrics.tbt },
      "resource-summary": { details: { items: [
        { resourceType: "script", transferSize: metrics.script, requestCount: 10 },
        { resourceType: "stylesheet", transferSize: metrics.stylesheet, requestCount: 4 },
        { resourceType: "total", transferSize: metrics.total, requestCount: metrics.requests },
      ] } },
      "network-requests": { details: { items: [{ resourceType: "Image", transferSize: metrics.largestImage }] } },
      "long-tasks": { details: { items: [{ duration: metrics.longTask }] } },
    },
  };
}

describe("performance gates", () => {
  it("uses a true median for three runs", () => {
    expect(median([96, 92, 94])).toBe(94);
  });

  it("accepts exact home/static and transfer boundaries", () => {
    const runs = [0.92, 0.94, 0.96].flatMap((home) =>
      indexableStaticRoutes.map((path) => lhr(path, path === "/" ? home : 0.95)));
    expect(evaluateLighthouseRuns(runs, indexableStaticRoutes)).toMatchObject({ status: "pass", routes: indexableStaticRoutes.length });
  });

  it("rejects one-point metric, category, transfer, request, and long-task regressions", () => {
    const base = [lhr("/", 0.92), lhr("/", 0.92), lhr("/", 0.92)];
    for (const bad of [
      lhr("/", 0.92, { lcp: 2501 }), lhr("/", 0.92, { cls: 0.051 }),
      lhr("/", 0.92, { tbt: 151 }), lhr("/", 0.92, { script: 180 * 1024 + 1 }),
      lhr("/", 0.92, { stylesheet: 60 * 1024 + 1 }), lhr("/", 0.92, { total: 1.5 * 1024 * 1024 + 1 }),
      lhr("/", 0.92, { requests: 61 }), lhr("/", 0.92, { largestImage: 300 * 1024 + 1 }),
      lhr("/", 0.92, { longTask: 201 }),
    ]) expect(() => evaluateLighthouseRuns([base[0], base[1], bad], ["/"])).toThrow();
    expect(() => evaluateLighthouseRuns([lhr("/", 0.919), lhr("/", 0.919), lhr("/", 0.919)], ["/"])).toThrow(/median performance/);
  });

  it("requires three physical runs, median 55 fps, and dropped frames below 5 percent", () => {
    expect(evaluatePixelRuns([
      { fps: 55, droppedPercent: 4.9, longestTaskMs: 200 },
      { fps: 57, droppedPercent: 4.0, longestTaskMs: 180 },
      { fps: 54, droppedPercent: 4.8, longestTaskMs: 190 },
    ])).toMatchObject({ status: "pass", medianFps: 55, medianDroppedPercent: 4.8 });
    expect(() => evaluatePixelRuns([
      { fps: 55, droppedPercent: 5, longestTaskMs: 199 },
      { fps: 55, droppedPercent: 5, longestTaskMs: 199 },
      { fps: 55, droppedPercent: 5, longestTaskMs: 199 },
    ])).toThrow();
    expect(() => evaluatePixelRuns([
      { fps: 55, droppedPercent: 4, longestTaskMs: 201 },
      { fps: 55, droppedPercent: 4, longestTaskMs: 199 },
      { fps: 55, droppedPercent: 4, longestTaskMs: 199 },
    ])).toThrow(/long task/);
  });

  it("derives draw and dropped evidence from trace events", () => {
    const events = [
      ...Array.from({ length: 55 }, (_, index) => ({ name: "DrawFrame", ts: index * 18_000 })),
      ...Array.from({ length: 2 }, (_, index) => ({ name: "DroppedFrame", ts: index * 400_000 })),
      { name: "RunTask", ts: 0, dur: 199_000, ph: "X" },
    ];
    expect(analyzeTrace(events, 1)).toMatchObject({ drawnFrames: 55, droppedFrames: 2, fps: 55, longestTaskMs: 199 });
  });
});
```

- [ ] **Step 2: Run the focused suite and verify the missing evaluator fails**

Run: `npm test -- tests/unit/release/performance-gates.test.ts`

Expected: FAIL because `lib/release/performance.mjs` does not exist.

- [ ] **Step 3: Implement every performance evaluator as pure code**

```js
// lib/release/performance.mjs
export function median(values) {
  if (!values.length) throw new Error("median requires values");
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function audit(lhr, name) {
  const value = lhr.audits?.[name];
  invariant(value, `missing Lighthouse audit ${name}`);
  return value;
}

function resource(lhr, type) {
  const item = audit(lhr, "resource-summary").details?.items?.find((entry) => entry.resourceType === type);
  invariant(item, `missing resource summary ${type}`);
  return item;
}

function routeMetrics(lhr) {
  const images = audit(lhr, "network-requests").details?.items?.filter((item) => item.resourceType === "Image") ?? [];
  const tasks = audit(lhr, "long-tasks").details?.items ?? [];
  return {
    performance: lhr.categories.performance.score,
    accessibility: lhr.categories.accessibility.score,
    bestPractices: lhr.categories["best-practices"].score,
    seo: lhr.categories.seo.score,
    lcpMs: audit(lhr, "largest-contentful-paint").numericValue,
    cls: audit(lhr, "cumulative-layout-shift").numericValue,
    tbtMs: audit(lhr, "total-blocking-time").numericValue,
    scriptBytes: resource(lhr, "script").transferSize,
    cssBytes: resource(lhr, "stylesheet").transferSize,
    totalBytes: resource(lhr, "total").transferSize,
    requestCount: resource(lhr, "total").requestCount,
    largestImageBytes: Math.max(0, ...images.map((item) => item.transferSize ?? 0)),
    longestTaskMs: Math.max(0, ...tasks.map((item) => item.duration ?? 0)),
  };
}

export function evaluateLighthouseRuns(lhrs, requiredRoutes) {
  const groups = new Map();
  for (const lhr of lhrs) {
    const path = new URL(lhr.finalUrl).pathname.replace(/\/$/, "") || "/";
    groups.set(path, [...(groups.get(path) ?? []), routeMetrics(lhr)]);
  }
  invariant(requiredRoutes.length > 0, "required Lighthouse route registry is empty");
  for (const required of requiredRoutes) invariant(groups.has(required), `missing Lighthouse route ${required}`);
  invariant(groups.size === new Set(requiredRoutes).size, "Lighthouse output contains an unregistered or duplicate route group");
  const summaries = {};
  for (const [path, runs] of groups) {
    invariant(runs.length === 3, `${path} requires exactly three Lighthouse runs`);
    for (const run of runs) {
      invariant(run.accessibility === 1, `${path} accessibility below 100`);
      invariant(run.bestPractices === 1, `${path} best practices below 100`);
      invariant(run.seo === 1, `${path} SEO below 100`);
      invariant(run.lcpMs <= 2500, `${path} LCP exceeds 2500ms`);
      invariant(run.cls <= 0.05, `${path} CLS exceeds 0.05`);
      invariant(run.tbtMs <= 150, `${path} TBT exceeds 150ms`);
      invariant(run.scriptBytes <= 180 * 1024, `${path} JS exceeds 180KB`);
      invariant(run.cssBytes <= 60 * 1024, `${path} CSS exceeds 60KB`);
      invariant(run.totalBytes <= 1.5 * 1024 * 1024, `${path} transfer exceeds 1.5MB`);
      invariant(run.requestCount <= 60, `${path} requests exceed 60`);
      invariant(run.largestImageBytes <= 300 * 1024, `${path} initial image exceeds 300KB`);
      invariant(run.longestTaskMs <= 200, `${path} long task exceeds 200ms`);
    }
    const performance = median(runs.map((run) => run.performance));
    invariant(performance >= (path === "/" ? 0.92 : 0.95), `${path} median performance below gate`);
    summaries[path] = {
      performance,
      lcpMs: median(runs.map((run) => run.lcpMs)),
      cls: median(runs.map((run) => run.cls)),
      tbtMs: median(runs.map((run) => run.tbtMs)),
      scriptBytes: Math.max(...runs.map((run) => run.scriptBytes)),
      cssBytes: Math.max(...runs.map((run) => run.cssBytes)),
      totalBytes: Math.max(...runs.map((run) => run.totalBytes)),
      requestCount: Math.max(...runs.map((run) => run.requestCount)),
      largestImageBytes: Math.max(...runs.map((run) => run.largestImageBytes)),
      longestTaskMs: Math.max(...runs.map((run) => run.longestTaskMs)),
    };
  }
  return { status: "pass", routes: groups.size, summaries };
}

export function analyzeTrace(events, durationSeconds) {
  const drawnFrames = events.filter((event) => event.name === "DrawFrame" || event.name === "Display::DrawAndSwap").length;
  const beginFrames = events.filter((event) => event.name === "BeginFrame").length;
  const explicitDropped = events.filter((event) => /DroppedFrame/i.test(event.name)).length;
  const taskDurationsMs = events
    .filter((event) => typeof event.dur === "number" && /(^|::)RunTask$|ProcessTaskFromWorkQueue/.test(event.name))
    .map((event) => event.dur / 1000);
  const droppedFrames = Math.max(explicitDropped, Math.max(0, beginFrames - drawnFrames));
  invariant(drawnFrames > 0, "trace contains no drawn-frame events");
  const fps = drawnFrames / durationSeconds;
  const droppedPercent = (droppedFrames / Math.max(1, drawnFrames + droppedFrames)) * 100;
  return {
    drawnFrames,
    droppedFrames,
    fps: Math.round(fps * 100) / 100,
    droppedPercent: Math.round(droppedPercent * 100) / 100,
    longestTaskMs: Math.round(Math.max(0, ...taskDurationsMs) * 100) / 100,
  };
}

export function evaluatePixelRuns(runs) {
  invariant(runs.length === 3, "physical motion gate requires exactly three runs");
  for (const run of runs) invariant(run.longestTaskMs <= 200, `physical primary-scroll long task ${run.longestTaskMs}ms exceeds 200ms`);
  const medianFps = median(runs.map((run) => run.fps));
  const medianDroppedPercent = median(runs.map((run) => run.droppedPercent));
  invariant(medianFps >= 55, `physical median FPS ${medianFps} is below 55`);
  invariant(medianDroppedPercent < 5, `physical median dropped frames ${medianDroppedPercent}% is not below 5%`);
  return { status: "pass", medianFps, medianDroppedPercent, runs };
}
```

```ts
// lib/release/performance.d.mts
export type PixelRun = { fps: number; droppedPercent: number; longestTaskMs: number; drawnFrames?: number; droppedFrames?: number };
export function median(values: readonly number[]): number;
export function evaluateLighthouseRuns(lhrs: readonly unknown[], requiredRoutes: readonly string[]): { status: "pass"; routes: number; summaries: Record<string, Record<string, number>> };
export function analyzeTrace(events: readonly { name: string; ts?: number; dur?: number; ph?: string }[], durationSeconds: number): { drawnFrames: number; droppedFrames: number; fps: number; droppedPercent: number; longestTaskMs: number };
export function evaluatePixelRuns(runs: readonly PixelRun[]): { status: "pass"; medianFps: number; medianDroppedPercent: number; runs: readonly PixelRun[] };
```

- [ ] **Step 4: Configure three mobile Slow 4G/4x CPU Lighthouse runs**

```js
// lighthouserc.cjs
require("tsx/cjs");
const { indexableStaticRoutes } = require("./config/routes.ts");

const remote = Boolean(process.env.LIGHTHOUSE_BASE_URL);
const baseURL = process.env.LIGHTHOUSE_BASE_URL ?? "http://127.0.0.1:3000";
if (remote && new URL(baseURL).protocol !== "https:") throw new Error("remote Lighthouse target must use HTTPS");
const protectionSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const collect = {
  url: indexableStaticRoutes.map((path) => new URL(path, baseURL).toString()),
  numberOfRuns: 3,
  ...(protectionSecret ? { puppeteerScript: "./scripts/lighthouse-auth.cjs" } : {}),
  settings: {
    formFactor: "mobile",
    throttlingMethod: "simulate",
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      requestLatencyMs: 562.5,
      downloadThroughputKbps: 1474.56,
      uploadThroughputKbps: 675,
      cpuSlowdownMultiplier: 4,
    },
    screenEmulation: { mobile: true, width: 360, height: 800, deviceScaleFactor: 2, disabled: false },
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    chromeFlags: "--headless=new --no-sandbox --disable-dev-shm-usage --disable-background-networking",
  },
};
if (!remote) Object.assign(collect, {
  startServerCommand: "npm run start",
  startServerReadyPattern: "Ready",
  startServerReadyTimeout: 180000,
});

module.exports = {
  ci: {
    collect,
    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
};
```

```js
// scripts/lighthouse-auth.cjs
module.exports = async function seedProtectedLighthouseCookie(browser, context) {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (!secret) return;
  const expected = new URL(process.env.LIGHTHOUSE_BASE_URL ?? context.url);
  const current = new URL(context.url);
  if (expected.origin !== current.origin || current.protocol !== "https:" || !current.hostname.endsWith(".vercel.app") || current.username || current.password) {
    throw new Error("Lighthouse protection target is not the exact bound HTTPS Vercel deployment origin");
  }
  const seedURL = new URL("/", current);
  const response = await fetch(seedURL, {
    redirect: "manual",
    signal: AbortSignal.timeout(12_000),
    headers: {
      "x-vercel-protection-bypass": secret,
      "x-vercel-set-bypass-cookie": "true",
    },
  });
  if (response.status !== 200 || response.headers.has("location")) throw new Error(`deployment-protection seed returned ${response.status}`);
  const setCookies = response.headers.getSetCookie?.() ?? [response.headers.get("set-cookie")].filter(Boolean);
  const pair = setCookies.find((value) => /^_vercel_jwt=/i.test(value))?.match(/^_vercel_jwt=([^;]+)/i)?.[1];
  if (!pair) throw new Error("origin-scoped Vercel bypass cookie was not returned");
  await browser.defaultBrowserContext().setCookie({
    name: "_vercel_jwt",
    value: pair,
    url: current.origin,
    secure: true,
    httpOnly: true,
  });
};
```

```js
// scripts/check-lighthouse-results.mjs
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { indexableStaticRoutes } from "../config/routes.ts";
import { evaluateLighthouseRuns } from "../lib/release/performance.mjs";

const directory = resolve(".lighthouseci");
const files = (await readdir(directory)).filter((name) => /^lhr-.*\.json$/.test(name));
const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const raw = await Promise.all(files.map(async (name) => {
  const path = resolve(directory, name);
  const original = await readFile(path, "utf8");
  const sanitized = secret ? original.split(secret).join("[REDACTED]") : original;
  if (sanitized !== original) await writeFile(path, sanitized, { mode: 0o600 });
  if (secret && sanitized.includes(secret)) throw new Error(`failed to redact protection secret from ${name}`);
  return { name, sanitized };
}));
const lhrs = raw.map(({ sanitized }) => JSON.parse(sanitized));
const result = evaluateLighthouseRuns(lhrs, indexableStaticRoutes);
const evidence = {
  schemaVersion: 1,
  gate: "lighthouse-budgets",
  status: result.status,
  recordedAt: new Date().toISOString(),
  deploymentScope: process.env.RELEASE_DEPLOYMENT_SCOPE ?? "local",
  deploymentId: process.env.RELEASE_DEPLOYMENT_ID ?? "local-production-build",
  commitSha: process.env.RELEASE_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "local",
  assertions: ["three Slow 4G/4x CPU runs per route", "home performance >=92", "static performance >=95", "A11y/Best Practices/SEO 100", "LCP/CLS/TBT/resource/request/long-task budgets pass"],
  metrics: result.summaries,
  lhrFiles: raw.map(({ name }) => `lighthouse/${name}`),
};
if (process.env.RELEASE_EVIDENCE_DIR) {
  await mkdir(process.env.RELEASE_EVIDENCE_DIR, { recursive: true });
  const rawDirectory = resolve(process.env.RELEASE_EVIDENCE_DIR, "lighthouse");
  await mkdir(rawDirectory, { recursive: true, mode: 0o700 });
  for (const { name, sanitized } of raw) await writeFile(resolve(rawDirectory, name), sanitized, { mode: 0o600 });
  await writeFile(resolve(process.env.RELEASE_EVIDENCE_DIR, "lighthouse-summary.json"), `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });
}
console.log(JSON.stringify({ status: "pass", routes: result.routes, summaries: result.summaries }));
```

- [ ] **Step 5: Add a conservative pre-Lighthouse Next bundle gate**

```js
// scripts/check-bundle-budgets.mjs
import { brotliCompressSync } from "node:zlib";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const manifest = JSON.parse(await readFile(".next/build-manifest.json", "utf8"));
const appManifest = JSON.parse(await readFile(".next/app-build-manifest.json", "utf8"));
const appRootFiles = Object.entries(appManifest.pages ?? {})
  .filter(([key]) => key === "/layout" || key === "/page")
  .flatMap(([, files]) => files);
const routeFiles = new Set([...(manifest.rootMainFiles ?? []), ...(manifest.pages?.["/_app"] ?? []), ...(manifest.pages?.["/"] ?? []), ...appRootFiles]);
const jsFiles = [...routeFiles].filter((file) => file.endsWith(".js"));
const cssFiles = [...routeFiles].filter((file) => file.endsWith(".css"));

async function compressed(files) {
  let bytes = 0;
  for (const file of files) bytes += brotliCompressSync(await readFile(resolve(".next", file))).byteLength;
  return bytes;
}
const javascriptBytes = await compressed(jsFiles);
const cssBytes = await compressed(cssFiles);
if (javascriptBytes > 180 * 1024) throw new Error(`initial Brotli JS ${javascriptBytes} exceeds ${180 * 1024}`);
if (cssBytes > 60 * 1024) throw new Error(`initial Brotli CSS ${cssBytes} exceeds ${60 * 1024}`);
const result = { status: "pass", javascriptBytes, cssBytes, jsFiles: jsFiles.length, cssFiles: cssFiles.length };
if (process.env.RELEASE_EVIDENCE_DIR) {
  await mkdir(process.env.RELEASE_EVIDENCE_DIR, { recursive: true });
  await writeFile(resolve(process.env.RELEASE_EVIDENCE_DIR, "bundle-summary.json"), `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
}
console.log(JSON.stringify(result));
```

- [ ] **Step 6: Implement the physical Android preflight, trace capture, and evidence writer**

```js
// scripts/capture-pixel-motion.mjs
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { chromium } from "@playwright/test";
import { analyzeTrace, evaluatePixelRuns } from "../lib/release/performance.mjs";

const baseURL = process.env.PIXEL_BASE_URL;
const serial = process.env.PIXEL_ADB_SERIAL;
const expectedChromeMajor = process.env.PIXEL_EXPECTED_CHROME_MAJOR;
const deploymentId = process.env.RELEASE_DEPLOYMENT_ID;
const commitSha = process.env.RELEASE_COMMIT_SHA;
const evidenceRoot = process.env.RELEASE_EVIDENCE_DIR;
if (!baseURL || !serial || !expectedChromeMajor || !deploymentId || !commitSha || !evidenceRoot) {
  throw new Error("PIXEL_BASE_URL, PIXEL_ADB_SERIAL, PIXEL_EXPECTED_CHROME_MAJOR, RELEASE_DEPLOYMENT_ID, RELEASE_COMMIT_SHA, and RELEASE_EVIDENCE_DIR are required");
}
const target = new URL(baseURL);
if (target.protocol !== "https:") throw new Error("physical trace target must use HTTPS");
let protectionCookieValue = null;
if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
  if (!target.hostname.endsWith(".vercel.app") || target.username || target.password) throw new Error("physical protection target must be the exact HTTPS Vercel deployment origin");
  const response = await fetch(new URL("/", target), {
    redirect: "manual",
    signal: AbortSignal.timeout(12_000),
    headers: {
      "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
      "x-vercel-set-bypass-cookie": "true",
    },
  });
  if (response.status !== 200 || response.headers.has("location")) throw new Error(`deployment-protection seed returned ${response.status}`);
  const setCookies = response.headers.getSetCookie?.() ?? [response.headers.get("set-cookie")].filter(Boolean);
  protectionCookieValue = setCookies.find((value) => /^_vercel_jwt=/i.test(value))?.match(/^_vercel_jwt=([^;]+)/i)?.[1] ?? null;
  if (!protectionCookieValue) throw new Error("origin-scoped Vercel bypass cookie was not returned");
}
const adb = (...args) => execFileSync("adb", ["-s", serial, ...args], { encoding: "utf8" }).trim();
const shell = (...args) => adb("shell", ...args);
const safeAdb = (...args) => { try { return adb(...args); } catch { return ""; } };
const safeShell = (...args) => safeAdb("shell", ...args);
const model = shell("getprop", "ro.product.model");
const android = shell("getprop", "ro.build.version.release");
const sdk = shell("getprop", "ro.build.version.sdk");
const batteryDump = shell("dumpsys", "battery");
const battery = Number(batteryDump.match(/level:\s*(\d+)/)?.[1]);
const lowPower = shell("settings", "get", "global", "low_power");
const thermal = shell("dumpsys", "thermalservice");
const screenRecording = safeShell("pidof", "screenrecord");
if (!Number.isFinite(battery) || battery <= 50) throw new Error(`battery ${battery}% is not above 50%`);
if (lowPower !== "0") throw new Error("power saver is enabled");
if (/mStatus=[3-6]/.test(thermal)) throw new Error("device is not thermally normal");
if (screenRecording) throw new Error("background screen recording is active");
let slowerDeviceApproval = null;
if (model !== "Pixel 6") {
  const approvalPath = resolve(process.env.PIXEL_APPROVED_SLOWER_DEVICE_EVIDENCE_PATH ?? "");
  if (!process.env.PIXEL_APPROVED_SLOWER_DEVICE_EVIDENCE_PATH || !approvalPath.startsWith(`${resolve(evidenceRoot)}/`)) {
    throw new Error(`device ${model} is not Pixel 6 and lacks an in-directory slower-device approval file`);
  }
  const bytes = await readFile(approvalPath);
  const approval = JSON.parse(bytes.toString("utf8"));
  if (approval.schemaVersion !== 1 || approval.status !== "approved" || approval.deviceModel !== model || approval.comparison !== "documented-slower-than-pixel-6" || typeof approval.reviewerRole !== "string" || approval.reviewerRole.length < 3 || !Number.isFinite(Date.parse(approval.approvedAt))) {
    throw new Error("slower-device approval content is invalid or does not match the connected device");
  }
  slowerDeviceApproval = {
    path: relative(resolve(evidenceRoot), approvalPath),
    sha256: createHash("sha256").update(bytes).digest("hex"),
    reviewerRole: approval.reviewerRole,
    approvedAt: approval.approvedAt,
  };
} else if (process.env.PIXEL_APPROVED_SLOWER_DEVICE_EVIDENCE_PATH) {
  throw new Error("Pixel 6 must not use a slower-device approval override");
}
if (model === "Pixel 6" && android !== "15") throw new Error(`Pixel 6 must run Android 15; found ${android}`);

const directory = resolve(evidenceRoot, "pixel-motion");
await mkdir(directory, { recursive: true, mode: 0o700 });
const results = [];
let chromeVersion = "";
for (let run = 1; run <= 3; run += 1) {
  shell("am", "force-stop", "com.android.chrome");
  safeAdb("forward", "--remove", "tcp:9222");
  adb("forward", "tcp:9222", "localabstract:chrome_devtools_remote");
  shell("am", "start", "-a", "android.intent.action.VIEW", "-d", new URL("/", target).toString(), "com.android.chrome");
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 2500));
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0] ?? await context.newPage();
  const session = await context.newCDPSession(page);
  const version = await session.send("Browser.getVersion");
  chromeVersion = version.product;
  const chromeMajor = chromeVersion.match(/Chrome\/(\d+)/)?.[1];
  if (chromeMajor !== expectedChromeMajor) throw new Error(`Chrome major ${chromeMajor} does not match current stable ${expectedChromeMajor}`);
  await session.send("Storage.clearDataForOrigin", { origin: target.origin, storageTypes: "all" });
  await session.send("Network.clearBrowserCache");
  if (protectionCookieValue) {
    const cookie = await session.send("Network.setCookie", {
      name: "_vercel_jwt", value: protectionCookieValue, url: target.origin,
      secure: true, httpOnly: true, sameSite: "Lax",
    });
    if (!cookie.success) throw new Error("CDP did not install the exact-origin Vercel bypass cookie");
  }
  await page.goto(new URL("/", target).toString(), { waitUntil: "networkidle" });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const events = [];
  session.on("Tracing.dataCollected", ({ value }) => events.push(...value));
  const complete = new Promise((resolvePromise) => session.once("Tracing.tracingComplete", resolvePromise));
  await session.send("Tracing.start", {
    categories: "devtools.timeline,disabled-by-default-devtools.timeline.frame,benchmark,cc,gpu,viz",
    options: "record-as-much-as-possible",
    transferMode: "ReportEvents",
  });
  await page.evaluate(async () => {
    const duration = 30_000;
    const start = performance.now();
    const mission = document.querySelector("#mission");
    if (!mission) throw new Error("home manifesto #mission is required for the physical trace");
    const max = Math.max(0, mission.getBoundingClientRect().bottom + scrollY - innerHeight);
    await new Promise((resolvePromise) => {
      const frame = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        scrollTo(0, max * progress);
        if (progress < 1) requestAnimationFrame(frame);
        else resolvePromise();
      };
      requestAnimationFrame(frame);
    });
  });
  await session.send("Tracing.end");
  await complete;
  const trace = { traceEvents: events, metadata: { run, model, android, sdk, chromeVersion, battery, lowPower } };
  const serializedTrace = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
    ? JSON.stringify(trace).split(process.env.VERCEL_AUTOMATION_BYPASS_SECRET).join("[REDACTED]")
    : JSON.stringify(trace);
  if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET && serializedTrace.includes(process.env.VERCEL_AUTOMATION_BYPASS_SECRET)) throw new Error("physical trace retained the protection secret");
  await writeFile(resolve(directory, `trace-${run}.json`), `${serializedTrace}\n`, { mode: 0o600 });
  results.push(analyzeTrace(events, 30));
  await browser.close();
}
const gate = evaluatePixelRuns(results);
const summary = {
  schemaVersion: 1,
  gate: "physical-pixel-motion",
  status: "pass",
  recordedAt: new Date().toISOString(),
  deploymentScope: process.env.RELEASE_DEPLOYMENT_SCOPE ?? "preview-qa",
  deploymentId,
  commitSha,
  assertions: ["three cold-process 30-second hero-through-manifesto traces", "origin data and browser cache cleared", "battery above 50 percent", "power saver off", "thermally normal", "no screen recording", "median FPS >=55", "median dropped frames <5 percent", "no primary-scroll task exceeds 200ms"],
  device: { model, android, sdk, chromeVersion, battery },
  ...(slowerDeviceApproval ? { slowerDeviceApproval } : {}),
  metrics: { medianFps: gate.medianFps, medianDroppedPercent: gate.medianDroppedPercent },
  runs: results,
  traceFiles: ["pixel-motion/trace-1.json", "pixel-motion/trace-2.json", "pixel-motion/trace-3.json"],
  artifacts: slowerDeviceApproval ? [{ path: slowerDeviceApproval.path, sha256: slowerDeviceApproval.sha256 }] : [],
};
await writeFile(resolve(evidenceRoot, "pixel-motion-summary.json"), `${JSON.stringify(summary, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({ status: "pass", device: summary.device, metrics: summary.metrics }));
```

- [ ] **Step 7: Run local CI parity, then repeat Lighthouse against the bound Preview QA deployment**

Run:

```bash
npm test -- tests/unit/release/performance-gates.test.ts
npm run build
npm run bundle:check
npm run lighthouse:ci
LIGHTHOUSE_BASE_URL="$PREVIEW_QA_IMMUTABLE_URL" VERCEL_AUTOMATION_BYPASS_SECRET="$VERCEL_AUTOMATION_BYPASS_SECRET" RELEASE_DEPLOYMENT_ID="$PREVIEW_QA_DEPLOYMENT_ID" RELEASE_COMMIT_SHA="$RELEASE_COMMIT_SHA" RELEASE_EVIDENCE_DIR="$RELEASE_EVIDENCE_DIR/preview-qa" npm run lighthouse:ci
```

Expected: unit boundaries pass; Brotli JS is `<=184320` bytes and CSS `<=61440` bytes; exactly three Lighthouse JSON runs for every path in `indexableStaticRoutes` are evaluated locally and then from the immutable HTTPS Preview QA deployment. Home median is `>=0.92`, every other static-route median is `>=0.95`, and every category/metric/resource/request/load-long-task gate passes. This run writes Preview-scoped evidence under `preview-qa/`; Task 6 reruns the same Production-build-dependent gate against the separately authorized staged Production deployment.

- [ ] **Step 8: Run the physical gate only on the prepared device**

Run:

```bash
PIXEL_BASE_URL="$PREVIEW_QA_IMMUTABLE_URL" PIXEL_ADB_SERIAL="$PIXEL_ADB_SERIAL" PIXEL_EXPECTED_CHROME_MAJOR="$PIXEL_EXPECTED_CHROME_MAJOR" VERCEL_AUTOMATION_BYPASS_SECRET="$VERCEL_AUTOMATION_BYPASS_SECRET" RELEASE_DEPLOYMENT_ID="$PREVIEW_QA_DEPLOYMENT_ID" RELEASE_COMMIT_SHA="$RELEASE_COMMIT_SHA" RELEASE_EVIDENCE_DIR="$RELEASE_EVIDENCE_DIR/preview-qa" node scripts/capture-pixel-motion.mjs
```

Expected: preflight identifies Pixel 6, Android 15, current stable Chrome, battery above 50%, power saver off, normal thermal status, and no recorder; three raw 30-second hero-through-manifesto traces are written; summary reports median FPS `>=55`, dropped frames `<5%`, and no traced primary-scroll task over `200 ms`. A replacement device requires `PIXEL_APPROVED_SLOWER_DEVICE_EVIDENCE_PATH` pointing inside the evidence directory to a schema-version-1 record with the exact connected model, `status:"approved"`, `comparison:"documented-slower-than-pixel-6"`, approval timestamp, and reviewer role. The script hashes and binds that file into the summary and manifest; a Boolean environment override cannot approve a device.

- [ ] **Step 9: Add performance as a required CI job**

Append this job to `.github/workflows/quality.yml`:

```yaml
  performance:
    name: quality / performance
    runs-on: ubuntu-24.04
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22.22.3
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npm run bundle:check
      - run: npm run lighthouse:ci
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: lighthouse-evidence
          path: .lighthouseci
          if-no-files-found: error
          retention-days: 14
```

- [ ] **Step 10: Re-run the complete local automated gate and commit**

Run: `npm test && npm run typecheck && npm run lint && npm run build && npm run bundle:check && npm run lighthouse:ci`

Expected: every command exits 0 and no budget is rounded up to pass.

```bash
git add lighthouserc.cjs scripts/lighthouse-auth.cjs lib/release/performance.mjs lib/release/performance.d.mts scripts/check-lighthouse-results.mjs scripts/check-bundle-budgets.mjs scripts/capture-pixel-motion.mjs tests/unit/release/performance-gates.test.ts .github/workflows/quality.yml
git commit -m "test: enforce release performance budgets"
```

### Task 6: Bind Preview QA and staged Production separately, promote without rebuilding, monitor exact thresholds, and make rollback executable

**Files:**
- Create: `lib/release/health.mjs`
- Create: `lib/release/health.d.mts`
- Create: `scripts/release-smoke.mjs`
- Create: `scripts/evaluate-release-health.mjs`
- Create: `tests/unit/release/release-health.test.ts`
- Create: `.github/workflows/release-candidate.yml`
- Create: `docs/operations/release-rollout-runbook.md`

**Interfaces:**
- Consumes: separately recorded Preview QA ID/URL/SHA, an explicitly authorized `vercel --prod --skip-domain` staged Production ID/URL/SHA, prior Production deployment ID, deployment-protection secret, public-contract verifier, staged Production Lighthouse baseline, Vercel Observability export, Brevo aggregate delivery evidence, and consent-gated GA4 safe-code aggregates.
- Produces: `assertDeploymentBinding(input)`, `assertHealthSampleBinding(sample, binding)`, `evaluateReleaseHealth(sample)`, read-only staged-candidate workflow, `preview-qa-metadata.json`, `candidate-metadata.json`, `production-smoke.json`, checkpoint health evidence bound to source exports and promotion time, explicit no-rebuild `vercel promote`, and executable `vercel rollback` commands.

- [ ] **Step 1: Write failing immutable-binding and rollback-threshold tests**

```ts
// tests/unit/release/release-health.test.ts
import { describe, expect, it } from "vitest";
import {
  assertDeploymentBinding,
  assertHealthSampleBinding,
  evaluateReleaseHealth,
} from "../../../lib/release/health.mjs";
import type { HealthMetrics, HealthSample } from "../../../lib/release/health.mjs";

const deployment = {
  id: "dpl_candidate123",
  url: "the-lion-company-candidate-abc.vercel.app",
  readyState: "READY",
  target: null,
  alias: [],
  meta: { githubCommitSha: "a".repeat(40) },
};
const stagedDeployment = { ...deployment, id: "dpl_stagedprod123", target: "production", alias: [] };

function healthy(): HealthMetrics {
  return {
    invariants: {
      homeAvailable: true, teachingsAvailable: true, privacyLeak: false,
      falseFormSuccess: false, wrongCanonical: false, accidentalNoindex: false,
      redirectLoop: false, coreActionFailure: false, consentOrCspBlocksCore: false,
    },
    fiveMinute: { requests: 500, errors5xx: 2 },
    fifteenMinute: { measuredSessions: 500, clientErrors: 4, identicalSafeCodeErrors: 2 },
    forms: { attempts: 40, accepted: 40, consecutiveFailures: 0 },
    lcp: { candidateMs: 2200, postPromotionRunsMs: [2200, 2250, 2300] },
  };
}

describe("immutable deployment binding", () => {
  it("accepts Preview QA and staged Production as separate ready deployments for the same exact Git SHA", () => {
    expect(assertDeploymentBinding({
      deployment,
      expectedDeploymentId: deployment.id,
      expectedCommitSha: "a".repeat(40),
      baseURL: `https://${deployment.url}`,
      mode: "preview-qa",
    })).toMatchObject({ deploymentId: deployment.id, commitSha: "a".repeat(40) });
    expect(assertDeploymentBinding({
      deployment: stagedDeployment,
      expectedDeploymentId: stagedDeployment.id,
      expectedCommitSha: "a".repeat(40),
      baseURL: `https://${stagedDeployment.url}`,
      mode: "staged-production",
    })).toMatchObject({ deploymentId: stagedDeployment.id, commitSha: "a".repeat(40) });
    expect(stagedDeployment.id).not.toBe(deployment.id);
  });

  it("rejects mutable aliases, custom domains on staging, wrong commits, and non-ready deployments", () => {
    expect(() => assertDeploymentBinding({ deployment, expectedDeploymentId: deployment.id, expectedCommitSha: "b".repeat(40), baseURL: `https://${deployment.url}`, mode: "preview-qa" })).toThrow(/Git SHA/);
    expect(() => assertDeploymentBinding({ deployment, expectedDeploymentId: deployment.id, expectedCommitSha: "a".repeat(40), baseURL: "https://branch-alias.vercel.app", mode: "preview-qa" })).toThrow(/immutable/);
    expect(() => assertDeploymentBinding({ deployment: { ...deployment, readyState: "ERROR" }, expectedDeploymentId: deployment.id, expectedCommitSha: "a".repeat(40), baseURL: `https://${deployment.url}`, mode: "preview-qa" })).toThrow(/READY/);
    expect(() => assertDeploymentBinding({ deployment: { ...stagedDeployment, alias: ["www.thelioncompany.org"] }, expectedDeploymentId: stagedDeployment.id, expectedCommitSha: "a".repeat(40), baseURL: `https://${stagedDeployment.url}`, mode: "staged-production" })).toThrow(/custom Production domain/);
  });
});

describe("release health", () => {
  it("binds checkpoint sources, deployment, SHA, and elapsed production time", () => {
    const sample: HealthSample = {
      ...healthy(),
      schemaVersion: 1,
      deploymentId: deployment.id,
      commitSha: "a".repeat(40),
      checkpoint: "15m",
      windowStartedAt: "2026-07-11T12:00:00.000Z",
      windowEndedAt: "2026-07-11T12:15:00.000Z",
      collectedAt: "2026-07-11T12:15:01.000Z",
      sourceArtifacts: (["vercel", "brevo", "ga4", "synthetic"] as const).map((kind) => ({ kind, path: `sources/${kind}.json`, sha256: "a".repeat(64) })),
    };
    expect(assertHealthSampleBinding(sample, {
      expectedDeploymentId: deployment.id,
      expectedCommitSha: "a".repeat(40),
      expectedCheckpoint: "15m",
      promotionRecordedAt: "2026-07-11T12:00:00.000Z",
      now: Date.parse("2026-07-11T12:16:00.000Z"),
    })).toMatchObject({ checkpointElapsedMinutes: 15 });
    expect(() => assertHealthSampleBinding({ ...sample, deploymentId: "dpl_other" }, {
      expectedDeploymentId: deployment.id, expectedCommitSha: "a".repeat(40), expectedCheckpoint: "15m",
      promotionRecordedAt: "2026-07-11T12:00:00.000Z", now: Date.parse("2026-07-11T12:16:00.000Z"),
    })).toThrow(/deployment/);
    expect(() => assertHealthSampleBinding({ ...sample, windowEndedAt: "2026-07-11T12:14:59.000Z" }, {
      expectedDeploymentId: deployment.id, expectedCommitSha: "a".repeat(40), expectedCheckpoint: "15m",
      promotionRecordedAt: "2026-07-11T12:00:00.000Z", now: Date.parse("2026-07-11T12:16:00.000Z"),
    })).toThrow(/elapsed/);
  });

  it("passes a healthy sample", () => {
    expect(evaluateReleaseHealth(healthy())).toEqual({ status: "pass", rollbackReasons: [] });
  });

  it.each([
    ["availability", (value: ReturnType<typeof healthy>) => { value.invariants.homeAvailable = false; }],
    ["privacy", (value: ReturnType<typeof healthy>) => { value.invariants.privacyLeak = true; }],
    ["false success", (value: ReturnType<typeof healthy>) => { value.invariants.falseFormSuccess = true; }],
    ["canonical", (value: ReturnType<typeof healthy>) => { value.invariants.wrongCanonical = true; }],
    ["noindex", (value: ReturnType<typeof healthy>) => { value.invariants.accidentalNoindex = true; }],
    ["redirect", (value: ReturnType<typeof healthy>) => { value.invariants.redirectLoop = true; }],
    ["core action", (value: ReturnType<typeof healthy>) => { value.invariants.coreActionFailure = true; }],
    ["consent/csp", (value: ReturnType<typeof healthy>) => { value.invariants.consentOrCspBlocksCore = true; }],
  ])("immediately rolls back for %s", (_label, mutate) => {
    const value = healthy(); mutate(value); expect(evaluateReleaseHealth(value).status).toBe("rollback");
  });

  it("uses exact statistical floors and strict comparisons", () => {
    const five = healthy(); five.fiveMinute = { requests: 100, errors5xx: 2 }; expect(evaluateReleaseHealth(five).status).toBe("rollback");
    const below = healthy(); below.fiveMinute = { requests: 99, errors5xx: 1 }; expect(evaluateReleaseHealth(below).status).toBe("pass");
    const client = healthy(); client.fifteenMinute = { measuredSessions: 100, clientErrors: 3, identicalSafeCodeErrors: 0 }; expect(evaluateReleaseHealth(client).status).toBe("rollback");
    const code = healthy(); code.fifteenMinute = { measuredSessions: 20, clientErrors: 1, identicalSafeCodeErrors: 10 }; expect(evaluateReleaseHealth(code).status).toBe("rollback");
    const forms = healthy(); forms.forms = { attempts: 20, accepted: 18, consecutiveFailures: 0 }; expect(evaluateReleaseHealth(forms).status).toBe("rollback");
    const consecutive = healthy(); consecutive.forms.consecutiveFailures = 3; expect(evaluateReleaseHealth(consecutive).status).toBe("rollback");
    const lcp = healthy(); lcp.lcp.postPromotionRunsMs = [2861, 2861, 2861]; expect(evaluateReleaseHealth(lcp).status).toBe("rollback");
    const boundary = healthy(); boundary.lcp.postPromotionRunsMs = [2860, 2860, 2860]; expect(evaluateReleaseHealth(boundary).status).toBe("pass");
  });
});
```

- [ ] **Step 2: Run the focused test and verify the missing evaluator fails**

Run: `npm test -- tests/unit/release/release-health.test.ts`

Expected: FAIL because `lib/release/health.mjs` does not exist.

- [ ] **Step 3: Implement immutable metadata and exact rollback evaluation**

```js
// lib/release/health.mjs
function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  invariant(sorted.length > 0, "median requires values");
  return sorted.length % 2 ? sorted[Math.floor(sorted.length / 2)] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
}

export function assertDeploymentBinding(input) {
  const deployment = input.deployment;
  invariant(deployment.id === input.expectedDeploymentId, "deployment ID mismatch");
  invariant(deployment.readyState === "READY", "deployment is not READY");
  const commitSha = deployment.meta?.githubCommitSha ?? deployment.gitSource?.sha;
  invariant(commitSha === input.expectedCommitSha, "deployment Git SHA mismatch");
  const host = new URL(input.baseURL).hostname;
  if (input.mode === "preview-qa") {
    invariant(host === deployment.url, "Preview QA URL is not the immutable deployment URL");
  } else if (input.mode === "staged-production") {
    invariant(host === deployment.url, "staged Production URL is not the immutable deployment URL");
    invariant(deployment.target === "production", "staged deployment was not built with Production environment settings");
    invariant(!(deployment.alias ?? []).some((alias) => alias === "www.thelioncompany.org" || alias === "thelioncompany.org"), "staged deployment already owns a custom Production domain");
  } else {
    invariant(host === "www.thelioncompany.org" && deployment.alias?.includes(host), "production canonical alias is not bound to the staged candidate deployment");
    invariant(deployment.target === "production", "canonical deployment is not a Production build");
  }
  return { deploymentId: deployment.id, commitSha, immutableURL: `https://${deployment.url}` };
}

const CHECKPOINT_MINUTES = { "15m": 15, "1h": 60, "24h": 1440, "72h": 4320, "7d": 10080 };

export function assertHealthSampleBinding(sample, input) {
  invariant(sample.schemaVersion === 1, "health sample schema mismatch");
  invariant(sample.deploymentId === input.expectedDeploymentId, "health sample deployment mismatch");
  invariant(sample.commitSha === input.expectedCommitSha, "health sample commit mismatch");
  invariant(sample.checkpoint === input.expectedCheckpoint, "health sample checkpoint mismatch");
  const checkpointElapsedMinutes = CHECKPOINT_MINUTES[input.expectedCheckpoint];
  invariant(checkpointElapsedMinutes, "unknown health checkpoint");
  const promotion = Date.parse(input.promotionRecordedAt);
  const started = Date.parse(sample.windowStartedAt);
  const ended = Date.parse(sample.windowEndedAt);
  const collected = Date.parse(sample.collectedAt);
  invariant(Number.isFinite(promotion) && Number.isFinite(started) && Number.isFinite(ended) && Number.isFinite(collected), "health sample has invalid timestamps");
  invariant(started === promotion, "health source window must start at bound production smoke");
  invariant(ended >= promotion + checkpointElapsedMinutes * 60_000, "health checkpoint elapsed time has not passed");
  invariant(collected >= ended && collected <= input.now + 5 * 60_000, "health collection time is outside its source window");
  const kinds = (sample.sourceArtifacts ?? []).map((artifact) => artifact.kind).sort();
  invariant(JSON.stringify(kinds) === JSON.stringify(["brevo", "ga4", "synthetic", "vercel"]), "health sample requires exact Vercel, Brevo, GA4, and synthetic sources");
  invariant(new Set(sample.sourceArtifacts.map((artifact) => artifact.path)).size === 4, "health sample source artifacts must be distinct");
  for (const artifact of sample.sourceArtifacts) {
    invariant(typeof artifact.path === "string" && artifact.path.length > 0, "health source artifact path is missing");
    invariant(/^[a-f0-9]{64}$/.test(artifact.sha256), "health source artifact hash is invalid");
  }
  return { checkpointElapsedMinutes, windowStartedAt: sample.windowStartedAt, windowEndedAt: sample.windowEndedAt, collectedAt: sample.collectedAt };
}

export function evaluateReleaseHealth(sample) {
  const reasons = [];
  const immediate = {
    homeAvailable: "home unavailable",
    teachingsAvailable: "teachings unavailable",
    privacyLeak: "privacy leak",
    falseFormSuccess: "false form success",
    wrongCanonical: "wrong canonical",
    accidentalNoindex: "accidental noindex",
    redirectLoop: "redirect loop",
    coreActionFailure: "primary navigation/live/give/store action failure",
    consentOrCspBlocksCore: "consent or CSP blocks core content/forms",
  };
  for (const [key, message] of Object.entries(immediate)) {
    const failed = key === "homeAvailable" || key === "teachingsAvailable" ? sample.invariants[key] !== true : sample.invariants[key] === true;
    if (failed) reasons.push(message);
  }
  const serverRate = sample.fiveMinute.errors5xx / Math.max(1, sample.fiveMinute.requests);
  if (serverRate > 0.01 && (sample.fiveMinute.requests >= 100 || sample.fiveMinute.errors5xx >= 5)) reasons.push("5xx rate above 1 percent for five minutes with sample floor");
  const clientRate = sample.fifteenMinute.clientErrors / Math.max(1, sample.fifteenMinute.measuredSessions);
  if ((clientRate > 0.02 && sample.fifteenMinute.measuredSessions >= 100) || sample.fifteenMinute.identicalSafeCodeErrors >= 10) reasons.push("client error threshold exceeded");
  const deliveryRate = sample.forms.accepted / Math.max(1, sample.forms.attempts);
  if (sample.forms.consecutiveFailures >= 3 || (sample.forms.attempts >= 20 && deliveryRate < 0.95)) reasons.push("form delivery threshold exceeded");
  invariant(sample.lcp.postPromotionRunsMs.length === 3, "LCP health sample requires three identical post-promotion runs");
  if (median(sample.lcp.postPromotionRunsMs) > sample.lcp.candidateMs * 1.3) reasons.push("LCP regressed more than 30 percent from approved candidate");
  return { status: reasons.length ? "rollback" : "pass", rollbackReasons: reasons };
}
```

```ts
// lib/release/health.d.mts
export type DeploymentMetadata = {
  id: string;
  url: string;
  readyState: string;
  target?: string | null;
  alias?: string[];
  meta?: { githubCommitSha?: string };
  gitSource?: { sha?: string };
};
export type HealthMetrics = {
  invariants: {
    homeAvailable: boolean; teachingsAvailable: boolean; privacyLeak: boolean;
    falseFormSuccess: boolean; wrongCanonical: boolean; accidentalNoindex: boolean;
    redirectLoop: boolean; coreActionFailure: boolean; consentOrCspBlocksCore: boolean;
  };
  fiveMinute: { requests: number; errors5xx: number };
  fifteenMinute: { measuredSessions: number; clientErrors: number; identicalSafeCodeErrors: number };
  forms: { attempts: number; accepted: number; consecutiveFailures: number };
  lcp: { candidateMs: number; postPromotionRunsMs: [number, number, number] };
};
export type HealthSample = HealthMetrics & {
  schemaVersion: 1;
  deploymentId: string;
  commitSha: string;
  checkpoint: "15m" | "1h" | "24h" | "72h" | "7d";
  windowStartedAt: string;
  windowEndedAt: string;
  collectedAt: string;
  sourceArtifacts: Array<{ kind: "vercel" | "brevo" | "ga4" | "synthetic"; path: string; sha256: string }>;
};
export function median(values: readonly number[]): number;
export function assertDeploymentBinding(input: {
  deployment: DeploymentMetadata;
  expectedDeploymentId: string;
  expectedCommitSha: string;
  baseURL: string;
  mode: "preview-qa" | "staged-production" | "production";
}): { deploymentId: string; commitSha: string; immutableURL: string };
export function assertHealthSampleBinding(sample: HealthSample, input: {
  expectedDeploymentId: string;
  expectedCommitSha: string;
  expectedCheckpoint: HealthSample["checkpoint"];
  promotionRecordedAt: string;
  now: number;
}): { checkpointElapsedMinutes: number; windowStartedAt: string; windowEndedAt: string; collectedAt: string };
export function evaluateReleaseHealth(sample: HealthMetrics): { status: "pass" | "rollback"; rollbackReasons: string[] };
```

- [ ] **Step 4: Implement separate Preview QA, staged Production, and canonical Production smoke modes**

```js
// scripts/release-smoke.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { indexableStaticRoutes } from "../config/routes.ts";
import { legacyRouteLedger } from "../config/redirects.ts";
import { destinationRegistry } from "../content/destinations.ts";
import { getPublishedPodcastEpisodes } from "../lib/media/podcast-feed.ts";
import { assertDeploymentBinding } from "../lib/release/health.mjs";
import { checkPublicContracts } from "./lib/public-contracts.mjs";

const required = ["RELEASE_BASE_URL", "RELEASE_MODE", "RELEASE_DEPLOYMENT_ID", "RELEASE_COMMIT_SHA", "VERCEL_ACCESS_TOKEN", "VERCEL_TEAM_ID", "RELEASE_EVIDENCE_DIR"];
for (const name of required) if (!process.env[name]) throw new Error(`${name} is required`);
const mode = process.env.RELEASE_MODE;
if (!new Set(["preview-qa", "staged-production", "production"]).has(mode)) throw new Error("RELEASE_MODE must be preview-qa, staged-production, or production");
const base = new URL(process.env.RELEASE_BASE_URL);
const endpoint = new URL(`https://api.vercel.com/v13/deployments/${encodeURIComponent(process.env.RELEASE_DEPLOYMENT_ID)}`);
endpoint.searchParams.set("teamId", process.env.VERCEL_TEAM_ID);
const metadataResponse = await fetch(endpoint, { headers: { authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}` }, signal: AbortSignal.timeout(15_000) });
if (!metadataResponse.ok) throw new Error(`Vercel deployment API returned ${metadataResponse.status}`);
const deployment = await metadataResponse.json();
const binding = assertDeploymentBinding({
  deployment,
  expectedDeploymentId: process.env.RELEASE_DEPLOYMENT_ID,
  expectedCommitSha: process.env.RELEASE_COMMIT_SHA,
  baseURL: process.env.RELEASE_BASE_URL,
  mode,
});
const publicResult = await checkPublicContracts({
  baseURL: process.env.RELEASE_BASE_URL,
  mode: mode === "preview-qa" ? "preview" : mode,
  deploymentId: binding.deploymentId,
  commitSha: binding.commitSha,
  staticRoutes: indexableStaticRoutes,
  podcastSlugs: getPublishedPodcastEpisodes().map((episode) => episode.slug),
  legacyRouteLedger,
  destinations: destinationRegistry,
  protectionSecret: process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
  checkExternal: mode !== "preview-qa",
  evidenceDir: process.env.RELEASE_EVIDENCE_DIR,
});
let protectionCookie = null;
if (mode !== "production") {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (!secret || base.protocol !== "https:" || !base.hostname.endsWith(".vercel.app") || base.username || base.password) throw new Error("protected immutable deployment requires an exact HTTPS Vercel URL and automation secret");
  const seed = await fetch(new URL("/", base), {
    redirect: "manual",
    signal: AbortSignal.timeout(12_000),
    headers: { "x-vercel-protection-bypass": secret, "x-vercel-set-bypass-cookie": "true" },
  });
  if (seed.status !== 200 || seed.headers.has("location")) throw new Error(`deployment-protection seed returned ${seed.status}`);
  const setCookies = seed.headers.getSetCookie?.() ?? [seed.headers.get("set-cookie")].filter(Boolean);
  protectionCookie = setCookies.find((value) => /^_vercel_jwt=/i.test(value))?.match(/^(_vercel_jwt=[^;]+)/i)?.[1] ?? null;
  if (!protectionCookie) throw new Error("origin-scoped Vercel bypass cookie was not returned");
}
const primaryPaths = ["/", "/teachings", "/podcast", "/connect", "/prayer", "/store", "/give", "/privacy", "/terms", "/accessibility", "/robots.txt", "/sitemap.xml"];
for (const path of primaryPaths) {
  const url = new URL(path, base);
  if (url.origin !== base.origin) throw new Error("primary smoke URL escaped the bound deployment origin");
  const response = await fetch(url, {
    headers: protectionCookie ? { cookie: protectionCookie } : {},
    redirect: "manual", signal: AbortSignal.timeout(12_000),
  });
  if (response.status !== 200) throw new Error(`${path} returned ${response.status}`);
}
await mkdir(process.env.RELEASE_EVIDENCE_DIR, { recursive: true });
if (mode === "production") {
  const canonicalCases = [
    { gate: "canonical-http-apex", url: "http://thelioncompany.org/privacy?utm_source=release", status: 308, location: "https://www.thelioncompany.org/privacy?utm_source=release" },
    { gate: "canonical-http-www", url: "http://www.thelioncompany.org/privacy?utm_source=release", status: 308, location: "https://www.thelioncompany.org/privacy?utm_source=release" },
    { gate: "canonical-https-apex", url: "https://thelioncompany.org/privacy?utm_source=release", status: 308, location: "https://www.thelioncompany.org/privacy?utm_source=release" },
    { gate: "canonical-https-www", url: "https://www.thelioncompany.org/privacy?utm_source=release", status: 200, location: null },
  ];
  for (const item of canonicalCases) {
    const response = await fetch(item.url, { redirect: "manual", signal: AbortSignal.timeout(12_000) });
    const location = response.headers.get("location");
    if (response.status !== item.status || (item.location ? new URL(location ?? "", item.url).toString() !== item.location : location !== null)) {
      throw new Error(`${item.gate} failed exact one-hop canonical contract`);
    }
    await writeFile(resolve(process.env.RELEASE_EVIDENCE_DIR, `${item.gate}.json`), `${JSON.stringify({
      schemaVersion: 1, gate: item.gate, status: "pass", recordedAt: new Date().toISOString(),
      deploymentScope: "production", deploymentId: binding.deploymentId, commitSha: binding.commitSha,
      assertions: [item.location ? "one 308 hop reaches the exact HTTPS www path and query" : "canonical HTTPS www returns 200 without redirect"],
      metrics: { input: item.url, httpStatus: response.status, redirectHops: item.location ? 1 : 0, location: item.location },
    }, null, 2)}\n`, { mode: 0o600 });
  }
}
const gate = mode === "preview-qa" ? "preview-qa-metadata" : mode === "staged-production" ? "candidate-metadata" : "production-smoke";
const evidence = {
  schemaVersion: 1,
  gate,
  status: "pass",
  recordedAt: new Date().toISOString(),
  deploymentScope: mode,
  deploymentId: binding.deploymentId,
  commitSha: binding.commitSha,
  assertions: mode === "preview-qa"
    ? ["Preview QA deployment READY", "immutable Preview URL matches deployment", "Git SHA matches Preview QA", "report-only Preview contracts pass"]
    : mode === "staged-production"
      ? ["staged Production deployment READY", "immutable generated URL matches deployment", "Production target and Git SHA match", "no custom Production domain is assigned", "Deployment Protection challenges unauthenticated access", "enforced Production public/static contracts pass without form mutation"]
      : ["www alias points to the same staged Production deployment ID", "Git SHA matches the staged candidate without rebuild", "primary routes, redirects, canonical, robots, sitemap, schema, links, and security headers pass"],
  metrics: { primaryRoutes: primaryPaths.length, publicAssertions: publicResult.assertions.length },
  immutableURL: binding.immutableURL,
  aliases: deployment.alias ?? [],
};
await writeFile(resolve(process.env.RELEASE_EVIDENCE_DIR, `${evidence.gate}.json`), `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({ status: "pass", gate: evidence.gate, deploymentId: binding.deploymentId, commitSha: binding.commitSha }));
```

- [ ] **Step 5: Implement checkpoint health evaluation**

```js
// scripts/evaluate-release-health.mjs
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { assertHealthSampleBinding, evaluateReleaseHealth } from "../lib/release/health.mjs";

const required = ["RELEASE_HEALTH_SAMPLE_PATH", "RELEASE_PRODUCTION_SMOKE_PATH", "RELEASE_CHECKPOINT", "RELEASE_DEPLOYMENT_ID", "RELEASE_COMMIT_SHA", "RELEASE_EVIDENCE_DIR"];
for (const name of required) if (!process.env[name]) throw new Error(`${name} is required`);
if (!new Set(["15m", "1h", "24h", "72h", "7d"]).has(process.env.RELEASE_CHECKPOINT)) throw new Error("invalid RELEASE_CHECKPOINT");
const evidenceRoot = resolve(process.env.RELEASE_EVIDENCE_DIR);
const samplePath = resolve(process.env.RELEASE_HEALTH_SAMPLE_PATH);
const productionPath = resolve(process.env.RELEASE_PRODUCTION_SMOKE_PATH);
for (const path of [samplePath, productionPath]) if (!path.startsWith(`${evidenceRoot}/`)) throw new Error("health inputs must stay inside the release evidence directory");
const sampleBytes = await readFile(samplePath);
const sample = JSON.parse(sampleBytes.toString("utf8"));
const production = JSON.parse(await readFile(productionPath, "utf8"));
if (production.gate !== "production-smoke" || production.status !== "pass" || production.deploymentScope !== "production" || production.deploymentId !== process.env.RELEASE_DEPLOYMENT_ID || production.commitSha !== process.env.RELEASE_COMMIT_SHA) {
  throw new Error("production smoke is not bound to this health sample");
}
const binding = assertHealthSampleBinding(sample, {
  expectedDeploymentId: process.env.RELEASE_DEPLOYMENT_ID,
  expectedCommitSha: process.env.RELEASE_COMMIT_SHA,
  expectedCheckpoint: process.env.RELEASE_CHECKPOINT,
  promotionRecordedAt: production.recordedAt,
  now: Date.now(),
});
const artifacts = [];
for (const artifact of sample.sourceArtifacts) {
  const path = resolve(evidenceRoot, artifact.path);
  if (!path.startsWith(`${evidenceRoot}/`)) throw new Error(`health source escapes evidence directory: ${artifact.path}`);
  const bytes = await readFile(path);
  const source = JSON.parse(bytes.toString("utf8"));
  if (source.schemaVersion !== 1 || source.source !== artifact.kind || source.deploymentId !== process.env.RELEASE_DEPLOYMENT_ID || source.commitSha !== process.env.RELEASE_COMMIT_SHA || Date.parse(source.windowStartedAt) !== Date.parse(sample.windowStartedAt) || Date.parse(source.windowEndedAt) !== Date.parse(sample.windowEndedAt)) {
    throw new Error(`health source envelope mismatch: ${artifact.path}`);
  }
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== artifact.sha256) throw new Error(`health source hash mismatch: ${artifact.path}`);
  artifacts.push({ path: relative(evidenceRoot, path), sha256 });
}
artifacts.push({ path: relative(evidenceRoot, samplePath), sha256: createHash("sha256").update(sampleBytes).digest("hex") });
const result = evaluateReleaseHealth(sample);
const evidence = {
  schemaVersion: 1,
  gate: `observability-${process.env.RELEASE_CHECKPOINT}`,
  status: result.status === "pass" ? "pass" : "fail",
  recordedAt: binding.collectedAt,
  deploymentScope: "production",
  deploymentId: process.env.RELEASE_DEPLOYMENT_ID,
  commitSha: process.env.RELEASE_COMMIT_SHA,
  assertions: result.status === "pass" ? ["availability and invariant checks pass", "5xx/client/form/LCP thresholds remain below rollback gates"] : result.rollbackReasons,
  metrics: {
    checkpointElapsedMinutes: binding.checkpointElapsedMinutes,
    sourceWindowStartedAt: binding.windowStartedAt,
    sourceWindowEndedAt: binding.windowEndedAt,
    sourceArtifacts: artifacts.length,
    requests5m: sample.fiveMinute.requests,
    errors5xx5m: sample.fiveMinute.errors5xx,
    measuredSessions15m: sample.fifteenMinute.measuredSessions,
    clientErrors15m: sample.fifteenMinute.clientErrors,
    formAttempts: sample.forms.attempts,
    formAccepted: sample.forms.accepted,
  },
  artifacts,
};
await mkdir(process.env.RELEASE_EVIDENCE_DIR, { recursive: true });
await writeFile(resolve(process.env.RELEASE_EVIDENCE_DIR, `${evidence.gate}.json`), `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({ status: evidence.status, rollbackReasons: result.rollbackReasons }));
if (result.status === "rollback") process.exitCode = 2;
```

- [ ] **Step 6: Add a read-only staged Production candidate workflow**

```yaml
# .github/workflows/release-candidate.yml
name: release-candidate

on:
  workflow_dispatch:
    inputs:
      deployment_id:
        description: Authorized staged Production deployment ID
        required: true
        type: string
      immutable_url:
        description: Exact staged Production https .vercel.app URL
        required: true
        type: string
      commit_sha:
        description: Exact 40-character Git SHA
        required: true
        type: string
      preview_qa_deployment_id:
        description: Separately verified Preview QA deployment ID for the same SHA
        required: true
        type: string

permissions:
  contents: read

jobs:
  verify:
    name: release-candidate / staged-production verification
    runs-on: ubuntu-24.04
    timeout-minutes: 45
    env:
      RELEASE_BASE_URL: ${{ inputs.immutable_url }}
      PLAYWRIGHT_BASE_URL: ${{ inputs.immutable_url }}
      LIGHTHOUSE_BASE_URL: ${{ inputs.immutable_url }}
      RELEASE_MODE: staged-production
      SITE_CHECK_MODE: staged-production
      RELEASE_DEPLOYMENT_SCOPE: staged-production
      RELEASE_DEPLOYMENT_ID: ${{ inputs.deployment_id }}
      RELEASE_COMMIT_SHA: ${{ inputs.commit_sha }}
      PREVIEW_QA_DEPLOYMENT_ID: ${{ inputs.preview_qa_deployment_id }}
      RELEASE_EVIDENCE_DIR: .private-release-evidence/candidate
      VERCEL_ACCESS_TOKEN: ${{ secrets.VERCEL_ACCESS_TOKEN }}
      VERCEL_TEAM_ID: ${{ secrets.VERCEL_TEAM_ID }}
      VERCEL_AUTOMATION_BYPASS_SECRET: ${{ secrets.VERCEL_AUTOMATION_BYPASS_SECRET }}
    steps:
      - uses: actions/checkout@v4
        with: { ref: "${{ inputs.commit_sha }}" }
      - uses: actions/setup-node@v4
        with:
          node-version: 22.22.3
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium firefox webkit
      - run: npm run release:smoke
      - run: npm run test:e2e:release -- --grep-invert "@canonical-form-e2e|@canonical-consent"
      - run: npm run lighthouse:ci
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: staged-production-candidate-evidence
          path: |
            .private-release-evidence/candidate
            playwright-report
            test-results/playwright
          if-no-files-found: error
          retention-days: 14
```

- [ ] **Step 7: Write the exact rollout, alert, monitoring, and rollback runbook**

```markdown
<!-- docs/operations/release-rollout-runbook.md -->
# The Gathering rollout and rollback runbook

## Roles and immutable inputs

Restricted evidence names one release owner and one rollback backup who both have Vercel project permission and provider alert access. Record the current Production deployment as `ROLLBACK_DEPLOYMENT_ID`; the ordinary Preview QA ID and immutable URL; the staged Production ID and generated immutable URL; one exact 40-character Git SHA shared by both deployments; the staged Production Lighthouse median; monitoring links; and alert recipients. Do not store names, tokens, cookies, or credential-bearing links in Git. Never describe the Preview QA deployment as the Production candidate.

## Preview QA proof

Run `vercel inspect "$PREVIEW_QA_DEPLOYMENT_ID" --format=json --wait --timeout 3m --scope "$VERCEL_TEAM_ID" --token "$VERCEL_ACCESS_TOKEN"` and retain the restricted output. Against `$PREVIEW_QA_IMMUTABLE_URL`, run `RELEASE_MODE=preview-qa npm run release:smoke`, all browser projects, public external links, the full form volume/rate-limit/outage suite with no-send/test-recipient resources, isolated Brevo DOI lifecycle, Lighthouse, physical Pixel traces, privacy canary/log scan, retention validator, keyboard/VoiceOver/NVDA/zoom matrix, and rollback rehearsal. Record `preview-qa-metadata.json` with the Preview ID and SHA. A branch alias is never evidence.

## Pre-freeze legacy reconciliation

Before code freeze, export the finite historical URL sets from Search Console pages/links, GA4 landing pages, Wix history, known backlink reports, and Vercel request logs. Redact account and visitor data, hash all five restricted exports, and reconcile every discovered path into `legacyRouteLedger` with an explicit one-hop 308, 410, or genuine 404 outcome. Record `legacy-reconciliation.json` only after a reviewer confirms all five sources are present, their extraction windows are dated, discovered-path and ledger-outcome counts balance, and no unknown historical URL is bulk-redirected to home. A missing or inaccessible source is a failed gate, not an empty export.

## Explicit production-candidate authorization and staged deployment

Stop after Preview QA and obtain explicit production-candidate authorization. This approval is required because the next command uses Production environment variables and may connect to live resources. From a clean checkout of the approved SHA, create a staged Production deployment without assigning custom domains:

```bash
npx vercel@55.0.0 --prod --skip-domain --yes --scope "$VERCEL_TEAM_ID" --token "$VERCEL_ACCESS_TOKEN"
```

Capture the generated `.vercel.app` URL and deployment ID as `STAGED_PRODUCTION_IMMUTABLE_URL` and `STAGED_PRODUCTION_DEPLOYMENT_ID`. Inspect that exact ID and stop unless it is `READY`, uses the approved SHA and Production target, has no `www.thelioncompany.org` or apex alias, and its generated URL returns a Vercel Deployment Protection challenge without authentication. If the generated URL cannot remain protected, stop; do not expose a live-resource candidate publicly.

## Staged Production proof

Against the exact protected staged URL, run `RELEASE_MODE=staged-production npm run release:smoke`, enforced-CSP/public/static/redirect/404/schema/link checks, JavaScript-disabled and non-mutating browser/accessibility paths, external destinations, Lighthouse, bundle/transfer/long-task gates, approved visuals, and physical-device motion. Use only an exact-origin bypass cookie; never global bypass headers. Do not submit a form, spoof `Origin`, add the staged hostname to Production allowlists, or weaken Turnstile: Production form handlers intentionally accept only `https://www.thelioncompany.org`. `candidate-metadata.json`, `public-contracts-staged-production.json`, `lighthouse-summary.json`, `pixel-motion-summary.json`, and staged browser evidence all bind this staged ID and SHA. The release record also names the separate Preview QA ID/SHA.

## Alert configuration

Vercel Observability supplies request count, availability, function status, latency, and 5xx rate. Brevo accepted-message IDs and synthetic restricted-mailbox checks supply delivery; record only hashed IDs and aggregate states. Consent-gated GA4 `client_error` supplies measured-session safe-code rate; uncaught smoke console errors block regardless of sample size.

Configure the release owner and backup to receive: any availability loss; five-minute 5xx rate above 1%; three consecutive provider failures; function errors for form endpoints; and synthetic canonical/robots/sitemap/route failure. Confirm both recipients received a test alert before promotion.

## Explicit promotion approval and no-rebuild promotion

Stop and obtain explicit promotion approval after the launch evidence validator passes for the staged Production ID/SHA. Assign the canonical domain to that already built deployment:

```bash
npx vercel@55.0.0 promote "$STAGED_PRODUCTION_DEPLOYMENT_ID" --yes --timeout 3m --scope "$VERCEL_TEAM_ID" --token "$VERCEL_ACCESS_TOKEN"
```

Immediately inspect `https://www.thelioncompany.org` and stop unless it resolves to the identical staged deployment ID and Git SHA. A different deployment ID means a rebuild or wrong target: invalidate the candidate and restart staged-candidate gates. Do not redeploy, rebuild, merge another commit, change DNS, or change environment variables during promotion.

## Immediate production smoke

Run `RELEASE_MODE=production RELEASE_BASE_URL=https://www.thelioncompany.org npm run release:smoke` against the identical staged deployment ID/SHA. Execute the four finite host outcomes with a preserved test path and query: `http://thelioncompany.org`, `http://www.thelioncompany.org`, and `https://thelioncompany.org` must each return one 308 directly to the matching `https://www.thelioncompany.org` URL, while `https://www.thelioncompany.org` returns 200 without a redirect. Record one evidence file per host outcome. Run `RELEASE_MODE=production PLAYWRIGHT_BASE_URL=https://www.thelioncompany.org npx playwright test tests/e2e/release/experience-matrix.spec.ts --grep @canonical-consent`; bind its report to `production-consent.json`. It must prove host-only and `.thelioncompany.org` GA cookie withdrawal, grant, revoke, re-grant, and cross-tab synchronization. In a clean real browser also verify mobile navigation, reduced motion, prompt caps, TikTok, YouTube, all podcast platforms, social channels, Printify, and Subsplash. Then submit one visibly synthetic real newsletter DOI, one prayer, and one contact message with fresh Production Turnstile tokens; require provider acceptance, real mailbox arrival, no false success, and scheduled deletion. These are the first live-provider form E2E checks and any failure triggers immediate rollback. Hash provider IDs before recording. Submit the sitemap through Search Console only after canonical and robots pass.

## Monitoring cadence

Run canonical, robots, sitemap, primary-route, and redirect synthetic HTTP checks every five minutes for the first 24 hours, then every 30 minutes through day seven. Record health checkpoints at 15 minutes, one hour, 24 hours, 72 hours, and seven days. Three identical post-promotion Lighthouse runs form the immediate LCP comparison. Export the consent-gated GA4 home-only `web_vital` aggregate only after both seven elapsed days and at least 200 home views with a final INP measurement; require field INP p75 `<=200 ms`. Record the GA report's UTC start/end timestamps, with the start no earlier than the bound production smoke and the interval at least seven days. If the sample floor is missing at day seven, record a non-passing pending note outside `field-inp.json`, continue monitoring, and keep the full objective open until the floor and threshold pass. Never fabricate or round a field sample.

At each checkpoint, place privacy-safe aggregate Vercel, Brevo, GA4, and synthetic-monitor exports inside the release evidence directory and hash them. Redact or aggregate away IPs, addresses, request URLs/query values, provider IDs, cookies, user agents, message content, and account names before they enter that directory. Each source envelope names the promoted staged deployment ID, SHA, and same UTC window. Set `RELEASE_CHECKPOINT` to one of `15m`, `1h`, `24h`, `72h`, or `7d`; create `sources/health-${RELEASE_CHECKPOINT}-sample.json` with the same deployment ID/SHA, checkpoint, `windowStartedAt` equal to `production-smoke.json.recordedAt`, sufficient `windowEndedAt`, collection time, four typed source paths/hashes, and aggregate thresholds. Run `RELEASE_PRODUCTION_SMOKE_PATH="$RELEASE_EVIDENCE_DIR/production-smoke.json" RELEASE_HEALTH_SAMPLE_PATH="$RELEASE_EVIDENCE_DIR/sources/health-${RELEASE_CHECKPOINT}-sample.json" npm run release:health`. The evaluator rejects pre-promotion, differently deployed, unhashed, missing-source, or out-of-directory input.

Rollback thresholds are exact: immediate invariant failures have no sample floor; 5xx requires a rate above 1% plus at least 100 requests or five errors in five minutes; client errors require above 2% with at least 100 measured sessions or ten identical safe-code errors in 15 minutes; form delivery requires three consecutive failures or below 95% after at least 20 attempts; LCP requires the median of three identical runs to exceed the candidate by more than 30%.

## Rollback

For any rollback verdict, announce the safe reason without user content, preserve provider evidence, and run:

```bash
npx vercel@55.0.0 rollback "$ROLLBACK_DEPLOYMENT_ID" --yes --timeout 3m --scope "$VERCEL_TEAM_ID" --token "$VERCEL_ACCESS_TOKEN"
```

Then run production smoke against the restored deployment, confirm canonical/robots/forms/core actions, and open an incident record containing timestamps, deployment IDs, safe error classes, aggregate metrics, and remediation owner. Do not change DNS, delete submissions, paste form content, or suppress the evidence that triggered rollback.
```

- [ ] **Step 8: Verify Preview QA and the separately authorized staged Production candidate**

Run:

```bash
npm test -- tests/unit/release/release-health.test.ts
RELEASE_BASE_URL="$PREVIEW_QA_IMMUTABLE_URL" RELEASE_MODE=preview-qa RELEASE_DEPLOYMENT_ID="$PREVIEW_QA_DEPLOYMENT_ID" RELEASE_COMMIT_SHA="$RELEASE_COMMIT_SHA" VERCEL_ACCESS_TOKEN="$VERCEL_ACCESS_TOKEN" VERCEL_TEAM_ID="$VERCEL_TEAM_ID" VERCEL_AUTOMATION_BYPASS_SECRET="$VERCEL_AUTOMATION_BYPASS_SECRET" RELEASE_EVIDENCE_DIR="$RELEASE_EVIDENCE_DIR/preview-qa" npm run release:smoke
# Only after the explicit production-candidate authorization and `vercel --prod --skip-domain` step:
RELEASE_BASE_URL="$STAGED_PRODUCTION_IMMUTABLE_URL" RELEASE_MODE=staged-production RELEASE_DEPLOYMENT_ID="$STAGED_PRODUCTION_DEPLOYMENT_ID" RELEASE_COMMIT_SHA="$RELEASE_COMMIT_SHA" VERCEL_ACCESS_TOKEN="$VERCEL_ACCESS_TOKEN" VERCEL_TEAM_ID="$VERCEL_TEAM_ID" VERCEL_AUTOMATION_BYPASS_SECRET="$VERCEL_AUTOMATION_BYPASS_SECRET" RELEASE_EVIDENCE_DIR="$RELEASE_EVIDENCE_DIR" npm run release:smoke
```

Expected: thresholds pass; both deployments are `READY`, protected, immutable, and bound to the same SHA but different IDs. Preview HTML is `noindex,nofollow` with report-only CSP and writes `preview-qa-metadata.json`. Staged Production uses enforced CSP and Production canonical/robots behavior, has no custom domain, performs no form mutation, and writes `candidate-metadata.json` bound to the staged ID.

- [ ] **Step 9: Rehearse rollback authority without mutating production**

Run:

```bash
npx vercel@55.0.0 inspect "$ROLLBACK_DEPLOYMENT_ID" --format=json --wait --timeout 3m --scope "$VERCEL_TEAM_ID" --token "$VERCEL_ACCESS_TOKEN"
npx vercel@55.0.0 rollback --help
```

Expected: the recorded prior deployment is `READY`; the authenticated release owner and backup can inspect it; CLI help confirms `rollback url|deploymentId`, `--yes`, and `--timeout`. Do not invoke rollback during rehearsal.

- [ ] **Step 10: Commit release control without promoting**

```bash
git add lib/release/health.mjs lib/release/health.d.mts scripts/release-smoke.mjs scripts/evaluate-release-health.mjs tests/unit/release/release-health.test.ts .github/workflows/release-candidate.yml docs/operations/release-rollout-runbook.md
git commit -m "ops: bind immutable release and rollback gates"
```

### Task 7: Seal a requirement-by-requirement launch and seven-day completion record

**Files:**
- Create: `lib/release/evidence.mjs`
- Create: `lib/release/evidence.d.mts`
- Create: `scripts/record-manual-gate.mjs`
- Create: `scripts/seal-release-evidence.mjs`
- Create: `scripts/verify-completion-evidence.mjs`
- Create: `tests/unit/release/completion-evidence.test.ts`
- Create: `docs/release/completion-evidence-matrix.md`

**Interfaces:**
- Consumes: every automated evidence envelope from Tasks 1–6, privacy-safe manually reviewed gate records with attachment hashes, separate Preview QA and staged Production deployment IDs, their exact shared Git SHA, canonical Production binding to the staged ID, the 15m/1h/24h/72h/7d health checkpoints, and a GA4 aggregate export for the consent-gated home-only INP event.
- Produces: exactly 20 finite `LAUNCH_GATES`, exactly 35 finite `CLOSEOUT_GATES`, `verifyEvidenceDirectory(directory, phase)`, a SHA-256 `manifest.json` bound to both deployment IDs and their shared SHA, `--phase=launch` pre-promotion proof, and `--phase=closeout` full-goal proof that cannot pass with a missing requirement or mismatched scope/deployment.

- [ ] **Step 1: Write the failing completion-audit tests**

```ts
// tests/unit/release/completion-evidence.test.ts
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CLOSEOUT_GATES,
  LAUNCH_GATES,
  sealEvidenceDirectory,
  verifyEvidenceDirectory,
} from "../../../lib/release/evidence.mjs";

const deploymentId = "dpl_candidate123";
const previewDeploymentId = "dpl_previewqa123";
const commitSha = "a".repeat(40);

function gate(directory: string, definition: { file: string; gate: string; scope: "preview-qa" | "staged-production" | "production" }) {
  const promotionRecordedAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();
  const gateDirectory = join(directory, dirname(definition.file));
  mkdirSync(gateDirectory, { recursive: true });
  const manual = new Set([
    "automated-checks", "browser-matrix", "accessibility-manual", "external-destinations",
    "form-soak-volume", "form-soak-rate-limit-prayer", "form-soak-rate-limit-contact",
    "form-soak-rate-limit-newsletter", "form-soak-outage", "brevo-doi-lifecycle", "retention", "rollback-readiness",
    "legacy-reconciliation", "production-consent", "production-forms", "search-console", "field-inp",
  ]).has(definition.gate);
  const artifact = `${definition.gate}-artifact.txt`;
  const artifacts: Array<{ path: string; sha256: string }> = [];
  if (manual) {
    const names = definition.gate === "legacy-reconciliation"
      ? ["search-console", "ga4-landing-pages", "wix-history", "backlinks", "vercel-logs"].map((source) => `legacy-${source}.json`)
      : [artifact];
    for (const name of names) {
      const value = `${definition.gate} restricted evidence`;
      writeFileSync(join(gateDirectory, name), value);
      artifacts.push({ path: name, sha256: createHash("sha256").update(value).digest("hex") });
    }
  }
  const elapsed: Record<string, number> = {
    "observability-15m": 15,
    "observability-1h": 60,
    "observability-24h": 1440,
    "observability-72h": 4320,
    "observability-7d": 10080,
  };
  const metrics = definition.gate === "field-inp"
    ? { measuredHomeViews: 200, inpP75Ms: 200, measurementStartedAt: promotionRecordedAt, measurementEndedAt: now }
    : definition.gate === "pii-canary-scan"
      ? { hits: 0, realHandlerPosts: 3, boundLogWindow: true, logExportSha256: "a".repeat(64) }
      : elapsed[definition.gate]
        ? { checkpointElapsedMinutes: elapsed[definition.gate], sourceWindowStartedAt: promotionRecordedAt, sourceWindowEndedAt: now, sourceArtifacts: 5 }
        : undefined;
  if (elapsed[definition.gate]) {
    for (let index = 1; index <= 5; index += 1) {
      const path = `${definition.gate}-source-${index}.json`;
      const value = JSON.stringify({ gate: definition.gate, source: index });
      writeFileSync(join(gateDirectory, path), value);
      artifacts.push({ path, sha256: createHash("sha256").update(value).digest("hex") });
    }
  }
  const gatePath = join(directory, definition.file);
  writeFileSync(gatePath, JSON.stringify({
    schemaVersion: 1,
    gate: definition.gate,
    status: "pass",
    recordedAt: definition.gate === "production-smoke" ? promotionRecordedAt : now,
    deploymentScope: definition.scope,
    deploymentId: definition.scope === "preview-qa" ? previewDeploymentId : deploymentId,
    commitSha,
    assertions: [`${definition.gate} authoritative assertion`],
    ...(metrics ? { metrics } : {}),
    ...(manual ? {
      manual: true,
      reviewerRole: "release reviewer",
    } : {}),
    ...(artifacts.length ? { artifacts } : {}),
  }));
}

function complete(phase: "launch" | "closeout") {
  const directory = mkdtempSync(join(tmpdir(), "tlc-release-evidence-"));
  for (const definition of phase === "launch" ? LAUNCH_GATES : CLOSEOUT_GATES) gate(directory, definition);
  return directory;
}

describe("completion evidence", () => {
  it("keeps the approved finite gate registry and deployment scopes explicit", () => {
    expect(LAUNCH_GATES).toHaveLength(20);
    expect(CLOSEOUT_GATES).toHaveLength(35);
    expect(LAUNCH_GATES.some((gate) => gate.scope === "preview-qa")).toBe(true);
    expect(LAUNCH_GATES.some((gate) => gate.scope === "staged-production")).toBe(true);
    expect(CLOSEOUT_GATES.some((gate) => gate.scope === "production")).toBe(true);
  });

  it("rejects any missing launch requirement", async () => {
    const directory = complete("launch");
    const missing = LAUNCH_GATES[3];
    writeFileSync(join(directory, missing.file), "");
    await expect(verifyEvidenceDirectory(directory, "launch", deploymentId, previewDeploymentId, commitSha)).rejects.toThrow();
  });

  it("rejects a gate from another deployment or commit", async () => {
    const directory = complete("launch");
    const path = join(directory, LAUNCH_GATES[0].file);
    const record = JSON.parse(readFileSync(path, "utf8"));
    writeFileSync(path, JSON.stringify({ ...record, commitSha: "b".repeat(40) }));
    await expect(verifyEvidenceDirectory(directory, "launch", deploymentId, previewDeploymentId, commitSha)).rejects.toThrow(/commit/);
  });

  it("distinguishes launch from seven-day closeout", async () => {
    const directory = complete("launch");
    await expect(verifyEvidenceDirectory(directory, "launch", deploymentId, previewDeploymentId, commitSha)).resolves.toMatchObject({ phase: "launch" });
    await expect(verifyEvidenceDirectory(directory, "closeout", deploymentId, previewDeploymentId, commitSha)).rejects.toThrow(/missing/);
  });

  it("rejects pending, undersampled, late-free, or slow field INP evidence", async () => {
    for (const metrics of [
      { measuredHomeViews: 199, inpP75Ms: 200, measurementStartedAt: new Date(Date.now() - 8 * 86400000).toISOString(), measurementEndedAt: new Date().toISOString() },
      { measuredHomeViews: 200, inpP75Ms: 201, measurementStartedAt: new Date(Date.now() - 8 * 86400000).toISOString(), measurementEndedAt: new Date().toISOString() },
      { measuredHomeViews: 200, inpP75Ms: 200, measurementStartedAt: new Date(Date.now() - 6 * 86400000).toISOString(), measurementEndedAt: new Date().toISOString() },
    ]) {
      const directory = complete("closeout");
      const path = join(directory, "field-inp.json");
      const record = JSON.parse(readFileSync(path, "utf8"));
      writeFileSync(path, JSON.stringify({ ...record, metrics }));
      await expect(verifyEvidenceDirectory(directory, "closeout", deploymentId, previewDeploymentId, commitSha)).rejects.toThrow(/field INP/);
    }
  });

  it("seals and verifies every closeout file hash", async () => {
    const directory = complete("closeout");
    const manifest = await sealEvidenceDirectory(directory, deploymentId, previewDeploymentId, commitSha);
    expect(manifest.files.length).toBeGreaterThan(CLOSEOUT_GATES.length);
    await expect(verifyEvidenceDirectory(directory, "closeout", deploymentId, previewDeploymentId, commitSha, true)).resolves.toMatchObject({ status: "pass", phase: "closeout" });
    writeFileSync(join(directory, CLOSEOUT_GATES[0].file), "changed");
    await expect(verifyEvidenceDirectory(directory, "closeout", deploymentId, previewDeploymentId, commitSha, true)).rejects.toThrow(/hash/);
  });
});
```

- [ ] **Step 2: Run the focused test and verify the missing registry fails**

Run: `npm test -- tests/unit/release/completion-evidence.test.ts`

Expected: FAIL because `lib/release/evidence.mjs` does not exist.

- [ ] **Step 3: Implement the finite launch/closeout registry and integrity audit**

```js
// lib/release/evidence.mjs
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export const LAUNCH_GATES = [
  { file: "preview-qa/preview-qa-metadata.json", gate: "preview-qa-metadata", scope: "preview-qa" },
  { file: "candidate-metadata.json", gate: "candidate-metadata", scope: "staged-production" },
  { file: "automated-checks.json", gate: "automated-checks", scope: "staged-production" },
  { file: "browser-matrix.json", gate: "browser-matrix", scope: "staged-production" },
  { file: "accessibility-manual.json", gate: "accessibility-manual", scope: "staged-production" },
  { file: "preview-qa/public-contracts-preview.json", gate: "public-contracts-preview", scope: "preview-qa" },
  { file: "public-contracts-staged-production.json", gate: "public-contracts-staged-production", scope: "staged-production" },
  { file: "external-destinations.json", gate: "external-destinations", scope: "staged-production" },
  { file: "legacy-reconciliation.json", gate: "legacy-reconciliation", scope: "staged-production" },
  { file: "preview-qa/form-soak-volume.json", gate: "form-soak-volume", scope: "preview-qa" },
  { file: "preview-qa/form-soak-rate-limit-prayer.json", gate: "form-soak-rate-limit-prayer", scope: "preview-qa" },
  { file: "preview-qa/form-soak-rate-limit-contact.json", gate: "form-soak-rate-limit-contact", scope: "preview-qa" },
  { file: "preview-qa/form-soak-rate-limit-newsletter.json", gate: "form-soak-rate-limit-newsletter", scope: "preview-qa" },
  { file: "preview-qa/form-soak-outage.json", gate: "form-soak-outage", scope: "preview-qa" },
  { file: "preview-qa/brevo-doi-lifecycle.json", gate: "brevo-doi-lifecycle", scope: "preview-qa" },
  { file: "preview-qa/pii-canary-scan.json", gate: "pii-canary-scan", scope: "preview-qa" },
  { file: "preview-qa/retention-gate.json", gate: "retention", scope: "preview-qa" },
  { file: "lighthouse-summary.json", gate: "lighthouse-budgets", scope: "staged-production" },
  { file: "pixel-motion-summary.json", gate: "physical-pixel-motion", scope: "staged-production" },
  { file: "rollback-readiness.json", gate: "rollback-readiness", scope: "staged-production" },
];

export const CLOSEOUT_GATES = [
  ...LAUNCH_GATES,
  { file: "production-smoke.json", gate: "production-smoke", scope: "production" },
  { file: "public-contracts-production.json", gate: "public-contracts-production", scope: "production" },
  { file: "canonical-http-apex.json", gate: "canonical-http-apex", scope: "production" },
  { file: "canonical-http-www.json", gate: "canonical-http-www", scope: "production" },
  { file: "canonical-https-apex.json", gate: "canonical-https-apex", scope: "production" },
  { file: "canonical-https-www.json", gate: "canonical-https-www", scope: "production" },
  { file: "production-consent.json", gate: "production-consent", scope: "production" },
  { file: "production-forms.json", gate: "production-forms", scope: "production" },
  { file: "search-console.json", gate: "search-console", scope: "production" },
  { file: "observability-15m.json", gate: "observability-15m", scope: "production" },
  { file: "observability-1h.json", gate: "observability-1h", scope: "production" },
  { file: "observability-24h.json", gate: "observability-24h", scope: "production" },
  { file: "observability-72h.json", gate: "observability-72h", scope: "production" },
  { file: "observability-7d.json", gate: "observability-7d", scope: "production" },
  { file: "field-inp.json", gate: "field-inp", scope: "production" },
];

const MANUAL_GATES = new Set([
  "automated-checks", "browser-matrix", "accessibility-manual", "external-destinations",
  "form-soak-volume", "form-soak-rate-limit-prayer", "form-soak-rate-limit-contact",
  "form-soak-rate-limit-newsletter", "form-soak-outage", "brevo-doi-lifecycle", "retention", "rollback-readiness",
  "legacy-reconciliation", "production-consent", "production-forms", "search-console",
  "field-inp",
]);

const CHECKPOINT_MINUTES = new Map([
  ["observability-15m", 15], ["observability-1h", 60], ["observability-24h", 1440],
  ["observability-72h", 4320], ["observability-7d", 10080],
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

async function sha256(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

async function walk(directory, prefix = "") {
  const output = [];
  for (const entry of await readdir(resolve(directory, prefix), { withFileTypes: true })) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (relativePath === "manifest.json") continue;
    invariant(!entry.isSymbolicLink(), `evidence symlink is forbidden: ${relativePath}`);
    if (entry.isDirectory()) output.push(...await walk(directory, relativePath));
    else output.push(relativePath);
  }
  return output;
}

function assertEnvelope(record, definition, stagedDeploymentId, previewDeploymentId, commitSha) {
  invariant(record?.schemaVersion === 1, `${definition.file} schema mismatch`);
  invariant(record.gate === definition.gate, `${definition.file} gate mismatch`);
  invariant(record.status === "pass", `${definition.file} does not pass`);
  invariant(record.deploymentScope === definition.scope, `${definition.file} deployment scope mismatch`);
  const expectedDeploymentId = definition.scope === "preview-qa" ? previewDeploymentId : stagedDeploymentId;
  invariant(record.deploymentId === expectedDeploymentId, `${definition.file} deployment mismatch`);
  invariant(record.commitSha === commitSha, `${definition.file} commit mismatch`);
  const recordedAt = Date.parse(record.recordedAt);
  invariant(Number.isFinite(recordedAt), `${definition.file} has invalid recordedAt`);
  invariant(recordedAt <= Date.now() + 5 * 60 * 1000, `${definition.file} recordedAt is in the future`);
  invariant(Array.isArray(record.assertions) && record.assertions.length > 0 && record.assertions.every((item) => typeof item === "string" && item.trim()), `${definition.file} has no assertions`);
  if (MANUAL_GATES.has(definition.gate)) {
    invariant(record.manual === true, `${definition.file} must be a reviewed manual gate`);
    invariant(typeof record.reviewerRole === "string" && record.reviewerRole.length >= 3, `${definition.file} lacks reviewer role`);
    invariant(Array.isArray(record.artifacts) && record.artifacts.length > 0, `${definition.file} lacks reviewed artifacts`);
  }
  if (CHECKPOINT_MINUTES.has(definition.gate)) {
    invariant(record.metrics?.checkpointElapsedMinutes === CHECKPOINT_MINUTES.get(definition.gate), `${definition.file} checkpoint elapsed time mismatch`);
    invariant(Number.isFinite(Date.parse(record.metrics?.sourceWindowStartedAt)) && Number.isFinite(Date.parse(record.metrics?.sourceWindowEndedAt)), `${definition.file} source window is invalid`);
    invariant(Number.isInteger(record.metrics?.sourceArtifacts) && record.metrics.sourceArtifacts >= 5, `${definition.file} lacks bound health source artifacts`);
    invariant(Array.isArray(record.artifacts) && record.artifacts.length >= 5, `${definition.file} lacks sealed health source artifacts`);
  }
  if (definition.gate === "pii-canary-scan") {
    invariant(record.metrics?.hits === 0 && record.metrics?.realHandlerPosts === 3 && record.metrics?.boundLogWindow === true && /^[a-f0-9]{64}$/.test(record.metrics?.logExportSha256 ?? ""), "PII canary gate lacks a clean bound real-handler log scan");
  }
  if (definition.gate === "legacy-reconciliation") {
    const paths = (record.artifacts ?? []).map((artifact) => artifact.path.toLowerCase());
    for (const source of ["search-console", "ga4-landing-pages", "wix-history", "backlinks", "vercel-logs"]) {
      invariant(paths.some((path) => path.includes(source)), `legacy reconciliation lacks ${source} evidence`);
    }
  }
  if (definition.gate === "field-inp") {
    invariant(JSON.stringify(Object.keys(record.metrics ?? {}).sort()) === JSON.stringify(["inpP75Ms", "measuredHomeViews", "measurementEndedAt", "measurementStartedAt"]), "field INP metrics contain an unexpected key");
    invariant(Number.isInteger(record.metrics?.measuredHomeViews) && record.metrics.measuredHomeViews >= 200, "field INP requires at least 200 measured home views");
    invariant(typeof record.metrics?.inpP75Ms === "number" && record.metrics.inpP75Ms <= 200, "field INP p75 exceeds 200ms");
    invariant(Number.isFinite(Date.parse(record.metrics?.measurementStartedAt)), "field INP measurementStartedAt is invalid");
    invariant(Number.isFinite(Date.parse(record.metrics?.measurementEndedAt)), "field INP measurementEndedAt is invalid");
  }
}

export async function sealEvidenceDirectory(directory, stagedDeploymentId, previewDeploymentId, commitSha) {
  const names = (await walk(directory)).sort();
  const files = [];
  for (const name of names) files.push({ path: name, sha256: await sha256(resolve(directory, name)) });
  const manifest = { schemaVersion: 1, stagedDeploymentId, previewDeploymentId, commitSha, sealedAt: new Date().toISOString(), files };
  await writeFile(resolve(directory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
  return manifest;
}

export async function verifyEvidenceDirectory(directory, phase, stagedDeploymentId, previewDeploymentId, commitSha, requireSeal = false) {
  const definitions = phase === "launch" ? LAUNCH_GATES : phase === "closeout" ? CLOSEOUT_GATES : null;
  invariant(definitions, "phase must be launch or closeout");
  const records = [];
  for (const definition of definitions) {
    let record;
    try { record = JSON.parse(await readFile(resolve(directory, definition.file), "utf8")); }
    catch { throw new Error(`missing or invalid ${definition.file}`); }
    assertEnvelope(record, definition, stagedDeploymentId, previewDeploymentId, commitSha);
    const gateDirectory = resolve(directory, dirname(definition.file));
    for (const artifact of record.artifacts ?? []) {
      const artifactPath = resolve(gateDirectory, artifact.path);
      invariant(artifactPath.startsWith(`${gateDirectory}/`), `manual artifact escapes its scoped evidence directory: ${artifact.path}`);
      invariant(artifact.sha256 === await sha256(artifactPath), `manual artifact hash mismatch: ${artifact.path}`);
    }
    records.push(record);
  }
  const timestamps = records.map((record) => Date.parse(record.recordedAt));
  if (phase === "launch") invariant(Math.max(...timestamps) - Math.min(...timestamps) <= 72 * 60 * 60 * 1000, "launch evidence spans more than 72 hours");
  if (phase === "closeout") {
    const sevenDay = records.find((record) => record.gate === "observability-7d");
    invariant(Date.now() - Date.parse(sevenDay.recordedAt) <= 24 * 60 * 60 * 1000, "seven-day closeout evidence is stale");
    const production = records.find((record) => record.gate === "production-smoke");
    for (const [gate, minutes] of CHECKPOINT_MINUTES) {
      const checkpoint = records.find((record) => record.gate === gate);
      const minimum = Date.parse(production.recordedAt) + minutes * 60_000;
      invariant(Date.parse(checkpoint.recordedAt) >= minimum, `${gate} was recorded before its production checkpoint elapsed`);
      invariant(Date.parse(checkpoint.metrics.sourceWindowStartedAt) === Date.parse(production.recordedAt), `${gate} source window is not bound to production smoke`);
      invariant(Date.parse(checkpoint.metrics.sourceWindowEndedAt) >= minimum && Date.parse(checkpoint.metrics.sourceWindowEndedAt) <= Date.parse(checkpoint.recordedAt), `${gate} source window does not cover its checkpoint`);
    }
    const fieldInp = records.find((record) => record.gate === "field-inp");
    const startedAt = Date.parse(fieldInp.metrics.measurementStartedAt);
    const endedAt = Date.parse(fieldInp.metrics.measurementEndedAt);
    invariant(startedAt >= Date.parse(production.recordedAt), "field INP window starts before the bound production deployment");
    invariant(endedAt - startedAt >= 7 * 24 * 60 * 60 * 1000, "field INP measurement window is under seven days");
    invariant(endedAt <= Date.parse(fieldInp.recordedAt) && endedAt <= Date.now() + 5 * 60 * 1000, "field INP measurement end is not bound to the recorded export time");
  }
  if (requireSeal) {
    const manifest = JSON.parse(await readFile(resolve(directory, "manifest.json"), "utf8"));
    invariant(manifest.stagedDeploymentId === stagedDeploymentId && manifest.previewDeploymentId === previewDeploymentId && manifest.commitSha === commitSha, "manifest deployment or commit mismatch");
    const currentFiles = (await walk(directory)).sort();
    const sealedFiles = manifest.files.map((entry) => entry.path).sort();
    invariant(JSON.stringify(sealedFiles) === JSON.stringify(currentFiles), "manifest file set does not match current evidence directory");
    for (const entry of manifest.files) invariant(entry.sha256 === await sha256(resolve(directory, entry.path)), `manifest hash mismatch: ${entry.path}`);
    for (const definition of definitions) invariant(manifest.files.some((file) => file.path === definition.file), `manifest missing ${definition.file}`);
  }
  return { status: "pass", phase, gates: definitions.length, stagedDeploymentId, previewDeploymentId, commitSha };
}
```

```ts
// lib/release/evidence.d.mts
export type GateDefinition = { file: string; gate: string; scope: "preview-qa" | "staged-production" | "production" };
export type EvidencePhase = "launch" | "closeout";
export const LAUNCH_GATES: readonly GateDefinition[];
export const CLOSEOUT_GATES: readonly GateDefinition[];
export function sealEvidenceDirectory(directory: string, stagedDeploymentId: string, previewDeploymentId: string, commitSha: string): Promise<{
  schemaVersion: 1;
  stagedDeploymentId: string;
  previewDeploymentId: string;
  commitSha: string;
  sealedAt: string;
  files: Array<{ path: string; sha256: string }>;
}>;
export function verifyEvidenceDirectory(
  directory: string,
  phase: EvidencePhase,
  stagedDeploymentId: string,
  previewDeploymentId: string,
  commitSha: string,
  requireSeal?: boolean,
): Promise<{ status: "pass"; phase: EvidencePhase; gates: number; stagedDeploymentId: string; previewDeploymentId: string; commitSha: string }>;
```

- [ ] **Step 4: Add a privacy-safe manual gate recorder with attachment hashes**

```js
// scripts/record-manual-gate.mjs
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, relative } from "node:path";

const required = ["RELEASE_EVIDENCE_DIR", "RELEASE_DEPLOYMENT_SCOPE", "RELEASE_DEPLOYMENT_ID", "RELEASE_COMMIT_SHA", "MANUAL_GATE", "MANUAL_GATE_REVIEWER_ROLE", "MANUAL_GATE_ASSERTIONS_B64", "MANUAL_GATE_ARTIFACTS_B64"];
for (const name of required) if (!process.env[name]) throw new Error(`${name} is required`);
const assertions = JSON.parse(Buffer.from(process.env.MANUAL_GATE_ASSERTIONS_B64, "base64url").toString("utf8"));
const paths = JSON.parse(Buffer.from(process.env.MANUAL_GATE_ARTIFACTS_B64, "base64url").toString("utf8"));
const metrics = process.env.MANUAL_GATE_METRICS_B64
  ? JSON.parse(Buffer.from(process.env.MANUAL_GATE_METRICS_B64, "base64url").toString("utf8"))
  : undefined;
if (!Array.isArray(assertions) || assertions.length === 0 || assertions.some((item) => typeof item !== "string" || !item.trim())) throw new Error("manual assertions must be nonempty strings");
if (!Array.isArray(paths) || paths.length === 0 || paths.some((item) => typeof item !== "string" || !item.trim())) throw new Error("manual artifacts must be nonempty paths");
if (metrics && (typeof metrics !== "object" || Array.isArray(metrics) || Object.values(metrics).some((value) => !["number", "string", "boolean"].includes(typeof value)))) {
  throw new Error("manual metrics must be a flat primitive object");
}
if (metrics) {
  if (process.env.MANUAL_GATE !== "field-inp") throw new Error("manual metrics are supported only for field-inp");
  const keys = Object.keys(metrics).sort();
  if (JSON.stringify(keys) !== JSON.stringify(["inpP75Ms", "measuredHomeViews", "measurementEndedAt", "measurementStartedAt"])) {
    throw new Error("field-inp metrics contain an unexpected key");
  }
}
const root = resolve(process.env.RELEASE_EVIDENCE_DIR);
const artifacts = [];
for (const path of paths) {
  const absolute = resolve(root, path);
  if (!absolute.startsWith(`${root}/`)) throw new Error("manual artifact must stay inside release evidence directory");
  const bytes = await readFile(absolute);
  artifacts.push({ path: relative(root, absolute), sha256: createHash("sha256").update(bytes).digest("hex") });
}
const record = {
  schemaVersion: 1,
  gate: process.env.MANUAL_GATE,
  status: "pass",
  recordedAt: new Date().toISOString(),
  deploymentScope: process.env.RELEASE_DEPLOYMENT_SCOPE,
  deploymentId: process.env.RELEASE_DEPLOYMENT_ID,
  commitSha: process.env.RELEASE_COMMIT_SHA,
  assertions,
  ...(metrics ? { metrics } : {}),
  manual: true,
  reviewerRole: process.env.MANUAL_GATE_REVIEWER_ROLE,
  artifacts,
};
await mkdir(root, { recursive: true, mode: 0o700 });
const outputName = record.gate === "retention" ? "retention-gate.json" : `${record.gate}.json`;
await writeFile(resolve(root, outputName), `${JSON.stringify(record, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({ status: "pass", gate: record.gate, assertions: assertions.length, artifacts: artifacts.length }));
```

- [ ] **Step 5: Add sealing and phase-aware verification CLIs**

```js
// scripts/seal-release-evidence.mjs
import { sealEvidenceDirectory } from "../lib/release/evidence.mjs";

for (const name of ["RELEASE_EVIDENCE_DIR", "STAGED_PRODUCTION_DEPLOYMENT_ID", "PREVIEW_QA_DEPLOYMENT_ID", "RELEASE_COMMIT_SHA"]) if (!process.env[name]) throw new Error(`${name} is required`);
const manifest = await sealEvidenceDirectory(process.env.RELEASE_EVIDENCE_DIR, process.env.STAGED_PRODUCTION_DEPLOYMENT_ID, process.env.PREVIEW_QA_DEPLOYMENT_ID, process.env.RELEASE_COMMIT_SHA);
console.log(JSON.stringify({ status: "sealed", files: manifest.files.length, stagedDeploymentId: manifest.stagedDeploymentId, previewDeploymentId: manifest.previewDeploymentId, commitSha: manifest.commitSha }));
```

```js
// scripts/verify-completion-evidence.mjs
import { verifyEvidenceDirectory } from "../lib/release/evidence.mjs";

for (const name of ["RELEASE_EVIDENCE_DIR", "STAGED_PRODUCTION_DEPLOYMENT_ID", "PREVIEW_QA_DEPLOYMENT_ID", "RELEASE_COMMIT_SHA", "RELEASE_EVIDENCE_PHASE"]) if (!process.env[name]) throw new Error(`${name} is required`);
const result = await verifyEvidenceDirectory(
  process.env.RELEASE_EVIDENCE_DIR,
  process.env.RELEASE_EVIDENCE_PHASE,
  process.env.STAGED_PRODUCTION_DEPLOYMENT_ID,
  process.env.PREVIEW_QA_DEPLOYMENT_ID,
  process.env.RELEASE_COMMIT_SHA,
  process.env.RELEASE_EVIDENCE_REQUIRE_SEAL === "1",
);
console.log(JSON.stringify(result));
```

- [ ] **Step 6: Publish the complete authoritative evidence matrix**

```markdown
<!-- docs/release/completion-evidence-matrix.md -->
# The Gathering completion evidence matrix

Evidence is private, synthetic where possible, PII-free, and hash-sealed. Preview QA and staged Production evidence are bound to their own immutable deployment IDs and one exact shared Git SHA; post-promotion evidence is bound to the same staged Production ID/SHA now served at the canonical domain. Missing, stale, indirect, falsely merged, differently scoped, or mismatched evidence is a failed gate.

| Requirement | Gate file | Authoritative evidence |
|---|---|---|
| Preview QA identity | `preview-qa/preview-qa-metadata.json` | Vercel API READY state, protected immutable Preview URL, Preview deployment ID, exact Git SHA, no-send/test-recipient mode |
| Staged Production identity and no rebuild | `candidate-metadata.json` | Vercel API READY state, protected generated URL, Production target, no custom Production domain, staged deployment ID, exact Git SHA |
| Unit/integration/type/lint/build/HTML/assets/static podcast architecture/full-history secrets/security | `automated-checks.json` | Required GitHub check URLs plus downloaded reports, including prerender/runtime-refresh architecture and the redacted Gitleaks `--all` history result |
| Chromium/Firefox/WebKit x 360/768/1440, consent, reduced motion, media eligibility, every-shell giving path, exact above-fold Subsplash action, no-JS | `browser-matrix.json` | Playwright JSON/HTML reports and local-CI traces for failures/retries; protected-candidate capture disables credential-bearing traces |
| WCAG 2.2 AA, Axe, keyboard, zoom, text spacing, forced colors, physical iPhone/SE/Pixel/iPad orientations, VoiceOver, NVDA, visual review | `accessibility-manual.json` | Axe report, reviewed Linux baselines, named physical device/AT matrix, dated reviewer-role attestation |
| Protected/noindex Preview contracts plus sitemap/redirect/410/404/schema/report-only CSP | `preview-qa/public-contracts-preview.json` | Unauthenticated Vercel challenge, authenticated 200 HTML with noindex/nofollow, and immutable Preview HTTP verifier output |
| Protected staged Production public/static contracts | `public-contracts-staged-production.json` | Unauthenticated challenge plus authenticated Production-build canonical/robots/sitemap/redirect/410/404/schema/enforced-CSP output without any form mutation or origin spoofing |
| TikTok, YouTube, podcast, social, Printify, Subsplash | `external-destinations.json` | Automated status output plus real-browser verification for challenge-only hosts |
| Pre-freeze historical URL reconciliation | `legacy-reconciliation.json` | Hashed restricted exports from Search Console, GA4 landing pages, Wix history, backlink reports, and Vercel logs with balanced discovered-path and 308/410/404 ledger counts |
| 25 valid/form, concurrency, replay, p95, invalid/injection | `preview-qa/form-soak-volume.json` | Protected-preview aggregate soak and isolated provider deltas |
| Sixth prayer 429 and no invocation/provider call | `preview-qa/form-soak-rate-limit-prayer.json` | WAF HTTP sequence and before/after counts |
| Sixth contact 429 and no invocation/provider call | `preview-qa/form-soak-rate-limit-contact.json` | WAF HTTP sequence and before/after counts |
| Eleventh newsletter 429 and no invocation/provider call | `preview-qa/form-soak-rate-limit-newsletter.json` | WAF HTTP sequence and before/after counts |
| Provider outage, accessible retry, no false success | `preview-qa/form-soak-outage.json` | Separate invalid-provider preview plus retained-value browser report |
| Native Brevo DOI lifecycle and privacy | `preview-qa/brevo-doi-lifecycle.json` | Isolated real new/duplicate pending parity, confirmation/list membership, genuine expired recovery, campaign unsubscribe suppression, and mature 30-day purge with fresh control |
| No form PII in logs/analytics/URLs/storage/build/Git | `preview-qa/pii-canary-scan.json` | Intercepted browser boundary assertions plus three real no-send handler posts and a complete deployment-bound Vercel log-window scan |
| 90-day/12-month/30-day/one-month/Redis TTL and ownership controls | `preview-qa/retention-gate.json` | Validated retention record, hashed restricted screenshots, synthetic deletion |
| Lighthouse and network budgets | `lighthouse-summary.json` | Three raw LHR files for every authoritative static route and median evaluator |
| Physical Pixel motion | `pixel-motion-summary.json` | Device preflight, three raw 30-second traces, FPS/drop summary |
| Prior deployment and authorized rollback | `rollback-readiness.json` | READY prior deployment inspect, owner/backup permission and alert test |
| Canonical production alias uses tested deployment | `production-smoke.json` | Vercel alias/API binding plus immediate primary-route smoke |
| Production canonical/robots/sitemap/redirect/schema/CSP/links | `public-contracts-production.json` | Production HTTP verifier after promotion |
| HTTP apex one-hop canonical outcome | `canonical-http-apex.json` | One 308 directly to the matching HTTPS www path and query |
| HTTP www one-hop canonical outcome | `canonical-http-www.json` | One 308 directly to the matching HTTPS www path and query |
| HTTPS apex one-hop canonical outcome | `canonical-https-apex.json` | One 308 directly to the matching HTTPS www path and query |
| HTTPS www canonical outcome | `canonical-https-www.json` | Direct 200 with no redirect |
| Canonical-host analytics consent lifecycle | `production-consent.json` | Controlled browser proof of host-only and parent-domain GA cookie withdrawal, grant/revoke/re-grant commands, and cross-tab synchronization |
| Real DOI/prayer/contact acceptance and mailbox arrival | `production-forms.json` | Hashed provider IDs, aggregate delivery states, scheduled synthetic deletion |
| Sitemap submitted | `search-console.json` | Dated property-owner submission receipt and canonical coverage check |
| 15-minute health | `observability-15m.json` | Vercel/provider/GA safe aggregate sample evaluated by exact thresholds |
| One-hour health | `observability-1h.json` | Same scope and candidate baseline |
| 24-hour health | `observability-24h.json` | Same scope plus five-minute synthetic monitor history |
| 72-hour health | `observability-72h.json` | Same scope plus 30-minute monitor history after hour 24 |
| Seven-day monitoring closeout | `observability-7d.json` | Full synthetic/Vercel/provider/GA safe-aggregate monitor history through seven elapsed days |
| Field INP after both time and sample floors | `field-inp.json` | GA4 home-only aggregate export proving >=200 home views with final INP measurements, a timestamped window beginning no earlier than bound production and lasting >=7 days, and p75 <=200 ms; pending is non-passing |

## Launch audit

Before asking for production approval, create reviewed manual gate records with `scripts/record-manual-gate.mjs`, then run:

```bash
RELEASE_EVIDENCE_PHASE=launch RELEASE_EVIDENCE_REQUIRE_SEAL=0 npm run release:evidence:verify
npm run release:evidence:seal
RELEASE_EVIDENCE_PHASE=launch RELEASE_EVIDENCE_REQUIRE_SEAL=1 npm run release:evidence:verify
```

The launch audit must report 20 passing gates, with each record bound to the declared Preview QA or staged Production ID and every record bound to the one approved Git SHA. A launch pass authorizes only an explicit approval decision; it does not itself authorize promotion.

## Closeout audit

After the seven-day checkpoint, reseal and run:

```bash
npm run release:evidence:seal
RELEASE_EVIDENCE_PHASE=closeout RELEASE_EVIDENCE_REQUIRE_SEAL=1 npm run release:evidence:verify
```

The closeout audit must report 35 passing gates. Preview-scoped records remain bound to the Preview QA ID; staged and Production records remain bound to the staged Production ID that promotion placed at `www`; all records share the exact approved SHA. It cannot run successfully until both seven elapsed days and the field-INP sample floor pass. Only this result, together with current production evidence, proves the full release objective complete.
```

- [ ] **Step 7: Run unit tests and a deliberately incomplete audit**

Run: `npm test -- tests/unit/release/completion-evidence.test.ts`

Expected: all missing/mismatch/phase/hash tests pass; the test proves launch cannot stand in for closeout.

- [ ] **Step 8: Record reviewed manual gates without copying private artifacts into Git**

For each manual gate (`automated-checks`, `browser-matrix`, `accessibility-manual`, `external-destinations`, `legacy-reconciliation`, `form-soak-volume`, `form-soak-rate-limit-prayer`, `form-soak-rate-limit-contact`, `form-soak-rate-limit-newsletter`, `form-soak-outage`, `brevo-doi-lifecycle`, `retention`, `rollback-readiness`, then post-promotion `production-consent`, `production-forms`, `search-console`, and `field-inp`), set the exact `RELEASE_DEPLOYMENT_SCOPE` and matching deployment ID, encode the exact assertions and relative artifact paths as base64url JSON arrays, and run `node scripts/record-manual-gate.mjs` with the gate name and reviewer role. Preview-scoped records and their restricted artifacts use `$RELEASE_EVIDENCE_DIR/preview-qa`; staged-Production and canonical-Production records use `$RELEASE_EVIDENCE_DIR`. For `field-inp`, also pass `MANUAL_GATE_METRICS_B64` containing only `measuredHomeViews`, `inpP75Ms`, `measurementStartedAt`, and `measurementEndedAt`; the validator binds the window to production and applies the sample, time, and p75 boundaries.

Expected: each command prints only gate/assertion/artifact counts; each generated record contains attachment SHA-256 values but no raw name, address, account content, token, provider ID, IP, or form body.

- [ ] **Step 9: Run and seal the launch audit before production approval**

Run:

```bash
RELEASE_EVIDENCE_PHASE=launch RELEASE_EVIDENCE_REQUIRE_SEAL=0 npm run release:evidence:verify
npm run release:evidence:seal
RELEASE_EVIDENCE_PHASE=launch RELEASE_EVIDENCE_REQUIRE_SEAL=1 npm run release:evidence:verify
```

Expected: the unsealed audit reports `status:"pass", phase:"launch", gates:20`; sealing hashes every private file and records both deployment IDs plus the shared Git SHA; the sealed audit reports the same bindings. If any evidence is missing, weaker, stale, falsely scoped, mismatched, or tampered, stop before promotion.

- [ ] **Step 10: After production and seven days, run the closeout audit**

Run:

```bash
npm run release:evidence:seal
RELEASE_EVIDENCE_PHASE=closeout RELEASE_EVIDENCE_REQUIRE_SEAL=1 npm run release:evidence:verify
```

Expected: `status:"pass", phase:"closeout", gates:35` with the Preview QA ID, promoted staged Production ID, and exact shared Git SHA; canonical-host outcomes, production consent/forms, Search Console, field INP, and all five health checkpoints are present, time-bound, source-bound, and hash-valid. This is the only verification result in this plan that supports declaring the full rebuild/release objective achieved.

- [ ] **Step 11: Commit only the evidence system and public matrix**

```bash
git add lib/release/evidence.mjs lib/release/evidence.d.mts scripts/record-manual-gate.mjs scripts/seal-release-evidence.mjs scripts/verify-completion-evidence.mjs tests/unit/release/completion-evidence.test.ts docs/release/completion-evidence-matrix.md
git commit -m "test: require sealed completion evidence"
```

Expected: the commit contains no `.private-release-evidence`, `manifest.json`, screenshot/export, account name, address, token, provider ID, IP, or form message.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-11-the-gathering-verification-release.md`.

Use **superpowers:subagent-driven-development** to execute one reviewer-sized task at a time, with specification review followed by code-quality review after every task. The three subsystem plans must be complete before this plan runs. Do not promote, activate live delivery, publish WAF changes, mutate DNS, buy a service, submit Search Console changes, or run a real production form smoke without the explicit authorization and credentials stated in the approved specification.
