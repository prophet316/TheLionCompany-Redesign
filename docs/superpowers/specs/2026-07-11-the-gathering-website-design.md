# The Lion Company website redesign: The Gathering

**Date:** July 11, 2026

**Status:** Approved for implementation on July 11, 2026; giving-visibility clarification added by owner direction, with static-media, transcript-evidence, consent, and staged-release hardening recorded during implementation review the same day

**Repository:** `prophet316/TheLionCompany-Redesign`

**Production host:** `https://www.thelioncompany.org` on Vercel

## 1. Purpose

Rebuild The Lion Company website as a polished, memorable, high-performing ministry experience that helps visitors move from passive viewing into concrete participation.

The redesigned site must:

- preserve the existing GitHub-to-Vercel deployment, domain authority, GA4 property, mission language, giving destination, and Printify store;
- make daily TikTok teaching, YouTube, podcasts, prayer, newsletter, social channels, giving, and merchandise unmistakably discoverable;
- replace all `mailto:` form behavior with reliable server-side delivery and real subscriber collection;
- retain a recognizable lion identity without falling into generic black-and-gold, crest, warrior, or church-template aesthetics;
- create an evolving scroll experience that remains fast, accessible, mobile-safe, and understandable without animation;
- provide privacy, consent, retention, legal, accessibility, and abuse-protection foundations appropriate for prayer requests and email marketing;
- make the website maintainable through typed, Git-backed content rather than hard-coded duplicated markup.

## 2. Current-state evidence

The verified production source is the `main` branch at commit `492ee8d41d`. The live homepage, media page, CSS, JavaScript, and both local images match that commit byte-for-byte.

Current production characteristics:

- plain static HTML, CSS, and JavaScript;
- two user-facing pages: `/` and `/media.html`;
- Vercel hosting connected to GitHub; Wix manages DNS;
- GA4 measurement ID `G-MNK2G065ES` installed and firing;
- no Google AdSense implementation;
- three forms that only open the visitor's email client and store nothing;
- one store modal shown after 12 seconds on every reload;
- 35 media cards representing 32 unique YouTube videos;
- 211 verified public YouTube items at audit time: 114 videos and 97 Shorts;
- missing privacy, terms, sitemap, robots, favicon, canonical, structured data, and custom 404 resources;
- a mobile Lighthouse baseline of 59 Performance and 11.5-second LCP;
- an inactive Instagram link and missing Apple Podcasts, Spotify, Podbean, Threads, and X links;
- only simple fade reveals, one hero zoom, hover movement, and modal transitions;
- publicly served scraper/source artifacts that do not belong in a production web root.

Available local source assets extend beyond the repository:

- 32 Adobe Illustrator lion assets;
- nine high-resolution lion images ranging from roughly 4K to 8K;
- 35 merchandise graphics;
- several line-art lion and mane treatments suitable for SVG conversion and animation;
- script-logo experiments;
- public, ministry-owned YouTube thumbnails and episode artwork.

Before any asset ships, implementation creates `docs/asset-ledger.csv` with one row per used asset: final filename, original source path or public URL, owner, license or ownership evidence, allowed use, dimensions, transformations, alt-text decision, and reviewer/date. Assets with uncertain rights do not ship. Merchandise artwork is never repurposed outside its approved context without explicit confirmation, and public media stills are used only to identify or link to the corresponding ministry content.

Authentic ministry photography is limited in the current asset folders. The first release will use authentic media stills for teaching and podcast content, existing merchandise imagery, and abstract/vector lion work. It will not invent fake ministry participants or use generic stock-team photography.

## 3. Design thesis: The Gathering

The central metaphor is not a lion as an isolated mascot. It is the social nature of a gathering: many lives moving toward one center, Jesus.

The visitor journey is:

> **Seen -> Gathered -> Formed -> Sent**

A single visual line carries this story through the site. It begins as an abstract mane contour, connects separate voices and teachings, becomes a media waveform, passes through the prayer experience, and ends as a network of concrete participation paths.

The site should feel alive because one motif evolves with meaning. It must not feel alive merely because unrelated objects are constantly moving.

### 3.1 Brand expression

- **Primary surface:** warm parchment rather than white.
- **Primary ink:** deep aubergine-charcoal rather than pure black.
- **Single accent:** restrained clay.
- **Supporting neutrals:** warm stone and muted parchment variations only.
- **Texture:** subtle fixed grain and paper/linen materiality, never a repaint-heavy texture on scrolling containers.
- **Typography:** an editorial display serif with an open-source license, paired with a highly readable modern sans-serif. Instrument Serif and Manrope are the implementation default unless visual testing reveals a legibility problem.
- **Lion motif:** abstract mane geometry, radial gathering forms, and one carefully used lion image. Do not repeat lion faces as decorative wallpaper.
- **Photography:** documentary crops, media stills, and real ministry imagery. Never use fake community portraits.
- **Copy voice:** direct, pastoral, Jesus-centered, and specific. Avoid corporate language, generic inspiration, inflated metrics, and AI-copy cliches.

### 3.2 Motion language

The motion intensity is high in art direction but controlled in execution.

- Use GSAP with ScrollTrigger for the central line, mask reveals, selective parallax, and pinned manifesto sequence.
- Use CSS transitions for ordinary hover, focus, press, and simple entrance states.
- Animate only transforms, opacity, SVG stroke properties, and composited masks.
- Do not hijack scrolling, autoplay audio, use a custom pointer, or depend on motion to expose content.
- Keep pinned sequences limited to the hero/mission narrative on sufficiently large screens.
- Mobile converts pinned scenes into short vertical transitions.
- `prefers-reduced-motion` removes parallax, scroll scrubbing, automatic movement, and pinning while retaining the complete hierarchy and content.
- Pause continuous animation when offscreen or when the tab is hidden.
- No motion may flash more than three times per second.

## 4. Information architecture

All canonical URLs use lowercase, extensionless, slashless paths on `https://www.thelioncompany.org`.

### 4.1 Routes

| Route | Purpose |
|---|---|
| `/` | Immersive home and primary participation journey |
| `/start-here` | Mission, story, practices, leadership, and organizational transparency |
| `/live` | Daily TikTok teaching, current/next state, recent replay, and reminder guidance |
| `/teachings` | Searchable, filterable teaching library |
| `/teachings/[slug]` | Crawlable teaching detail with summary, direct video, topics, and related content |
| `/podcast` | Podcast series, episodes, platform links, and RSS |
| `/podcast/[slug]` | Crawlable podcast episode detail when feed data is sufficient |
| `/prayer` | Dedicated private prayer-request experience |
| `/connect` | Newsletter, social channels, general contact, speaking/partnership inquiry, and testimony sharing |
| `/store` | First-party editorial store handoff with tracked Printify action |
| `/give` | First-party mission/giving handoff with tracked Subsplash action |
| `/privacy` | Data handling, processors, retention, consent, and rights |
| `/terms` | Website terms |
| `/accessibility` | Accessibility commitment and contact path |
| `/newsletter/confirmed` | Non-indexable double-opt-in confirmation outcome |
| `/newsletter/expired` | Non-indexable expired-link recovery and resubscription path |
| `/newsletter/unsubscribed` | Non-indexable unsubscribe confirmation and preference path |
| unknown routes | Branded, useful page with a genuine HTTP 404 status |

### 4.2 Redirects and legacy preservation

- apex and HTTP variants resolve with 308 in one hop to the HTTPS `www` canonical host;
- `/index.html` and `/index.htm` -> `/` with 308;
- `/media.html`, `/media`, and the exact case variants recorded in the ledger -> `/teachings` with 308;
- `/product-page/the-lion-company-t-shirt` -> `/store` with 308;
- retired URLs with true equivalents use 308 to the closest equivalent;
- retired URLs without equivalents return a branded 410 rather than redirecting everything to home;
- query strings are preserved through redirects, while canonical tags omit tracking parameters.

The homepage preserves meaningful targets for the existing fragments:

`#mission`, `#podcast`, `#media`, `#prayer`, `#store`, `#contact`, and `#newsletter`.

The implementation keeps the authoritative ledger in `config/redirects.ts`. Each row contains the exact source path, case behavior, expected status, target or 410 outcome, query-string rule, evidence source, and verification date. The routes above seed the ledger; Search Console, GA4, Wix history, backlinks, and Vercel logs expand it before code freeze. Redirects are generated from this file and contract-tested from the same data, so “known variants” and “every legacy redirect” always refer to an inspectable finite list.

## 5. Homepage experience

### 5.1 Hero: one center

- Retain the foundational quote: “Whatever doesn't cause you to look like Jesus isn't of Jesus.”
- Primary action: `Join today's live`.
- Secondary action: `Start here`.
- Use a converted vector mane/connection motif that gradually assembles around the quote.
- Show `Live now` only from a validated schedule record. Never simulate a live state or author a free-form live boolean.
- When no exact schedule exists, use `Live daily on TikTok` and `See today's live on TikTok`; do not show a fabricated countdown or clock time.
- The canonical schedule record contains `startsAt`, `endsAt`, `verifiedAt`, optional `topic`, and the canonical TikTok URL. All times are ISO 8601 UTC instants; `endsAt` must be later than `startsAt` and no more than eight hours later.
- Display state is derived only from that record and the visitor clock: before `startsAt`, show `Next live`; from `startsAt` up to but not including `endsAt`, show `Live now`; from `endsAt` through 15 minutes later, show `Today's live has ended`; after that grace window, show the evergreen TikTok fallback.
- Invalid schema or impossible intervals fail content validation. A valid past record does not fail the build; it safely resolves to the evergreen fallback.

### 5.2 Immediate participation

State the relational proposition: visitors are invited to participate, not merely consume.

Four paths:

- Watch
- Pray
- Grow
- Support

These are asymmetric editorial pathways, not four equal icon cards.

### 5.3 Daily discipleship

- Current or next TikTok teaching state.
- Configurable topic and optional timestamp.
- Correct TikTok destination.
- Recent replay or teaching still when available.
- Exact timezone conversion appears only for the canonical schedule record's `startsAt`, rendered in the visitor's locale with the source timezone also available in text.
- `verifiedAt` records when a ministry owner confirmed the event. Topic copy expires with the event's 15-minute grace window. A replay is a separate record with `url`, `publishedAt`, and `expiresAt`; expired replay records are hidden.

### 5.4 Mission manifesto

Preserve the concepts of Love, Relationship, Discipleship, and Education.

Present them as a progressive human manifesto rather than a card grid. The gathering line pulls separate statements toward one center, Jesus.

### 5.5 Topic finder

Use the prompt `What are you carrying today?` to route visitors into topic-led teaching paths such as:

- fear and trust;
- purpose and calling;
- relationships and family;
- prayer and spiritual growth;
- church reform and unity;
- truth, conflict, and courage.

Topic labels must correspond to real indexed content. Empty topics stay hidden.

### 5.6 Watch and listen

- One featured teaching using a lightweight facade; do not load a YouTube iframe until intent.
- Curated topic/series paths.
- A durable `Explore hundreds of teachings on YouTube` action rather than an unverified `300+` claim.
- Latest podcast content served from the checked-in validated snapshot; an explicit maintainer refresh reads Podbean RSS and requires review, commit, and redeploy.
- Direct Apple Podcasts, Spotify, Podbean, RSS, and YouTube actions.

### 5.7 Prayer invitation

- Clear pastoral reassurance.
- Explain who receives the request and what happens after submission.
- Allow anonymous submission.
- Separate follow-up consent from the request itself.
- Include a direct link to the dedicated `/prayer` experience.

### 5.8 Connection network

Explain why a visitor might use each verified channel rather than presenting tiny anonymous icons.

- TikTok: daily live teaching and discipleship.
- YouTube: the long-form teaching archive.
- Apple Podcasts / Spotify / Podbean: audio listening.
- Instagram: active global profile and visual updates.
- Facebook: community and updates.
- Threads and X: short-form conversation, only while the verified accounts remain active.

Do not display follower counts unless an automated, reliable source exists. Counts become stale and are not the ministry value proposition.

### 5.9 Wear the vision

- Use real merchandise artwork and a strong editorial presentation.
- Explain how purchases support the mission without making unverifiable allocation claims.
- Feature a small number of products; link to the Printify catalog for the complete store.
- The first-party `/store` page records the outbound conversion before directing to Printify.

### 5.10 Monthly field notes

Permanent inline newsletter promise:

- one monthly teaching;
- current live schedule;
- new resources and podcast releases;
- ministry updates;
- occasional store or support news without making commerce the central promise.

Use explicit consent and double opt-in.

### 5.11 Final invitation

Offer four clear actions:

- begin with a teaching;
- submit a prayer request;
- join the monthly letter;
- support the mission.

The footer includes legal, accessibility, contact, verified channels, and the existing nonprofit identity after verification.

### 5.12 Giving visibility and tone

The Lion Company’s ministry work is sustained by voluntary givers. Giving must therefore be obvious and easy from every page without using guilt, false urgency, scarcity, interruption, or emotionally coercive copy.

- Desktop header, mobile navigation, homepage participation paths, final invitation, and footer all include a plainly labelled `Give` or `Give to The Lion Company` path.
- The persistent site path goes first to `/give`, where a prominent normal anchor leads to the single verified Subsplash destination from the typed registry. The path works with JavaScript and analytics disabled.
- `/give` explains calmly that voluntary gifts sustain teaching, prayer, discipleship, and Christian-unity work; it also explains that Subsplash handles payment and receipt details.
- The primary Subsplash action appears above the fold at common mobile and desktop sizes and remains keyboard- and screen-reader-operable.
- Do not use timed giving popups, donation countdowns, fabricated matching deadlines, crisis language, progress bars without authoritative current data, or copy that implies spiritual status is earned through giving.
- Release tests verify that `/give` is one obvious navigation step from every page shell and that the verified Subsplash action is one further clear step, including at 320 CSS pixels and with JavaScript disabled.

## 6. Prompt and lightbox behavior

Only one promotional invitation may appear in a visit. When an invitation becomes visible, it atomically claims that visit's promotional slot across tabs. The invitation is non-modal and does not move focus; its lightbox opens only after visitor activation, so timed logic never steals keyboard or screen-reader focus.

### 6.1 Newsletter prompt

- Eligible after either 60 seconds while the document is visible or 55% page progress, whichever occurs first.
- Never show on initial load.
- Never show while a form or dialog is active.
- Never show on `/prayer` or `/connect`, where the relevant permanent form already exists.
- The invitation is an offset editorial card on desktop and a compact safe-area-aware bottom card on mobile.
- After activation, the form opens as an editorial side lightbox on desktop and a modal bottom sheet on mobile.
- Dismissal suppresses the prompt for 30 days.
- An accepted DOI request suppresses it for seven days; reaching `/newsletter/confirmed` suppresses it indefinitely in that browser unless storage is cleared.
- Inline and prompt forms call the same server endpoint and list.
- Do not reveal the invitation while the visitor is typing, tabbing through an interactive region, playing media, selecting text, or while any menu, form error summary, dialog, or consent control is active. Resume eligibility only after 15 seconds of inactivity.

### 6.2 Store prompt

- An automatic store prompt is eligible only when the browser has recorded at least two distinct visits and either the store section has remained at least 50% visible for eight seconds or desktop exit intent occurs after the visitor has reached 60% page progress.
- Newsletter has automatic priority. The store invitation may claim the visit only when newsletter prompting is already suppressed by dismissal, a recent DOI request, or confirmed membership; trigger timing never decides the winner by race.
- The eligible `Wear the vision` edge card is the store invitation; it is not persistent and cannot appear after a newsletter invitation has claimed the visit.
- Ordinary header, footer, section, and `/store` links remain available on every visit and navigate normally; they are not promotional surfaces and do not open a lightbox.
- Never show automatically on `/prayer`, `/connect`, or `/store`.
- Dismissal suppresses it for 30 days.
- It expands from a small edge card into an editorial product story.
- It is not a full-screen timed interruption.
- The eligible edge card may appear without focus movement; only an explicit activation opens the dialog.

### 6.3 Accessibility contract

Invitation surfaces:

- use a labelled complementary region with ordinary `Open` and `Dismiss` buttons in logical DOM order;
- do not use `aria-modal`, a focus trap, an assertive live region, an inert background, or scroll lock;
- do not move the current focus when they appear;
- remain keyboard reachable without covering content or controls.

Activated newsletter and store dialogs:

- declare `role="dialog"` and `aria-modal="true"`;
- have an accessible title;
- move initial focus appropriately;
- trap focus while open;
- close with Escape, overlay, and an always-visible close control;
- restore focus to the trigger;
- make the background inert;
- prevent scroll without losing the user's position;
- remain fully operable at 320 CSS pixels and 400% zoom.

Prompt state uses shared browser storage to enforce one claimed promotional invitation per distinct visit, 30-day dismissal suppression, seven-day DOI-request suppression, and confirmed-newsletter suppression. If browser storage is unavailable or throws, no promotional invitation appears; the permanent newsletter form and ordinary store links remain available.

For a user-opened dialog, the trigger is the invitation's open control and focus returns there on close. The invitation remains mounted until focus restoration completes. After successful submission or another state that removes it, focus moves to the visible success heading or nearest surviving section heading before removal.

A “distinct visit” is one activity window separated from the previous visit by at least 30 minutes. A versioned `localStorage` record holds the last activity time, visit count, and current visit identifier; `BroadcastChannel` with the `storage` event as fallback synchronizes tabs. A short-lived cross-tab claim ensures only one promotional invitation can appear for the same visit. Opening or refreshing another tab does not increment the visit count. Two-tab and unavailable-storage behavior are mandatory tests.

## 7. Technical architecture

### 7.1 Framework and deployment

Use Next.js App Router with TypeScript, deployed in the existing Vercel project.

- Keep GitHub as the source of truth.
- Keep Wix DNS unchanged except for later email-authentication records.
- `main` remains the production branch.
- Pull requests and feature branches receive Deployment-Protected Vercel Preview deployments with no-send/test-recipient integrations. The Preview QA deployment ID and Git SHA are recorded together; Preview evidence never claims to describe a Production deployment.
- After explicit production-candidate authorization, create a separate staged Production deployment with `vercel --prod --skip-domain`. It must use the intended Production environment and resources while assigning no custom Production domain, and its generated Vercel URL must remain Deployment Protected. If that URL cannot be protected, release stops before the deployment is exercised.
- Record the staged Production deployment ID and Git SHA separately from the Preview QA deployment ID. Run the Production-build-dependent static/public-route, security-header, canonical, accessibility, visual, and performance gates against that exact protected staged deployment.
- Production form origins and Turnstile hostnames remain restricted to `https://www.thelioncompany.org`; do not weaken or spoof those contracts to submit forms from the staged `.vercel.app` URL. Preview performs the full isolated form matrix, while controlled real Production form smoke waits until the canonical domain is assigned.
- After separate promotion approval, `vercel promote <staged-production-id-or-url>` assigns the custom Production domains to that staged deployment without a rebuild. Release evidence must prove that `www.thelioncompany.org` serves the same staged Production deployment ID and Git SHA; a new deployment ID or rebuild invalidates the candidate and stops release.
- Public pages are prerendered static HTML.
- Server Components are the default.
- Client Components are isolated to navigation, live-schedule clock, scroll narrative, media facade, prompt controller, consent controls, and forms.
- Do not use `output: "export"`; POST route handlers must run on Vercel.
- Use `next/image` or equivalent responsive image generation with AVIF/WebP.
- Self-host subset WOFF2 fonts where licensing permits.

### 7.2 Code boundaries

The implementation separates:

- `content`: typed site copy, social destinations, schedule configuration, featured media, and topic taxonomy;
- `components/server`: structural page sections and metadata;
- `components/client`: isolated motion, dialogs, media facades, and forms;
- `lib/media`: maintainer-only podcast feed parsing, checked-in podcast snapshot selectors, curated YouTube manifest, first-party transcripts/stills, and validation;
- `lib/forms`: schemas, origin checks, Turnstile adapter, Brevo adapter, sanitization, and response mapping;
- `lib/analytics`: consent-aware, enumerated event helpers that accept no free-form content;
- `app/api/forms/*`: newsletter, prayer, and contact route handlers;
- `tests`: unit, integration, accessibility, redirect, and browser suites.

No global client state is needed. Prompt eligibility uses a small client controller; forms use local reducer/state machines.

### 7.3 Content sources

- Core site content and schedule configuration live in typed Git-backed files.
- Podcast episodes ship from a checked-in, schema-validated snapshot. An explicit maintainer refresh command fetches the verified Podbean RSS feed, validates and reviews the proposed diff, and then requires a normal commit and redeploy; public page rendering and production requests never depend on Podbean availability or runtime revalidation.
- YouTube uses a curated, checked-in teaching manifest generated from verified channel data. A local refresh script may update this manifest; production never depends on brittle unauthenticated scraping.
- Teaching-card and pre-play facade stills are rights-reviewed first-party files recorded in the asset ledger. No YouTube or thumbnail-host request occurs until the visitor explicitly chooses to play or leave for YouTube.
- The complete library always includes a direct YouTube channel action.
- TikTok state is manually configurable until a reliable official integration is available.
- Social destinations are centralized so header, footer, connect page, and schema cannot drift independently.

Static HTML always renders the honest evergreen TikTok fallback and a fixed-size live-status region, so a cached page cannot claim to be live and JavaScript failure does not create false information. The small live-schedule client island receives the validated schedule record, evaluates it on hydration, schedules reevaluation at the start, end, and grace-window boundaries, and reevaluates every minute plus on tab visibility and system-clock changes. Fake-clock tests cover every boundary, hydration before/inside/after an event, long-open tabs, background tabs, and JavaScript-disabled fallback without layout shift.

The initial authoritative destination registry, audited July 11, 2026, is:

| Destination | Canonical URL | Launch treatment |
|---|---|---|
| TikTok | `https://www.tiktok.com/@thelioncompanytx` | Required; fail release validation if unreachable |
| YouTube | `https://www.youtube.com/@TheLionCompany` | Required; fail release validation if unreachable |
| Apple Podcasts | `https://podcasts.apple.com/us/podcast/the-lion-company-podcast/id1783214612` | Required; fail release validation if not manually verified |
| Spotify | `https://open.spotify.com/show/2zvyq6wVX8sAf7qXd9KQg5` | Required; fail release validation if not manually verified |
| Podbean | `https://thelioncompany.podbean.com` | Required podcast source |
| Podcast RSS | `https://feed.podbean.com/thelioncompany/feed.xml` | Required maintainer-refresh source; public rendering uses the checked-in snapshot |
| Instagram | `https://www.instagram.com/thelioncompanyglobal/` | Active replacement for the obsolete `thelioncompanytx` link |
| Facebook | `https://www.facebook.com/lioncompanytx` | Show when reachable |
| Threads | `https://www.threads.com/@thelioncompanyglobal/` | Hide automatically if release validation fails |
| X | `https://x.com/lioncompanyusa` | Hide automatically if release validation fails |
| Printify store | `https://the-lion-company.printify.me/` | Required; fail release validation if unreachable |
| Subsplash giving | `https://secure.subsplash.com/ui/access/RM87PQ/` | Required; fail release validation if unreachable |

This registry lives in one typed file with a `verifiedAt` date and status per entry. Required links block release on failure. Optional channels are omitted rather than routed to a stale account. Automated checks accept expected anti-bot challenge responses from social platforms only when a manual browser verification in the release record confirms the destination and handle.

## 8. Form and data design

The initial release uses no application content database. Prayer text, contact text, names, and email addresses never enter site-owned storage. A small durable Redis-compatible store is permitted only for opaque idempotency and abuse-control keys with automatic TTLs; values contain no form content or visitor identity.

### 8.1 Provider

Brevo is the default provider for:

- newsletter contacts and double opt-in;
- monthly campaign authoring and sending;
- transactional prayer delivery;
- transactional contact delivery.

The provider is encapsulated behind an adapter so it can be replaced without rewriting UI or validation.

Development and previews use Turnstile test keys and a no-send/test-recipient mode. Production sending requires an authorized Brevo account, verified sender domain, and environment variables. No paid plan is purchased automatically.

### 8.2 Newsletter endpoint

`POST /api/forms/newsletter`

Fields:

- `submissionId`: required UUID created once per logical submission and reused for retries;
- `email`: required, normalized lowercase, maximum 254 characters;
- `firstName`: optional, maximum 80 characters;
- `consent`: required `true`;
- `placement`: enumerated `inline`, `prompt`, or `connect`;
- Turnstile token;
- hidden honeypot.

Behavior:

1. Reject non-JSON, oversized, cross-origin, malformed, honeypot, rate-limited, or Turnstile-failed requests.
2. Validate the Turnstile token on the server, including expected hostname and action.
3. Claim the opaque idempotency key, then call Brevo's native double-opt-in contact flow.
4. Store only the consent metadata needed in Brevo: consent version, timestamp, placement, and source.
5. Return the same privacy-safe accepted response for new, existing, and pending addresses.
6. Do not reveal list membership.
7. Clear the UI only after provider acceptance and show `Check your email to confirm`; provider acceptance is not described as completed membership.

Double opt-in has explicit states:

- `editing`: the visitor has not submitted;
- `submitting`: controls are locked against duplicate activation;
- `request accepted`: Brevo accepted the DOI request and the UI asks the visitor to check email;
- `confirmed`: Brevo has added the contact to the confirmed list and redirects to `/newsletter/confirmed`;
- `expired or invalid`: the provider's failed-link flow redirects to `/newsletter/expired`, where a fresh DOI request can be started without exposing whether an address exists;
- `unsubscribed`: every campaign's provider-managed unsubscribe action removes the contact from sends and redirects to `/newsletter/unsubscribed`.

Brevo is the system of record for confirmed membership, bounce, and unsubscribe status. The site event `newsletter_request_accepted` means only that the DOI request was accepted. Confirmed membership is reported from Brevo, not inferred from a browser page view. Tests verify a new request, duplicate/pending request, confirmation, expired link, confirmed-list membership, unsubscribe, suppression, and automated purge of pending contacts after 30 days.

### 8.3 Prayer endpoint

`POST /api/forms/prayer`

Fields:

- `submissionId`: required UUID created once per logical submission and reused for retries;
- `displayName`: optional, maximum 80 characters;
- `email`: optional, valid email when present;
- `request`: required, 20–4,000 characters;
- `followUpRequested`: boolean; email becomes required when `true`;
- Turnstile token;
- hidden honeypot.

Behavior:

1. Apply the same transport, origin, schema, abuse, and Turnstile controls.
2. Derive a stable, non-reversible request identifier from the submission ID and a server secret so retries remain recognizable without storing the prayer.
3. Escape all dynamic content and send both text and controlled-template HTML.
4. Use a generic email subject containing only the request identifier.
5. Deliver to a restricted ministry mailbox.
6. Use the validated visitor email only as `Reply-To`.
7. Acknowledgement, if enabled, is generic and never echoes the prayer text.
8. Do not store the request in a site database, browser storage, analytics, URLs, or application logs.
9. Return success only after provider acceptance.
10. On failure, retain the user's typed text in the form and provide an accessible retry path.

The form states that it is not continuously monitored and is not an emergency service. It directs visitors in immediate danger to local emergency resources without attempting to provide crisis counseling.

### 8.4 Contact endpoint

`POST /api/forms/contact`

Fields:

- `submissionId`: required UUID created once per logical submission and reused for retries;
- `name`: required, maximum 80 characters;
- `email`: required;
- `reason`: enumerated `speaking`, `partnership`, `media`, `testimony`, or `general`;
- `message`: required, 20–4,000 characters;
- Turnstile token;
- hidden honeypot.

It follows the prayer endpoint's validation, sanitization, delivery confirmation, generic error, and no-log rules. Testimony publishing requires a later, separate written consent process; submitting a testimony does not grant publication rights.

### 8.5 Abuse and security controls

- `POST application/json` only;
- 16 KB body cap;
- strict Zod schemas and length limits;
- exact origin allowlist;
- hidden honeypot;
- server-side Turnstile validation with action and hostname checks;
- Vercel WAF rate limits, initially five prayer/contact attempts and ten newsletter attempts per source per ten minutes;
- Redis idempotency keys formed from an HMAC of endpoint plus `submissionId`, with a five-minute processing lock and a 24-hour accepted-result TTL;
- production secrets only in scoped Vercel sensitive environment variables;
- no production provider keys in previews and no provider keys of any kind in client bundles, source maps, logs, or Git;
- controlled templates, CRLF/header-injection defense, and HTML escaping;
- request logging limited to request ID, endpoint, status, duration, and safe error class;
- CSP and security headers covering only required first-party, GA4, Turnstile, and `youtube-nocookie` browser connections; Brevo remains server-only and is absent from browser policy.

Multiple clicks and ordinary network retries reuse the same submission ID. An accepted key returns the same privacy-safe response without another provider call; a provider rejection releases the processing key for a deliberate retry. Only the opaque key state, safe status, and provider message identifier may be stored. The design does not claim mathematical exactly-once delivery across the narrow failure window where a provider accepts mail but the function crashes before recording acceptance; stable request identifiers let responders recognize that rare duplicate. Tests require no duplicates for repeated IDs during normal responses, timeouts, and concurrency, and separately exercise the indeterminate-crash recovery rule.

The production browser-policy baseline is:

- CSP: `default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self' <build-generated-hashes> https://www.googletagmanager.com https://challenges.cloudflare.com; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://challenges.cloudflare.com; img-src 'self' data: blob: https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; font-src 'self'; frame-src https://www.youtube-nocookie.com https://challenges.cloudflare.com; media-src 'self'; worker-src 'self' blob:; manifest-src 'self'; upgrade-insecure-requests`;
- `Strict-Transport-Security: max-age=31536000` at launch, without `includeSubDomains`;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()`;
- `X-Frame-Options: DENY` as a legacy companion to `frame-ancestors 'none'`.

The CSP first runs in report-only mode on preview with build-generated hashes for framework bootstrap scripts. Release tests prove that no unlisted origin is needed and that Brevo never appears in `connect-src`. Production enforcement cannot weaken to a wildcard; any unavoidable adjustment is recorded with its specific feature and regression test.

`includeSubDomains` is a separate post-launch hardening change, not part of this release. It may be added only after a complete Wix DNS export and certificate/HTTPS verification of every current subdomain, including dormant and third-party-managed records, plus explicit domain-owner approval. HSTS preload is out of scope.

### 8.6 Privacy and retention

- Prayer: no application content database; restricted mailbox retention is 90 days unless the message is explicitly labeled `active-follow-up`.
- An `active-follow-up` exception is reviewed every 30 days, may last no more than 12 months without a documented legal or safety hold approved by the data steward, and is deleted within 30 days after the conversation closes.
- Contact: messages are labeled resolved and deleted 12 months after resolution; unresolved messages receive a quarterly owner review.
- Newsletter: confirmed consent persists until unsubscribe or deletion request; suppression data persists only as needed to honor opt-out.
- Pending double opt-in contacts: purge after 30 days.
- Brevo transactional logs: one-month retention.
- Brevo email previews: disabled for prayer/contact messages.
- Opaque Redis idempotency records: automatic deletion after 24 hours; no backups or exports.
- Prayer, contact, and newsletter consent remain separate.
- Privacy policy identifies Vercel, Brevo, Cloudflare Turnstile, GA4, YouTube, Printify, Subsplash, and the mailbox provider.
- Website public location copy is `Texas-based, serving globally` until an authoritative city is confirmed.
- Marketing campaigns use the legally required postal address configured by the authorized account owner; production campaign sending is blocked until that address is supplied and verified.

Before production, a named data steward and a named mailbox administrator must own these controls. Mailbox retention rules or scheduled deletion automation apply the 90-day and 12-month policies; Brevo automation applies pending-contact purge and log settings. Auto-forwarding, local mailbox archives, and ad hoc exports of prayer/contact content are prohibited. Provider backup behavior and final-deletion timing are documented in the privacy policy. Each quarter, the data steward records privacy-safe evidence of rule configuration, aggregate deletion counts, exception count/age, and one synthetic deletion test. If the chosen mailbox or provider cannot enforce and evidence these rules, production form activation is blocked.

## 9. Analytics and consent

Preserve GA4 `G-MNK2G065ES`.

Analytics is consent-aware and receives no form values or identifiers.

- Analytics storage is denied by default before any analytics tag can execute.
- The GA4 script loads only after an affirmative analytics choice; denial creates no GA cookie or advertising identifier.
- A visitor can reopen consent settings from the footer and withdraw consent.
- The consent choice is stored separately from promotional prompt state and is never inferred from continued browsing.
- Preview deployments do not send data to the production GA4 property.

The consent state machine has `unknown`, `denied`, and `analytics-granted` states plus a version and timestamp. `unknown` behaves exactly like denied and presents a clear choice without blocking content. A decision lasts 180 days; a consent-text version change or expiry returns to `unknown`. If storage is unavailable, every visit remains denied by default. Consent changes synchronize across same-origin tabs. Withdrawal sends the denied update, stops future hits, deletes host-only, `.www.thelioncompany.org`, and `.thelioncompany.org` first-party `_ga` cookies for this property where technically possible, and persists the new denied state; a later affirmative choice sends an explicit `analytics_storage: "granted"` update before measurement resumes. There is no advertising category or advertising tag in the initial release.

Forms, navigation, search, and store/give links work regardless of analytics consent. The YouTube facade makes no third-party request until explicit play; play is a one-time functional media action using `youtube-nocookie` and is allowed even when analytics is denied, but generates no GA event in that state. With JavaScript disabled, analytics remains absent, the site content and direct media links remain available, and abuse-protected forms explain that submission requires JavaScript without exposing a prefilled prayer request in email or a URL.

Events:

- `nav_click`;
- `cta_click`;
- `social_click`;
- `tiktok_live_click`;
- `podcast_platform_click`;
- `video_start` after explicit play. The first release intentionally does not load a separate player API or infer watch progress merely to create analytics events;
- `store_prompt_view`, `store_prompt_dismiss`, `store_click`;
- `give_click`;
- `newsletter_form_start`, `newsletter_submit`, `newsletter_request_accepted`, `newsletter_error`;
- `contact_form_start`, `contact_submit`, `contact_success`, `contact_error`;
- `client_error` with only an enumerated component and safe error code, never a message, stack, free-form URL, or form state.
- `web_vital` only for home-page INP after analytics consent, with exactly `metric_name: "INP"`, an integer `metric_value_ms`, the enumerated `metric_rating`, and `page_group: "home"`; no URL, identifier, preview traffic, or free-form value is accepted.

Prayer acceptance is an aggregate first-party operational metric only: endpoint, UTC day, and accepted count, with no content, browser/session identifier, or audience export. It is not sent to advertising or audience systems.

Never send names, emails, phone numbers, prayer/contact text, Turnstile tokens, URLs containing form state, or raw provider errors to GA4 or the data layer.

One physical action produces one event. `newsletter_request_accepted` is the primary web conversion and is explicitly distinct from confirmed Brevo membership. Store, give, platform, and live clicks are secondary conversions.

Outbound measurement is best-effort and consent-gated. The real destination is always a normal server-rendered anchor that works immediately without JavaScript. When analytics is granted, an event uses `sendBeacon` or an event callback with a hard 150 ms ceiling; tracking failure never delays or cancels TikTok, podcast, store, giving, or social navigation. Tests cover granted, denied, revoked, expired-version, unavailable-storage, external-media, and JavaScript-disabled paths and assert the absence of GA cookies and requests whenever consent is not granted.

## 10. SEO and discoverability

### 10.1 Preserve authority

- Keep the home title `The Lion Company — Unity Through Christ` for launch.
- Preserve visible language around Christian unity, discipleship, church reform, love, relationship, education, Jesus, and the voluntarily giver-supported ministry mission; legal or tax-status wording remains conditional on authoritative current verification.
- Maintain one-hop redirects and a complete redirect ledger.
- Keep the current GA4 property.
- Use the verified `www` canonical everywhere.
- Submit the new sitemap through Search Console after launch.

Before code freeze, reconcile Google Search Console pages and links, GA4 landing pages, historical Wix URLs, known backlinks, and Vercel request logs. Every URL with impressions, sessions, or backlinks must have an explicit one-hop outcome in the redirect ledger; unknown historical URLs are not bulk-redirected to home.

### 10.2 Page requirements

Every indexable route has:

- a unique title and description;
- one canonical;
- one H1 and logical headings;
- absolute Open Graph and social metadata;
- a branded 1200x630 social image;
- server-rendered meaningful text;
- real crawlable anchors;
- descriptive alt text;
- consistent canonical, sitemap, Open Graph, and redirect targets.

### 10.3 Structured data

- Home: `Organization`, `WebSite`, and `WebPage`.
- Organization `sameAs`: only verified active profiles.
- Teaching detail: `VideoObject` only when visible required data exists.
- Podcast: `PodcastSeries`; valid episode details may use `PodcastEpisode`.
- Nested content: `BreadcrumbList`.

Do not publish fabricated ratings, dates, locations, live states, schedules, counts, or unsupported schema.

### 10.4 Technical resources

- `/robots.txt` returns 200 text and references the sitemap.
- `/sitemap.xml` contains only canonical, indexable 200 routes.
- favicon, Apple touch icon, manifest, theme color, and branded social images exist.
- preview deployments and form utility routes are `noindex` and access-controlled.
- custom 404 returns HTTP 404 rather than a soft 200.

## 11. Accessibility

Target WCAG 2.2 AA.

Required:

- skip link and semantic landmarks;
- persistent labels, autocomplete, helper text, inline errors, and error summary;
- focus moves to the first invalid field without clearing entered values;
- form feedback uses appropriate live regions;
- keyboard-complete navigation and interactions;
- 2px-or-stronger visible focus treatment;
- target size at least 24x24 CSS pixels, with 44x44 as the design target;
- normal text contrast at least 4.5:1 and UI/large text at least 3:1;
- no horizontal page scrolling at 320 CSS pixels or 400% zoom;
- meaningful image alternatives;
- captions plus a transcript or direct transcript path for video content;
- a transcript or equivalent complete text alternative for every audio episode embedded on the site;
- reduced-motion parity;
- VoiceOver and NVDA verification;
- accessible dialog behavior defined in section 6.3.

Any keyboard trap, inaccessible form, missing reduced-motion path, serious Axe violation, or critical contrast failure blocks launch.

The launch teaching library may index more items than it embeds. A video is eligible for an on-site player only when verified captions and a transcript or complete text-equivalent path exist; otherwise its detail page provides an accurate summary and a direct YouTube link without embedding the player. For the selected launch teaching, eligibility is derived at build time only from a structured authorized-human review record bound to the exact teaching ID, source URL and duration, reviewer/date/complete-listen-through decision, transcript path, and transcript SHA-256; a hand-set boolean, prose note, or word-count threshold cannot enable the player. A podcast episode is eligible for an on-site audio player only when a complete transcript exists; otherwise the page provides verified show notes and direct platform links. Content metadata records this eligibility so missing alternatives cannot silently regress.

## 12. Performance budget

Measure production builds using the median of three mobile runs with Slow 4G and 4x CPU slowdown.

| Metric | Launch gate |
|---|---:|
| Lighthouse mobile Performance | >=92 home; >=95 static routes |
| Lighthouse Accessibility | 100 |
| Lighthouse Best Practices | 100 |
| Lighthouse SEO | 100 |
| LCP | <=2.5 seconds |
| CLS | <=0.05 |
| TBT | <=150 ms |
| Field INP p75 after data accrues | <=200 ms |
| Initial compressed JavaScript | <=180 KB |
| Initial CSS | <=60 KB |
| LCP asset | <=300 KB |
| Transfer before user-started media | <=1.5 MB |
| Initial requests | <=60 |

Additional constraints:

- YouTube iframe loads only after user intent;
- images have dimensions and responsive AVIF/WebP sources;
- fonts are subset WOFF2 and do not cause layout shift;
- no autoplay background video on mobile;
- no primary-scroll long task over 200 ms;
- central motion sustains a median of at least 55 fps with fewer than 5% dropped frames on a physical Pixel 6 running Android 15 and current stable Chrome, or a documented slower equivalent;
- no third-party script blocks first content;
- no layout shift from fonts, consent UI, or prompts.

The device-motion gate uses a cold browser process and cleared site data, then captures a 30-second Chrome DevTools performance trace while one scripted gesture traverses the hero and manifesto. Run it three times on battery above 50%, power-saver off, device thermally normal, and no background screen recording; report the median FPS and dropped-frame percentage. The device model, OS, Chrome version, trace files, and result live in the release record. If that physical device is unavailable, the named replacement and evidence that it is slower must be approved before the gate runs.

## 13. Testing and verification

### 13.1 Automated

- unit tests for schemas, normalization, sanitization, content parsers, prompt eligibility, and analytics guards;
- integration tests for Turnstile and Brevo adapters, provider failures, duplicate subscription privacy, and no-send preview mode;
- Playwright on Chromium, Firefox, and WebKit;
- 360x800, 768x1024, and 1440x900 browser sizes;
- keyboard-only, reduced-motion, consent-denied, consent-granted, and JavaScript-disabled content smoke paths;
- Axe with zero critical/serious violations and no unreviewed moderate violations;
- link, redirect, sitemap, robots, canonical, schema, security-header, and console-error checks;
- Lighthouse CI budgets;
- secret and dependency scanning.

### 13.2 Form preview soak

Using test keys and recipients:

- 25 valid submissions per form with 100% provider acceptance;
- ten concurrent unique submissions without client- or application-generated duplicates, plus repeated-ID concurrency proving idempotent replay behavior;
- p95 handler response below 2.5 seconds;
- invalid, oversized, injected, cross-origin, replayed, honeypot, Turnstile-failed, rate-limited, offline, timeout, and provider-outage paths;
- 429 rate limits generate no provider traffic;
- provider outage yields accessible retry and no false success.

The volume soak runs only on a deployment-protected preview using a time-boxed WAF exception bound to the authenticated test runner; the exception cannot exist in production configuration. A separate production-equivalent rate-limit suite proves that the sixth prayer/contact request and eleventh newsletter request from one source in ten minutes receive 429 and create no provider call. CI fails if a soak bypass flag or credential is present in a production build.

### 13.3 Manual release matrix

- current and previous Chrome, Firefox, Edge, and Safari;
- current iPhone Safari, iPhone SE-sized viewport, Pixel/Android Chrome, and iPad orientations;
- Windows 1366x768, macOS 1440x900, and 2560px desktop;
- VoiceOver macOS/iOS and NVDA Windows;
- keyboard, 200%/400% zoom, increased text spacing, forced colors, reduced motion, slow network, and offline/reconnect;
- all external TikTok, YouTube, podcast, Instagram, Facebook, Threads/X, store, giving, and email destinations;
- all prompts, dialogs, form states, redirects, deep links, Back behavior, and preserved anchors.

## 14. Release strategy

### 14.1 Preview QA, then staged Production

1. Record the current production Vercel deployment and Git commit.
2. Preserve current HTML/screenshots/Lighthouse evidence outside the repository.
3. Build on `codex/the-gathering-rebuild`.
4. Create a Deployment-Protected Vercel Preview with Turnstile test keys, no production provider secrets, and no-send/test recipients.
5. Run the full Preview-safe automated/manual QA and isolated form, WAF, rate-limit, outage, retention, and Brevo-lifecycle gates against that immutable Preview.
6. Review content, visual quality, links, and test-provider operations, then record the Preview QA deployment ID and Git SHA together. Preview evidence remains bound to that Preview and SHA; it is not represented as Production-candidate evidence.
7. Obtain explicit production-candidate authorization before creating any deployment that uses Production environment variables or live resources.
8. Create a separate staged Production deployment with `vercel --prod --skip-domain`. Confirm that no custom Production domain was assigned, that its generated Vercel URL is Deployment Protected, and that its deployment ID resolves to the approved Git SHA. Stop if any of those checks fail.
9. Against that exact authenticated staged Production deployment, rerun every Production-build-dependent gate that can be exercised without a canonical-origin form mutation: public/static routes, redirects, real 404, canonical/robots/sitemap/schema, enforced CSP and headers, JavaScript-disabled and accessibility paths, external destinations, Lighthouse, bundles, transfer, long tasks, and approved visual/device checks. Do not relax, spoof, or add the `.vercel.app` origin to the canonical-only form or Turnstile contracts.
10. Record the staged Production deployment ID, Git SHA, gate evidence, and the separately bound Preview QA ID/SHA in the release record. Evidence must never imply that the Preview and staged Production share a deployment ID.
11. Obtain explicit promotion approval, then run `vercel promote <staged-production-id-or-url>` so Vercel assigns `www.thelioncompany.org` to the already-tested staged Production deployment without rebuilding it.
12. Verify immediately that the canonical host serves the identical staged Production deployment ID and Git SHA. A new deployment ID, build, or artifact invalidates the candidate and requires the staged-candidate gates to restart.
13. Run the controlled Production smoke below, including the real form checks that require the canonical origin. Roll back immediately on a smoke failure.
14. Do not change DNS during launch.

### 14.2 Production smoke

Immediately after the no-rebuild promotion, verify against `https://www.thelioncompany.org`:

- canonical host and every legacy redirect;
- home, teachings, podcast, connect, prayer, store, give, legal routes, sitemap, robots, and real 404;
- GA4 consent and events;
- one real newsletter double opt-in;
- one real prayer delivery;
- one real contact delivery;
- TikTok, YouTube, podcast, social, Printify, and Subsplash destinations;
- mobile navigation, reduced motion, and prompt frequency caps.

The newsletter, prayer, and contact submissions above are the first end-to-end tests against live Production form providers because the exact origin and Turnstile-hostname policy intentionally rejects the staged `.vercel.app` URL. Use controlled, visibly labeled, non-sensitive submissions only after promotion approval. Any false success, rejection caused by Production configuration, delivery failure, content leak, or unexpected provider mutation triggers immediate rollback before broader traffic validation continues.

### 14.3 Observability and alert ownership

- Vercel Observability is the source for availability, request volume, function status, latency, and 5xx rates.
- Brevo accepted-message IDs plus synthetic mailbox checks are the source for delivery; the monitoring record contains IDs and aggregate states, never message bodies or addresses.
- The consent-gated GA4 `client_error` event is the source for browser error rate among measured sessions; release smoke also treats any uncaught console error as a failure regardless of consent sample size.
- Three post-promotion Lighthouse runs form the immediate LCP comparison against the three-run baseline from the exact staged Production deployment, not the Preview QA deployment. Consent-gated field Web Vitals are evaluated after at least 200 measured home page views or seven days, whichever comes later.
- Canonical, robots, sitemap, primary routes, and redirects receive synthetic HTTP checks every five minutes for the first 24 hours and every 30 minutes through day seven.
- Form monitoring uses synthetic, visibly labeled, non-sensitive content and deletes it after verification. Three consecutive provider failures alert immediately.

Before promotion, a named release owner and backup receive Vercel/provider alerts and have permission to promote the recorded rollback deployment. Only those authorized Vercel project owners may execute rollback. The release record includes the separately bound Preview QA ID/SHA, staged Production ID/SHA, staged-candidate baseline, proof that promotion did not rebuild or change the deployment ID, monitoring links, alert recipients, rollback deployment ID, and checks at 15 minutes, one hour, 24 hours, 72 hours, and seven days.

Threshold evaluation is exact: 5xx rollback requires a five-minute rolling rate above 1% with at least 100 requests or five errors; client-error rollback requires above 2% with at least 100 measured sessions or ten identical safe-code errors in 15 minutes; form delivery rollback requires three consecutive failures or below 95% after at least 20 real/synthetic attempts; LCP rollback requires the median of three identical post-promotion runs to exceed the approved candidate by more than 30%. Availability loss, false form success, a privacy leak, wrong canonical, `noindex`, or redirect loop bypasses sample floors and triggers immediate rollback.

### 14.4 Rollback

Rollback means promoting the recorded prior Vercel deployment, not rebuilding the failed candidate, changing DNS, or deleting user submissions. The failed live deployment ID and the restored prior deployment ID are both added to the release record.

Immediate rollback triggers include:

- home or teachings unavailable;
- 5xx above 1% for five minutes;
- wrong canonical, accidental `noindex`, blocked crawl, or redirect loop;
- prayer/contact content appearing in logs, analytics, URLs, or unintended storage;
- false form success, delivery below 95%, or data loss;
- primary navigation, live, give, or store action failure on a supported browser;
- uncaught JavaScript errors above 2% of sessions;
- approved-candidate LCP regression above 30%;
- consent or CSP logic blocking core content or forms.

## 15. Operational dependencies

Implementation can begin without production credentials. Production form activation and campaign sending require:

- authorized access to the correct GitHub repository and Vercel project;
- an approved Brevo account and billing choice;
- Brevo API key, list ID, DOI template, transactional templates, sender identity, and retention settings;
- a Redis-compatible Vercel integration restricted to opaque idempotency keys, with TLS, scoped credentials, and TTL enforcement;
- Wix DNS access for Brevo verification, DKIM, and DMARC records without replacing unrelated records or creating a second SPF record;
- a Cloudflare account and production Turnstile widget;
- restricted ministry mailbox destination and named responders with MFA;
- an approved physical postal address for marketing email compliance;
- GA4 property access;
- Google Search Console property access for URL export, sitemap submission, and post-launch coverage review, or a named property owner who performs the documented handoff and returns dated evidence;
- a named data steward, mailbox administrator, release owner, and rollback backup;
- a documented prayer escalation and mailbox-cleanup practice;
- exact parity between every shipped image, font, SVG, or code-defined artwork and a complete rights-reviewed shipping-ledger row; an unlisted shipped asset or stale ledger row fails release;
- access to the named physical Android performance device or an approved slower replacement.

If these are not available at first preview, adapters run in verified no-send/test mode and the preview visibly identifies forms as test-only to authorized reviewers. Production forms never display a success state without real provider acceptance.

## 16. Non-goals for the initial release

- no authenticated member portal;
- no public prayer wall;
- no custom commerce checkout or replacement for Printify;
- no replacement for Subsplash giving;
- no ministry case-management database;
- no fabricated automated TikTok live detector;
- no CMS subscription before Git-backed content proves insufficient;
- no AdSense implementation unless separately requested and a valid publisher account is provided;
- no automatic publication of testimony submissions;
- no promise of a specific Google ranking.

## 17. Definition of success

The redesign is successful when a new visitor can immediately understand the mission, find today's teaching, explore hundreds of teachings, listen on their preferred podcast platform, submit a prayer request without depending on local email software, join a double-opt-in monthly list, reach every verified social channel, visit the store, give, or contact the ministry—and when every one of those paths is fast, accessible, measurable without PII, secure, and verifiably working on production.
