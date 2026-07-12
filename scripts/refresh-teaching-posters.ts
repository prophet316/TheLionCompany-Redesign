import { existsSync, mkdirSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { teachings } from "../content/teachings";

const APPROVED_HOSTS = new Set(["i.ytimg.com"]);
const MAX_BYTES = 3 * 1024 * 1024;

async function downloadPoster(youtubeId: string) {
  const candidates = ["maxresdefault", "sddefault", "hqdefault"];
  for (const variant of candidates) {
    const url = `https://i.ytimg.com/vi/${youtubeId}/${variant}.jpg`;
    const response = await fetch(url, { redirect: "manual" });
    if (response.status >= 300 && response.status < 400) continue;
    if (!response.ok) continue;
    const host = new URL(response.url ?? url).host;
    if (!APPROVED_HOSTS.has(host)) continue;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("jpeg") && !contentType.includes("jpg")) continue;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_BYTES) continue;
    return { buffer, sourceUrl: url, variant };
  }
  return null;
}

async function main() {
  const mode = process.argv.includes("--write") ? "write" : process.argv.includes("--check") ? "check" : null;
  if (!mode) {
    console.error("usage: refresh-teaching-posters.ts --check | --write");
    process.exitCode = 1;
    return;
  }

  if (mode === "check") {
    const missing = teachings.filter((teaching) => !existsSync(join("public", teaching.posterPath)));
    if (missing.length > 0) {
      console.error(`missing local posters: ${missing.map((teaching) => teaching.slug).join(", ")}`);
      process.exitCode = 1;
      return;
    }
    console.log(`all ${teachings.length} teaching posters are present locally`);
    return;
  }

  for (const teaching of teachings) {
    const target = join("public", teaching.posterPath);
    if (existsSync(target)) continue;
    const result = await downloadPoster(teaching.youtubeId);
    if (!result) {
      console.error(`unable to fetch an approved poster for ${teaching.slug} (${teaching.youtubeId})`);
      process.exitCode = 1;
      continue;
    }
    mkdirSync(dirname(target), { recursive: true });
    const tmpPath = `${target}.tmp`;
    writeFileSync(tmpPath, result.buffer);
    renameSync(tmpPath, target);
    const stats = statSync(target);
    console.log(`wrote ${target} from ${result.sourceUrl} (${stats.size} bytes) — review content/crop and record docs/asset-ledger.csv before shipping`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
