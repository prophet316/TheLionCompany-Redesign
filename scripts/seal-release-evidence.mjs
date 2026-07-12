import { sealEvidenceDirectory } from "../lib/release/evidence.mjs";

for (const name of [
  "RELEASE_EVIDENCE_DIR",
  "STAGED_PRODUCTION_DEPLOYMENT_ID",
  "PREVIEW_QA_DEPLOYMENT_ID",
  "RELEASE_COMMIT_SHA",
]) if (!process.env[name]) throw new Error(`${name} is required`);

const manifest = await sealEvidenceDirectory(
  process.env.RELEASE_EVIDENCE_DIR,
  process.env.STAGED_PRODUCTION_DEPLOYMENT_ID,
  process.env.PREVIEW_QA_DEPLOYMENT_ID,
  process.env.RELEASE_COMMIT_SHA,
);
console.log(JSON.stringify({
  status: "sealed",
  files: manifest.files.length,
  stagedDeploymentId: manifest.stagedDeploymentId,
  previewDeploymentId: manifest.previewDeploymentId,
  commitSha: manifest.commitSha,
}));
