import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { resolve } from "node:path";

const required = [
  "FORM_SOAK_TARGET_URL", "FORM_SOAK_TURNSTILE_TOKEN", "FORM_SOAK_NEWSLETTER_EMAIL",
  "FORM_SOAK_MODE", "RELEASE_DEPLOYMENT_ID", "RELEASE_COMMIT_SHA",
];
for (const name of required) if (!process.env[name]) throw new Error(`${name} is required`);
const mode = process.env.FORM_SOAK_MODE;
if (!new Set(["volume", "rate-limit", "outage"]).has(mode)) throw new Error("FORM_SOAK_MODE must be volume, rate-limit, or outage");
const target = new URL(process.env.FORM_SOAK_TARGET_URL);
if (target.protocol !== "https:" || !target.hostname.endsWith(".vercel.app") || target.username || target.password) {
  throw new Error("form soak target must be an exact immutable HTTPS Vercel preview origin");
}
const protectionSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
if (!protectionSecret) throw new Error("VERCEL_AUTOMATION_BYPASS_SECRET is required for deployment-protected preview testing");
const seed = await fetch(new URL("/", target), {
  redirect: "manual",
  signal: AbortSignal.timeout(12_000),
  headers: {
    "x-vercel-protection-bypass": protectionSecret,
    "x-vercel-set-bypass-cookie": "true",
  },
});
if (seed.status !== 200 || seed.headers.has("location")) throw new Error(`deployment-protection seed returned ${seed.status}`);
const setCookies = seed.headers.getSetCookie?.() ?? [seed.headers.get("set-cookie")].filter(Boolean);
const protectionLine = setCookies.find((value) => /^_vercel_jwt=/i.test(value));
const protectionCookie = protectionLine?.match(/^(_vercel_jwt=[^;]+)/i)?.[1];
const protectionDomain = protectionLine?.match(/;\s*domain=([^;]+)/i)?.[1]?.replace(/^\./, "").toLowerCase();
if (!protectionCookie || !/;\s*secure(?:;|$)/i.test(protectionLine ?? "") || (protectionDomain && protectionDomain !== target.hostname)) {
  throw new Error("origin-scoped secure Vercel bypass cookie was not returned");
}
const token = process.env.FORM_SOAK_TURNSTILE_TOKEN;
const newsletterAddress = process.env.FORM_SOAK_NEWSLETTER_EMAIL;
const latencies = [];
const statuses = new Map();
let attempted = 0;

function headers(origin = target.origin) {
  return {
    "content-type": "application/json",
    origin,
    cookie: protectionCookie,
  };
}

function payload(endpoint, index, submissionId = crypto.randomUUID()) {
  const shared = { submissionId, turnstileToken: token, website: "" };
  if (endpoint === "newsletter") {
    const split = newsletterAddress.lastIndexOf("@");
    return { ...shared, email: `${newsletterAddress.slice(0, split)}+soak-${index}${newsletterAddress.slice(split)}`, consent: true, placement: "connect" };
  }
  if (endpoint === "prayer") return {
    ...shared, displayName: "Synthetic Test", email: "",
    request: `Synthetic non-sensitive prayer delivery test number ${index}.`, followUpRequested: false,
  };
  return {
    ...shared, name: "Synthetic Test", email: newsletterAddress, reason: "general",
    message: `Synthetic non-sensitive contact delivery test number ${index}.`,
  };
}

async function send(endpoint, body, expected) {
  const started = performance.now();
  attempted += 1;
  const response = await fetch(new URL(`/api/forms/${endpoint}`, target), {
    method: "POST", headers: headers(), body: JSON.stringify(body), redirect: "manual", signal: AbortSignal.timeout(12_000),
  });
  latencies.push(performance.now() - started);
  statuses.set(response.status, (statuses.get(response.status) ?? 0) + 1);
  if (!expected.includes(response.status)) throw new Error(`${endpoint} returned ${response.status}; expected ${expected.join(" or ")}`);
  const result = await response.json().catch(() => null);
  if (response.status === 202 && (!result?.ok || result.status !== "accepted")) throw new Error(`${endpoint} returned malformed acceptance`);
  if (response.status >= 400 && result?.ok) throw new Error(`${endpoint} returned false success`);
  return { response, result };
}

async function sendRaw(endpoint, init, expectedStatus) {
  const started = performance.now();
  attempted += 1;
  const { origin = target.origin, headers: caseHeaders = {}, ...requestInit } = init;
  const response = await fetch(new URL(`/api/forms/${endpoint}`, target), {
    ...requestInit,
    headers: { ...headers(origin), ...caseHeaders },
    redirect: "manual",
    signal: AbortSignal.timeout(12_000),
  });
  latencies.push(performance.now() - started);
  statuses.set(response.status, (statuses.get(response.status) ?? 0) + 1);
  if (response.status !== expectedStatus) throw new Error(`${endpoint} raw case returned ${response.status}; expected ${expectedStatus}`);
}

async function volume() {
  const expiry = Date.parse(process.env.FORM_SOAK_WAF_EXCEPTION_EXPIRES_AT ?? "");
  if (!Number.isFinite(expiry) || expiry <= Date.now() || expiry > Date.now() + 2 * 60 * 60 * 1000) {
    throw new Error("volume mode requires a source-bound preview WAF exception expiring within two hours");
  }
  for (const endpoint of ["newsletter", "prayer", "contact"]) {
    for (let index = 1; index <= 25; index += 1) await send(endpoint, payload(endpoint, index), [202]);
    await Promise.all(Array.from({ length: 10 }, (_unused, index) => send(endpoint, payload(endpoint, 100 + index), [202])));
    const repeatedId = crypto.randomUUID();
    const repeated = await Promise.all(Array.from({ length: 10 }, (_unused, index) =>
      send(endpoint, payload(endpoint, 200 + index, repeatedId), [202, 409])));
    if (repeated.filter((item) => item.response.status === 202).length < 1) throw new Error(`${endpoint} repeated-ID run had no accepted owner/replay`);
    const replay = await send(endpoint, payload(endpoint, 300, repeatedId), [202]);
    if (!replay.result.replayed) throw new Error(`${endpoint} final repeated-ID request was not replayed`);
  }
  await send("contact", { ...payload("contact", 400), website: "bot-filled" }, [400]);
  await send("contact", { ...payload("contact", 401), message: "short" }, [422]);
  await send("contact", { ...payload("contact", 402), turnstileToken: "invalid-token" }, [400]);
  await send("contact", { ...payload("contact", 403), message: "Synthetic <script>alert('x')</script> & CRLF\r\nBcc: test@example.org content." }, [202]);
  await sendRaw("contact", { method: "POST", headers: { "content-type": "text/plain" }, body: "not json" }, 415);
  await sendRaw("contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payload("contact", 404), message: "x".repeat(16_385) }) }, 413);
  await sendRaw("contact", { method: "POST", origin: "https://cross-origin.example.org", headers: { "content-type": "application/json" }, body: JSON.stringify(payload("contact", 405)) }, 403);
}

let rateLimitEndpoint = null;
async function rateLimit() {
  if (process.env.FORM_SOAK_WAF_EXCEPTION_EXPIRES_AT) throw new Error("rate-limit mode forbids the volume WAF exception");
  const endpoint = process.env.FORM_RATE_LIMIT_ENDPOINT;
  if (!new Set(["newsletter", "prayer", "contact"]).has(endpoint)) throw new Error("FORM_RATE_LIMIT_ENDPOINT is required");
  rateLimitEndpoint = endpoint;
  const allowed = endpoint === "newsletter" ? 10 : 5;
  for (let index = 1; index <= allowed; index += 1) await send(endpoint, payload(endpoint, 500 + index), [202]);
  const blocked = await send(endpoint, payload(endpoint, 600), [429]);
  if (blocked.result?.ok) throw new Error("WAF 429 contained success");
}

async function outage() {
  if (process.env.FORM_SOAK_WAF_EXCEPTION_EXPIRES_AT) throw new Error("outage mode forbids the volume WAF exception");
  for (const endpoint of ["newsletter", "prayer", "contact"]) {
    const result = await send(endpoint, payload(endpoint, 700), [503]);
    if (result.result?.code !== "provider_unavailable") throw new Error(`${endpoint} outage did not map to provider_unavailable`);
  }
}

await ({ volume, "rate-limit": rateLimit, outage })[mode]();
latencies.sort((a, b) => a - b);
const p95 = latencies[Math.ceil(latencies.length * 0.95) - 1] ?? 0;
if (mode === "volume" && p95 >= 2_500) throw new Error(`p95 ${Math.round(p95)}ms exceeds 2500ms`);
const runKey = mode === "rate-limit" ? `rate-limit-${rateLimitEndpoint}` : mode;
const evidence = {
  schemaVersion: 1,
  gate: `form-soak-${runKey}-run`,
  status: "pass",
  recordedAt: new Date().toISOString(),
  deploymentScope: "preview-qa",
  deploymentId: process.env.RELEASE_DEPLOYMENT_ID,
  commitSha: process.env.RELEASE_COMMIT_SHA,
  assertions: mode === "volume"
    ? ["25 valid submissions per form accepted", "10 concurrent unique submissions per form accepted", "repeated IDs replay without normal-response duplicate", "invalid and injected cases return safe outcomes", "p95 below 2500ms"]
    : mode === "rate-limit"
      ? ["production-equivalent WAF threshold returns 429 without application bypass"]
      : ["provider outage returns 503 and never false success"],
  metrics: { attempted, p95Ms: Math.round(p95), statuses: Object.fromEntries([...statuses].sort((a, b) => a[0] - b[0])) },
};
if (process.env.RELEASE_EVIDENCE_DIR) {
  await mkdir(process.env.RELEASE_EVIDENCE_DIR, { recursive: true, mode: 0o700 });
  await writeFile(resolve(process.env.RELEASE_EVIDENCE_DIR, `form-soak-${runKey}-run.json`), `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });
}
console.log(JSON.stringify({ status: "pass", mode, attempted, p95Ms: Math.round(p95), statuses: evidence.metrics.statuses }));
