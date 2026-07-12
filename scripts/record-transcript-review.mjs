import { createHash } from "node:crypto";
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";

const TRANSCRIPT_SOURCES = {
  "when-gods-will-doesnt-go-your-way": {
    youtubeId: "TOj6tefx3rI",
    transcriptPath: "content/transcripts/when-gods-will-doesnt-go-your-way.txt",
    sourceDurationSeconds: 2223,
  },
};

function arg(flag) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function main() {
  const slug = arg("--slug");
  const confirmed = process.argv.includes("--confirm-complete-listen-through");
  const reviewer = process.env.TRANSCRIPT_REVIEWER;
  const captionRetrievedAt = process.env.TRANSCRIPT_CAPTION_RETRIEVED_AT;
  const reviewedAt = process.env.TRANSCRIPT_REVIEWED_AT;

  if (!slug || !TRANSCRIPT_SOURCES[slug]) return fail("provide a known --slug");
  if (!confirmed) return fail("refusing to record without --confirm-complete-listen-through");
  if (!reviewer || reviewer.trim().length < 2) return fail("set TRANSCRIPT_REVIEWER to the authorized reviewer's name");
  if (!captionRetrievedAt || Number.isNaN(Date.parse(captionRetrievedAt))) return fail("set TRANSCRIPT_CAPTION_RETRIEVED_AT to a valid ISO timestamp");
  if (!reviewedAt || Number.isNaN(Date.parse(reviewedAt))) return fail("set TRANSCRIPT_REVIEWED_AT to a valid ISO timestamp");
  if (Date.parse(reviewedAt) > Date.now()) return fail("TRANSCRIPT_REVIEWED_AT cannot be in the future");
  if (Date.parse(reviewedAt) < Date.parse(captionRetrievedAt)) return fail("TRANSCRIPT_REVIEWED_AT must not precede caption retrieval");

  const source = TRANSCRIPT_SOURCES[slug];
  if (!existsSync(source.transcriptPath)) return fail(`transcript file missing: ${source.transcriptPath}`);
  const transcript = readFileSync(source.transcriptPath, "utf8");
  if (transcript.trim().length === 0) return fail("transcript file is empty");

  const record = {
    schemaVersion: 1,
    slug,
    youtubeId: source.youtubeId,
    sourceWatchUrl: `https://www.youtube.com/watch?v=${source.youtubeId}`,
    sourceDurationSeconds: source.sourceDurationSeconds,
    captionTrackLanguage: "en",
    captionRetrievedAt,
    transcriptPath: source.transcriptPath,
    transcriptSha256: createHash("sha256").update(transcript).digest("hex"),
    reviewer: reviewer.trim(),
    reviewedAt,
    reviewMethod: "complete-listen-through",
    decision: "approved-complete-text-alternative",
  };

  const evidencePath = "content/evidence/teaching-transcript-reviews.json";
  const existing = existsSync(evidencePath) ? JSON.parse(readFileSync(evidencePath, "utf8")) : [];
  const withoutSlug = existing.filter((entry) => entry.slug !== slug);
  const next = [...withoutSlug, record];
  const tmpPath = `${evidencePath}.tmp`;
  writeFileSync(tmpPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  renameSync(tmpPath, evidencePath);
  console.log(`recorded transcript review for ${slug}: ${record.transcriptSha256}`);
}

main();
