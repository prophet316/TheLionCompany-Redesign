import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { chromium } from "@playwright/test";
import { analyzeTrace, evaluatePixelRuns } from "../lib/release/performance.mjs";

const baseURL = process.env.PIXEL_BASE_URL;
const serial = process.env.PIXEL_ADB_SERIAL;
const expectedChromeMajor = process.env.PIXEL_EXPECTED_CHROME_MAJOR;
const deploymentId = process.env.RELEASE_DEPLOYMENT_ID;
const commitSha = process.env.RELEASE_COMMIT_SHA;
const evidenceRoot = process.env.RELEASE_EVIDENCE_DIR;
if (!baseURL || !serial || !expectedChromeMajor || !deploymentId || !commitSha || !evidenceRoot) {
  throw new Error("PIXEL_BASE_URL, PIXEL_ADB_SERIAL, PIXEL_EXPECTED_CHROME_MAJOR, RELEASE_DEPLOYMENT_ID, RELEASE_COMMIT_SHA, and RELEASE_EVIDENCE_DIR are required");
}
const target = new URL(baseURL);
if (target.protocol !== "https:") throw new Error("physical trace target must use HTTPS");
let protectionCookieValue = null;
if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
  if (!target.hostname.endsWith(".vercel.app") || target.username || target.password) throw new Error("physical protection target must be the exact HTTPS Vercel deployment origin");
  const response = await fetch(new URL("/", target), {
    redirect: "manual",
    signal: AbortSignal.timeout(12_000),
    headers: {
      "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
      "x-vercel-set-bypass-cookie": "true",
    },
  });
  if (response.status !== 200 || response.headers.has("location")) throw new Error(`deployment-protection seed returned ${response.status}`);
  const setCookies = response.headers.getSetCookie?.() ?? [response.headers.get("set-cookie")].filter(Boolean);
  const cookieHeader = setCookies.find((value) => /^_vercel_jwt=/i.test(value));
  if (!cookieHeader || !/(?:^|;)\s*Secure(?:;|$)/i.test(cookieHeader) || /(?:^|;)\s*Domain=/i.test(cookieHeader)) {
    throw new Error("Vercel bypass cookie must be Secure and host-only");
  }
  protectionCookieValue = cookieHeader.match(/^_vercel_jwt=([^;]+)/i)?.[1] ?? null;
  if (!protectionCookieValue) throw new Error("origin-scoped Vercel bypass cookie was not returned");
}
const adb = (...args) => execFileSync("adb", ["-s", serial, ...args], { encoding: "utf8" }).trim();
const shell = (...args) => adb("shell", ...args);
const safeAdb = (...args) => { try { return adb(...args); } catch { return ""; } };
const safeShell = (...args) => safeAdb("shell", ...args);
const model = shell("getprop", "ro.product.model");
const android = shell("getprop", "ro.build.version.release");
const sdk = shell("getprop", "ro.build.version.sdk");
const batteryDump = shell("dumpsys", "battery");
const battery = Number(batteryDump.match(/level:\s*(\d+)/)?.[1]);
const lowPower = shell("settings", "get", "global", "low_power");
const thermal = shell("dumpsys", "thermalservice");
const screenRecording = safeShell("pidof", "screenrecord");
if (!Number.isFinite(battery) || battery <= 50) throw new Error(`battery ${battery}% is not above 50%`);
if (lowPower !== "0") throw new Error("power saver is enabled");
if (/mStatus=[3-6]/.test(thermal)) throw new Error("device is not thermally normal");
if (screenRecording) throw new Error("background screen recording is active");
let slowerDeviceApproval = null;
if (model !== "Pixel 6") {
  const approvalPath = resolve(process.env.PIXEL_APPROVED_SLOWER_DEVICE_EVIDENCE_PATH ?? "");
  if (!process.env.PIXEL_APPROVED_SLOWER_DEVICE_EVIDENCE_PATH || !approvalPath.startsWith(`${resolve(evidenceRoot)}/`)) {
    throw new Error(`device ${model} is not Pixel 6 and lacks an in-directory slower-device approval file`);
  }
  const bytes = await readFile(approvalPath);
  const approval = JSON.parse(bytes.toString("utf8"));
  if (approval.schemaVersion !== 1 || approval.status !== "approved" || approval.deviceModel !== model || approval.comparison !== "documented-slower-than-pixel-6" || typeof approval.reviewerRole !== "string" || approval.reviewerRole.length < 3 || !Number.isFinite(Date.parse(approval.approvedAt))) {
    throw new Error("slower-device approval content is invalid or does not match the connected device");
  }
  slowerDeviceApproval = {
    path: relative(resolve(evidenceRoot), approvalPath),
    sha256: createHash("sha256").update(bytes).digest("hex"),
    reviewerRole: approval.reviewerRole,
    approvedAt: approval.approvedAt,
  };
} else if (process.env.PIXEL_APPROVED_SLOWER_DEVICE_EVIDENCE_PATH) {
  throw new Error("Pixel 6 must not use a slower-device approval override");
}
if (model === "Pixel 6" && android !== "15") throw new Error(`Pixel 6 must run Android 15; found ${android}`);

const directory = resolve(evidenceRoot, "pixel-motion");
await mkdir(directory, { recursive: true, mode: 0o700 });
const results = [];
let chromeVersion = "";
for (let run = 1; run <= 3; run += 1) {
  shell("am", "force-stop", "com.android.chrome");
  safeAdb("forward", "--remove", "tcp:9222");
  adb("forward", "tcp:9222", "localabstract:chrome_devtools_remote");
  shell("am", "start", "-a", "android.intent.action.VIEW", "-d", new URL("/", target).toString(), "com.android.chrome");
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 2500));
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const page = context.pages()[0] ?? await context.newPage();
  const session = await context.newCDPSession(page);
  const version = await session.send("Browser.getVersion");
  chromeVersion = version.product;
  const chromeMajor = chromeVersion.match(/Chrome\/(\d+)/)?.[1];
  if (chromeMajor !== expectedChromeMajor) throw new Error(`Chrome major ${chromeMajor} does not match current stable ${expectedChromeMajor}`);
  await session.send("Storage.clearDataForOrigin", { origin: target.origin, storageTypes: "all" });
  await session.send("Network.clearBrowserCache");
  if (protectionCookieValue) {
    const cookie = await session.send("Network.setCookie", {
      name: "_vercel_jwt", value: protectionCookieValue, url: target.origin,
      secure: true, httpOnly: true, sameSite: "Lax",
    });
    if (!cookie.success) throw new Error("CDP did not install the exact-origin Vercel bypass cookie");
  }
  await page.goto(new URL("/", target).toString(), { waitUntil: "networkidle" });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.evaluate(() => window.dispatchEvent(new Event("lion:prepare-motion")));
  await page.waitForFunction(() => document.querySelector('[data-testid="gathering-line"]')?.getAttribute("data-motion-ready") === "true", undefined, { timeout: 15_000 });
  const events = [];
  session.on("Tracing.dataCollected", ({ value }) => events.push(...value));
  const complete = new Promise((resolvePromise) => session.once("Tracing.tracingComplete", resolvePromise));
  await session.send("Tracing.start", {
    categories: "devtools.timeline,disabled-by-default-devtools.timeline.frame,benchmark,cc,gpu,viz",
    options: "record-as-much-as-possible",
    transferMode: "ReportEvents",
  });
  await page.evaluate(async () => {
    const duration = 30_000;
    const start = performance.now();
    const mission = document.querySelector("#mission");
    if (!mission) throw new Error("home manifesto #mission is required for the physical trace");
    const max = Math.max(0, mission.getBoundingClientRect().bottom + scrollY - innerHeight);
    await new Promise((resolvePromise) => {
      const frame = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        scrollTo(0, max * progress);
        if (progress < 1) requestAnimationFrame(frame);
        else resolvePromise();
      };
      requestAnimationFrame(frame);
    });
  });
  await session.send("Tracing.end");
  await complete;
  const trace = { traceEvents: events, metadata: { run, model, android, sdk, chromeVersion, battery, lowPower } };
  const sensitiveValues = [process.env.VERCEL_AUTOMATION_BYPASS_SECRET, protectionCookieValue].filter(Boolean);
  const serializedTrace = sensitiveValues.reduce(
    (value, sensitive) => value.split(sensitive).join("[REDACTED]"),
    JSON.stringify(trace),
  );
  if (sensitiveValues.some((sensitive) => serializedTrace.includes(sensitive))) {
    throw new Error("physical trace retained deployment-protection credentials");
  }
  await writeFile(resolve(directory, `trace-${run}.json`), `${serializedTrace}\n`, { mode: 0o600 });
  results.push(analyzeTrace(events, 30));
  await browser.close();
}
const gate = evaluatePixelRuns(results);
const summary = {
  schemaVersion: 1,
  gate: "physical-pixel-motion",
  status: "pass",
  recordedAt: new Date().toISOString(),
  deploymentScope: process.env.RELEASE_DEPLOYMENT_SCOPE ?? "preview-qa",
  deploymentId,
  commitSha,
  assertions: ["three cold-process 30-second hero-through-manifesto traces", "origin data and browser cache cleared", "battery above 50 percent", "power saver off", "thermally normal", "no screen recording", "median FPS >=55", "median dropped frames <5 percent", "no primary-scroll task exceeds 200ms"],
  device: { model, android, sdk, chromeVersion, battery },
  ...(slowerDeviceApproval ? { slowerDeviceApproval } : {}),
  metrics: { medianFps: gate.medianFps, medianDroppedPercent: gate.medianDroppedPercent },
  runs: results,
  traceFiles: ["pixel-motion/trace-1.json", "pixel-motion/trace-2.json", "pixel-motion/trace-3.json"],
  artifacts: slowerDeviceApproval ? [{ path: slowerDeviceApproval.path, sha256: slowerDeviceApproval.sha256 }] : [],
};
await writeFile(resolve(evidenceRoot, "pixel-motion-summary.json"), `${JSON.stringify(summary, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({ status: "pass", device: summary.device, metrics: summary.metrics }));
