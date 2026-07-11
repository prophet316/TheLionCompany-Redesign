# The Gathering Experience, Motion, and Media Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the accessible, high-performance “Seen → Gathered → Formed → Sent” visitor experience across the site shell, homepage, live status, teaching and podcast libraries, media playback, promotional prompts, consent-aware analytics, and store/give/connect journeys.

**Architecture:** Preserve Server Components for all crawlable content and isolate browser behavior into narrow Client Components. The foundation plan owns the typed content registry, metadata helpers, route scaffolding, and semantic server shells; this plan finishes the visual system and experience layer against those exact interfaces. State-heavy behavior is implemented as pure tested reducers/selectors first, then connected to DOM, storage, GSAP, YouTube, and GA4 adapters.

**Tech Stack:** Node.js 22.x; Next.js 16.2.10 App Router; React 19.2.7; TypeScript 5.9.3; CSS Modules plus global CSS tokens; GSAP 3.15.0 with ScrollTrigger; Vitest 4.1.10; React Testing Library; Playwright 1.61.1; @axe-core/playwright 4.12.1.

## Global Constraints

- Canonical URLs are lowercase, extensionless, slashless paths on `https://www.thelioncompany.org`.
- Public pages are prerendered static HTML; Server Components are the default and Client Components are limited to navigation, live schedule clock, scroll narrative, media facade, prompt controller, consent controls, and forms.
- Do not enable `output: "export"`; Vercel route handlers must remain available.
- The visual system uses warm parchment, deep aubergine-charcoal, one restrained clay accent, warm stone neutrals, subtle grain, Instrument Serif, and Manrope; do not introduce generic black/gold, crest, warrior, or church-template styling.
- The visitor journey is “Seen → Gathered → Formed → Sent”; one visual line evolves from mane contour to connection line to waveform to participation network.
- Motion may animate only transforms, opacity, SVG stroke properties, and composited masks; it may not hijack scrolling, autoplay audio, use a custom pointer, flash more than three times per second, or expose content only through animation.
- `prefers-reduced-motion` removes parallax, scroll scrubbing, automatic movement, and pinning while preserving the complete hierarchy and content.
- Continuous animation pauses offscreen and while the document is hidden.
- Mobile uses short vertical transitions instead of pinned scenes.
- Static HTML always renders the honest evergreen TikTok fallback. “Live now” is derived only from a validated schedule record; no free-form live boolean or fabricated countdown is allowed.
- A YouTube iframe is never requested before explicit visitor activation and must use `youtube-nocookie.com`.
- A teaching may embed a player only when `captionsVerified === true` and a complete reviewed first-party transcript exists. A podcast episode may render an on-site audio player only when a complete transcript exists and its audio is hosted first-party under the CSP; current Podbean audio remains a direct outbound link.
- Analytics storage is denied by default; the GA4 script and all GA events remain absent until an affirmative analytics choice. Preview deployments never send to production GA4 `G-MNK2G065ES`.
- Analytics accepts enumerated event names and safe enumerated properties only; names, emails, prayer/contact text, Turnstile tokens, raw errors, stacks, and form state never enter analytics.
- Prompt state is independent from analytics consent. If browser storage is unavailable or throws, no promotional invitation appears.
- Only one promotional invitation may claim a distinct visit across tabs. A visit is one activity window separated by at least 30 minutes.
- Newsletter invitation eligibility begins after 60 visible seconds or 55% progress, never on initial load, and resumes only after 15 seconds of interaction inactivity.
- Newsletter dismissal suppresses 30 days; accepted DOI suppresses seven days; confirmation suppresses indefinitely in that browser until storage is cleared.
- Store automation requires visit count of at least two and either 50% store-section visibility for eight seconds or desktop exit intent after 60% progress. Newsletter suppression is a prerequisite and store dismissal suppresses 30 days.
- Invitation surfaces are labelled complementary regions, never move focus, and are not modal. Activated dialogs use `role="dialog"`, `aria-modal="true"`, focus trapping, Escape/overlay/visible-close dismissal, inert background, scroll lock, and trigger focus restoration.
- The permanent inline newsletter form and ordinary server-rendered store/give/media anchors work regardless of prompts, storage, analytics, or JavaScript.
- Giving is a calm, persistent participation path in the desktop header, mobile menu, homepage, footer, and dedicated `/give` handoff; it reaches the one verified Subsplash destination without guilt, false urgency, donation countdowns, or timed giving prompts.
- WCAG 2.2 AA is the launch target. Keyboard traps, inaccessible forms, missing reduced-motion parity, serious Axe violations, critical contrast failures, horizontal scrolling at 320 CSS pixels, and failures at 400% zoom block launch.
- Focus indicators are at least 2 CSS pixels; targets are at least 24×24 CSS pixels with 44×44 as the design target; normal text contrast is at least 4.5:1 and UI/large text is at least 3:1.
- Performance gates: mobile Lighthouse Performance ≥92 on home and ≥95 on static routes; Accessibility, Best Practices, and SEO 100; LCP ≤2.5 seconds; CLS ≤0.05; TBT ≤150 ms; initial compressed JavaScript ≤180 KB; initial CSS ≤60 KB; LCP asset ≤300 KB; transfer before user-started media ≤1.5 MB; initial requests ≤60.
- No third-party script blocks first content, no primary-scroll long task exceeds 200 ms, and no layout shift may come from fonts, consent UI, prompts, media, or live status.
- Use CSS Modules and global design tokens; do not add Tailwind.
- Use only rights-cleared assets recorded in `docs/asset-ledger.csv`; do not invent ministry participants or reuse merchandise art outside its approved context.
- Location copy remains “Texas-based, serving globally” until an authoritative city is confirmed.

---

## Foundation Contract

This plan begins after the foundation plan is complete. The implementer must run `npm test -- --run` and `npm run typecheck` before Task 1; both commands must pass. The following exports are authoritative and must not be duplicated:

~~~ts
// lib/content/types.ts
export type DestinationKey =
  | "tiktok"
  | "youtube"
  | "applePodcasts"
  | "spotify"
  | "podbean"
  | "podcastRss"
  | "instagram"
  | "facebook"
  | "threads"
  | "x"
  | "printify"
  | "subsplash";

export interface Destination {
  readonly key: DestinationKey;
  readonly label: string;
  readonly href: string;
  readonly purpose: string;
  readonly kind: "social" | "podcast" | "feed" | "commerce" | "giving";
  readonly required: boolean;
  readonly visible: boolean;
  readonly verifiedAt: string;
}

export interface LiveSchedule {
  readonly startsAt: string;
  readonly endsAt: string;
  readonly sourceTimeZone: string;
  readonly verifiedAt: string;
  readonly topic?: string;
  readonly url: string;
}

export type TopicSlug =
  | "fear-and-trust"
  | "purpose-and-calling"
  | "relationships-and-family"
  | "prayer-and-spiritual-growth"
  | "church-reform-and-unity"
  | "truth-conflict-and-courage";

export interface RecentReplay {
  readonly title: string;
  readonly url: string;
  readonly publishedAt: string;
  readonly expiresAt: string;
}

export interface TopicDefinition {
  readonly slug: string;
  readonly label: string;
  readonly prompt: string;
  readonly description: string;
}

export interface Teaching {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly youtubeId: string;
  readonly posterPath: `/images/teachings/${string}.jpg`;
  readonly publishedAt: string | null;
  readonly topics: readonly TopicSlug[];
  readonly series: string | null;
  readonly captionsVerified: boolean;
  readonly transcriptUrl: string | null;
  readonly featured: boolean;
}

export interface PodcastEpisode {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly publishedAt: string;
  readonly durationSeconds: number | null;
  readonly audioUrl: string;
  readonly pageUrl: string;
  readonly imageUrl: string | null;
  readonly episodeNumber: number | null;
  readonly transcriptUrl: string | null;
}
~~~

~~~ts
// Content and selector exports supplied by the foundation plan.
import { siteContent } from "@/content/site";
import { destinationRegistry, activeSameAs } from "@/content/destinations";
import { liveSchedule, recentReplay } from "@/content/live";
import { topicDefinitions } from "@/content/topics";
import { teachings } from "@/content/teachings";
import {
  getDestination,
  getTeachingBySlug,
  getTeachingSlugs,
  getTopicBySlug,
} from "@/lib/content";
import { getPublishedPodcastEpisodes } from "@/lib/media/podcast-feed";
import { createPageMetadata } from "@/lib/seo/metadata";
~~~

The forms plan owns these UI components and contracts. Experience tasks consume them without changing their submission logic:

~~~ts
// components/client/forms/newsletter-form.tsx
export interface NewsletterFormProps {
  placement: "inline" | "prompt" | "connect";
  onAccepted?: () => void;
  headingId?: string;
  className?: string;
}
export function NewsletterForm(props: NewsletterFormProps): React.ReactElement;

// components/client/forms/prayer-form.tsx
export interface PrayerFormProps {
  placement: "home" | "prayer";
  className?: string;
}
export function PrayerForm(props: PrayerFormProps): React.ReactElement;

// components/client/forms/contact-form.tsx
import type { ContactReason } from "@/lib/forms/contracts";
export interface ContactFormProps {
  defaultReason?: ContactReason;
  className?: string;
}
export function ContactForm(props: ContactFormProps): React.ReactElement;
~~~

## Exact File Map

| File | Responsibility |
|---|---|
| `app/globals.css` | Reset, licensed local-font faces, visual tokens, base typography, focus, layout, grain, reduced-motion, and forced-colors rules |
| `components/ui/action-link.tsx` | Consistent internal/external link variants and arrow affordance |
| `components/ui/section-heading.tsx` | Reusable eyebrow/title/body heading primitive |
| `components/ui/channel-mark.tsx` | Text-safe channel monogram without third-party icon packages |
| `components/client/experience-providers.tsx` | Global consent, analytics, and prompt orchestration boundary |
| `components/client/mobile-navigation.tsx` | Disclosure-based mobile menu, focus management, Escape, route-close, and scroll lock |
| `components/server/site-header.tsx` | Desktop/mobile primary navigation and skip target |
| `components/server/site-footer.tsx` | Verified destinations, participation paths, legal links, consent settings control |
| `components/server/page-intro.tsx` | Editorial route masthead |
| `lib/live/status.ts` | Pure schedule state derivation, named source timezone, replay expiry, and next reevaluation instant |
| `components/client/live-status.tsx` | Fixed-size clock island that upgrades honest server fallback |
| `lib/media/eligibility.ts` | First-party transcript/audio eligibility and privacy-enhanced YouTube embed URL helper |
| `components/client/video-facade.tsx` | Intent-gated, caption/transcript-safe YouTube facade |
| `components/client/audio-player.tsx` | Transcript-gated native podcast player |
| `lib/analytics/contracts.ts` | Enumerated event and safe-property contract |
| `lib/analytics/consent.ts` | Pure consent parsing, expiry, and cookie-removal helpers |
| `components/client/analytics-provider.tsx` | Consent state, deferred GA4 loading, withdrawal, and event dispatch |
| `components/client/consent-controls.tsx` | Non-blocking consent card and settings dialog |
| `components/client/tracked-link.tsx` | Consent-gated best-effort outbound events without navigation delay |
| `components/client/teaching-library.tsx` | URL-backed search/topic filtering and accessible results status |
| `components/server/teaching-card.tsx` | Crawlable teaching summary |
| `app/teachings/page.tsx` | Searchable teaching index |
| `app/teachings/[slug]/page.tsx` | Static teaching detail and eligibility-safe media |
| `components/server/podcast-card.tsx` | Crawlable podcast episode summary and listening actions |
| `app/podcast/page.tsx` | Podcast series and episodes |
| `app/podcast/[slug]/page.tsx` | Static podcast episode detail and transcript-gated player |
| `components/server/home/hero.tsx` | One-center hero and live island |
| `components/server/home/participation-paths.tsx` | Asymmetric Watch/Pray/Grow/Support paths |
| `components/server/home/topic-finder.tsx` | “What are you carrying today?” topic entry points |
| `components/server/home/watch-listen.tsx` | Featured teaching and latest podcast preview |
| `components/server/home/connection-network.tsx` | Verified channel-purpose network |
| `components/server/home/final-invitation.tsx` | Four final actions |
| `components/client/gathering-line.tsx` | Progressive mane/connection/waveform/network SVG stages, desktop manifesto pin/masks/parallax, mobile transitions, and reduced-motion parity |
| `app/page.tsx` | Server-rendered home journey composition |
| `lib/prompts/model.ts` | Versioned storage model, visit/session derivation, suppressions, and eligibility selectors |
| `lib/prompts/storage.ts` | Safe prompt persistence, DOI/confirmation markers, visit opening, and atomic claim entry point |
| `lib/prompts/channel.ts` | LocalStorage/BroadcastChannel synchronization and atomic visit claim |
| `components/client/dialog.tsx` | Accessible modal primitive with focus trap, inert background, scroll restoration, and trigger restoration |
| `components/client/prompt-controller.tsx` | Visible-time/progress/inactivity/store-observer orchestration |
| `components/client/prompt-invitations.tsx` | Complementary invitation cards and activated newsletter/store dialogs |
| `app/connect/page.tsx` | Newsletter, contact, and verified channel-purpose journey |
| `app/store/page.tsx` | First-party editorial Printify handoff |
| `app/give/page.tsx` | First-party Subsplash mission handoff |
| `app/participation.module.css` | Shared connect, store, and give editorial layouts |
| `tests/unit/live-status.test.ts` | Schedule boundary and recheck tests |
| `tests/unit/media-eligibility.test.ts` | Transcript/caption eligibility and URL tests |
| `tests/unit/analytics-consent.test.ts` | Consent parsing, expiry, unavailable storage, and event safety |
| `tests/unit/prompt-model.test.ts` | Visit, priority, timing, suppression, and no-storage tests |
| `tests/components/mobile-navigation.test.tsx` | Menu accessibility and lifecycle |
| `tests/components/video-facade.test.tsx` | No-request-before-intent and iframe lifecycle |
| `tests/components/teaching-library.test.tsx` | Search/filter/URL behavior |
| `tests/components/dialog.test.tsx` | Focus trap, Escape, inert, scroll, and restoration |
| `tests/components/prompt-controller.test.tsx` | Invitation and cross-tab integration behavior |
| `tests/e2e/experience.spec.ts` | Cross-route keyboard, mobile, media, reduced-motion, consent, prompt, and no-JS acceptance |

---

### Task 1: Establish the design tokens and server-safe UI primitives

**Files:**
- Modify: `app/globals.css`
- Create: `components/ui/action-link.tsx`
- Create: `components/ui/action-link.module.css`
- Create: `components/ui/section-heading.tsx`
- Create: `components/ui/section-heading.module.css`
- Create: `components/ui/channel-mark.tsx`
- Test: `tests/components/ui-primitives.test.tsx`

**Interfaces:**
- Consumes: Next.js `Link`; global font variables `--font-instrument-serif` and `--font-manrope` supplied by the foundation layout.
- Produces: server-safe `ActionLink({ href, children, tone?, external? })`, `SectionHeading({ eyebrow, title, body?, align?, id? })`, and `ChannelMark({ label })`; Task 2 adds the optional closed-schema CTA tracking adapter after analytics exists.

- [ ] **Step 1: Write the failing primitive test**

~~~tsx
// tests/components/ui-primitives.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActionLink } from "@/components/ui/action-link";
import { ChannelMark } from "@/components/ui/channel-mark";
import { SectionHeading } from "@/components/ui/section-heading";

describe("experience UI primitives", () => {
  it("renders an external action with safe browsing semantics", () => {
    render(
      <ActionLink href="https://example.com" external>
        Visit
      </ActionLink>,
    );
    expect(screen.getByRole("link", { name: /visit/i })).toHaveAttribute(
      "rel",
      "noreferrer",
    );
    expect(screen.getByRole("link", { name: /visit/i })).toHaveAttribute(
      "target",
      "_blank",
    );
  });

  it("preserves a logical heading and a text fallback channel mark", () => {
    render(
      <>
        <SectionHeading eyebrow="Watch" title="Teachings for real life" id="watch" />
        <ChannelMark label="YouTube" />
      </>,
    );
    expect(screen.getByRole("heading", { level: 2, name: /teachings/i })).toHaveAttribute(
      "id",
      "watch",
    );
    expect(screen.getByText("YO", { selector: "[aria-hidden=true]" })).toBeVisible();
    expect(screen.getByText("YouTube", { selector: ".sr-only" })).toBeVisible();
  });
});
~~~

- [ ] **Step 2: Run the focused test and verify the missing modules fail**

Run: `npm test -- --run tests/components/ui-primitives.test.tsx`

Expected: FAIL with module-resolution errors for `@/components/ui/action-link`, `section-heading`, and `channel-mark`.

- [ ] **Step 3: Add the complete global visual foundation**

~~~css
/* app/globals.css */
@import "../styles/tokens.css";

:root {
  color-scheme: light;
  --paper: var(--color-parchment);
  --paper-raised: var(--color-surface);
  --paper-deep: var(--color-parchment-muted);
  --ink: var(--color-ink);
  --ink-soft: var(--color-ink-muted);
  --clay: var(--color-accent);
  --clay-dark: #733326;
  --stone: var(--color-stone);
  --line: color-mix(in srgb, var(--ink) 18%, transparent);
  --focus: #1c6478;
  --success: #27634a;
  --danger: #8b2d2b;
  --font-display: var(--font-instrument-serif), Georgia, serif;
  --font-body: var(--font-manrope), Arial, sans-serif;
  --step--1: clamp(0.79rem, 0.76rem + 0.13vw, 0.88rem);
  --step-0: clamp(1rem, 0.96rem + 0.2vw, 1.13rem);
  --step-1: clamp(1.25rem, 1.13rem + 0.6vw, 1.6rem);
  --step-2: clamp(1.56rem, 1.34rem + 1.1vw, 2.2rem);
  --step-3: clamp(2rem, 1.55rem + 2.2vw, 3.5rem);
  --step-4: clamp(2.8rem, 1.85rem + 4.75vw, 6.6rem);
  --space-1: 0.5rem;
  --space-2: 0.75rem;
  --space-3: 1rem;
  --space-4: 1.5rem;
  --space-5: 2rem;
  --space-6: 3rem;
  --space-7: 4.5rem;
  --space-8: 7rem;
  --measure: 68rem;
  --measure-wide: 84rem;
  --radius-small: 0.35rem;
  --radius-large: 1.25rem;
  --shadow: 0 1.5rem 4rem rgb(36 21 31 / 0.12);
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  background: var(--paper);
  scroll-behavior: smooth;
  scroll-padding-top: 6rem;
}

body {
  min-width: 20rem;
  margin: 0;
  overflow-x: clip;
  background:
    radial-gradient(circle at 10% 0%, rgb(255 255 255 / 0.5), transparent 30rem),
    var(--paper);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: var(--step-0);
  line-height: 1.65;
  text-rendering: optimizeLegibility;
}

body::before {
  position: fixed;
  z-index: 100;
  inset: 0;
  pointer-events: none;
  content: "";
  opacity: 0.13;
  background-image:
    repeating-radial-gradient(circle at 20% 30%, rgb(36 21 31 / 0.16) 0 0.4px, transparent 0.6px 3px),
    repeating-radial-gradient(circle at 75% 65%, rgb(150 69 50 / 0.12) 0 0.35px, transparent 0.6px 4px);
  background-size: 11rem 13rem, 17rem 19rem;
  mix-blend-mode: multiply;
}

body[data-scroll-lock="true"] {
  overflow: hidden;
}

a {
  color: inherit;
}

button,
input,
textarea,
select {
  color: inherit;
  font: inherit;
}

button,
a {
  -webkit-tap-highlight-color: transparent;
}

:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 4px;
}

::selection {
  background: var(--clay);
  color: var(--paper-raised);
}

h1,
h2,
h3,
p {
  margin-block-start: 0;
}

h1,
h2,
h3 {
  text-wrap: balance;
}

p {
  text-wrap: pretty;
}

img,
svg,
video,
iframe {
  display: block;
  max-width: 100%;
}

.container {
  width: min(calc(100% - 2rem), var(--measure));
  margin-inline: auto;
}

.containerWide {
  width: min(calc(100% - 2rem), var(--measure-wide));
  margin-inline: auto;
}

.section {
  position: relative;
  padding-block: var(--space-8);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  white-space: nowrap;
  border: 0;
  clip: rect(0, 0, 0, 0);
}

.skip-link {
  position: fixed;
  z-index: 1000;
  inset: 0 auto auto 1rem;
  translate: 0 -150%;
  padding: 0.75rem 1rem;
  background: var(--ink);
  color: var(--paper-raised);
}

.skip-link:focus {
  translate: 0 1rem;
}

@media (max-width: 48rem) {
  :root {
    --space-8: 4.5rem;
  }

  .container,
  .containerWide {
    width: min(calc(100% - 1.25rem), var(--measure));
  }
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }

  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (forced-colors: active) {
  body::before {
    display: none;
  }

  :focus-visible {
    outline-color: Highlight;
  }
}
~~~

- [ ] **Step 4: Add the complete UI primitives**

~~~tsx
// components/ui/action-link.tsx
import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./action-link.module.css";

export interface ActionLinkProps {
  readonly href: string;
  readonly children: ReactNode;
  readonly tone?: "ink" | "clay" | "quiet";
  readonly external?: boolean;
  readonly className?: string;
}

export function ActionLink({
  href,
  children,
  tone = "ink",
  external = false,
  className,
}: ActionLinkProps) {
  const classes = [styles.action, styles[tone], className].filter(Boolean).join(" ");
  const content = (
    <>
      <span>{children}</span>
      <span aria-hidden="true">↗</span>
    </>
  );

  if (external) {
    return (
      <a className={classes} href={href} rel="noreferrer" target="_blank">
        {content}
      </a>
    );
  }

  return (
    <Link className={classes} href={href}>
      {content}
    </Link>
  );
}

// components/ui/section-heading.tsx
import styles from "./section-heading.module.css";

export interface SectionHeadingProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly body?: string;
  readonly align?: "start" | "center";
  readonly id?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  align = "start",
  id,
}: SectionHeadingProps) {
  return (
    <header className={styles[align]}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h2 className={styles.title} id={id}>
        {title}
      </h2>
      {body ? <p className={styles.body}>{body}</p> : null}
    </header>
  );
}

// components/ui/channel-mark.tsx
export function ChannelMark({ label }: { readonly label: string }) {
  const mark = label
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span>
      <span aria-hidden="true">{mark}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
~~~

~~~css
/* components/ui/action-link.module.css */
.action {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.72rem 1rem;
  border: 1px solid currentColor;
  border-radius: 999px;
  font-size: var(--step--1);
  font-weight: 750;
  letter-spacing: 0.055em;
  line-height: 1;
  text-decoration: none;
  text-transform: uppercase;
  transition:
    transform 220ms var(--ease-out),
    background-color 220ms var(--ease-out),
    color 220ms var(--ease-out);
}

.action:hover {
  transform: translateY(-2px);
}

.ink {
  background: var(--ink);
  color: var(--paper-raised);
}

.clay {
  background: var(--clay);
  color: var(--paper-raised);
}

.quiet {
  background: transparent;
  color: var(--ink);
}

/* components/ui/section-heading.module.css */
.start,
.center {
  max-width: 48rem;
}

.center {
  margin-inline: auto;
  text-align: center;
}

.eyebrow {
  margin-block-end: var(--space-2);
  color: var(--clay-dark);
  font-size: var(--step--1);
  font-weight: 800;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.title {
  margin-block-end: var(--space-3);
  font-family: var(--font-display);
  font-size: var(--step-3);
  font-weight: 400;
  letter-spacing: -0.025em;
  line-height: 0.98;
}

.body {
  max-width: 42rem;
  margin-block-end: 0;
  color: var(--ink-soft);
}
~~~

- [ ] **Step 5: Re-run the primitive test and quality gates**

Run: `npm test -- --run tests/components/ui-primitives.test.tsx && npm run typecheck && npm run lint`

Expected: the focused suite reports 2 passing tests; TypeScript and lint exit 0.

- [ ] **Step 6: Commit the visual foundation**

~~~bash
git add app/globals.css components/ui tests/components/ui-primitives.test.tsx
git commit -m "feat: establish Gathering design primitives"
~~~

### Task 2: Add consent-aware analytics and outbound measurement

**Files:**
- Create: `lib/analytics/contracts.ts`
- Create: `lib/analytics/consent.ts`
- Create: `components/client/analytics-provider.tsx`
- Create: `components/client/consent-controls.tsx`
- Create: `components/client/consent-controls.module.css`
- Create: `components/client/tracked-link.tsx`
- Create: `components/client/web-vitals-reporter.tsx`
- Create: `components/client/experience-providers.tsx`
- Modify: `components/ui/action-link.tsx`
- Modify: `app/layout.tsx`
- Test: `tests/unit/analytics-consent.test.ts`
- Test: `tests/components/analytics-provider.test.tsx`
- Test: `tests/components/web-vitals-reporter.test.tsx`

**Interfaces:**
- Consumes: GA4 measurement ID `G-MNK2G065ES`; `process.env.VERCEL_ENV`; server-rendered children.
- Produces: `AnalyticsProvider`, `useAnalytics(): { consent, setConsent, openSettings, track }`, `ConsentControls`, `TrackedLink`, a home-only consent-gated INP `WebVitalsReporter`, and `ExperienceProviders`.

- [ ] **Step 1: Write failing consent and provider tests**

~~~ts
// tests/unit/analytics-consent.test.ts
import { describe, expect, it, vi } from "vitest";
import { safeProperties } from "@/lib/analytics/contracts";
import {
  CONSENT_VERSION,
  readConsent,
  removeGaCookies,
} from "@/lib/analytics/consent";

describe("analytics consent", () => {
  it("treats absent, malformed, expired, and old-version values as denied", () => {
    expect(readConsent(null, Date.UTC(2026, 6, 11))).toBe("unknown");
    expect(readConsent("{", Date.UTC(2026, 6, 11))).toBe("unknown");
    expect(
      readConsent(
        JSON.stringify({
          state: "analytics-granted",
          version: CONSENT_VERSION - 1,
          decidedAt: "2026-07-10T00:00:00.000Z",
        }),
        Date.UTC(2026, 6, 11),
      ),
    ).toBe("unknown");
    expect(
      readConsent(
        JSON.stringify({
          state: "analytics-granted",
          version: CONSENT_VERSION,
          decidedAt: "2025-01-01T00:00:00.000Z",
        }),
        Date.UTC(2026, 6, 11),
      ),
    ).toBe("unknown");
  });

  it("removes every first-party _ga cookie", () => {
    const writes: string[] = [];
    const documentLike = {
      cookie: "_ga=one; _ga_MNK2G065ES=two; session=keep",
    };
    Object.defineProperty(documentLike, "cookie", {
      get: () => "_ga=one; _ga_MNK2G065ES=two; session=keep",
      set: vi.fn((value: string) => writes.push(value)),
      configurable: true,
    });
    removeGaCookies(documentLike as Document, "www.thelioncompany.org");
    expect(writes).toHaveLength(6);
    expect(writes.every((value) => value.includes("Max-Age=0"))).toBe(true);
    expect(writes.some((value) => value.includes("Domain=.www.thelioncompany.org"))).toBe(true);
    expect(writes.some((value) => value.includes("Domain=.thelioncompany.org"))).toBe(true);
  });

  it("rejects hostile or free-form values even when the property name is allowed", () => {
    expect(safeProperties("give_click", { target: "person@example.org", placement: "test" })).toBeNull();
    expect(safeProperties("newsletter_error", { placement: "inline", code: "raw provider error" })).toBeNull();
    expect(safeProperties("web_vital", { metric_name: "INP", metric_value_ms: 187, metric_rating: "good", page_group: "home" })).toEqual({ metric_name: "INP", metric_value_ms: 187, metric_rating: "good", page_group: "home" });
  });
});
~~~

~~~tsx
// tests/components/analytics-provider.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AnalyticsProvider,
  useAnalytics,
} from "@/components/client/analytics-provider";

function Probe() {
  const analytics = useAnalytics();
  return (
    <>
      <output>{analytics.consent}</output>
      <button onClick={() => analytics.setConsent("analytics-granted")}>Grant</button>
      <button onClick={() => analytics.setConsent("denied")}>Deny</button>
      <button onClick={() => analytics.track("give_click", { target: "subsplash", placement: "test" })}>
        Track
      </button>
    </>
  );
}

describe("AnalyticsProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.querySelectorAll("script[data-ga4]").forEach((script) => script.remove());
    delete window.gtag;
    delete window.dataLayer;
  });

  it("does not load or dispatch before consent, then loads only after grant", async () => {
    render(
      <AnalyticsProvider enabled>
        <Probe />
      </AnalyticsProvider>,
    );
    expect(screen.getByText("unknown")).toBeVisible();
    expect(document.querySelector("script[data-ga4]")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Track" }));
    expect(window.dataLayer).toBeUndefined();

    await userEvent.click(screen.getByRole("button", { name: "Grant" }));
    expect(document.querySelector("script[data-ga4]")).not.toBeNull();
    expect(window.dataLayer).toContainEqual(["consent", "update", { analytics_storage: "granted" }]);
    await userEvent.click(screen.getByRole("button", { name: "Track" }));
    expect(window.dataLayer?.at(-1)?.[1]).toBe("give_click");

    await userEvent.click(screen.getByRole("button", { name: "Deny" }));
    expect(window.dataLayer).toContainEqual(["consent", "update", { analytics_storage: "denied" }]);
    localStorage.setItem("tlc:analytics-consent:v1", JSON.stringify({ state: "analytics-granted", version: 1, decidedAt: new Date().toISOString() }));
    window.dispatchEvent(new StorageEvent("storage", { key: "tlc:analytics-consent:v1", newValue: localStorage.getItem("tlc:analytics-consent:v1") }));
    expect(await screen.findByText("analytics-granted")).toBeVisible();
    expect(window.dataLayer?.at(-1)).toEqual(["consent", "update", { analytics_storage: "granted" }]);
  });
});
~~~

~~~tsx
// tests/components/web-vitals-reporter.test.tsx
import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WebVitalsReporter } from "@/components/client/web-vitals-reporter";

const testState = vi.hoisted(() => ({
  track: vi.fn(),
  report: undefined as ((metric: { name: string; value: number; rating: string }) => void) | undefined,
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("next/web-vitals", () => ({ useReportWebVitals: (callback: typeof testState.report) => { testState.report = callback; } }));
vi.mock("@/components/client/analytics-provider", () => ({ useAnalytics: () => ({ track: testState.track }) }));

describe("WebVitalsReporter", () => {
  it("emits only the rounded home INP aggregate shape", () => {
    render(<WebVitalsReporter />);
    act(() => testState.report?.({ name: "LCP", value: 1200, rating: "good" }));
    expect(testState.track).not.toHaveBeenCalled();
    act(() => testState.report?.({ name: "INP", value: 187.4, rating: "good" }));
    expect(testState.track).toHaveBeenCalledWith("web_vital", {
      metric_name: "INP",
      metric_value_ms: 187,
      metric_rating: "good",
      page_group: "home",
    });
  });
});
~~~

- [ ] **Step 2: Run the tests and verify missing analytics modules fail**

Run: `npm test -- --run tests/unit/analytics-consent.test.ts tests/components/analytics-provider.test.tsx tests/components/web-vitals-reporter.test.tsx`

Expected: FAIL with module-resolution errors for `lib/analytics/consent` and `components/client/analytics-provider`.

- [ ] **Step 3: Implement the event and consent contracts**

~~~ts
// lib/analytics/contracts.ts
const internalTargets = ["start-here", "live", "teachings", "podcast", "prayer", "connect", "store", "give", "newsletter"] as const;
const formErrorCodes = ["invalid_origin", "invalid_content_type", "body_too_large", "invalid_json", "invalid_fields", "bot_rejected", "turnstile_failed", "turnstile_expired", "already_processing", "provider_unavailable", "configuration_error", "network_error"] as const;
const contactReasons = ["speaking", "partnership", "media", "testimony", "general"] as const;

export const analyticsPropertyValues = {
  nav_click: { target: internalTargets, placement: ["header", "mobile", "footer"] as const },
  cta_click: { target: internalTargets, placement: ["header", "mobile", "footer", "home-hero", "home-final"] as const },
  social_click: { target: ["tiktok", "youtube", "instagram", "facebook", "threads", "x"] as const, placement: ["footer", "home-network", "connect"] as const },
  tiktok_live_click: { state: ["evergreen", "next", "live", "ended"] as const, placement: ["hero", "live-page"] as const },
  podcast_platform_click: { target: ["applePodcasts", "spotify", "podbean", "podcastRss", "youtube"] as const, placement: ["footer", "home-network", "podcast-index", "podcast-detail", "connect"] as const },
  video_start: { placement: ["home", "teaching-detail"] as const },
  store_prompt_view: { placement: ["home-edge"] as const },
  store_prompt_dismiss: { placement: ["home-edge"] as const },
  store_click: { placement: ["prompt-dialog", "store-page"] as const },
  give_click: { target: ["subsplash"] as const, placement: ["give-page-primary", "test"] as const },
  newsletter_form_start: { placement: ["inline", "prompt", "connect"] as const },
  newsletter_submit: { placement: ["inline", "prompt", "connect"] as const },
  newsletter_request_accepted: { placement: ["inline", "prompt", "connect"] as const },
  newsletter_error: { placement: ["inline", "prompt", "connect"] as const, code: formErrorCodes },
  contact_form_start: { reason: contactReasons },
  contact_submit: { reason: contactReasons },
  contact_success: { reason: contactReasons },
  contact_error: { reason: contactReasons, code: formErrorCodes },
  client_error: { component: ["window", "media", "prompt", "navigation"] as const, code: ["runtime_error", "unhandled_rejection", "resource_load"] as const },
} as const;

export type AnalyticsEventName = keyof typeof analyticsPropertyValues | "web_vital";
type ValueOf<T> = T extends readonly (infer Value)[] ? Value : never;
export type AnalyticsProperties<Event extends AnalyticsEventName> = Event extends "web_vital"
  ? Readonly<{ metric_name: "INP"; metric_value_ms: number; metric_rating: "good" | "needs-improvement" | "poor"; page_group: "home" }>
  : Event extends keyof typeof analyticsPropertyValues
    ? Readonly<{ [Key in keyof (typeof analyticsPropertyValues)[Event]]: ValueOf<(typeof analyticsPropertyValues)[Event][Key]> }>
    : never;

export type SocialAnalyticsTarget = AnalyticsProperties<"social_click">["target"];
export type PodcastAnalyticsTarget = AnalyticsProperties<"podcast_platform_click">["target"];
export function isSocialAnalyticsTarget(value: string): value is SocialAnalyticsTarget {
  return (analyticsPropertyValues.social_click.target as readonly string[]).includes(value);
}
export function isPodcastAnalyticsTarget(value: string): value is PodcastAnalyticsTarget {
  return (analyticsPropertyValues.podcast_platform_click.target as readonly string[]).includes(value);
}

export function safeProperties<Event extends AnalyticsEventName>(
  event: Event,
  properties: unknown,
): AnalyticsProperties<Event> | null {
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) return null;
  const record = properties as Record<string, unknown>;
  if (event === "web_vital") {
    const keys = Object.keys(record).sort().join(",");
    if (
      keys !== "metric_name,metric_rating,metric_value_ms,page_group" ||
      record.metric_name !== "INP" ||
      !Number.isInteger(record.metric_value_ms) ||
      (record.metric_value_ms as number) < 0 ||
      (record.metric_value_ms as number) > 60_000 ||
      !["good", "needs-improvement", "poor"].includes(String(record.metric_rating)) ||
      record.page_group !== "home"
    ) return null;
    return record as unknown as AnalyticsProperties<Event>;
  }
  const schema = analyticsPropertyValues[event] as unknown as Record<string, readonly unknown[]>;
  const expectedKeys = Object.keys(schema);
  if (Object.keys(record).length !== expectedKeys.length) return null;
  for (const key of expectedKeys) {
    if (!schema[key].includes(record[key])) return null;
  }
  return record as unknown as AnalyticsProperties<Event>;
}

// lib/analytics/consent.ts
export const CONSENT_VERSION = 1;
export const CONSENT_KEY = "tlc:analytics-consent:v1";
export const CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

export type ConsentState = "unknown" | "denied" | "analytics-granted";

interface StoredConsent {
  readonly state: Exclude<ConsentState, "unknown">;
  readonly version: number;
  readonly decidedAt: string;
}

export function readConsent(raw: string | null, now = Date.now()): ConsentState {
  if (!raw) return "unknown";
  try {
    const parsed = JSON.parse(raw) as Partial<StoredConsent>;
    const decidedAt = Date.parse(parsed.decidedAt ?? "");
    if (
      parsed.version !== CONSENT_VERSION ||
      (parsed.state !== "denied" && parsed.state !== "analytics-granted") ||
      !Number.isFinite(decidedAt) ||
      now - decidedAt > CONSENT_MAX_AGE_MS
    ) {
      return "unknown";
    }
    return parsed.state;
  } catch {
    return "unknown";
  }
}

export function writeConsent(state: Exclude<ConsentState, "unknown">, now = Date.now()) {
  return JSON.stringify({
    state,
    version: CONSENT_VERSION,
    decidedAt: new Date(now).toISOString(),
  } satisfies StoredConsent);
}

export function removeGaCookies(documentLike: Document, hostname = location.hostname) {
  const domains = [undefined, `.${hostname}`];
  if (hostname === "www.thelioncompany.org") domains.push(".thelioncompany.org");
  documentLike.cookie
    .split(";")
    .map((part) => part.trim().split("=")[0])
    .filter((name) => name === "_ga" || name.startsWith("_ga_"))
    .forEach((name) => domains.forEach((domain) => {
      documentLike.cookie = name + "=; Path=/; " + (domain ? `Domain=${domain}; ` : "") + "Max-Age=0; SameSite=Lax; Secure";
    }));
}
~~~

- [ ] **Step 4: Implement the provider, controls, tracked link, and root integration**

~~~tsx
// components/client/analytics-provider.tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AnalyticsEventName,
  AnalyticsProperties,
} from "@/lib/analytics/contracts";
import { safeProperties } from "@/lib/analytics/contracts";
import {
  CONSENT_KEY,
  readConsent,
  removeGaCookies,
  writeConsent,
  type ConsentState,
} from "@/lib/analytics/consent";

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

interface AnalyticsContextValue {
  readonly consent: ConsentState;
  readonly settingsOpen: boolean;
  readonly setConsent: (state: Exclude<ConsentState, "unknown">) => void;
  readonly openSettings: () => void;
  readonly closeSettings: () => void;
  readonly track: <Event extends AnalyticsEventName>(event: Event, properties: AnalyticsProperties<Event>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);
const MEASUREMENT_ID = "G-MNK2G065ES";

function ensureGtag() {
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = window.gtag ?? ((...args: unknown[]) => {
    window.dataLayer?.push(args);
  });
}

function loadGa4() {
  ensureGtag();
  window.gtag!("consent", "update", { analytics_storage: "granted" });
  if (document.querySelector("script[data-ga4]")) return;
  window.gtag!("js", new Date());
  window.gtag!("config", MEASUREMENT_ID, {
    anonymize_ip: true,
    allow_google_signals: false,
    send_page_view: true,
  });
  const script = document.createElement("script");
  script.async = true;
  script.dataset.ga4 = "true";
  script.src =
    "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(MEASUREMENT_ID);
  document.head.append(script);
}

export function AnalyticsProvider({
  children,
  enabled,
}: {
  readonly children: ReactNode;
  readonly enabled: boolean;
}) {
  const [consent, setConsentState] = useState<ConsentState>("unknown");
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    try {
      setConsentState(readConsent(localStorage.getItem(CONSENT_KEY)));
    } catch {
      setConsentState("unknown");
    }
  }, []);

  useEffect(() => {
    const synchronize = (event: StorageEvent) => {
      if (event.key !== CONSENT_KEY) return;
      const next = readConsent(event.newValue);
      setConsentState(next);
      if (next !== "analytics-granted") {
        window.gtag?.("consent", "update", { analytics_storage: "denied" });
        removeGaCookies(document);
      }
    };
    window.addEventListener("storage", synchronize);
    return () => window.removeEventListener("storage", synchronize);
  }, []);

  useEffect(() => {
    if (enabled && consent === "analytics-granted") loadGa4();
  }, [consent, enabled]);

  const setConsent = useCallback((state: "denied" | "analytics-granted") => {
    try {
      localStorage.setItem(CONSENT_KEY, writeConsent(state));
    } catch {
      state = "denied";
    }
    setConsentState(state);
    if (state === "denied") {
      window.gtag?.("consent", "update", { analytics_storage: "denied" });
      removeGaCookies(document);
    }
    setSettingsOpen(false);
  }, []);

  const track = useCallback(
    function track<Event extends AnalyticsEventName>(event: Event, properties: AnalyticsProperties<Event>) {
      if (!enabled || consent !== "analytics-granted" || !window.gtag) return;
      const safe = safeProperties(event, properties);
      if (!safe) return;
      window.gtag("event", event, {
        ...safe,
        transport_type: "beacon",
      });
    },
    [consent, enabled],
  );

  useEffect(() => {
    const onError = () => track("client_error", { component: "window", code: "runtime_error" });
    const onUnhandledRejection = () => track("client_error", { component: "window", code: "unhandled_rejection" });
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, [track]);

  const value = useMemo<AnalyticsContextValue>(
    () => ({
      consent,
      settingsOpen,
      setConsent,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
      track,
    }),
    [consent, setConsent, settingsOpen, track],
  );

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics() {
  const value = useContext(AnalyticsContext);
  if (!value) throw new Error("useAnalytics must be used inside AnalyticsProvider");
  return value;
}
~~~

~~~tsx
// components/client/consent-controls.tsx
"use client";

import { useAnalytics } from "./analytics-provider";
import styles from "./consent-controls.module.css";

export function ConsentControls() {
  const analytics = useAnalytics();
  const visible = analytics.consent === "unknown" || analytics.settingsOpen;
  if (!visible) return null;

  return (
    <section className={styles.card} data-consent-active="true" aria-labelledby="analytics-consent-title">
      <div>
        <p className={styles.kicker}>Your choice</p>
        <h2 id="analytics-consent-title">Help us understand what serves visitors</h2>
        <p>
          Optional analytics never receives form content. The site works fully when
          analytics is declined.
        </p>
      </div>
      <div className={styles.actions}>
        <button type="button" onClick={() => analytics.setConsent("denied")}>
          Decline analytics
        </button>
        <button
          className={styles.accept}
          type="button"
          onClick={() => analytics.setConsent("analytics-granted")}
        >
          Allow analytics
        </button>
        {analytics.settingsOpen && analytics.consent !== "unknown" ? (
          <button type="button" onClick={analytics.closeSettings}>
            Keep current choice
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function ConsentSettingsButton() {
  const analytics = useAnalytics();
  return (
    <button type="button" onClick={analytics.openSettings}>
      Analytics settings
    </button>
  );
}

// components/client/tracked-link.tsx
"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import type {
  AnalyticsEventName,
  AnalyticsProperties,
} from "@/lib/analytics/contracts";
import { useAnalytics } from "./analytics-provider";

export type TrackedLinkProps<Event extends AnalyticsEventName> =
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "href"> & {
  readonly children: ReactNode;
  readonly href: string;
  readonly eventName: Event;
  readonly eventProperties: AnalyticsProperties<Event>;
};

export function TrackedLink<Event extends AnalyticsEventName>({
  children,
  href,
  eventName,
  eventProperties,
  onClick,
  ...anchorProps
}: TrackedLinkProps<Event>) {
  const analytics = useAnalytics();
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (!event.defaultPrevented) analytics.track(eventName, eventProperties);
  }
  return href.startsWith("/") ? (
    <Link href={href} {...anchorProps} onClick={handleClick}>{children}</Link>
  ) : (
    <a href={href} {...anchorProps} onClick={handleClick}>{children}</a>
  );
}

// components/ui/action-link.tsx (replace Task 1 implementation)
import Link from "next/link";
import type { ReactNode } from "react";
import { TrackedLink } from "@/components/client/tracked-link";
import type { AnalyticsProperties } from "@/lib/analytics/contracts";
import styles from "./action-link.module.css";

export interface ActionLinkProps {
  readonly href: string;
  readonly children: ReactNode;
  readonly tone?: "ink" | "clay" | "quiet";
  readonly external?: boolean;
  readonly className?: string;
  readonly tracking?: AnalyticsProperties<"cta_click">;
}

export function ActionLink({ href, children, tone = "ink", external = false, className, tracking }: ActionLinkProps) {
  const classes = [styles.action, styles[tone], className].filter(Boolean).join(" ");
  const content = <><span>{children}</span><span aria-hidden="true">↗</span></>;
  if (tracking) {
    return <TrackedLink className={classes} href={href} eventName="cta_click" eventProperties={tracking} {...(external ? { rel: "noreferrer", target: "_blank" } : {})}>{content}</TrackedLink>;
  }
  if (external) return <a className={classes} href={href} rel="noreferrer" target="_blank">{content}</a>;
  return <Link className={classes} href={href}>{content}</Link>;
}

// components/client/web-vitals-reporter.tsx
"use client";

import { useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { useAnalytics } from "./analytics-provider";

type Reporter = Parameters<typeof useReportWebVitals>[0];

export function WebVitalsReporter() {
  const pathname = usePathname();
  const { track } = useAnalytics();
  const current = useRef({ pathname, track });
  current.current = { pathname, track };

  const report = useCallback<Reporter>((metric) => {
    const state = current.current;
    if (state.pathname !== "/" || metric.name !== "INP") return;
    state.track("web_vital", {
      metric_name: "INP",
      metric_value_ms: Math.round(metric.value),
      metric_rating: metric.rating,
      page_group: "home",
    });
  }, []);

  useReportWebVitals(report);
  return null;
}

// components/client/experience-providers.tsx
"use client";

import type { ReactNode } from "react";
import { AnalyticsProvider } from "./analytics-provider";
import { ConsentControls } from "./consent-controls";
import { WebVitalsReporter } from "./web-vitals-reporter";

export function ExperienceProviders({
  children,
  analyticsEnabled,
}: {
  readonly children: ReactNode;
  readonly analyticsEnabled: boolean;
}) {
  return (
    <AnalyticsProvider enabled={analyticsEnabled}>
      <WebVitalsReporter />
      {children}
      <ConsentControls />
    </AnalyticsProvider>
  );
}
~~~

~~~css
/* components/client/consent-controls.module.css */
.card {
  position: fixed;
  z-index: 80;
  inset: auto 1rem 1rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-4);
  width: min(calc(100% - 2rem), 48rem);
  max-height: calc(100dvh - 2rem);
  margin-inline: auto;
  padding: var(--space-4);
  overflow: auto;
  border: 1px solid var(--line);
  border-radius: var(--radius-large);
  background: var(--paper-raised);
  box-shadow: var(--shadow);
}

.card h2 {
  margin-block-end: var(--space-1);
  font-family: var(--font-display);
  font-size: var(--step-1);
  font-weight: 400;
}

.card p {
  margin: 0;
}

.kicker {
  color: var(--clay-dark);
  font-size: var(--step--1);
  font-weight: 800;
  text-transform: uppercase;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-content: center;
  gap: var(--space-2);
}

.actions button {
  min-height: 2.75rem;
  padding: 0.65rem 0.9rem;
  border: 1px solid var(--ink);
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
}

.actions .accept {
  background: var(--ink);
  color: var(--paper-raised);
}

@media (max-width: 40rem) {
  .card {
    grid-template-columns: 1fr;
    padding-bottom: max(var(--space-4), env(safe-area-inset-bottom));
  }
}
~~~

~~~tsx
// app/layout.tsx
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Instrument_Serif, Manrope } from "next/font/google";
import { ExperienceProviders } from "@/components/client/experience-providers";
import { SiteFooter } from "@/components/server/site-footer";
import { SiteHeader } from "@/components/server/site-header";
import { siteContent } from "@/content/site";
import "./globals.css";

const display = Instrument_Serif({ weight: "400", subsets: ["latin"], variable: "--font-instrument-serif", display: "swap" });
const body = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const production = process.env.VERCEL_ENV === "production";

export const metadata: Metadata = {
  metadataBase: new URL(siteContent.canonicalOrigin),
  applicationName: siteContent.name,
  title: {
    default: siteContent.homeTitle,
    template: `%s | ${siteContent.name}`,
  },
  description: siteContent.homeDescription,
  robots: production ? { index: true, follow: true } : { index: false, follow: false },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#24151f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  const analyticsEnabled = process.env.VERCEL_ENV === "production";
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <ExperienceProviders analyticsEnabled={analyticsEnabled}>
          <SiteHeader />
          <main id="main-content">{children}</main>
          <SiteFooter />
        </ExperienceProviders>
      </body>
    </html>
  );
}
~~~

- [ ] **Step 5: Run analytics tests and the privacy assertion**

Run: `npm test -- --run tests/unit/analytics-consent.test.ts tests/components/analytics-provider.test.tsx tests/components/web-vitals-reporter.test.tsx && npm run typecheck`

Expected: both files pass; TypeScript exits 0; no GA script exists in the denied/unknown test.

- [ ] **Step 6: Commit analytics consent**

~~~bash
git add app/layout.tsx components/client/analytics-provider.tsx components/client/consent-controls.tsx components/client/consent-controls.module.css components/client/experience-providers.tsx components/client/tracked-link.tsx components/client/web-vitals-reporter.tsx lib/analytics tests/unit/analytics-consent.test.ts tests/components/analytics-provider.test.tsx tests/components/web-vitals-reporter.test.tsx
git commit -m "feat: gate analytics behind explicit consent"
~~~

### Task 3: Finish the site shell, mobile navigation, and editorial masthead

**Files:**
- Modify: `components/server/site-header.tsx`
- Modify: `components/server/site-footer.tsx`
- Modify: `components/server/page-intro.tsx`
- Create: `components/server/site-shell.module.css`
- Create: `components/client/mobile-navigation.tsx`
- Create: `components/client/mobile-navigation.module.css`
- Test: `tests/components/mobile-navigation.test.tsx`

**Interfaces:**
- Consumes: `getDestination(key: DestinationKey): Destination`; `ConsentSettingsButton`; `TrackedLink`.
- Produces: `MobileNavigation({ items: readonly NavigationItem[] })`, visually complete `SiteHeader`, `SiteFooter`, and `PageIntro`.

- [ ] **Step 1: Write the failing mobile-navigation test**

~~~tsx
// tests/components/mobile-navigation.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AnalyticsProvider } from "@/components/client/analytics-provider";
import { MobileNavigation } from "@/components/client/mobile-navigation";

const items = [
  { href: "/start-here", label: "Start here", analyticsTarget: "start-here" },
  { href: "/teachings", label: "Teachings", analyticsTarget: "teachings" },
] as const;

describe("MobileNavigation", () => {
  it("opens accessibly, closes with Escape, and restores trigger focus", async () => {
    const user = userEvent.setup();
    render(<AnalyticsProvider enabled={false}><MobileNavigation items={items} /></AnalyticsProvider>);
    const trigger = screen.getByRole("button", { name: /open menu/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: /mobile/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /give to the lion company/i })).toHaveAttribute("href", "/give");
    expect(document.body).toHaveAttribute("data-scroll-lock", "true");
    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
    expect(document.body).not.toHaveAttribute("data-scroll-lock");
  });
});
~~~

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- --run tests/components/mobile-navigation.test.tsx`

Expected: FAIL because `components/client/mobile-navigation.tsx` does not exist.

- [ ] **Step 3: Implement the mobile disclosure**

~~~tsx
// components/client/mobile-navigation.tsx
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { TrackedLink } from "@/components/client/tracked-link";
import type { AnalyticsProperties } from "@/lib/analytics/contracts";
import styles from "./mobile-navigation.module.css";

export interface NavigationItem {
  readonly href: string;
  readonly label: string;
  readonly analyticsTarget: AnalyticsProperties<"nav_click">["target"];
}

export function MobileNavigation({ items }: { readonly items: readonly NavigationItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    document.body.dataset.scrollLock = "true";
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        requestAnimationFrame(() => triggerRef.current?.focus());
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      delete document.body.dataset.scrollLock;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.mobile}>
      <button
        ref={triggerRef}
        className={styles.trigger}
        type="button"
        aria-controls={panelId}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">{open ? "Close" : "Menu"}</span>
      </button>
      <div ref={panelRef} className={styles.panel} id={panelId} hidden={!open}>
        <nav aria-label="Mobile">
          <ul>
            {items.map((item) => (
              <li key={item.href}>
                <TrackedLink href={item.href} eventName="nav_click" eventProperties={{ target: item.analyticsTarget, placement: "mobile" }}>
                  {item.label}
                </TrackedLink>
              </li>
            ))}
          </ul>
        </nav>
        <TrackedLink className={styles.live} href="/live" eventName="cta_click" eventProperties={{ target: "live", placement: "mobile" }}>
          Join today’s live
        </TrackedLink>
        <TrackedLink className={styles.give} href="/give" eventName="cta_click" eventProperties={{ target: "give", placement: "mobile" }}>
          Give to The Lion Company
        </TrackedLink>
      </div>
    </div>
  );
}
~~~

~~~css
/* components/client/mobile-navigation.module.css */
.mobile {
  display: none;
}

.trigger {
  min-width: 2.75rem;
  min-height: 2.75rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--paper-raised);
  cursor: pointer;
}

.panel {
  position: fixed;
  z-index: 70;
  inset: 4.5rem 0 auto;
  min-height: calc(100dvh - 4.5rem);
  padding: var(--space-6) max(1rem, env(safe-area-inset-right))
    max(var(--space-6), env(safe-area-inset-bottom))
    max(1rem, env(safe-area-inset-left));
  background: var(--ink);
  color: var(--paper-raised);
}

.panel ul {
  display: grid;
  gap: var(--space-2);
  padding: 0;
  margin: 0 0 var(--space-6);
  list-style: none;
}

.panel a {
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  font-family: var(--font-display);
  font-size: var(--step-2);
  text-decoration: none;
}

.panel .live {
  width: fit-content;
  border-bottom: 2px solid var(--clay);
  font-family: var(--font-body);
  font-size: var(--step-0);
  font-weight: 800;
}

.panel .give {
  width: fit-content;
  margin-block-start: var(--space-3);
  padding: 0.7rem 1rem;
  border-radius: 999px;
  background: var(--paper-raised);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: var(--step-0);
  font-weight: 800;
}

@media (max-width: 54rem) {
  .mobile {
    display: block;
  }
}
~~~

- [ ] **Step 4: Replace the semantic shell with the complete editorial shell**

~~~tsx
// components/server/site-header.tsx
import Link from "next/link";
import { MobileNavigation, type NavigationItem } from "@/components/client/mobile-navigation";
import { TrackedLink } from "@/components/client/tracked-link";
import styles from "./site-shell.module.css";

export const primaryNavigation: readonly NavigationItem[] = [
  { href: "/start-here", label: "Start here", analyticsTarget: "start-here" },
  { href: "/live", label: "Live", analyticsTarget: "live" },
  { href: "/teachings", label: "Teachings", analyticsTarget: "teachings" },
  { href: "/podcast", label: "Podcast", analyticsTarget: "podcast" },
  { href: "/prayer", label: "Prayer", analyticsTarget: "prayer" },
  { href: "/connect", label: "Connect", analyticsTarget: "connect" },
  { href: "/store", label: "Store", analyticsTarget: "store" },
];

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link className={styles.brand} href="/" aria-label="The Lion Company home">
          <span aria-hidden="true" className={styles.brandMark}>LC</span>
          <span>The Lion Company</span>
        </Link>
        <nav className={styles.desktopNav} aria-label="Primary">
          <ul>
            {primaryNavigation.map((item) => (
              <li key={item.href}><TrackedLink href={item.href} eventName="nav_click" eventProperties={{ target: item.analyticsTarget, placement: "header" }}>{item.label}</TrackedLink></li>
            ))}
          </ul>
        </nav>
        <TrackedLink className={styles.headerAction} href="/give" eventName="cta_click" eventProperties={{ target: "give", placement: "header" }}>Give</TrackedLink>
        <MobileNavigation items={primaryNavigation} />
      </div>
    </header>
  );
}

// components/server/site-footer.tsx
import Link from "next/link";
import { ConsentSettingsButton } from "@/components/client/consent-controls";
import { TrackedLink } from "@/components/client/tracked-link";
import { destinationRegistry } from "@/content/destinations";
import { isPodcastAnalyticsTarget, isSocialAnalyticsTarget } from "@/lib/analytics/contracts";
import type { DestinationKey } from "@/lib/content/types";
import styles from "./site-shell.module.css";

const channelKeys: readonly DestinationKey[] = [
  "tiktok", "youtube", "applePodcasts", "spotify", "podbean", "instagram", "facebook", "threads", "x",
];

export function SiteFooter() {
  const allowed = new Set<DestinationKey>(channelKeys);
  const channels = destinationRegistry.filter((item) => item.visible && allowed.has(item.key));
  return (
    <footer className={styles.footer}>
      <div className={styles.footerLead}>
        <p className={styles.footerEyebrow}>Seen. Gathered. Formed. Sent.</p>
        <h2>There is a place for you in the work.</h2>
        <p>This ministry is sustained by voluntary givers who choose to carry teaching, prayer, discipleship, and Christian unity forward.</p>
        <div className={styles.footerActions}>
          <TrackedLink href="/teachings" eventName="cta_click" eventProperties={{ target: "teachings", placement: "footer" }}>Begin with a teaching</TrackedLink>
          <TrackedLink href="/prayer" eventName="cta_click" eventProperties={{ target: "prayer", placement: "footer" }}>Ask for prayer</TrackedLink>
          <TrackedLink href="/connect#newsletter" eventName="cta_click" eventProperties={{ target: "newsletter", placement: "footer" }}>Join the monthly letter</TrackedLink>
          <TrackedLink href="/give" eventName="cta_click" eventProperties={{ target: "give", placement: "footer" }}>Give to The Lion Company</TrackedLink>
          <TrackedLink href="/store" eventName="cta_click" eventProperties={{ target: "store", placement: "footer" }}>Visit the store</TrackedLink>
          <TrackedLink href="/connect" eventName="cta_click" eventProperties={{ target: "connect", placement: "footer" }}>Contact the ministry</TrackedLink>
        </div>
      </div>
      <div className={styles.footerGrid}>
        <div>
          <strong>The Lion Company</strong>
          <p>A Jesus-centered ministry pursuing Christian unity. Texas-based, serving globally.</p>
        </div>
        <nav aria-label="Social and listening channels">
          <ul>
            {channels.map((channel) => {
              if (isPodcastAnalyticsTarget(channel.key)) return <li key={channel.key}><TrackedLink href={channel.href} eventName="podcast_platform_click" eventProperties={{ target: channel.key, placement: "footer" }}>{channel.label}</TrackedLink></li>;
              if (isSocialAnalyticsTarget(channel.key)) return <li key={channel.key}><TrackedLink href={channel.href} eventName="social_click" eventProperties={{ target: channel.key, placement: "footer" }}>{channel.label}</TrackedLink></li>;
              return null;
            })}
          </ul>
        </nav>
        <nav aria-label="Policies">
          <ul>
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/terms">Terms</Link></li>
            <li><Link href="/accessibility">Accessibility</Link></li>
            <li><ConsentSettingsButton /></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}

// components/server/page-intro.tsx
import type { ReactNode } from "react";
import styles from "./site-shell.module.css";

export function PageIntro({
  eyebrow,
  title,
  description,
  children,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly description?: string;
  readonly children?: ReactNode;
}) {
  return (
    <header className={styles.pageIntro}>
      <p>{eyebrow}</p>
      <h1>{title}</h1>
      <div className={styles.introLine} aria-hidden="true" />
      <div className={styles.pageIntroBody}>
        {description ? <p>{description}</p> : null}
        {children}
      </div>
    </header>
  );
}
~~~

~~~css
/* components/server/site-shell.module.css */
.header {
  position: sticky;
  z-index: 60;
  top: 0;
  border-bottom: 1px solid var(--line);
  background: color-mix(in srgb, var(--paper) 90%, transparent);
  backdrop-filter: blur(14px);
}

.headerInner {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--space-4);
  width: min(calc(100% - 2rem), var(--measure-wide));
  min-height: 4.5rem;
  align-items: center;
  margin-inline: auto;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-family: var(--font-display);
  font-size: var(--step-1);
  text-decoration: none;
}

.brandMark {
  display: grid;
  width: 2rem;
  aspect-ratio: 1;
  place-items: center;
  border: 1px solid var(--clay);
  border-radius: 50%;
  font-family: var(--font-body);
  font-size: 0.62rem;
  font-weight: 800;
}

.desktopNav ul,
.footer ul {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  padding: 0;
  margin: 0;
  list-style: none;
}

.desktopNav ul {
  justify-content: center;
}

.desktopNav a,
.headerAction {
  font-size: var(--step--1);
  font-weight: 750;
  text-decoration: none;
}

.headerAction {
  padding: 0.65rem 0.9rem;
  border-radius: 999px;
  background: var(--ink);
  color: var(--paper-raised);
}

.footer {
  padding: var(--space-8) max(1rem, calc((100% - var(--measure-wide)) / 2));
  background: var(--ink);
  color: var(--paper-raised);
}

.footerLead {
  max-width: 58rem;
  margin-block-end: var(--space-7);
}

.footerLead h2 {
  max-width: 14ch;
  font-family: var(--font-display);
  font-size: var(--step-3);
  font-weight: 400;
  line-height: 1;
}

.footerEyebrow {
  color: var(--paper-deep);
  font-size: var(--step--1);
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.footerActions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.footerActions a {
  border-bottom: 1px solid var(--clay);
  text-decoration: none;
}

.footerGrid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: var(--space-6);
  padding-block-start: var(--space-5);
  border-top: 1px solid rgb(255 255 255 / 0.2);
}

.footerGrid nav ul {
  display: grid;
  gap: var(--space-2);
}

.footerGrid a,
.footerGrid button {
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 0.25em;
}

.pageIntro {
  width: min(calc(100% - 2rem), var(--measure));
  padding-block: var(--space-8) var(--space-7);
  margin-inline: auto;
}

.pageIntro > p:first-child {
  color: var(--clay-dark);
  font-size: var(--step--1);
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.pageIntro h1 {
  max-width: 14ch;
  margin-block-end: var(--space-4);
  font-family: var(--font-display);
  font-size: var(--step-4);
  font-weight: 400;
  line-height: 0.9;
}

.pageIntroBody {
  max-width: 44rem;
  color: var(--ink-soft);
  font-size: var(--step-1);
}

.introLine {
  width: min(20rem, 60vw);
  height: 2px;
  margin-block-end: var(--space-4);
  background: var(--clay);
}

@media (max-width: 54rem) {
  .desktopNav,
  .headerAction {
    display: none;
  }

  .headerInner {
    grid-template-columns: 1fr auto;
  }

  .footerGrid {
    grid-template-columns: 1fr;
  }
}
~~~

- [ ] **Step 5: Run shell tests and commit**

Run: `npm test -- --run tests/components/mobile-navigation.test.tsx && npm run typecheck && npm run lint`

Expected: the mobile-navigation test passes and both static checks exit 0.

~~~bash
git add components/client/mobile-navigation.tsx components/client/mobile-navigation.module.css components/server/site-header.tsx components/server/site-footer.tsx components/server/page-intro.tsx components/server/site-shell.module.css tests/components/mobile-navigation.test.tsx
git commit -m "feat: build accessible editorial site shell"
~~~

### Task 4: Implement the schedule-derived live status island

**Files:**
- Create: `lib/live/status.ts`
- Create: `components/client/live-status.tsx`
- Create: `components/client/live-status.module.css`
- Modify: `app/live/page.tsx`
- Test: `tests/unit/live-status.test.ts`
- Test: `tests/components/live-status.test.tsx`

**Interfaces:**
- Consumes: `LiveSchedule | null` and `RecentReplay | null` from the foundation.
- Produces: `deriveLiveStatus(schedule, now)`, `nextLiveBoundary(schedule, now)`, `activeReplayAt(replay, now)`, and `LiveStatus({ schedule, replay, placement })`. Server routes pass only a replay active at build time so no-JavaScript HTML includes the direct link; the client hides it at the exact expiry boundary, and the foundation content rule requires a scheduled rebuild/removal at that same expiry.

- [ ] **Step 1: Write all boundary tests before the island**

~~~ts
// tests/unit/live-status.test.ts
import { describe, expect, it } from "vitest";
import { activeReplayAt, deriveLiveStatus, nextLiveBoundary } from "@/lib/live/status";

const schedule = {
  startsAt: "2026-07-11T18:00:00.000Z",
  endsAt: "2026-07-11T19:00:00.000Z",
  sourceTimeZone: "America/Chicago",
  verifiedAt: "2026-07-11",
  topic: "Unity through Christ",
  url: "https://www.tiktok.com/@thelioncompanytx",
} as const;

describe("live status boundaries", () => {
  it.each([
    ["2026-07-11T17:59:59.999Z", "next"],
    ["2026-07-11T18:00:00.000Z", "live"],
    ["2026-07-11T18:59:59.999Z", "live"],
    ["2026-07-11T19:00:00.000Z", "ended"],
    ["2026-07-11T19:15:00.000Z", "ended"],
    ["2026-07-11T19:15:00.001Z", "evergreen"],
  ])("maps %s to %s", (instant, expected) => {
    expect(deriveLiveStatus(schedule, Date.parse(instant)).kind).toBe(expected);
  });

  it("returns honest evergreen state for missing or invalid data", () => {
    expect(deriveLiveStatus(null, Date.now()).kind).toBe("evergreen");
    expect(
      deriveLiveStatus({ ...schedule, endsAt: schedule.startsAt }, Date.now()).kind,
    ).toBe("evergreen");
  });

  it("chooses the next transition boundary", () => {
    expect(nextLiveBoundary(schedule, Date.parse("2026-07-11T17:00:00Z"))).toBe(
      Date.parse(schedule.startsAt),
    );
    expect(nextLiveBoundary(schedule, Date.parse("2026-07-11T18:30:00Z"))).toBe(
      Date.parse(schedule.endsAt),
    );
  });

  it("preserves the named source timezone alongside the UTC transport instant", () => {
    expect(deriveLiveStatus(schedule, Date.parse("2026-07-11T17:00:00Z"))).toMatchObject({
      kind: "next",
      sourceTimeZone: "America/Chicago",
    });
  });

  it("includes a replay only inside its explicit publication window", () => {
    const replay = { title: "Replay", url: "https://www.tiktok.com/@thelioncompanytx/video/1", publishedAt: "2026-07-10T00:00:00Z", expiresAt: "2026-07-12T00:00:00Z" };
    expect(activeReplayAt(replay, Date.parse("2026-07-11T00:00:00Z"))).toEqual(replay);
    expect(activeReplayAt(replay, Date.parse(replay.expiresAt))).toBeNull();
  });
});
~~~

~~~tsx
// tests/components/live-status.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LiveStatus } from "@/components/client/live-status";

const schedule = {
  startsAt: "2026-07-11T18:00:00.000Z",
  endsAt: "2026-07-11T19:00:00.000Z",
  sourceTimeZone: "America/Chicago",
  verifiedAt: "2026-07-11",
  topic: "Unity through Christ",
  url: "https://www.tiktok.com/@thelioncompanytx",
} as const;

describe("LiveStatus", () => {
  it("server-renders the evergreen truth before hydration", () => {
    vi.setSystemTime(new Date("2026-07-11T17:00:00Z"));
    render(<LiveStatus schedule={null} replay={null} placement="hero" />);
    expect(screen.getByText("Live daily on TikTok")).toBeVisible();
    expect(screen.queryByText("Live now")).not.toBeInTheDocument();
  });

  it("server-renders an already build-validated replay for no-JavaScript visitors", () => {
    render(<LiveStatus schedule={null} replay={{ title: "Recent teaching", url: "https://www.tiktok.com/@thelioncompanytx/video/1", publishedAt: "2026-07-10T00:00:00Z", expiresAt: "2026-07-12T00:00:00Z" }} placement="hero" />);
    expect(screen.getByRole("link", { name: /watch recent replay: recent teaching/i })).toBeVisible();
  });

  it("keeps an active replay visible while a verified next or live state is shown", async () => {
    vi.setSystemTime(new Date("2026-07-11T17:00:00Z"));
    render(<LiveStatus schedule={schedule} replay={{ title: "Recent teaching", url: "https://www.tiktok.com/@thelioncompanytx/video/1", publishedAt: "2026-07-10T00:00:00Z", expiresAt: "2026-07-12T00:00:00Z" }} placement="hero" />);
    expect(await screen.findByText("Next live")).toBeVisible();
    expect(screen.getByRole("link", { name: /watch recent replay: recent teaching/i })).toBeVisible();
  });
});
~~~

- [ ] **Step 2: Run tests and verify missing modules fail**

Run: `npm test -- --run tests/unit/live-status.test.ts tests/components/live-status.test.tsx`

Expected: FAIL because live status modules do not exist.

- [ ] **Step 3: Implement pure schedule derivation and the client island**

~~~ts
// lib/live/status.ts
import type { LiveSchedule, RecentReplay } from "@/lib/content/types";

export type LiveState =
  | { readonly kind: "evergreen"; readonly label: "Live daily on TikTok" }
  | { readonly kind: "next"; readonly label: "Next live"; readonly startsAt: string; readonly sourceTimeZone: string; readonly topic?: string }
  | { readonly kind: "live"; readonly label: "Live now"; readonly topic?: string }
  | { readonly kind: "ended"; readonly label: "Today’s live has ended" };

const GRACE_MS = 15 * 60 * 1000;
const MAX_EVENT_MS = 8 * 60 * 60 * 1000;

function instants(schedule: LiveSchedule) {
  const start = Date.parse(schedule.startsAt);
  const end = Date.parse(schedule.endsAt);
  const valid =
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    end > start &&
    end - start <= MAX_EVENT_MS;
  return { start, end, valid };
}

export function deriveLiveStatus(
  schedule: LiveSchedule | null,
  now = Date.now(),
): LiveState {
  if (!schedule) return { kind: "evergreen", label: "Live daily on TikTok" };
  const { start, end, valid } = instants(schedule);
  if (!valid || now > end + GRACE_MS) {
    return { kind: "evergreen", label: "Live daily on TikTok" };
  }
  if (now < start) {
    return { kind: "next", label: "Next live", startsAt: schedule.startsAt, sourceTimeZone: schedule.sourceTimeZone, topic: schedule.topic };
  }
  if (now < end) return { kind: "live", label: "Live now", topic: schedule.topic };
  return { kind: "ended", label: "Today’s live has ended" };
}

export function nextLiveBoundary(schedule: LiveSchedule | null, now = Date.now()) {
  if (!schedule) return null;
  const { start, end, valid } = instants(schedule);
  if (!valid) return null;
  if (now < start) return start;
  if (now < end) return end;
  if (now <= end + GRACE_MS) return end + GRACE_MS + 1;
  return null;
}

export function activeReplayAt(replay: RecentReplay | null, now = Date.now()) {
  if (!replay) return null;
  const published = Date.parse(replay.publishedAt);
  const expires = Date.parse(replay.expiresAt);
  return Number.isFinite(published) && Number.isFinite(expires) && published <= now && now < expires
    ? replay
    : null;
}
~~~

~~~tsx
// components/client/live-status.tsx
"use client";

import { useEffect, useState } from "react";
import type { LiveSchedule, RecentReplay } from "@/lib/content/types";
import { activeReplayAt, deriveLiveStatus, nextLiveBoundary } from "@/lib/live/status";
import { TrackedLink } from "./tracked-link";
import styles from "./live-status.module.css";

export function LiveStatus({
  schedule,
  replay,
  placement,
}: {
  readonly schedule: LiveSchedule | null;
  readonly replay: RecentReplay | null;
  readonly placement: "hero" | "live-page";
}) {
  const [now, setNow] = useState<number | null>(null);
  const state = now === null
    ? { kind: "evergreen" as const, label: "Live daily on TikTok" as const }
    : deriveLiveStatus(schedule, now);
  const destination = schedule?.url ?? "https://www.tiktok.com/@thelioncompanytx";
  const activeReplay = now === null ? replay : activeReplayAt(replay, now);

  useEffect(() => {
    let boundaryTimer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      const current = Date.now();
      setNow(current);
      const boundary = nextLiveBoundary(schedule, current);
      if (boundary) {
        boundaryTimer = setTimeout(update, Math.min(boundary - current, 2_147_000_000));
      }
    };
    update();
    const minute = setInterval(update, 60_000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") update();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", update);
    return () => {
      clearInterval(minute);
      if (boundaryTimer) clearTimeout(boundaryTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", update);
    };
  }, [schedule]);

  return (
    <section className={styles.status} aria-label="Daily TikTok teaching">
      <p className={styles.label} data-state={state.kind}>{state.label}</p>
      {state.kind === "next" ? (
        <p>
          <time dateTime={state.startsAt}>
            {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
              new Date(state.startsAt),
            )}
          </time>
          <span> · Source time ({state.sourceTimeZone}): {new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: state.sourceTimeZone, timeZoneName: "short" }).format(new Date(state.startsAt))}</span>
        </p>
      ) : null}
      {"topic" in state && state.topic ? <p>{state.topic}</p> : null}
      <TrackedLink
        href={destination}
        eventName="tiktok_live_click"
        eventProperties={{ state: state.kind, placement }}
      >
        {state.kind === "live" ? "Join live on TikTok" : "See today’s live on TikTok"}
      </TrackedLink>
      {activeReplay ? (
        <a href={activeReplay.url}>Watch recent replay: {activeReplay.title}</a>
      ) : null}
    </section>
  );
}
~~~

~~~tsx
// app/live/page.tsx
import { LiveStatus } from "@/components/client/live-status";
import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { liveSchedule, recentReplay } from "@/content/live";
import { activeReplayAt } from "@/lib/live/status";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";

const description = "Find the current verified TikTok teaching state, recent replay, and an honest daily-live fallback.";

export const metadata = createPageMetadata({ title: "Daily live teaching", description, path: "/live" });

export default function LivePage() {
  const buildActiveReplay = activeReplayAt(recentReplay);
  return (
    <>
      <JsonLd
        id="live-schema"
        data={[
          webPageSchema({ path: "/live", title: "Daily live teaching", description }),
          breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Live", path: "/live" }]),
        ]}
      />
      <PageIntro
        eyebrow="Daily discipleship"
        title="Live daily on TikTok"
        description="The page begins with the evergreen truth and upgrades only from a validated schedule record."
      />
      <section className="section shell" aria-labelledby="live-status-title">
        <h2 id="live-status-title">Today’s verified state</h2>
        <LiveStatus schedule={liveSchedule} replay={buildActiveReplay} placement="live-page" />
      </section>
      <section className="section shell" aria-labelledby="live-reminder-title">
        <h2 id="live-reminder-title">Get a reminder from TikTok</h2>
        <p>This site does not send live-alert notifications. Follow <a href="https://www.tiktok.com/@thelioncompanytx">@thelioncompanytx on TikTok</a>, then use TikTok’s Following settings to enable LIVE notifications. TikTok controls delivery and may change the exact setting label.</p>
      </section>
    </>
  );
}
~~~

~~~css
/* components/client/live-status.module.css */
.status {
  display: grid;
  min-height: 10.5rem;
  align-content: center;
  gap: var(--space-2);
  padding: var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-large);
  background: color-mix(in srgb, var(--paper-raised) 92%, transparent);
}

.status p,
.status time {
  margin: 0;
}

.label {
  color: var(--clay-dark);
  font-size: var(--step--1);
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.label[data-state="live"]::before {
  display: inline-block;
  width: 0.55rem;
  aspect-ratio: 1;
  margin-inline-end: 0.5rem;
  border-radius: 50%;
  background: var(--clay);
  content: "";
}

.status a {
  width: fit-content;
  font-weight: 800;
  text-underline-offset: 0.25em;
}
~~~

- [ ] **Step 4: Verify every boundary and commit**

Run: `npm test -- --run tests/unit/live-status.test.ts tests/components/live-status.test.tsx && npm run typecheck`

Expected: all live tests pass, including exact start/end/grace boundaries; TypeScript exits 0.

~~~bash
git add lib/live/status.ts components/client/live-status.tsx components/client/live-status.module.css app/live/page.tsx tests/unit/live-status.test.ts tests/components/live-status.test.tsx
git commit -m "feat: derive honest TikTok live status"
~~~

### Task 5: Build transcript-safe media and the searchable teaching library

**Files:**
- Create: `lib/media/eligibility.ts`
- Create: `components/client/video-facade.tsx`
- Create: `components/client/video-facade.module.css`
- Create: `components/server/teaching-card.tsx`
- Create: `components/server/teaching-card.module.css`
- Create: `components/client/teaching-library.tsx`
- Create: `components/client/teaching-library.module.css`
- Modify: `app/teachings/page.tsx`
- Modify: `app/teachings/[slug]/page.tsx`
- Test: `tests/unit/media-eligibility.test.ts`
- Test: `tests/components/video-facade.test.tsx`
- Test: `tests/components/teaching-library.test.tsx`

**Interfaces:**
- Consumes: `teachings`, `topicDefinitions`, `getTeachingBySlug`, `getTeachingSlugs`, and `createPageMetadata`.
- Produces: `canEmbedTeaching(teaching): boolean`, `canPlayPodcast(episode): boolean`, `VideoFacade({ teaching, placement })`, `TeachingCard({ teaching })`, and a static-HTML-safe `TeachingLibrary({ teachings, topics })` that hydrates a validated `?topic=` deep link. Both cards and facades consume the manifest's ledgered first-party `posterPath`; no YouTube or `ytimg` request is permitted before explicit play or outbound navigation.

- [ ] **Step 1: Write failing eligibility and interaction tests**

~~~ts
// tests/unit/media-eligibility.test.ts
import { describe, expect, it } from "vitest";
import {
  canEmbedTeaching,
  canPlayPodcast,
  youtubeEmbedUrl,
} from "@/lib/media/eligibility";
import type { PodcastEpisode, Teaching } from "@/lib/content/types";

const teaching: Teaching = {
  slug: "unity",
  title: "Unity",
  summary: "A teaching about unity.",
  youtubeId: "abcdefghijk",
  posterPath: "/images/teachings/unity.jpg",
  publishedAt: "2026-07-01T00:00:00Z",
  topics: ["church-reform-and-unity"],
  series: null,
  captionsVerified: true,
  transcriptUrl: "https://www.thelioncompany.org/teachings/unity#transcript",
  featured: true,
};

describe("media eligibility", () => {
  it("requires both verified captions and a transcript for video", () => {
    expect(canEmbedTeaching(teaching)).toBe(true);
    expect(canEmbedTeaching({ ...teaching, captionsVerified: false })).toBe(false);
    expect(canEmbedTeaching({ ...teaching, transcriptUrl: null })).toBe(false);
    expect(canEmbedTeaching({ ...teaching, transcriptUrl: "https://www.youtube.com/watch?v=abcdefghijk" })).toBe(false);
  });

  it("requires audio and a transcript for podcast playback", () => {
    const episode: PodcastEpisode = {
      slug: "episode",
      title: "Episode",
      description: "Description",
      publishedAt: "2026-07-01T00:00:00Z",
      durationSeconds: null,
      pageUrl: "https://thelioncompany.podbean.com/e/episode",
      audioUrl: "https://www.thelioncompany.org/media/episode.mp3",
      imageUrl: null,
      episodeNumber: null,
      transcriptUrl: "https://example.com/transcript",
    };
    expect(canPlayPodcast(episode)).toBe(true);
    expect(canPlayPodcast({ ...episode, transcriptUrl: null })).toBe(false);
    expect(canPlayPodcast({ ...episode, audioUrl: "https://mcdn.podbean.com/episode.mp3" })).toBe(false);
  });

  it("uses the privacy-enhanced YouTube host", () => {
    expect(youtubeEmbedUrl("abcdefghijk")).toBe(
      "https://www.youtube-nocookie.com/embed/abcdefghijk?autoplay=1&rel=0",
    );
  });
});
~~~

~~~tsx
// tests/components/video-facade.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { AnalyticsProvider } from "@/components/client/analytics-provider";
import { VideoFacade } from "@/components/client/video-facade";
import type { Teaching } from "@/lib/content/types";

const teaching: Teaching = {
  slug: "unity",
  title: "Unity",
  summary: "A teaching about unity.",
  youtubeId: "abcdefghijk",
  posterPath: "/images/teachings/unity.jpg",
  publishedAt: "2026-07-01T00:00:00Z",
  topics: ["church-reform-and-unity"],
  series: null,
  captionsVerified: true,
  transcriptUrl: "https://www.thelioncompany.org/teachings/unity#transcript",
  featured: true,
};

describe("VideoFacade", () => {
  it("does not create an iframe before activation", async () => {
    render(
      <AnalyticsProvider enabled={false}>
        <VideoFacade teaching={teaching} placement="teaching-detail" />
      </AnalyticsProvider>,
    );
    expect(screen.queryByTitle(/unity video/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /play unity/i }));
    expect(screen.getByTitle(/unity video/i)).toHaveAttribute(
      "src",
      expect.stringContaining("youtube-nocookie.com"),
    );
  });
});
~~~

~~~tsx
// tests/components/teaching-library.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TeachingLibrary } from "@/components/client/teaching-library";
import type { Teaching, TopicDefinition } from "@/lib/content/types";

const topics: readonly TopicDefinition[] = [
  { slug: "fear-and-trust", label: "Fear and trust", prompt: "I need courage", description: "Trust Jesus." },
  { slug: "church-reform-and-unity", label: "Church reform and unity", prompt: "I want unity", description: "Become one." },
];
const teachings: readonly Teaching[] = [
  { slug: "peace", title: "Peace in fear", summary: "Trust in fear", youtubeId: "abcdefghijk", posterPath: "/images/teachings/peace.jpg", publishedAt: "2026-07-01T00:00:00Z", topics: ["fear-and-trust"], series: null, captionsVerified: true, transcriptUrl: "https://example.com", featured: true },
  { slug: "one-body", title: "One body", summary: "Unity in Christ", youtubeId: "lmnopqrstuv", posterPath: "/images/teachings/one-body.jpg", publishedAt: null, topics: ["church-reform-and-unity"], series: null, captionsVerified: false, transcriptUrl: null, featured: false },
];

describe("TeachingLibrary", () => {
  beforeEach(() => window.history.replaceState({}, "", "/teachings"));

  it("combines text and topic filters with a visible result count", async () => {
    render(<TeachingLibrary teachings={teachings} topics={topics} />);
    await userEvent.type(screen.getByRole("searchbox"), "peace");
    expect(screen.getByRole("status")).toHaveTextContent("1 teaching");
    expect(screen.getByRole("link", { name: /peace in fear/i })).toBeVisible();
    expect(screen.queryByRole("link", { name: /one body/i })).not.toBeInTheDocument();
  });

  it("hydrates a validated topic deep link without making the route dynamic", async () => {
    window.history.replaceState({}, "", "/teachings?topic=church-reform-and-unity");
    render(<TeachingLibrary teachings={teachings} topics={topics} />);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("1 teaching"));
    expect(screen.getByRole("link", { name: /one body/i })).toBeVisible();
    expect(screen.queryByRole("link", { name: /peace in fear/i })).not.toBeInTheDocument();
  });
});
~~~

- [ ] **Step 2: Verify all three test files fail**

Run: `npm test -- --run tests/unit/media-eligibility.test.ts tests/components/video-facade.test.tsx tests/components/teaching-library.test.tsx`

Expected: FAIL with missing eligibility, facade, and teaching-library modules.

- [ ] **Step 3: Implement eligibility, facade, cards, and filter state**

~~~ts
// lib/media/eligibility.ts
import { siteContent } from "@/content/site";
import type { PodcastEpisode, Teaching } from "@/lib/content/types";

export function canEmbedTeaching(
  teaching: Teaching,
): teaching is Teaching & { captionsVerified: true; transcriptUrl: string } {
  return teaching.captionsVerified && Boolean(teaching.transcriptUrl) && new URL(teaching.transcriptUrl!).origin === siteContent.canonicalOrigin;
}

export function canPlayPodcast(
  episode: PodcastEpisode,
): episode is PodcastEpisode & { transcriptUrl: string } {
  return Boolean(episode.transcriptUrl) && new URL(episode.audioUrl).origin === siteContent.canonicalOrigin;
}

export function youtubeEmbedUrl(id: string) {
  return (
    "https://www.youtube-nocookie.com/embed/" +
    encodeURIComponent(id) +
    "?autoplay=1&rel=0"
  );
}
~~~

~~~tsx
// components/client/video-facade.tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import type { Teaching } from "@/lib/content/types";
import {
  canEmbedTeaching,
  youtubeEmbedUrl,
} from "@/lib/media/eligibility";
import { useAnalytics } from "./analytics-provider";
import styles from "./video-facade.module.css";

export function VideoFacade({
  teaching,
  placement,
}: {
  readonly teaching: Teaching;
  readonly placement: "home" | "teaching-detail";
}) {
  const [playing, setPlaying] = useState(false);
  const analytics = useAnalytics();
  const eligible = canEmbedTeaching(teaching);

  if (!eligible) {
    return (
      <div className={styles.unavailable}>
        <p>This teaching opens on YouTube while its complete text alternative is prepared.</p>
        <a href={"https://www.youtube.com/watch?v=" + teaching.youtubeId}>Watch directly on YouTube</a>
      </div>
    );
  }

  if (playing) {
    return (
      <div className={styles.frame}>
        <iframe
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          src={youtubeEmbedUrl(teaching.youtubeId)}
          title={teaching.title + " video"}
        />
      </div>
    );
  }

  return (
    <button
      className={styles.facade}
      type="button"
      aria-label={"Play " + teaching.title}
      onClick={() => {
        setPlaying(true);
        analytics.track("video_start", { placement });
      }}
    >
      <Image
        src={teaching.posterPath}
        alt=""
        fill
        sizes={placement === "home" ? "(max-width: 64rem) 100vw, 66vw" : "(max-width: 64rem) 100vw, 72rem"}
      />
      <span aria-hidden="true">Play</span>
    </button>
  );
}
~~~

~~~css
/* components/client/video-facade.module.css */
.facade,
.frame {
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-large);
  background: var(--ink);
}

.facade {
  position: relative;
  cursor: pointer;
}

.facade > img { object-fit: cover; }

.facade::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgb(36 21 31 / 0.55), transparent 65%);
  content: "";
}

.facade span {
  position: absolute;
  z-index: 1;
  inset: auto auto var(--space-4) var(--space-4);
  padding: 0.7rem 1rem;
  border-radius: 999px;
  background: var(--paper-raised);
  color: var(--ink);
  font-weight: 800;
}

.frame iframe {
  width: 100%;
  height: 100%;
  border: 0;
}

.unavailable {
  padding: var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-large);
}
~~~

~~~tsx
// components/server/teaching-card.tsx
import Image from "next/image";
import Link from "next/link";
import type { Teaching } from "@/lib/content/types";
import styles from "./teaching-card.module.css";

export function TeachingCard({ teaching }: { readonly teaching: Teaching }) {
  return (
    <article className={styles.card}>
      <div className={styles.image} aria-hidden="true">
        <Image
          src={teaching.posterPath}
          alt=""
          fill
          sizes="(max-width: 38rem) 100vw, (max-width: 58rem) 50vw, 33vw"
        />
      </div>
      <div className={styles.body}>
        {teaching.publishedAt ? (
          <p><time dateTime={teaching.publishedAt}>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(teaching.publishedAt))}</time></p>
        ) : (
          <p>Archive teaching</p>
        )}
        <h3><Link href={"/teachings/" + teaching.slug}>{teaching.title}</Link></h3>
        <p>{teaching.summary}</p>
      </div>
    </article>
  );
}
~~~

~~~css
/* components/server/teaching-card.module.css */
.card {
  display: grid;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-large);
  background: var(--paper-raised);
}

.image {
  position: relative;
  aspect-ratio: 16 / 9;
  background: var(--paper-deep);
}

.image img { object-fit: cover; }

.body {
  padding: var(--space-4);
}

.body > p:first-child {
  color: var(--clay-dark);
  font-size: var(--step--1);
  font-weight: 800;
  text-transform: uppercase;
}

.body h3 {
  font-family: var(--font-display);
  font-size: var(--step-2);
  font-weight: 400;
  line-height: 1;
}

.body h3 a::after {
  position: absolute;
  inset: 0;
  content: "";
}

.card {
  position: relative;
}
~~~

~~~tsx
// components/client/teaching-library.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Teaching, TopicDefinition, TopicSlug } from "@/lib/content/types";
import { TeachingCard } from "@/components/server/teaching-card";
import styles from "./teaching-library.module.css";

export function TeachingLibrary({
  teachings,
  topics,
}: {
  readonly teachings: readonly Teaching[];
  readonly topics: readonly TopicDefinition[];
}) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<TopicSlug | "all">("all");
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("topic");
    if (requested && topics.some((candidate) => candidate.slug === requested)) {
      setTopic(requested as TopicSlug);
    }
  }, [topics]);
  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return teachings.filter((teaching) => {
      const topicMatch = topic === "all" || teaching.topics.includes(topic);
      const text = (teaching.title + " " + teaching.summary).toLocaleLowerCase();
      return topicMatch && (!normalized || text.includes(normalized));
    });
  }, [query, teachings, topic]);

  return (
    <section className={styles.library} aria-labelledby="teaching-library-title">
      <h2 className="sr-only" id="teaching-library-title">Teaching library</h2>
      <div className={styles.controls}>
        <label>
          <span>Search teachings</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search a title or question"
          />
        </label>
        <label>
          <span>Topic</span>
          <select value={topic} onChange={(event) => setTopic(event.currentTarget.value as TopicSlug | "all")}>
            <option value="all">All topics</option>
            {topics.map((item) => <option value={item.slug} key={item.slug}>{item.label}</option>)}
          </select>
        </label>
      </div>
      <p className={styles.status} role="status" aria-live="polite">
        {results.length} {results.length === 1 ? "teaching" : "teachings"}
      </p>
      {results.length ? (
        <div className={styles.grid}>{results.map((item) => <TeachingCard teaching={item} key={item.slug} />)}</div>
      ) : (
        <div className={styles.empty}>
          <h3>No teaching matches those filters.</h3>
          <button type="button" onClick={() => { setQuery(""); setTopic("all"); }}>Clear filters</button>
        </div>
      )}
    </section>
  );
}
~~~

~~~css
/* components/client/teaching-library.module.css */
.library {
  width: min(calc(100% - 2rem), var(--measure-wide));
  padding-block-end: var(--space-8);
  margin-inline: auto;
}

.controls {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-3);
  padding: var(--space-4);
  border-block: 1px solid var(--line);
}

.controls label {
  display: grid;
  gap: 0.35rem;
  font-size: var(--step--1);
  font-weight: 800;
}

.controls input,
.controls select {
  min-height: 2.75rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-small);
  background: var(--paper-raised);
}

.status {
  color: var(--ink-soft);
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
}

.empty {
  padding: var(--space-7);
  text-align: center;
}

@media (max-width: 58rem) {
  .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 38rem) {
  .controls,
  .grid { grid-template-columns: 1fr; }
}
~~~

- [ ] **Step 4: Wire crawlable teaching routes**

~~~tsx
// app/teachings/page.tsx
import { TeachingLibrary } from "@/components/client/teaching-library";
import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { teachings } from "@/content/teachings";
import { topicDefinitions } from "@/content/topics";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";

const description = "Search practical, Jesus-centered teachings for faith, relationships, purpose, unity, and courage.";

export const metadata = createPageMetadata({
  title: "Teachings",
  description,
  path: "/teachings",
});

export default function TeachingsPage() {
  return (
    <>
      <JsonLd id="teachings-schema" data={[webPageSchema({ path: "/teachings", title: "Teachings", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Teachings", path: "/teachings" }])]} />
      <PageIntro eyebrow="The living archive" title="Teaching for what you are carrying." description="Search the archive or begin with the question closest to your life today." />
      <TeachingLibrary teachings={teachings} topics={topicDefinitions} />
    </>
  );
}
~~~

~~~tsx
// app/teachings/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { VideoFacade } from "@/components/client/video-facade";
import { JsonLd } from "@/components/server/json-ld";
import { TeachingCard } from "@/components/server/teaching-card";
import { teachings } from "@/content/teachings";
import { getTeachingBySlug, getTeachingSlugs, getTopicBySlug } from "@/lib/content";
import { getTeachingReviewBundle } from "@/lib/media/transcripts.server";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, videoSchema, webPageSchema } from "@/lib/seo/schema";

export const dynamicParams = false;
export function generateStaticParams() {
  return getTeachingSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const teaching = getTeachingBySlug((await params).slug);
  if (!teaching) return {};
  return createPageMetadata({
    title: teaching.title,
    description: teaching.summary,
    path: "/teachings/" + teaching.slug,
  });
}

export default async function TeachingDetail({ params }: { params: Promise<{ slug: string }> }) {
  const baseTeaching = getTeachingBySlug((await params).slug);
  if (!baseTeaching) notFound();
  const reviewed = getTeachingReviewBundle(baseTeaching);
  const teaching = reviewed.teaching;
  const related = teachings
    .filter((item) => item.slug !== teaching.slug && item.topics.some((topic) => teaching.topics.includes(topic)))
    .slice(0, 3);
  const video = videoSchema(teaching);
  return (
    <>
      <JsonLd id="teaching-schema" data={[webPageSchema({ path: "/teachings/" + teaching.slug, title: teaching.title, description: teaching.summary }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Teachings", path: "/teachings" }, { name: teaching.title, path: "/teachings/" + teaching.slug }]), ...(video ? [video] : [])]} />
      <article className="container section">
        <p>Teaching</p>
        <h1>{teaching.title}</h1>
        <p>{teaching.summary}</p>
        <nav aria-label="Teaching topics">
          {teaching.topics.map((topic) => <Link href={"/teachings?topic=" + topic} key={topic}>{getTopicBySlug(topic).label}</Link>)}
        </nav>
        <VideoFacade teaching={teaching} placement="teaching-detail" />
        {reviewed.transcript ? (
          <section id="transcript" aria-labelledby="transcript-title">
            <h2 id="transcript-title">Complete transcript</h2>
            {reviewed.transcript.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </section>
        ) : null}
        <section aria-labelledby="related-teachings">
          <h2 id="related-teachings">Continue exploring</h2>
          {related.map((item) => <TeachingCard teaching={item} key={item.slug} />)}
        </section>
      </article>
    </>
  );
}
~~~

- [ ] **Step 5: Run focused and route tests, then commit**

Run: `npm test -- --run tests/unit/media-eligibility.test.ts tests/components/video-facade.test.tsx tests/components/teaching-library.test.tsx && npm run typecheck && npm run build`

Expected: all focused tests pass; build emits static `/teachings` and every manifest-backed teaching slug; no YouTube iframe request occurs in the facade test before activation.

~~~bash
git add lib/media/eligibility.ts components/client/video-facade.tsx components/client/video-facade.module.css components/client/teaching-library.tsx components/client/teaching-library.module.css components/server/teaching-card.tsx components/server/teaching-card.module.css app/teachings tests/unit/media-eligibility.test.ts tests/components/video-facade.test.tsx tests/components/teaching-library.test.tsx
git commit -m "feat: build transcript-safe teaching library"
~~~

### Task 6: Build the podcast listening journey

**Files:**
- Create: `components/client/audio-player.tsx`
- Create: `components/server/podcast-card.tsx`
- Create: `components/server/podcast-card.module.css`
- Modify: `app/podcast/page.tsx`
- Modify: `app/podcast/[slug]/page.tsx`
- Test: `tests/components/audio-player.test.tsx`
- Test: `tests/integration/podcast-routes.test.tsx`

**Interfaces:**
- Consumes: synchronous `getPublishedPodcastEpisodes(): readonly PodcastEpisode[]`, `canPlayPodcast`, and destination registry keys `applePodcasts`, `spotify`, `podbean`, `podcastRss`, and `youtube`. Public rendering reads only the reviewed Git snapshot; RSS refresh and redeploy remain the foundation plan's explicit maintainer workflow.
- Produces: `AudioPlayer({ episode })` and `PodcastCard({ episode })`.

- [ ] **Step 1: Write the failing player contract**

~~~tsx
// tests/components/audio-player.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AudioPlayer } from "@/components/client/audio-player";

const episode = {
  slug: "formed",
  title: "Formed in love",
  description: "An episode about love.",
  publishedAt: "2026-07-01T00:00:00Z",
  durationSeconds: 1800,
  pageUrl: "https://thelioncompany.podbean.com/e/formed",
  audioUrl: "https://www.thelioncompany.org/media/formed.mp3",
  imageUrl: null,
  episodeNumber: 8,
  transcriptUrl: "https://example.com/formed-transcript",
} as const;

describe("AudioPlayer", () => {
  it("uses preload none only when a complete transcript exists", () => {
    const { rerender } = render(<AudioPlayer episode={episode} />);
    expect(screen.getByLabelText(/listen to formed in love/i)).toHaveAttribute("preload", "none");
    rerender(<AudioPlayer episode={{ ...episode, transcriptUrl: null }} />);
    expect(screen.queryByLabelText(/listen to/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /listen on podbean/i })).toBeVisible();
  });
});
~~~

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- --run tests/components/audio-player.test.tsx`

Expected: FAIL because `components/client/audio-player.tsx` does not exist.

- [ ] **Step 3: Implement the player, episode card, and both routes**

~~~tsx
// components/client/audio-player.tsx
"use client";

import type { PodcastEpisode } from "@/lib/content/types";
import { canPlayPodcast } from "@/lib/media/eligibility";

export function AudioPlayer({ episode }: { readonly episode: PodcastEpisode }) {
  if (!canPlayPodcast(episode)) {
    return <p><a href={episode.pageUrl}>Listen on Podbean</a></p>;
  }
  return (
    <div>
      <audio aria-label={"Listen to " + episode.title} controls preload="none" src={episode.audioUrl}>
        <a href={episode.audioUrl}>Download the episode audio</a>
      </audio>
      <p><a href={episode.transcriptUrl}>Read the complete transcript</a></p>
    </div>
  );
}

// components/server/podcast-card.tsx
import Link from "next/link";
import type { PodcastEpisode } from "@/lib/content/types";
import styles from "./podcast-card.module.css";

export function PodcastCard({ episode }: { readonly episode: PodcastEpisode }) {
  return (
    <article className={styles.card}>
      <p>
        {episode.episodeNumber ? "Episode " + episode.episodeNumber + " · " : ""}
        <time dateTime={episode.publishedAt}>
          {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(episode.publishedAt))}
        </time>
      </p>
      <h2><Link href={"/podcast/" + episode.slug}>{episode.title}</Link></h2>
      <p>{episode.description}</p>
    </article>
  );
}
~~~

~~~css
/* components/server/podcast-card.module.css */
.card {
  position: relative;
  padding: var(--space-5);
  border-block-start: 1px solid var(--line);
}

.card > p:first-child {
  color: var(--clay-dark);
  font-size: var(--step--1);
  font-weight: 800;
  text-transform: uppercase;
}

.card h2 {
  font-family: var(--font-display);
  font-size: var(--step-2);
  font-weight: 400;
}

.card h2 a::after {
  position: absolute;
  inset: 0;
  content: "";
}
~~~

~~~tsx
// app/podcast/page.tsx
import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { PodcastCard } from "@/components/server/podcast-card";
import { TrackedLink } from "@/components/client/tracked-link";
import { getDestination } from "@/lib/content";
import { getPublishedPodcastEpisodes } from "@/lib/media/podcast-feed";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, podcastSeriesSchema, webPageSchema } from "@/lib/seo/schema";

const description = "Listen to The Lion Company Podcast on your preferred platform.";

export const metadata = createPageMetadata({
  title: "Podcast",
  description,
  path: "/podcast",
});

export default function PodcastPage() {
  const episodes = getPublishedPodcastEpisodes();
  const platforms = ["applePodcasts", "spotify", "podbean", "podcastRss", "youtube"] as const;
  return (
    <>
      <JsonLd id="podcast-schema" data={[webPageSchema({ path: "/podcast", title: "Podcast", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Podcast", path: "/podcast" }]), podcastSeriesSchema()]} />
      <PageIntro eyebrow="Listen" title="Formation for the road." description="Jesus-centered conversations and teachings, available wherever you listen." />
      <nav className="container" aria-label="Podcast platforms">
        {platforms.map((key) => {
          const destination = getDestination(key);
          return (
            <TrackedLink href={destination.href} key={key} eventName="podcast_platform_click" eventProperties={{ target: key, placement: "podcast-index" }}>
              {destination.label}
            </TrackedLink>
          );
        })}
      </nav>
      <section className="container section" aria-labelledby="podcast-episodes">
        <h2 id="podcast-episodes">Episodes</h2>
        {episodes.map((episode) => <PodcastCard episode={episode} key={episode.slug} />)}
      </section>
    </>
  );
}
~~~

~~~tsx
// app/podcast/[slug]/page.tsx
import { notFound } from "next/navigation";
import { AudioPlayer } from "@/components/client/audio-player";
import { TrackedLink } from "@/components/client/tracked-link";
import { JsonLd } from "@/components/server/json-ld";
import { getDestination } from "@/lib/content";
import { getPublishedPodcastEpisodes } from "@/lib/media/podcast-feed";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, podcastEpisodeSchema, webPageSchema } from "@/lib/seo/schema";

export const dynamicParams = false;
export function generateStaticParams() {
  return getPublishedPodcastEpisodes().map((episode) => ({ slug: episode.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const episode = getPublishedPodcastEpisodes().find((item) => item.slug === slug);
  return episode
    ? createPageMetadata({ title: episode.title, description: episode.description, path: "/podcast/" + slug, image: episode.imageUrl ?? undefined })
    : {};
}

export default async function PodcastEpisodePage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const episode = getPublishedPodcastEpisodes().find((item) => item.slug === slug);
  if (!episode) notFound();
  return (
    <>
      <JsonLd id="podcast-episode-schema" data={[webPageSchema({ path: "/podcast/" + episode.slug, title: episode.title, description: episode.description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Podcast", path: "/podcast" }, { name: episode.title, path: "/podcast/" + episode.slug }]), podcastEpisodeSchema(episode)]} />
      <article className="container section">
        <p>Podcast episode</p>
        <h1>{episode.title}</h1>
        <time dateTime={episode.publishedAt}>
          {new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(episode.publishedAt))}
        </time>
        <p>{episode.description}</p>
        <AudioPlayer episode={episode} />
        <nav aria-label="Listen to this podcast">
          <TrackedLink href={episode.pageUrl} eventName="podcast_platform_click" eventProperties={{ target: "podbean", placement: "podcast-detail" }}>Open this episode on Podbean</TrackedLink>
          {(["applePodcasts", "spotify", "podcastRss", "youtube"] as const).map((key) => {
            const destination = getDestination(key);
            return <TrackedLink href={destination.href} eventName="podcast_platform_click" eventProperties={{ target: key, placement: "podcast-detail" }} key={key}>{destination.label}</TrackedLink>;
          })}
        </nav>
      </article>
    </>
  );
}
~~~

- [ ] **Step 4: Add a route render test, run, and commit**

~~~tsx
// tests/integration/podcast-routes.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AnalyticsProvider } from "@/components/client/analytics-provider";
import PodcastPage from "@/app/podcast/page";

vi.mock("@/lib/media/podcast-feed", () => ({
  getPublishedPodcastEpisodes: () => [{
    slug: "formed",
    title: "Formed in love",
    description: "An episode about love.",
    publishedAt: "2026-07-01T00:00:00Z",
    durationSeconds: 1800,
    audioUrl: "https://cdn.example.com/formed.mp3",
    pageUrl: "https://thelioncompany.podbean.com/e/formed",
    imageUrl: null,
    episodeNumber: 8,
    transcriptUrl: null,
  }],
}));

describe("podcast routes", () => {
  it("renders crawlable episode links from the validated adapter", async () => {
    render(<AnalyticsProvider enabled={false}><PodcastPage /></AnalyticsProvider>);
    expect(screen.getByRole("link", { name: /formed in love/i })).toHaveAttribute("href", "/podcast/formed");
  });
});
~~~

Run: `npm test -- --run tests/components/audio-player.test.tsx tests/integration/podcast-routes.test.tsx && npm run typecheck && npm run build`

Expected: both tests pass; build emits `/podcast` and every checked-in episode route as static HTML, unknown episode slugs are a real 404, and no build or production request fetches Podbean RSS. A new episode appears only after the explicit snapshot refresh is reviewed, committed, and redeployed.

~~~bash
git add components/client/audio-player.tsx components/server/podcast-card.tsx components/server/podcast-card.module.css app/podcast tests/components/audio-player.test.tsx tests/integration/podcast-routes.test.tsx
git commit -m "feat: add accessible podcast listening journey"
~~~

### Task 7: Compose the homepage journey and progressive GSAP gathering line

**Files:**
- Create: `components/server/home/hero.tsx`
- Create: `components/server/home/participation-paths.tsx`
- Create: `components/server/home/topic-finder.tsx`
- Create: `components/server/home/watch-listen.tsx`
- Create: `components/server/home/connection-network.tsx`
- Create: `components/server/home/final-invitation.tsx`
- Create: `components/server/home/home.module.css`
- Create: `components/client/gathering-line.tsx`
- Create: `components/client/gathering-line.module.css`
- Modify: `app/page.tsx`
- Test: `tests/integration/homepage.test.tsx`
- Test: `tests/components/gathering-line.test.tsx`

**Interfaces:**
- Consumes: validated `liveSchedule`, `recentReplay`, `teachings`, hash-bound teaching review bundles, topic definitions, the static podcast snapshot, destination registry, `PrayerForm`, `NewsletterForm`, the ledgered `lib/art/gathering-line.ts` motif, and the ledgered `public/images/brand/lion-portrait.jpg` copied in foundation Task 5.
- Produces: a fully server-rendered `HomePage`; `GatheringLine({ rootId })` is optional progressive enhancement and contains no unique content. Its four semantic SVG stages visibly evolve mane -> connection -> waveform -> participation network, while the hero uses the single approved lion image exactly once. Desktop alone may pin the manifesto and use selective mask/parallax motion; mobile receives short vertical transitions; reduced motion renders every stage statically with no pin, scrub, mask animation, or parallax.

- [ ] **Step 1: Write the failing homepage hierarchy and reduced-motion tests**

~~~tsx
// tests/integration/homepage.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AnalyticsProvider } from "@/components/client/analytics-provider";
import HomePage from "@/app/page";

vi.mock("@/lib/media/podcast-feed", () => ({
  getPublishedPodcastEpisodes: () => [{
    slug: "formed",
    title: "Formed in love",
    description: "An episode about formation.",
    publishedAt: "2026-07-01T00:00:00Z",
    durationSeconds: 1800,
    audioUrl: "https://cdn.example.com/formed.mp3",
    pageUrl: "https://thelioncompany.podbean.com/e/formed",
    imageUrl: null,
    episodeNumber: 8,
    transcriptUrl: null,
  }],
}));

vi.mock("@/lib/media/transcripts.server", () => ({
  getTeachingReviewBundle: (teaching: { slug: string } & Record<string, unknown>) => ({
    teaching: { ...teaching, captionsVerified: true, transcriptUrl: `https://www.thelioncompany.org/teachings/${teaching.slug}#transcript` },
    transcript: "Reviewed transcript fixture.",
  }),
}));

describe("homepage journey", () => {
  it("renders the entire Seen, Gathered, Formed, Sent hierarchy without motion", async () => {
    render(<AnalyticsProvider enabled={false}><HomePage /></AnalyticsProvider>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/whatever doesn't cause you/i);
    expect(screen.getByRole("heading", { name: /what are you carrying today/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /love is the beginning/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /submit a prayer request/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /support the mission/i })).toBeVisible();
  });
});
~~~

~~~tsx
// tests/components/gathering-line.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GatheringLine } from "@/components/client/gathering-line";

describe("GatheringLine", () => {
  it("is decorative and cannot hide server content", () => {
    render(<GatheringLine rootId="home-journey" />);
    expect(screen.getByTestId("gathering-line")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("gathering-line")).toHaveAttribute("focusable", "false");
    expect(screen.getByTestId("gathering-line").querySelectorAll("[data-stage]")).toHaveLength(4);
  });
});
~~~

- [ ] **Step 2: Run both tests and verify missing homepage modules fail**

Run: `npm test -- --run tests/integration/homepage.test.tsx tests/components/gathering-line.test.tsx`

Expected: FAIL with missing home-section and gathering-line modules.

- [ ] **Step 3: Implement the server-rendered hero, participation, topic, media, channel, and final sections**

~~~tsx
// components/server/home/hero.tsx
import Image from "next/image";
import { LiveStatus } from "@/components/client/live-status";
import { ActionLink } from "@/components/ui/action-link";
import type { LiveSchedule, RecentReplay } from "@/lib/content/types";
import styles from "./home.module.css";

export function Hero({ schedule, replay }: { readonly schedule: LiveSchedule | null; readonly replay: RecentReplay | null }) {
  return (
    <section className={styles.hero} aria-labelledby="home-title" data-gathering-stage="mane">
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}>Unity through Christ</p>
        <h1 id="home-title">“Whatever doesn’t cause you to look like Jesus isn’t of Jesus.”</h1>
        <p>You were not made to watch faith from the edge. Come be seen, gathered, formed, and sent.</p>
        <div className={styles.actions}>
          <ActionLink href="/live" tone="clay" tracking={{ target: "live", placement: "home-hero" }}>Join today’s live</ActionLink>
          <ActionLink href="/start-here" tone="quiet" tracking={{ target: "start-here", placement: "home-hero" }}>Start here</ActionLink>
        </div>
      </div>
      <div className={styles.heroVisual} data-parallax>
        <Image src="/images/brand/lion-portrait.jpg" alt="" width={1024} height={573} sizes="(max-width: 64rem) 100vw, 38vw" priority />
        <LiveStatus schedule={schedule} replay={replay} placement="hero" />
      </div>
    </section>
  );
}

// components/server/home/participation-paths.tsx
import Link from "next/link";
import styles from "./home.module.css";

const paths = [
  { label: "Watch", title: "Begin with today’s teaching", href: "/live", className: styles.pathWide },
  { label: "Pray", title: "Let someone stand with you", href: "/prayer", className: styles.pathTall },
  { label: "Grow", title: "Find teaching for real life", href: "/teachings", className: "" },
  { label: "Give", title: "Help sustain the work", href: "/give", className: "" },
] as const;

export function ParticipationPaths() {
  return (
    <section className={"section " + styles.participation} aria-labelledby="participation-title" data-gathering-stage="connection">
      <header><p className={styles.eyebrow}>Not an audience</p><h2 id="participation-title">A place to participate.</h2></header>
      <div className={styles.pathGrid}>
        {paths.map((path, index) => (
          <article className={[styles.path, path.className].filter(Boolean).join(" ")} key={path.label}>
            <span aria-hidden="true">0{index + 1}</span>
            <p>{path.label}</p>
            <h3><Link href={path.href}>{path.title}</Link></h3>
          </article>
        ))}
      </div>
    </section>
  );
}

// components/server/home/topic-finder.tsx
import Link from "next/link";
import type { Teaching, TopicDefinition } from "@/lib/content/types";
import styles from "./home.module.css";

export function TopicFinder({ topics, teachings }: { readonly topics: readonly TopicDefinition[]; readonly teachings: readonly Teaching[] }) {
  const available = topics.filter((topic) => teachings.some((item) => item.topics.includes(topic.slug)));
  return (
    <section className={"section " + styles.topics} id="media" aria-labelledby="topic-finder-title">
      <p className={styles.eyebrow}>Find a path</p>
      <h2 id="topic-finder-title">What are you carrying today?</h2>
      <div>
        {available.map((topic) => (
          <Link href={"/teachings?topic=" + topic.slug} key={topic.slug}>
            <span>{topic.prompt}</span><strong>{topic.label}</strong>
          </Link>
        ))}
      </div>
    </section>
  );
}

// components/server/home/watch-listen.tsx
import Link from "next/link";
import { VideoFacade } from "@/components/client/video-facade";
import type { PodcastEpisode, Teaching } from "@/lib/content/types";
import { getDestination } from "@/lib/content";
import styles from "./home.module.css";

export function WatchListen({ featured, latestEpisode }: { readonly featured: Teaching; readonly latestEpisode?: PodcastEpisode }) {
  return (
    <section className={"section " + styles.watchListen} id="podcast" aria-labelledby="watch-listen-title" data-gathering-stage="waveform">
      <header><p className={styles.eyebrow}>Watch and listen</p><h2 id="watch-listen-title">Formation beyond the moment.</h2></header>
      <div className={styles.mediaGrid}>
        <article>
          <VideoFacade teaching={featured} placement="home" />
          <h3>{featured.title}</h3>
          <p>{featured.summary}</p>
          <Link href={"/teachings/" + featured.slug}>Open teaching and transcript</Link>
        </article>
        <article className={styles.podcastFeature}>
          <p>Latest podcast</p>
          <h3>{latestEpisode?.title ?? "The Lion Company Podcast"}</h3>
          <p>{latestEpisode?.description ?? "Listen to Jesus-centered conversations and teaching."}</p>
          <Link href={latestEpisode ? "/podcast/" + latestEpisode.slug : "/podcast"}>Listen to the podcast</Link>
        </article>
      </div>
      <p><a href={getDestination("youtube").href}>Explore hundreds of teachings on YouTube</a></p>
    </section>
  );
}

// components/server/home/connection-network.tsx
import { TrackedLink } from "@/components/client/tracked-link";
import { ChannelMark } from "@/components/ui/channel-mark";
import { isPodcastAnalyticsTarget, isSocialAnalyticsTarget } from "@/lib/analytics/contracts";
import type { Destination } from "@/lib/content/types";
import styles from "./home.module.css";

export function ConnectionNetwork({ channels }: { readonly channels: readonly Destination[] }) {
  const connectionChannels = channels.filter(
    (channel) => channel.visible && (isSocialAnalyticsTarget(channel.key) || isPodcastAnalyticsTarget(channel.key)),
  );
  return (
    <section className={"section " + styles.network} id="contact" aria-labelledby="network-title" data-gathering-stage="network">
      <p className={styles.eyebrow}>Stay connected</p>
      <h2 id="network-title">Choose the channel that fits the moment.</h2>
      <div>
        {connectionChannels.map((channel) => (
          <article key={channel.key}>
            <ChannelMark label={channel.label} />
            <h3>{channel.label}</h3>
            <p>{channel.purpose}</p>
            {isPodcastAnalyticsTarget(channel.key) ? (
              <TrackedLink href={channel.href} eventName="podcast_platform_click" eventProperties={{ target: channel.key, placement: "home-network" }}>Open {channel.label}</TrackedLink>
            ) : isSocialAnalyticsTarget(channel.key) ? (
              <TrackedLink href={channel.href} eventName="social_click" eventProperties={{ target: channel.key, placement: "home-network" }}>Open {channel.label}</TrackedLink>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

// components/server/home/final-invitation.tsx
import { TrackedLink } from "@/components/client/tracked-link";
import styles from "./home.module.css";

export function FinalInvitation() {
  return (
    <section className={"section " + styles.final} aria-labelledby="final-title">
      <p className={styles.eyebrow}>Sent</p>
      <h2 id="final-title">Take the next faithful step.</h2>
      <nav aria-label="Final invitations">
        <TrackedLink href="/teachings" eventName="cta_click" eventProperties={{ target: "teachings", placement: "home-final" }}>Begin with a teaching</TrackedLink>
        <TrackedLink href="/prayer" eventName="cta_click" eventProperties={{ target: "prayer", placement: "home-final" }}>Submit a prayer request</TrackedLink>
        <TrackedLink href="/connect#newsletter" eventName="cta_click" eventProperties={{ target: "newsletter", placement: "home-final" }}>Join the monthly letter</TrackedLink>
        <TrackedLink href="/give" eventName="cta_click" eventProperties={{ target: "give", placement: "home-final" }}>Give to support the mission</TrackedLink>
      </nav>
    </section>
  );
}
~~~

- [ ] **Step 4: Implement the decorative motion island with explicit reduced-motion and mobile paths**

~~~tsx
// components/client/gathering-line.tsx
"use client";

import { useLayoutEffect, useRef } from "react";
import { gatheringLineStages } from "@/lib/art/gathering-line";
import styles from "./gathering-line.module.css";

export function GatheringLine({ rootId }: { readonly rootId: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useLayoutEffect(() => {
    const root = document.getElementById(rootId);
    const svg = svgRef.current;
    if (!root || !svg || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let active = true;
    let cleanup = () => {};
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([gsapModule, scrollModule]) => {
        if (!active) return;
        const gsap = gsapModule.default;
        const ScrollTrigger = scrollModule.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);
        const media = gsap.matchMedia();
        const context = gsap.context(() => {
          const stages = ["mane", "connection", "waveform", "network"] as const;
          const stagePairs = stages.map((name) => ({
            name,
            art: svg.querySelector(`[data-stage="${name}"]`),
            section: root.querySelector(`[data-gathering-stage="${name}"]`),
          }));
          for (const pair of stagePairs) {
            if (!pair.art || !pair.section) throw new Error(`Gathering stage is incomplete: ${pair.name}`);
          }
          gsap.set(svg.querySelectorAll("[data-stage] path"), { strokeDasharray: 1, strokeDashoffset: 1 });

          media.add("(min-width: 64rem)", () => {
            for (const pair of stagePairs) {
              const paths = pair.art!.matches("path") ? [pair.art] : pair.art!.querySelectorAll("path");
              gsap.to(paths, {
                strokeDashoffset: 0,
                ease: "none",
                scrollTrigger: { trigger: pair.section!, start: "top 78%", end: "bottom 38%", scrub: 0.35 },
              });
            }
            const manifesto = root.querySelector<HTMLElement>("[data-manifesto]");
            if (manifesto) ScrollTrigger.create({ trigger: manifesto, start: "top top", end: "+=110%", pin: true, pinSpacing: true });
            gsap.utils.toArray<HTMLElement>("[data-reveal-mask]", root).forEach((item) => {
              gsap.fromTo(item, { clipPath: "inset(0 0 100% 0)", yPercent: 8, opacity: 0.35 }, {
                clipPath: "inset(0 0 0% 0)", yPercent: 0, opacity: 1,
                scrollTrigger: { trigger: item, start: "top 78%", end: "top 42%", scrub: true },
              });
            });
            const parallax = root.querySelector<HTMLElement>("[data-parallax]");
            if (parallax) gsap.to(parallax, { yPercent: -8, ease: "none", scrollTrigger: { trigger: parallax, start: "top bottom", end: "bottom top", scrub: 0.45 } });
          });

          media.add("(max-width: 63.99rem)", () => {
            for (const pair of stagePairs) {
              const paths = pair.art!.matches("path") ? [pair.art] : pair.art!.querySelectorAll("path");
              gsap.to(paths, { strokeDashoffset: 0, duration: 0.65, ease: "power1.out", scrollTrigger: { trigger: pair.section!, start: "top 82%", toggleActions: "play none none reverse" } });
              gsap.from(pair.section!, { y: 24, opacity: 0.72, duration: 0.55, ease: "power1.out", scrollTrigger: { trigger: pair.section!, start: "top 86%", toggleActions: "play none none reverse" } });
            }
          });
        }, root);
        cleanup = () => {
          media.revert();
          context.revert();
        };
      },
    );
    return () => {
      active = false;
      cleanup();
    };
  }, [rootId]);

  return (
    <svg ref={svgRef} className={styles.line} data-testid="gathering-line" aria-hidden="true" focusable="false" viewBox="0 0 240 1600" preserveAspectRatio="none">
      {gatheringLineStages.map((stage) => (
        <g data-stage={stage.name} key={stage.name}>
          {stage.paths.map((path) => <path d={path} key={path} pathLength="1" />)}
          {stage.circles.map(([cx, cy, radius]) => <circle cx={cx} cy={cy} key={`${cx}-${cy}`} r={radius} />)}
        </g>
      ))}
    </svg>
  );
}
~~~

~~~css
/* components/client/gathering-line.module.css */
.line {
  position: absolute;
  z-index: -1;
  inset: 0 50% auto auto;
  width: min(15rem, 26vw);
  height: 100%;
  translate: 50% 0;
  overflow: visible;
  pointer-events: none;
}

.line path {
  fill: none;
  stroke: color-mix(in srgb, var(--clay) 55%, transparent);
  stroke-linecap: round;
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}

.line circle {
  fill: var(--clay);
  stroke: var(--paper-raised);
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}

@media (prefers-reduced-motion: reduce) {
  .line path { stroke-dasharray: none !important; stroke-dashoffset: 0 !important; }
}
~~~

- [ ] **Step 5: Add the complete shared home layout and compose the route**

~~~css
/* components/server/home/home.module.css */
.journey {
  position: relative;
  min-height: 100%;
  isolation: isolate;
}

.hero,
.participation,
.topics,
.watchListen,
.network,
.final,
.manifesto,
.prayer,
.newsletter,
.store {
  width: min(calc(100% - 2rem), var(--measure-wide));
  margin-inline: auto;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(18rem, 0.7fr);
  gap: var(--space-6);
  min-height: calc(100svh - 4.5rem);
  align-items: center;
  padding-block: var(--space-7);
}

.heroCopy h1 {
  max-width: 15ch;
  font-family: var(--font-display);
  font-size: var(--step-4);
  font-weight: 400;
  letter-spacing: -0.04em;
  line-height: 0.88;
}

.heroCopy > p:not(.eyebrow) { max-width: 42rem; color: var(--ink-soft); }
.heroVisual { position: relative; display: grid; gap: var(--space-3); align-content: end; overflow: clip; border-radius: var(--radius-large); }
.heroVisual > img { width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: cover; object-position: 50% 36%; filter: saturate(0.72) contrast(1.06); }
.eyebrow { color: var(--clay-dark); font-size: var(--step--1); font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; }
.actions { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.participation > header, .topics > h2, .watchListen > header, .network > h2, .final > h2, .manifesto > h2 { max-width: 18ch; font-family: var(--font-display); font-size: var(--step-3); font-weight: 400; line-height: 0.98; }
.pathGrid { display: grid; grid-template-columns: repeat(3, 1fr); grid-auto-rows: minmax(13rem, auto); gap: var(--space-3); }
.path { position: relative; display: grid; align-content: end; padding: var(--space-4); border: 1px solid var(--line); border-radius: var(--radius-large); background: var(--paper-raised); }
.pathWide { grid-column: span 2; }
.pathTall { grid-row: span 2; background: var(--ink); color: var(--paper-raised); }
.path h3 { font-family: var(--font-display); font-size: var(--step-2); font-weight: 400; }
.path h3 a::after { position: absolute; inset: 0; content: ""; }
.topics > div { display: grid; grid-template-columns: repeat(2, 1fr); }
.topics > div a { display: grid; gap: 0.25rem; min-height: 8rem; align-content: center; padding: var(--space-4); border-block-start: 1px solid var(--line); text-decoration: none; }
.topics strong { font-family: var(--font-display); font-size: var(--step-1); font-weight: 400; }
.mediaGrid { display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-4); }
.mediaGrid h3, .network h3 { font-family: var(--font-display); font-size: var(--step-2); font-weight: 400; }
.podcastFeature { display: grid; align-content: end; padding: var(--space-5); border-radius: var(--radius-large); background: var(--ink); color: var(--paper-raised); }
.network > div { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3); }
.network article { padding: var(--space-4); border: 1px solid var(--line); border-radius: var(--radius-large); }
.final { text-align: center; }
.final h2 { margin-inline: auto; }
.final nav { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-3); }
.final nav a { padding: 0.75rem 1rem; border-bottom: 2px solid var(--clay); text-decoration: none; }
.manifesto { min-height: 100svh; text-align: center; }
.manifesto ol { display: grid; gap: 25vh; padding: 20vh 0; list-style: none; }
.manifesto li { max-width: 38rem; margin-inline: auto; }
.manifesto li h3 { font-family: var(--font-display); font-size: var(--step-3); font-weight: 400; }
.prayer, .newsletter, .store { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); align-items: start; }

@media (max-width: 64rem) {
  .hero, .mediaGrid, .prayer, .newsletter, .store { grid-template-columns: 1fr; }
  .hero { min-height: auto; }
  .network > div { grid-template-columns: repeat(2, 1fr); }
  .manifesto ol { gap: var(--space-7); padding: var(--space-6) 0; }
}

@media (prefers-reduced-motion: reduce) {
  .heroVisual { transform: none !important; }
  .manifesto li { clip-path: none !important; opacity: 1 !important; transform: none !important; }
}

@media (max-width: 42rem) {
  .pathGrid, .topics > div, .network > div { grid-template-columns: 1fr; }
  .pathWide { grid-column: auto; }
  .pathTall { grid-row: auto; }
}
~~~

~~~tsx
// app/page.tsx
import Link from "next/link";
import { GatheringLine } from "@/components/client/gathering-line";
import { NewsletterForm } from "@/components/client/forms/newsletter-form";
import { PrayerForm } from "@/components/client/forms/prayer-form";
import { ConnectionNetwork } from "@/components/server/home/connection-network";
import { FinalInvitation } from "@/components/server/home/final-invitation";
import { Hero } from "@/components/server/home/hero";
import { ParticipationPaths } from "@/components/server/home/participation-paths";
import { TopicFinder } from "@/components/server/home/topic-finder";
import { WatchListen } from "@/components/server/home/watch-listen";
import { JsonLd } from "@/components/server/json-ld";
import { destinationRegistry } from "@/content/destinations";
import { liveSchedule, recentReplay } from "@/content/live";
import { siteContent } from "@/content/site";
import { teachings } from "@/content/teachings";
import { topicDefinitions } from "@/content/topics";
import { activeReplayAt } from "@/lib/live/status";
import { getTeachingReviewBundle } from "@/lib/media/transcripts.server";
import { getPublishedPodcastEpisodes } from "@/lib/media/podcast-feed";
import { createPageMetadata } from "@/lib/seo/metadata";
import { organizationSchema, webPageSchema, websiteSchema } from "@/lib/seo/schema";
import styles from "@/components/server/home/home.module.css";

export const metadata = createPageMetadata({
  title: siteContent.homeTitle,
  description: siteContent.homeDescription,
  path: "/",
});

export default function HomePage() {
  const featuredBase = teachings.find((teaching) => teaching.featured) ?? teachings[0];
  if (!featuredBase) throw new Error("The homepage requires one validated teaching");
  const featured = getTeachingReviewBundle(featuredBase).teaching;
  if (!featured.captionsVerified || !featured.transcriptUrl) throw new Error("The homepage teaching requires hash-bound complete-listen-through evidence");
  const episodes = getPublishedPodcastEpisodes();
  const buildActiveReplay = activeReplayAt(recentReplay);
  return (
    <>
      <JsonLd id="home-identity" data={[organizationSchema(), websiteSchema(), webPageSchema({ path: "/", title: siteContent.homeTitle, description: siteContent.homeDescription })]} />
      <div id="home-journey" className={styles.journey}>
        <GatheringLine rootId="home-journey" />
      <Hero schedule={liveSchedule} replay={buildActiveReplay} />
      <ParticipationPaths />
      <section className={"section " + styles.manifesto} id="mission" aria-labelledby="manifesto-title" data-manifesto>
        <p className={styles.eyebrow}>Gathered around Jesus</p>
        <h2 id="manifesto-title">The life we practice together.</h2>
        <ol>
          <li data-reveal-mask><h3>Love is the beginning.</h3><p>We learn to look like Jesus by receiving and giving his love.</p></li>
          <li data-reveal-mask><h3>Relationship is the place.</h3><p>Formation happens among people who are willing to know and be known.</p></li>
          <li data-reveal-mask><h3>Discipleship is the way.</h3><p>We practice truth until it becomes a lived witness.</p></li>
          <li data-reveal-mask><h3>Education equips the work.</h3><p>Clear teaching helps the whole body grow toward unity.</p></li>
        </ol>
      </section>
      <TopicFinder topics={topicDefinitions} teachings={teachings} />
      <WatchListen featured={featured} latestEpisode={episodes[0]} />
      <section className={"section " + styles.prayer} id="prayer">
        <div><p className={styles.eyebrow}>Prayer</p><h2>You do not have to carry it alone.</h2><p>A restricted ministry prayer team receives your request. This form is not continuously monitored or an emergency service.</p><Link href="/prayer">Open the private prayer page</Link></div>
        <PrayerForm placement="home" />
      </section>
      <ConnectionNetwork channels={destinationRegistry} />
      <section className={"section " + styles.store} id="store">
        <div><p className={styles.eyebrow}>Wear the vision</p><h2>Carry a visible reminder of unity.</h2><p>Explore real Lion Company merchandise and the story behind it.</p></div>
        <Link href="/store">Visit the editorial store page</Link>
      </section>
      <section className={"section " + styles.newsletter} id="newsletter">
        <div><p className={styles.eyebrow}>Monthly field notes</p><h2>One thoughtful letter each month.</h2><p>Teaching, current live guidance, resources, podcast releases, and ministry updates. Confirmation is required.</p></div>
        <NewsletterForm placement="inline" />
      </section>
        <FinalInvitation />
      </div>
    </>
  );
}
~~~

- [ ] **Step 6: Run homepage tests, bundle checks, and commit**

Run: `npm test -- --run tests/integration/homepage.test.tsx tests/components/gathering-line.test.tsx && npm run typecheck && npm run build`

Expected: both tests pass and the deterministic production build succeeds. The verification plan later owns the compressed JavaScript/CSS budget command and release-blocking thresholds.

~~~bash
git add app/page.tsx components/server/home components/client/gathering-line.tsx components/client/gathering-line.module.css tests/integration/homepage.test.tsx tests/components/gathering-line.test.tsx
git commit -m "feat: compose Gathering homepage journey"
~~~

### Task 8: Enforce cross-tab prompt priority, frequency caps, and accessible activation dialogs

**Files:**
- Create: `lib/prompts/model.ts`
- Create: `lib/prompts/storage.ts`
- Create: `lib/prompts/channel.ts`
- Create: `components/client/dialog.tsx`
- Create: `components/client/dialog.module.css`
- Create: `components/client/prompt-invitations.tsx`
- Create: `components/client/prompt-invitations.module.css`
- Create: `components/client/prompt-controller.tsx`
- Modify: `components/client/experience-providers.tsx`
- Test: `tests/unit/prompt-model.test.ts`
- Test: `tests/components/dialog.test.tsx`
- Test: `tests/components/prompt-controller.test.tsx`

**Interfaces:**
- Consumes: `NewsletterForm({ placement: "prompt", onAccepted })`, `TrackedLink`, route pathname, `#store`, browser visibility/progress/activity, localStorage, storage events, BroadcastChannel, and Web Locks when available.
- Produces: `markNewsletterConfirmed(): void`, `markNewsletterRequestAccepted(): void`, `PromptController`, `Dialog`, and a versioned `PromptRecord`.

- [ ] **Step 1: Write failing pure-state, dialog, and unavailable-storage tests**

~~~ts
// tests/unit/prompt-model.test.ts
import { describe, expect, it } from "vitest";
import {
  beginVisit,
  canShowNewsletter,
  canShowStore,
  createPromptRecord,
  suppressPrompt,
} from "@/lib/prompts/model";

const hour = 60 * 60 * 1000;
describe("prompt model", () => {
  it("keeps tabs in one visit until 30 minutes of inactivity", () => {
    const first = beginVisit(createPromptRecord(0), 1_000, "visit-a");
    const same = beginVisit(first, 1_000 + 29 * 60_000, "visit-b");
    const next = beginVisit(same, same.lastActivityAt + 31 * 60_000, "visit-c");
    expect(same.visitId).toBe("visit-a");
    expect(same.visitCount).toBe(1);
    expect(next.visitId).toBe("visit-c");
    expect(next.visitCount).toBe(2);
  });

  it("gives newsletter automatic priority and respects exact suppressions", () => {
    const record = beginVisit(createPromptRecord(0), 1_000, "visit-a");
    expect(canShowNewsletter(record, 1_000, { visibleMs: 60_000, progress: 0, inactiveMs: 15_000 })).toBe(true);
    expect(canShowStore(record, 1_000, { sectionVisibleMs: 8_000, exitIntent: false, progress: 0.6 })).toBe(false);
    const dismissed = suppressPrompt(record, "newsletter", "dismissed", 1_000);
    expect(canShowNewsletter(dismissed, 1_000 + 29 * 24 * hour, { visibleMs: 60_000, progress: 0.55, inactiveMs: 15_000 })).toBe(false);
  });
});
~~~

~~~tsx
// tests/components/dialog.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Dialog } from "@/components/client/dialog";

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open story</button>
      <Dialog open={open} title="A product story" onClose={() => setOpen(false)}>
        <a href="/store">Continue</a>
      </Dialog>
    </>
  );
}

describe("Dialog", () => {
  it("traps through native modal behavior, closes on Escape, and restores trigger focus", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open story" });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "A product story" })).toBeVisible();
    expect(document.body).toHaveAttribute("data-scroll-lock", "true");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
~~~

~~~tsx
// tests/components/prompt-controller.test.tsx
import { render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnalyticsProvider } from "@/components/client/analytics-provider";
import { PromptController } from "@/components/client/prompt-controller";

describe("PromptController", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    Object.defineProperty(navigator, "locks", {
      value: { request: async (_name: string, _options: object, callback: (lock: object) => boolean) => callback({}) },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("never appears on initial load and becomes eligible after 60 visible seconds", async () => {
    render(<AnalyticsProvider enabled={false}><PromptController /></AnalyticsProvider>);
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(60_000);
      await Promise.resolve();
    });
    expect(screen.getByRole("complementary", { name: /monthly field notes/i })).toBeVisible();
  });

  it("fails closed when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    render(<AnalyticsProvider enabled={false}><PromptController /></AnalyticsProvider>);
    act(() => vi.advanceTimersByTime(61_000));
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });

  it("uses the storage lease fallback when Web Locks is unavailable", async () => {
    Object.defineProperty(navigator, "locks", { value: undefined, configurable: true });
    render(<AnalyticsProvider enabled={false}><PromptController /></AnalyticsProvider>);
    await act(async () => {
      vi.advanceTimersByTime(60_250);
      await Promise.resolve();
    });
    expect(screen.getByRole("complementary", { name: /monthly field notes/i })).toBeVisible();
  });
});
~~~

- [ ] **Step 2: Run tests and verify all prompt modules are missing**

Run: `npm test -- --run tests/unit/prompt-model.test.ts tests/components/dialog.test.tsx tests/components/prompt-controller.test.tsx`

Expected: FAIL with missing prompt-model, dialog, and controller modules.

- [ ] **Step 3: Implement the exact visit, suppression, storage, and cross-tab contracts**

~~~ts
// lib/prompts/model.ts
export const PROMPT_VERSION = 1;
export const VISIT_GAP_MS = 30 * 60 * 1000;
export const DISMISS_MS = 30 * 24 * 60 * 60 * 1000;
export const DOI_REQUEST_MS = 7 * 24 * 60 * 60 * 1000;

export type PromptKind = "newsletter" | "store";
export interface PromptRecord {
  readonly version: 1;
  readonly visitId: string;
  readonly visitCount: number;
  readonly lastActivityAt: number;
  readonly claim?: { readonly visitId: string; readonly kind: PromptKind; readonly token: string; readonly claimedAt: number };
  readonly newsletterDismissedUntil?: number;
  readonly newsletterRequestedUntil?: number;
  readonly newsletterConfirmed?: true;
  readonly storeDismissedUntil?: number;
}

export function createPromptRecord(now: number): PromptRecord {
  return { version: PROMPT_VERSION, visitId: "", visitCount: 0, lastActivityAt: now };
}

export function parsePromptRecord(raw: string | null, now: number): PromptRecord {
  if (!raw) return createPromptRecord(now);
  try {
    const value = JSON.parse(raw) as PromptRecord;
    return value.version === PROMPT_VERSION && Number.isFinite(value.lastActivityAt)
      ? value
      : createPromptRecord(now);
  } catch {
    return createPromptRecord(now);
  }
}

export function beginVisit(record: PromptRecord, now: number, newId: string): PromptRecord {
  const isNew = !record.visitId || now - record.lastActivityAt >= VISIT_GAP_MS;
  return {
    ...record,
    visitId: isNew ? newId : record.visitId,
    visitCount: isNew ? record.visitCount + 1 : record.visitCount,
    lastActivityAt: now,
    claim: isNew ? undefined : record.claim,
  };
}

export function newsletterSuppressed(record: PromptRecord, now: number) {
  return Boolean(
    record.newsletterConfirmed ||
    (record.newsletterDismissedUntil && record.newsletterDismissedUntil > now) ||
    (record.newsletterRequestedUntil && record.newsletterRequestedUntil > now),
  );
}

export function canShowNewsletter(
  record: PromptRecord,
  now: number,
  input: { readonly visibleMs: number; readonly progress: number; readonly inactiveMs: number },
) {
  return (
    !newsletterSuppressed(record, now) &&
    !record.claim &&
    input.inactiveMs >= 15_000 &&
    (input.visibleMs >= 60_000 || input.progress >= 0.55)
  );
}

export function canShowStore(
  record: PromptRecord,
  now: number,
  input: { readonly sectionVisibleMs: number; readonly exitIntent: boolean; readonly progress: number },
) {
  return (
    record.visitCount >= 2 &&
    newsletterSuppressed(record, now) &&
    (!record.storeDismissedUntil || record.storeDismissedUntil <= now) &&
    !record.claim &&
    (input.sectionVisibleMs >= 8_000 || (input.exitIntent && input.progress >= 0.6))
  );
}

export function suppressPrompt(
  record: PromptRecord,
  kind: PromptKind,
  reason: "dismissed" | "requested" | "confirmed",
  now: number,
): PromptRecord {
  if (kind === "store") return { ...record, storeDismissedUntil: now + DISMISS_MS };
  if (reason === "confirmed") return { ...record, newsletterConfirmed: true };
  if (reason === "requested") return { ...record, newsletterRequestedUntil: now + DOI_REQUEST_MS };
  return { ...record, newsletterDismissedUntil: now + DISMISS_MS };
}
~~~

~~~ts
// lib/prompts/storage.ts
import {
  beginVisit,
  parsePromptRecord,
  suppressPrompt,
  type PromptKind,
  type PromptRecord,
} from "./model";

export const PROMPT_STORAGE_KEY = "tlc:prompts:v1";
const PROMPT_CLAIM_LEASE_KEY = PROMPT_STORAGE_KEY + ":claim-lease";
const CLAIM_SETTLE_MS = 75;

export function readPromptRecord(now = Date.now()) {
  return parsePromptRecord(localStorage.getItem(PROMPT_STORAGE_KEY), now);
}

export function writePromptRecord(record: PromptRecord) {
  localStorage.setItem(PROMPT_STORAGE_KEY, JSON.stringify(record));
}

export function openVisit(now = Date.now()) {
  const record = beginVisit(readPromptRecord(now), now, crypto.randomUUID());
  writePromptRecord(record);
  return record;
}

function commitPromptClaim(kind: PromptKind, now: number, token: string) {
  const record = readPromptRecord(now);
  if (record.claim?.visitId === record.visitId) return false;
  writePromptRecord({ ...record, claim: { visitId: record.visitId, kind, token, claimedAt: now } });
  return readPromptRecord(now).claim?.token === token;
}

async function claimWithStorageLease(kind: PromptKind, now: number) {
  const token = crypto.randomUUID();
  const lease = JSON.stringify({ token, expiresAt: now + 2_000 });
  localStorage.setItem(PROMPT_CLAIM_LEASE_KEY, lease);
  await new Promise((resolve) => setTimeout(resolve, CLAIM_SETTLE_MS));
  const current = JSON.parse(localStorage.getItem(PROMPT_CLAIM_LEASE_KEY) ?? "null") as { token?: string; expiresAt?: number } | null;
  if (!current || current.token !== token || !current.expiresAt || current.expiresAt < Date.now()) return false;
  try {
    return commitPromptClaim(kind, Date.now(), token);
  } finally {
    const owner = JSON.parse(localStorage.getItem(PROMPT_CLAIM_LEASE_KEY) ?? "null") as { token?: string } | null;
    if (owner?.token === token) localStorage.removeItem(PROMPT_CLAIM_LEASE_KEY);
  }
}

export async function claimPrompt(kind: PromptKind, now = Date.now()) {
  const attempt = () => {
    const token = crypto.randomUUID();
    return commitPromptClaim(kind, now, token);
  };
  try {
    if (navigator.locks) {
      return navigator.locks.request(PROMPT_STORAGE_KEY + ":claim", { ifAvailable: true }, (lock) => lock ? attempt() : false);
    }
    return claimWithStorageLease(kind, now);
  } catch {
    return false;
  }
}

export function recordPromptActivity(now = Date.now()) {
  const record = readPromptRecord(now);
  writePromptRecord({ ...record, lastActivityAt: now });
}

function safelyUpdate(update: (record: PromptRecord) => PromptRecord) {
  try {
    writePromptRecord(update(readPromptRecord()));
    window.dispatchEvent(new StorageEvent("storage", { key: PROMPT_STORAGE_KEY }));
  } catch {
    return;
  }
}

export function dismissPrompt(kind: PromptKind) {
  safelyUpdate((record) => suppressPrompt(record, kind, "dismissed", Date.now()));
}

export function markNewsletterRequestAccepted() {
  safelyUpdate((record) => suppressPrompt(record, "newsletter", "requested", Date.now()));
}

export function markNewsletterConfirmed() {
  safelyUpdate((record) => suppressPrompt(record, "newsletter", "confirmed", Date.now()));
}
~~~

~~~ts
// lib/prompts/channel.ts
import { PROMPT_STORAGE_KEY } from "./storage";

export function subscribePromptChanges(onChange: () => void) {
  const channel = typeof BroadcastChannel === "undefined"
    ? null
    : new BroadcastChannel("tlc-prompts-v1");
  const storage = (event: StorageEvent) => {
    if (event.key === PROMPT_STORAGE_KEY) onChange();
  };
  channel?.addEventListener("message", onChange);
  window.addEventListener("storage", storage);
  return {
    announce() { channel?.postMessage({ type: "changed" }); },
    close() {
      channel?.removeEventListener("message", onChange);
      channel?.close();
      window.removeEventListener("storage", storage);
    },
  };
}
~~~

- [ ] **Step 4: Implement the native modal primitive and invitation surfaces**

~~~tsx
// components/client/dialog.tsx
"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import styles from "./dialog.module.css";

export function Dialog({
  open,
  title,
  titleId,
  onClose,
  children,
}: {
  readonly open: boolean;
  readonly title: string;
  readonly titleId?: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const generatedTitleId = useId();
  const labelId = titleId ?? generatedTitleId;
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      triggerRef.current = document.activeElement as HTMLElement;
      dialog.showModal();
      document.body.dataset.scrollLock = "true";
      dialog.querySelector<HTMLElement>("[data-dialog-close]")?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const close = () => {
      delete document.body.dataset.scrollLock;
      onClose();
      requestAnimationFrame(() => triggerRef.current?.focus());
    };
    const cancel = (event: Event) => {
      event.preventDefault();
      dialog.close();
    };
    dialog.addEventListener("close", close);
    dialog.addEventListener("cancel", cancel);
    return () => {
      delete document.body.dataset.scrollLock;
      dialog.removeEventListener("close", close);
      dialog.removeEventListener("cancel", cancel);
    };
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={labelId}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      <div className={styles.panel}>
        <button data-dialog-close className={styles.close} type="button" onClick={() => ref.current?.close()}>
          Close
        </button>
        <h2 id={labelId}>{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
~~~

~~~css
/* components/client/dialog.module.css */
.dialog {
  width: min(42rem, calc(100% - 1.25rem));
  max-height: calc(100dvh - 1.25rem);
  padding: 0;
  overflow: visible;
  border: 0;
  border-radius: var(--radius-large);
  background: transparent;
  color: var(--ink);
}

.dialog::backdrop { background: rgb(36 21 31 / 0.7); backdrop-filter: blur(5px); }
.panel { max-height: calc(100dvh - 1.25rem); padding: var(--space-5); overflow: auto; border-radius: var(--radius-large); background: var(--paper-raised); box-shadow: var(--shadow); }
.panel h2 { font-family: var(--font-display); font-size: var(--step-3); font-weight: 400; }
.close { display: block; min-width: 2.75rem; min-height: 2.75rem; margin-inline-start: auto; border: 1px solid var(--ink); border-radius: 999px; background: transparent; cursor: pointer; }

@media (max-width: 40rem) {
  .dialog { width: 100%; max-width: none; max-height: calc(100dvh - 1rem); margin: auto 0 0; border-radius: var(--radius-large) var(--radius-large) 0 0; }
  .panel { padding-bottom: max(var(--space-5), env(safe-area-inset-bottom)); border-radius: var(--radius-large) var(--radius-large) 0 0; }
}
~~~

~~~tsx
// components/client/prompt-invitations.tsx
"use client";

import { useEffect, useId, useState } from "react";
import { NewsletterForm } from "@/components/client/forms/newsletter-form";
import { useAnalytics } from "./analytics-provider";
import { Dialog } from "./dialog";
import { TrackedLink } from "./tracked-link";
import styles from "./prompt-invitations.module.css";

export function PromptInvitation({
  kind,
  onDismiss,
  onNewsletterAccepted,
  onComplete,
}: {
  readonly kind: "newsletter" | "store";
  readonly onDismiss: () => void;
  readonly onNewsletterAccepted: () => void;
  readonly onComplete: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newsletterAccepted, setNewsletterAccepted] = useState(false);
  const dialogTitleId = useId();
  const { track } = useAnalytics();
  const newsletter = kind === "newsletter";
  const title = newsletter ? "Monthly field notes" : "Wear the vision";
  useEffect(() => {
    if (!newsletter) track("store_prompt_view", { placement: "home-edge" });
  }, [newsletter, track]);
  return (
    <>
      <aside className={styles.invitation} aria-label={title}>
        <p>{newsletter ? "One thoughtful letter each month." : "Carry a visible reminder of unity."}</p>
        <div>
          <button type="button" onClick={() => setDialogOpen(true)}>Open</button>
          <button type="button" onClick={() => {
            onDismiss();
            if (!newsletter) track("store_prompt_dismiss", { placement: "home-edge" });
          }}>Dismiss</button>
        </div>
      </aside>
      <Dialog open={dialogOpen} title={title} titleId={dialogTitleId} onClose={() => {
        setDialogOpen(false);
        if (newsletterAccepted) {
          requestAnimationFrame(() => requestAnimationFrame(onComplete));
        }
      }}>
        {newsletter ? (
          <>
            <p>Teaching, live guidance, resources, podcasts, and ministry updates. Confirm by email to join.</p>
            <NewsletterForm placement="prompt" headingId={dialogTitleId} onAccepted={() => {
              setNewsletterAccepted(true);
              onNewsletterAccepted();
            }} />
          </>
        ) : (
          <>
            <p>Meet the story behind the collection, then continue to the complete Printify catalog.</p>
            <TrackedLink href="/store" eventName="store_click" eventProperties={{ placement: "prompt-dialog" }}>Explore the store story</TrackedLink>
          </>
        )}
      </Dialog>
    </>
  );
}
~~~

~~~css
/* components/client/prompt-invitations.module.css */
.invitation {
  position: fixed;
  z-index: 50;
  inset: auto 1rem 1rem auto;
  width: min(22rem, calc(100% - 2rem));
  padding: var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-large);
  background: var(--paper-raised);
  box-shadow: var(--shadow);
}
.invitation p { margin-block-end: var(--space-3); font-family: var(--font-display); font-size: var(--step-1); line-height: 1.1; }
.invitation div { display: flex; gap: var(--space-2); }
.invitation button { min-height: 2.75rem; padding: 0.6rem 0.85rem; border: 1px solid var(--ink); border-radius: 999px; background: transparent; cursor: pointer; }
@media (max-width: 40rem) {
  .invitation { inset: auto 0 0; width: 100%; padding-bottom: max(var(--space-4), env(safe-area-inset-bottom)); border-radius: var(--radius-large) var(--radius-large) 0 0; }
}
~~~

- [ ] **Step 5: Implement browser orchestration and mount it once**

~~~tsx
// components/client/prompt-controller.tsx
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { canShowNewsletter, canShowStore, type PromptKind, type PromptRecord } from "@/lib/prompts/model";
import { subscribePromptChanges } from "@/lib/prompts/channel";
import {
  claimPrompt,
  dismissPrompt,
  markNewsletterRequestAccepted,
  openVisit,
  recordPromptActivity,
  readPromptRecord,
} from "@/lib/prompts/storage";
import { PromptInvitation } from "./prompt-invitations";

const EXCLUDED = new Set(["/prayer", "/connect", "/store"]);

function interactionBlocksPrompt() {
  const active = document.activeElement as HTMLElement | null;
  const selection = window.getSelection()?.toString().trim();
  const mediaPlaying = [...document.querySelectorAll<HTMLMediaElement>("audio, video")].some(
    (media) => !media.paused && !media.ended,
  );
  return Boolean(
    document.body.dataset.scrollLock === "true" ||
    document.querySelector('[data-consent-active="true"], [role="alert"], [aria-expanded="true"], iframe[src*="youtube-nocookie.com"]') ||
    active?.closest("form") ||
    mediaPlaying ||
    selection
  );
}

export function PromptController() {
  const pathname = usePathname();
  const [record, setRecord] = useState<PromptRecord | null>(null);
  const [visibleMs, setVisibleMs] = useState(0);
  const [progress, setProgress] = useState(0);
  const [inactiveMs, setInactiveMs] = useState(0);
  const [sectionVisibleMs, setSectionVisibleMs] = useState(0);
  const [exitIntent, setExitIntent] = useState(false);
  const [shown, setShown] = useState<PromptKind | null>(null);
  const lastActivity = useRef(Date.now());
  const lastPersistedActivity = useRef(0);

  useEffect(() => {
    try {
      setRecord(openVisit());
      const subscription = subscribePromptChanges(() => setRecord(readPromptRecord()));
      return () => subscription.close();
    } catch {
      setRecord(null);
    }
  }, []);

  useEffect(() => {
    if (!record || EXCLUDED.has(pathname)) return;
    const activity = () => {
      const now = Date.now();
      lastActivity.current = now;
      setInactiveMs(0);
      if (now - lastPersistedActivity.current >= 5_000) {
        try {
          recordPromptActivity(now);
          lastPersistedActivity.current = now;
        } catch {
          setRecord(null);
        }
      }
    };
    const tick = () => {
      if (document.visibilityState === "visible") setVisibleMs((value) => value + 1_000);
      setInactiveMs(Date.now() - lastActivity.current);
    };
    const scroll = () => {
      activity();
      const denominator = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      setProgress(Math.min(1, scrollY / denominator));
    };
    const leave = (event: MouseEvent) => {
      if (event.clientY <= 0 && innerWidth >= 768) setExitIntent(true);
    };
    const timer = setInterval(tick, 1_000);
    document.addEventListener("pointerdown", activity, { passive: true });
    document.addEventListener("keydown", activity);
    document.addEventListener("touchstart", activity, { passive: true });
    document.addEventListener("focusin", activity);
    document.addEventListener("input", activity);
    document.addEventListener("selectionchange", activity);
    document.addEventListener("mouseleave", leave);
    window.addEventListener("scroll", scroll, { passive: true });
    scroll();
    return () => {
      clearInterval(timer);
      document.removeEventListener("pointerdown", activity);
      document.removeEventListener("keydown", activity);
      document.removeEventListener("touchstart", activity);
      document.removeEventListener("focusin", activity);
      document.removeEventListener("input", activity);
      document.removeEventListener("selectionchange", activity);
      document.removeEventListener("mouseleave", leave);
      window.removeEventListener("scroll", scroll);
    };
  }, [pathname, record]);

  useEffect(() => {
    const store = document.getElementById("store");
    if (!store) return;
    let visibleSince = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        if (!visibleSince) visibleSince = Date.now();
      } else {
        visibleSince = 0;
        setSectionVisibleMs(0);
      }
    }, { threshold: [0.5] });
    observer.observe(store);
    const timer = setInterval(() => {
      if (visibleSince) setSectionVisibleMs(Date.now() - visibleSince);
    }, 1_000);
    return () => { clearInterval(timer); observer.disconnect(); };
  }, [pathname]);

  useEffect(() => {
    if (!record || shown || EXCLUDED.has(pathname) || interactionBlocksPrompt()) return;
    const now = Date.now();
    const desired = canShowNewsletter(record, now, { visibleMs, progress, inactiveMs })
      ? "newsletter"
      : canShowStore(record, now, { sectionVisibleMs, exitIntent, progress })
        ? "store"
        : null;
    if (!desired) return;
    void claimPrompt(desired, now).then((claimed) => {
      if (claimed) {
        setRecord(readPromptRecord());
        setShown(desired);
      }
    }).catch(() => setShown(null));
  }, [exitIntent, inactiveMs, pathname, progress, record, sectionVisibleMs, shown, visibleMs]);

  if (!shown) return null;
  return (
    <PromptInvitation
      kind={shown}
      onDismiss={() => { dismissPrompt(shown); setShown(null); }}
      onNewsletterAccepted={() => {
        markNewsletterRequestAccepted();
        setRecord(readPromptRecord());
      }}
      onComplete={() => setShown(null)}
    />
  );
}
~~~

~~~tsx
// components/client/experience-providers.tsx
"use client";

import type { ReactNode } from "react";
import { AnalyticsProvider } from "./analytics-provider";
import { ConsentControls } from "./consent-controls";
import { PromptController } from "./prompt-controller";
import { WebVitalsReporter } from "./web-vitals-reporter";

export function ExperienceProviders({
  children,
  analyticsEnabled,
}: {
  readonly children: ReactNode;
  readonly analyticsEnabled: boolean;
}) {
  return (
    <AnalyticsProvider enabled={analyticsEnabled}>
      <WebVitalsReporter />
      {children}
      <PromptController />
      <ConsentControls />
    </AnalyticsProvider>
  );
}
~~~

- [ ] **Step 6: Run prompt tests, two-context browser test, and commit**

Run: `npm test -- --run tests/unit/prompt-model.test.ts tests/components/dialog.test.tsx tests/components/prompt-controller.test.tsx && npm run test:e2e -- --project=chromium --grep "cross-tab prompt claim"`

Expected: unit/component tests pass; the two-context test observes exactly one complementary invitation across both pages; storage-unavailable test observes none.

~~~bash
git add lib/prompts components/client/dialog.tsx components/client/dialog.module.css components/client/prompt-controller.tsx components/client/prompt-invitations.tsx components/client/prompt-invitations.module.css components/client/experience-providers.tsx tests/unit/prompt-model.test.ts tests/components/dialog.test.tsx tests/components/prompt-controller.test.tsx
git commit -m "feat: coordinate accessible prompts across tabs"
~~~

### Task 9: Complete connect, store, and giving journeys and prove the experience gates

**Files:**
- Modify: `app/connect/page.tsx`
- Modify: `app/store/page.tsx`
- Modify: `app/give/page.tsx`
- Create: `app/participation.module.css`
- Create: `public/images/merch/apparel-collage.jpg`
- Modify: `docs/asset-ledger.csv`
- Create: `tests/e2e/experience.spec.ts`

**Interfaces:**
- Consumes: `NewsletterForm({ placement: "connect" })`, `ContactForm`, `getDestination`, `TrackedLink`, and the archived production apparel image created by foundation Task 5.
- Produces: three crawlable first-party participation pages and the complete browser acceptance suite.

- [ ] **Step 1: Write the failing browser acceptance suite**

~~~ts
// tests/e2e/experience.spec.ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { getDestination } from "@/lib/content";

async function expectNoBlockingAxeFindings(page: Page) {
  const result = await new AxeBuilder({ page }).analyze();
  const blocking = result.violations.filter((violation) =>
    violation.impact === "critical" || violation.impact === "serious" || violation.impact === "moderate",
  );
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
}

test.describe("Gathering experience", () => {
  for (const path of ["/", "/teachings", "/podcast", "/connect", "/store", "/give"]) {
    test(path + " has one h1, no blocking Axe findings, and no horizontal overflow", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
      await expectNoBlockingAxeFindings(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }

  test("mobile navigation closes with Escape and restores focus", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Open menu" });
    await trigger.click();
    await expect(page.getByRole("navigation", { name: "Mobile" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  });

  test("YouTube makes no third-party request before intent", async ({ page }) => {
    const youtubeRequests: string[] = [];
    page.on("request", (request) => {
      if (/youtube|ytimg/.test(request.url())) youtubeRequests.push(request.url());
    });
    await page.goto("/teachings/when-gods-will-doesnt-go-your-way");
    expect(youtubeRequests).toEqual([]);
    const play = page.getByRole("button", { name: /^Play / });
    await expect(play).toBeVisible();
    await play.click();
    await expect(page.locator('iframe[src*="youtube-nocookie.com"]')).toBeVisible();
  });

  test("denied consent produces no GA script, request, or cookie", async ({ page }) => {
    const analyticsRequests: string[] = [];
    page.on("request", (request) => {
      if (/google-analytics|googletagmanager/.test(request.url())) analyticsRequests.push(request.url());
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Decline analytics" }).click();
    await page.getByRole("link", { name: /support the mission/i }).first().click();
    expect(analyticsRequests).toEqual([]);
    expect((await page.context().cookies()).filter((cookie) => cookie.name.startsWith("_ga"))).toEqual([]);
  });

  test("giving is obvious, calm, and reaches the verified Subsplash handoff", async ({ page }) => {
    const giving = getDestination("subsplash");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("banner").getByRole("link", { name: "Give", exact: true })).toHaveAttribute("href", "/give");
    await page.getByRole("banner").getByRole("link", { name: "Give", exact: true }).click();
    const handoff = page.getByRole("link", { name: /give securely through subsplash/i });
    await expect(handoff).toBeVisible();
    await expect(handoff).toHaveAttribute("href", giving.href);
    const desktopBox = await handoff.boundingBox();
    expect(desktopBox && desktopBox.y + desktopBox.height <= 900).toBe(true);
    await expect(page.getByText(/sustained by voluntary givers/i)).toBeVisible();
    await expect(page.locator("main")).not.toContainText(/urgent|before it’s too late|act now|fundraising deadline/i);

    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("link", { name: /give to the lion company/i })).toHaveAttribute("href", "/give");
  });

  test("every completed page shell keeps giving one obvious step away", async ({ page }) => {
    for (const path of ["/", "/start-here", "/live", "/teachings", "/podcast", "/prayer", "/connect", "/store", "/give", "/privacy", "/terms", "/accessibility"]) {
      await page.goto(path);
      await expect(page.getByRole("banner").locator('a[href="/give"]')).toHaveCount(1);
      await expect(page.getByRole("contentinfo").locator('a[href="/give"]')).toHaveCount(1);
    }
  });

  test("cross-tab prompt claim allows exactly one invitation", async ({ context }) => {
    await context.addInitScript(() => Object.defineProperty(navigator, "locks", { value: undefined, configurable: true }));
    const first = await context.newPage();
    const second = await context.newPage();
    await Promise.all([first.clock.install(), second.clock.install()]);
    await Promise.all([first.goto("/"), second.goto("/")]);
    await Promise.all([
      first.evaluate(() => scrollTo(0, document.documentElement.scrollHeight * 0.7)),
      second.evaluate(() => scrollTo(0, document.documentElement.scrollHeight * 0.7)),
    ]);
    await Promise.all([first.clock.fastForward(16_000), second.clock.fastForward(16_000)]);
    await expect.poll(async () =>
      (await first.getByRole("complementary").count()) +
      (await second.getByRole("complementary").count()),
    ).toBe(1);
  });

  test("reduced motion keeps the hierarchy and removes scrubbed line state", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Love is the beginning." })).toBeVisible();
    await expect(page.locator('[data-testid="gathering-line"] path')).not.toHaveCSS("stroke-dashoffset", "1px");
  });
});

test.describe("JavaScript disabled", () => {
  test.use({ javaScriptEnabled: false });
  test("core content and direct actions remain available", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /join today’s live/i })).toBeVisible();
    await expect(page.getByText("Live daily on TikTok")).toBeVisible();
    await expect(page.getByRole("link", { name: /support the mission/i }).first()).toBeVisible();
    await expect(page.locator("iframe")).toHaveCount(0);
  });

  test("the giving path remains a normal two-step handoff", async ({ page }) => {
    const giving = getDestination("subsplash");
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/");
    await expect(page.locator('a[href="/give"]').first()).toBeAttached();
    await page.goto("/give");
    const handoff = page.getByRole("link", { name: /give securely through subsplash/i });
    await expect(handoff).toHaveAttribute("href", giving.href);
    const mobileBox = await handoff.boundingBox();
    expect(mobileBox && mobileBox.y + mobileBox.height <= 800).toBe(true);
  });
});
~~~

- [ ] **Step 2: Run the new suite and record the missing participation routes**

Run: `npm run test:e2e -- --project=chromium tests/e2e/experience.spec.ts`

Expected: FAIL on incomplete `/connect`, `/store`, and `/give` route assertions while existing shell checks continue to run.

- [ ] **Step 3: Restore the authorized production apparel image under the asset boundary**

Run:

~~~bash
mkdir -p public/images/merch
cp /Users/jonathangibson/Documents/TheLionCompany-audit-artifacts/legacy-production-492ee8d41d/apparel_bg.jpg public/images/merch/apparel-collage.jpg
sips -g pixelWidth -g pixelHeight public/images/merch/apparel-collage.jpg
~~~

Expected: the copied image reports exactly 1024 by 559 pixels.

Append this exact row to `docs/asset-ledger.csv`:

~~~csv
public/images/merch/apparel-collage.jpg,production commit 492ee8d41d apparel_bg.jpg,The Lion Company,existing production use plus site-owner approval of the July 11 2026 rebuild objective,website store handoff,1024,559,renamed only,official apparel presentation with descriptive alternative text,Codex provenance review,2026-07-11
~~~

Run: `npm run check:assets`

Expected: the exhaustive ledger validates the shared Gathering line path-data asset, lion portrait, all teaching posters, and apparel image with complete provenance fields; any unlisted shipped artwork or font fails.

- [ ] **Step 4: Implement the three complete first-party journeys**

~~~tsx
// app/connect/page.tsx
import { ContactForm } from "@/components/client/forms/contact-form";
import { NewsletterForm } from "@/components/client/forms/newsletter-form";
import { TrackedLink } from "@/components/client/tracked-link";
import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { destinationRegistry } from "@/content/destinations";
import { isPodcastAnalyticsTarget, isSocialAnalyticsTarget } from "@/lib/analytics/contracts";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import styles from "../participation.module.css";

const description = "Join the monthly letter, contact The Lion Company, or connect through an active ministry channel.";

export const metadata = createPageMetadata({
  title: "Connect",
  description,
  path: "/connect",
});

export default function ConnectPage() {
  return (
    <>
      <JsonLd id="connect-schema" data={[webPageSchema({ path: "/connect", title: "Connect", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Connect", path: "/connect" }])]} />
      <PageIntro eyebrow="Connect" title="Choose the kind of connection you need." description="Monthly formation, a direct inquiry, or a channel for the rhythm of your day." />
      <section className={styles.split} id="newsletter" aria-labelledby="connect-newsletter">
        <div><p>Monthly field notes</p><h2 id="connect-newsletter">One thoughtful letter, not a crowded inbox.</h2><p>Receive one monthly teaching, current live guidance, new resources and podcast releases, ministry updates, and occasional store or support news. Confirm by email to join.</p></div>
        <NewsletterForm placement="connect" />
      </section>
      <section className={styles.split} aria-labelledby="contact-title">
        <div><p>Direct contact</p><h2 id="contact-title">Start a clear conversation.</h2><p>Use this form for speaking, partnership, media, testimony, or a general message. A testimony submission does not grant publication permission.</p></div>
        <ContactForm />
      </section>
      <section className={styles.channels} aria-labelledby="connect-channels">
        <h2 id="connect-channels">Meet us in the right place.</h2>
        <div>
          {destinationRegistry.filter((item) => item.visible && !["printify", "subsplash", "podcastRss"].includes(item.key)).map((channel) => (
            <article key={channel.key}>
              <h3>{channel.label}</h3><p>{channel.purpose}</p>
              {isPodcastAnalyticsTarget(channel.key) ? (
                <TrackedLink href={channel.href} eventName="podcast_platform_click" eventProperties={{ target: channel.key, placement: "connect" }}>Open {channel.label}</TrackedLink>
              ) : isSocialAnalyticsTarget(channel.key) ? (
                <TrackedLink href={channel.href} eventName="social_click" eventProperties={{ target: channel.key, placement: "connect" }}>Open {channel.label}</TrackedLink>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

// app/store/page.tsx
import Image from "next/image";
import { TrackedLink } from "@/components/client/tracked-link";
import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { getDestination } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import styles from "../participation.module.css";

const description = "Wear The Lion Company vision and continue to the verified Printify catalog.";

export const metadata = createPageMetadata({
  title: "Store",
  description,
  path: "/store",
});

export default function StorePage() {
  const store = getDestination("printify");
  return (
    <>
      <JsonLd id="store-schema" data={[webPageSchema({ path: "/store", title: "Store", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Store", path: "/store" }])]} />
      <PageIntro eyebrow="Wear the vision" title="A visible reminder of unity." description="Merchandise rooted in the ministry’s lion identity and the call to look like Jesus together." />
      <section className={styles.storeStory} aria-labelledby="store-story">
        <Image src="/images/merch/apparel-collage.jpg" alt="A selection of The Lion Company apparel from the official collection" width={1024} height={559} sizes="(max-width: 768px) 100vw, 55vw" priority />
        <div><p>Official collection</p><h2 id="store-story">Carry the conversation into ordinary places.</h2><p>Purchases support the ministry’s work without making a claim about a fixed allocation. Printify operates the catalog, checkout, fulfillment, and customer service journey.</p>
          <TrackedLink href={store.href} eventName="store_click" eventProperties={{ placement: "store-page" }}>Open the complete Printify catalog</TrackedLink>
        </div>
      </section>
    </>
  );
}

// app/give/page.tsx
import { TrackedLink } from "@/components/client/tracked-link";
import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { getDestination } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import styles from "../participation.module.css";

const description = "Give to sustain The Lion Company's teaching, prayer, discipleship, and Christian-unity work through its verified Subsplash destination.";

export const metadata = createPageMetadata({
  title: "Give",
  description,
  path: "/give",
});

export default function GivePage() {
  const giving = getDestination("subsplash");
  return (
    <>
      <JsonLd id="give-schema" data={[webPageSchema({ path: "/give", title: "Give", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Give", path: "/give" }])]} />
      <PageIntro eyebrow="Give" title="Help carry the work forward." description="The Lion Company’s ministry work is sustained by voluntary givers who choose to support teaching, prayer, discipleship, and Christian unity.">
        <TrackedLink className={styles.givePrimary} href={giving.href} eventName="give_click" eventProperties={{ target: "subsplash", placement: "give-page-primary" }}>Give securely through Subsplash</TrackedLink>
      </PageIntro>
      <section className={styles.give} aria-labelledby="give-title">
        <div><p>Why giving matters</p><h2 id="give-title">A simple way to sustain the ministry.</h2><p>Voluntary gifts are the ministry’s operating support. Subsplash securely handles the gift, receipt, and payment details; The Lion Company website never receives your card or bank information.</p></div>
        <p>Give when and as you choose. Teaching, prayer, and every other ministry path remain available without pressure.</p>
      </section>
    </>
  );
}
~~~

~~~css
/* app/participation.module.css */
.split,
.storeStory,
.give,
.channels {
  width: min(calc(100% - 2rem), var(--measure));
  padding-block: var(--space-7);
  margin-inline: auto;
  border-block-start: 1px solid var(--line);
}

.split,
.storeStory,
.give {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(20rem, 1fr);
  gap: var(--space-6);
  align-items: start;
}

.split h2,
.storeStory h2,
.give h2,
.channels h2 {
  font-family: var(--font-display);
  font-size: var(--step-3);
  font-weight: 400;
  line-height: 1;
}

.split > div > p:first-child,
.storeStory > div > p:first-child,
.give > div > p:first-child {
  color: var(--clay-dark);
  font-size: var(--step--1);
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.storeStory img {
  width: 100%;
  height: auto;
  border-radius: var(--radius-large);
}

.storeStory a,
.give a,
.givePrimary {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: 999px;
  background: var(--ink);
  color: var(--paper-raised);
  font-weight: 800;
  text-decoration: none;
}

.channels > div {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.channels article {
  padding: var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-large);
}

.channels article h3 {
  font-family: var(--font-display);
  font-size: var(--step-2);
  font-weight: 400;
}

@media (max-width: 52rem) {
  .split,
  .storeStory,
  .give {
    grid-template-columns: 1fr;
  }
  .channels > div { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 34rem) {
  .channels > div { grid-template-columns: 1fr; }
}
~~~

- [ ] **Step 5: Run all browser projects, static gates, and the production build**

Run: `npm run test:e2e -- tests/e2e/experience.spec.ts`

Expected: the current Chromium, Firefox, and WebKit projects pass and Axe reports no critical, serious, or unreviewed moderate violations. The verification/release plan expands the same suite across 360×800, 768×1024, and 1440×900 projects.

Run: `npm test -- --run && npm run typecheck && npm run lint && npm run build`

Expected: all tests and static checks pass and the production build succeeds. The verification/release plan then enforces bundle and Lighthouse budgets against this exact build.

- [ ] **Step 6: Run the manual experience matrix before accepting the task**

Run the built preview at 320 CSS pixels and 400% zoom, keyboard-only, VoiceOver macOS/iOS, NVDA Windows, forced colors, increased text spacing, reduced motion, Slow 4G, offline/reconnect, and JavaScript disabled. Verify every active TikTok, YouTube, podcast, Instagram, Facebook, Threads/X, Printify, and Subsplash destination; verify Back behavior, preserved homepage fragments, prompt suppression after reload, the two-tab claim, consent withdrawal, and the absence of prayer/contact/newsletter values in URLs, browser storage, console output, and GA payloads.

Expected: every path remains understandable and operable; no horizontal page scroll, keyboard trap, focus loss, false live state, automatic media load, third-party request before intent, or duplicate prompt occurs.

- [ ] **Step 7: Commit the participation journeys and acceptance suite**

~~~bash
git add app/connect/page.tsx app/store/page.tsx app/give/page.tsx app/participation.module.css public/images/merch/apparel-collage.jpg docs/asset-ledger.csv tests/e2e/experience.spec.ts
git commit -m "feat: complete participation journeys"
~~~

## Completion Gate

Do not merge this plan’s branch until every task commit exists in order, the foundation and forms plans are fully integrated, the exact test commands above pass against a production build, the rights-cleared store composite exists in the asset ledger, and a reviewer has inspected the no-JavaScript, reduced-motion, consent-denied, two-tab prompt, transcript-ineligible, 320-pixel, and 400%-zoom paths. A green component suite alone is not evidence for those browser-level requirements.
