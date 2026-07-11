import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const EXPECTED = Object.freeze({
  slug: "when-gods-will-doesnt-go-your-way",
  youtubeId: "TOj6tefx3rI",
  sourceWatchUrl: "https://www.youtube.com/watch?v=TOj6tefx3rI",
  sourceDurationSeconds: 2223,
  captionTrackLanguage: "en",
  transcriptPath: "content/transcripts/when-gods-will-doesnt-go-your-way.txt",
  reviewMethod: "complete-listen-through",
  decision: "approved-complete-text-alternative",
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function validateTranscriptReview(records, transcript, now = Date.now()) {
  invariant(Array.isArray(records), "transcript review evidence must be an array");
  const matches = records.filter((record) => record?.slug === EXPECTED.slug);
  invariant(matches.length === 1, "authorized-human transcript review is pending");
  const record = matches[0];
  for (const [key, value] of Object.entries(EXPECTED)) {
    invariant(record[key] === value, `transcript review ${key} mismatch`);
  }
  invariant(record.schemaVersion === 1, "transcript review schema mismatch");
  invariant(typeof record.reviewer === "string" && record.reviewer.trim().length >= 2, "authorized reviewer is missing");
  const retrievedAt = Date.parse(record.captionRetrievedAt);
  const reviewedAt = Date.parse(record.reviewedAt);
  invariant(Number.isFinite(retrievedAt) && Number.isFinite(reviewedAt), "transcript review dates are invalid");
  invariant(reviewedAt >= retrievedAt && reviewedAt <= now, "transcript review chronology is invalid");
  invariant(typeof transcript === "string" && transcript.trim().split(/\s+/).length > 1_000, "complete transcript is missing");
  const digest = createHash("sha256").update(transcript).digest("hex");
  invariant(record.transcriptSha256 === digest, "transcript review hash mismatch");
  return record;
}

function main() {
  const records = JSON.parse(readFileSync("content/evidence/teaching-transcript-reviews.json", "utf8"));
  const transcript = readFileSync(EXPECTED.transcriptPath, "utf8");
  const record = validateTranscriptReview(records, transcript);
  console.log(JSON.stringify({ status: "pass", slug: record.slug, reviewedAt: record.reviewedAt }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
