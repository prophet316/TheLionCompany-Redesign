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

- Resend Segment `Lion Monthly Newsletter`; verified empty at creation.
- Resend Topic `Monthly Ministry Updates`; verified `Opt-in` and `public`.
- No existing Contacts were imported or added.
- No Broadcast, newsletter, outreach, or other audience send was created.

## Remaining exact gates

### Google Workspace DKIM

Public DNS has Google Workspace SPF, but the default `google._domainkey` selector does not currently resolve. Google Admin requires Jonathan's passkey before the exact selector/key can be generated or signing status can be changed. Keep that reauthentication scoped to the Lion Google account.

### DMARC reporting destination

No current `_dmarc` TXT record or existing DMARC-report delivery was found. Do not publish a record until an exact reporting mailbox or Group is selected and verified able to receive aggregate XML reports. The approved starting policy remains monitoring-only:

`v=DMARC1; p=none; pct=100; rua=mailto:<approved-reporting-address>; adkim=r; aspf=r`

Do not move to `quarantine` or `reject` without a new approval after representative report review.

### Ongoing operational work

- Run the form-retention review monthly using `docs/lion-form-retention-runbook.md`.
- Before any newsletter Broadcast, separately approve the consent-evidenced recipient set, exclusions, content, test delivery, and final send.
- Revisit the Privacy Policy whenever providers, forms, analytics, retention, audience, or legal requirements materially change.
