import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { assertHealthSampleBinding, assertHealthSourceBinding, evaluateReleaseHealth } from "../lib/release/health.mjs";

const required = [
  "RELEASE_HEALTH_SAMPLE_PATH",
  "RELEASE_PRODUCTION_SMOKE_PATH",
  "RELEASE_CHECKPOINT",
  "RELEASE_DEPLOYMENT_ID",
  "RELEASE_COMMIT_SHA",
  "RELEASE_EVIDENCE_DIR",
];
for (const name of required) if (!process.env[name]) throw new Error(`${name} is required`);
if (!new Set(["15m", "1h", "24h", "72h", "7d"]).has(process.env.RELEASE_CHECKPOINT)) {
  throw new Error("invalid RELEASE_CHECKPOINT");
}

const evidenceRoot = resolve(process.env.RELEASE_EVIDENCE_DIR);
const samplePath = resolve(process.env.RELEASE_HEALTH_SAMPLE_PATH);
const productionPath = resolve(process.env.RELEASE_PRODUCTION_SMOKE_PATH);
for (const path of [samplePath, productionPath]) {
  if (!path.startsWith(`${evidenceRoot}/`)) throw new Error("health inputs must stay inside the release evidence directory");
}

const sampleBytes = await readFile(samplePath);
const sample = JSON.parse(sampleBytes.toString("utf8"));
const production = JSON.parse(await readFile(productionPath, "utf8"));
if (
  production.gate !== "production-smoke" ||
  production.status !== "pass" ||
  production.deploymentScope !== "production" ||
  production.deploymentId !== process.env.RELEASE_DEPLOYMENT_ID ||
  production.commitSha !== process.env.RELEASE_COMMIT_SHA
) throw new Error("production smoke is not bound to this health sample");

const binding = assertHealthSampleBinding(sample, {
  expectedDeploymentId: process.env.RELEASE_DEPLOYMENT_ID,
  expectedCommitSha: process.env.RELEASE_COMMIT_SHA,
  expectedCheckpoint: process.env.RELEASE_CHECKPOINT,
  promotionRecordedAt: production.recordedAt,
  now: Date.now(),
});

const artifacts = [];
for (const artifact of sample.sourceArtifacts) {
  const path = resolve(evidenceRoot, artifact.path);
  if (!path.startsWith(`${evidenceRoot}/`)) throw new Error(`health source escapes evidence directory: ${artifact.path}`);
  const bytes = await readFile(path);
  const source = JSON.parse(bytes.toString("utf8"));
  assertHealthSourceBinding(source, sample, artifact.kind);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== artifact.sha256) throw new Error(`health source hash mismatch: ${artifact.path}`);
  artifacts.push({ path: relative(evidenceRoot, path), sha256 });
}
artifacts.push({ path: relative(evidenceRoot, samplePath), sha256: createHash("sha256").update(sampleBytes).digest("hex") });

const result = evaluateReleaseHealth(sample);
const evidence = {
  schemaVersion: 1,
  gate: `observability-${process.env.RELEASE_CHECKPOINT}`,
  status: result.status === "pass" ? "pass" : "fail",
  recordedAt: binding.collectedAt,
  deploymentScope: "production",
  deploymentId: process.env.RELEASE_DEPLOYMENT_ID,
  commitSha: process.env.RELEASE_COMMIT_SHA,
  assertions: result.status === "pass"
    ? ["availability and invariant checks pass", "5xx/client/form/LCP thresholds remain below rollback gates"]
    : result.rollbackReasons,
  metrics: {
    checkpointElapsedMinutes: binding.checkpointElapsedMinutes,
    sourceWindowStartedAt: binding.windowStartedAt,
    sourceWindowEndedAt: binding.windowEndedAt,
    sourceArtifacts: artifacts.length,
    requests5m: sample.fiveMinute.requests,
    errors5xx5m: sample.fiveMinute.errors5xx,
    measuredSessions15m: sample.fifteenMinute.measuredSessions,
    clientErrors15m: sample.fifteenMinute.clientErrors,
    formAttempts: sample.forms.attempts,
    formAccepted: sample.forms.accepted,
  },
  artifacts,
};
await mkdir(evidenceRoot, { recursive: true, mode: 0o700 });
await writeFile(resolve(evidenceRoot, `${evidence.gate}.json`), `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({ status: evidence.status, rollbackReasons: result.rollbackReasons }));
if (result.status === "rollback") process.exitCode = 2;
