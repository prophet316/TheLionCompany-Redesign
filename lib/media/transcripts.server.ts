import "server-only";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import type { Teaching } from "@/lib/content/types";

const transcriptFiles = {
  "when-gods-will-doesnt-go-your-way": { filename: "when-gods-will-doesnt-go-your-way.txt", sourceDurationSeconds: 2223 },
} as const;

const evidenceSchema = z.object({
  schemaVersion: z.literal(1),
  slug: z.string().min(1),
  youtubeId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
  sourceWatchUrl: z.string().url(),
  sourceDurationSeconds: z.number().int().positive(),
  captionTrackLanguage: z.literal("en"),
  captionRetrievedAt: z.string().datetime({ offset: true }),
  transcriptPath: z.string().startsWith("content/transcripts/"),
  transcriptSha256: z.string().regex(/^[a-f0-9]{64}$/),
  reviewer: z.string().trim().min(2),
  reviewedAt: z.string().datetime({ offset: true }),
  reviewMethod: z.literal("complete-listen-through"),
  decision: z.literal("approved-complete-text-alternative"),
}).strict();

export function getTeachingReviewBundle(teaching: Teaching): {
  readonly teaching: Teaching;
  readonly transcript?: string;
  readonly evidence?: z.infer<typeof evidenceSchema>;
} {
  const ineligible = { ...teaching, captionsVerified: false, transcriptUrl: null } satisfies Teaching;
  const source = transcriptFiles[teaching.slug as keyof typeof transcriptFiles];
  if (!source) return { teaching: ineligible };
  const records = z.array(evidenceSchema).parse(JSON.parse(readFileSync(join(process.cwd(), "content/evidence/teaching-transcript-reviews.json"), "utf8")));
  const evidence = records.find((record) => record.slug === teaching.slug);
  if (!evidence) return { teaching: ineligible };
  const expectedPath = `content/transcripts/${source.filename}`;
  const expectedUrl = `https://www.youtube.com/watch?v=${teaching.youtubeId}`;
  if (evidence.youtubeId !== teaching.youtubeId || evidence.sourceWatchUrl !== expectedUrl || evidence.transcriptPath !== expectedPath || evidence.sourceDurationSeconds !== source.sourceDurationSeconds) {
    throw new Error(`transcript evidence identity mismatch for ${teaching.slug}`);
  }
  const transcript = readFileSync(join(process.cwd(), expectedPath), "utf8");
  const digest = createHash("sha256").update(transcript).digest("hex");
  if (digest !== evidence.transcriptSha256) throw new Error(`transcript review hash mismatch for ${teaching.slug}`);
  if (Date.parse(evidence.reviewedAt) < Date.parse(evidence.captionRetrievedAt) || Date.parse(evidence.reviewedAt) > Date.now()) {
    throw new Error(`transcript review dates are invalid for ${teaching.slug}`);
  }
  return {
    teaching: { ...teaching, captionsVerified: true, transcriptUrl: `https://www.thelioncompany.org/teachings/${teaching.slug}#transcript` },
    transcript,
    evidence,
  };
}
