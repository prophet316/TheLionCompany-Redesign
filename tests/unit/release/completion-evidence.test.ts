import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CLOSEOUT_GATES,
  LAUNCH_GATES,
  sealEvidenceDirectory,
  verifyEvidenceDirectory,
} from "../../../lib/release/evidence.mjs";

const deploymentId = "dpl_candidate123";
const previewDeploymentId = "dpl_previewqa123";
const commitSha = "a".repeat(40);
const promotionRecordedAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();

function gate(directory: string, definition: { file: string; gate: string; scope: "preview-qa" | "staged-production" | "production" }) {
  const now = new Date().toISOString();
  const gateDirectory = join(directory, dirname(definition.file));
  mkdirSync(gateDirectory, { recursive: true });
  const manual = new Set([
    "automated-checks", "browser-matrix", "accessibility-manual", "external-destinations",
    "form-soak-volume", "form-soak-rate-limit-prayer", "form-soak-rate-limit-contact",
    "form-soak-rate-limit-newsletter", "form-soak-outage", "brevo-doi-lifecycle", "retention", "rollback-readiness",
    "legacy-reconciliation", "production-consent", "production-forms", "search-console", "field-inp",
  ]).has(definition.gate);
  const artifact = `${definition.gate}-artifact.txt`;
  const artifacts: Array<{ path: string; sha256: string }> = [];
  if (manual) {
    const names = definition.gate === "legacy-reconciliation"
      ? ["search-console", "ga4-landing-pages", "wix-history", "backlinks", "vercel-logs"].map((source) => `legacy-${source}.json`)
      : [artifact];
    for (const name of names) {
      const value = `${definition.gate} restricted evidence`;
      writeFileSync(join(gateDirectory, name), value);
      artifacts.push({ path: name, sha256: createHash("sha256").update(value).digest("hex") });
    }
  }
  const elapsed: Record<string, number> = {
    "observability-15m": 15,
    "observability-1h": 60,
    "observability-24h": 1440,
    "observability-72h": 4320,
    "observability-7d": 10080,
  };
  const metrics = definition.gate === "field-inp"
    ? { measuredHomeViews: 200, inpP75Ms: 200, measurementStartedAt: promotionRecordedAt, measurementEndedAt: now }
    : definition.gate === "pii-canary-scan"
      ? { hits: 0, realHandlerPosts: 3, boundLogWindow: true, logExportSha256: "a".repeat(64) }
      : elapsed[definition.gate]
        ? { checkpointElapsedMinutes: elapsed[definition.gate], sourceWindowStartedAt: promotionRecordedAt, sourceWindowEndedAt: now, sourceArtifacts: 5 }
        : undefined;
  if (elapsed[definition.gate]) {
    for (let index = 1; index <= 5; index += 1) {
      const path = `${definition.gate}-source-${index}.json`;
      const value = JSON.stringify({ gate: definition.gate, source: index });
      writeFileSync(join(gateDirectory, path), value);
      artifacts.push({ path, sha256: createHash("sha256").update(value).digest("hex") });
    }
  }
  const gatePath = join(directory, definition.file);
  const identity = definition.gate === "preview-qa-metadata"
    ? { immutableURL: `https://${previewDeploymentId}.vercel.app`, aliases: [] }
    : definition.gate === "candidate-metadata"
      ? {
          immutableURL: `https://${deploymentId}.vercel.app`,
          aliases: [],
          previewQa: { deploymentId: previewDeploymentId, immutableURL: `https://${previewDeploymentId}.vercel.app`, commitSha },
        }
      : definition.gate === "production-smoke"
        ? { immutableURL: `https://${deploymentId}.vercel.app`, aliases: ["www.thelioncompany.org"] }
        : {};
  writeFileSync(gatePath, JSON.stringify({
    schemaVersion: 1,
    gate: definition.gate,
    status: "pass",
    recordedAt: definition.gate === "production-smoke" ? promotionRecordedAt : now,
    deploymentScope: definition.scope,
    deploymentId: definition.scope === "preview-qa" ? previewDeploymentId : deploymentId,
    commitSha,
    assertions: [`${definition.gate} authoritative assertion`],
    ...(metrics ? { metrics } : {}),
    ...(manual ? { manual: true, reviewerRole: "release reviewer" } : {}),
    ...(artifacts.length ? { artifacts } : {}),
    ...identity,
  }));
}

function complete(phase: "launch" | "closeout") {
  const directory = mkdtempSync(join(tmpdir(), "tlc-release-evidence-"));
  for (const definition of phase === "launch" ? LAUNCH_GATES : CLOSEOUT_GATES) gate(directory, definition);
  return directory;
}

describe("completion evidence", () => {
  it("keeps the approved finite gate registry and deployment scopes explicit", () => {
    expect(LAUNCH_GATES).toHaveLength(20);
    expect(CLOSEOUT_GATES).toHaveLength(35);
    expect(LAUNCH_GATES.some((gate) => gate.scope === "preview-qa")).toBe(true);
    expect(LAUNCH_GATES.some((gate) => gate.scope === "staged-production")).toBe(true);
    expect(CLOSEOUT_GATES.some((gate) => gate.scope === "production")).toBe(true);
    expect(new Set(CLOSEOUT_GATES.map((gate) => gate.file)).size).toBe(CLOSEOUT_GATES.length);
    expect(new Set(CLOSEOUT_GATES.map((gate) => gate.gate)).size).toBe(CLOSEOUT_GATES.length);
  });

  it("rejects any missing launch requirement", async () => {
    const directory = complete("launch");
    const missing = LAUNCH_GATES[3];
    writeFileSync(join(directory, missing.file), "");
    await expect(verifyEvidenceDirectory(directory, "launch", deploymentId, previewDeploymentId, commitSha)).rejects.toThrow();
  });

  it("rejects a gate from another deployment or commit", async () => {
    const directory = complete("launch");
    const path = join(directory, LAUNCH_GATES[0].file);
    const record = JSON.parse(readFileSync(path, "utf8"));
    writeFileSync(path, JSON.stringify({ ...record, commitSha: "b".repeat(40) }));
    await expect(verifyEvidenceDirectory(directory, "launch", deploymentId, previewDeploymentId, commitSha)).rejects.toThrow(/commit/);
  });

  it("rejects stale launch evidence and a candidate that does not bind Preview QA", async () => {
    const stale = complete("launch");
    for (const definition of LAUNCH_GATES) {
      const path = join(stale, definition.file);
      const record = JSON.parse(readFileSync(path, "utf8"));
      writeFileSync(path, JSON.stringify({ ...record, recordedAt: new Date(Date.now() - 4 * 86400000).toISOString() }));
    }
    await expect(verifyEvidenceDirectory(stale, "launch", deploymentId, previewDeploymentId, commitSha)).rejects.toThrow(/stale/);

    const mismatched = complete("launch");
    const candidatePath = join(mismatched, "candidate-metadata.json");
    const candidate = JSON.parse(readFileSync(candidatePath, "utf8"));
    writeFileSync(candidatePath, JSON.stringify({ ...candidate, previewQa: { ...candidate.previewQa, deploymentId: "dpl_other" } }));
    await expect(verifyEvidenceDirectory(mismatched, "launch", deploymentId, previewDeploymentId, commitSha)).rejects.toThrow(/Preview QA/);
  });

  it("distinguishes launch from seven-day closeout", async () => {
    const directory = complete("launch");
    await expect(verifyEvidenceDirectory(directory, "launch", deploymentId, previewDeploymentId, commitSha)).resolves.toMatchObject({ phase: "launch" });
    await expect(verifyEvidenceDirectory(directory, "closeout", deploymentId, previewDeploymentId, commitSha)).rejects.toThrow(/missing/);
  });

  it("rejects pending, undersampled, late-free, or slow field INP evidence", async () => {
    for (const metrics of [
      { measuredHomeViews: 199, inpP75Ms: 200, measurementStartedAt: new Date(Date.now() - 8 * 86400000).toISOString(), measurementEndedAt: new Date().toISOString() },
      { measuredHomeViews: 200, inpP75Ms: 201, measurementStartedAt: new Date(Date.now() - 8 * 86400000).toISOString(), measurementEndedAt: new Date().toISOString() },
      { measuredHomeViews: 200, inpP75Ms: -1, measurementStartedAt: new Date(Date.now() - 8 * 86400000).toISOString(), measurementEndedAt: new Date().toISOString() },
      { measuredHomeViews: 200, inpP75Ms: 200, measurementStartedAt: new Date(Date.now() - 6 * 86400000).toISOString(), measurementEndedAt: new Date().toISOString() },
    ]) {
      const directory = complete("closeout");
      const path = join(directory, "field-inp.json");
      const record = JSON.parse(readFileSync(path, "utf8"));
      writeFileSync(path, JSON.stringify({ ...record, metrics }));
      await expect(verifyEvidenceDirectory(directory, "closeout", deploymentId, previewDeploymentId, commitSha)).rejects.toThrow(/field INP/);
    }
  });

  it("seals and verifies every closeout file hash", async () => {
    const directory = complete("closeout");
    const manifest = await sealEvidenceDirectory(directory, deploymentId, previewDeploymentId, commitSha);
    expect(manifest.files.length).toBeGreaterThan(CLOSEOUT_GATES.length);
    await expect(verifyEvidenceDirectory(directory, "closeout", deploymentId, previewDeploymentId, commitSha, true)).resolves.toMatchObject({ status: "pass", phase: "closeout" });
    writeFileSync(join(directory, CLOSEOUT_GATES[0].file), "changed");
    await expect(verifyEvidenceDirectory(directory, "closeout", deploymentId, previewDeploymentId, commitSha, true)).rejects.toThrow(/hash/);
  });

  it("rejects malformed manifest metadata and symlinked gate records", async () => {
    const sealed = complete("launch");
    await sealEvidenceDirectory(sealed, deploymentId, previewDeploymentId, commitSha);
    const manifestPath = join(sealed, "manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    writeFileSync(manifestPath, JSON.stringify({ ...manifest, schemaVersion: 2 }));
    await expect(verifyEvidenceDirectory(sealed, "launch", deploymentId, previewDeploymentId, commitSha, true)).rejects.toThrow(/manifest schema/);

    const linked = complete("launch");
    const gatePath = join(linked, LAUNCH_GATES[0].file);
    const outside = join(mkdtempSync(join(tmpdir(), "tlc-outside-gate-")), "gate.json");
    writeFileSync(outside, readFileSync(gatePath));
    unlinkSync(gatePath);
    symlinkSync(outside, gatePath);
    await expect(verifyEvidenceDirectory(linked, "launch", deploymentId, previewDeploymentId, commitSha)).rejects.toThrow(/symlink/);

    const manifestLinked = complete("launch");
    const outsideManifest = join(mkdtempSync(join(tmpdir(), "tlc-outside-manifest-")), "manifest.json");
    writeFileSync(outsideManifest, "outside");
    symlinkSync(outsideManifest, join(manifestLinked, "manifest.json"));
    await expect(sealEvidenceDirectory(manifestLinked, deploymentId, previewDeploymentId, commitSha)).rejects.toThrow(/symlink/);
  });

  it("rejects malformed or conflated deployment bindings before sealing", async () => {
    const directory = complete("launch");
    await expect(sealEvidenceDirectory(directory, deploymentId, deploymentId, commitSha)).rejects.toThrow(/separate/);
    await expect(sealEvidenceDirectory(directory, deploymentId, previewDeploymentId, "short")).rejects.toThrow(/40-character/);
  });

  it("rejects symlinked and duplicated evidence artifacts before an unsealed pass", async () => {
    const launch = complete("launch");
    const manualPath = join(launch, "automated-checks.json");
    const manual = JSON.parse(readFileSync(manualPath, "utf8"));
    const linked = join(launch, manual.artifacts[0].path);
    const outside = join(mkdtempSync(join(tmpdir(), "tlc-outside-evidence-")), "outside.txt");
    writeFileSync(outside, "automated-checks restricted evidence");
    unlinkSync(linked);
    symlinkSync(outside, linked);
    await expect(verifyEvidenceDirectory(launch, "launch", deploymentId, previewDeploymentId, commitSha)).rejects.toThrow(/symlink/);

    const closeout = complete("closeout");
    const checkpointPath = join(closeout, "observability-15m.json");
    const checkpoint = JSON.parse(readFileSync(checkpointPath, "utf8"));
    writeFileSync(checkpointPath, JSON.stringify({ ...checkpoint, artifacts: Array(5).fill(checkpoint.artifacts[0]) }));
    await expect(verifyEvidenceDirectory(closeout, "closeout", deploymentId, previewDeploymentId, commitSha)).rejects.toThrow(/distinct/);
  });

  it("records only an approved scoped manual gate with regular hashed artifacts", () => {
    const directory = mkdtempSync(join(tmpdir(), "tlc-manual-evidence-"));
    writeFileSync(join(directory, "review.txt"), "privacy-safe reviewed output");
    const env = {
      ...process.env,
      RELEASE_EVIDENCE_DIR: directory,
      RELEASE_DEPLOYMENT_SCOPE: "staged-production",
      RELEASE_DEPLOYMENT_ID: deploymentId,
      RELEASE_COMMIT_SHA: commitSha,
      MANUAL_GATE: "automated-checks",
      MANUAL_GATE_REVIEWER_ROLE: "release reviewer",
      MANUAL_GATE_ASSERTIONS_B64: Buffer.from(JSON.stringify(["all automated checks passed"])).toString("base64url"),
      MANUAL_GATE_ARTIFACTS_B64: Buffer.from(JSON.stringify(["review.txt"])).toString("base64url"),
    };
    execFileSync(process.execPath, ["scripts/record-manual-gate.mjs"], { cwd: process.cwd(), env });
    const record = JSON.parse(readFileSync(join(directory, "automated-checks.json"), "utf8"));
    expect(record).toMatchObject({ gate: "automated-checks", deploymentScope: "staged-production", manual: true });
    expect(record.artifacts[0].sha256).toMatch(/^[a-f0-9]{64}$/);

    expect(() => execFileSync(process.execPath, ["scripts/record-manual-gate.mjs"], {
      cwd: process.cwd(),
      env: { ...env, MANUAL_GATE: "../escape" },
      stdio: "pipe",
    })).toThrow();

    const outside = join(mkdtempSync(join(tmpdir(), "tlc-outside-manual-record-")), "record.json");
    writeFileSync(outside, "outside");
    unlinkSync(join(directory, "automated-checks.json"));
    symlinkSync(outside, join(directory, "automated-checks.json"));
    expect(() => execFileSync(process.execPath, ["scripts/record-manual-gate.mjs"], {
      cwd: process.cwd(),
      env,
      stdio: "pipe",
    })).toThrow();
  });
});
