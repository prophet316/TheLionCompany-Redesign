import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { lstat, open, readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export const LAUNCH_GATES = [
  { file: "preview-qa/preview-qa-metadata.json", gate: "preview-qa-metadata", scope: "preview-qa" },
  { file: "candidate-metadata.json", gate: "candidate-metadata", scope: "staged-production" },
  { file: "automated-checks.json", gate: "automated-checks", scope: "staged-production" },
  { file: "browser-matrix.json", gate: "browser-matrix", scope: "staged-production" },
  { file: "accessibility-manual.json", gate: "accessibility-manual", scope: "staged-production" },
  { file: "preview-qa/public-contracts-preview.json", gate: "public-contracts-preview", scope: "preview-qa" },
  { file: "public-contracts-staged-production.json", gate: "public-contracts-staged-production", scope: "staged-production" },
  { file: "external-destinations.json", gate: "external-destinations", scope: "staged-production" },
  { file: "legacy-reconciliation.json", gate: "legacy-reconciliation", scope: "staged-production" },
  { file: "preview-qa/form-soak-volume.json", gate: "form-soak-volume", scope: "preview-qa" },
  { file: "preview-qa/form-soak-rate-limit-prayer.json", gate: "form-soak-rate-limit-prayer", scope: "preview-qa" },
  { file: "preview-qa/form-soak-rate-limit-contact.json", gate: "form-soak-rate-limit-contact", scope: "preview-qa" },
  { file: "preview-qa/form-soak-rate-limit-newsletter.json", gate: "form-soak-rate-limit-newsletter", scope: "preview-qa" },
  { file: "preview-qa/form-soak-outage.json", gate: "form-soak-outage", scope: "preview-qa" },
  { file: "preview-qa/brevo-doi-lifecycle.json", gate: "brevo-doi-lifecycle", scope: "preview-qa" },
  { file: "preview-qa/pii-canary-scan.json", gate: "pii-canary-scan", scope: "preview-qa" },
  { file: "preview-qa/retention-gate.json", gate: "retention", scope: "preview-qa" },
  { file: "lighthouse-summary.json", gate: "lighthouse-budgets", scope: "staged-production" },
  { file: "pixel-motion-summary.json", gate: "physical-pixel-motion", scope: "staged-production" },
  { file: "rollback-readiness.json", gate: "rollback-readiness", scope: "staged-production" },
];

export const CLOSEOUT_GATES = [
  ...LAUNCH_GATES,
  { file: "production-smoke.json", gate: "production-smoke", scope: "production" },
  { file: "public-contracts-production.json", gate: "public-contracts-production", scope: "production" },
  { file: "canonical-http-apex.json", gate: "canonical-http-apex", scope: "production" },
  { file: "canonical-http-www.json", gate: "canonical-http-www", scope: "production" },
  { file: "canonical-https-apex.json", gate: "canonical-https-apex", scope: "production" },
  { file: "canonical-https-www.json", gate: "canonical-https-www", scope: "production" },
  { file: "production-consent.json", gate: "production-consent", scope: "production" },
  { file: "production-forms.json", gate: "production-forms", scope: "production" },
  { file: "search-console.json", gate: "search-console", scope: "production" },
  { file: "observability-15m.json", gate: "observability-15m", scope: "production" },
  { file: "observability-1h.json", gate: "observability-1h", scope: "production" },
  { file: "observability-24h.json", gate: "observability-24h", scope: "production" },
  { file: "observability-72h.json", gate: "observability-72h", scope: "production" },
  { file: "observability-7d.json", gate: "observability-7d", scope: "production" },
  { file: "field-inp.json", gate: "field-inp", scope: "production" },
];

export const MANUAL_GATES = new Set([
  "automated-checks", "browser-matrix", "accessibility-manual", "external-destinations",
  "form-soak-volume", "form-soak-rate-limit-prayer", "form-soak-rate-limit-contact",
  "form-soak-rate-limit-newsletter", "form-soak-outage", "brevo-doi-lifecycle", "retention", "rollback-readiness",
  "legacy-reconciliation", "production-consent", "production-forms", "search-console", "field-inp",
]);

const CHECKPOINT_MINUTES = new Map([
  ["observability-15m", 15],
  ["observability-1h", 60],
  ["observability-24h", 1440],
  ["observability-72h", 4320],
  ["observability-7d", 10080],
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function assertBindings(stagedDeploymentId, previewDeploymentId, commitSha) {
  invariant(/^dpl_[A-Za-z0-9]+$/.test(stagedDeploymentId), "staged deployment ID is invalid");
  invariant(/^dpl_[A-Za-z0-9]+$/.test(previewDeploymentId), "Preview QA deployment ID is invalid");
  invariant(stagedDeploymentId !== previewDeploymentId, "Preview QA and staged Production must be separate deployments");
  invariant(/^[a-f0-9]{40}$/i.test(commitSha), "release commit must be a 40-character hexadecimal Git SHA");
}

function assertImmutableVercelUrl(value, message) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(message);
  }
  invariant(
    url.protocol === "https:" &&
      url.hostname.endsWith(".vercel.app") &&
      !url.username &&
      !url.password &&
      !url.port &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash,
    message,
  );
}

async function sha256(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

async function writePrivateFile(path, value) {
  const handle = await open(
    path,
    constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | constants.O_NOFOLLOW,
    0o600,
  );
  try {
    await handle.writeFile(value, "utf8");
  } finally {
    await handle.close();
  }
}

async function walk(directory, prefix = "") {
  const output = [];
  for (const entry of await readdir(resolve(directory, prefix), { withFileTypes: true })) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    invariant(!entry.isSymbolicLink(), `evidence symlink is forbidden: ${relativePath}`);
    if (relativePath === "manifest.json") {
      invariant(entry.isFile(), "manifest must be a regular file");
      continue;
    }
    if (entry.isDirectory()) output.push(...await walk(directory, relativePath));
    else {
      invariant(entry.isFile(), `evidence entry is not a regular file: ${relativePath}`);
      output.push(relativePath);
    }
  }
  return output;
}

function assertEnvelope(record, definition, stagedDeploymentId, previewDeploymentId, commitSha) {
  invariant(record?.schemaVersion === 1, `${definition.file} schema mismatch`);
  invariant(record.gate === definition.gate, `${definition.file} gate mismatch`);
  invariant(record.status === "pass", `${definition.file} does not pass`);
  invariant(record.deploymentScope === definition.scope, `${definition.file} deployment scope mismatch`);
  const expectedDeploymentId = definition.scope === "preview-qa" ? previewDeploymentId : stagedDeploymentId;
  invariant(record.deploymentId === expectedDeploymentId, `${definition.file} deployment mismatch`);
  invariant(record.commitSha === commitSha, `${definition.file} commit mismatch`);
  const recordedAt = Date.parse(record.recordedAt);
  invariant(Number.isFinite(recordedAt), `${definition.file} has invalid recordedAt`);
  invariant(recordedAt <= Date.now() + 5 * 60 * 1000, `${definition.file} recordedAt is in the future`);
  invariant(
    Array.isArray(record.assertions) &&
      record.assertions.length > 0 &&
      record.assertions.every((item) => typeof item === "string" && item.trim()),
    `${definition.file} has no assertions`,
  );
  if (MANUAL_GATES.has(definition.gate)) {
    invariant(record.manual === true, `${definition.file} must be a reviewed manual gate`);
    invariant(typeof record.reviewerRole === "string" && record.reviewerRole.trim().length >= 3, `${definition.file} lacks reviewer role`);
    invariant(Array.isArray(record.artifacts) && record.artifacts.length > 0, `${definition.file} lacks reviewed artifacts`);
  }
  if (Array.isArray(record.artifacts)) {
    invariant(new Set(record.artifacts.map((artifact) => artifact.path)).size === record.artifacts.length, `${definition.file} artifacts must be distinct`);
  }
  if (CHECKPOINT_MINUTES.has(definition.gate)) {
    invariant(record.metrics?.checkpointElapsedMinutes === CHECKPOINT_MINUTES.get(definition.gate), `${definition.file} checkpoint elapsed time mismatch`);
    invariant(
      Number.isFinite(Date.parse(record.metrics?.sourceWindowStartedAt)) &&
        Number.isFinite(Date.parse(record.metrics?.sourceWindowEndedAt)),
      `${definition.file} source window is invalid`,
    );
    invariant(Number.isInteger(record.metrics?.sourceArtifacts) && record.metrics.sourceArtifacts >= 5, `${definition.file} lacks bound health source artifacts`);
    invariant(Array.isArray(record.artifacts) && record.artifacts.length >= 5, `${definition.file} lacks sealed health source artifacts`);
    invariant(record.metrics.sourceArtifacts === record.artifacts.length, `${definition.file} health source artifact count mismatch`);
  }
  if (definition.gate === "pii-canary-scan") {
    invariant(
      record.metrics?.hits === 0 &&
        record.metrics?.realHandlerPosts === 3 &&
        record.metrics?.boundLogWindow === true &&
        /^[a-f0-9]{64}$/.test(record.metrics?.logExportSha256 ?? ""),
      "PII canary gate lacks a clean bound real-handler log scan",
    );
  }
  if (definition.gate === "legacy-reconciliation") {
    const paths = (record.artifacts ?? []).map((artifact) => artifact.path.toLowerCase());
    for (const source of ["search-console", "ga4-landing-pages", "wix-history", "backlinks", "vercel-logs"]) {
      invariant(paths.some((path) => path.includes(source)), `legacy reconciliation lacks ${source} evidence`);
    }
  }
  if (definition.gate === "preview-qa-metadata") {
    assertImmutableVercelUrl(record.immutableURL, "Preview QA metadata lacks an immutable HTTPS Vercel URL");
  }
  if (definition.gate === "candidate-metadata") {
    assertImmutableVercelUrl(record.immutableURL, "candidate metadata lacks an immutable HTTPS Vercel URL");
    invariant(!(record.aliases ?? []).some((alias) => alias === "www.thelioncompany.org" || alias === "thelioncompany.org"), "candidate metadata already owns a custom Production domain");
    invariant(record.previewQa?.deploymentId === previewDeploymentId, "candidate metadata Preview QA deployment mismatch");
    invariant(record.previewQa?.commitSha === commitSha, "candidate metadata Preview QA commit mismatch");
    assertImmutableVercelUrl(record.previewQa?.immutableURL, "candidate metadata Preview QA URL is not immutable");
  }
  if (definition.gate === "production-smoke") {
    assertImmutableVercelUrl(record.immutableURL, "Production smoke lacks the promoted immutable Vercel URL");
    invariant((record.aliases ?? []).includes("www.thelioncompany.org"), "Production smoke lacks the canonical www alias");
  }
  if (definition.gate === "field-inp") {
    invariant(
      JSON.stringify(Object.keys(record.metrics ?? {}).sort()) ===
        JSON.stringify(["inpP75Ms", "measuredHomeViews", "measurementEndedAt", "measurementStartedAt"]),
      "field INP metrics contain an unexpected key",
    );
    invariant(Number.isInteger(record.metrics?.measuredHomeViews) && record.metrics.measuredHomeViews >= 200, "field INP requires at least 200 measured home views");
    invariant(
      typeof record.metrics?.inpP75Ms === "number" &&
        Number.isFinite(record.metrics.inpP75Ms) &&
        record.metrics.inpP75Ms >= 0 &&
        record.metrics.inpP75Ms <= 200,
      "field INP p75 exceeds 200ms or is invalid",
    );
    invariant(Number.isFinite(Date.parse(record.metrics?.measurementStartedAt)), "field INP measurementStartedAt is invalid");
    invariant(Number.isFinite(Date.parse(record.metrics?.measurementEndedAt)), "field INP measurementEndedAt is invalid");
  }
}

export async function sealEvidenceDirectory(directory, stagedDeploymentId, previewDeploymentId, commitSha) {
  assertBindings(stagedDeploymentId, previewDeploymentId, commitSha);
  const names = (await walk(directory)).sort();
  const files = [];
  for (const name of names) files.push({ path: name, sha256: await sha256(resolve(directory, name)) });
  const manifest = {
    schemaVersion: 1,
    stagedDeploymentId,
    previewDeploymentId,
    commitSha,
    sealedAt: new Date().toISOString(),
    files,
  };
  await writePrivateFile(resolve(directory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

export async function verifyEvidenceDirectory(
  directory,
  phase,
  stagedDeploymentId,
  previewDeploymentId,
  commitSha,
  requireSeal = false,
) {
  assertBindings(stagedDeploymentId, previewDeploymentId, commitSha);
  const definitions = phase === "launch" ? LAUNCH_GATES : phase === "closeout" ? CLOSEOUT_GATES : null;
  invariant(definitions, "phase must be launch or closeout");
  if (requireSeal) {
    const manifestPath = resolve(directory, "manifest.json");
    const manifestStats = await lstat(manifestPath);
    invariant(!manifestStats.isSymbolicLink() && manifestStats.isFile(), "manifest symlink or non-file is forbidden");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    invariant(manifest.schemaVersion === 1, "manifest schema mismatch");
    const sealedAt = Date.parse(manifest.sealedAt);
    invariant(Number.isFinite(sealedAt) && sealedAt <= Date.now() + 5 * 60 * 1000, "manifest sealedAt is invalid");
    invariant(Array.isArray(manifest.files) && manifest.files.length > 0, "manifest files are invalid");
    invariant(new Set(manifest.files.map((entry) => entry.path)).size === manifest.files.length, "manifest file paths must be distinct");
    for (const entry of manifest.files) {
      invariant(typeof entry.path === "string" && entry.path.length > 0 && /^[a-f0-9]{64}$/.test(entry.sha256 ?? ""), "manifest file entry is invalid");
    }
    invariant(
      manifest.stagedDeploymentId === stagedDeploymentId &&
        manifest.previewDeploymentId === previewDeploymentId &&
        manifest.commitSha === commitSha,
      "manifest deployment or commit mismatch",
    );
    const currentFiles = (await walk(directory)).sort();
    const sealedFiles = manifest.files.map((entry) => entry.path).sort();
    invariant(JSON.stringify(sealedFiles) === JSON.stringify(currentFiles), "manifest file set does not match current evidence directory");
    for (const entry of manifest.files) {
      invariant(entry.sha256 === await sha256(resolve(directory, entry.path)), `manifest hash mismatch: ${entry.path}`);
    }
    for (const definition of definitions) {
      invariant(manifest.files.some((file) => file.path === definition.file), `manifest missing ${definition.file}`);
    }
  }
  const records = [];
  for (const definition of definitions) {
    const gatePath = resolve(directory, definition.file);
    let gateStats;
    try {
      gateStats = await lstat(gatePath);
    } catch {
      throw new Error(`missing or invalid ${definition.file}`);
    }
    invariant(!gateStats.isSymbolicLink(), `evidence gate symlink is forbidden: ${definition.file}`);
    invariant(gateStats.isFile(), `evidence gate is not a regular file: ${definition.file}`);
    let record;
    try {
      record = JSON.parse(await readFile(gatePath, "utf8"));
    } catch {
      throw new Error(`missing or invalid ${definition.file}`);
    }
    assertEnvelope(record, definition, stagedDeploymentId, previewDeploymentId, commitSha);
    const gateDirectory = resolve(directory, dirname(definition.file));
    for (const artifact of record.artifacts ?? []) {
      invariant(typeof artifact.path === "string" && artifact.path.length > 0, `manual artifact path is invalid: ${definition.file}`);
      invariant(/^[a-f0-9]{64}$/.test(artifact.sha256 ?? ""), `manual artifact hash is invalid: ${artifact.path}`);
      const artifactPath = resolve(gateDirectory, artifact.path);
      invariant(artifactPath.startsWith(`${gateDirectory}/`), `manual artifact escapes its scoped evidence directory: ${artifact.path}`);
      const artifactStats = await lstat(artifactPath);
      invariant(!artifactStats.isSymbolicLink(), `evidence artifact symlink is forbidden: ${artifact.path}`);
      invariant(artifactStats.isFile(), `evidence artifact is not a regular file: ${artifact.path}`);
      invariant(artifact.sha256 === await sha256(artifactPath), `manual artifact hash mismatch: ${artifact.path}`);
    }
    records.push(record);
  }
  const timestamps = records.map((record) => Date.parse(record.recordedAt));
  if (phase === "launch") {
    invariant(Math.max(...timestamps) - Math.min(...timestamps) <= 72 * 60 * 60 * 1000, "launch evidence spans more than 72 hours");
    invariant(Date.now() - Math.min(...timestamps) <= 72 * 60 * 60 * 1000, "launch evidence is stale");
  }
  if (phase === "closeout") {
    const sevenDay = records.find((record) => record.gate === "observability-7d");
    invariant(Date.now() - Date.parse(sevenDay.recordedAt) <= 24 * 60 * 60 * 1000, "seven-day closeout evidence is stale");
    const production = records.find((record) => record.gate === "production-smoke");
    for (const [gate, minutes] of CHECKPOINT_MINUTES) {
      const checkpoint = records.find((record) => record.gate === gate);
      const minimum = Date.parse(production.recordedAt) + minutes * 60_000;
      invariant(Date.parse(checkpoint.recordedAt) >= minimum, `${gate} was recorded before its production checkpoint elapsed`);
      invariant(Date.parse(checkpoint.metrics.sourceWindowStartedAt) === Date.parse(production.recordedAt), `${gate} source window is not bound to production smoke`);
      invariant(
        Date.parse(checkpoint.metrics.sourceWindowEndedAt) >= minimum &&
          Date.parse(checkpoint.metrics.sourceWindowEndedAt) <= Date.parse(checkpoint.recordedAt),
        `${gate} source window does not cover its checkpoint`,
      );
    }
    const fieldInp = records.find((record) => record.gate === "field-inp");
    const startedAt = Date.parse(fieldInp.metrics.measurementStartedAt);
    const endedAt = Date.parse(fieldInp.metrics.measurementEndedAt);
    invariant(startedAt >= Date.parse(production.recordedAt), "field INP window starts before the bound production deployment");
    invariant(endedAt - startedAt >= 7 * 24 * 60 * 60 * 1000, "field INP measurement window is under seven days");
    invariant(
      endedAt <= Date.parse(fieldInp.recordedAt) && endedAt <= Date.now() + 5 * 60 * 1000,
      "field INP measurement end is not bound to the recorded export time",
    );
  }
  return { status: "pass", phase, gates: definitions.length, stagedDeploymentId, previewDeploymentId, commitSha };
}
