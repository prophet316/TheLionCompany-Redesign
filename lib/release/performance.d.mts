export type PixelRun = { fps: number; droppedPercent: number; longestTaskMs: number; drawnFrames?: number; droppedFrames?: number };
export function median(values: readonly number[]): number;
export function evaluateLighthouseRuns(lhrs: readonly unknown[], requiredRoutes: readonly string[], options?: { indexability?: "indexable" | "preview-noindex" }): { status: "pass"; routes: number; summaries: Record<string, Record<string, number>> };
export function analyzeTrace(events: readonly { name: string; ts?: number; dur?: number; ph?: string }[], durationSeconds: number): { drawnFrames: number; droppedFrames: number; fps: number; droppedPercent: number; longestTaskMs: number };
export function evaluatePixelRuns(runs: readonly PixelRun[]): { status: "pass"; medianFps: number; medianDroppedPercent: number; runs: readonly PixelRun[] };
