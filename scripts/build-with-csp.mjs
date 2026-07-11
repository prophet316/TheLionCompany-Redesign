import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const output = resolve(root, ".next/server/app");
const manifest = resolve(root, "config/.generated-csp-hashes.json");

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = resolve(directory, entry.name);
      return entry.isDirectory() ? files(path) : Promise.resolve([path]);
    }),
  );
  return nested.flat();
}

function hashesForHtml(html) {
  const hashes = new Set();
  for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=/i.test(match[1]) || match[2].length === 0) continue;
    const digest = createHash("sha256").update(match[2], "utf8").digest("base64");
    hashes.add(`'sha256-${digest}'`);
  }
  return [...hashes].sort();
}

function publicRoute(path) {
  const name = relative(output, path).replaceAll("\\", "/");
  if (name === "index.html") return "/";
  if (name.startsWith("_")) return null;
  return `/${name.slice(0, -".html".length)}`;
}

async function collectManifest() {
  const htmlFiles = (await files(output)).filter((path) => path.endsWith(".html"));
  const routes = {};
  const fallback = new Set();
  for (const path of htmlFiles) {
    const html = await readFile(path, "utf8");
    const hashes = hashesForHtml(html);
    const route = publicRoute(path);
    if (route) {
      routes[route] = hashes;
    } else {
      for (const hash of hashes) fallback.add(hash);
    }
  }
  return {
    version: 1,
    routes: Object.fromEntries(
      Object.entries(routes).sort(([left], [right]) => left.localeCompare(right)),
    ),
    fallback: [...fallback].sort(),
  };
}

function build(phase) {
  const result = spawnSync(resolve(root, "node_modules/.bin/next"), ["build", "--webpack"], {
    cwd: root,
    env: { ...process.env, CSP_PHASE: phase },
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

build("discover");
const discovered = await collectManifest();
if (Object.keys(discovered.routes).length === 0 || discovered.fallback.length === 0) {
  throw new Error("route-specific inline scripts were not discovered");
}
await writeFile(manifest, `${JSON.stringify(discovered, null, 2)}\n`, "utf8");
build("final");
const finalManifest = await collectManifest();
if (JSON.stringify(finalManifest) !== JSON.stringify(discovered)) {
  throw new Error("final inline scripts differ from discovered CSP hashes");
}
