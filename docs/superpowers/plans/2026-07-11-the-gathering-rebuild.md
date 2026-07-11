# The Gathering Website Rebuild Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` for the recommended execution path or `superpowers:executing-plans` for a single-session execution, and follow the linked task plans in the exact dependency order below.

**Goal:** Replace The Lion Company's legacy static site with the approved “The Gathering” Next.js experience: fast, accessible, searchable, privacy-safe, operationally verifiable, and unmistakably oriented toward teaching, prayer, connection, and voluntary giving.

**Architecture:** Next.js App Router with TypeScript on the existing Vercel project. Public pages are prerendered from typed Git content; narrowly scoped client islands own consent, live-clock updates, media activation, motion, prompts, navigation, and form state. Vercel route handlers own protected form submissions. External destinations, content, assets, security policy, retention facts, and release evidence each have one authoritative registry or ledger.

**Tech Stack:** Next.js 16.2.10, React 19.2.7, TypeScript 5.9.3, Zod 4.4.3, GSAP 3.15.0, Vitest 4.1.10, Playwright 1.61.1, Axe 4.12.1, Brevo, Cloudflare Turnstile, Upstash Redis, GA4 with explicit consent, GitHub, and Vercel.

**Approved design:** [`docs/superpowers/specs/2026-07-11-the-gathering-website-design.md`](../specs/2026-07-11-the-gathering-website-design.md)

**Working branch:** `codex/the-gathering-rebuild`

**Verified production ancestor:** `492ee8d41d`

## Global Constraints

- Preserve the existing GitHub-to-Vercel project, canonical `https://www.thelioncompany.org` host, Wix DNS ownership, GA4 property, verified Subsplash giving destination, and verified Printify destination.
- Giving is a primary ministry path because The Lion Company is sustained by voluntary givers. Keep a plain `Give` path in the desktop header, mobile navigation, homepage, final invitation, and footer. `/give` must place the verified Subsplash action above the fold and explain the handoff calmly. Never add guilt, false urgency, a timed donation prompt, a countdown, or a fabricated allocation claim.
- Every giving path must remain a normal anchor when JavaScript or analytics is disabled. The release gate must prove the two-step path `site shell -> /give -> verified Subsplash URL` at 320 CSS pixels and desktop width.
- Public content must render as static HTML. The podcast reads only a checked-in reviewed snapshot; a feed refresh requires a diff, commit, and redeploy. Teaching posters are first-party ledgered files, and YouTube/ytimg receives no request before explicit play or outbound navigation.
- Do not claim captions, transcripts, leadership titles, nonprofit status, governance facts, asset rights, provider retention, or financial allocation without the evidence required by the approved specification and task plans.
- Form values and identifiers never enter analytics, URLs, logs, browser storage, Redis, or release evidence. Prayer/contact content goes only to restricted provider mailboxes after validation and provider acceptance.
- Preview deployments use no-send/test recipients and Deployment Protection. Never place production provider secrets in preview, client code, source maps, evidence, or Git.
- Preview QA and staged Production are separate immutable deployments. Bind the Preview QA deployment ID to its Git SHA and Preview evidence; bind the staged Production deployment ID to the same approved Git SHA and its own Production-build evidence. Never claim that they share a deployment ID.
- No staged Production deployment, production promotion, real provider mutation, DNS change, or rollback occurs without the explicit authorization required by the release plan. Implementation and protected-preview verification may proceed without that authorization.
- After production-candidate authorization, create the candidate with `vercel --prod --skip-domain` so it uses Production environment variables/resources but receives no custom Production domain. Its generated Vercel URL must be Deployment Protected or release stops. Run safe static/public-route, security, accessibility, visual, and performance gates against that exact staged deployment.
- Production forms remain canonical-only. Never add or spoof a staged `.vercel.app` origin or hostname to exercise them. The high-volume matrix stays on the isolated Preview; controlled real form smoke occurs immediately after approved no-rebuild promotion to `www.thelioncompany.org`, with immediate rollback on failure.
- Promotion must use `vercel promote <staged-production-id-or-url>` and must assign the canonical domain without rebuilding. The deployment ID and Git SHA must remain identical from the staged candidate to `www`; otherwise invalidate the release and restart staged-candidate verification.
- Preserve unrelated user changes. Use `apply_patch` for source edits, make small task-scoped commits, and run the exact focused tests before each commit.

## Plan Set and Ownership

| Plan | Owned work |
|---|---|
| [`2026-07-11-the-gathering-foundation-content-seo.md`](2026-07-11-the-gathering-foundation-content-seo.md) | Toolchain, tokens, typed content, first-party media, transcript evidence, static podcast snapshot, redirects, schema, route shells, and technical SEO |
| [`2026-07-11-the-gathering-experience-motion-media.md`](2026-07-11-the-gathering-experience-motion-media.md) | Consent analytics, site shell, live state, teaching/podcast UX, homepage art direction, cross-tab prompts, connect/store/give journeys, and experience browser tests |
| [`2026-07-11-the-gathering-forms-privacy-security.md`](2026-07-11-the-gathering-forms-privacy-security.md) | Environment contracts, request isolation, Turnstile, idempotency, Brevo, form state machines, prayer/legal/outcome routes, retention, CSP, and protected-preview policy |
| [`2026-07-11-the-gathering-verification-release.md`](2026-07-11-the-gathering-verification-release.md) | Required CI, cross-browser/accessibility/visual gates, links/schema/policy, form and Brevo lifecycle soaks, performance, immutable release, rollback, monitoring, and sealed completion evidence |

No task may silently move a file owned by another plan. If an implementation discovery changes a shared interface, update the approved spec and every consuming plan before continuing.

## Required Execution Order

### Phase 1: Complete foundation Tasks 1–8

Execute every task in the foundation/content/SEO plan in order. Stop at its downstream handoff and verify its full integrated gate.

Required phase evidence:

- deterministic Next.js production build;
- all 32 teaching records and matching ledgered local posters;
- the one approved featured teaching remains ineligible until an authorized human has listened through all 2,223 seconds, corrected and approved the complete first-party transcript, and the structured review record is identity/date/decision/SHA-256 bound to that exact file;
- the existing 1024×573 production lion image is copied, hash-verified, ledgered, and reserved for one homepage use before the legacy root is removed;
- public podcast rendering uses only the checked-in snapshot with `dynamicParams = false`;
- `/start-here` contains evidenced mission, story, practices, cautious public-leadership facts, voluntary-support explanation, and organizational-transparency paths without invented facts;
- redirects, 410s, canonical resources, schema, sitemap, robots, manifest, icons, and real 404 behavior pass.

### Phase 2: Complete experience Tasks 1–6

Build primitives, exact-value consent analytics, the complete shell, the source-timezone-aware live island, transcript-safe teaching library, and fully static podcast journey.

This phase must exist before forms UI because the forms plan consumes the analytics provider and shared experience contracts. At its checkpoint, prove:

- analytics denies by default and rejects every unenumerated property or value;
- home-only INP reporting emits only the exact approved aggregate payload after consent;
- header, mobile navigation, and footer expose ordinary Give and Store paths;
- an active build-validated replay is present in no-JavaScript HTML and the hydrated client removes it at expiry;
- the eligible teaching uses its local still and complete first-party transcript; ineligible content remains direct-link-only;
- every podcast route comes from the Git snapshot, includes Apple/Spotify/Podbean/RSS/YouTube actions, and unknown slugs are 404.

### Phase 3: Complete forms Tasks 1–6

Implement and test environment validation, transport isolation, Turnstile, opaque idempotency/rate limits, Brevo adapters, all three protected handlers, and reusable accessible form components.

Do not proceed until focused tests prove the 16 KiB body limit, exact origins and hostnames, preview no-send behavior, provider rejection/timeout/retry, normal and concurrent duplicate suppression, locked controls, stable submission IDs, ten-second client timeout, strict success-response parsing, and zero content in logs/Redis/analytics.

### Phase 4: Complete experience Tasks 7–8

Compose the homepage and prompt controller now that the reusable prayer/newsletter forms exist.

Required phase evidence:

- the Gathering line visibly evolves through mane, connection, waveform, and participation network stages;
- the approved lion image appears exactly once;
- desktop pinning/masks/selective parallax, mobile short transitions, and a complete reduced-motion static path are all implemented;
- the homepage has permanent Watch, Pray, Grow, Give, Store, newsletter, connect, teaching, and podcast paths;
- prompt priority, inactivity, cross-tab claim, frequency caps, focus restoration, storage failure, and dialog accessibility pass without ever creating a giving prompt.

### Phase 5: Complete forms Task 7

Publish the dedicated prayer route, newsletter outcome routes, legal routes, public processor/retention/backup/final-deletion facts, and the quarterly privacy runbook. This phase intentionally follows experience Task 8 because confirmed-newsletter outcomes consume `markNewsletterConfirmed`.

Live provider mode remains blocked until the exact mailbox/Brevo backup and final-deletion facts, named owners, verified postal address, retention automation, and restricted mailbox controls exist.

### Phase 6: Complete experience Task 9

Finish `/connect`, `/store`, and `/give`, then run the experience browser suite. The Give path is a release blocker, not a decorative CTA:

- desktop header and mobile navigation reach `/give` in one obvious action;
- the Subsplash handoff is visible above the fold and keyboard/screen-reader operable;
- the same path works with JavaScript and analytics disabled;
- copy states that voluntary gifts sustain the ministry and that Subsplash handles payment/receipt details;
- no urgency, spiritual-pressure, countdown, or unverified allocation language appears.

### Phase 7: Complete forms Task 8

Enforce the exact report-only/enforced CSP and security headers, integrate the finished prayer/connect routes, prove WAF behavior, run the protected-preview forms matrix, and complete the forms/privacy final matrix.

`media-src` remains first-party only. Current Podbean audio is a normal outbound action; no third-party audio or YouTube thumbnail host is added to CSP.

### Phase 8: Complete verification/release Tasks 1–7

Execute the verification/release plan in order against one exact candidate commit across two separately identified deployments: the immutable protected Preview for full QA/no-send form evidence, then—only after explicit production-candidate authorization—the protected staged Production deployment created with `vercel --prod --skip-domain`. The finite launch and closeout gate registries are authoritative.

The work is not complete when CI first turns green. Completion requires:

- cross-browser, viewport, no-JavaScript, reduced-motion, forced-color, zoom, keyboard, VoiceOver, NVDA, and visual-baseline evidence;
- zero pre-intent YouTube/ytimg traffic on the real eligible teaching and direct-link-only behavior on an ineligible teaching;
- verified required external destinations, including the canonical Subsplash URL, and omission of failed optional channels;
- isolated Brevo lifecycle proof for new request, pending duplicate, confirmation, expired link, confirmed membership, unsubscribe, suppression, and real 30-day pending purge;
- protected-preview form volume/rate-limit/outage/retention/canary evidence with no PII;
- Lighthouse, bundle, transfer, long-task, and physical-device motion gates;
- unauthenticated Preview-protection/noindex proof, with Preview QA deployment ID and Git SHA bound to that evidence;
- a separately authorized staged Production deployment using Production environment/resources, no custom domain, a Deployment-Protected generated URL, and a separately recorded deployment ID/Git SHA;
- Production-build-dependent static/public-route, enforced-CSP, accessibility, visual, device, and performance proof against that exact staged Production deployment, without weakening canonical-only form origin or Turnstile-hostname policy;
- an explicitly approved `vercel promote <staged-production-id-or-url>` that assigns `www` without rebuilding, plus proof that the canonical host serves the identical staged deployment ID and Git SHA;
- immediate controlled newsletter, prayer, and contact smoke on the canonical host, with rollback on any failure;
- production smoke, bound health checkpoints, exact rollback ownership, and seven-day monitoring;
- at least seven elapsed production days and at least 200 measured home views with a final INP measurement before the field-INP closeout gate can pass;
- recursively sealed, revalidated, history-aware secret-scanned completion evidence.

If production authorization or an operational dependency is unavailable, record the exact blocked gate and continue every safe preview/local task. Do not mark the overall objective complete or fabricate evidence.

## Verification at Every Checkpoint

At the end of each phase:

1. Run that plan's focused tests exactly as written.
2. Run `npm run lint`, `npm run typecheck`, `npm test -- --run`, and `npm run build` when the phase says its interfaces are integrated.
3. Run `npm run check:assets` after any media change.
4. Confirm `git diff --check` is clean and inspect `git status --short` for unrelated user work.
5. Commit only the phase/task files with the message specified by the task plan.
6. Record test output and immutable commit/deployment identifiers in the release evidence location named by the verification plan; never record secrets or visitor/provider content.

## Completion Boundary

The objective is complete only when the approved specification is mapped to passing sealed evidence, the giving path and Subsplash handoff pass every supported/no-JavaScript case, the Preview QA ID/SHA and staged Production ID/SHA are separately bound, no-rebuild promotion leaves the staged deployment ID/SHA unchanged at `www`, controlled canonical-host form smoke passes, all authorized production checks and monitoring windows have actually elapsed, and no required gate is pending. A Preview build, a staged Production deployment, a merge-ready branch, a Production promotion, or a day-seven note without the sample floor is not completion by itself.
