import { z } from "zod";

export const isoDateSchema = z.iso.date();
export const isoDateTimeSchema = z.iso.datetime({ offset: true });
const httpsUrlSchema = z.url().refine((value) => new URL(value).protocol === "https:", "URL must use HTTPS");
const ianaTimeZoneSchema = z.string().refine((value) => {
  try { new Intl.DateTimeFormat("en-US", { timeZone: value }).format(); return value.includes("/"); }
  catch { return false; }
}, "sourceTimeZone must be a valid named IANA timezone");

export const destinationSchema = z.object({
  key: z.enum(["tiktok", "youtube", "applePodcasts", "spotify", "podbean", "podcastRss", "instagram", "facebook", "threads", "x", "printify", "subsplash"]),
  label: z.string().min(1),
  href: httpsUrlSchema,
  purpose: z.string().min(1),
  kind: z.enum(["social", "podcast", "feed", "commerce", "giving"]),
  required: z.boolean(),
  visible: z.boolean(),
  verifiedAt: isoDateSchema,
});

export const topicSchema = z.object({
  slug: z.enum(["fear-and-trust", "purpose-and-calling", "relationships-and-family", "prayer-and-spiritual-growth", "church-reform-and-unity", "truth-conflict-and-courage"]),
  label: z.string().min(1),
  prompt: z.string().min(1),
  description: z.string().min(1),
});

export const teachingSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  summary: z.string().min(30),
  youtubeId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
  posterPath: z.custom<`/images/teachings/${string}.jpg`>(
    (value) => typeof value === "string" && /^\/images\/teachings\/[a-z0-9]+(?:-[a-z0-9]+)*\.jpg$/.test(value),
    "posterPath must be a first-party teaching JPEG",
  ),
  publishedAt: isoDateTimeSchema.nullable(),
  topics: z.array(topicSchema.shape.slug).min(1),
  series: z.string().min(1).nullable(),
  captionsVerified: z.boolean(),
  transcriptUrl: httpsUrlSchema.nullable(),
  featured: z.boolean(),
});

export const liveScheduleSchema = z.object({
  startsAt: isoDateTimeSchema,
  endsAt: isoDateTimeSchema,
  sourceTimeZone: ianaTimeZoneSchema,
  verifiedAt: isoDateSchema,
  topic: z.string().min(1).max(120).optional(),
  url: httpsUrlSchema,
}).superRefine((value, context) => {
  const duration = Date.parse(value.endsAt) - Date.parse(value.startsAt);
  if (duration <= 0) context.addIssue({ code: "custom", message: "endsAt must follow startsAt" });
  if (duration > 8 * 60 * 60 * 1000) context.addIssue({ code: "custom", message: "live interval cannot exceed eight hours" });
});

export const recentReplaySchema = z.object({
  title: z.string().min(1),
  url: httpsUrlSchema,
  publishedAt: isoDateTimeSchema,
  expiresAt: isoDateTimeSchema,
}).refine((value) => Date.parse(value.expiresAt) > Date.parse(value.publishedAt), {
  message: "replay expiry must follow publication",
});

export const podcastEpisodeSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  description: z.string().min(20),
  publishedAt: isoDateTimeSchema,
  durationSeconds: z.number().int().positive().nullable(),
  audioUrl: httpsUrlSchema,
  pageUrl: httpsUrlSchema,
  imageUrl: httpsUrlSchema.nullable(),
  episodeNumber: z.number().int().positive().nullable(),
  transcriptUrl: httpsUrlSchema.nullable(),
});
