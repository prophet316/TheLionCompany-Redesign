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
