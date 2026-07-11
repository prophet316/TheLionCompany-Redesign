import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { validateTranscriptReview } from "../../scripts/check-transcript-review.mjs";

const now = Date.parse("2026-07-11T20:00:00.000Z");
const transcript = "reviewed ".repeat(1_200).trim();
const valid = {
  schemaVersion: 1 as const,
  slug: "when-gods-will-doesnt-go-your-way",
  youtubeId: "TOj6tefx3rI",
  sourceWatchUrl: "https://www.youtube.com/watch?v=TOj6tefx3rI",
  sourceDurationSeconds: 2223,
  captionTrackLanguage: "en" as const,
  captionRetrievedAt: "2026-07-11T18:00:00.000Z",
  transcriptPath: "content/transcripts/when-gods-will-doesnt-go-your-way.txt",
  transcriptSha256: createHash("sha256").update(transcript).digest("hex"),
  reviewer: "Authorized Reviewer",
  reviewedAt: "2026-07-11T19:00:00.000Z",
  reviewMethod: "complete-listen-through" as const,
  decision: "approved-complete-text-alternative" as const,
};

describe("transcript review release gate", () => {
  it("fails closed while authorized-human evidence is absent", () => {
    expect(() => validateTranscriptReview([], transcript, now)).toThrow(/authorized-human transcript review is pending/);
  });

  it("accepts only the exact identity, chronology, decision, and transcript hash", () => {
    expect(validateTranscriptReview([valid], transcript, now)).toMatchObject({ reviewer: "Authorized Reviewer" });
    expect(() => validateTranscriptReview([{ ...valid, transcriptSha256: "0".repeat(64) }], transcript, now)).toThrow(/hash mismatch/);
    expect(() => validateTranscriptReview([{ ...valid, sourceDurationSeconds: 1 }], transcript, now)).toThrow(/sourceDurationSeconds mismatch/);
  });
});
