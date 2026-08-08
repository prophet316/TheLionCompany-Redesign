# The Lion Company website loose ends — execution record

Date: 2026-08-08
Lane: `LION-ORG` only

## Approved decisions applied

- Legal operator: `Company of Lions`.
- Governing state/jurisdiction: `Texas`.
- General-contact destination: `jonathan@thelioncompany.org`.
- Prayer-request destination: `jonathan@thelioncompany.org`.
- Website contact and prayer-submission retention: six months.
- Newsletter Segment: `Lion Monthly Newsletter`.
- Public opt-in Topic: `Monthly Ministry Updates`.
- Privacy and Terms publication approved after a current-practice review.
- Google Workspace DKIM verification or enablement approved.
- DMARC approved only at monitoring policy `p=none`; no enforcement escalation is authorized.

## Implemented release contents

- Publication-ready Privacy and Terms pages, clean `/privacy` and `/terms` routes, homepage/footer links, and form-adjacent notices.
- Same-origin, Lion-branded general contact delivery through Resend; visitor acknowledgment and private internal message stay separate.
- Prayer and contact notifications route to the approved Jonathan-only Lion inbox.
- Private notifications use deterministic `[Lion Website Form]` subjects and Resend type tags for the six-month retention process.
- Repeat newsletter signup no longer globally unsubscribes an existing confirmed Contact while another confirmation is pending.
- Newsletter confirmation opts into the approved Topic, adds to the approved Segment, and only then enables global delivery.
- Production and Preview settings exist for both inbox routes and both Resend audience identifiers.

## External objects created without audience sends

- Resend Segment `Lion Monthly Newsletter` (`1c59b436-1263-429d-9a86-8a8a8a20db55`); verified empty at creation.
- Resend Topic `Monthly Ministry Updates` (`2142dc68-36fa-41ed-9326-3bd719b7bb1a`); verified `Opt-in` and `public`.
- No existing Contacts were imported or added.
- No Broadcast, newsletter, outreach, or other audience send was created.

## Mail authentication completed

### Google Workspace DKIM

- Generated a 2048-bit Google Workspace DKIM key using selector `google` for `thelioncompany.org`.
- Published the exact TXT record at `google._domainkey.thelioncompany.org` in the Lion Cloudflare zone.
- Verified the public TXT response independently through Cloudflare (`1.1.1.1`) and Google (`8.8.8.8`) resolvers.
- Started DKIM authentication in the Lion Google Admin account; Google Admin confirmed `Authenticating email with DKIM.`

### DMARC monitoring

- Jonathan selected `jonathan@thelioncompany.org` as the aggregate-report mailbox.
- Published the monitoring-only TXT record at `_dmarc.thelioncompany.org`:

  `v=DMARC1; p=none; pct=100; rua=mailto:jonathan@thelioncompany.org; adkim=r; aspf=r`
- Verified the exact public TXT response from both authoritative Cloudflare nameservers and independently through Cloudflare (`1.1.1.1`) and Google (`8.8.8.8`) public resolvers.

Do not move to `quarantine` or `reject` without a new approval after representative report review.

### Ongoing operational work

- Run the form-retention review monthly using `docs/lion-form-retention-runbook.md`.
- Before any newsletter Broadcast, separately approve the consent-evidenced recipient set, exclusions, content, test delivery, and final send.
- Revisit the Privacy Policy whenever providers, forms, analytics, retention, audience, or legal requirements materially change.
