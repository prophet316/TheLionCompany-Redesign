export interface TranscriptReviewRecord {
  readonly schemaVersion: 1;
  readonly slug: string;
  readonly youtubeId: string;
  readonly sourceWatchUrl: string;
  readonly sourceDurationSeconds: number;
  readonly captionTrackLanguage: "en";
  readonly captionRetrievedAt: string;
  readonly transcriptPath: string;
  readonly transcriptSha256: string;
  readonly reviewer: string;
  readonly reviewedAt: string;
  readonly reviewMethod: "complete-listen-through";
  readonly decision: "approved-complete-text-alternative";
}

export function validateTranscriptReview(
  records: unknown,
  transcript: string,
  now?: number,
): TranscriptReviewRecord;
