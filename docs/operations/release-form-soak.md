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
