export type DeploymentMetadata = {
  id: string;
  url: string;
  readyState: string;
  target?: string | null;
  alias?: string[];
  meta?: { githubCommitSha?: string };
  gitSource?: { sha?: string };
};

export type HealthMetrics = {
  invariants: {
    homeAvailable: boolean;
    teachingsAvailable: boolean;
    privacyLeak: boolean;
    falseFormSuccess: boolean;
    wrongCanonical: boolean;
    accidentalNoindex: boolean;
    redirectLoop: boolean;
    coreActionFailure: boolean;
    consentOrCspBlocksCore: boolean;
  };
  fiveMinute: { requests: number; errors5xx: number };
  fifteenMinute: { measuredSessions: number; clientErrors: number; identicalSafeCodeErrors: number };
  forms: { attempts: number; accepted: number; consecutiveFailures: number };
  lcp: { candidateMs: number; postPromotionRunsMs: [number, number, number] };
};

export type HealthSample = HealthMetrics & {
  schemaVersion: 1;
  deploymentId: string;
  commitSha: string;
  checkpoint: "15m" | "1h" | "24h" | "72h" | "7d";
  windowStartedAt: string;
  windowEndedAt: string;
  collectedAt: string;
  sourceArtifacts: Array<{
    kind: "vercel" | "brevo" | "ga4" | "synthetic";
    path: string;
    sha256: string;
  }>;
};

export function median(values: readonly number[]): number;
export function assertDeploymentBinding(input: {
  deployment: DeploymentMetadata;
  expectedDeploymentId: string;
  expectedCommitSha: string;
  baseURL: string;
  mode: "preview-qa" | "staged-production" | "production";
}): { deploymentId: string; commitSha: string; immutableURL: string };
export function assertHealthSampleBinding(sample: HealthSample, input: {
  expectedDeploymentId: string;
  expectedCommitSha: string;
  expectedCheckpoint: HealthSample["checkpoint"];
  promotionRecordedAt: string;
  now: number;
}): { checkpointElapsedMinutes: number; windowStartedAt: string; windowEndedAt: string; collectedAt: string };
export function assertHealthSourceBinding(
  source: unknown,
  sample: HealthSample,
  expectedKind: HealthSample["sourceArtifacts"][number]["kind"],
): { source: HealthSample["sourceArtifacts"][number]["kind"] };
export function evaluateReleaseHealth(sample: HealthMetrics): {
  status: "pass" | "rollback";
  rollbackReasons: string[];
};
