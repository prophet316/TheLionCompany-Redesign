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
