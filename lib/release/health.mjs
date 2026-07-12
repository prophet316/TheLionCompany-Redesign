import { isDeepStrictEqual } from "node:util";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function finiteNonnegative(value, name, { integer = false } = {}) {
  invariant(typeof value === "number" && Number.isFinite(value), `${name} must be finite`);
  invariant(value >= 0, `${name} must be nonnegative`);
  if (integer) invariant(Number.isInteger(value), `${name} must be an integer`);
  return value;
}

export function median(values) {
  for (const value of values) finiteNonnegative(value, "median value");
  const sorted = [...values].sort((a, b) => a - b);
  invariant(sorted.length > 0, "median requires values");
  return sorted.length % 2
    ? sorted[Math.floor(sorted.length / 2)]
    : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
}

export function assertDeploymentBinding(input) {
  const deployment = input.deployment;
  invariant(new Set(["preview-qa", "staged-production", "production"]).has(input.mode), "unknown deployment binding mode");
  invariant(/^[a-f0-9]{40}$/i.test(input.expectedCommitSha), "expected Git SHA must be a 40-character hexadecimal value");
  invariant(deployment.id === input.expectedDeploymentId, "deployment ID mismatch");
  invariant(deployment.readyState === "READY", "deployment is not READY");
  const commitSha = deployment.meta?.githubCommitSha ?? deployment.gitSource?.sha;
  invariant(commitSha === input.expectedCommitSha, "deployment Git SHA mismatch");
  const base = new URL(input.baseURL);
  invariant(base.protocol === "https:", "deployment binding URL must use HTTPS");
  invariant(!base.username && !base.password, "deployment binding URL must not contain credentials");
  invariant(!base.port && base.pathname === "/" && !base.search && !base.hash, "deployment binding URL must be an exact origin");
  const host = base.hostname;
  if (input.mode === "preview-qa") {
    invariant(host === deployment.url, "Preview QA URL is not the immutable deployment URL");
  } else if (input.mode === "staged-production") {
    invariant(host === deployment.url, "staged Production URL is not the immutable deployment URL");
    invariant(deployment.target === "production", "staged deployment was not built with Production environment settings");
    invariant(
      !(deployment.alias ?? []).some((alias) => alias === "www.thelioncompany.org" || alias === "thelioncompany.org"),
      "staged deployment already owns a custom Production domain",
    );
  } else {
    invariant(
      host === "www.thelioncompany.org" && deployment.alias?.includes(host),
      "production canonical alias is not bound to the staged candidate deployment",
    );
    invariant(deployment.target === "production", "canonical deployment is not a Production build");
  }
  return { deploymentId: deployment.id, commitSha, immutableURL: `https://${deployment.url}` };
}

const CHECKPOINT_MINUTES = { "15m": 15, "1h": 60, "24h": 1440, "72h": 4320, "7d": 10080 };

export function assertHealthSampleBinding(sample, input) {
  invariant(sample.schemaVersion === 1, "health sample schema mismatch");
  invariant(sample.deploymentId === input.expectedDeploymentId, "health sample deployment mismatch");
  invariant(sample.commitSha === input.expectedCommitSha, "health sample commit mismatch");
  invariant(sample.checkpoint === input.expectedCheckpoint, "health sample checkpoint mismatch");
  const checkpointElapsedMinutes = CHECKPOINT_MINUTES[input.expectedCheckpoint];
  invariant(checkpointElapsedMinutes, "unknown health checkpoint");
  const promotion = Date.parse(input.promotionRecordedAt);
  const started = Date.parse(sample.windowStartedAt);
  const ended = Date.parse(sample.windowEndedAt);
  const collected = Date.parse(sample.collectedAt);
  invariant(
    Number.isFinite(promotion) && Number.isFinite(started) && Number.isFinite(ended) && Number.isFinite(collected),
    "health sample has invalid timestamps",
  );
  invariant(started === promotion, "health source window must start at bound production smoke");
  invariant(ended >= promotion + checkpointElapsedMinutes * 60_000, "health checkpoint elapsed time has not passed");
  invariant(collected >= ended && collected <= input.now + 5 * 60_000, "health collection time is outside its source window");
  const kinds = (sample.sourceArtifacts ?? []).map((artifact) => artifact.kind).sort();
  invariant(
    JSON.stringify(kinds) === JSON.stringify(["brevo", "ga4", "synthetic", "vercel"]),
    "health sample requires exact Vercel, Brevo, GA4, and synthetic sources",
  );
  invariant(new Set(sample.sourceArtifacts.map((artifact) => artifact.path)).size === 4, "health sample source artifacts must be distinct");
  for (const artifact of sample.sourceArtifacts) {
    invariant(typeof artifact.path === "string" && artifact.path.length > 0, "health source artifact path is missing");
    invariant(/^[a-f0-9]{64}$/.test(artifact.sha256), "health source artifact hash is invalid");
  }
  return {
    checkpointElapsedMinutes,
    windowStartedAt: sample.windowStartedAt,
    windowEndedAt: sample.windowEndedAt,
    collectedAt: sample.collectedAt,
  };
}

export function assertHealthSourceBinding(source, sample, expectedKind) {
  const topLevelKeys = Object.keys(source ?? {}).sort();
  const expectedKeys = [
    "commitSha",
    "deploymentId",
    "metrics",
    "schemaVersion",
    "source",
    "windowEndedAt",
    "windowStartedAt",
  ];
  invariant(JSON.stringify(topLevelKeys) === JSON.stringify(expectedKeys), "health source contains unexpected fields");
  invariant(source.schemaVersion === 1, "health source schema mismatch");
  invariant(source.source === expectedKind, "health source kind mismatch");
  invariant(source.deploymentId === sample.deploymentId, "health source deployment mismatch");
  invariant(source.commitSha === sample.commitSha, "health source commit mismatch");
  invariant(Date.parse(source.windowStartedAt) === Date.parse(sample.windowStartedAt), "health source start window mismatch");
  invariant(Date.parse(source.windowEndedAt) === Date.parse(sample.windowEndedAt), "health source end window mismatch");
  const expectedMetrics = {
    vercel: { fiveMinute: sample.fiveMinute },
    ga4: { fifteenMinute: sample.fifteenMinute },
    brevo: { forms: sample.forms },
    synthetic: { invariants: sample.invariants, lcp: sample.lcp },
  }[expectedKind];
  invariant(expectedMetrics, "unknown health source kind");
  invariant(isDeepStrictEqual(source.metrics, expectedMetrics), `health source ${expectedKind} aggregate mismatch`);
  return { source: expectedKind };
}

export function evaluateReleaseHealth(sample) {
  for (const [value, name] of [
    [sample.fiveMinute.requests, "five-minute requests"],
    [sample.fiveMinute.errors5xx, "five-minute 5xx errors"],
    [sample.fifteenMinute.measuredSessions, "fifteen-minute measured sessions"],
    [sample.fifteenMinute.clientErrors, "fifteen-minute client errors"],
    [sample.fifteenMinute.identicalSafeCodeErrors, "identical safe-code errors"],
    [sample.forms.attempts, "form attempts"],
    [sample.forms.accepted, "form accepted count"],
    [sample.forms.consecutiveFailures, "consecutive form failures"],
  ]) finiteNonnegative(value, name, { integer: true });
  invariant(sample.fiveMinute.errors5xx <= sample.fiveMinute.requests, "5xx errors cannot exceed requests");
  invariant(sample.fifteenMinute.clientErrors <= sample.fifteenMinute.measuredSessions, "client errors cannot exceed measured sessions");
  invariant(sample.forms.accepted <= sample.forms.attempts, "form accepted count cannot exceed attempts");
  finiteNonnegative(sample.lcp.candidateMs, "candidate LCP");
  invariant(sample.lcp.candidateMs > 0, "candidate LCP must be greater than zero");
  invariant(sample.lcp.postPromotionRunsMs.length === 3, "LCP health sample requires three identical post-promotion runs");
  for (const value of sample.lcp.postPromotionRunsMs) finiteNonnegative(value, "post-promotion LCP");
  const reasons = [];
  const immediate = {
    homeAvailable: "home unavailable",
    teachingsAvailable: "teachings unavailable",
    privacyLeak: "privacy leak",
    falseFormSuccess: "false form success",
    wrongCanonical: "wrong canonical",
    accidentalNoindex: "accidental noindex",
    redirectLoop: "redirect loop",
    coreActionFailure: "primary navigation/live/give/store action failure",
    consentOrCspBlocksCore: "consent or CSP blocks core content/forms",
  };
  for (const [key, message] of Object.entries(immediate)) {
    const failed = key === "homeAvailable" || key === "teachingsAvailable"
      ? sample.invariants[key] !== true
      : sample.invariants[key] === true;
    if (failed) reasons.push(message);
  }
  const serverRate = sample.fiveMinute.errors5xx / Math.max(1, sample.fiveMinute.requests);
  if (serverRate > 0.01 && (sample.fiveMinute.requests >= 100 || sample.fiveMinute.errors5xx >= 5)) {
    reasons.push("5xx rate above 1 percent for five minutes with sample floor");
  }
  const clientRate = sample.fifteenMinute.clientErrors / Math.max(1, sample.fifteenMinute.measuredSessions);
  if (
    (clientRate > 0.02 && sample.fifteenMinute.measuredSessions >= 100) ||
    sample.fifteenMinute.identicalSafeCodeErrors >= 10
  ) reasons.push("client error threshold exceeded");
  const deliveryRate = sample.forms.accepted / Math.max(1, sample.forms.attempts);
  if (sample.forms.consecutiveFailures >= 3 || (sample.forms.attempts >= 20 && deliveryRate < 0.95)) {
    reasons.push("form delivery threshold exceeded");
  }
  if (median(sample.lcp.postPromotionRunsMs) > sample.lcp.candidateMs * 1.3) {
    reasons.push("LCP regressed more than 30 percent from approved candidate");
  }
  return { status: reasons.length ? "rollback" : "pass", rollbackReasons: reasons };
}
