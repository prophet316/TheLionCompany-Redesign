export type DestinationKey =
  | "tiktok" | "youtube" | "applePodcasts" | "spotify" | "podbean"
  | "podcastRss" | "instagram" | "facebook" | "threads" | "x"
  | "printify" | "subsplash";

export type DestinationKind = "social" | "podcast" | "feed" | "commerce" | "giving";

export interface Destination {
  key: DestinationKey;
  label: string;
  href: string;
  purpose: string;
  kind: DestinationKind;
  required: boolean;
  visible: boolean;
  verifiedAt: string;
}

export type TopicSlug =
  | "fear-and-trust"
  | "purpose-and-calling"
  | "relationships-and-family"
  | "prayer-and-spiritual-growth"
  | "church-reform-and-unity"
  | "truth-conflict-and-courage";

export interface TopicDefinition {
  slug: TopicSlug;
  label: string;
  prompt: string;
  description: string;
}

export interface Teaching {
  slug: string;
  title: string;
  summary: string;
  youtubeId: string;
  posterPath: `/images/teachings/${string}.jpg`;
  publishedAt: string | null;
  topics: readonly TopicSlug[];
  series: string | null;
  captionsVerified: boolean;
  transcriptUrl: string | null;
  featured: boolean;
}

export interface LiveSchedule {
  startsAt: string;
  endsAt: string;
  sourceTimeZone: string;
  verifiedAt: string;
  topic?: string;
  url: string;
}

export interface RecentReplay {
  title: string;
  url: string;
  publishedAt: string;
  expiresAt: string;
}

export interface PodcastEpisode {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  durationSeconds: number | null;
  audioUrl: string;
  pageUrl: string;
  imageUrl: string | null;
  episodeNumber: number | null;
  transcriptUrl: string | null;
}

export interface SiteContent {
  name: string;
  shortName: string;
  canonicalOrigin: string;
  locale: "en_US";
  homeTitle: string;
  homeDescription: string;
  location: string;
  foundationalQuote: string;
  missionHeading: string;
  missionStatement: string;
  story: string;
  navigation: readonly { label: string; href: string }[];
  pillars: readonly { title: "Love" | "Relationship" | "Discipleship" | "Education"; body: string }[];
}
