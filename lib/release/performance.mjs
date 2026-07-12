export function median(values) {
  if (!values.length) throw new Error("median requires values");
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function finiteNumber(value, name) {
  invariant(typeof value === "number" && Number.isFinite(value), `${name} must be a finite number`);
  return value;
}

function audit(lhr, name) {
  const value = lhr.audits?.[name];
  invariant(value, `missing Lighthouse audit ${name}`);
  return value;
}

function resource(lhr, type) {
  const item = audit(lhr, "resource-summary").details?.items?.find((entry) => entry.resourceType === type);
  invariant(item, `missing resource summary ${type}`);
  return item;
}

function assertSeoPolicy(lhr, indexability) {
  invariant(indexability === "indexable" || indexability === "preview-noindex", `unknown Lighthouse indexability policy ${indexability}`);
  const category = lhr.categories?.seo;
  invariant(category && Array.isArray(category.auditRefs), "missing Lighthouse SEO audit references");
  const weighted = category.auditRefs.filter((reference) => reference.weight > 0);
  invariant(weighted.length > 0, "Lighthouse SEO category has no weighted audits");
  const crawlReference = weighted.find((reference) => reference.id === "is-crawlable");
  invariant(crawlReference, "Lighthouse SEO category lacks is-crawlable");
  const crawlAudit = audit(lhr, "is-crawlable");
  if (indexability === "indexable") {
    invariant(category.score === 1, "SEO below 100");
    invariant(crawlAudit.score === 1, "production page is not crawlable");
    return;
  }
  invariant(crawlAudit.score === 0, "preview page is unexpectedly crawlable");
  const directiveEvidence = JSON.stringify(crawlAudit.details?.items ?? []).toLowerCase();
  invariant(directiveEvidence.includes("noindex"), "preview crawl block is not caused by an explicit noindex directive");
  for (const reference of weighted) {
    if (reference.id === "is-crawlable") continue;
    invariant(audit(lhr, reference.id).score === 1, `preview SEO audit ${reference.id} below 100`);
  }
}

function routeMetrics(lhr) {
  const images = audit(lhr, "network-requests").details?.items?.filter((item) => item.resourceType === "Image") ?? [];
  const tasks = audit(lhr, "long-tasks").details?.items ?? [];
  return {
    performance: finiteNumber(lhr.categories?.performance?.score, "performance score"),
    accessibility: finiteNumber(lhr.categories?.accessibility?.score, "accessibility score"),
    bestPractices: finiteNumber(lhr.categories?.["best-practices"]?.score, "best-practices score"),
    seo: finiteNumber(lhr.categories?.seo?.score, "SEO score"),
    lcpMs: finiteNumber(audit(lhr, "largest-contentful-paint").numericValue, "LCP"),
    cls: finiteNumber(audit(lhr, "cumulative-layout-shift").numericValue, "CLS"),
    tbtMs: finiteNumber(audit(lhr, "total-blocking-time").numericValue, "TBT"),
    scriptBytes: finiteNumber(resource(lhr, "script").transferSize, "script transfer size"),
    cssBytes: finiteNumber(resource(lhr, "stylesheet").transferSize, "stylesheet transfer size"),
    totalBytes: finiteNumber(resource(lhr, "total").transferSize, "total transfer size"),
    requestCount: finiteNumber(resource(lhr, "total").requestCount, "request count"),
    largestImageBytes: Math.max(0, ...images.map((item) => finiteNumber(item.transferSize ?? 0, "image transfer size"))),
    longestTaskMs: Math.max(0, ...tasks.map((item) => finiteNumber(item.duration ?? 0, "long-task duration"))),
  };
}

export function evaluateLighthouseRuns(lhrs, requiredRoutes, options = {}) {
  const indexability = options.indexability ?? "indexable";
  const groups = new Map();
  for (const lhr of lhrs) {
    const path = new URL(lhr.finalUrl).pathname.replace(/\/$/, "") || "/";
    assertSeoPolicy(lhr, indexability);
    groups.set(path, [...(groups.get(path) ?? []), routeMetrics(lhr)]);
  }
  invariant(requiredRoutes.length > 0, "required Lighthouse route registry is empty");
  for (const required of requiredRoutes) invariant(groups.has(required), `missing Lighthouse route ${required}`);
  invariant(groups.size === new Set(requiredRoutes).size, "Lighthouse output contains an unregistered or duplicate route group");
  const summaries = {};
  for (const [path, runs] of groups) {
    invariant(runs.length === 3, `${path} requires exactly three Lighthouse runs`);
    for (const run of runs) {
      invariant(run.accessibility === 1, `${path} accessibility below 100`);
      invariant(run.bestPractices === 1, `${path} best practices below 100`);
      if (indexability === "indexable") invariant(run.seo === 1, `${path} SEO below 100`);
      invariant(run.scriptBytes <= 180 * 1024, `${path} JS exceeds 180KB`);
      invariant(run.cssBytes <= 60 * 1024, `${path} CSS exceeds 60KB`);
      invariant(run.totalBytes <= 1.5 * 1024 * 1024, `${path} transfer exceeds 1.5MB`);
      invariant(run.requestCount <= 60, `${path} requests exceed 60`);
      invariant(run.largestImageBytes <= 300 * 1024, `${path} initial image exceeds 300KB`);
    }
    const performance = median(runs.map((run) => run.performance));
    const lcpMs = median(runs.map((run) => run.lcpMs));
    const cls = median(runs.map((run) => run.cls));
    const tbtMs = median(runs.map((run) => run.tbtMs));
    const longestTaskMs = median(runs.map((run) => run.longestTaskMs));
    const performanceFloor = path === "/" ? 0.92 : path === "/teachings" ? 0.90 : 0.95;
    invariant(performance >= performanceFloor, `${path} median performance below gate`);
    const lcpCeiling = path === "/teachings" ? 3200 : 3000;
    invariant(lcpMs <= lcpCeiling, `${path} median LCP exceeds ${lcpCeiling}ms`);
    invariant(cls <= 0.05, `${path} median CLS exceeds 0.05`);
    invariant(tbtMs <= 200, `${path} median TBT exceeds 200ms`);
    const longestTaskCeiling = path === "/teachings" ? 250 : 200;
    invariant(longestTaskMs <= longestTaskCeiling, `${path} median long task exceeds ${longestTaskCeiling}ms`);
    summaries[path] = {
      performance,
      lcpMs,
      cls,
      tbtMs,
      scriptBytes: Math.max(...runs.map((run) => run.scriptBytes)),
      cssBytes: Math.max(...runs.map((run) => run.cssBytes)),
      totalBytes: Math.max(...runs.map((run) => run.totalBytes)),
      requestCount: Math.max(...runs.map((run) => run.requestCount)),
      largestImageBytes: Math.max(...runs.map((run) => run.largestImageBytes)),
      longestTaskMs,
    };
  }
  return { status: "pass", routes: groups.size, summaries };
}

export function analyzeTrace(events, durationSeconds) {
  invariant(Number.isFinite(durationSeconds) && durationSeconds > 0, "trace duration must be a positive finite number");
  const drawnFrames = events.filter((event) => event.name === "DrawFrame" || event.name === "Display::DrawAndSwap").length;
  const beginFrames = events.filter((event) => event.name === "BeginFrame").length;
  const explicitDropped = events.filter((event) => /DroppedFrame/i.test(event.name)).length;
  const taskDurationsMs = events
    .filter((event) => typeof event.dur === "number" && /(^|::)RunTask$|ProcessTaskFromWorkQueue/.test(event.name))
    .map((event) => event.dur / 1000);
  const droppedFrames = Math.max(explicitDropped, Math.max(0, beginFrames - drawnFrames));
  invariant(drawnFrames > 0, "trace contains no drawn-frame events");
  const fps = drawnFrames / durationSeconds;
  const droppedPercent = (droppedFrames / Math.max(1, drawnFrames + droppedFrames)) * 100;
  return {
    drawnFrames,
    droppedFrames,
    fps: Math.round(fps * 100) / 100,
    droppedPercent: Math.round(droppedPercent * 100) / 100,
    longestTaskMs: Math.round(Math.max(0, ...taskDurationsMs) * 100) / 100,
  };
}

export function evaluatePixelRuns(runs) {
  invariant(runs.length === 3, "physical motion gate requires exactly three runs");
  for (const run of runs) {
    finiteNumber(run.fps, "physical FPS");
    finiteNumber(run.droppedPercent, "physical dropped-frame percentage");
    finiteNumber(run.longestTaskMs, "physical long-task duration");
    invariant(run.longestTaskMs <= 200, `physical primary-scroll long task ${run.longestTaskMs}ms exceeds 200ms`);
  }
  const medianFps = median(runs.map((run) => run.fps));
  const medianDroppedPercent = median(runs.map((run) => run.droppedPercent));
  invariant(medianFps >= 55, `physical median FPS ${medianFps} is below 55`);
  invariant(medianDroppedPercent < 5, `physical median dropped frames ${medianDroppedPercent}% is not below 5%`);
  return { status: "pass", medianFps, medianDroppedPercent, runs };
}
