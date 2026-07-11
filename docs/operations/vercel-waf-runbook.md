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
