export type GateDefinition = {
  file: string;
  gate: string;
  scope: "preview-qa" | "staged-production" | "production";
};
export type EvidencePhase = "launch" | "closeout";
export const LAUNCH_GATES: readonly GateDefinition[];
export const CLOSEOUT_GATES: readonly GateDefinition[];
export const MANUAL_GATES: ReadonlySet<string>;
export function sealEvidenceDirectory(
  directory: string,
  stagedDeploymentId: string,
  previewDeploymentId: string,
  commitSha: string,
): Promise<{
  schemaVersion: 1;
  stagedDeploymentId: string;
  previewDeploymentId: string;
  commitSha: string;
  sealedAt: string;
  files: Array<{ path: string; sha256: string }>;
}>;
export function verifyEvidenceDirectory(
  directory: string,
  phase: EvidencePhase,
  stagedDeploymentId: string,
  previewDeploymentId: string,
  commitSha: string,
  requireSeal?: boolean,
): Promise<{
  status: "pass";
  phase: EvidencePhase;
  gates: number;
  stagedDeploymentId: string;
  previewDeploymentId: string;
  commitSha: string;
}>;
