import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const required = [
  "PII_CANARIES_B64", "PII_CANARY_TARGET_URL", "PII_CANARY_TURNSTILE_TOKEN",
  "VERCEL_AUTOMATION_BYPASS_SECRET", "RELEASE_DEPLOYMENT_ID", "RELEASE_COMMIT_SHA",
  "RELEASE_EVIDENCE_DIR",
];
for (const name of required) if (!process.env[name]) throw new Error(`${name} is required`);
const values = JSON.parse(Buffer.from(process.env.PII_CANARIES_B64, "base64url").toString("utf8"));
if (!Array.isArray(values) || values.length !== 4 || values.some((value) => typeof value !== "string" || value.length < 12)) {
  throw new Error("PII_CANARIES_B64 must encode exactly four strings of 12 or more characters");
}
const [prayer, contact, email, name] = values;
const target = new URL(process.env.PII_CANARY_TARGET_URL);
if (target.protocol !== "https:" || !target.hostname.endsWith(".vercel.app") || target.username || target.password) {
  throw new Error("PII canaries require the exact immutable HTTPS Vercel preview origin");
}
const protectionSeed = await fetch(new URL("/", target), {
  redirect: "manual",
  signal: AbortSignal.timeout(12_000),
  headers: {
    "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
    "x-vercel-set-bypass-cookie": "true",
  },
});
if (protectionSeed.status !== 200 || protectionSeed.headers.has("location")) throw new Error(`deployment-protection seed returned ${protectionSeed.status}`);
const protectionSetCookies = protectionSeed.headers.getSetCookie?.() ?? [protectionSeed.headers.get("set-cookie")].filter(Boolean);
const protectionLine = protectionSetCookies.find((value) => /^_vercel_jwt=/i.test(value));
const protectionCookie = protectionLine?.match(/^(_vercel_jwt=[^;]+)/i)?.[1];
const protectionDomain = protectionLine?.match(/;\s*domain=([^;]+)/i)?.[1]?.replace(/^\./, "").toLowerCase();
if (!protectionCookie || !/;\s*secure(?:;|$)/i.test(protectionLine ?? "") || (protectionDomain && protectionDomain !== target.hostname)) {
  throw new Error("origin-scoped secure Vercel bypass cookie was not returned");
}
const shared = { turnstileToken: process.env.PII_CANARY_TURNSTILE_TOKEN, website: "" };
const payloads = {
  newsletter: { ...shared, submissionId: crypto.randomUUID(), email, firstName: name, consent: true, placement: "connect" },
  prayer: { ...shared, submissionId: crypto.randomUUID(), displayName: name, email, request: prayer, followUpRequested: true },
  contact: { ...shared, submissionId: crypto.randomUUID(), name, email, reason: "general", message: contact },
};
const startedAt = new Date().toISOString();
const statuses = {};
for (const [endpoint, body] of Object.entries(payloads)) {
  const response = await fetch(new URL(`/api/forms/${endpoint}`, target), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: target.origin,
      cookie: protectionCookie,
    },
    body: JSON.stringify(body),
    redirect: "manual",
    signal: AbortSignal.timeout(12_000),
  });
  const result = await response.json().catch(() => null);
  if (response.status !== 202 || !result?.ok || result.deliveryMode !== "no-send") throw new Error(`${endpoint} real-handler canary was not accepted in no-send mode`);
  statuses[endpoint] = response.status;
}
const evidence = {
  schemaVersion: 1,
  gate: "pii-canary-real-handler-run",
  status: "pass",
  recordedAt: new Date().toISOString(),
  deploymentScope: "preview-qa",
  deploymentId: process.env.RELEASE_DEPLOYMENT_ID,
  commitSha: process.env.RELEASE_COMMIT_SHA,
  assertions: ["all four runtime canaries traversed real newsletter, prayer, and contact handlers", "delivery mode remained no-send", "evidence omits canary values and response bodies"],
  metrics: { posts: 3, statuses, startedAt, endedAt: new Date().toISOString() },
};
await mkdir(process.env.RELEASE_EVIDENCE_DIR, { recursive: true, mode: 0o700 });
await writeFile(resolve(process.env.RELEASE_EVIDENCE_DIR, "pii-canary-real-handler-run.json"), `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({ status: "pass", posts: 3, startedAt, endedAt: evidence.metrics.endedAt }));
