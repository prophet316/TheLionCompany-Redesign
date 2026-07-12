# The Gathering rollout and rollback runbook

This runbook is executable only after the approvals named below. Commands that create a Production-target deployment, promote, roll back, submit live forms, alter a provider, or submit Search Console state are not authorized merely because this document exists.

## Roles and immutable inputs

Restricted evidence names one release owner and one rollback backup who both have Vercel project permission and provider alert access. Record:

- the current Production deployment as `ROLLBACK_DEPLOYMENT_ID`;
- the ordinary Preview QA ID and immutable URL;
- the staged Production ID and generated immutable URL;
- one exact 40-character Git SHA shared by both deployments;
- the staged Production Lighthouse median;
- monitoring links and alert recipients.

Do not store names, tokens, cookies, credential-bearing links, addresses, form content, or provider IDs in Git. Never describe the ordinary Preview QA deployment as the Production candidate.

## Preview QA proof

Inspect and retain the restricted metadata:

```bash
vercel inspect "$PREVIEW_QA_DEPLOYMENT_ID" --format=json --wait --timeout 3m --scope "$VERCEL_TEAM_ID" --token "$VERCEL_ACCESS_TOKEN"
```

Against `$PREVIEW_QA_IMMUTABLE_URL`, run `RELEASE_MODE=preview-qa npm run release:smoke`, all browser projects, public external links, the complete no-send/test-recipient form suite, isolated Brevo DOI lifecycle, Lighthouse, approved physical Pixel traces, privacy canary/log scan, retention validation, keyboard/VoiceOver/NVDA/zoom review, and rollback rehearsal. Record `preview-qa-metadata.json` with the Preview deployment ID and exact SHA. A branch alias is never identity evidence.

## Pre-freeze legacy reconciliation

Before code freeze, export the finite historical URL sets from Search Console pages/links, GA4 landing pages, Wix history, known backlink reports, and Vercel request logs. Redact account and visitor data, hash all five restricted exports, and reconcile every discovered path into `legacyRouteLedger` with an explicit one-hop 308, 410, or genuine 404 outcome.

Record `legacy-reconciliation.json` only after a reviewer confirms all five sources are present, their extraction windows are dated, discovered-path and ledger-outcome counts balance, and no unknown historical URL is bulk-redirected to home. A missing or inaccessible source is a failed gate, not an empty export.

## Explicit Production-candidate authorization

Stop after Preview QA and obtain explicit Production-candidate authorization. The next command uses Production environment variables and may connect to live resources.

From a clean checkout of the approved SHA, create a staged Production deployment without assigning a custom domain:

```bash
npx vercel@55.0.0 --prod --skip-domain --yes --scope "$VERCEL_TEAM_ID" --token "$VERCEL_ACCESS_TOKEN"
```

Capture the generated `.vercel.app` URL and deployment ID as `STAGED_PRODUCTION_IMMUTABLE_URL` and `STAGED_PRODUCTION_DEPLOYMENT_ID`. Inspect that exact ID and stop unless it:

- is `READY`;
- uses the approved SHA and the Production target;
- is a different deployment from Preview QA;
- has no `www.thelioncompany.org` or apex alias;
- returns a Vercel Deployment Protection challenge without authentication.

If the generated URL cannot remain protected, stop. Do not expose a live-resource candidate publicly.

## Staged Production proof

Against the exact protected staged URL, run:

```bash
RELEASE_MODE=staged-production \
RELEASE_BASE_URL="$STAGED_PRODUCTION_IMMUTABLE_URL" \
RELEASE_DEPLOYMENT_ID="$STAGED_PRODUCTION_DEPLOYMENT_ID" \
RELEASE_COMMIT_SHA="$RELEASE_COMMIT_SHA" \
PREVIEW_QA_DEPLOYMENT_ID="$PREVIEW_QA_DEPLOYMENT_ID" \
PREVIEW_QA_IMMUTABLE_URL="$PREVIEW_QA_IMMUTABLE_URL" \
npm run release:smoke
```

Also run enforced-CSP/public/static/redirect/404/schema/link checks, JavaScript-disabled and non-mutating browser/accessibility paths, external destinations, Lighthouse, bundle/transfer/long-task gates, approved visuals, and physical-device motion.

Use only an exact-origin bypass cookie; never use global bypass headers. Do not submit a form, spoof `Origin`, add the staged hostname to Production allowlists, or weaken Turnstile. Production form handlers intentionally accept only `https://www.thelioncompany.org`.

`candidate-metadata.json`, `public-contracts-staged-production.json`, `lighthouse-summary.json`, `pixel-motion-summary.json`, and staged browser evidence must bind the staged ID and SHA. Candidate metadata must also name the distinct Preview QA ID, immutable URL, and matching SHA.

## Alert configuration

Vercel Observability supplies request count, availability, function status, latency, and 5xx rate. Brevo accepted-message IDs and synthetic restricted-mailbox checks supply delivery; record only hashed IDs and aggregate states. Consent-gated GA4 `client_error` supplies measured-session safe-code rate. Uncaught smoke console errors block regardless of sample size.

Configure the release owner and backup to receive:

- any availability loss;
- five-minute 5xx rate above 1%;
- three consecutive provider failures;
- function errors for form endpoints;
- synthetic canonical, robots, sitemap, or primary-route failure.

Confirm both recipients received a test alert before promotion.

## Explicit promotion approval and no-rebuild promotion

Stop and obtain explicit promotion approval after the launch evidence validator passes for the staged Production ID and SHA. Assign the canonical domain to that already built deployment:

```bash
npx vercel@55.0.0 promote "$STAGED_PRODUCTION_DEPLOYMENT_ID" --yes --timeout 3m --scope "$VERCEL_TEAM_ID" --token "$VERCEL_ACCESS_TOKEN"
```

Immediately inspect `https://www.thelioncompany.org` and stop unless it resolves to the identical staged deployment ID and Git SHA. A different deployment ID means a rebuild or wrong target: invalidate the candidate and restart staged-candidate gates.

Do not redeploy, rebuild, merge another commit, change DNS, or change environment variables during promotion.

## Immediate Production smoke

Run against the identical staged deployment ID and SHA:

```bash
RELEASE_MODE=production \
RELEASE_BASE_URL=https://www.thelioncompany.org \
RELEASE_DEPLOYMENT_ID="$STAGED_PRODUCTION_DEPLOYMENT_ID" \
RELEASE_COMMIT_SHA="$RELEASE_COMMIT_SHA" \
npm run release:smoke
```

The smoke command verifies the four finite host outcomes with a preserved test path and query:

- `http://thelioncompany.org` returns one 308 directly to matching HTTPS www;
- `http://www.thelioncompany.org` returns one 308 directly to matching HTTPS www;
- `https://thelioncompany.org` returns one 308 directly to matching HTTPS www;
- `https://www.thelioncompany.org` returns 200 without redirect.

Run canonical-host analytics consent proof:

```bash
RELEASE_MODE=production \
PLAYWRIGHT_BASE_URL=https://www.thelioncompany.org \
npx playwright test tests/e2e/release/experience-matrix.spec.ts --grep @canonical-consent
```

It must prove host-only and `.thelioncompany.org` GA cookie withdrawal, grant, revoke, re-grant, and cross-tab synchronization.

In a clean real browser also verify mobile navigation, reduced motion, prompt caps, TikTok, YouTube, Apple Podcasts, Spotify, social channels, Printify, and the calm Subsplash giving handoff. Then, only with explicit live-form authorization, submit one visibly synthetic real newsletter DOI, prayer, and contact message with fresh Production Turnstile tokens. Require provider acceptance, real mailbox arrival, no false success, and scheduled deletion. Any failure triggers immediate rollback. Hash provider IDs before recording.

Submit the sitemap through Search Console only after canonical and robots checks pass and explicit submission authorization is recorded.

## Monitoring cadence

Run canonical, robots, sitemap, primary-route, and redirect synthetic HTTP checks every five minutes for the first 24 hours, then every 30 minutes through day seven. Record health checkpoints at 15 minutes, one hour, 24 hours, 72 hours, and seven days.

Three identical post-promotion Lighthouse runs form the immediate LCP comparison. Export the consent-gated GA4 home-only `web_vital` aggregate only after both seven elapsed days and at least 200 home views with a final INP measurement. Require field INP p75 `<=200 ms`. The GA report UTC start must be no earlier than bound Production smoke, and its interval must span at least seven days. If the sample floor is missing, record a non-passing pending note outside `field-inp.json`, continue monitoring, and keep the objective open. Never fabricate or round a field sample.

At each checkpoint, place privacy-safe aggregate Vercel, Brevo, GA4, and synthetic-monitor exports inside the release evidence directory and hash them. Remove IPs, addresses, request URLs/query values, raw provider IDs, cookies, user agents, message content, and account names before they enter that directory. Each source envelope names the promoted staged deployment ID, SHA, and same UTC window.

Each source envelope contains only `schemaVersion`, `source`, `deploymentId`, `commitSha`, `windowStartedAt`, `windowEndedAt`, and `metrics`. Its metrics are exact and typed: Vercel contains `fiveMinute`; Brevo contains `forms`; GA4 contains `fifteenMinute`; and synthetic contains `invariants` plus `lcp`. The evaluator rejects extra top-level fields and any source aggregate that differs from the health sample.

Create `sources/health-${RELEASE_CHECKPOINT}-sample.json`, then run:

```bash
RELEASE_PRODUCTION_SMOKE_PATH="$RELEASE_EVIDENCE_DIR/production-smoke.json" \
RELEASE_HEALTH_SAMPLE_PATH="$RELEASE_EVIDENCE_DIR/sources/health-${RELEASE_CHECKPOINT}-sample.json" \
RELEASE_CHECKPOINT="$RELEASE_CHECKPOINT" \
RELEASE_DEPLOYMENT_ID="$STAGED_PRODUCTION_DEPLOYMENT_ID" \
RELEASE_COMMIT_SHA="$RELEASE_COMMIT_SHA" \
npm run release:health
```

The evaluator rejects pre-promotion, differently deployed, unhashed, missing-source, malformed, or out-of-directory input.

Rollback thresholds are exact:

- immediate invariant failures have no sample floor;
- 5xx requires a rate above 1% plus at least 100 requests or five errors in five minutes;
- client errors require above 2% with at least 100 measured sessions, or ten identical safe-code errors in 15 minutes;
- form delivery requires three consecutive failures, or below 95% after at least 20 attempts;
- LCP requires the median of three identical runs to exceed the candidate by more than 30%.

## Rollback

For any rollback verdict, announce the safe reason without user content, preserve provider evidence, and run only with rollback authorization:

```bash
npx vercel@55.0.0 rollback "$ROLLBACK_DEPLOYMENT_ID" --yes --timeout 3m --scope "$VERCEL_TEAM_ID" --token "$VERCEL_ACCESS_TOKEN"
```

Then run Production smoke against the restored deployment, confirm canonical/robots/forms/core actions, and open an incident record containing timestamps, deployment IDs, safe error classes, aggregate metrics, and remediation owner.

Do not change DNS, delete submissions, paste form content, or suppress the evidence that triggered rollback.
