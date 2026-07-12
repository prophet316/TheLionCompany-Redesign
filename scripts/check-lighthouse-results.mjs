import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { indexableStaticRoutes } from "../config/routes.ts";
import { evaluateLighthouseRuns } from "../lib/release/performance.mjs";

const directory = resolve(".lighthouseci");
const files = (await readdir(directory)).filter((name) => /^lhr-.*\.json$/.test(name));
const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const raw = await Promise.all(files.map(async (name) => {
  const path = resolve(directory, name);
  const original = await readFile(path, "utf8");
  const sanitized = secret ? original.split(secret).join("[REDACTED]") : original;
  if (sanitized !== original) await writeFile(path, sanitized, { mode: 0o600 });
  if (secret && sanitized.includes(secret)) throw new Error(`failed to redact protection secret from ${name}`);
  return { name, sanitized };
}));
const lhrs = raw.map(({ sanitized }) => JSON.parse(sanitized));
const deploymentScope = process.env.RELEASE_DEPLOYMENT_SCOPE ?? "local";
const knownScopes = new Set(["local", "preview", "preview-qa", "staged-production", "production"]);
if (!knownScopes.has(deploymentScope)) throw new Error(`unknown release deployment scope ${deploymentScope}`);
const indexability = deploymentScope === "staged-production" || deploymentScope === "production"
  ? "indexable"
  : "preview-noindex";
const result = evaluateLighthouseRuns(lhrs, indexableStaticRoutes, { indexability });
const evidence = {
  schemaVersion: 1,
  gate: "lighthouse-budgets",
  status: result.status,
  recordedAt: new Date().toISOString(),
  deploymentScope,
  deploymentId: process.env.RELEASE_DEPLOYMENT_ID ?? "local-production-build",
  commitSha: process.env.RELEASE_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "local",
  assertions: [
    "three Slow 4G/4x CPU runs per route",
    "home performance >=92",
    "static performance >=95",
    indexability === "indexable"
      ? "A11y/Best Practices/SEO 100 including crawlability"
      : "A11y/Best Practices 100; explicit preview noindex; every other weighted SEO audit passes",
    "LCP/CLS/TBT/resource/request/long-task budgets pass",
  ],
  metrics: result.summaries,
  lhrFiles: raw.map(({ name }) => `lighthouse/${name}`),
};
if (process.env.RELEASE_EVIDENCE_DIR) {
  await mkdir(process.env.RELEASE_EVIDENCE_DIR, { recursive: true, mode: 0o700 });
  const rawDirectory = resolve(process.env.RELEASE_EVIDENCE_DIR, "lighthouse");
  await mkdir(rawDirectory, { recursive: true, mode: 0o700 });
  for (const { name, sanitized } of raw) await writeFile(resolve(rawDirectory, name), sanitized, { mode: 0o600 });
  await writeFile(resolve(process.env.RELEASE_EVIDENCE_DIR, "lighthouse-summary.json"), `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });
}
console.log(JSON.stringify({ status: "pass", routes: result.routes, summaries: result.summaries }));
