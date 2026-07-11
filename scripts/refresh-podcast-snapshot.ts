import { renameSync, writeFileSync } from "node:fs";
import { podcastFallback } from "../content/podcast-fallback";
import { fetchPodcastFeedForRefresh } from "../lib/media/podcast-feed";
import type { PodcastEpisode } from "../lib/content/types";

function diffSummary(current: readonly PodcastEpisode[], next: readonly PodcastEpisode[]) {
  const currentSlugs = new Set(current.map((episode) => episode.slug));
  const nextSlugs = new Set(next.map((episode) => episode.slug));
  const added = next.filter((episode) => !currentSlugs.has(episode.slug)).map((episode) => episode.slug);
  const removed = current.filter((episode) => !nextSlugs.has(episode.slug)).map((episode) => episode.slug);
  const changed = next
    .filter((episode) => currentSlugs.has(episode.slug))
    .filter((episode) => JSON.stringify(episode) !== JSON.stringify(current.find((item) => item.slug === episode.slug)))
    .map((episode) => episode.slug);
  return { added, removed, changed };
}

function renderSnapshot(episodes: readonly PodcastEpisode[]) {
  const records = episodes.map((episode) => `  ${JSON.stringify(episode)}`).join(",\n");
  return `import { podcastEpisodeSchema } from "@/lib/content/schemas";\nimport type { PodcastEpisode } from "@/lib/content/types";\n\nconst records = [\n${records},\n] as const;\n\nexport const podcastFallback: readonly PodcastEpisode[] = records.map((record) => podcastEpisodeSchema.parse(record));\n`;
}

async function main() {
  const mode = process.argv.includes("--write") ? "write" : process.argv.includes("--check") ? "check" : null;
  if (!mode) {
    console.error("usage: refresh-podcast-snapshot.ts --check | --write");
    process.exitCode = 1;
    return;
  }

  const next = await fetchPodcastFeedForRefresh();
  const summary = diffSummary(podcastFallback, next);
  console.log(`podcast snapshot diff: added=${summary.added.join(",") || "none"} removed=${summary.removed.join(",") || "none"} changed=${summary.changed.join(",") || "none"}`);

  const hasDrift = summary.added.length > 0 || summary.removed.length > 0 || summary.changed.length > 0;

  if (mode === "check") {
    if (hasDrift) {
      console.error("podcast snapshot is stale; run --write and review the diff");
      process.exitCode = 1;
    } else {
      console.log("podcast snapshot matches the live feed");
    }
    return;
  }

  if (!hasDrift) {
    console.log("no changes to write");
    return;
  }

  const path = "content/podcast-fallback.ts";
  const tmpPath = `${path}.tmp`;
  writeFileSync(tmpPath, renderSnapshot(next), "utf8");
  renameSync(tmpPath, path);
  console.log(`wrote ${path}; review the diff, run tests, commit, and redeploy before this episode is public`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
