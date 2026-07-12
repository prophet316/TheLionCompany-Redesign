import { describe, expect, it } from "vitest";
import {
  assertDeploymentBinding,
  assertHealthSampleBinding,
  assertHealthSourceBinding,
  evaluateReleaseHealth,
} from "../../../lib/release/health.mjs";
import type { HealthMetrics, HealthSample } from "../../../lib/release/health.mjs";

const deployment = {
  id: "dpl_candidate123",
  url: "the-lion-company-candidate-abc.vercel.app",
  readyState: "READY",
  target: null,
  alias: [],
  meta: { githubCommitSha: "a".repeat(40) },
};
const stagedDeployment = { ...deployment, id: "dpl_stagedprod123", target: "production", alias: [] };

function healthy(): HealthMetrics {
  return {
    invariants: {
      homeAvailable: true,
      teachingsAvailable: true,
      privacyLeak: false,
      falseFormSuccess: false,
      wrongCanonical: false,
      accidentalNoindex: false,
      redirectLoop: false,
      coreActionFailure: false,
      consentOrCspBlocksCore: false,
    },
    fiveMinute: { requests: 500, errors5xx: 2 },
    fifteenMinute: { measuredSessions: 500, clientErrors: 4, identicalSafeCodeErrors: 2 },
    forms: { attempts: 40, accepted: 40, consecutiveFailures: 0 },
    lcp: { candidateMs: 2200, postPromotionRunsMs: [2200, 2250, 2300] },
  };
}

describe("immutable deployment binding", () => {
  it("accepts Preview QA and staged Production as separate ready deployments for the same exact Git SHA", () => {
    expect(assertDeploymentBinding({
      deployment,
      expectedDeploymentId: deployment.id,
      expectedCommitSha: "a".repeat(40),
      baseURL: `https://${deployment.url}`,
      mode: "preview-qa",
    })).toMatchObject({ deploymentId: deployment.id, commitSha: "a".repeat(40) });
    expect(assertDeploymentBinding({
      deployment: stagedDeployment,
      expectedDeploymentId: stagedDeployment.id,
      expectedCommitSha: "a".repeat(40),
      baseURL: `https://${stagedDeployment.url}`,
      mode: "staged-production",
    })).toMatchObject({ deploymentId: stagedDeployment.id, commitSha: "a".repeat(40) });
    expect(stagedDeployment.id).not.toBe(deployment.id);
  });

  it("rejects mutable aliases, custom domains on staging, wrong commits, and non-ready deployments", () => {
    expect(() => assertDeploymentBinding({ deployment, expectedDeploymentId: deployment.id, expectedCommitSha: "b".repeat(40), baseURL: `https://${deployment.url}`, mode: "preview-qa" })).toThrow(/Git SHA/);
    expect(() => assertDeploymentBinding({ deployment, expectedDeploymentId: deployment.id, expectedCommitSha: "a".repeat(40), baseURL: "https://branch-alias.vercel.app", mode: "preview-qa" })).toThrow(/immutable/);
    expect(() => assertDeploymentBinding({ deployment: { ...deployment, readyState: "ERROR" }, expectedDeploymentId: deployment.id, expectedCommitSha: "a".repeat(40), baseURL: `https://${deployment.url}`, mode: "preview-qa" })).toThrow(/READY/);
    expect(() => assertDeploymentBinding({ deployment: { ...stagedDeployment, alias: ["www.thelioncompany.org"] }, expectedDeploymentId: stagedDeployment.id, expectedCommitSha: "a".repeat(40), baseURL: `https://${stagedDeployment.url}`, mode: "staged-production" })).toThrow(/custom Production domain/);
  });

  it("rejects non-HTTPS, credential-bearing, malformed-SHA, and unknown bindings", () => {
    expect(() => assertDeploymentBinding({ deployment, expectedDeploymentId: deployment.id, expectedCommitSha: "a".repeat(40), baseURL: `http://${deployment.url}`, mode: "preview-qa" })).toThrow(/HTTPS/);
    expect(() => assertDeploymentBinding({ deployment, expectedDeploymentId: deployment.id, expectedCommitSha: "a".repeat(40), baseURL: `https://user:pass@${deployment.url}`, mode: "preview-qa" })).toThrow(/credentials/);
    expect(() => assertDeploymentBinding({ deployment: { ...deployment, meta: { githubCommitSha: "short" } }, expectedDeploymentId: deployment.id, expectedCommitSha: "short", baseURL: `https://${deployment.url}`, mode: "preview-qa" })).toThrow(/40-character/);
    expect(() => assertDeploymentBinding({ deployment, expectedDeploymentId: deployment.id, expectedCommitSha: "a".repeat(40), baseURL: `https://${deployment.url}`, mode: "invalid" as "production" })).toThrow(/mode/);
  });
});

describe("release health", () => {
  it("binds checkpoint sources, deployment, SHA, and elapsed production time", () => {
    const sample: HealthSample = {
      ...healthy(),
      schemaVersion: 1,
      deploymentId: deployment.id,
      commitSha: "a".repeat(40),
      checkpoint: "15m",
      windowStartedAt: "2026-07-11T12:00:00.000Z",
      windowEndedAt: "2026-07-11T12:15:00.000Z",
      collectedAt: "2026-07-11T12:15:01.000Z",
      sourceArtifacts: (["vercel", "brevo", "ga4", "synthetic"] as const).map((kind) => ({ kind, path: `sources/${kind}.json`, sha256: "a".repeat(64) })),
    };
    expect(assertHealthSampleBinding(sample, {
      expectedDeploymentId: deployment.id,
      expectedCommitSha: "a".repeat(40),
      expectedCheckpoint: "15m",
      promotionRecordedAt: "2026-07-11T12:00:00.000Z",
      now: Date.parse("2026-07-11T12:16:00.000Z"),
    })).toMatchObject({ checkpointElapsedMinutes: 15 });
    expect(() => assertHealthSampleBinding({ ...sample, deploymentId: "dpl_other" }, {
      expectedDeploymentId: deployment.id,
      expectedCommitSha: "a".repeat(40),
      expectedCheckpoint: "15m",
      promotionRecordedAt: "2026-07-11T12:00:00.000Z",
      now: Date.parse("2026-07-11T12:16:00.000Z"),
    })).toThrow(/deployment/);
    expect(() => assertHealthSampleBinding({ ...sample, windowEndedAt: "2026-07-11T12:14:59.000Z" }, {
      expectedDeploymentId: deployment.id,
      expectedCommitSha: "a".repeat(40),
      expectedCheckpoint: "15m",
      promotionRecordedAt: "2026-07-11T12:00:00.000Z",
      now: Date.parse("2026-07-11T12:16:00.000Z"),
    })).toThrow(/elapsed/);
  });

  it("binds each privacy-safe source envelope to the exact sample aggregate", () => {
    const sample: HealthSample = {
      ...healthy(),
      schemaVersion: 1,
      deploymentId: deployment.id,
      commitSha: "a".repeat(40),
      checkpoint: "15m",
      windowStartedAt: "2026-07-11T12:00:00.000Z",
      windowEndedAt: "2026-07-11T12:15:00.000Z",
      collectedAt: "2026-07-11T12:15:01.000Z",
      sourceArtifacts: [],
    };
    const envelope = {
      schemaVersion: 1,
      source: "vercel",
      deploymentId: sample.deploymentId,
      commitSha: sample.commitSha,
      windowStartedAt: sample.windowStartedAt,
      windowEndedAt: sample.windowEndedAt,
      metrics: { fiveMinute: sample.fiveMinute },
    };
    expect(assertHealthSourceBinding(envelope, sample, "vercel")).toEqual({ source: "vercel" });
    expect(assertHealthSourceBinding({ ...envelope, metrics: { fiveMinute: { errors5xx: 2, requests: 500 } } }, sample, "vercel")).toEqual({ source: "vercel" });
    expect(() => assertHealthSourceBinding({ ...envelope, metrics: { fiveMinute: { requests: 1, errors5xx: 0 } } }, sample, "vercel")).toThrow(/aggregate/);
    expect(() => assertHealthSourceBinding({ ...envelope, rawRequests: ["private"] }, sample, "vercel")).toThrow(/unexpected/);
  });

  it("passes a healthy sample", () => {
    expect(evaluateReleaseHealth(healthy())).toEqual({ status: "pass", rollbackReasons: [] });
  });

  it.each([
    ["availability", (value: ReturnType<typeof healthy>) => { value.invariants.homeAvailable = false; }],
    ["privacy", (value: ReturnType<typeof healthy>) => { value.invariants.privacyLeak = true; }],
    ["false success", (value: ReturnType<typeof healthy>) => { value.invariants.falseFormSuccess = true; }],
    ["canonical", (value: ReturnType<typeof healthy>) => { value.invariants.wrongCanonical = true; }],
    ["noindex", (value: ReturnType<typeof healthy>) => { value.invariants.accidentalNoindex = true; }],
    ["redirect", (value: ReturnType<typeof healthy>) => { value.invariants.redirectLoop = true; }],
    ["core action", (value: ReturnType<typeof healthy>) => { value.invariants.coreActionFailure = true; }],
    ["consent/csp", (value: ReturnType<typeof healthy>) => { value.invariants.consentOrCspBlocksCore = true; }],
  ])("immediately rolls back for %s", (_label, mutate) => {
    const value = healthy();
    mutate(value);
    expect(evaluateReleaseHealth(value).status).toBe("rollback");
  });

  it("uses exact statistical floors and strict comparisons", () => {
    const five = healthy();
    five.fiveMinute = { requests: 100, errors5xx: 2 };
    expect(evaluateReleaseHealth(five).status).toBe("rollback");
    const below = healthy();
    below.fiveMinute = { requests: 99, errors5xx: 1 };
    expect(evaluateReleaseHealth(below).status).toBe("pass");
    const client = healthy();
    client.fifteenMinute = { measuredSessions: 100, clientErrors: 3, identicalSafeCodeErrors: 0 };
    expect(evaluateReleaseHealth(client).status).toBe("rollback");
    const code = healthy();
    code.fifteenMinute = { measuredSessions: 20, clientErrors: 1, identicalSafeCodeErrors: 10 };
    expect(evaluateReleaseHealth(code).status).toBe("rollback");
    const forms = healthy();
    forms.forms = { attempts: 20, accepted: 18, consecutiveFailures: 0 };
    expect(evaluateReleaseHealth(forms).status).toBe("rollback");
    const consecutive = healthy();
    consecutive.forms.consecutiveFailures = 3;
    expect(evaluateReleaseHealth(consecutive).status).toBe("rollback");
    const lcp = healthy();
    lcp.lcp.postPromotionRunsMs = [2861, 2861, 2861];
    expect(evaluateReleaseHealth(lcp).status).toBe("rollback");
    const boundary = healthy();
    boundary.lcp.postPromotionRunsMs = [2860, 2860, 2860];
    expect(evaluateReleaseHealth(boundary).status).toBe("pass");
  });

  it("fails closed on invalid or internally inconsistent numerical evidence", () => {
    const nonFinite = healthy();
    nonFinite.fiveMinute.requests = Number.NaN;
    expect(() => evaluateReleaseHealth(nonFinite)).toThrow(/finite/);
    const impossible = healthy();
    impossible.forms.accepted = impossible.forms.attempts + 1;
    expect(() => evaluateReleaseHealth(impossible)).toThrow(/accepted/);
    const invalidBaseline = healthy();
    invalidBaseline.lcp.candidateMs = 0;
    expect(() => evaluateReleaseHealth(invalidBaseline)).toThrow(/candidate LCP/);
  });
});
