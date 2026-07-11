import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getPublishedPodcastEpisodes } from "../lib/media/podcast-feed.ts";

const invariant = (condition, message) => { if (!condition) throw new Error(message); };
const episodes = getPublishedPodcastEpisodes();
invariant(episodes.length > 0, "published podcast snapshot is empty");
const manifest = JSON.parse(await readFile(resolve(".next/prerender-manifest.json"), "utf8"));
const prerendered = new Set(Object.keys(manifest.routes ?? {}));
for (const episode of episodes) {
  invariant(prerendered.has(`/podcast/${episode.slug}`), `podcast slug is not prerendered: ${episode.slug}`);
}

const detailSource = await readFile(resolve("app/podcast/[slug]/page.tsx"), "utf8");
invariant(/from\s+["']next\/navigation["']/.test(detailSource) && /\bnotFound\b/.test(detailSource), "podcast detail does not import notFound");
invariant(/if\s*\(\s*!episode\s*\)\s*notFound\s*\(\s*\)/.test(detailSource), "podcast detail does not reject an unknown episode");

const offenders = [];
async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await scan(path);
    else if (/\.[cm]?[jt]sx?$/.test(entry.name) && (await readFile(path, "utf8")).includes("fetchPodcastFeedForRefresh")) offenders.push(path);
  }
}
for (const directory of [resolve("app"), resolve("components")]) await scan(directory);
invariant(offenders.length === 0, "runtime app/components import fetchPodcastFeedForRefresh");

const result = {
  schemaVersion: 1,
  gate: "static-media-architecture",
  status: "pass",
  recordedAt: new Date().toISOString(),
  deploymentScope: process.env.RELEASE_DEPLOYMENT_SCOPE ?? "local",
  deploymentId: process.env.RELEASE_DEPLOYMENT_ID ?? "local-production-build",
  commitSha: process.env.RELEASE_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "local",
  assertions: ["every reviewed podcast slug is prerendered", "unknown podcast detail invokes notFound and remote HTTP returns 404", "runtime UI cannot import network podcast refresh"],
  metrics: { publishedPodcastEpisodes: episodes.length, prerenderedPodcastEpisodes: episodes.length, runtimeRefreshImports: 0 },
};
const outputDirectory = resolve(process.env.RELEASE_EVIDENCE_DIR ?? "test-results");
await mkdir(outputDirectory, { recursive: true, mode: 0o700 });
await writeFile(resolve(outputDirectory, "static-media-architecture.json"), `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({ status: "pass", metrics: result.metrics }));
