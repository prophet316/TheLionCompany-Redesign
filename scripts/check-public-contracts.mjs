import { indexableStaticRoutes } from "../config/routes.ts";
import { legacyRouteLedger } from "../config/redirects.ts";
import { destinationRegistry } from "../content/destinations.ts";
import { getPublishedPodcastEpisodes } from "../lib/media/podcast-feed.ts";
import { checkPublicContracts } from "./lib/public-contracts.mjs";

const required = ["SITE_CHECK_BASE_URL", "SITE_CHECK_MODE", "RELEASE_DEPLOYMENT_ID", "RELEASE_COMMIT_SHA"];
for (const name of required) if (!process.env[name]) throw new Error(`${name} is required`);
if (!new Set(["preview", "staged-production", "production"]).has(process.env.SITE_CHECK_MODE)) throw new Error("SITE_CHECK_MODE must be preview, staged-production, or production");

const result = await checkPublicContracts({
  baseURL: process.env.SITE_CHECK_BASE_URL,
  mode: process.env.SITE_CHECK_MODE,
  deploymentId: process.env.RELEASE_DEPLOYMENT_ID,
  commitSha: process.env.RELEASE_COMMIT_SHA,
  staticRoutes: indexableStaticRoutes,
  podcastSlugs: getPublishedPodcastEpisodes().map((episode) => episode.slug),
  legacyRouteLedger,
  destinations: destinationRegistry,
  protectionSecret: process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
  checkExternal: process.env.SITE_CHECK_EXTERNAL === "1",
  evidenceDir: process.env.RELEASE_EVIDENCE_DIR,
});
console.log(JSON.stringify({ status: result.status, assertions: result.assertions.length, metrics: result.metrics }));
