# The Gathering Foundation, Content, and SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy static site with a typed, static-first Next.js foundation that preserves authority, centralizes verified ministry content, publishes crawlable core routes, and establishes the redirect and technical-SEO contracts for The Gathering experience.

**Architecture:** A root-level Next.js App Router project prerenders public Server Component pages and keeps canonical content in validated TypeScript registries. Pure selectors feed routes, metadata, JSON-LD, redirects, and tests from the same sources. Podcast pages read only a checked-in snapshot refreshed by an explicit maintainer command; teaching cards/facades read only ledgered first-party posters; unverified live state remains an honest evergreen fallback. This plan intentionally creates semantic visual shells that the experience plan will refine, and it leaves forms, legal/outcome pages, analytics, security headers, and client interaction islands to their separately owned plans.

**Tech Stack:** Node.js 22.x, npm, Next.js 16.2.10 App Router, React/React DOM 19.2.7, TypeScript 5.9.3, tsx 4.23.0, Zod 4.4.3, fast-xml-parser 5.10.0, GSAP 3.15.0, CSS Modules/global CSS, Vitest 4.1.10, Playwright 1.61.1, ESLint 10.7.0.

## Global Constraints

- Work on `codex/the-gathering-rebuild`; `main` remains the production branch and production stays in the existing Vercel project.
- Use Node.js `>=22 <23`, Next.js `16.2.10`, React and React DOM `19.2.7`, TypeScript `5.9.3`, GSAP `3.15.0`, Vitest `4.1.10`, Playwright `1.61.1`, ESLint `10.7.0`, and `eslint-config-next` `16.2.10` exactly.
- Use npm and commit `package-lock.json`; use root-level `app/`, `components/`, `content/`, `config/`, `lib/`, `styles/`, and `tests/` directories, with no `src/` directory.
- Production builds run `next build --webpack`; `next.config.ts` must set `experimental.sri.algorithm` to `sha256`; never set `output: "export"` because POST route handlers must run on Vercel.
- Public pages are prerendered static HTML; Server Components are the default, and only named interaction islands become Client Components in downstream plans.
- Use CSS Modules and global CSS only; do not introduce Tailwind or another component styling framework.
- Canonical URLs are lowercase, extensionless, slashless paths on `https://www.thelioncompany.org`; the home title remains `The Lion Company — Unity Through Christ`.
- Preserve GA4 measurement ID `G-MNK2G065ES`, but analytics code and consent behavior belong to the analytics/interaction plan, not this plan.
- Preserve `#mission`, `#podcast`, `#media`, `#prayer`, `#store`, `#contact`, and `#newsletter` as meaningful homepage targets.
- Core content and schedule configuration live in typed Git-backed files; social destinations exist in one registry with `verifiedAt`, required/optional status, and visibility.
- Never author a free-form live boolean, countdown, time, follower count, ranking claim, fabricated date, fabricated location, or unsupported structured-data field.
- With no validated TikTok schedule record, render `Live daily on TikTok` and `See today's live on TikTok`; a valid past record resolves to this evergreen fallback.
- Podcast episodes ship only from a validated checked-in snapshot. `https://feed.podbean.com/thelioncompany/feed.xml` is read by an explicit local refresh command that must produce a reviewed diff, commit, and redeploy; builds and production requests never fetch it.
- A teaching player is eligible only when captions and a transcript or complete text-equivalent path are verified; a podcast player is eligible only when a complete transcript exists.
- Every indexable route has a unique title and description, one `www` canonical, one H1, server-rendered meaningful text, real anchors, absolute social metadata, and supported JSON-LD only.
- `/robots.txt` returns 200 and references `/sitemap.xml`; the sitemap contains only canonical, indexable, implemented 200 routes; unknown routes return a genuine branded 404.
- Preview deployments are `noindex`; deployment protection is configured in Vercel and verified by the release plan.
- Before any asset ships, `docs/asset-ledger.csv` records final filename, source, owner, rights evidence, allowed use, dimensions, transformations, alt-text decision, reviewer, and date; uncertain-rights assets do not ship.
- Use warm parchment, deep aubergine-charcoal, one restrained clay accent, warm stone neutrals, Instrument Serif, and Manrope; do not recreate the legacy black-and-gold visual system.
- Target WCAG 2.2 AA, a 2px-or-stronger visible focus treatment, 24x24 minimum targets with 44x44 as the design target, 4.5:1 normal-text contrast, and no horizontal scrolling at 320 CSS pixels or 400% zoom.
- Initial compressed JavaScript must remain at or below 180 KB and initial CSS at or below 60 KB; no third-party script or media request may block first content.
- Do not change Wix DNS in this implementation. Apex/HTTP canonicalization is configured through the existing Vercel domain settings and verified as a one-hop 308 in the release plan.
- This plan does not own `.env.example`, `lib/env.ts`, `lib/forms/**`, `components/client/forms/**`, `app/api/forms/**`, `/prayer`, `/connect`, `/privacy`, `/terms`, `/accessibility`, or `/newsletter/*`; the forms/privacy plan owns the form, prayer, legal, and outcome files, the experience plan owns the `/connect` page shell, and forms Task 7 registers every implemented route in the sitemap source.
- This plan creates minimal semantic `site-header`, `site-footer`, and `page-intro` shells; the experience plan modifies those exact files and owns `components/client/mobile-navigation.tsx`, motion, media facades, final page art direction, and client filtering.

---

## File Map

| Path | Responsibility |
|---|---|
| `package.json`, `package-lock.json` | Exact runtime, dependency, and command contract |
| `tsconfig.json`, `next-env.d.ts`, `eslint.config.mjs`, `vitest.config.ts`, `playwright.config.ts` | Type, lint, unit, and browser-test foundations |
| `next.config.ts` | Webpack build, SRI, image policy, and ledger-generated redirects; later plans append headers to the same `nextConfig` object |
| `styles/tokens.css`, `app/globals.css` | Gathering design tokens, reset, accessibility defaults, and semantic shell styles |
| `lib/art/gathering-line.ts`, `public/images/brand/lion-portrait.jpg`, `public/images/teachings/**`, `docs/asset-ledger.csv`, `scripts/check-asset-ledger.mjs` | Original motif path data, one verified production lion image, first-party teaching stills, and an exhaustive provenance ledger |
| `lib/content/types.ts`, `lib/content/schemas.ts`, `lib/content/index.ts` | Shared public interfaces, runtime validation, selectors, and eligibility rules |
| `content/site.ts`, `content/destinations.ts`, `content/live.ts`, `content/topics.ts` | Typed site copy, verified destinations, honest live configuration, and topic taxonomy |
| `content/teachings.ts`, `content/transcripts/**`, `lib/media/transcripts.server.ts` | Curated 32-item teaching manifest and complete reviewed first-party transcript evidence for the eligible facade |
| `content/podcast-fallback.ts`, `lib/media/podcast-feed.ts`, `scripts/refresh-podcast-snapshot.ts` | Seven-episode checked-in public snapshot, pure parser, and explicit maintainer-only refresh adapter |
| `scripts/refresh-teaching-posters.ts`, `docs/content-evidence.md` | Exact local-poster parity and dated claim/caption/transcript/leadership/legal-status evidence, with legal status omitted until authoritatively verified |
| `config/redirects.ts`, `lib/redirects.ts`, `app/[...path]/route.ts` | Inspectable redirect/410 ledger, Next adapter, branded gone responses, and unknown-route fallthrough |
| `docs/release/canonical-host.md` | Exact Vercel one-hop canonical-host configuration and verification record |
| `lib/seo/metadata.ts`, `lib/seo/schema.ts`, `components/server/json-ld.tsx` | Canonical metadata and supported structured-data builders |
| `components/server/site-header.tsx`, `site-footer.tsx`, `page-intro.tsx` | Minimal semantic chrome consumed and visually completed by the experience plan |
| `app/layout.tsx`, `app/page.tsx`, `app/start-here/page.tsx`, `app/live/page.tsx`, `app/store/page.tsx`, `app/give/page.tsx` | Prerendered core route shells and preserved homepage anchors |
| `components/server/teaching-card.tsx`, `app/teachings/**` | Crawlable teaching archive and static detail routes |
| `components/server/podcast-card.tsx`, `app/podcast/**` | Fully static checked-snapshot podcast archive and episode routes without unverified players |
| `config/routes.ts`, `app/robots.ts`, `app/sitemap.ts`, `app/manifest.ts`, `app/not-found.tsx`, `app/opengraph-image.tsx`, `app/apple-icon.tsx`, `app/icon.tsx` | Crawl policy, implemented-route registry, manifest, branded social/icon resources, and real 404 UI |
| `tests/unit/**`, `tests/fixtures/podbean-feed.xml` | Project, content, media, redirect, metadata, schema, route, asset, and technical-SEO contracts |

### Task 1: Scaffold the exact Next.js toolchain

**Files:**
- Create: `package.json`
- Create: `package-lock.json` via npm
- Create: `.gitignore`
- Create: `tsconfig.json`
- Create: `next-env.d.ts`
- Create: `next.config.ts`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `playwright.config.ts`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `tests/unit/project-contract.test.ts`

**Interfaces:**
- Consumes: clean legacy repository at production commit ancestry `492ee8d41d` on `codex/the-gathering-rebuild`.
- Produces: npm scripts `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:unit`, `test:e2e`, and `test:e2e:install`; default-exported `nextConfig: NextConfig` that later plans modify without replacing its export shape.

- [ ] **Step 1: Create the package and test harness contract**

```json
{
  "name": "the-lion-company",
  "version": "2.0.0",
  "private": true,
  "engines": {
    "node": ">=22 <23"
  },
  "scripts": {
    "dev": "next dev --webpack",
    "build": "next build --webpack",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:unit": "vitest run tests/unit",
    "test:e2e": "playwright test",
    "test:e2e:install": "playwright install --with-deps",
    "check:assets": "node scripts/check-asset-ledger.mjs",
    "refresh:podcast": "tsx scripts/refresh-podcast-snapshot.ts",
    "refresh:teaching-posters": "tsx scripts/refresh-teaching-posters.ts",
    "check": "npm run lint && npm run typecheck && npm run test && npm run build"
  },
  "dependencies": {
    "fast-xml-parser": "5.10.0",
    "gsap": "3.15.0",
    "next": "16.2.10",
    "react": "19.2.7",
    "react-dom": "19.2.7",
    "zod": "4.4.3"
  },
  "devDependencies": {
    "@axe-core/playwright": "4.12.1",
    "@playwright/test": "1.61.1",
    "@testing-library/jest-dom": "6.9.1",
    "@testing-library/react": "16.3.2",
    "@testing-library/user-event": "14.6.1",
    "@types/node": "22.20.1",
    "@types/react": "19.2.17",
    "@types/react-dom": "19.2.3",
    "eslint": "10.7.0",
    "eslint-config-next": "16.2.10",
    "jsdom": "29.1.1",
    "typescript": "5.9.3",
    "tsx": "4.23.0",
    "vitest": "4.1.10"
  }
}
```

```ts
// tests/unit/project-contract.test.ts
import packageJson from "../../package.json";
import nextConfig from "../../next.config";
import { describe, expect, it } from "vitest";

describe("project contract", () => {
  it("pins the approved runtime and webpack build", () => {
    expect(packageJson.engines.node).toBe(">=22 <23");
    expect(packageJson.dependencies.next).toBe("16.2.10");
    expect(packageJson.dependencies.react).toBe("19.2.7");
    expect(packageJson.devDependencies.typescript).toBe("5.9.3");
    expect(packageJson.scripts.build).toBe("next build --webpack");
  });

  it("enables sha256 SRI without static export mode", () => {
    expect(nextConfig.experimental?.sri?.algorithm).toBe("sha256");
    expect(nextConfig).not.toHaveProperty("output");
  });
});
```

- [ ] **Step 2: Install dependencies and verify the contract fails before configuration exists**

Run: `npm install && npm run test:unit -- tests/unit/project-contract.test.ts`

Expected: npm creates `package-lock.json`, then Vitest fails because `../../next.config` does not exist.

- [ ] **Step 3: Add the complete project configuration and minimal compiling app**

```gitignore
# .gitignore
.next/
node_modules/
coverage/
playwright-report/
test-results/
.env
.env.*
!.env.example
.DS_Store
```

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

```ts
// next-env.d.ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    sri: { algorithm: "sha256" },
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
```

```js
// eslint.config.mjs
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([".next/**", "coverage/**", "playwright-report/**", "test-results/**"]),
]);
```

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: [
      "tests/unit/**/*.test.ts",
      "tests/unit/**/*.test.tsx",
      "tests/components/**/*.test.tsx",
      "tests/integration/**/*.test.ts",
      "tests/integration/**/*.test.tsx"
    ],
    setupFiles: ["tests/setup.ts"],
    restoreMocks: true,
  },
  resolve: { alias: { "@": new URL(".", import.meta.url).pathname } },
});
```

```ts
// tests/setup.ts
import "@testing-library/jest-dom/vitest";
```

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
```

```tsx
// app/layout.tsx
import type { ReactNode } from "react";
import "./globals.css";

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

```tsx
// app/page.tsx
export default function HomePage() {
  return <main><h1>The Lion Company</h1></main>;
}
```

```css
/* app/globals.css */
* { box-sizing: border-box; }
html { color-scheme: light; }
body { margin: 0; font-family: system-ui, sans-serif; }
```

- [ ] **Step 4: Run the project contract, types, lint, and production build**

Run: `npm run test:unit -- tests/unit/project-contract.test.ts && npm run typecheck && npm run lint && npm run build`

Expected: all commands exit 0; build output lists `/` as a prerendered static route and uses webpack.

- [ ] **Step 5: Commit the scaffold**

```bash
git add package.json package-lock.json .gitignore tsconfig.json next-env.d.ts next.config.ts eslint.config.mjs vitest.config.ts playwright.config.ts app tests/setup.ts tests/unit/project-contract.test.ts
git commit -m "build: scaffold Next.js foundation"
```

### Task 2: Establish design tokens and an enforceable asset ledger

**Files:**
- Create: `styles/tokens.css`
- Modify: `app/globals.css`
- Create: `lib/art/gathering-line.ts`
- Create: `docs/asset-ledger.csv`
- Create: `scripts/check-asset-ledger.mjs`
- Create: `tests/unit/design-tokens.test.ts`

**Interfaces:**
- Consumes: npm test harness and `app/globals.css` from Task 1.
- Produces: stable CSS custom properties consumed by all page/component CSS; `npm run check:assets`; rights-cleared, ledgered path data consumed by the decorative Gathering line.

- [ ] **Step 1: Write the failing token and provenance checks**

```ts
// tests/unit/design-tokens.test.ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function luminance(hex: string) {
  const channels = hex.match(/[a-f\d]{2}/gi)!.map((value) => {
    const channel = Number.parseInt(value, 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a: string, b: string) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

describe("Gathering design tokens", () => {
  const css = readFileSync("styles/tokens.css", "utf8");

  it("locks the approved parchment, ink, and single clay accent", () => {
    expect(css).toContain("--color-parchment: #f3e9d7");
    expect(css).toContain("--color-ink: #24151f");
    expect(css).toContain("--color-accent: #964532");
  });

  it("keeps ink and accent readable on parchment", () => {
    expect(contrast("#24151f", "#f3e9d7")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#964532", "#f3e9d7")).toBeGreaterThanOrEqual(4.5);
  });
});
```

```js
// scripts/check-asset-ledger.mjs
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const ledgerPath = "docs/asset-ledger.csv";
if (!existsSync(ledgerPath)) throw new Error("asset ledger missing");

const [header, ...rows] = readFileSync(ledgerPath, "utf8").trim().split("\n");
const required = [
  "final_filename", "source", "owner", "rights_evidence", "allowed_use",
  "width", "height", "transformations", "alt_text_decision", "reviewer", "review_date",
];
if (header.split(",").join("|") !== required.join("|")) throw new Error("asset ledger columns invalid");
if (rows.length === 0) throw new Error("asset ledger has no assets");

const listed = [];
for (const [index, row] of rows.entries()) {
  const values = row.split(",");
  if (values.length !== required.length || values.some((value) => value.trim() === "")) {
    throw new Error(`asset ledger row ${index + 2} is incomplete`);
  }
  if (!existsSync(values[0])) throw new Error(`asset file missing: ${values[0]}`);
  listed.push(values[0]);
}

if (new Set(listed).size !== listed.length) throw new Error("asset ledger contains duplicate filenames");

const mediaExtensions = new Set([".svg", ".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".ico", ".woff", ".woff2", ".ttf", ".otf"]);
function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const shipped = [
  ...walk("public").filter((path) => mediaExtensions.has(extname(path).toLowerCase())),
  ...walk("lib/art").filter((path) => [".ts", ".tsx"].includes(extname(path).toLowerCase())),
].sort();
const recorded = [...listed].sort();
if (JSON.stringify(shipped) !== JSON.stringify(recorded)) {
  const missing = shipped.filter((path) => !recorded.includes(path));
  const stale = recorded.filter((path) => !shipped.includes(path));
  throw new Error(`asset ledger parity failed; missing=${missing.join("|") || "none"}; stale=${stale.join("|") || "none"}`);
}

console.log(`asset ledger valid: ${rows.length} assets with exhaustive shipped-file parity`);
```

- [ ] **Step 2: Run the checks to verify both fail**

Run: `npm run test:unit -- tests/unit/design-tokens.test.ts; npm run check:assets`

Expected: Vitest fails because `styles/tokens.css` is missing; the asset command exits non-zero with `asset ledger missing`.

- [ ] **Step 3: Add the complete tokens, accessibility defaults, original motif, and ledger row**

```css
/* styles/tokens.css */
:root {
  --color-parchment: #f3e9d7;
  --color-parchment-muted: #e7dac5;
  --color-ink: #24151f;
  --color-ink-muted: #66565f;
  --color-accent: #964532;
  --color-stone: #c6b69f;
  --color-surface: #fffaf0;
  --color-focus: #6f2c23;
  --font-display: var(--font-instrument-serif), Georgia, serif;
  --font-body: var(--font-manrope), Arial, sans-serif;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-24: 6rem;
  --measure: 72rem;
  --radius-small: 0.375rem;
  --radius-large: 1.5rem;
  --shadow-soft: 0 1.5rem 4rem rgb(36 21 31 / 0.12);
  --transition-fast: 160ms ease;
}
```

```css
/* app/globals.css */
@import "../styles/tokens.css";

* { box-sizing: border-box; }
html { color-scheme: light; scroll-behavior: smooth; }
body {
  margin: 0;
  overflow-x: clip;
  background: var(--color-parchment);
  color: var(--color-ink);
  font-family: var(--font-body);
  line-height: 1.65;
  text-rendering: optimizeLegibility;
}
img, svg { display: block; max-width: 100%; }
a { color: inherit; text-underline-offset: 0.2em; }
button, input, textarea, select { font: inherit; }
:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
.skip-link {
  position: fixed;
  inset: var(--space-3) auto auto var(--space-3);
  z-index: 1000;
  padding: var(--space-3) var(--space-4);
  transform: translateY(-180%);
  background: var(--color-ink);
  color: var(--color-parchment);
}
.skip-link:focus { transform: translateY(0); }
.shell { width: min(calc(100% - 2rem), var(--measure)); margin-inline: auto; }
.section { padding-block: clamp(4rem, 10vw, 8rem); scroll-margin-top: 6rem; }
.eyebrow { font-size: 0.78rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
h1, h2, h3 { font-family: var(--font-display); font-weight: 400; line-height: 0.98; text-wrap: balance; }
h1 { font-size: clamp(3rem, 9vw, 7.5rem); }
h2 { font-size: clamp(2.25rem, 6vw, 5rem); }
p { max-width: 68ch; }
.cluster { display: flex; flex-wrap: wrap; gap: var(--space-4); align-items: center; }
.button {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-ink);
  border-radius: 999px;
  background: var(--color-ink);
  color: var(--color-parchment);
  font-weight: 700;
  text-decoration: none;
}
.button[data-variant="quiet"] { background: transparent; color: var(--color-ink); }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
}
```

```ts
// lib/art/gathering-line.ts
export const gatheringLineStages = [
  {
    name: "mane",
    paths: [
      "M16 220 C42 72 88 18 120 170",
      "M224 220 C198 72 152 18 120 170",
      "M54 254 C68 138 96 96 120 170 C144 96 172 138 186 254",
    ],
    circles: [],
  },
  { name: "connection", paths: ["M120 170 C42 318 198 410 120 560 C56 682 172 734 120 810"], circles: [] },
  { name: "waveform", paths: ["M120 810 L120 890 L82 910 L164 944 L54 982 L184 1020 L96 1054 L120 1080"], circles: [] },
  {
    name: "network",
    paths: ["M120 1080 L44 1230 M120 1080 L196 1230 M120 1080 L120 1370 M44 1230 L82 1518 M196 1230 L158 1518 M120 1370 L82 1518 M120 1370 L158 1518"],
    circles: [[120, 1080, 8], [44, 1230, 7], [196, 1230, 7], [120, 1370, 7], [82, 1518, 7], [158, 1518, 7]],
  },
] as const;
```

```csv
final_filename,source,owner,rights_evidence,allowed_use,width,height,transformations,alt_text_decision,reviewer,review_date
lib/art/gathering-line.ts,original repository artwork,The Lion Company,created as original semantic path data in this implementation,website brand motif,240,1600,none,decorative inline SVG with empty alternative text,Codex provenance review,2026-07-11
```

- [ ] **Step 4: Run token, provenance, type, and lint checks**

Run: `npm run test:unit -- tests/unit/design-tokens.test.ts && npm run check:assets && npm run typecheck && npm run lint`

Expected: Vitest passes; the asset command prints `asset ledger valid: 1 assets with exhaustive shipped-file parity`; typecheck and lint exit 0. Adding any unledgered image, font, SVG, or code-defined art module now fails the gate.

- [ ] **Step 5: Commit the design foundation**

```bash
git add styles app/globals.css lib/art docs/asset-ledger.csv scripts/check-asset-ledger.mjs tests/unit/design-tokens.test.ts
git commit -m "feat: establish Gathering design tokens and asset provenance"
```

### Task 3: Define and validate the shared content domain

**Files:**
- Create: `lib/content/types.ts`
- Create: `lib/content/schemas.ts`
- Create: `lib/content/index.ts`
- Create: `content/site.ts`
- Create: `content/destinations.ts`
- Create: `content/live.ts`
- Create: `content/topics.ts`
- Create: `tests/unit/content-domain.test.ts`

**Interfaces:**
- Consumes: Zod 4.4.3 and the canonical destinations verified in the approved specification.
- Produces: exported types `DestinationKey`, `Destination`, `TopicSlug`, `TopicDefinition`, `Teaching`, `LiveSchedule`, `RecentReplay`, `PodcastEpisode`, and `SiteContent`; selectors `getDestination(key)`, `getTopicBySlug(slug)`, `getTeachingBySlug(slug)`, `getTeachingSlugs()`, and `isTeachingEmbeddable(teaching)`; data exports `siteContent`, `destinationRegistry`, `activeSameAs`, `liveSchedule`, `recentReplay`, and `topicDefinitions`.

- [ ] **Step 1: Write the failing content-domain tests**

```ts
// tests/unit/content-domain.test.ts
import { destinationRegistry, activeSameAs } from "@/content/destinations";
import { liveSchedule, recentReplay } from "@/content/live";
import { siteContent } from "@/content/site";
import { topicDefinitions } from "@/content/topics";
import { liveScheduleSchema } from "@/lib/content/schemas";
import { validateContentBundle } from "@/lib/content";
import { describe, expect, it } from "vitest";

describe("content domain", () => {
  it("validates centralized site, destination, and topic content", () => {
    expect(validateContentBundle({
      site: siteContent,
      destinations: destinationRegistry,
      topics: topicDefinitions,
      teachings: [],
      live: liveSchedule,
      replay: recentReplay,
    })).toBe(true);
  });

  it("preserves required audited destinations and active identity URLs", () => {
    expect(destinationRegistry.find((item) => item.key === "tiktok")?.href)
      .toBe("https://www.tiktok.com/@thelioncompanytx");
    expect(destinationRegistry.find((item) => item.key === "instagram")?.href)
      .toBe("https://www.instagram.com/thelioncompanyglobal/");
    expect(activeSameAs).toContain("https://www.youtube.com/@TheLionCompany");
    expect(activeSameAs).not.toContain("https://feed.podbean.com/thelioncompany/feed.xml");
  });

  it("uses the honest evergreen live state until an event is verified", () => {
    expect(liveSchedule).toBeNull();
    expect(recentReplay).toBeNull();
  });

  it("rejects a live interval longer than eight hours", () => {
    expect(() => liveScheduleSchema.parse({
      startsAt: "2026-07-11T12:00:00Z",
      endsAt: "2026-07-11T21:00:01Z",
      sourceTimeZone: "America/Chicago",
      verifiedAt: "2026-07-11",
      topic: "Prayer",
      url: "https://www.tiktok.com/@thelioncompanytx",
    })).toThrow(/eight hours/);
  });
});
```

- [ ] **Step 2: Run the domain test to verify it fails**

Run: `npm run test:unit -- tests/unit/content-domain.test.ts`

Expected: FAIL because `@/content/destinations` and the shared content modules do not exist.

- [ ] **Step 3: Add the complete shared types and Zod schemas**

```ts
// lib/content/types.ts
export type DestinationKey =
  | "tiktok" | "youtube" | "applePodcasts" | "spotify" | "podbean"
  | "podcastRss" | "instagram" | "facebook" | "threads" | "x"
  | "printify" | "subsplash";

export type DestinationKind = "social" | "podcast" | "feed" | "commerce" | "giving";

export interface Destination {
  key: DestinationKey;
  label: string;
  href: string;
  purpose: string;
  kind: DestinationKind;
  required: boolean;
  visible: boolean;
  verifiedAt: string;
}

export type TopicSlug =
  | "fear-and-trust"
  | "purpose-and-calling"
  | "relationships-and-family"
  | "prayer-and-spiritual-growth"
  | "church-reform-and-unity"
  | "truth-conflict-and-courage";

export interface TopicDefinition {
  slug: TopicSlug;
  label: string;
  prompt: string;
  description: string;
}

export interface Teaching {
  slug: string;
  title: string;
  summary: string;
  youtubeId: string;
  posterPath: `/images/teachings/${string}.jpg`;
  publishedAt: string | null;
  topics: readonly TopicSlug[];
  series: string | null;
  captionsVerified: boolean;
  transcriptUrl: string | null;
  featured: boolean;
}

export interface LiveSchedule {
  startsAt: string;
  endsAt: string;
  sourceTimeZone: string;
  verifiedAt: string;
  topic?: string;
  url: string;
}

export interface RecentReplay {
  title: string;
  url: string;
  publishedAt: string;
  expiresAt: string;
}

export interface PodcastEpisode {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  durationSeconds: number | null;
  audioUrl: string;
  pageUrl: string;
  imageUrl: string | null;
  episodeNumber: number | null;
  transcriptUrl: string | null;
}

export interface SiteContent {
  name: string;
  shortName: string;
  canonicalOrigin: string;
  locale: "en_US";
  homeTitle: string;
  homeDescription: string;
  location: string;
  foundationalQuote: string;
  missionHeading: string;
  missionStatement: string;
  story: string;
  navigation: readonly { label: string; href: string }[];
  pillars: readonly { title: "Love" | "Relationship" | "Discipleship" | "Education"; body: string }[];
}
```

```ts
// lib/content/schemas.ts
import { z } from "zod";

export const isoDateSchema = z.iso.date();
export const isoDateTimeSchema = z.iso.datetime({ offset: true });
const httpsUrlSchema = z.url().refine((value) => new URL(value).protocol === "https:", "URL must use HTTPS");
const ianaTimeZoneSchema = z.string().refine((value) => {
  try { new Intl.DateTimeFormat("en-US", { timeZone: value }).format(); return value.includes("/"); }
  catch { return false; }
}, "sourceTimeZone must be a valid named IANA timezone");

export const destinationSchema = z.object({
  key: z.enum(["tiktok", "youtube", "applePodcasts", "spotify", "podbean", "podcastRss", "instagram", "facebook", "threads", "x", "printify", "subsplash"]),
  label: z.string().min(1),
  href: httpsUrlSchema,
  purpose: z.string().min(1),
  kind: z.enum(["social", "podcast", "feed", "commerce", "giving"]),
  required: z.boolean(),
  visible: z.boolean(),
  verifiedAt: isoDateSchema,
});

export const topicSchema = z.object({
  slug: z.enum(["fear-and-trust", "purpose-and-calling", "relationships-and-family", "prayer-and-spiritual-growth", "church-reform-and-unity", "truth-conflict-and-courage"]),
  label: z.string().min(1),
  prompt: z.string().min(1),
  description: z.string().min(1),
});

export const teachingSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  summary: z.string().min(30),
  youtubeId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
  posterPath: z.custom<`/images/teachings/${string}.jpg`>(
    (value) => typeof value === "string" && /^\/images\/teachings\/[a-z0-9]+(?:-[a-z0-9]+)*\.jpg$/.test(value),
    "posterPath must be a first-party teaching JPEG",
  ),
  publishedAt: isoDateTimeSchema.nullable(),
  topics: z.array(topicSchema.shape.slug).min(1),
  series: z.string().min(1).nullable(),
  captionsVerified: z.boolean(),
  transcriptUrl: httpsUrlSchema.nullable(),
  featured: z.boolean(),
});

export const liveScheduleSchema = z.object({
  startsAt: isoDateTimeSchema,
  endsAt: isoDateTimeSchema,
  sourceTimeZone: ianaTimeZoneSchema,
  verifiedAt: isoDateSchema,
  topic: z.string().min(1).max(120).optional(),
  url: httpsUrlSchema,
}).superRefine((value, context) => {
  const duration = Date.parse(value.endsAt) - Date.parse(value.startsAt);
  if (duration <= 0) context.addIssue({ code: "custom", message: "endsAt must follow startsAt" });
  if (duration > 8 * 60 * 60 * 1000) context.addIssue({ code: "custom", message: "live interval cannot exceed eight hours" });
});

export const recentReplaySchema = z.object({
  title: z.string().min(1),
  url: httpsUrlSchema,
  publishedAt: isoDateTimeSchema,
  expiresAt: isoDateTimeSchema,
}).refine((value) => Date.parse(value.expiresAt) > Date.parse(value.publishedAt), {
  message: "replay expiry must follow publication",
});

export const podcastEpisodeSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  description: z.string().min(20),
  publishedAt: isoDateTimeSchema,
  durationSeconds: z.number().int().positive().nullable(),
  audioUrl: httpsUrlSchema,
  pageUrl: httpsUrlSchema,
  imageUrl: httpsUrlSchema.nullable(),
  episodeNumber: z.number().int().positive().nullable(),
  transcriptUrl: httpsUrlSchema.nullable(),
});
```

- [ ] **Step 4: Add the complete core content registries**

```ts
// content/site.ts
import type { SiteContent } from "@/lib/content/types";

export const siteContent = {
  name: "The Lion Company",
  shortName: "Lion Company",
  canonicalOrigin: "https://www.thelioncompany.org",
  locale: "en_US",
  homeTitle: "The Lion Company — Unity Through Christ",
  homeDescription: "The Lion Company is a ministry pursuing Christian unity, authentic discipleship, church reform, and relationship centered on Jesus.",
  location: "Texas-based, serving globally",
  foundationalQuote: "Whatever doesn't cause you to look like Jesus isn't of Jesus.",
  missionHeading: "Bringing unity among Christians worldwide",
  missionStatement: "We invite people beyond passive consumption into love, relationship, discipleship, and education centered on Jesus himself.",
  story: "The public work grew from a conviction repeated throughout The Lion Company’s existing ministry: Christians are called to look like Jesus together. That conviction now takes visible form through daily live teaching, a public teaching archive, honest long-form conversations, private prayer, discipleship resources, and invitations to relationship rather than passive viewing.",
  navigation: [
    { label: "Start here", href: "/start-here" },
    { label: "Live", href: "/live" },
    { label: "Teachings", href: "/teachings" },
    { label: "Podcast", href: "/podcast" },
    { label: "Prayer", href: "/prayer" },
    { label: "Connect", href: "/connect" },
  ],
  pillars: [
    { title: "Love", body: "Let love for Jesus shape how we see and serve one another." },
    { title: "Relationship", body: "Choose honest connection over performance, distance, and isolation." },
    { title: "Discipleship", body: "Become more like Jesus through practiced truth, courage, and community." },
    { title: "Education", body: "Learn with humility, test what we inherit, and carry wisdom into daily life." },
  ],
} as const satisfies SiteContent;
```

```ts
// content/destinations.ts
import { destinationSchema } from "@/lib/content/schemas";
import type { Destination } from "@/lib/content/types";

const records = [
  { key: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@thelioncompanytx", purpose: "Daily live teaching and discipleship", kind: "social", required: true, visible: true, verifiedAt: "2026-07-11" },
  { key: "youtube", label: "YouTube", href: "https://www.youtube.com/@TheLionCompany", purpose: "Long-form teaching archive", kind: "social", required: true, visible: true, verifiedAt: "2026-07-11" },
  { key: "applePodcasts", label: "Apple Podcasts", href: "https://podcasts.apple.com/us/podcast/the-lion-company-podcast/id1783214612", purpose: "Listen on Apple Podcasts", kind: "podcast", required: true, visible: true, verifiedAt: "2026-07-11" },
  { key: "spotify", label: "Spotify", href: "https://open.spotify.com/show/2zvyq6wVX8sAf7qXd9KQg5", purpose: "Listen on Spotify", kind: "podcast", required: true, visible: true, verifiedAt: "2026-07-11" },
  { key: "podbean", label: "Podbean", href: "https://thelioncompany.podbean.com", purpose: "Podcast home and episode source", kind: "podcast", required: true, visible: true, verifiedAt: "2026-07-11" },
  { key: "podcastRss", label: "Podcast RSS", href: "https://feed.podbean.com/thelioncompany/feed.xml", purpose: "Subscribe with an RSS reader", kind: "feed", required: true, visible: true, verifiedAt: "2026-07-11" },
  { key: "instagram", label: "Instagram", href: "https://www.instagram.com/thelioncompanyglobal/", purpose: "Visual ministry updates", kind: "social", required: false, visible: true, verifiedAt: "2026-07-11" },
  { key: "facebook", label: "Facebook", href: "https://www.facebook.com/lioncompanytx", purpose: "Community and updates", kind: "social", required: false, visible: true, verifiedAt: "2026-07-11" },
  { key: "threads", label: "Threads", href: "https://www.threads.com/@thelioncompanyglobal/", purpose: "Short-form conversation", kind: "social", required: false, visible: true, verifiedAt: "2026-07-11" },
  { key: "x", label: "X", href: "https://x.com/lioncompanyusa", purpose: "Short-form conversation", kind: "social", required: false, visible: true, verifiedAt: "2026-07-11" },
  { key: "printify", label: "The Lion Company Store", href: "https://the-lion-company.printify.me/", purpose: "View the complete merchandise catalog", kind: "commerce", required: true, visible: true, verifiedAt: "2026-07-11" },
  { key: "subsplash", label: "Give through Subsplash", href: "https://secure.subsplash.com/ui/access/RM87PQ/", purpose: "Support the ministry", kind: "giving", required: true, visible: true, verifiedAt: "2026-07-11" },
] as const;

export const destinationRegistry: readonly Destination[] = records.map((record) => destinationSchema.parse(record));
const identityKeys = new Set(["tiktok", "youtube", "applePodcasts", "spotify", "podbean", "instagram", "facebook", "threads", "x"]);
export const activeSameAs = destinationRegistry
  .filter((record) => record.visible && identityKeys.has(record.key))
  .map((record) => record.href);
```

```ts
// content/live.ts
import type { LiveSchedule, RecentReplay } from "@/lib/content/types";

export const liveSchedule: LiveSchedule | null = null;
export const recentReplay: RecentReplay | null = null;
```

`recentReplay` may change from `null` only with an owner-verified URL and a release-recorded expiry operation. The same content change must schedule a rebuild/removal no later than `expiresAt`; if that operation is not owned, the replay does not ship. Experience Task 4 filters an already-expired record at build time, server-renders an active replay for no-JavaScript visitors, and hides it at the exact boundary after hydration. This preserves a useful static fallback without allowing an indefinitely stale replay.

```ts
// content/topics.ts
import type { TopicDefinition } from "@/lib/content/types";

export const topicDefinitions = [
  { slug: "fear-and-trust", label: "Fear and trust", prompt: "When fear is shaping the next step", description: "Teachings about trust, hope, obedience, and moving beyond the past." },
  { slug: "purpose-and-calling", label: "Purpose and calling", prompt: "When purpose feels difficult to name", description: "Teachings about significance, calling, dreams, and faithful action." },
  { slug: "relationships-and-family", label: "Relationships and family", prompt: "When connection needs care", description: "Teachings about family, friendship, boundaries, love, and reconciliation." },
  { slug: "prayer-and-spiritual-growth", label: "Prayer and spiritual growth", prompt: "When you want to grow closer to Jesus", description: "Teachings about prayer, holiness, revival, obedience, and formation." },
  { slug: "church-reform-and-unity", label: "Church reform and unity", prompt: "When the church needs honest renewal", description: "Teachings about unity, reform, discipleship, and the life of the church." },
  { slug: "truth-conflict-and-courage", label: "Truth, conflict, and courage", prompt: "When truth carries a cost", description: "Teachings about honesty, blame, conflict, courage, and speaking truth in love." },
] as const satisfies readonly TopicDefinition[];
```

- [ ] **Step 5: Add validation and stable selectors**

```ts
// lib/content/index.ts
import { destinationRegistry } from "@/content/destinations";
import { topicDefinitions } from "@/content/topics";
import { destinationSchema, liveScheduleSchema, recentReplaySchema, teachingSchema, topicSchema } from "./schemas";
import type { DestinationKey, LiveSchedule, RecentReplay, SiteContent, Teaching, TopicDefinition, TopicSlug } from "./types";

function assertUnique<T>(items: readonly T[], key: (item: T) => string, label: string) {
  const seen = new Set<string>();
  for (const item of items) {
    const value = key(item);
    if (seen.has(value)) throw new Error(`duplicate ${label}: ${value}`);
    seen.add(value);
  }
}

export function validateContentBundle(input: {
  site: SiteContent;
  destinations: readonly unknown[];
  topics: readonly unknown[];
  teachings: readonly unknown[];
  live: LiveSchedule | null;
  replay: RecentReplay | null;
}) {
  const destinations = input.destinations.map((item) => destinationSchema.parse(item));
  const topics = input.topics.map((item) => topicSchema.parse(item));
  const teachings = input.teachings.map((item) => teachingSchema.parse(item));
  if (input.live) liveScheduleSchema.parse(input.live);
  if (input.replay) recentReplaySchema.parse(input.replay);
  assertUnique(destinations, (item) => item.key, "destination key");
  assertUnique(topics, (item) => item.slug, "topic slug");
  assertUnique(teachings, (item) => item.slug, "teaching slug");
  assertUnique(teachings, (item) => item.youtubeId, "YouTube ID");
  const validTopics = new Set(topics.map((item) => item.slug));
  for (const teaching of teachings) {
    for (const topic of teaching.topics) if (!validTopics.has(topic)) throw new Error(`unknown topic: ${topic}`);
  }
  if (input.site.canonicalOrigin !== "https://www.thelioncompany.org") throw new Error("canonical origin drifted");
  return true;
}

export function getDestination(key: DestinationKey) {
  const destination = destinationRegistry.find((item) => item.key === key && item.visible);
  if (!destination) throw new Error(`destination unavailable: ${key}`);
  return destination;
}

export function getTopicBySlug(slug: TopicSlug): TopicDefinition {
  const topic = topicDefinitions.find((item) => item.slug === slug);
  if (!topic) throw new Error(`topic unavailable: ${slug}`);
  return topic;
}

export function isTeachingEmbeddable(teaching: Teaching) {
  return teaching.captionsVerified && teaching.transcriptUrl !== null && new URL(teaching.transcriptUrl).origin === "https://www.thelioncompany.org";
}

export { type DestinationKey, type Destination, type TopicSlug, type TopicDefinition, type Teaching, type LiveSchedule, type RecentReplay, type PodcastEpisode, type SiteContent } from "./types";
```

The teaching selectors named in the interface are added with the manifest in Task 4 so this task remains independently compiling.

- [ ] **Step 6: Run domain, type, lint, and build checks**

Run: `npm run test:unit -- tests/unit/content-domain.test.ts && npm run typecheck && npm run lint && npm run build`

Expected: all commands exit 0; the live configuration test proves the safe null fallback and the build remains static.

- [ ] **Step 7: Commit the content domain**

```bash
git add lib/content content/site.ts content/destinations.ts content/live.ts content/topics.ts tests/unit/content-domain.test.ts
git commit -m "feat: centralize verified ministry content"
```

### Task 4: Migrate first-party teaching media and freeze a reviewed podcast snapshot

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `content/teachings.ts`
- Create: `content/transcripts/when-gods-will-doesnt-go-your-way.txt`
- Create: `content/evidence/teaching-transcript-reviews.json`
- Create: `content/podcast-fallback.ts`
- Create: `lib/media/podcast-feed.ts`
- Create: `lib/media/transcripts.server.ts`
- Modify: `lib/content/index.ts`
- Create: `scripts/refresh-podcast-snapshot.ts`
- Create: `scripts/refresh-teaching-posters.ts`
- Create: `scripts/record-transcript-review.mjs`
- Create: `public/images/teachings/*.jpg` (exactly one reviewed local still per teaching)
- Modify: `docs/asset-ledger.csv`
- Create: `docs/content-evidence.md`
- Create: `tests/fixtures/podbean-feed.xml`
- Create: `tests/unit/media-content.test.ts`

**Interfaces:**
- Consumes: `Teaching`, `PodcastEpisode`, topic slugs, content schemas, and destination registry from Task 3.
- Produces: `teachings: readonly Teaching[]`, `podcastFallback: readonly PodcastEpisode[]`, `getTeachingBySlug(slug: string): Teaching | undefined`, `getTeachingSlugs(): string[]`, `getTeachingReviewBundle(teaching: Teaching)`, `parsePodcastFeed(xml: string): PodcastEpisode[]`, `fetchPodcastFeedForRefresh(fetcher?: typeof fetch): Promise<readonly PodcastEpisode[]>`, and synchronous `getPublishedPodcastEpisodes(): readonly PodcastEpisode[]`. Public rendering consumes only checked-in content. Network refresh is an explicit maintainer operation, and a player becomes eligible only through machine-validated, hash-bound human review evidence.

- [ ] **Step 1: Write the failing manifest and RSS tests**

```ts
// tests/unit/media-content.test.ts
import { existsSync, readFileSync } from "node:fs";
import { teachings } from "@/content/teachings";
import { podcastFallback } from "@/content/podcast-fallback";
import { getTeachingBySlug, getTeachingSlugs, isTeachingEmbeddable } from "@/lib/content";
import { fetchPodcastFeedForRefresh, getPublishedPodcastEpisodes, parsePodcastFeed } from "@/lib/media/podcast-feed";
import { getTeachingReviewBundle } from "@/lib/media/transcripts.server";
import { describe, expect, it, vi } from "vitest";

describe("curated teaching manifest", () => {
  it("contains the 32 unique production videos and every visitor topic", () => {
    expect(teachings).toHaveLength(32);
    expect(new Set(teachings.map((item) => item.youtubeId)).size).toBe(32);
    expect(new Set(teachings.flatMap((item) => item.topics)).size).toBe(6);
    expect(getTeachingSlugs()).toHaveLength(32);
    expect(getTeachingBySlug("heart-over-hammer")?.youtubeId).toBe("zP4ZiKek3Lg");
  });

  it("enables no manifest seed and exactly one hash-bound, fully reviewed text alternative", () => {
    expect(teachings.filter(isTeachingEmbeddable)).toHaveLength(0);
    const base = getTeachingBySlug("when-gods-will-doesnt-go-your-way")!;
    const reviewed = getTeachingReviewBundle(base);
    expect(isTeachingEmbeddable(reviewed.teaching)).toBe(true);
    expect(reviewed.transcript?.trim().split(/\s+/).length).toBeGreaterThan(1_000);
    expect(reviewed.evidence).toMatchObject({
      youtubeId: "TOj6tefx3rI",
      sourceWatchUrl: "https://www.youtube.com/watch?v=TOj6tefx3rI",
      sourceDurationSeconds: 2223,
      reviewMethod: "complete-listen-through",
      decision: "approved-complete-text-alternative",
    });
    expect(reviewed.evidence?.reviewer.trim().length).toBeGreaterThan(1);
  });

  it("ships one first-party ledgered poster for every teaching", () => {
    for (const teaching of teachings) {
      expect(existsSync(`public${teaching.posterPath}`), teaching.posterPath).toBe(true);
    }
  });
});

describe("Podbean content", () => {
  const fixture = readFileSync("tests/fixtures/podbean-feed.xml", "utf8");

  it("normalizes RSS items and rejects implausible numeric durations", () => {
    const episodes = parsePodcastFeed(fixture);
    expect(episodes).toHaveLength(2);
    expect(episodes[0]).toMatchObject({ slug: "when-gods-will-doesnt-go-your-way", durationSeconds: 2222, episodeNumber: 7 });
    expect(episodes[1].durationSeconds).toBeNull();
  });

  it("uses only the checked-in snapshot for public rendering", () => {
    expect(getPublishedPodcastEpisodes()).toEqual(podcastFallback);
  });

  it("fails a maintainer refresh without mutating the published snapshot", async () => {
    const fetcher = vi.fn(async () => new Response("down", { status: 503 }));
    await expect(fetchPodcastFeedForRefresh(fetcher as unknown as typeof fetch)).rejects.toThrow(/Podbean RSS refresh failed/);
    expect(getPublishedPodcastEpisodes()).toEqual(podcastFallback);
  });
});
```

```xml
<!-- tests/fixtures/podbean-feed.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>The Lion Company Podcast</title>
    <item>
      <title>When God's Will doesn't go your way</title>
      <link>https://thelioncompany.podbean.com/e/when-gods-will-doesnt-go-your-way/</link>
      <pubDate>Fri, 18 Jul 2025 16:09:39 -0500</pubDate>
      <description><![CDATA[<p>Trusting God when the path takes an unexpected turn.</p>]]></description>
      <enclosure url="https://mcdn.podbean.com/mf/web/ps6vkqm3eernmuw8/EP7_PODCAST_AUDIOanwkp.mp3" type="audio/mpeg"/>
      <itunes:duration>2222</itunes:duration>
      <itunes:episode>7</itunes:episode>
      <itunes:image href="https://pbcdn1.podbean.com/imglogo/ep-logo/pbblog16332481/The_Lion_Company_Podcast_Thumbnail_q7z96q.jpg"/>
    </item>
    <item>
      <title>The Dark Side of Emotional Intelligence (and How to fix it)</title>
      <link>https://thelioncompany.podbean.com/e/the-dark-side-of-emotional-intelligence-and-how-to-fix-it/</link>
      <pubDate>Sat, 11 Jan 2025 00:01:00 -0600</pubDate>
      <description><![CDATA[<p>A conversation about boundaries, leadership, and relationships.</p>]]></description>
      <enclosure url="https://mcdn.podbean.com/mf/web/eers7fsdu2aypfhm/The_Lion_Company_Podcast_Episode_4bjew3.mp3" type="audio/mpeg"/>
      <itunes:duration>63</itunes:duration>
      <itunes:episode>4</itunes:episode>
    </item>
  </channel>
</rss>
```

- [ ] **Step 2: Run the media-content test to verify it fails**

Run: `npm run test:unit -- tests/unit/media-content.test.ts`

Expected: FAIL because the teaching manifest, podcast fallback, and feed adapter do not exist.

- [ ] **Step 3: Add the complete deduplicated teaching manifest**

```ts
// content/teachings.ts
import { teachingSchema } from "@/lib/content/schemas";
import type { Teaching, TopicSlug } from "@/lib/content/types";

type TeachingSeed = {
  slug: string;
  title: string;
  youtubeId: string;
  topics: readonly TopicSlug[];
  series?: string;
  featured?: boolean;
};

const seeds: readonly TeachingSeed[] = [
  { slug: "when-gods-will-doesnt-go-your-way", title: "When God's Will Doesn't Go Your Way", youtubeId: "TOj6tefx3rI", topics: ["fear-and-trust", "prayer-and-spiritual-growth"], series: "The Lion Company Podcast", featured: true },
  { slug: "confessions-of-a-truth-teller", title: "Confessions of a Truth Teller", youtubeId: "x8s5DPF68kQ", topics: ["truth-conflict-and-courage", "relationships-and-family"], series: "The Lion Company Podcast", featured: true },
  { slug: "miracle-or-madness", title: "Miracle or Madness?", youtubeId: "Z0AtNFd13-A", topics: ["prayer-and-spiritual-growth", "fear-and-trust"], series: "The Lion Company Podcast" },
  { slug: "unlocking-the-dream-realm", title: "Unlocking the Dream Realm: What's Really Possible?", youtubeId: "gfzoFvDlWTc", topics: ["purpose-and-calling", "prayer-and-spiritual-growth"], featured: true },
  { slug: "heart-over-hammer", title: "Heart over Hammer", youtubeId: "zP4ZiKek3Lg", topics: ["relationships-and-family", "truth-conflict-and-courage"] },
  { slug: "fathers-of-faith-volume-four", title: "Fathers of Faith Vol. 4", youtubeId: "M1tQvPOg3vk", topics: ["relationships-and-family", "church-reform-and-unity"], series: "Fathers of Faith" },
  { slug: "mothers", title: "Mothers", youtubeId: "p3UUJ5f6kEM", topics: ["relationships-and-family"] },
  { slug: "family-equals-reform", title: "Family = Reform", youtubeId: "L2HBzHQYrt8", topics: ["relationships-and-family", "church-reform-and-unity"] },
  { slug: "jesus-stories-episode-one", title: "Jesus Stories Ep. 1", youtubeId: "goD2b5TgBtE", topics: ["prayer-and-spiritual-growth"], series: "Jesus Stories" },
  { slug: "gideon-gods-agenda-part-one", title: "Gideon: God's Agenda Part 1", youtubeId: "tWKxz7YrnA0", topics: ["purpose-and-calling", "fear-and-trust"], series: "Gideon: God's Agenda" },
  { slug: "gideon-gods-agenda-part-two", title: "Gideon: God's Agenda Part 2", youtubeId: "0jeOgbfl1vk", topics: ["purpose-and-calling", "fear-and-trust"], series: "Gideon: God's Agenda" },
  { slug: "gideon-gods-agenda-part-three", title: "Gideon: God's Agenda Part 3", youtubeId: "njO21uBJxMM", topics: ["purpose-and-calling", "fear-and-trust"], series: "Gideon: God's Agenda" },
  { slug: "gideon-gods-agenda-part-four", title: "Gideon: God's Agenda Part 4", youtubeId: "CaV9NyMAfMY", topics: ["purpose-and-calling", "fear-and-trust"], series: "Gideon: God's Agenda" },
  { slug: "gideon-gods-agenda-part-five", title: "Gideon: God's Agenda Part 5", youtubeId: "ru7dI3HSKIQ", topics: ["purpose-and-calling", "fear-and-trust"], series: "Gideon: God's Agenda" },
  { slug: "context-perspective-and-revival", title: "Context, Perspective & Revival", youtubeId: "lPRvDRofqkQ", topics: ["church-reform-and-unity", "prayer-and-spiritual-growth"] },
  { slug: "obedience-and-sacrifice", title: "Obedience & Sacrifice", youtubeId: "H3k4iw_6fj0", topics: ["prayer-and-spiritual-growth", "purpose-and-calling"] },
  { slug: "significance", title: "Significance", youtubeId: "x2pT7uYkvlA", topics: ["purpose-and-calling"] },
  { slug: "the-blame-game", title: "The Blame Game", youtubeId: "s8FewMKaHSM", topics: ["truth-conflict-and-courage", "relationships-and-family"] },
  { slug: "jesus-and-memory-maps", title: "Jesus & Memory Maps", youtubeId: "PWU_VB0qfUU", topics: ["fear-and-trust", "prayer-and-spiritual-growth"] },
  { slug: "loving-jesus-loving-people", title: "Loving Jesus, Loving People", youtubeId: "jb0JRyF07Yk", topics: ["relationships-and-family", "church-reform-and-unity"] },
  { slug: "jesus-and-the-thirteenth-disciple", title: "Jesus & the 13th Disciple", youtubeId: "PxlLRWjycZg", topics: ["church-reform-and-unity", "prayer-and-spiritual-growth"] },
  { slug: "prophets-corner-episode-one", title: "Prophet's Corner Ep. 1", youtubeId: "kD28pst1hpU", topics: ["purpose-and-calling", "prayer-and-spiritual-growth"], series: "Prophet's Corner" },
  { slug: "cry-holy", title: "Cry Holy", youtubeId: "Nl6JIlKUbQE", topics: ["prayer-and-spiritual-growth"] },
  { slug: "behold", title: "Behold", youtubeId: "xiLXewFUWAM", topics: ["prayer-and-spiritual-growth"] },
  { slug: "revival-police", title: "Revival Police", youtubeId: "C8alBDDqBNw", topics: ["church-reform-and-unity", "truth-conflict-and-courage"] },
  { slug: "heart-over-hand", title: "Heart over Hand", youtubeId: "OiGtroG7uHE", topics: ["relationships-and-family", "truth-conflict-and-courage"] },
  { slug: "heart", title: "Heart", youtubeId: "yeAIXEAdvTU", topics: ["relationships-and-family", "prayer-and-spiritual-growth"] },
  { slug: "overcoming-the-past-redefining-success", title: "Overcoming the Past, Redefining Success, and Finding God's Purpose", youtubeId: "OfyCpxqYamE", topics: ["fear-and-trust", "purpose-and-calling"], series: "The Lion Company Podcast" },
  { slug: "relationships-part-one", title: "Relationships: Part 1", youtubeId: "ml1tCKumJNw", topics: ["relationships-and-family"], series: "Relationships" },
  { slug: "relationships-part-two", title: "Relationships: Part 2", youtubeId: "lAn92FsttOM", topics: ["relationships-and-family"], series: "Relationships" },
  { slug: "relationships-part-three", title: "Relationships: Part 3", youtubeId: "P7FnRJ0lq2E", topics: ["relationships-and-family"], series: "Relationships" },
  { slug: "relationships-part-four", title: "Relationships: Part 4", youtubeId: "QhzS_keuuT4", topics: ["relationships-and-family"], series: "Relationships" },
];

export const teachings: readonly Teaching[] = seeds.map((seed) => teachingSchema.parse({
  ...seed,
  posterPath: `/images/teachings/${seed.slug}.jpg`,
  summary: `Explore “${seed.title},” a verified archive entry from The Lion Company connected to ${seed.topics.join(" and ").replaceAll("-", " ")}.`,
  publishedAt: null,
  series: seed.series ?? null,
  captionsVerified: false,
  transcriptUrl: null,
  featured: seed.featured ?? false,
}));
```

Create `content/transcripts/when-gods-will-doesnt-go-your-way.txt` from the public auto-generated English caption track for `TOj6tefx3rI`, but leave every manifest record ineligible. An authorized reviewer must listen through all 2,223 seconds, correct names, punctuation, omitted words, and caption errors, and explicitly approve the result as a complete text alternative. Preserve the complete spoken teaching; do not substitute episode notes, a synthetic expansion, or an AI summary.

Initialize `content/evidence/teaching-transcript-reviews.json` as `[]`; that state intentionally keeps every player ineligible while the remaining implementation proceeds. Only after the listen-through, run `scripts/record-transcript-review.mjs --slug when-gods-will-doesnt-go-your-way --confirm-complete-listen-through` with the reviewer, caption-retrieval time, and review time supplied outside shell history. The script derives the exact YouTube ID, source URL, transcript path, duration, and SHA-256 itself; rejects missing/future dates, a blank reviewer, a missing or empty transcript, and any invocation without the explicit confirmation flag; then atomically writes the single structured record. Also record the evidence file path and SHA-256 in `docs/content-evidence.md`. Do not hand-edit a `captionsVerified: true` seed.

```ts
// lib/media/transcripts.server.ts
import "server-only";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import type { Teaching } from "@/lib/content/types";

const transcriptFiles = {
  "when-gods-will-doesnt-go-your-way": { filename: "when-gods-will-doesnt-go-your-way.txt", sourceDurationSeconds: 2223 },
} as const;

const evidenceSchema = z.object({
  schemaVersion: z.literal(1),
  slug: z.string().min(1),
  youtubeId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
  sourceWatchUrl: z.string().url(),
  sourceDurationSeconds: z.number().int().positive(),
  captionTrackLanguage: z.literal("en"),
  captionRetrievedAt: z.string().datetime({ offset: true }),
  transcriptPath: z.string().startsWith("content/transcripts/"),
  transcriptSha256: z.string().regex(/^[a-f0-9]{64}$/),
  reviewer: z.string().trim().min(2),
  reviewedAt: z.string().datetime({ offset: true }),
  reviewMethod: z.literal("complete-listen-through"),
  decision: z.literal("approved-complete-text-alternative"),
}).strict();

export function getTeachingReviewBundle(teaching: Teaching): {
  readonly teaching: Teaching;
  readonly transcript?: string;
  readonly evidence?: z.infer<typeof evidenceSchema>;
} {
  const ineligible = { ...teaching, captionsVerified: false, transcriptUrl: null } satisfies Teaching;
  const source = transcriptFiles[teaching.slug as keyof typeof transcriptFiles];
  if (!source) return { teaching: ineligible };
  const records = z.array(evidenceSchema).parse(JSON.parse(readFileSync(join(process.cwd(), "content/evidence/teaching-transcript-reviews.json"), "utf8")));
  const evidence = records.find((record) => record.slug === teaching.slug);
  if (!evidence) return { teaching: ineligible };
  const expectedPath = `content/transcripts/${source.filename}`;
  const expectedUrl = `https://www.youtube.com/watch?v=${teaching.youtubeId}`;
  if (evidence.youtubeId !== teaching.youtubeId || evidence.sourceWatchUrl !== expectedUrl || evidence.transcriptPath !== expectedPath || evidence.sourceDurationSeconds !== source.sourceDurationSeconds) {
    throw new Error(`transcript evidence identity mismatch for ${teaching.slug}`);
  }
  const transcript = readFileSync(join(process.cwd(), expectedPath), "utf8");
  const digest = createHash("sha256").update(transcript).digest("hex");
  if (digest !== evidence.transcriptSha256) throw new Error(`transcript review hash mismatch for ${teaching.slug}`);
  if (Date.parse(evidence.reviewedAt) < Date.parse(evidence.captionRetrievedAt) || Date.parse(evidence.reviewedAt) > Date.now()) {
    throw new Error(`transcript review dates are invalid for ${teaching.slug}`);
  }
  return {
    teaching: { ...teaching, captionsVerified: true, transcriptUrl: `https://www.thelioncompany.org/teachings/${teaching.slug}#transcript` },
    transcript,
    evidence,
  };
}
```

- [ ] **Step 4: Add the seven-episode checked-in Podbean snapshot**

```ts
// content/podcast-fallback.ts
import { podcastEpisodeSchema } from "@/lib/content/schemas";
import type { PodcastEpisode } from "@/lib/content/types";

const records = [
  { slug: "when-gods-will-doesnt-go-your-way", title: "When God's Will doesn't go your way", description: "A conversation about patience, persistence, and trusting God when a faithful path still includes defeat or delay.", publishedAt: "2025-07-18T21:09:39Z", durationSeconds: 2222, audioUrl: "https://mcdn.podbean.com/mf/web/ps6vkqm3eernmuw8/EP7_PODCAST_AUDIOanwkp.mp3", pageUrl: "https://thelioncompany.podbean.com/e/when-gods-will-doesnt-go-your-way/", imageUrl: "https://pbcdn1.podbean.com/imglogo/ep-logo/pbblog16332481/The_Lion_Company_Podcast_Thumbnail_q7z96q.jpg", episodeNumber: 7, transcriptUrl: null },
  { slug: "confessions-of-a-truth-teller-the-dark-side-of-being-light", title: "Confessions of a Truth Teller: The Dark side of Being Light", description: "Jonathan and Gina consider why honesty can hurt and heal, and how to speak truth in love from marriage to ministry.", publishedAt: "2025-05-20T01:45:03Z", durationSeconds: 3752, audioUrl: "https://mcdn.podbean.com/mf/web/hqr9yuje96suuy82/EP_66qyz9.mp3", pageUrl: "https://thelioncompany.podbean.com/e/confessions-of-a-truth-teller-the-dark-side-of-being-light/", imageUrl: "https://pbcdn1.podbean.com/imglogo/ep-logo/pbblog16332481/ep_6_fixed9pih4.jpg", episodeNumber: 6, transcriptUrl: null },
  { slug: "miracle-or-madness", title: "Miracle or Madness?", description: "A personal conversation about forgiveness, supernatural encounters, painful histories, and the possibilities of genuine faith.", publishedAt: "2025-01-25T07:19:46Z", durationSeconds: 5462, audioUrl: "https://mcdn.podbean.com/mf/web/fxviqxtf46n875c6/Lion_Company_Podcast_EP_59338t.mp3", pageUrl: "https://thelioncompany.podbean.com/e/miracle-or-madness/", imageUrl: "https://pbcdn1.podbean.com/imglogo/ep-logo/pbblog16332481/Image_1-24-25_at_949_PM_4ka4eb.jpg", episodeNumber: 5, transcriptUrl: null },
  { slug: "the-dark-side-of-emotional-intelligence-and-how-to-fix-it", title: "The Dark Side of Emotional Intelligence (and How to fix it)", description: "Jonathan and Natalie discuss over-giving, discernment, boundaries, leadership, and relationships.", publishedAt: "2025-01-11T06:01:00Z", durationSeconds: null, audioUrl: "https://mcdn.podbean.com/mf/web/eers7fsdu2aypfhm/The_Lion_Company_Podcast_Episode_4bjew3.mp3", pageUrl: "https://thelioncompany.podbean.com/e/the-dark-side-of-emotional-intelligence-and-how-to-fix-it/", imageUrl: "https://pbcdn1.podbean.com/imglogo/ep-logo/pbblog16332481/Untitled-2_1__7jk4tv.png", episodeNumber: 4, transcriptUrl: null },
  { slug: "trapped-by-fear-and-stuck-in-the-past", title: "Trapped by Fear and Stuck in the Past? How One Prophetic Word Changed Everything", description: "Gina and Natalie share a story about fear, people-pleasing, obedience, hope, and stepping into a life of purpose.", publishedAt: "2025-01-03T21:30:11Z", durationSeconds: null, audioUrl: "https://mcdn.podbean.com/mf/web/g59wpw6n4cvexyu5/Lion_Co_EP369ch7.mp3", pageUrl: "https://thelioncompany.podbean.com/e/trapped-by-fear-and-stuck-in-the-past-how-one-prophetic-word-changed-everything/", imageUrl: "https://pbcdn1.podbean.com/imglogo/ep-logo/pbblog16332481/Untitled_2__883v4f.png", episodeNumber: 3, transcriptUrl: null },
  { slug: "authenticity-endurance-and-the-call-to-the-bride", title: "Authenticity, Endurance, and the Call to the Bride – A Candid Conversation with Andrew Billings | Part 1", description: "Jonathan Gibson and Andrew Billings discuss authenticity in ministry, endurance through hardship, and relational discipleship.", publishedAt: "2024-12-18T20:03:51Z", durationSeconds: null, audioUrl: "https://mcdn.podbean.com/mf/web/u6mcuqe7mh6niajw/The_Lion_Company_PODCAST_Billing_pt_18juvm.mp3", pageUrl: "https://thelioncompany.podbean.com/e/authenticity-endurance-and-the-call-to-the-bride-%e2%80%93-a-candid-conversation-with-andrew-billings-part-1/", imageUrl: "https://pbcdn1.podbean.com/imglogo/ep-logo/pbblog16332481/Lion_Co_Podcast_EP_2_IG_SQ_hfn8sv.png", episodeNumber: 2, transcriptUrl: null },
  { slug: "overcoming-the-past-redefining-success-and-finding-gods-purpose", title: "Overcoming the Past, Redefining Success, and Finding God’s Purpose", description: "The opening episode explores past pain, inherited ideas of success, faith, and a renewed sense of purpose.", publishedAt: "2024-12-03T23:27:15Z", durationSeconds: 8612, audioUrl: "https://mcdn.podbean.com/mf/web/sczpt4dbrkuczepn/THE_LION_COMPANY_PODCAST_EP_1aqvqb.mp3", pageUrl: "https://thelioncompany.podbean.com/e/ep1/", imageUrl: "https://pbcdn1.podbean.com/imglogo/ep-logo/pbblog16332481/Untitled-2.jpeg", episodeNumber: 1, transcriptUrl: null },
] as const;

export const podcastFallback: readonly PodcastEpisode[] = records.map((record) => podcastEpisodeSchema.parse(record));
```

- [ ] **Step 5: Implement the RSS parser, maintainer-only refresh adapter, static selector, and teaching selectors**

```ts
// lib/media/podcast-feed.ts
import { XMLParser } from "fast-xml-parser";
import { podcastFallback } from "@/content/podcast-fallback";
import { destinationRegistry } from "@/content/destinations";
import { podcastEpisodeSchema } from "@/lib/content/schemas";
import type { PodcastEpisode } from "@/lib/content/types";

const RSS_URL = destinationRegistry.find((item) => item.key === "podcastRss")!.href;
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "", processEntities: true, trimValues: true });

function text(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object" && "#text" in value) return String((value as { "#text": unknown })["#text"]);
  return "";
}

function stripMarkup(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function slugify(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function parseDuration(value: unknown): number | null {
  const raw = text(value);
  if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(raw)) {
    const parts = raw.split(":").map(Number);
    return parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
  }
  const seconds = Number.parseInt(raw, 10);
  return Number.isInteger(seconds) && seconds >= 300 && seconds <= 14_400 ? seconds : null;
}

export function parsePodcastFeed(xml: string): PodcastEpisode[] {
  const parsed = parser.parse(xml) as { rss?: { channel?: { item?: unknown | unknown[] } } };
  const rawItems = parsed.rss?.channel?.item;
  const items = rawItems ? (Array.isArray(rawItems) ? rawItems : [rawItems]) : [];
  const episodes = items.flatMap((raw) => {
    const item = raw as Record<string, unknown>;
    const enclosure = item.enclosure as Record<string, unknown> | undefined;
    const image = item["itunes:image"] as Record<string, unknown> | undefined;
    const title = text(item.title);
    const published = new Date(text(item.pubDate));
    const candidate = {
      slug: slugify(title),
      title,
      description: stripMarkup(text(item["itunes:summary"] ?? item.description)),
      publishedAt: Number.isNaN(published.valueOf()) ? "" : published.toISOString(),
      durationSeconds: parseDuration(item["itunes:duration"]),
      audioUrl: text(enclosure?.url),
      pageUrl: text(item.link),
      imageUrl: text(image?.href) || null,
      episodeNumber: Number.parseInt(text(item["itunes:episode"]), 10) || null,
      transcriptUrl: null,
    };
    const result = podcastEpisodeSchema.safeParse(candidate);
    return result.success ? [result.data] : [];
  });
  const unique = new Map(episodes.map((episode) => [episode.slug, episode]));
  return [...unique.values()].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

export function getPublishedPodcastEpisodes(): readonly PodcastEpisode[] {
  return podcastFallback;
}

export async function fetchPodcastFeedForRefresh(fetcher: typeof fetch = fetch): Promise<readonly PodcastEpisode[]> {
  const response = await fetcher(RSS_URL, {
    headers: { accept: "application/rss+xml, application/xml;q=0.9" },
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error(`Podbean RSS refresh failed with ${response.status}`);
  const episodes = parsePodcastFeed(await response.text());
  if (episodes.length === 0) throw new Error("Podbean RSS refresh failed validation");
  return episodes;
}
```

```ts
// lib/content/index.ts
import { destinationRegistry } from "@/content/destinations";
import { teachings } from "@/content/teachings";
import { topicDefinitions } from "@/content/topics";
import { destinationSchema, liveScheduleSchema, recentReplaySchema, teachingSchema, topicSchema } from "./schemas";
import type { DestinationKey, LiveSchedule, RecentReplay, SiteContent, Teaching, TopicDefinition, TopicSlug } from "./types";

function assertUnique<T>(items: readonly T[], key: (item: T) => string, label: string) {
  const seen = new Set<string>();
  for (const item of items) {
    const value = key(item);
    if (seen.has(value)) throw new Error(`duplicate ${label}: ${value}`);
    seen.add(value);
  }
}

export function validateContentBundle(input: {
  site: SiteContent;
  destinations: readonly unknown[];
  topics: readonly unknown[];
  teachings: readonly unknown[];
  live: LiveSchedule | null;
  replay: RecentReplay | null;
}) {
  const destinations = input.destinations.map((item) => destinationSchema.parse(item));
  const topics = input.topics.map((item) => topicSchema.parse(item));
  const validatedTeachings = input.teachings.map((item) => teachingSchema.parse(item));
  if (input.live) liveScheduleSchema.parse(input.live);
  if (input.replay) recentReplaySchema.parse(input.replay);
  assertUnique(destinations, (item) => item.key, "destination key");
  assertUnique(topics, (item) => item.slug, "topic slug");
  assertUnique(validatedTeachings, (item) => item.slug, "teaching slug");
  assertUnique(validatedTeachings, (item) => item.youtubeId, "YouTube ID");
  const validTopics = new Set(topics.map((item) => item.slug));
  for (const teaching of validatedTeachings) {
    for (const topic of teaching.topics) if (!validTopics.has(topic)) throw new Error(`unknown topic: ${topic}`);
  }
  if (input.site.canonicalOrigin !== "https://www.thelioncompany.org") throw new Error("canonical origin drifted");
  return true;
}

export function getDestination(key: DestinationKey) {
  const destination = destinationRegistry.find((item) => item.key === key && item.visible);
  if (!destination) throw new Error(`destination unavailable: ${key}`);
  return destination;
}

export function getTopicBySlug(slug: TopicSlug): TopicDefinition {
  const topic = topicDefinitions.find((item) => item.slug === slug);
  if (!topic) throw new Error(`topic unavailable: ${slug}`);
  return topic;
}

export function getTeachingBySlug(slug: string) {
  return teachings.find((teaching) => teaching.slug === slug);
}

export function getTeachingSlugs() {
  return teachings.map((teaching) => teaching.slug);
}

export function isTeachingEmbeddable(teaching: Teaching) {
  return teaching.captionsVerified && teaching.transcriptUrl !== null && new URL(teaching.transcriptUrl).origin === "https://www.thelioncompany.org";
}

export { type DestinationKey, type Destination, type TopicSlug, type TopicDefinition, type Teaching, type LiveSchedule, type RecentReplay, type PodcastEpisode, type SiteContent } from "./types";
```

- [ ] **Step 6: Add explicit snapshot refreshers and evidence the first-party media boundary**

Implement `scripts/refresh-podcast-snapshot.ts` with two mandatory modes. `--check` fetches the registry RSS URL, calls `fetchPodcastFeedForRefresh`, reports a stable added/changed/removed summary, writes nothing, and exits non-zero when the normalized feed differs from `content/podcast-fallback.ts`. `--write` performs the same schema and duplicate-slug validation, writes the complete deterministic TypeScript snapshot through a temporary file and atomic rename, then instructs the maintainer to review the Git diff and rerun tests. No default mode and no runtime/route import may fetch Podbean.

Implement `scripts/refresh-teaching-posters.ts` with the same `--check`/`--write` split. It derives one `public/images/teachings/<slug>.jpg` path from every manifest record, downloads only the corresponding still for a video on the verified ministry-owned channel, rejects redirects to an unapproved hostname, non-JPEG responses, files above 3 MB, missing dimensions, and partial sets, and never contacts YouTube from application code. `--check` is entirely local and verifies exact manifest/file parity plus matching ledger rows. After `--write`, inspect every still for correct content and crop, record its exact public source URL, dimensions, The Lion Company ownership evidence, allowed identifying use, transformation, alt-text decision, reviewer, and date in `docs/asset-ledger.csv`, then use `apply_patch` to record the reviewed rows.

Create `docs/content-evidence.md` with dated source rows for each claim that controls rendering: the verified ministry channel, each teaching ID/title, poster ownership, captions state, complete transcript/text-equivalent URL, podcast snapshot source, and Jonathan and Gina's public hosting/leadership evidence. Do not add a nonprofit/legal-status row unless authoritative current evidence is actually supplied. Prose in this document never enables a player: only a strict record in `content/evidence/teaching-transcript-reviews.json` whose identity, dates, review decision, and transcript SHA-256 pass `getTeachingReviewBundle` can derive `captionsVerified: true`. At least one featured teaching must meet that rule before the homepage facade can ship; otherwise the facade remains a direct YouTube action and the unresolved launch requirement blocks completion rather than being invented.

Run: `npm run refresh:teaching-posters -- --check && npm run refresh:podcast -- --check && npm run check:assets && npm run test:unit -- tests/unit/media-content.test.ts && npm run check:transcript-review`

Expected: all 32 local poster files match the manifest and ledger; the current checked-in podcast snapshot matches the normalized feed at refresh time; neither refresh check writes files. The media unit test passes by proving the selected teaching is safely direct-link-only while evidence is absent. `npm run check:transcript-review` exits non-zero with `authorized-human transcript review is pending` until the real complete listen-through is recorded. That explicit failure blocks embedding and release, not implementation of the homepage with its direct-link fallback. Any later episode requires `npm run refresh:podcast -- --write`, a reviewed diff, tests, and a new deployment before it is public.

- [ ] **Step 7: Run media, content, type, lint, and build checks**

Run: `npm run test:unit -- tests/unit/media-content.test.ts tests/unit/content-domain.test.ts && npm run typecheck && npm run lint && npm run build`

Expected: all commands exit 0; tests report 32 unique teachings, six represented topics, two parsed fixture episodes, the selected teaching safely ineligible/direct-link-only while human evidence is pending, 32 first-party posters, and a seven-item checked-in public podcast snapshot. The production build performs no Podcast RSS fetch and every public media route is prerendered from Git content. A fully evidenced embeddable featured teaching is required separately by `npm run check:transcript-review` before player activation or release.

- [ ] **Step 8: Commit the media content layer**

```bash
git add package.json package-lock.json content/teachings.ts content/transcripts content/evidence content/podcast-fallback.ts lib/content/index.ts lib/media scripts/check-transcript-review.mjs scripts/check-transcript-review.d.mts scripts/record-transcript-review.mjs scripts/refresh-podcast-snapshot.ts scripts/refresh-teaching-posters.ts public/images/teachings docs/asset-ledger.csv docs/content-evidence.md tests/fixtures/podbean-feed.xml tests/unit/media-content.test.ts tests/unit/transcript-review-gate.test.ts
git commit -m "feat: migrate teaching and podcast content"
```

### Task 5: Make legacy outcomes finite, testable, and one hop

**Files:**
- Create: `config/redirects.ts`
- Create: `lib/redirects.ts`
- Modify: `next.config.ts`
- Create: `app/[...path]/route.ts`
- Create: `docs/release/canonical-host.md`
- Create: `public/images/brand/lion-portrait.jpg`
- Modify: `docs/asset-ledger.csv`
- Create: `tests/unit/redirects.test.ts`
- Delete: `index.html`, `media.html`, `styles.css`, `app.js`, `p1.html`, `p2.html`, `p3.html`, `playlists_grid.html`, `all_playlists.txt`, `feed.xml`, `generate_html.py`, `get_yt.py`, `parse_playlists.py`, `parse_yt.py`, `lion_bg.jpg`, `apparel_bg.jpg`

**Interfaces:**
- Consumes: verified legacy paths from the approved specification and publicly served artifact inventory from production.
- Produces: `legacyRouteLedger`, `toNextRedirects()`, `getLegacyOutcome(path)`, one-hop 308 Next redirects, branded 410 responses for finite retired artifacts, and ordinary 404 fallthrough for unknown paths.

- [ ] **Step 1: Write the failing redirect contract**

```ts
// tests/unit/redirects.test.ts
import { legacyRouteLedger } from "@/config/redirects";
import { getLegacyOutcome, renderGoneHtml, toNextRedirects } from "@/lib/redirects";
import { describe, expect, it } from "vitest";

describe("legacy route ledger", () => {
  it("maps every equivalent route directly to its canonical target", () => {
    const redirects = toNextRedirects(legacyRouteLedger);
    expect(redirects).toContainEqual({ source: "/index.html", destination: "/", permanent: true });
    expect(redirects).toContainEqual({ source: "/MEDIA.HTML", destination: "/teachings", permanent: true });
    expect(redirects).toContainEqual({ source: "/product-page/the-lion-company-t-shirt", destination: "/store", permanent: true });
    expect(redirects.every((rule) => !rule.destination.includes("?"))).toBe(true);
  });

  it("distinguishes finite retired artifacts from unknown routes", () => {
    expect(getLegacyOutcome("/generate_html.py")?.statusCode).toBe(410);
    expect(getLegacyOutcome("/a-page-that-never-existed")).toBeUndefined();
    expect(renderGoneHtml("/generate_html.py")).toContain("This retired source artifact is no longer published");
  });
});
```

- [ ] **Step 2: Run the redirect test to verify it fails**

Run: `npm run test:unit -- tests/unit/redirects.test.ts`

Expected: FAIL because the redirect ledger and adapter do not exist.

- [ ] **Step 3: Add the authoritative redirect and gone ledger**

```ts
// config/redirects.ts
export type LegacyRoute =
  | { kind: "redirect"; source: string; destination: string; statusCode: 308; caseBehavior: "exact" | "recorded-variant"; preserveQuery: true; evidence: string; verifiedAt: string }
  | { kind: "gone"; source: string; statusCode: 410; caseBehavior: "exact"; preserveQuery: false; evidence: string; verifiedAt: string };

const redirect = (source: string, destination: string, caseBehavior: "exact" | "recorded-variant" = "exact"): LegacyRoute => ({
  kind: "redirect", source, destination, statusCode: 308, caseBehavior, preserveQuery: true,
  evidence: "verified production source and approved redesign specification", verifiedAt: "2026-07-11",
});
const gone = (source: string): LegacyRoute => ({
  kind: "gone", source, statusCode: 410, caseBehavior: "exact", preserveQuery: false,
  evidence: "public source or scraper artifact with no user-facing successor", verifiedAt: "2026-07-11",
});

export const legacyRouteLedger = [
  redirect("/index.html", "/"),
  redirect("/index.htm", "/"),
  redirect("/INDEX.HTML", "/", "recorded-variant"),
  redirect("/INDEX.HTM", "/", "recorded-variant"),
  redirect("/media.html", "/teachings"),
  redirect("/media", "/teachings"),
  redirect("/Media.html", "/teachings", "recorded-variant"),
  redirect("/MEDIA.HTML", "/teachings", "recorded-variant"),
  redirect("/Media", "/teachings", "recorded-variant"),
  redirect("/MEDIA", "/teachings", "recorded-variant"),
  redirect("/product-page/the-lion-company-t-shirt", "/store"),
  gone("/p1.html"),
  gone("/p2.html"),
  gone("/p3.html"),
  gone("/playlists_grid.html"),
  gone("/all_playlists.txt"),
  gone("/feed.xml"),
  gone("/generate_html.py"),
  gone("/get_yt.py"),
  gone("/parse_playlists.py"),
  gone("/parse_yt.py"),
  gone("/app.js"),
  gone("/styles.css"),
  gone("/lion_bg.jpg"),
  gone("/apparel_bg.jpg"),
] as const satisfies readonly LegacyRoute[];
```

- [ ] **Step 4: Implement the Next redirect adapter and branded 410 response**

```ts
// lib/redirects.ts
import { legacyRouteLedger, type LegacyRoute } from "../config/redirects";

export function toNextRedirects(ledger: readonly LegacyRoute[]) {
  return ledger.flatMap((rule) => rule.kind === "redirect"
    ? [{ source: rule.source, destination: rule.destination, permanent: true as const }]
    : []);
}

export function getLegacyOutcome(pathname: string, ledger: readonly LegacyRoute[] = legacyRouteLedger) {
  return ledger.find((rule) => rule.source === pathname);
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function renderGoneHtml(pathname: string) {
  const path = escapeHtml(pathname);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex"><title>Content retired | The Lion Company</title><style>body{margin:0;background:#f3e9d7;color:#24151f;font:1rem/1.6 system-ui,sans-serif}main{width:min(42rem,calc(100% - 2rem));margin:15vh auto}h1{font:400 clamp(3rem,10vw,6rem)/1 Georgia,serif}a{color:#964532;font-weight:700}</style></head><body><main><p>The Lion Company</p><h1>That file has been retired.</h1><p>This retired source artifact is no longer published: <code>${path}</code>.</p><p><a href="/">Return home</a> or <a href="/teachings">explore teachings</a>.</p></main></body></html>`;
}
```

```tsx
// app/[...path]/route.ts
import { legacyRouteLedger } from "@/config/redirects";
import { getLegacyOutcome, renderGoneHtml } from "@/lib/redirects";
import { notFound } from "next/navigation";

type Context = { params: Promise<{ path: string[] }> };

export async function GET(_request: Request, context: Context) {
  const { path } = await context.params;
  const pathname = `/${path.join("/")}`;
  const outcome = getLegacyOutcome(pathname, legacyRouteLedger);
  if (!outcome || outcome.kind !== "gone") notFound();
  return new Response(renderGoneHtml(pathname), {
    status: 410,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}

export async function HEAD(request: Request, context: Context) {
  const response = await GET(request, context);
  return new Response(null, { status: response.status, headers: response.headers });
}
```

- [ ] **Step 5: Wire redirects into the existing Next configuration**

```ts
// next.config.ts
import type { NextConfig } from "next";
import { legacyRouteLedger } from "./config/redirects";
import { toNextRedirects } from "./lib/redirects";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    sri: { algorithm: "sha256" },
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return toNextRedirects(legacyRouteLedger);
  },
};

export default nextConfig;
```

- [ ] **Step 6: Remove the obsolete web root and document external canonical-host control**

```bash
archive=/Users/jonathangibson/Documents/TheLionCompany-audit-artifacts/legacy-production-492ee8d41d
mkdir -p "$archive"
mkdir -p public/images/brand
cp lion_bg.jpg public/images/brand/lion-portrait.jpg
test "$(shasum -a 256 public/images/brand/lion-portrait.jpg | cut -d' ' -f1)" = "dffe51bfd3e6876973d6068ef5e702945c2b8da2e5a62631a0c11a6af2c8e6a4"
sips -g pixelWidth -g pixelHeight public/images/brand/lion-portrait.jpg
cp index.html media.html styles.css app.js p1.html p2.html p3.html playlists_grid.html all_playlists.txt feed.xml generate_html.py get_yt.py parse_playlists.py parse_yt.py lion_bg.jpg apparel_bg.jpg "$archive"/
shasum -a 256 "$archive"/*
git rm index.html media.html styles.css app.js p1.html p2.html p3.html playlists_grid.html all_playlists.txt feed.xml generate_html.py get_yt.py parse_playlists.py parse_yt.py lion_bg.jpg apparel_bg.jpg
```

Expected: the first-party hero copy reports exactly 1024 by 573 pixels and the approved SHA-256, then the audit archive contains immutable copies of every removed production-root file and the command prints a SHA-256 line for each copy before Git stages the removals.

Append this reviewed row to `docs/asset-ledger.csv` before the root file is removed:

```csv
public/images/brand/lion-portrait.jpg,production commit 492ee8d41d lion_bg.jpg,The Lion Company,added by owner commit 7183b003 and exact production SHA-256 dffe51bfd3e6876973d6068ef5e702945c2b8da2e5a62631a0c11a6af2c8e6a4,single decorative homepage hero use,1024,573,renamed only,decorative crop with empty alternative text,Codex provenance review,2026-07-11
```

Run: `npm run check:assets`

Expected: the ledger and copied image pass before `git rm`; later experience work uses this lion photograph exactly once and never repeats it as wallpaper.

```markdown
<!-- docs/release/canonical-host.md -->
# Canonical host control

The production canonical origin is `https://www.thelioncompany.org`.

In the existing Vercel project Domains settings:

1. Keep `www.thelioncompany.org` as the primary production domain.
2. Configure `thelioncompany.org` to redirect permanently to `https://www.thelioncompany.org`.
3. Keep Wix nameservers and all unrelated DNS records unchanged.
4. Do not create a repository redirect that points apex traffic through a second host.

Release verification runs:

```bash
curl -sSIL --max-redirs 0 http://thelioncompany.org/
curl -sSIL --max-redirs 0 https://thelioncompany.org/
curl -sSIL --max-redirs 0 http://www.thelioncompany.org/
curl -sSIL --max-redirs 0 https://www.thelioncompany.org/
```

The first three responses must be a single 308 whose `Location` is `https://www.thelioncompany.org/`; the fourth must be 200. Attach the dated headers to the release record before promotion.
```

- [ ] **Step 7: Run redirect, type, lint, and build checks**

Run: `npm run test:unit -- tests/unit/redirects.test.ts && npm run typecheck && npm run lint && npm run build`

Expected: all commands exit 0; build lists the catch-all route as dynamic while public page routes remain prerendered; no legacy source file remains in the deployment root.

- [ ] **Step 8: Commit the migration boundary**

```bash
git add config/redirects.ts lib/redirects.ts next.config.ts 'app/[...path]/route.ts' docs/release/canonical-host.md public/images/brand/lion-portrait.jpg docs/asset-ledger.csv tests/unit/redirects.test.ts
git commit -m "feat: preserve legacy routes and retire source artifacts"
```

### Task 6: Build canonical metadata, supported schema, and semantic chrome

**Files:**
- Create: `lib/seo/metadata.ts`
- Create: `lib/seo/schema.ts`
- Create: `components/server/json-ld.tsx`
- Create: `components/server/site-header.tsx`
- Create: `components/server/site-footer.tsx`
- Create: `components/server/page-intro.tsx`
- Modify: `app/layout.tsx`
- Create: `tests/unit/seo-primitives.test.ts`

**Interfaces:**
- Consumes: `siteContent`, `activeSameAs`, typed destinations, teachings, and podcast episode types.
- Produces: `createPageMetadata({ title, description, path, image?, noIndex? }): Metadata`, `canonicalUrl(path): string`, JSON-LD builders `organizationSchema`, `websiteSchema`, `webPageSchema`, `breadcrumbSchema`, `videoSchema`, `podcastSeriesSchema`, and `podcastEpisodeSchema`, plus semantic `SiteHeader`, `SiteFooter`, `PageIntro`, and `JsonLd` components.

- [ ] **Step 1: Write the failing metadata and schema tests**

```ts
// tests/unit/seo-primitives.test.ts
import { teachings } from "@/content/teachings";
import { activeSameAs } from "@/content/destinations";
import { canonicalUrl, createPageMetadata } from "@/lib/seo/metadata";
import { organizationSchema, videoSchema } from "@/lib/seo/schema";
import { describe, expect, it } from "vitest";

describe("SEO primitives", () => {
  it("creates a clean www canonical and absolute social image", () => {
    const metadata = createPageMetadata({
      title: "Start here",
      description: "Meet The Lion Company and understand its mission, practices, and Jesus-centered call to relationship.",
      path: "/start-here?utm_source=test",
    });
    expect(canonicalUrl("/start-here?utm_source=test")).toBe("https://www.thelioncompany.org/start-here");
    expect(metadata.alternates?.canonical).toBe("https://www.thelioncompany.org/start-here");
    expect(metadata.openGraph?.images).toEqual(expect.arrayContaining([expect.objectContaining({ width: 1200, height: 630 })]));
  });

  it("uses only centralized active profiles for Organization sameAs", () => {
    expect(organizationSchema().sameAs).toEqual(activeSameAs);
  });

  it("omits VideoObject until visible accessibility evidence exists", () => {
    expect(videoSchema(teachings[0])).toBeNull();
  });
});
```

- [ ] **Step 2: Run the SEO primitive test to verify it fails**

Run: `npm run test:unit -- tests/unit/seo-primitives.test.ts`

Expected: FAIL because `lib/seo/metadata` and `lib/seo/schema` do not exist.

- [ ] **Step 3: Add canonical metadata and structured-data builders**

```ts
// lib/seo/metadata.ts
import type { Metadata } from "next";
import { siteContent } from "@/content/site";

export function canonicalUrl(path: string) {
  const url = new URL(path, siteContent.canonicalOrigin);
  url.search = "";
  url.hash = "";
  if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/$/, "");
  return url.toString();
}

export function createPageMetadata(input: {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const canonical = canonicalUrl(input.path);
  const socialTitle = input.title === siteContent.homeTitle ? input.title : `${input.title} | ${siteContent.name}`;
  const image = canonicalUrl(input.image ?? "/opengraph-image");
  const index = !input.noIndex && process.env.VERCEL_ENV === "production";
  return {
    title: input.title === siteContent.homeTitle ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: { canonical },
    robots: index ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type: "website",
      locale: siteContent.locale,
      siteName: siteContent.name,
      title: socialTitle,
      description: input.description,
      url: canonical,
      images: [{ url: image, width: 1200, height: 630, alt: `${siteContent.name} — The Gathering` }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: input.description,
      images: [image],
    },
  };
}
```

```ts
// lib/seo/schema.ts
import { activeSameAs } from "@/content/destinations";
import { siteContent } from "@/content/site";
import { getDestination, isTeachingEmbeddable } from "@/lib/content";
import type { PodcastEpisode, Teaching } from "@/lib/content/types";
import { canonicalUrl } from "./metadata";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteContent.canonicalOrigin}/#organization`,
    name: siteContent.name,
    url: `${siteContent.canonicalOrigin}/`,
    description: siteContent.homeDescription,
    areaServed: "Worldwide",
    sameAs: activeSameAs,
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteContent.canonicalOrigin}/#website`,
    name: siteContent.name,
    url: `${siteContent.canonicalOrigin}/`,
    publisher: { "@id": `${siteContent.canonicalOrigin}/#organization` },
    inLanguage: "en-US",
  };
}

export function webPageSchema(input: { path: string; title: string; description: string }) {
  const url = canonicalUrl(input.path);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: input.title,
    description: input.description,
    isPartOf: { "@id": `${siteContent.canonicalOrigin}/#website` },
    about: { "@id": `${siteContent.canonicalOrigin}/#organization` },
    inLanguage: "en-US",
  };
}

export function breadcrumbSchema(items: readonly { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}

export function videoSchema(teaching: Teaching) {
  if (!isTeachingEmbeddable(teaching) || !teaching.publishedAt) return null;
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: teaching.title,
    description: teaching.summary,
    uploadDate: teaching.publishedAt,
    thumbnailUrl: canonicalUrl(teaching.posterPath),
    contentUrl: `https://www.youtube.com/watch?v=${teaching.youtubeId}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${teaching.youtubeId}`,
    accessibilityFeature: ["captions", "transcript"],
  };
}

export function podcastSeriesSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "PodcastSeries",
    "@id": `${siteContent.canonicalOrigin}/podcast#series`,
    name: "The Lion Company Podcast",
    description: "Raw, faith-filled conversations about relationships, purpose, discipleship, and following Jesus in real life.",
    url: canonicalUrl("/podcast"),
    webFeed: getDestination("podcastRss").href,
    sameAs: [getDestination("applePodcasts").href, getDestination("spotify").href, getDestination("podbean").href],
  };
}

export function podcastEpisodeSchema(episode: PodcastEpisode) {
  return {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: episode.title,
    description: episode.description,
    datePublished: episode.publishedAt,
    url: canonicalUrl(`/podcast/${episode.slug}`),
    partOfSeries: { "@id": `${siteContent.canonicalOrigin}/podcast#series` },
    ...(episode.episodeNumber ? { episodeNumber: episode.episodeNumber } : {}),
  };
}
```

- [ ] **Step 4: Add the safe JSON-LD renderer and semantic server shells**

```tsx
// components/server/json-ld.tsx
export function JsonLd({ id, data }: { id: string; data: object | readonly object[] }) {
  const json = JSON.stringify(data).replaceAll("<", "\\u003c");
  return <script id={id} type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
```

```tsx
// components/server/site-header.tsx
import Link from "next/link";
import { siteContent } from "@/content/site";
import { getDestination } from "@/lib/content";

export function SiteHeader() {
  return (
    <header>
      <div className="shell cluster">
        <Link href="/" aria-label="The Lion Company home">The Lion Company</Link>
        <nav aria-label="Primary navigation">
          <ul className="cluster">
            {siteContent.navigation.map((item) => <li key={item.href}><Link href={item.href}>{item.label}</Link></li>)}
          </ul>
        </nav>
        <a className="button" href={getDestination("subsplash").href} rel="noreferrer">Give</a>
      </div>
    </header>
  );
}
```

```tsx
// components/server/site-footer.tsx
import Link from "next/link";
import { destinationRegistry } from "@/content/destinations";
import { siteContent } from "@/content/site";

export function SiteFooter() {
  const publicDestinations = destinationRegistry.filter((item) => item.visible && item.kind !== "feed");
  return (
    <footer className="section">
      <div className="shell">
        <p className="eyebrow">{siteContent.location}</p>
        <p>{siteContent.missionStatement}</p>
        <nav aria-label="External channels"><ul>{publicDestinations.map((item) => <li key={item.key}><a href={item.href} rel="noreferrer">{item.label}: {item.purpose}</a></li>)}</ul></nav>
        <nav aria-label="Policies"><ul className="cluster"><li><Link href="/privacy">Privacy</Link></li><li><Link href="/terms">Terms</Link></li><li><Link href="/accessibility">Accessibility</Link></li><li><Link href="/connect">Contact</Link></li></ul></nav>
      </div>
    </footer>
  );
}
```

```tsx
// components/server/page-intro.tsx
import type { ReactNode } from "react";

export function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return <header className="section shell"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><div>{children}</div></header>;
}
```

- [ ] **Step 5: Upgrade the root layout with subset fonts, metadata defaults, and landmarks**

```tsx
// app/layout.tsx
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Instrument_Serif, Manrope } from "next/font/google";
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
  title: { default: siteContent.homeTitle, template: `%s | ${siteContent.name}` },
  description: siteContent.homeDescription,
  robots: production ? { index: true, follow: true } : { index: false, follow: false },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#24151f",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Run SEO primitives, type, lint, and build checks**

Run: `npm run test:unit -- tests/unit/seo-primitives.test.ts && npm run typecheck && npm run lint && npm run build`

Expected: all commands exit 0; no `VideoObject` is emitted for unverified teaching entries and preview metadata is noindex by default.

- [ ] **Step 7: Commit SEO primitives and semantic chrome**

```bash
git add lib/seo components/server app/layout.tsx tests/unit/seo-primitives.test.ts
git commit -m "feat: add canonical metadata and schema foundation"
```

### Task 7: Publish the core, teaching, and podcast route shells

**Files:**
- Modify: `app/page.tsx`
- Create: `app/start-here/page.tsx`
- Create: `app/live/page.tsx`
- Create: `app/store/page.tsx`
- Create: `app/give/page.tsx`
- Create: `components/server/teaching-card.tsx`
- Create: `app/teachings/page.tsx`
- Create: `app/teachings/[slug]/page.tsx`
- Create: `components/server/podcast-card.tsx`
- Create: `app/podcast/page.tsx`
- Create: `app/podcast/[slug]/page.tsx`
- Create: `tests/unit/route-shells.test.ts`

**Interfaces:**
- Consumes: typed content/selectors, synchronous checked-in podcast snapshot selector, semantic chrome, metadata helpers, and JSON-LD builders from Tasks 3–6.
- Produces: prerenderable `/`, `/start-here`, `/live`, `/store`, `/give`, `/teachings`, `/teachings/[slug]`, `/podcast`, and `/podcast/[slug]`; `TeachingCard({ teaching })`; `PodcastCard({ episode })`; static-param generators for every current detail record.

- [ ] **Step 1: Write the failing route-shell contract**

```ts
// tests/unit/route-shells.test.ts
import { existsSync, readFileSync } from "node:fs";
import { teachings } from "@/content/teachings";
import { podcastFallback } from "@/content/podcast-fallback";
import { describe, expect, it } from "vitest";

const routes = [
  "app/page.tsx", "app/start-here/page.tsx", "app/live/page.tsx", "app/store/page.tsx",
  "app/give/page.tsx", "app/teachings/page.tsx", "app/teachings/[slug]/page.tsx",
  "app/podcast/page.tsx", "app/podcast/[slug]/page.tsx",
];

describe("server-rendered route shells", () => {
  it("creates every foundation route", () => {
    for (const route of routes) expect(existsSync(route), route).toBe(true);
  });

  it("preserves every meaningful legacy homepage fragment", () => {
    const home = readFileSync("app/page.tsx", "utf8");
    for (const id of ["mission", "podcast", "media", "prayer", "store", "contact", "newsletter"]) {
      expect(home).toContain(`id="${id}"`);
    }
  });

  it("has static detail data for every current archive record", () => {
    expect(teachings.map((item) => item.slug)).toHaveLength(32);
    expect(podcastFallback.map((item) => item.slug)).toHaveLength(7);
  });
});
```

- [ ] **Step 2: Run the route test to verify it fails**

Run: `npm run test:unit -- tests/unit/route-shells.test.ts`

Expected: FAIL because the new core and archive route files do not exist.

- [ ] **Step 3: Replace the initial home shell with the complete semantic journey**

```tsx
// app/page.tsx
import Link from "next/link";
import { JsonLd } from "@/components/server/json-ld";
import { podcastFallback } from "@/content/podcast-fallback";
import { siteContent } from "@/content/site";
import { teachings } from "@/content/teachings";
import { getDestination } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo/metadata";
import { organizationSchema, webPageSchema, websiteSchema } from "@/lib/seo/schema";

export const metadata = createPageMetadata({ title: siteContent.homeTitle, description: siteContent.homeDescription, path: "/" });

export default function HomePage() {
  const featured = teachings.filter((item) => item.featured);
  const latestPodcast = podcastFallback[0];
  return (
    <>
      <JsonLd id="home-identity" data={[organizationSchema(), websiteSchema(), webPageSchema({ path: "/", title: siteContent.homeTitle, description: siteContent.homeDescription })]} />
      <section className="section shell" aria-labelledby="home-title">
        <p className="eyebrow">Seen → Gathered → Formed → Sent</p>
        <h1 id="home-title">{siteContent.foundationalQuote}</h1>
        <p>Many lives. One center: Jesus. Come participate, not merely consume.</p>
        <div className="cluster"><a className="button" href={getDestination("tiktok").href}>Join today&apos;s live</a><Link className="button" data-variant="quiet" href="/start-here">Start here</Link></div>
      </section>

      <section className="section shell" aria-labelledby="participate-title">
        <p className="eyebrow">A place to participate</p><h2 id="participate-title">Bring your whole life toward Jesus.</h2>
        <ul><li><Link href="/teachings">Watch a teaching</Link></li><li><Link href="/prayer">Ask for prayer</Link></li><li><Link href="/start-here">Grow in relationship</Link></li><li><Link href="/give">Support the mission</Link></li></ul>
      </section>

      <section id="mission" className="section shell" aria-labelledby="mission-title">
        <p className="eyebrow">Gathered around Jesus</p><h2 id="mission-title">{siteContent.missionHeading}</h2><p>{siteContent.missionStatement}</p>
        {siteContent.pillars.map((pillar) => <article key={pillar.title}><h3>{pillar.title}</h3><p>{pillar.body}</p></article>)}
        <Link href="/start-here">Read the story and practices</Link>
      </section>

      <section id="podcast" className="section shell" aria-labelledby="podcast-title">
        <p className="eyebrow">Listen</p><h2 id="podcast-title">The Lion Company Podcast</h2><h3>{latestPodcast.title}</h3><p>{latestPodcast.description}</p>
        <div className="cluster"><Link href={`/podcast/${latestPodcast.slug}`}>Read episode notes</Link><Link href="/podcast">Explore every episode</Link></div>
      </section>

      <section id="media" className="section shell" aria-labelledby="media-title">
        <p className="eyebrow">Watch and learn</p><h2 id="media-title">Teachings for what you are carrying</h2>
        {featured.map((teaching) => <article key={teaching.slug}><h3><Link href={`/teachings/${teaching.slug}`}>{teaching.title}</Link></h3><p>{teaching.summary}</p></article>)}
        <div className="cluster"><Link href="/teachings">Browse the teaching library</Link><a href={getDestination("youtube").href}>Explore hundreds of teachings on YouTube</a></div>
      </section>

      <section id="prayer" className="section shell" aria-labelledby="prayer-title">
        <p className="eyebrow">You do not have to carry it alone</p><h2 id="prayer-title">How can we pray with you?</h2><p>Your request can be anonymous. The dedicated prayer page explains who receives it, how it is handled, and how to request follow-up separately.</p><Link href="/prayer">Share a private prayer request</Link>
      </section>

      <section id="store" className="section shell" aria-labelledby="store-title">
        <p className="eyebrow">Wear the vision</p><h2 id="store-title">Carry the conversation into everyday life.</h2><p>Explore real Lion Company merchandise and the complete catalog through the ministry&apos;s Printify store.</p><Link href="/store">Visit the store story</Link>
      </section>

      <section id="contact" className="section shell" aria-labelledby="contact-title">
        <p className="eyebrow">Connection network</p><h2 id="contact-title">Choose the channel that fits the conversation.</h2><p>Find daily live teaching, long-form video, podcast listening, ministry updates, speaking and partnership inquiries, and a general contact path.</p><Link href="/connect">See every way to connect</Link>
      </section>

      <section id="newsletter" className="section shell" aria-labelledby="newsletter-title">
        <p className="eyebrow">Monthly field notes</p><h2 id="newsletter-title">One thoughtful letter each month.</h2><p>Receive one monthly teaching, the current live schedule, new resources and podcast releases, ministry updates, and occasional store or support news.</p><Link href="/connect#newsletter">Join with double opt-in</Link>
      </section>

      <section className="section shell" aria-labelledby="final-title">
        <h2 id="final-title">What is your next faithful step?</h2><div className="cluster"><Link href="/teachings">Begin with a teaching</Link><Link href="/prayer">Submit a prayer request</Link><Link href="/connect#newsletter">Join the monthly letter</Link><Link href="/give">Support the mission</Link></div>
      </section>
    </>
  );
}
```

- [ ] **Step 4: Add the mission, live, store, and giving routes**

```tsx
// app/start-here/page.tsx
import Link from "next/link";
import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { siteContent } from "@/content/site";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";

const description = "Meet The Lion Company and understand its Jesus-centered mission, practices, public teaching, and call to relationship.";
export const metadata = createPageMetadata({ title: "Start here", description, path: "/start-here" });

export default function StartHerePage() {
  return (
    <>
      <JsonLd id="start-here-schema" data={[webPageSchema({ path: "/start-here", title: "Start here", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Start here", path: "/start-here" }])]} />
      <PageIntro eyebrow="The gathering" title="A ministry centered on becoming like Jesus."><p>{siteContent.missionStatement}</p></PageIntro>
      <section className="section shell" aria-labelledby="story-title"><h2 id="story-title">How this work took shape</h2><p>{siteContent.story}</p><p>This first release does not invent a founding date, founder biography, or private milestone history. Those details are added only when an owner-approved source is recorded with the content evidence.</p></section>
      <section className="section shell" aria-labelledby="practices-title"><h2 id="practices-title">Love. Relationship. Discipleship. Education.</h2>{siteContent.pillars.map((pillar) => <article key={pillar.title}><h3>{pillar.title}</h3><p>{pillar.body}</p></article>)}</section>
      <section className="section shell" aria-labelledby="leadership-title"><h2 id="leadership-title">Leadership and public voices</h2><p>The current production record names Jonathan Gibson as the ministry&apos;s public contact. Jonathan and Gina host public Lion Company podcast conversations. No board role, staff title, biography, or governance claim is published until the owner supplies an authoritative source and approves the exact copy.</p><div className="cluster"><Link href="/podcast">Hear the public conversations</Link><Link href="/connect">Contact the ministry</Link></div></section>
      <section className="section shell" aria-labelledby="transparency-title"><h2 id="transparency-title">How the ministry is supported and held accountable</h2><p>The Lion Company is {siteContent.location.toLowerCase()} and is sustained by voluntary givers. Giving is optional, teaching and prayer remain available without pressure, and Subsplash handles payment and receipt details outside this website.</p><p>The public teaching archive lets visitors examine ministry content directly. The privacy policy names processors, retention, and data rights; the terms explain use of the site. Legal and tax-status details are published only after an authorized reviewer records the legal name and current authoritative verification source. No EIN, board list, allocation percentage, or financial claim is guessed.</p><div className="cluster"><Link href="/teachings">Examine public teachings</Link><Link href="/privacy">Read the privacy policy</Link><Link href="/terms">Read the terms</Link><Link href="/give">Learn about voluntary giving</Link><Link href="/connect">Request organizational information</Link></div></section>
    </>
  );
}
```

```tsx
// app/live/page.tsx
import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { liveSchedule, recentReplay } from "@/content/live";
import { getDestination } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";

const description = "Find The Lion Company's daily TikTok teaching and the honest current or next live state when a schedule has been verified.";
export const metadata = createPageMetadata({ title: "Daily live teaching", description, path: "/live" });

export default function LivePage() {
  const tiktok = getDestination("tiktok");
  return <><JsonLd id="live-schema" data={[webPageSchema({ path: "/live", title: "Daily live teaching", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Live", path: "/live" }])]} /><PageIntro eyebrow="Daily discipleship" title="Live daily on TikTok"><p>The ministry has not published a verified exact time for today, so this page will not invent a countdown or claim to be live.</p><a className="button" href={tiktok.href}>See today&apos;s live on TikTok</a></PageIntro><section className="section shell" aria-live="polite"><h2>Current schedule</h2>{liveSchedule ? <p>A verified schedule record is available and the client status island will derive its display state from that record.</p> : <p>Follow the verified TikTok profile for the current start time and notification controls.</p>}{recentReplay ? <p><a href={recentReplay.url}>{recentReplay.title}</a></p> : <p>No unexpired replay has been verified for this page.</p>}</section></>;
}
```

```tsx
// app/store/page.tsx
import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { getDestination } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";

const description = "Explore The Lion Company merchandise and continue to the ministry's complete Printify catalog.";
export const metadata = createPageMetadata({ title: "Store", description, path: "/store" });
export default function StorePage() { const store = getDestination("printify"); return <><JsonLd id="store-schema" data={[webPageSchema({ path: "/store", title: "Store", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Store", path: "/store" }])]} /><PageIntro eyebrow="Wear the vision" title="Objects that carry the conversation."><p>Merchandise is presented in its approved context. Purchases support the ministry without an unverified allocation claim.</p><a className="button" href={store.href}>View the complete Printify catalog</a></PageIntro></>; }
```

```tsx
// app/give/page.tsx
import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { getDestination } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";

const description = "Support The Lion Company's ministry through its existing secure Subsplash giving destination.";
export const metadata = createPageMetadata({ title: "Give", description, path: "/give" });
export default function GivePage() { const giving = getDestination("subsplash"); return <><JsonLd id="give-schema" data={[webPageSchema({ path: "/give", title: "Give", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Give", path: "/give" }])]} /><PageIntro eyebrow="Support the mission" title="Help make room for teaching, prayer, and connection."><p>Giving continues through the ministry&apos;s existing secure Subsplash page. The website does not replace that provider or make an allocation promise it cannot verify.</p><a className="button" href={giving.href}>Continue to secure giving</a></PageIntro></>; }
```

- [ ] **Step 5: Add crawlable teaching list and detail routes**

```tsx
// components/server/teaching-card.tsx
import Link from "next/link";
import type { Teaching } from "@/lib/content/types";

export function TeachingCard({ teaching }: { teaching: Teaching }) {
  return <article><p className="eyebrow">{teaching.series ?? "Teaching"}</p><h2><Link href={`/teachings/${teaching.slug}`}>{teaching.title}</Link></h2><p>{teaching.summary}</p><ul className="cluster">{teaching.topics.map((topic) => <li key={topic}>{topic.replaceAll("-", " ")}</li>)}</ul></article>;
}
```

```tsx
// app/teachings/page.tsx
import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { TeachingCard } from "@/components/server/teaching-card";
import { teachings } from "@/content/teachings";
import { getDestination } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";

const description = "Explore The Lion Company's crawlable teaching archive by relationships, purpose, prayer, trust, church reform, and courageous truth.";
export const metadata = createPageMetadata({ title: "Teachings", description, path: "/teachings" });
export default function TeachingsPage() { return <><JsonLd id="teachings-schema" data={[webPageSchema({ path: "/teachings", title: "Teachings", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Teachings", path: "/teachings" }])]} /><PageIntro eyebrow="What are you carrying today?" title="A teaching path for the life in front of you."><p>Browse 32 verified archive entries here, or continue to the channel for hundreds of public teachings and Shorts.</p><a href={getDestination("youtube").href}>Explore hundreds of teachings on YouTube</a></PageIntro><section className="section shell" aria-label="Teaching library">{teachings.map((teaching) => <TeachingCard key={teaching.slug} teaching={teaching} />)}</section></>; }
```

```tsx
// app/teachings/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { getTeachingBySlug, getTeachingSlugs, isTeachingEmbeddable } from "@/lib/content";
import { getTeachingReviewBundle } from "@/lib/media/transcripts.server";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, videoSchema, webPageSchema } from "@/lib/seo/schema";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return getTeachingSlugs().map((slug) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { slug } = await params; const teaching = getTeachingBySlug(slug); if (!teaching) return {}; return createPageMetadata({ title: teaching.title, description: teaching.summary, path: `/teachings/${slug}` }); }

export default async function TeachingDetailPage({ params }: Props) {
  const { slug } = await params; const baseTeaching = getTeachingBySlug(slug); if (!baseTeaching) notFound();
  const reviewed = getTeachingReviewBundle(baseTeaching); const teaching = reviewed.teaching;
  const video = videoSchema(teaching);
  return <><JsonLd id="teaching-schema" data={[webPageSchema({ path: `/teachings/${slug}`, title: teaching.title, description: teaching.summary }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Teachings", path: "/teachings" }, { name: teaching.title, path: `/teachings/${slug}` }]), ...(video ? [video] : [])]} /><PageIntro eyebrow={teaching.series ?? "Teaching"} title={teaching.title}><p>{teaching.summary}</p></PageIntro><section className="section shell"><h2>Watch and continue</h2>{isTeachingEmbeddable(teaching) ? <p>Captions and a complete transcript are verified for this teaching.</p> : <p>This archive record does not yet have verified captions and a complete transcript path, so the site does not load an embedded player.</p>}<div className="cluster"><a className="button" href={`https://www.youtube.com/watch?v=${teaching.youtubeId}`}>Watch directly on YouTube</a><Link href="/teachings">Back to all teachings</Link></div></section>{reviewed.transcript ? <section className="section shell" id="transcript" aria-labelledby="transcript-title"><h2 id="transcript-title">Complete transcript</h2>{reviewed.transcript.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</section> : null}</>;
}
```

- [ ] **Step 6: Add crawlable podcast list and detail routes**

```tsx
// components/server/podcast-card.tsx
import Link from "next/link";
import type { PodcastEpisode } from "@/lib/content/types";

export function PodcastCard({ episode }: { episode: PodcastEpisode }) {
  return <article><p className="eyebrow">{episode.episodeNumber ? `Episode ${episode.episodeNumber}` : "Podcast episode"}</p><h2><Link href={`/podcast/${episode.slug}`}>{episode.title}</Link></h2><p>{episode.description}</p><time dateTime={episode.publishedAt}>{new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(episode.publishedAt))}</time></article>;
}
```

```tsx
// app/podcast/page.tsx
import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { PodcastCard } from "@/components/server/podcast-card";
import { getDestination } from "@/lib/content";
import { getPublishedPodcastEpisodes } from "@/lib/media/podcast-feed";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, podcastSeriesSchema, webPageSchema } from "@/lib/seo/schema";

const description = "Listen to The Lion Company Podcast and explore faith-filled conversations about relationships, purpose, discipleship, and real life.";
export const metadata = createPageMetadata({ title: "Podcast", description, path: "/podcast" });
export default function PodcastPage() { const episodes = getPublishedPodcastEpisodes(); return <><JsonLd id="podcast-schema" data={[webPageSchema({ path: "/podcast", title: "Podcast", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Podcast", path: "/podcast" }]), podcastSeriesSchema()]} /><PageIntro eyebrow="Watch and listen" title="Raw conversations where faith meets real life."><p>Choose a verified platform or read the checked episode notes on this site.</p><div className="cluster"><a href={getDestination("applePodcasts").href}>Apple Podcasts</a><a href={getDestination("spotify").href}>Spotify</a><a href={getDestination("podbean").href}>Podbean</a><a href={getDestination("podcastRss").href}>RSS</a><a href={getDestination("youtube").href}>YouTube</a></div></PageIntro><section className="section shell" aria-label="Podcast episodes">{episodes.map((episode) => <PodcastCard key={episode.slug} episode={episode} />)}</section></>; }
```

```tsx
// app/podcast/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { getDestination } from "@/lib/content";
import { getPublishedPodcastEpisodes } from "@/lib/media/podcast-feed";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, podcastEpisodeSchema, webPageSchema } from "@/lib/seo/schema";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return getPublishedPodcastEpisodes().map((episode) => ({ slug: episode.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { slug } = await params; const episode = getPublishedPodcastEpisodes().find((item) => item.slug === slug); if (!episode) return {}; return createPageMetadata({ title: episode.title, description: episode.description, path: `/podcast/${slug}` }); }
export default async function PodcastEpisodePage({ params }: Props) { const { slug } = await params; const episode = getPublishedPodcastEpisodes().find((item) => item.slug === slug); if (!episode) notFound(); return <><JsonLd id="podcast-episode-schema" data={[webPageSchema({ path: `/podcast/${slug}`, title: episode.title, description: episode.description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Podcast", path: "/podcast" }, { name: episode.title, path: `/podcast/${slug}` }]), podcastEpisodeSchema(episode)]} /><PageIntro eyebrow={episode.episodeNumber ? `Episode ${episode.episodeNumber}` : "Podcast episode"} title={episode.title}><p>{episode.description}</p><time dateTime={episode.publishedAt}>{new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(episode.publishedAt))}</time></PageIntro><section className="section shell"><h2>Listen on your preferred platform</h2><p>{episode.transcriptUrl ? <a href={episode.transcriptUrl}>Read the complete transcript</a> : "A complete transcript has not been verified, so the site does not embed an audio player."}</p><div className="cluster"><a className="button" href={episode.pageUrl}>Open this episode on Podbean</a><a href={getDestination("applePodcasts").href}>Apple Podcasts</a><a href={getDestination("spotify").href}>Spotify</a><a href={getDestination("podcastRss").href}>RSS</a><a href={getDestination("youtube").href}>YouTube</a><Link href="/podcast">All episodes</Link></div></section></>; }
```

- [ ] **Step 7: Run route, content, type, lint, and production-build checks**

Run: `npm run test:unit -- tests/unit/route-shells.test.ts tests/unit/media-content.test.ts && npm run typecheck && npm run lint && npm run build`

Expected: all commands exit 0; build marks all core pages, all 32 teaching details, and all seven checked-in podcast details as prerendered without contacting RSS.

- [ ] **Step 8: Commit the route shells**

```bash
git add app/page.tsx app/start-here app/live app/store app/give app/teachings app/podcast components/server/teaching-card.tsx components/server/podcast-card.tsx tests/unit/route-shells.test.ts
git commit -m "feat: publish core teaching and podcast routes"
```

### Task 8: Publish technical SEO resources and prove the integrated foundation

**Files:**
- Create: `config/routes.ts`
- Create: `app/robots.ts`
- Create: `app/sitemap.ts`
- Create: `app/manifest.ts`
- Create: `app/not-found.tsx`
- Create: `app/opengraph-image.tsx`
- Create: `app/icon.tsx`
- Create: `app/apple-icon.tsx`
- Modify: `playwright.config.ts`
- Create: `tests/unit/technical-seo.test.ts`
- Create: `tests/e2e/foundation.spec.ts`

**Interfaces:**
- Consumes: canonical URL helper, current teaching and podcast records, redirect/410 behavior, and all implemented route shells.
- Produces: `indexableStaticRoutes`, `createRobots(production)`, `createSitemap(episodes)`, `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, generated 1200x630 Open Graph art, generated icons, branded real 404 UI, and the browser contract used before experience/forms work begins.

- [ ] **Step 1: Write the failing technical-SEO unit contract**

```ts
// tests/unit/technical-seo.test.ts
import { podcastFallback } from "@/content/podcast-fallback";
import { teachings } from "@/content/teachings";
import { indexableStaticRoutes } from "@/config/routes";
import manifest from "@/app/manifest";
import { createRobots } from "@/app/robots";
import { createSitemap } from "@/app/sitemap";
import { describe, expect, it } from "vitest";

describe("technical SEO resources", () => {
  it("allows canonical production crawling and blocks previews", () => {
    expect(createRobots(true)).toMatchObject({ host: "https://www.thelioncompany.org", sitemap: "https://www.thelioncompany.org/sitemap.xml" });
    expect(createRobots(false)).toMatchObject({ rules: { userAgent: "*", disallow: "/" } });
  });

  it("lists every and only implemented canonical indexable route", () => {
    const sitemap = createSitemap(podcastFallback);
    const urls = sitemap.map((entry) => entry.url);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toHaveLength(indexableStaticRoutes.length + teachings.length + podcastFallback.length);
    expect(urls.every((url) => url.startsWith("https://www.thelioncompany.org/"))).toBe(true);
    expect(urls.some((url) => url.includes("/newsletter/"))).toBe(false);
  });

  it("publishes the Gathering manifest colors and generated icon", () => {
    expect(manifest()).toMatchObject({ name: "The Lion Company", theme_color: "#24151f", background_color: "#f3e9d7" });
    expect(manifest().icons).toContainEqual({ src: "/icon", sizes: "32x32", type: "image/png" });
  });
});
```

- [ ] **Step 2: Run the technical-SEO test to verify it fails**

Run: `npm run test:unit -- tests/unit/technical-seo.test.ts`

Expected: FAIL because the route registry and metadata resource modules do not exist.

- [ ] **Step 3: Add the implemented-route registry, robots, sitemap, and manifest**

```ts
// config/routes.ts
export const indexableStaticRoutes = [
  "/",
  "/start-here",
  "/live",
  "/teachings",
  "/podcast",
  "/store",
  "/give",
] as const;
```

```ts
// app/robots.ts
import type { MetadataRoute } from "next";
import { siteContent } from "@/content/site";

export function createRobots(production: boolean): MetadataRoute.Robots {
  if (!production) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/newsletter/"] },
    sitemap: `${siteContent.canonicalOrigin}/sitemap.xml`,
    host: siteContent.canonicalOrigin,
  };
}

export default function robots(): MetadataRoute.Robots {
  return createRobots(process.env.VERCEL_ENV === "production");
}
```

```ts
// app/sitemap.ts
import type { MetadataRoute } from "next";
import { teachings } from "@/content/teachings";
import { indexableStaticRoutes } from "@/config/routes";
import type { PodcastEpisode } from "@/lib/content/types";
import { getPublishedPodcastEpisodes } from "@/lib/media/podcast-feed";
import { canonicalUrl } from "@/lib/seo/metadata";

export function createSitemap(episodes: readonly PodcastEpisode[]): MetadataRoute.Sitemap {
  return [
    ...indexableStaticRoutes.map((path) => ({ url: canonicalUrl(path) })),
    ...teachings.map((teaching) => ({ url: canonicalUrl(`/teachings/${teaching.slug}`) })),
    ...episodes.map((episode) => ({ url: canonicalUrl(`/podcast/${episode.slug}`) })),
  ];
}

export default function sitemap(): MetadataRoute.Sitemap {
  return createSitemap(getPublishedPodcastEpisodes());
}
```

```ts
// app/manifest.ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Lion Company",
    short_name: "Lion Company",
    description: "Christian unity, authentic discipleship, teaching, prayer, and connection centered on Jesus.",
    start_url: "/",
    display: "minimal-ui",
    background_color: "#f3e9d7",
    theme_color: "#24151f",
    icons: [{ src: "/icon", sizes: "32x32", type: "image/png" }],
  };
}
```

- [ ] **Step 4: Add the branded 404, social image, and generated icons**

```tsx
// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return <section className="section shell"><p className="eyebrow">404 · Outside the gathered path</p><h1>This page is not here.</h1><p>The teaching, conversation, or resource may have moved. Choose a real path back into the gathering.</p><div className="cluster"><Link className="button" href="/">Return home</Link><Link href="/teachings">Explore teachings</Link><Link href="/podcast">Listen to the podcast</Link></div></section>;
}
```

```tsx
// app/opengraph-image.tsx
import { ImageResponse } from "next/og";

export const alt = "The Lion Company — The Gathering";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden", background: "#f3e9d7", color: "#24151f", padding: "76px", flexDirection: "column", justifyContent: "space-between", fontFamily: "Georgia, serif" }}>
      <div style={{ position: "absolute", width: 760, height: 760, border: "4px solid #964532", borderRadius: "50%", right: -250, top: -300, display: "flex" }} />
      <div style={{ position: "absolute", width: 520, height: 520, border: "2px solid #964532", borderRadius: "50%", right: -70, top: -130, display: "flex", opacity: 0.65 }} />
      <div style={{ display: "flex", fontFamily: "Arial, sans-serif", fontSize: 24, letterSpacing: "0.16em", textTransform: "uppercase" }}>The Lion Company</div>
      <div style={{ display: "flex", maxWidth: 880, flexDirection: "column" }}><div style={{ display: "flex", fontSize: 96, lineHeight: 0.94 }}>Many lives.<br />One center: Jesus.</div><div style={{ display: "flex", marginTop: 30, fontFamily: "Arial, sans-serif", fontSize: 28 }}>Seen → Gathered → Formed → Sent</div></div>
    </div>,
    size,
  );
}
```

```tsx
// app/icon.tsx
import { ImageResponse } from "next/og";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";
export default function Icon() { return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "#24151f", color: "#f3e9d7", fontFamily: "Georgia, serif", fontSize: 22 }}>L</div>, size); }
```

```tsx
// app/apple-icon.tsx
import { ImageResponse } from "next/og";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export default function AppleIcon() { return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 36, background: "#24151f", color: "#f3e9d7", fontFamily: "Georgia, serif", fontSize: 112 }}>L</div>, size); }
```

- [ ] **Step 5: Add a production-capable browser configuration and end-to-end foundation contract**

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3000";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL, trace: "retain-on-failure" },
  webServer: {
    command: process.env.PLAYWRIGHT_SERVER_COMMAND ?? "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI && !process.env.PLAYWRIGHT_SERVER_COMMAND,
    timeout: 180_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
```

```ts
// tests/e2e/foundation.spec.ts
import { expect, test } from "@playwright/test";

test("home is semantic, canonical, and preserves legacy fragments", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://www.thelioncompany.org/");
  for (const id of ["mission", "podcast", "media", "prayer", "store", "contact", "newsletter"]) await expect(page.locator(`#${id}`)).toHaveCount(1);
  const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(() => JSON.parse(jsonLd ?? "")).not.toThrow();
});

test("legacy redirect is one hop and preserves query parameters", async ({ request }) => {
  const response = await request.get("/media.html?utm_source=legacy", { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toContain("/teachings");
  expect(response.headers().location).toContain("utm_source=legacy");
});

test("retired source artifacts are 410 while unknown paths are 404", async ({ request }) => {
  expect((await request.get("/generate_html.py")).status()).toBe(410);
  expect((await request.get("/never-recorded-as-a-real-page")).status()).toBe(404);
});

test("preview robots block crawling and technical resources respond", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Disallow: /");
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("https://www.thelioncompany.org/teachings");
  expect((await request.get("/manifest.webmanifest")).status()).toBe(200);
  expect((await request.get("/opengraph-image")).status()).toBe(200);
});

test("archive details are crawlable and do not embed inaccessible media", async ({ page }) => {
  await page.goto("/teachings/heart-over-hammer");
  await expect(page.getByRole("heading", { level: 1, name: "Heart over Hammer" })).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Watch directly on YouTube" })).toHaveAttribute("href", /zP4ZiKek3Lg/);
  await page.goto("/podcast/when-gods-will-doesnt-go-your-way");
  await expect(page.locator("audio")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Open this episode on Podbean" })).toBeVisible();
});
```

- [ ] **Step 6: Run unit, asset, type, lint, production build, and Chromium browser checks**

Run: `npm run test:unit && npm run check:assets && npm run typecheck && npm run lint && npm run build && npx playwright install chromium && PLAYWRIGHT_SERVER_COMMAND='npm run start' npx playwright test tests/e2e/foundation.spec.ts --project=chromium`

Expected: every command exits 0; production build remains webpack/SRI-based; Chromium proves the canonical, fragments, valid JSON-LD, one-hop 308, branded 410, real 404, preview crawl block, sitemap, manifest, Open Graph image, and transcript-gated media behavior.

Separately run `npm run check:transcript-review`. It must fail closed while the authorized-human evidence array is empty. Record that exact open gate in the handoff; it blocks homepage player activation and release, but it does not invalidate the safe direct-link homepage implementation.

- [ ] **Step 7: Inspect build output for static-route and budget regressions**

Run: `find .next/static/chunks -type f -name '*.js' -exec wc -c {} + | sort -n | tail -20 && find .next/static/css -type f -name '*.css' -exec wc -c {} + | sort -n`

Expected: the output is recorded in the implementation review; no initial route requires a third-party script or media request, no single unexpected route chunk dominates the bundle, and CSS remains below the 60 KB compressed launch budget when measured by the release performance suite.

- [ ] **Step 8: Commit the technical SEO foundation**

```bash
git add config/routes.ts app/robots.ts app/sitemap.ts app/manifest.ts app/not-found.tsx app/opengraph-image.tsx app/icon.tsx app/apple-icon.tsx playwright.config.ts tests/unit/technical-seo.test.ts tests/e2e/foundation.spec.ts
git commit -m "feat: complete technical SEO foundation"
```

## Downstream Handoff

- The experience plan modifies the semantic header, footer, page-intro, page shells, and global styling without changing the content interfaces or canonical metadata contract.
- The forms/privacy plan adds `/prayer`, `/connect`, `/privacy`, `/terms`, and `/accessibility` to `indexableStaticRoutes`; newsletter outcome routes remain absent from the sitemap and noindex.
- The forms/privacy plan modifies the existing `nextConfig` object to add exact security headers and owns environment/provider configuration.
- The analytics/interaction plan preserves server-rendered outbound anchors and adds consent-gated behavior without changing their destinations.
- Before code freeze, the release owner expands `legacyRouteLedger` from Search Console, GA4 landing pages, Wix history, known backlinks, and Vercel logs; every discovered historical URL receives one explicit 308, 410, or genuine 404 outcome.
