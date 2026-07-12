import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { indexableStaticRoutes } from "../config/routes.ts";
import { legacyRouteLedger } from "../config/redirects.ts";
import { destinationRegistry } from "../content/destinations.ts";
import { getPublishedPodcastEpisodes } from "../lib/media/podcast-feed.ts";
import { assertDeploymentBinding } from "../lib/release/health.mjs";
import { checkPublicContracts } from "./lib/public-contracts.mjs";

const required = [
  "RELEASE_BASE_URL",
  "RELEASE_MODE",
  "RELEASE_DEPLOYMENT_ID",
  "RELEASE_COMMIT_SHA",
  "VERCEL_ACCESS_TOKEN",
  "VERCEL_TEAM_ID",
  "RELEASE_EVIDENCE_DIR",
];
for (const name of required) if (!process.env[name]) throw new Error(`${name} is required`);
const mode = process.env.RELEASE_MODE;
if (!new Set(["preview-qa", "staged-production", "production"]).has(mode)) {
  throw new Error("RELEASE_MODE must be preview-qa, staged-production, or production");
}
if (mode === "staged-production") {
  for (const name of ["PREVIEW_QA_DEPLOYMENT_ID", "PREVIEW_QA_IMMUTABLE_URL"]) {
    if (!process.env[name]) throw new Error(`${name} is required for staged-production binding`);
  }
}

const base = new URL(process.env.RELEASE_BASE_URL);
const apiHeaders = { authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}` };

async function fetchDeployment(deploymentId) {
  const endpoint = new URL(`https://api.vercel.com/v13/deployments/${encodeURIComponent(deploymentId)}`);
  endpoint.searchParams.set("teamId", process.env.VERCEL_TEAM_ID);
  const response = await fetch(endpoint, { headers: apiHeaders, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`Vercel deployment API returned ${response.status}`);
  return response.json();
}

const deployment = await fetchDeployment(process.env.RELEASE_DEPLOYMENT_ID);
const binding = assertDeploymentBinding({
  deployment,
  expectedDeploymentId: process.env.RELEASE_DEPLOYMENT_ID,
  expectedCommitSha: process.env.RELEASE_COMMIT_SHA,
  baseURL: process.env.RELEASE_BASE_URL,
  mode,
});

let previewBinding = null;
if (mode === "staged-production") {
  if (process.env.PREVIEW_QA_DEPLOYMENT_ID === binding.deploymentId) {
    throw new Error("Preview QA and staged Production must be separate deployments");
  }
  const previewDeployment = await fetchDeployment(process.env.PREVIEW_QA_DEPLOYMENT_ID);
  previewBinding = assertDeploymentBinding({
    deployment: previewDeployment,
    expectedDeploymentId: process.env.PREVIEW_QA_DEPLOYMENT_ID,
    expectedCommitSha: binding.commitSha,
    baseURL: process.env.PREVIEW_QA_IMMUTABLE_URL,
    mode: "preview-qa",
  });
}

const publicResult = await checkPublicContracts({
  baseURL: process.env.RELEASE_BASE_URL,
  mode: mode === "preview-qa" ? "preview" : mode,
  deploymentId: binding.deploymentId,
  commitSha: binding.commitSha,
  staticRoutes: indexableStaticRoutes,
  podcastSlugs: getPublishedPodcastEpisodes().map((episode) => episode.slug),
  legacyRouteLedger,
  destinations: destinationRegistry,
  protectionSecret: process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
  checkExternal: mode !== "preview-qa",
  evidenceDir: process.env.RELEASE_EVIDENCE_DIR,
});

let protectionCookie = null;
if (mode !== "production") {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (!secret || base.protocol !== "https:" || !base.hostname.endsWith(".vercel.app") || base.username || base.password) {
    throw new Error("protected immutable deployment requires an exact HTTPS Vercel URL and automation secret");
  }
  const seed = await fetch(new URL("/", base), {
    redirect: "manual",
    signal: AbortSignal.timeout(12_000),
    headers: { "x-vercel-protection-bypass": secret, "x-vercel-set-bypass-cookie": "true" },
  });
  if (seed.status !== 200 || seed.headers.has("location")) throw new Error(`deployment-protection seed returned ${seed.status}`);
  const setCookies = seed.headers.getSetCookie?.() ?? [seed.headers.get("set-cookie")].filter(Boolean);
  const cookieHeader = setCookies.find((value) => /^_vercel_jwt=/i.test(value));
  if (!cookieHeader || !/(?:^|;)\s*Secure(?:;|$)/i.test(cookieHeader) || /(?:^|;)\s*Domain=/i.test(cookieHeader)) {
    throw new Error("Vercel bypass cookie must be Secure and host-only");
  }
  protectionCookie = cookieHeader.match(/^(_vercel_jwt=[^;]+)/i)?.[1] ?? null;
  if (!protectionCookie) throw new Error("origin-scoped Vercel bypass cookie was not returned");
}

const primaryPaths = [
  "/", "/teachings", "/podcast", "/connect", "/prayer", "/store", "/give",
  "/privacy", "/terms", "/accessibility", "/robots.txt", "/sitemap.xml",
];
for (const path of primaryPaths) {
  const url = new URL(path, base);
  if (url.origin !== base.origin) throw new Error("primary smoke URL escaped the bound deployment origin");
  const response = await fetch(url, {
    headers: protectionCookie ? { cookie: protectionCookie } : {},
    redirect: "manual",
    signal: AbortSignal.timeout(12_000),
  });
  if (response.status !== 200) throw new Error(`${path} returned ${response.status}`);
}

await mkdir(process.env.RELEASE_EVIDENCE_DIR, { recursive: true, mode: 0o700 });
if (mode === "production") {
  const canonicalCases = [
    { gate: "canonical-http-apex", url: "http://thelioncompany.org/privacy?utm_source=release", status: 308, location: "https://www.thelioncompany.org/privacy?utm_source=release" },
    { gate: "canonical-http-www", url: "http://www.thelioncompany.org/privacy?utm_source=release", status: 308, location: "https://www.thelioncompany.org/privacy?utm_source=release" },
    { gate: "canonical-https-apex", url: "https://thelioncompany.org/privacy?utm_source=release", status: 308, location: "https://www.thelioncompany.org/privacy?utm_source=release" },
    { gate: "canonical-https-www", url: "https://www.thelioncompany.org/privacy?utm_source=release", status: 200, location: null },
  ];
  for (const item of canonicalCases) {
    const response = await fetch(item.url, { redirect: "manual", signal: AbortSignal.timeout(12_000) });
    const location = response.headers.get("location");
    const exactLocation = item.location ? new URL(location ?? "", item.url).toString() === item.location : location === null;
    if (response.status !== item.status || !exactLocation) {
      throw new Error(`${item.gate} failed exact one-hop canonical contract`);
    }
    const canonicalEvidence = {
      schemaVersion: 1,
      gate: item.gate,
      status: "pass",
      recordedAt: new Date().toISOString(),
      deploymentScope: "production",
      deploymentId: binding.deploymentId,
      commitSha: binding.commitSha,
      assertions: [item.location ? "one 308 hop reaches the exact HTTPS www path and query" : "canonical HTTPS www returns 200 without redirect"],
      metrics: {
        input: item.url,
        httpStatus: response.status,
        redirectHops: item.location ? 1 : 0,
        location: item.location,
      },
    };
    await writeFile(
      resolve(process.env.RELEASE_EVIDENCE_DIR, `${item.gate}.json`),
      `${JSON.stringify(canonicalEvidence, null, 2)}\n`,
      { mode: 0o600 },
    );
  }
}

const gate = mode === "preview-qa" ? "preview-qa-metadata" : mode === "staged-production" ? "candidate-metadata" : "production-smoke";
const evidence = {
  schemaVersion: 1,
  gate,
  status: "pass",
  recordedAt: new Date().toISOString(),
  deploymentScope: mode,
  deploymentId: binding.deploymentId,
  commitSha: binding.commitSha,
  assertions: mode === "preview-qa"
    ? ["Preview QA deployment READY", "immutable Preview URL matches deployment", "Git SHA matches Preview QA", "report-only Preview contracts pass"]
    : mode === "staged-production"
      ? ["staged Production deployment READY", "immutable generated URL matches deployment", "Production target and Git SHA match", "separate Preview QA deployment has the same exact Git SHA", "no custom Production domain is assigned", "Deployment Protection challenges unauthenticated access", "enforced Production public/static contracts pass without form mutation"]
      : ["www alias points to the same staged Production deployment ID", "Git SHA matches the staged candidate without rebuild", "primary routes, redirects, canonical, robots, sitemap, schema, links, and security headers pass"],
  metrics: { primaryRoutes: primaryPaths.length, publicAssertions: publicResult.assertions.length },
  immutableURL: binding.immutableURL,
  aliases: deployment.alias ?? [],
  ...(previewBinding ? { previewQa: { deploymentId: previewBinding.deploymentId, immutableURL: previewBinding.immutableURL, commitSha: previewBinding.commitSha } } : {}),
};
await writeFile(
  resolve(process.env.RELEASE_EVIDENCE_DIR, `${evidence.gate}.json`),
  `${JSON.stringify(evidence, null, 2)}\n`,
  { mode: 0o600 },
);
console.log(JSON.stringify({ status: "pass", gate: evidence.gate, deploymentId: binding.deploymentId, commitSha: binding.commitSha }));
