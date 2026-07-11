import { load } from "cheerio";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export const CANONICAL_ORIGIN = "https://www.thelioncompany.org";
const ALLOWED_SCHEMA_TYPES = new Set([
  "Organization", "WebSite", "WebPage", "VideoObject", "PodcastSeries",
  "PodcastEpisode", "BreadcrumbList", "ListItem",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeCanonicalPath(pathname) {
  return pathname === "/" ? "/" : pathname.replace(/\/$/, "");
}

function schemaTypes(value, types = []) {
  if (Array.isArray(value)) value.forEach((item) => schemaTypes(item, types));
  else if (value && typeof value === "object") {
    if (typeof value["@type"] === "string") types.push(value["@type"]);
    Object.values(value).forEach((item) => schemaTypes(item, types));
  }
  return types;
}

export function assertCanonicalDocument(html, expectedCanonical) {
  const $ = load(html);
  const canonicals = $('link[rel="canonical"]');
  invariant(canonicals.length === 1, `expected one canonical for ${expectedCanonical}`);
  invariant(canonicals.attr("href") === expectedCanonical, `canonical mismatch for ${expectedCanonical}`);
  invariant($("title").first().text().trim().length > 0, `missing title for ${expectedCanonical}`);
  const title = $("title").first().text().trim();
  const description = $('meta[name="description"]').attr("content")?.trim();
  invariant(description, `missing description for ${expectedCanonical}`);
  invariant($("html").attr("lang") === "en", `html lang mismatch for ${expectedCanonical}`);
  invariant($("h1").length === 1, `expected one h1 for ${expectedCanonical}`);
  invariant($("h1").first().text().trim().length > 0, `empty h1 for ${expectedCanonical}`);
  invariant($('meta[property="og:title"]').attr("content")?.trim(), `missing Open Graph title for ${expectedCanonical}`);
  invariant($('meta[property="og:description"]').attr("content")?.trim(), `missing Open Graph description for ${expectedCanonical}`);
  invariant($('meta[property="og:url"]').attr("content") === expectedCanonical, `Open Graph URL mismatch for ${expectedCanonical}`);
  invariant(/^https:\/\//.test($('meta[property="og:image"]').attr("content") ?? ""), `missing absolute Open Graph image for ${expectedCanonical}`);
  invariant($('meta[name="twitter:card"]').attr("content") === "summary_large_image", `Twitter card mismatch for ${expectedCanonical}`);
  invariant($('meta[name="twitter:title"]').attr("content")?.trim(), `missing Twitter title for ${expectedCanonical}`);
  invariant($('meta[name="twitter:description"]').attr("content")?.trim(), `missing Twitter description for ${expectedCanonical}`);
  invariant(/^https:\/\//.test($('meta[name="twitter:image"]').attr("content") ?? ""), `missing absolute Twitter image for ${expectedCanonical}`);
  const schemas = [];
  $('script[type="application/ld+json"]').each((_index, element) => {
    const parsed = JSON.parse($(element).text());
    const serialized = JSON.stringify(parsed);
    invariant(!/aggregateRating|reviewCount|ratingValue/.test(serialized), "unsupported rating schema found");
    schemas.push(...schemaTypes(parsed));
  });
  invariant(schemas.length > 0, `missing JSON-LD for ${expectedCanonical}`);
  invariant(schemas.every((type) => ALLOWED_SCHEMA_TYPES.has(type)), `unsupported JSON-LD type for ${expectedCanonical}`);
  invariant(schemas.includes("WebPage"), `JSON-LD missing WebPage for ${expectedCanonical}`);
  if (expectedCanonical === CANONICAL_ORIGIN || expectedCanonical === `${CANONICAL_ORIGIN}/`) {
    for (const type of ["Organization", "WebSite", "WebPage"]) {
      invariant(schemas.includes(type), `home JSON-LD missing ${type}`);
    }
  }
  return {
    canonical: canonicals.attr("href"),
    title,
    description,
    h1: $("h1").first().text().trim(),
    robots: $('meta[name="robots"]').attr("content")?.toLowerCase() ?? "",
    schemaTypes: [...new Set(schemas)],
    anchors: $("a[href]").map((_index, element) => $(element).attr("href")).get(),
  };
}

export function extractSitemapUrls(xml) {
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
  invariant(urls.length > 0, "sitemap has no URLs");
  invariant(new Set(urls).size === urls.length, "sitemap contains duplicate URLs");
  return urls;
}

export function assertSecurityHeaders(headers, mode) {
  for (const [name, value] of [
    ["x-content-type-options", "nosniff"],
    ["referrer-policy", "strict-origin-when-cross-origin"],
    ["x-frame-options", "DENY"],
    ["permissions-policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()"],
  ]) invariant(headers.get(name) === value, `${name} mismatch`);
  const productionPolicy = mode === "staged-production" || mode === "production";
  const cspName = productionPolicy ? "content-security-policy" : "content-security-policy-report-only";
  const csp = headers.get(cspName) ?? "";
  invariant(csp.includes("default-src 'self'"), `${cspName} missing default-src`);
  invariant(csp.includes("'sha256-"), `${cspName} missing generated hash`);
  invariant(csp.includes("https://www.youtube-nocookie.com"), `${cspName} missing YouTube privacy host`);
  invariant(csp.includes("https://challenges.cloudflare.com"), `${cspName} missing Turnstile`);
  invariant(!csp.toLowerCase().includes("brevo"), "Brevo leaked into browser CSP");
  invariant(!/script-src[^;]*'unsafe-inline'/.test(csp), "script unsafe-inline is forbidden");
  invariant(!/(^|\s)\*(\s|;|$)/.test(csp), "CSP wildcard is forbidden");
  if (productionPolicy) {
    invariant(headers.get("strict-transport-security") === "max-age=31536000", "production HSTS mismatch");
    invariant(!headers.has("content-security-policy-report-only"), "production still uses report-only CSP");
  } else {
    invariant(!headers.has("content-security-policy"), "preview unexpectedly enforces CSP");
    invariant(!headers.has("strict-transport-security"), "preview unexpectedly sends HSTS");
  }
}

async function seedProtectionCookie(base, secret) {
  if (!secret) return null;
  invariant(base.protocol === "https:" && base.hostname.endsWith(".vercel.app") && !base.username && !base.password, "protected target must be an exact HTTPS Vercel deployment origin");
  const seed = new URL("/", base);
  const response = await fetch(seed, {
    redirect: "manual",
    signal: AbortSignal.timeout(12_000),
    headers: {
      "x-vercel-protection-bypass": secret,
      "x-vercel-set-bypass-cookie": "true",
    },
  });
  invariant(response.status === 200 && !response.headers.has("location"), `deployment-protection seed returned ${response.status}`);
  const setCookies = response.headers.getSetCookie?.() ?? [response.headers.get("set-cookie")].filter(Boolean);
  const line = setCookies.find((value) => /^_vercel_jwt=/i.test(value));
  const value = line?.match(/^(_vercel_jwt=[^;]+)/i)?.[1];
  invariant(value && /;\s*secure(?:;|$)/i.test(line), "origin-scoped secure Vercel bypass cookie was not returned");
  const domain = line.match(/;\s*domain=([^;]+)/i)?.[1]?.replace(/^\./, "").toLowerCase();
  invariant(!domain || domain === base.hostname, "Vercel bypass cookie escaped the exact deployment host");
  return { origin: base.origin, cookie: value };
}

async function fetchWithPolicy(url, session, init = {}) {
  const target = new URL(url);
  const headers = new Headers(init.headers ?? {});
  if (session) {
    invariant(target.origin === session.origin, "refusing to send a deployment-protection cookie off origin");
    headers.set("cookie", session.cookie);
  }
  return fetch(target, {
    ...init,
    redirect: "manual",
    signal: AbortSignal.timeout(12_000),
    headers,
  });
}

export async function checkPublicContracts(options) {
  const base = new URL(options.baseURL);
  const redirects = options.legacyRouteLedger.filter((route) => route.kind === "redirect");
  const goneRoutes = options.legacyRouteLedger.filter((route) => route.kind === "gone");
  const destinations = options.destinations.filter((destination) => destination.visible);
  const assertions = [];
  const external = new Set();
  const protectedDeployment = (options.mode === "preview" || options.mode === "staged-production") && base.hostname.endsWith(".vercel.app");
  if (protectedDeployment) {
    invariant(options.protectionSecret, "protected immutable deployment requires an automation secret for authenticated checks");
    const challenge = await fetchWithPolicy(new URL("/", base), null);
    invariant([401, 403].includes(challenge.status), `unauthenticated deployment did not return a protection challenge: ${challenge.status}`);
    invariant(challenge.headers.has("x-vercel-id") || challenge.headers.get("server")?.toLowerCase() === "vercel", "unauthenticated challenge is not attributable to Vercel protection");
    assertions.push(`unauthenticated immutable ${options.mode} is blocked by Vercel Deployment Protection`);
  }
  const protectionSession = protectedDeployment ? await seedProtectionCookie(base, options.protectionSecret) : null;
  const root = await fetchWithPolicy(new URL("/", base), protectionSession);
  invariant(root.status === 200, `home returned ${root.status}`);
  assertSecurityHeaders(root.headers, options.mode);
  assertions.push("security headers and CSP match environment");

  const robots = await fetchWithPolicy(new URL("/robots.txt", base), protectionSession);
  invariant(robots.status === 200, `robots returned ${robots.status}`);
  const robotsText = await robots.text();
  if (options.mode === "staged-production" || options.mode === "production") {
    invariant(robotsText.includes("Sitemap: https://www.thelioncompany.org/sitemap.xml"), "production robots lacks sitemap");
    invariant(!robotsText.includes("Disallow: /\n"), "production robots blocks all crawling");
  } else invariant(robotsText.includes("Disallow: /"), "preview robots must block crawling");
  assertions.push("robots policy matches environment");

  const sitemapResponse = await fetchWithPolicy(new URL("/sitemap.xml", base), protectionSession);
  invariant(sitemapResponse.status === 200, `sitemap returned ${sitemapResponse.status}`);
  const sitemapUrls = extractSitemapUrls(await sitemapResponse.text());
  for (const path of options.staticRoutes) {
    const expected = new URL(path, CANONICAL_ORIGIN).toString();
    invariant(sitemapUrls.includes(expected), `sitemap missing ${expected}`);
  }
  for (const slug of options.podcastSlugs) {
    const expected = `${CANONICAL_ORIGIN}/podcast/${slug}`;
    invariant(sitemapUrls.includes(expected), `sitemap missing reviewed podcast route ${expected}`);
  }
  invariant(!sitemapUrls.some((url) => new URL(url).pathname.startsWith("/newsletter/")), "newsletter utility route entered sitemap");

  for (const canonical of sitemapUrls) {
    const url = new URL(canonical);
    invariant(url.origin === CANONICAL_ORIGIN, `noncanonical sitemap host: ${canonical}`);
    invariant(url.search === "" && url.hash === "", `tracking state in sitemap: ${canonical}`);
    invariant(normalizeCanonicalPath(url.pathname) === url.pathname, `trailing slash canonical: ${canonical}`);
    const response = await fetchWithPolicy(new URL(url.pathname, base), protectionSession);
    invariant(response.status === 200, `${url.pathname} returned ${response.status}`);
    const documentCanonical = url.pathname === "/" ? CANONICAL_ORIGIN : canonical;
    const result = assertCanonicalDocument(await response.text(), documentCanonical);
    if (options.mode === "preview") {
      invariant(result.robots.includes("noindex") && result.robots.includes("nofollow"), `${url.pathname} preview HTML is not noindex,nofollow`);
    } else {
      invariant(!result.robots.includes("noindex") && !result.robots.includes("nofollow"), `${url.pathname} production HTML blocks indexing`);
    }
    for (const href of result.anchors) {
      const resolved = new URL(href, CANONICAL_ORIGIN);
      if (resolved.origin !== CANONICAL_ORIGIN) external.add(resolved.toString());
    }
  }
  assertions.push(`${sitemapUrls.length} canonical sitemap documents return semantic 200 HTML`);

  for (const route of redirects) {
    const source = new URL(route.source, base);
    source.searchParams.set("utm_source", "release");
    const response = await fetchWithPolicy(source, protectionSession);
    invariant(response.status === route.statusCode, `${route.source} returned ${response.status}`);
    const locationHeader = response.headers.get("location");
    invariant(locationHeader, `${route.source} omitted Location`);
    const location = new URL(locationHeader, base);
    invariant(location.pathname === route.destination, `${route.source} redirected to ${location.pathname}`);
    if (route.preserveQuery) invariant(location.searchParams.get("utm_source") === "release", `${route.source} dropped query string`);
  }
  for (const route of goneRoutes) {
    const response = await fetchWithPolicy(new URL(route.source, base), protectionSession);
    invariant(response.status === route.statusCode, `${route.source} returned ${response.status}`);
  }
  invariant((await fetchWithPolicy(new URL("/release-never-existed", base), protectionSession)).status === 404, "unknown route is not a real 404");
  invariant((await fetchWithPolicy(new URL("/podcast/release-never-existed", base), protectionSession)).status === 404, "unknown podcast detail is not a real 404");
  assertions.push(`${redirects.length} ledger redirects are one-hop 308; ${goneRoutes.length} ledger artifacts are 410; global and podcast-detail unknowns are 404`);

  for (const destination of destinations) {
    invariant([...external].some((href) => href === destination.href || href.replace(/\/$/, "") === destination.href.replace(/\/$/, "")), `rendered anchors missing visible destination ${destination.key}`);
  }
  const manualChallenges = [];
  if (options.checkExternal) {
    for (const destination of destinations) {
      let response = await fetchWithPolicy(destination.href, null, { method: "HEAD" });
      if (response.status === 405) response = await fetchWithPolicy(destination.href, null, { method: "GET" });
      if ([401, 403, 429].includes(response.status)) {
        manualChallenges.push({ key: destination.key, hostname: new URL(destination.href).hostname, required: destination.required });
        continue;
      }
      invariant(response.status >= 200 && response.status < 400, `${destination.key} returned ${response.status}`);
    }
    assertions.push(`${destinations.length} visible external destinations are reachable or require recorded browser challenge review`);
  } else assertions.push(`${destinations.length} visible external destinations are present as crawlable anchors`);

  const result = {
    schemaVersion: 1,
    gate: `public-contracts-${options.mode}`,
    status: "pass",
    recordedAt: new Date().toISOString(),
    deploymentScope: options.mode === "preview" ? "preview-qa" : options.mode,
    deploymentId: options.deploymentId,
    commitSha: options.commitSha,
    assertions,
    metrics: {
      sitemapRoutes: sitemapUrls.length,
      podcastStaticRoutes: options.podcastSlugs.length,
      redirects: redirects.length,
      goneRoutes: goneRoutes.length,
      visibleDestinations: destinations.length,
      requiredDestinations: destinations.filter((destination) => destination.required).length,
      optionalDestinations: destinations.filter((destination) => !destination.required).length,
      manualChallenges: manualChallenges.length,
    },
    manualChallenges,
  };
  if (options.evidenceDir) {
    await mkdir(options.evidenceDir, { recursive: true, mode: 0o700 });
    await writeFile(resolve(options.evidenceDir, `public-contracts-${options.mode}.json`), `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
  }
  return result;
}
