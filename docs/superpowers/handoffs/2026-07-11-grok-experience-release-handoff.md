# Grok Build handoff: The Gathering experience and release

You are the implementation owner for the experience/motion/media and verification/release phases of The Lion Company’s approved “The Gathering” rebuild.

Work in `/Users/jonathangibson/Antigravity/TheLionCompany` on `codex/the-gathering-rebuild`. Do not create a competing design, change the approved scope, push, deploy, promote, buy a service, alter DNS, or use Production provider resources. Preserve unrelated user changes. Commit each completed task separately with the commit message specified by its plan.

## Read before editing

Read these files completely, in order:

1. `docs/superpowers/specs/2026-07-11-the-gathering-website-design.md`
2. `docs/superpowers/plans/2026-07-11-the-gathering-rebuild.md`
3. `docs/superpowers/plans/2026-07-11-the-gathering-experience-motion-media.md`
4. `docs/superpowers/plans/2026-07-11-the-gathering-verification-release.md`

Use the pinned versions, interfaces, tests, commands, evidence boundaries, and task order exactly. Write tests before implementation where the task says to do so. Never weaken a failing contract merely to make it green.

## Your sequential phases

Determine the next authorized Grok phase from current Git history and execute only that phase:

1. **Grok A — Experience Tasks 1–6.** Start only after Foundation Tasks 1–8 pass their code, asset, build, and browser gates with the selected teaching safely ineligible/direct-link-only. `npm run check:transcript-review` may still report the explicit authorized-human pending state. Complete Experience Tasks 1–6 and stop.
2. **Grok B — Experience Tasks 7–8.** Start only after Claude has completed Forms Tasks 1–6 **and** `npm run check:transcript-review` exits 0. The homepage featured-player composition must not begin while that human gate is pending. Complete Experience Tasks 7–8 and stop.
3. **Grok C — Experience Task 9.** Start only after Claude has completed Forms Task 7. Complete Experience Task 9 and stop.
4. **Grok D — Verification Tasks 1–7.** Start only after Claude has completed Forms Task 8. Implement and verify the complete local/Preview-safe release system, but do not create a staged Production deployment or promote anything without a fresh, explicit owner authorization. Stop at the first authorization boundary.

If the preceding dependency is absent, do not improvise around it. Report the missing commit/phase and stop without editing.

## Non-negotiable product rules

- The result must feel authored and high-end: parchment, aubergine-charcoal, restrained clay, Instrument Serif/Manrope, and the semantic mane → connection → waveform → network journey. No black/gold crest, warrior, generic church template, scroll hijacking, autoplay, custom cursor, or motion-only content.
- Giving is obvious but calm across desktop header, mobile navigation, homepage participation, final invitation, footer, and `/give`; the exact Subsplash anchor is above the fold at mobile and desktop and works without JavaScript.
- The selected teaching cannot embed until the authorized-human transcript evidence gate passes. No YouTube or thumbnail-host request occurs before visitor play/exit intent.
- Analytics remains absent before consent; withdrawal removes host and parent-domain GA cookies, synchronizes tabs, and re-grant explicitly restores analytics storage.
- Promotional invitations never steal focus, show at most once per visit across tabs, honor exact suppressions, and fail closed only when storage itself is unavailable.
- Live state is schedule-derived and honest; an active replay remains visible alongside next/live state, and `/live` explains TikTok-controlled reminder settings.
- Every shipped visual/font/art source has exact ledger parity. No unreviewed asset ships.

## Release boundary

- Full-volume forms testing stays on a protected Preview using isolated/no-send or test-recipient resources.
- After separate production-candidate authorization, the only staged path is `vercel --prod --skip-domain`; the generated URL must remain protected and must receive no custom domain.
- Never spoof or add the staged `.vercel.app` origin to Production forms or Turnstile.
- Promotion is a separately authorized no-rebuild `vercel promote <staged-id-or-url>` operation. The staged deployment ID/SHA must remain identical at `www`.
- Real Production form E2E starts only after promotion on the canonical host and triggers immediate rollback on failure.
- Completion requires the sealed 20-gate launch record, 35-gate closeout record, seven elapsed days, at least 200 measured home views, and INP p75 at or below 200 ms.

## Completion report

At the end of each Grok phase, output only:

- phase completed;
- commits created;
- tests/checks run with pass/fail totals;
- visual/browser evidence produced;
- any human, provider, device, or Production-authorization gate still open;
- current clean/dirty Git status;
- the exact next authorized Claude or Grok phase.

Do not begin the next interleaved phase in the same run.
