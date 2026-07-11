import { describe, expect, it } from "vitest";
import {
  beginVisit,
  canShowNewsletter,
  canShowStore,
  createPromptRecord,
  suppressPrompt,
} from "@/lib/prompts/model";

const hour = 60 * 60 * 1000;
describe("prompt model", () => {
  it("keeps tabs in one visit until 30 minutes of inactivity", () => {
    const first = beginVisit(createPromptRecord(0), 1_000, "visit-a");
    const same = beginVisit(first, 1_000 + 29 * 60_000, "visit-b");
    const next = beginVisit(same, same.lastActivityAt + 31 * 60_000, "visit-c");
    expect(same.visitId).toBe("visit-a");
    expect(same.visitCount).toBe(1);
    expect(next.visitId).toBe("visit-c");
    expect(next.visitCount).toBe(2);
  });

  it("gives newsletter automatic priority and respects exact suppressions", () => {
    const record = beginVisit(createPromptRecord(0), 1_000, "visit-a");
    expect(canShowNewsletter(record, 1_000, { visibleMs: 60_000, progress: 0, inactiveMs: 15_000 })).toBe(true);
    expect(canShowStore(record, 1_000, { sectionVisibleMs: 8_000, exitIntent: false, progress: 0.6 })).toBe(false);
    const dismissed = suppressPrompt(record, "newsletter", "dismissed", 1_000);
    expect(canShowNewsletter(dismissed, 1_000 + 29 * 24 * hour, { visibleMs: 60_000, progress: 0.55, inactiveMs: 15_000 })).toBe(false);
  });
});
