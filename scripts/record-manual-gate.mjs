import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { lstat, mkdir, open, readFile } from "node:fs/promises";
import { basename, relative, resolve } from "node:path";
import { CLOSEOUT_GATES, MANUAL_GATES } from "../lib/release/evidence.mjs";

const required = [
  "RELEASE_EVIDENCE_DIR",
  "RELEASE_DEPLOYMENT_SCOPE",
  "RELEASE_DEPLOYMENT_ID",
  "RELEASE_COMMIT_SHA",
  "MANUAL_GATE",
  "MANUAL_GATE_REVIEWER_ROLE",
  "MANUAL_GATE_ASSERTIONS_B64",
  "MANUAL_GATE_ARTIFACTS_B64",
];
for (const name of required) if (!process.env[name]) throw new Error(`${name} is required`);

const definition = CLOSEOUT_GATES.find((candidate) => candidate.gate === process.env.MANUAL_GATE);
if (!definition || !MANUAL_GATES.has(definition.gate)) throw new Error("MANUAL_GATE is not an approved reviewed gate");
if (process.env.RELEASE_DEPLOYMENT_SCOPE !== definition.scope) {
  throw new Error(`manual gate ${definition.gate} requires ${definition.scope} deployment scope`);
}
if (!/^dpl_[A-Za-z0-9]+$/.test(process.env.RELEASE_DEPLOYMENT_ID)) throw new Error("RELEASE_DEPLOYMENT_ID is invalid");
if (!/^[a-f0-9]{40}$/i.test(process.env.RELEASE_COMMIT_SHA)) throw new Error("RELEASE_COMMIT_SHA must be a 40-character hexadecimal Git SHA");
if (process.env.MANUAL_GATE_REVIEWER_ROLE.trim().length < 3) throw new Error("MANUAL_GATE_REVIEWER_ROLE is invalid");

function decode(name) {
  try {
    return JSON.parse(Buffer.from(process.env[name], "base64url").toString("utf8"));
  } catch {
    throw new Error(`${name} must be valid base64url JSON`);
  }
}

const assertions = decode("MANUAL_GATE_ASSERTIONS_B64");
const paths = decode("MANUAL_GATE_ARTIFACTS_B64");
const metrics = process.env.MANUAL_GATE_METRICS_B64 ? decode("MANUAL_GATE_METRICS_B64") : undefined;
if (!Array.isArray(assertions) || assertions.length === 0 || assertions.some((item) => typeof item !== "string" || !item.trim())) {
  throw new Error("manual assertions must be nonempty strings");
}
if (!Array.isArray(paths) || paths.length === 0 || paths.some((item) => typeof item !== "string" || !item.trim())) {
  throw new Error("manual artifacts must be nonempty paths");
}
if (new Set(paths).size !== paths.length) throw new Error("manual artifact paths must be distinct");
if (metrics && (typeof metrics !== "object" || Array.isArray(metrics) || Object.values(metrics).some((value) => !["number", "string", "boolean"].includes(typeof value)))) {
  throw new Error("manual metrics must be a flat primitive object");
}
if (metrics) {
  if (definition.gate !== "field-inp") throw new Error("manual metrics are supported only for field-inp");
  const keys = Object.keys(metrics).sort();
  if (JSON.stringify(keys) !== JSON.stringify(["inpP75Ms", "measuredHomeViews", "measurementEndedAt", "measurementStartedAt"])) {
    throw new Error("field-inp metrics contain an unexpected key");
  }
}
if (definition.gate === "field-inp" && !metrics) throw new Error("field-inp requires its exact aggregate metrics");

const root = resolve(process.env.RELEASE_EVIDENCE_DIR);
const artifacts = [];
for (const path of paths) {
  const absolute = resolve(root, path);
  if (!absolute.startsWith(`${root}/`)) throw new Error("manual artifact must stay inside release evidence directory");
  const stats = await lstat(absolute);
  if (stats.isSymbolicLink() || !stats.isFile()) throw new Error("manual artifact must be a regular non-symlink file");
  const bytes = await readFile(absolute);
  artifacts.push({ path: relative(root, absolute), sha256: createHash("sha256").update(bytes).digest("hex") });
}

const record = {
  schemaVersion: 1,
  gate: definition.gate,
  status: "pass",
  recordedAt: new Date().toISOString(),
  deploymentScope: definition.scope,
  deploymentId: process.env.RELEASE_DEPLOYMENT_ID,
  commitSha: process.env.RELEASE_COMMIT_SHA,
  assertions,
  ...(metrics ? { metrics } : {}),
  manual: true,
  reviewerRole: process.env.MANUAL_GATE_REVIEWER_ROLE.trim(),
  artifacts,
};
await mkdir(root, { recursive: true, mode: 0o700 });
const output = resolve(root, basename(definition.file));
const handle = await open(
  output,
  constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | constants.O_NOFOLLOW,
  0o600,
);
try {
  await handle.writeFile(`${JSON.stringify(record, null, 2)}\n`, "utf8");
} finally {
  await handle.close();
}
console.log(JSON.stringify({ status: "pass", gate: record.gate, assertions: assertions.length, artifacts: artifacts.length }));
