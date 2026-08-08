# Lion website form retention runbook

Lane: `LION-ORG`

Owner: Company of Lions

Applies to: private website prayer requests and general contact messages delivered to `jonathan@thelioncompany.org`.

Policy: retain each website form submission for six months, then delete it. Newsletter contacts and subscription records are outside this runbook.

## Identification

New private notifications have one of these deterministic subject prefixes:

- `[Lion Website Form] Prayer`
- `[Lion Website Form] Contact`

Resend also records the transactional tag `lion_form_type=prayer` or `lion_form_type=contact` on the corresponding private notification.

## Monthly deletion review

1. In the Lion inbox, search for messages older than six months using:

   `to:jonathan@thelioncompany.org older_than:6m {subject:"[Lion Website Form] Prayer" subject:"[Lion Website Form] Contact"}`

2. Review the complete result set before changing message state. Exclude any message that must be preserved for a documented legal, safety, or security reason.
3. Delete only the verified matching form-notification messages.
4. Search Trash with the same subject prefixes, confirm the same set, and permanently delete those matched messages. Do not empty the entire Trash folder.
5. Record the run date, reviewer, number deleted by type, and any documented preservation exception. Do not copy form contents into the log.

## Early deletion request

When a verified requester asks for deletion, locate the submission using the form email address, approximate date, and form type. Delete the matched private notification and its matched Trash copy. Record only the completion date and form type, not the submission content.

## Existing legacy subjects

Until all pre-release submissions age out, also review messages with the prior exact subjects `New prayer request` and `New website message`. Inspect every legacy match manually because those subjects are less specific.

This runbook does not authorize deleting unrelated email, newsletter contacts, delivery evidence needed for an active investigation, or data held by an outside provider beyond the controls available in the Company of Lions account.
