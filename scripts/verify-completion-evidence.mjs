import { verifyEvidenceDirectory } from "../lib/release/evidence.mjs";

for (const name of [
  "RELEASE_EVIDENCE_DIR",
  "STAGED_PRODUCTION_DEPLOYMENT_ID",
  "PREVIEW_QA_DEPLOYMENT_ID",
  "RELEASE_COMMIT_SHA",
  "RELEASE_EVIDENCE_PHASE",
]) if (!process.env[name]) throw new Error(`${name} is required`);
if (!new Set(["launch", "closeout"]).has(process.env.RELEASE_EVIDENCE_PHASE)) {
  throw new Error("RELEASE_EVIDENCE_PHASE must be launch or closeout");
}
if (!new Set([undefined, "0", "1"]).has(process.env.RELEASE_EVIDENCE_REQUIRE_SEAL)) {
  throw new Error("RELEASE_EVIDENCE_REQUIRE_SEAL must be 0 or 1");
}

const result = await verifyEvidenceDirectory(
  process.env.RELEASE_EVIDENCE_DIR,
  process.env.RELEASE_EVIDENCE_PHASE,
  process.env.STAGED_PRODUCTION_DEPLOYMENT_ID,
  process.env.PREVIEW_QA_DEPLOYMENT_ID,
  process.env.RELEASE_COMMIT_SHA,
  process.env.RELEASE_EVIDENCE_REQUIRE_SEAL === "1",
);
console.log(JSON.stringify(result));
