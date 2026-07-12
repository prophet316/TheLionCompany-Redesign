import { describe, expect, it } from "vitest";
import { indexableStaticRoutes } from "../../../config/routes";
import {
  analyzeTrace,
  evaluateLighthouseRuns,
  evaluatePixelRuns,
  median,
} from "../../../lib/release/performance.mjs";

function lhr(
  path: string,
  performance: number,
  overrides: Record<string, number> = {},
  indexability: "indexable" | "preview-noindex" = "indexable",
) {
  const metrics = {
    lcp: 2400, cls: 0.04, tbt: 200, script: 180 * 1024, stylesheet: 60 * 1024,
    total: 1.5 * 1024 * 1024, requests: 60, largestImage: 300 * 1024, longTask: 199,
    ...overrides,
  };
  return {
    finalUrl: `http://127.0.0.1:3000${path}`,
    categories: {
      performance: { score: performance }, accessibility: { score: 1 },
      "best-practices": { score: 1 },
      seo: {
        score: indexability === "indexable" ? 1 : 0.66,
        auditRefs: [
          { id: "is-crawlable", weight: 4 },
          { id: "document-title", weight: 1 },
        ],
      },
    },
    audits: {
      "is-crawlable": indexability === "indexable"
        ? { score: 1, details: { items: [] } }
        : { score: 0, details: { items: [{ source: { snippet: '<meta name="robots" content="noindex, nofollow">' } }] } },
      "document-title": { score: 1 },
      "largest-contentful-paint": { numericValue: metrics.lcp },
      "cumulative-layout-shift": { numericValue: metrics.cls },
      "total-blocking-time": { numericValue: metrics.tbt },
      "resource-summary": { details: { items: [
        { resourceType: "script", transferSize: metrics.script, requestCount: 10 },
        { resourceType: "stylesheet", transferSize: metrics.stylesheet, requestCount: 4 },
        { resourceType: "total", transferSize: metrics.total, requestCount: metrics.requests },
      ] } },
      "network-requests": { details: { items: [{ resourceType: "Image", transferSize: metrics.largestImage }] } },
      "long-tasks": { details: { items: [{ duration: metrics.longTask }] } },
    },
  };
}

describe("performance gates", () => {
  it("uses a true median for three runs", () => {
    expect(median([96, 92, 94])).toBe(94);
  });

  it("accepts exact home/static and transfer boundaries", () => {
    const runs = [0.92, 0.94, 0.96].flatMap((home) =>
      indexableStaticRoutes.map((path) => lhr(path, path === "/" ? home : 0.95)));
    expect(evaluateLighthouseRuns(runs, indexableStaticRoutes)).toMatchObject({ status: "pass", routes: indexableStaticRoutes.length });
  });

  it("rejects one-point category, transfer, image, and request regressions in every run", () => {
    const base = [lhr("/", 0.92), lhr("/", 0.92), lhr("/", 0.92)];
    for (const bad of [
      lhr("/", 0.92, { script: 180 * 1024 + 1 }),
      lhr("/", 0.92, { stylesheet: 60 * 1024 + 1 }), lhr("/", 0.92, { total: 1.5 * 1024 * 1024 + 1 }),
      lhr("/", 0.92, { requests: 61 }), lhr("/", 0.92, { largestImage: 300 * 1024 + 1 }),
    ]) expect(() => evaluateLighthouseRuns([base[0], base[1], bad], ["/"])).toThrow();
    expect(() => evaluateLighthouseRuns([lhr("/", 0.919), lhr("/", 0.919), lhr("/", 0.919)], ["/"])).toThrow(/median performance/);
    expect(() => evaluateLighthouseRuns([
      lhr("/", 0.92, { lcp: Number.NaN }), lhr("/", 0.92), lhr("/", 0.92),
    ], ["/"])).toThrow(/finite number/);
  });

  it("uses the median for noisy field timings while rejecting a sustained regression", () => {
    const healthy = lhr("/", 0.92);
    for (const isolatedOutlier of [
      lhr("/", 0.92, { lcp: 9000 }),
      lhr("/", 0.92, { cls: 0.5 }),
      lhr("/", 0.92, { tbt: 3000 }),
      lhr("/", 0.92, { longTask: 3000 }),
    ]) expect(evaluateLighthouseRuns([healthy, healthy, isolatedOutlier], ["/"])).toMatchObject({ status: "pass" });

    const sustainedRegressions: Array<Record<string, number>> = [
      { lcp: 2501 }, { cls: 0.051 }, { tbt: 201 }, { longTask: 201 },
    ];
    for (const sustainedRegression of sustainedRegressions) expect(() => evaluateLighthouseRuns([
      healthy,
      lhr("/", 0.92, sustainedRegression),
      lhr("/", 0.92, sustainedRegression),
    ], ["/"])).toThrow(/median/);
  });

  it("requires explicit preview noindex while retaining full production SEO", () => {
    const preview = [0.92, 0.93, 0.94].map((score) => lhr("/", score, {}, "preview-noindex"));
    expect(evaluateLighthouseRuns(preview, ["/"], { indexability: "preview-noindex" })).toMatchObject({ status: "pass" });
    expect(() => evaluateLighthouseRuns(preview, ["/"], { indexability: "indexable" })).toThrow(/SEO below 100/);

    const wrongReason = structuredClone(preview);
    wrongReason[0].audits["is-crawlable"].details.items = [{ source: { snippet: "blocked by authentication" } }];
    expect(() => evaluateLighthouseRuns(wrongReason, ["/"], { indexability: "preview-noindex" })).toThrow(/noindex directive/);

    const otherSeoFailure = structuredClone(preview);
    otherSeoFailure[0].audits["document-title"].score = 0;
    expect(() => evaluateLighthouseRuns(otherSeoFailure, ["/"], { indexability: "preview-noindex" })).toThrow(/document-title/);
  });

  it("requires three physical runs, median 55 fps, and dropped frames below 5 percent", () => {
    expect(evaluatePixelRuns([
      { fps: 55, droppedPercent: 4.9, longestTaskMs: 200 },
      { fps: 57, droppedPercent: 4.0, longestTaskMs: 180 },
      { fps: 54, droppedPercent: 4.8, longestTaskMs: 190 },
    ])).toMatchObject({ status: "pass", medianFps: 55, medianDroppedPercent: 4.8 });
    expect(() => evaluatePixelRuns([
      { fps: 55, droppedPercent: 5, longestTaskMs: 199 },
      { fps: 55, droppedPercent: 5, longestTaskMs: 199 },
      { fps: 55, droppedPercent: 5, longestTaskMs: 199 },
    ])).toThrow();
    expect(() => evaluatePixelRuns([
      { fps: 55, droppedPercent: 4, longestTaskMs: 201 },
      { fps: 55, droppedPercent: 4, longestTaskMs: 199 },
      { fps: 55, droppedPercent: 4, longestTaskMs: 199 },
    ])).toThrow(/long task/);
    expect(() => evaluatePixelRuns([
      { fps: Number.NaN, droppedPercent: 4, longestTaskMs: 199 },
      { fps: 55, droppedPercent: 4, longestTaskMs: 199 },
      { fps: 55, droppedPercent: 4, longestTaskMs: 199 },
    ])).toThrow(/finite number/);
  });

  it("derives draw and dropped evidence from trace events", () => {
    const events = [
      ...Array.from({ length: 55 }, (_, index) => ({ name: "DrawFrame", ts: index * 18_000 })),
      ...Array.from({ length: 2 }, (_, index) => ({ name: "DroppedFrame", ts: index * 400_000 })),
      { name: "RunTask", ts: 0, dur: 199_000, ph: "X" },
    ];
    expect(analyzeTrace(events, 1)).toMatchObject({ drawnFrames: 55, droppedFrames: 2, fps: 55, longestTaskMs: 199 });
    expect(() => analyzeTrace(events, 0)).toThrow(/positive finite number/);
  });
});
