# The Gathering completion evidence matrix

Evidence is private, synthetic where possible, PII-free, and hash-sealed. Preview QA and staged Production evidence are bound to their own immutable deployment IDs and one exact shared Git SHA. Post-promotion evidence is bound to the same staged Production ID and SHA now served at the canonical domain. Missing, stale, indirect, falsely merged, differently scoped, or mismatched evidence is a failed gate.

| Requirement | Gate file | Authoritative evidence |
|---|---|---|
| Preview QA identity | `preview-qa/preview-qa-metadata.json` | Vercel API READY state, protected immutable Preview URL, Preview deployment ID, exact Git SHA, and no-send/test-recipient mode |
| Staged Production identity and no rebuild | `candidate-metadata.json` | Vercel API READY state, protected generated URL, Production target, no custom Production domain, staged deployment ID, exact SHA, and the distinct Preview QA binding |
| Unit/integration/type/lint/build/HTML/assets/static podcast architecture/full-history secrets/security | `automated-checks.json` | Required GitHub check URLs and downloaded reports, including prerender/runtime-refresh architecture and redacted Gitleaks `--all` history results |
| Chromium/Firefox/WebKit at 360/768/1440, consent, reduced motion, media eligibility, every-shell giving, exact above-fold Subsplash, no-JS | `browser-matrix.json` | Playwright JSON/HTML reports and local-CI traces; protected-candidate capture disables credential-bearing traces |
| WCAG 2.2 AA, Axe, keyboard, zoom, text spacing, forced colors, physical device orientations, VoiceOver, NVDA, visual review | `accessibility-manual.json` | Axe report, reviewed Linux baselines, named device/AT matrix, and dated reviewer-role attestation |
| Protected/noindex Preview contracts, sitemap, redirects, 410/404, schema, report-only CSP | `preview-qa/public-contracts-preview.json` | Unauthenticated Vercel challenge, authenticated noindex/nofollow HTML, and immutable Preview verifier output |
| Protected staged Production public/static contracts | `public-contracts-staged-production.json` | Unauthenticated challenge plus authenticated canonical/robots/sitemap/redirect/410/404/schema/enforced-CSP output without form mutation or origin spoofing |
| TikTok, YouTube, podcast, social, Printify, Subsplash | `external-destinations.json` | Automated status output plus real-browser verification for challenge-only hosts |
| Pre-freeze historical URL reconciliation | `legacy-reconciliation.json` | Hashed restricted exports from Search Console, GA4 landing pages, Wix history, backlink reports, and Vercel logs with balanced 308/410/404 outcomes |
| 25 valid requests per form, concurrency, replay, p95, invalid/injection | `preview-qa/form-soak-volume.json` | Protected-preview aggregate soak and isolated provider deltas |
| Sixth prayer request returns 429 without invocation/provider call | `preview-qa/form-soak-rate-limit-prayer.json` | WAF HTTP sequence and before/after counts |
| Sixth contact request returns 429 without invocation/provider call | `preview-qa/form-soak-rate-limit-contact.json` | WAF HTTP sequence and before/after counts |
| Eleventh newsletter request returns 429 without invocation/provider call | `preview-qa/form-soak-rate-limit-newsletter.json` | WAF HTTP sequence and before/after counts |
| Provider outage, accessible retry, no false success | `preview-qa/form-soak-outage.json` | Separate invalid-provider Preview plus retained-value browser report |
| Native Brevo DOI lifecycle and privacy | `preview-qa/brevo-doi-lifecycle.json` | Isolated new/duplicate pending parity, confirmation, list membership, expiration recovery, unsubscribe suppression, and mature purge with control |
| No form PII in logs, analytics, URLs, storage, build, or Git | `preview-qa/pii-canary-scan.json` | Browser boundary assertions, three real no-send handler posts, and complete deployment-bound Vercel log-window scan |
| Retention windows, Redis TTL, and ownership controls | `preview-qa/retention-gate.json` | Validated retention record, hashed restricted screenshots, and synthetic deletion |
| Lighthouse and network budgets | `lighthouse-summary.json` | Three raw LHR files per authoritative route and the exact median evaluator |
| Physical Pixel motion | `pixel-motion-summary.json` | Device preflight, three raw 30-second traces, and FPS/drop/long-task summary |
| Prior deployment and authorized rollback | `rollback-readiness.json` | READY prior deployment inspection, owner/backup permission, and alert test |
| Canonical Production alias uses tested deployment | `production-smoke.json` | Vercel alias/API binding plus immediate primary-route smoke |
| Production canonical, robots, sitemap, redirects, schema, CSP, links | `public-contracts-production.json` | Production HTTP verifier after promotion |
| HTTP apex one-hop canonical outcome | `canonical-http-apex.json` | One 308 directly to matching HTTPS www path and query |
| HTTP www one-hop canonical outcome | `canonical-http-www.json` | One 308 directly to matching HTTPS www path and query |
| HTTPS apex one-hop canonical outcome | `canonical-https-apex.json` | One 308 directly to matching HTTPS www path and query |
| HTTPS www canonical outcome | `canonical-https-www.json` | Direct 200 without redirect |
| Canonical-host analytics consent lifecycle | `production-consent.json` | Host-only and parent-domain GA cookie withdrawal plus grant/revoke/re-grant and cross-tab proof |
| Real DOI, prayer, and contact acceptance and mailbox arrival | `production-forms.json` | Hashed provider IDs, aggregate delivery states, and scheduled synthetic deletion |
| Sitemap submitted | `search-console.json` | Dated property-owner submission receipt and canonical coverage check |
| 15-minute health | `observability-15m.json` | Vercel, provider, GA, and synthetic aggregates evaluated by exact thresholds |
| One-hour health | `observability-1h.json` | Same scope and candidate baseline |
| 24-hour health | `observability-24h.json` | Same scope plus five-minute synthetic monitor history |
| 72-hour health | `observability-72h.json` | Same scope plus 30-minute monitor history after hour 24 |
| Seven-day monitoring closeout | `observability-7d.json` | Full synthetic, Vercel, provider, and GA aggregate history through seven elapsed days |
| Field INP after both time and sample floors | `field-inp.json` | GA4 home-only aggregate proving at least 200 home views, a final INP p75 at or below 200 ms, and a bound measurement window of at least seven days; pending is non-passing |

## Launch audit

Before asking for Production promotion approval, create reviewed manual gate records with `scripts/record-manual-gate.mjs`, then run:

```bash
RELEASE_EVIDENCE_PHASE=launch RELEASE_EVIDENCE_REQUIRE_SEAL=0 npm run release:evidence:verify
npm run release:evidence:seal
RELEASE_EVIDENCE_PHASE=launch RELEASE_EVIDENCE_REQUIRE_SEAL=1 npm run release:evidence:verify
```

The launch audit must report exactly 20 passing gates. Each record is bound to the declared Preview QA or staged Production deployment ID, and every record uses the one approved Git SHA. A launch pass authorizes only an explicit approval decision; it does not authorize deployment, promotion, provider mutation, DNS changes, live forms, or Search Console submission.

## Closeout audit

After the seven-day checkpoint, reseal and run:

```bash
npm run release:evidence:seal
RELEASE_EVIDENCE_PHASE=closeout RELEASE_EVIDENCE_REQUIRE_SEAL=1 npm run release:evidence:verify
```

The closeout audit must report exactly 35 passing gates. Preview-scoped records remain bound to the Preview QA ID; staged and Production records remain bound to the staged Production ID that promotion placed at `www`; all records share the exact approved SHA. It cannot pass until seven elapsed days and the field-INP time, sample, and threshold floors all pass. Only this result, together with current Production evidence, supports declaring the full rebuild and release objective achieved.
