# Content evidence

Dated source records for claims that control rendering. Do not add a nonprofit/legal-status row unless authoritative current evidence is supplied.

## Verified ministry channels

| Claim | Evidence | Date |
|---|---|---|
| YouTube channel `https://www.youtube.com/@TheLionCompany` is the verified ministry teaching archive | Registered in `content/destinations.ts` as a required destination; matches the production specification's audited registry | 2026-07-11 |
| TikTok `https://www.tiktok.com/@thelioncompanytx` is the verified daily-live account | Registered in `content/destinations.ts` as a required destination | 2026-07-11 |
| Podbean `https://thelioncompany.podbean.com` / RSS `https://feed.podbean.com/thelioncompany/feed.xml` is the verified podcast source | Registered in `content/destinations.ts`; seven-episode checked-in snapshot in `content/podcast-fallback.ts` was captured from this feed | 2026-07-11 |

## Teaching manifest (32 items)

All 32 `content/teachings.ts` entries carry a first-party YouTube ID sourced from the verified `@TheLionCompany` channel and a locally ledgered poster still (`docs/asset-ledger.csv`) fetched directly from `i.ytimg.com` for that exact video ID. No teaching ships an embedded player; `captionsVerified` defaults to `false` for all 32 records.

## Poster ownership

Every `public/images/teachings/*.jpg` file is an unmodified thumbnail served by YouTube's `i.ytimg.com` CDN for the corresponding ministry-owned video ID, recorded row-by-row in `docs/asset-ledger.csv` with source URL, dimensions, and review date.

## Captions and transcript state

`content/transcripts/when-gods-will-doesnt-go-your-way.txt` was derived from the public auto-generated English caption track for `TOj6tefx3rI` (retrieved 2026-07-11, source duration 2223 seconds). This is unreviewed machine-generated text. `content/evidence/teaching-transcript-reviews.json` is intentionally empty (`[]`): no teaching is eligible for an on-site player until an authorized human completes a full listen-through of all 2,223 seconds, corrects the transcript, and `scripts/record-transcript-review.mjs` records an identity/date/decision/SHA-256-bound review record. See the open human gate in the phase completion report.

## Podcast snapshot source

`content/podcast-fallback.ts` (seven episodes) reflects the verified Podbean RSS feed content available at implementation time. A maintainer refresh (`npm run refresh:podcast -- --check|--write`) is the only supported way to update it; production rendering never fetches Podbean at request time.

## Public leadership facts

Jonathan Gibson and Gina Gibson are referenced in podcast episode descriptions as public hosts of The Lion Company Podcast (see `content/podcast-fallback.ts` episode descriptions, sourced from the public Podbean feed). No additional leadership title, governance, or legal/tax-status claim is made without further authoritative verification.
