import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const required = [
  "BREVO_DOI_ACTION", "BREVO_API_KEY", "BREVO_DOI_CONFIRMED_LIST_ID",
  "BREVO_DOI_STATE_PATH", "BREVO_DOI_TARGET_URL", "VERCEL_AUTOMATION_BYPASS_SECRET",
  "RELEASE_EVIDENCE_DIR", "RELEASE_DEPLOYMENT_ID", "RELEASE_COMMIT_SHA",
];
for (const name of required) if (!process.env[name]) throw new Error(`${name} is required`);
const action = process.env.BREVO_DOI_ACTION;
const actions = new Set(["request", "confirm", "expired", "unsubscribe", "purge-before", "purge-after", "finalize"]);
if (!actions.has(action)) throw new Error("invalid BREVO_DOI_ACTION");
const evidenceRoot = resolve(process.env.RELEASE_EVIDENCE_DIR);
const phaseRoot = resolve(evidenceRoot, "brevo-doi");
const statePath = resolve(process.env.BREVO_DOI_STATE_PATH);
if (statePath === evidenceRoot || statePath.startsWith(`${evidenceRoot}/`)) throw new Error("raw DOI state must stay outside release evidence");
const listId = Number(process.env.BREVO_DOI_CONFIRMED_LIST_ID);
if (!Number.isInteger(listId) || listId <= 0) throw new Error("BREVO_DOI_CONFIRMED_LIST_ID must be positive");
const target = new URL(process.env.BREVO_DOI_TARGET_URL);
if (target.protocol !== "https:" || !target.hostname.endsWith(".vercel.app") || target.username || target.password) {
  throw new Error("DOI target must be the exact immutable HTTPS preview origin");
}
const invariant = (condition, message) => { if (!condition) throw new Error(message); };
const sha = (value) => createHash("sha256").update(value).digest("hex");
const protectionSeed = await fetch(new URL("/", target), {
  redirect: "manual",
  signal: AbortSignal.timeout(12_000),
  headers: {
    "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
    "x-vercel-set-bypass-cookie": "true",
  },
});
invariant(protectionSeed.status === 200 && !protectionSeed.headers.has("location"), `deployment-protection seed returned ${protectionSeed.status}`);
const protectionSetCookies = protectionSeed.headers.getSetCookie?.() ?? [protectionSeed.headers.get("set-cookie")].filter(Boolean);
const protectionLine = protectionSetCookies.find((value) => /^_vercel_jwt=/i.test(value));
const protectionCookie = protectionLine?.match(/^(_vercel_jwt=[^;]+)/i)?.[1];
const protectionDomain = protectionLine?.match(/;\s*domain=([^;]+)/i)?.[1]?.replace(/^\./, "").toLowerCase();
invariant(protectionCookie && /;\s*secure(?:;|$)/i.test(protectionLine ?? "") && (!protectionDomain || protectionDomain === target.hostname), "origin-scoped secure Vercel bypass cookie was not returned");

async function secretFile(name) {
  const path = resolve(process.env[name] ?? "");
  invariant(process.env[name] && !path.startsWith(`${evidenceRoot}/`), `${name} must be a restricted file outside evidence`);
  return (await readFile(path, "utf8")).trim();
}

async function state() {
  return JSON.parse(await readFile(statePath, "utf8"));
}

async function saveState(value) {
  await mkdir(resolve(statePath, ".."), { recursive: true, mode: 0o700 });
  await writeFile(statePath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
}

async function brevoContact(email) {
  const response = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
    headers: { accept: "application/json", "api-key": process.env.BREVO_API_KEY },
    signal: AbortSignal.timeout(12_000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Brevo contact lookup returned ${response.status}`);
  return response.json();
}

async function waitForContact(email, predicate, label) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const contact = await brevoContact(email);
    if (predicate(contact)) return contact;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 2500));
  }
  throw new Error(`Brevo state did not reach ${label}`);
}

async function submitNewsletter(email) {
  for (const name of ["BREVO_DOI_TURNSTILE_TOKEN"]) {
    if (!process.env[name]) throw new Error(`${name} is required for request action`);
  }
  const response = await fetch(new URL("/api/forms/newsletter", target), {
    method: "POST",
    headers: {
      "content-type": "application/json", origin: target.origin,
      cookie: protectionCookie,
    },
    body: JSON.stringify({
      submissionId: crypto.randomUUID(), email, firstName: "Synthetic DOI Test", consent: true,
      placement: "connect", turnstileToken: process.env.BREVO_DOI_TURNSTILE_TOKEN, website: "",
    }),
    redirect: "manual",
    signal: AbortSignal.timeout(12_000),
  });
  const body = await response.json().catch(() => null);
  invariant(response.status === 202 && body?.ok && body.deliveryMode === "test-recipient", "isolated DOI request was not safely accepted");
  invariant(!/(already|pending|confirmed|member|exists)/i.test(body.message ?? ""), "DOI response leaks membership state");
  return { httpStatus: response.status, ok: body.ok, status: body.status, deliveryMode: body.deliveryMode, message: body.message };
}

async function followSecretURL(fileName, expectedPath) {
  let current = new URL(await secretFile(fileName));
  invariant(current.protocol === "https:", `${fileName} must contain an HTTPS URL`);
  for (let hop = 0; hop < 8; hop += 1) {
    const response = await fetch(current, {
      redirect: "manual",
      headers: current.origin === target.origin ? { cookie: protectionCookie } : {},
      signal: AbortSignal.timeout(12_000),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      invariant(location, "DOI redirect omitted Location");
      current = new URL(location, current);
      continue;
    }
    invariant(response.status === 200, `DOI outcome returned ${response.status}`);
    invariant(current.origin === target.origin && current.pathname === expectedPath && !current.search && !current.hash, `DOI outcome did not end at the bound preview ${expectedPath}`);
    return response.text();
  }
  throw new Error("DOI outcome exceeded seven redirects");
}

async function writePhase(name, assertions, metrics) {
  await mkdir(phaseRoot, { recursive: true, mode: 0o700 });
  const record = {
    schemaVersion: 1, gate: `brevo-doi-${name}`, status: "pass", recordedAt: new Date().toISOString(),
    deploymentScope: "preview-qa", deploymentId: process.env.RELEASE_DEPLOYMENT_ID, commitSha: process.env.RELEASE_COMMIT_SHA,
    assertions, metrics,
  };
  await writeFile(resolve(phaseRoot, `${name}.json`), `${JSON.stringify(record, null, 2)}\n`, { mode: 0o600 });
}

if (action === "request") {
  const email = await secretFile("BREVO_DOI_TEST_RECIPIENT_FILE");
  invariant((await brevoContact(email)) === null, "fresh DOI recipient already exists; do not auto-delete it");
  const first = await submitNewsletter(email);
  const duplicate = await submitNewsletter(email);
  invariant(JSON.stringify(first) === JSON.stringify(duplicate), "new and duplicate/pending public DOI responses differ");
  const contact = await waitForContact(email, (value) => value && !value.listIds?.includes(listId), "pending and outside confirmed list");
  await saveState({ email, providerContactIdSha256: sha(String(contact.id)), requestedAt: new Date().toISOString() });
  await writePhase("request", ["new and duplicate/pending requests return the same privacy-safe 202", "pending contact is outside the confirmed list"], { requests: 2, status202: 2, publicShapesEqual: true, pendingOutsideConfirmedList: true, providerContactIdSha256: sha(String(contact.id)) });
}

if (action === "confirm") {
  const value = await state();
  await followSecretURL("BREVO_DOI_CONFIRM_URL_FILE", "/newsletter/confirmed");
  const contact = await waitForContact(value.email, (item) => item?.listIds?.includes(listId), "confirmed-list membership");
  await writePhase("confirm", ["real DOI link ends at the query-free confirmation route", "provider contact enters the confirmed list"], { confirmedListMembership: true, providerContactIdSha256: sha(String(contact.id)) });
}

if (action === "expired") {
  const html = await followSecretURL("BREVO_DOI_EXPIRED_URL_FILE", "/newsletter/expired");
  invariant(/invalid or expired/i.test(html) && /<form\b/i.test(html), "expired route lacks recovery form");
  await writePhase("expired", ["expired real DOI link ends at the query-free recovery route", "recovery page renders a fresh DOI form"], { recoveryForm: true });
}

if (action === "unsubscribe") {
  const value = await state();
  await followSecretURL("BREVO_DOI_UNSUBSCRIBE_URL_FILE", "/newsletter/unsubscribed");
  const contact = await waitForContact(value.email, (item) => item?.emailBlacklisted === true && !item.listIds?.includes(listId), "unsubscribe suppression");
  await writePhase("unsubscribe", ["provider-managed unsubscribe ends at the query-free outcome route", "contact leaves the confirmed list and remains suppressed"], { emailBlacklisted: true, confirmedListMembership: false, providerContactIdSha256: sha(String(contact.id)) });
}

if (action === "purge-before") {
  const value = await state();
  const oldEmail = await secretFile("BREVO_PURGE_OLD_PENDING_EMAIL_FILE");
  const freshEmail = await secretFile("BREVO_PURGE_FRESH_PENDING_EMAIL_FILE");
  const oldContact = await brevoContact(oldEmail);
  const freshContact = await brevoContact(freshEmail);
  invariant(oldContact && freshContact, "purge controls must both exist before automation");
  invariant(!oldContact.listIds?.includes(listId) && !freshContact.listIds?.includes(listId), "purge controls must remain pending");
  const oldAgeDays = (Date.now() - Date.parse(oldContact.createdAt)) / 86400000;
  const freshAgeDays = (Date.now() - Date.parse(freshContact.createdAt)) / 86400000;
  invariant(oldAgeDays >= 30 && freshAgeDays < 30, "purge controls do not straddle the 30-day boundary");
  await saveState({ ...value, purge: { oldEmail, freshEmail, oldProviderIdSha256: sha(String(oldContact.id)), freshProviderIdSha256: sha(String(freshContact.id)) } });
  await writePhase("purge-before", ["pending purge canary is at least 30 days old", "fresh pending control is under 30 days", "neither is confirmed"], { oldAgeAtLeast30Days: true, freshAgeUnder30Days: true });
}

if (action === "purge-after") {
  const value = await state();
  const oldContact = await waitForContact(value.purge.oldEmail, (item) => item === null, "30-day pending deletion");
  const freshContact = await brevoContact(value.purge.freshEmail);
  invariant(oldContact === null && freshContact && sha(String(freshContact.id)) === value.purge.freshProviderIdSha256, "30-day purge deleted the wrong cohort");
  const receiptPath = resolve(process.env.BREVO_PURGE_RUN_RECEIPT_PATH ?? "");
  invariant(process.env.BREVO_PURGE_RUN_RECEIPT_PATH && !receiptPath.startsWith(`${evidenceRoot}/`), "raw purge receipt must stay outside release evidence");
  const receipt = await readFile(receiptPath);
  await writePhase("purge-after", ["30-day pending canary is deleted", "under-30-day pending control remains", "automation execution receipt is retained"], { oldPendingDeleted: true, freshPendingPreserved: true, automationReceiptSha256: sha(receipt) });
}

if (action === "finalize") {
  const names = ["request", "confirm", "expired", "unsubscribe", "purge-before", "purge-after"];
  const phaseFiles = [];
  for (const name of names) {
    const path = resolve(phaseRoot, `${name}.json`);
    const bytes = await readFile(path);
    const record = JSON.parse(bytes.toString("utf8"));
    invariant(record.status === "pass" && record.deploymentScope === "preview-qa" && record.deploymentId === process.env.RELEASE_DEPLOYMENT_ID && record.commitSha === process.env.RELEASE_COMMIT_SHA, `${name} DOI phase is not bound to this Preview QA deployment`);
    phaseFiles.push({ path: `brevo-doi/${name}.json`, sha256: sha(bytes) });
  }
  const result = {
    schemaVersion: 1, gate: "brevo-doi-lifecycle-run", status: "pass", recordedAt: new Date().toISOString(),
    deploymentScope: "preview-qa", deploymentId: process.env.RELEASE_DEPLOYMENT_ID, commitSha: process.env.RELEASE_COMMIT_SHA,
    assertions: ["new and pending duplicate privacy parity", "real confirmation and confirmed-list membership", "expired-link recovery", "unsubscribe suppression", "30-day pending purge with fresh control"],
    metrics: { phases: names.length }, phaseFiles,
  };
  await writeFile(resolve(evidenceRoot, "brevo-doi-lifecycle-run.json"), `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
  console.log(JSON.stringify({ status: "pass", phases: names.length }));
}
