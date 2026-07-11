import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readdir, readFile, stat, writeFile, mkdir } from "node:fs/promises";
import { resolve, relative } from "node:path";

const encoded = process.env.PII_CANARIES_B64;
if (!encoded) throw new Error("PII_CANARIES_B64 is required");
const canaries = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
if (!Array.isArray(canaries) || canaries.length < 4 || canaries.some((value) => typeof value !== "string" || value.length < 12)) {
  throw new Error("PII_CANARIES_B64 must encode at least four strings of 12 or more characters");
}
let realHandlerPosts = 0;
let boundLogWindow = false;
let boundLogPath = null;
let logExportSha256 = null;
if (process.env.RELEASE_EVIDENCE_DIR) {
  for (const name of ["RELEASE_DEPLOYMENT_ID", "RELEASE_COMMIT_SHA", "VERCEL_LOG_EXPORT", "VERCEL_LOG_EXPORT_STARTED_AT", "VERCEL_LOG_EXPORT_ENDED_AT"]) {
    if (!process.env[name]) throw new Error(`${name} is required for release PII evidence`);
  }
  const evidenceRoot = resolve(process.env.RELEASE_EVIDENCE_DIR);
  const runPath = resolve(evidenceRoot, "pii-canary-real-handler-run.json");
  const logPath = resolve(process.env.VERCEL_LOG_EXPORT);
  if (logPath === evidenceRoot || logPath.startsWith(`${evidenceRoot}/`)) throw new Error("raw Vercel log export must stay outside release evidence");
  const run = JSON.parse(await readFile(runPath, "utf8"));
  if (run.status !== "pass" || run.deploymentScope !== "preview-qa" || run.deploymentId !== process.env.RELEASE_DEPLOYMENT_ID || run.commitSha !== process.env.RELEASE_COMMIT_SHA) {
    throw new Error("real-handler canary run is not bound to this candidate");
  }
  const statuses = run.metrics?.statuses ?? {};
  if (run.metrics?.posts !== 3 || ["newsletter", "prayer", "contact"].some((endpoint) => statuses[endpoint] !== 202)) {
    throw new Error("real-handler canary run lacks three accepted handlers");
  }
  const exportStart = Date.parse(process.env.VERCEL_LOG_EXPORT_STARTED_AT);
  const exportEnd = Date.parse(process.env.VERCEL_LOG_EXPORT_ENDED_AT);
  if (!Number.isFinite(exportStart) || !Number.isFinite(exportEnd) || exportStart > Date.parse(run.metrics.startedAt) || exportEnd < Date.parse(run.metrics.endedAt)) {
    throw new Error("Vercel log export window does not contain the real-handler canary run");
  }
  const logInfo = await stat(logPath).catch(() => null);
  if (!logInfo?.isFile()) throw new Error("Vercel log export is missing");
  realHandlerPosts = 3;
  boundLogWindow = true;
  boundLogPath = logPath;
}
const roots = ["app", "components", "config", "content", "lib", ".next", "playwright-report", "test-results"];
if (process.env.RELEASE_EVIDENCE_DIR) roots.push(process.env.RELEASE_EVIDENCE_DIR);
if (process.env.VERCEL_LOG_EXPORT) roots.push(process.env.VERCEL_LOG_EXPORT);
const hits = [];

async function walk(path) {
  const info = await stat(path).catch(() => null);
  if (!info) return;
  if (info.isDirectory()) {
    for (const entry of await readdir(path)) await walk(resolve(path, entry));
    return;
  }
  const needles = canaries.map((value) => Buffer.from(value));
  const digest = boundLogPath === resolve(path) ? createHash("sha256") : null;
  const overlap = Math.max(...needles.map((needle) => needle.length)) - 1;
  let carry = Buffer.alloc(0);
  for await (const chunk of createReadStream(path, { highWaterMark: 1024 * 1024 })) {
    digest?.update(chunk);
    const bytes = Buffer.concat([carry, chunk]);
    for (const [index, needle] of needles.entries()) {
      if (bytes.includes(needle)) hits.push({ file: relative(process.cwd(), path), canaryIndex: index });
    }
    carry = bytes.subarray(Math.max(0, bytes.length - overlap));
  }
  if (digest) logExportSha256 = digest.digest("hex");
}
for (const root of roots) await walk(resolve(root));
if (boundLogWindow && !/^[a-f0-9]{64}$/.test(logExportSha256 ?? "")) throw new Error("Vercel log export was not completely hashed");
const result = {
  schemaVersion: 1,
  gate: "pii-canary-scan",
  status: hits.length === 0 ? "pass" : "fail",
  recordedAt: new Date().toISOString(),
  deploymentScope: process.env.RELEASE_DEPLOYMENT_SCOPE ?? "local",
  deploymentId: process.env.RELEASE_DEPLOYMENT_ID ?? "local-production-build",
  commitSha: process.env.RELEASE_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "local",
  assertions: ["synthetic canaries absent from source, build, browser reports, test artifacts, and exported Vercel logs"],
  metrics: { filesWithHits: new Set(hits.map((hit) => hit.file)).size, hits: hits.length, realHandlerPosts, boundLogWindow, logExportSha256 },
  hitLocations: hits,
};
if (process.env.RELEASE_EVIDENCE_DIR) {
  await mkdir(process.env.RELEASE_EVIDENCE_DIR, { recursive: true, mode: 0o700 });
  await writeFile(resolve(process.env.RELEASE_EVIDENCE_DIR, "pii-canary-scan.json"), `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
}
console.log(JSON.stringify({ status: result.status, metrics: result.metrics, hitLocations: hits }));
if (hits.length) process.exitCode = 1;
