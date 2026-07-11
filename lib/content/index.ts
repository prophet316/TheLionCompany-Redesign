import { destinationRegistry } from "@/content/destinations";
import { topicDefinitions } from "@/content/topics";
import { destinationSchema, liveScheduleSchema, recentReplaySchema, teachingSchema, topicSchema } from "./schemas";
import type { DestinationKey, LiveSchedule, RecentReplay, SiteContent, Teaching, TopicDefinition, TopicSlug } from "./types";

function assertUnique<T>(items: readonly T[], key: (item: T) => string, label: string) {
  const seen = new Set<string>();
  for (const item of items) {
    const value = key(item);
    if (seen.has(value)) throw new Error(`duplicate ${label}: ${value}`);
    seen.add(value);
  }
}

export function validateContentBundle(input: {
  site: SiteContent;
  destinations: readonly unknown[];
  topics: readonly unknown[];
  teachings: readonly unknown[];
  live: LiveSchedule | null;
  replay: RecentReplay | null;
}) {
  const destinations = input.destinations.map((item) => destinationSchema.parse(item));
  const topics = input.topics.map((item) => topicSchema.parse(item));
  const teachings = input.teachings.map((item) => teachingSchema.parse(item));
  if (input.live) liveScheduleSchema.parse(input.live);
  if (input.replay) recentReplaySchema.parse(input.replay);
  assertUnique(destinations, (item) => item.key, "destination key");
  assertUnique(topics, (item) => item.slug, "topic slug");
  assertUnique(teachings, (item) => item.slug, "teaching slug");
  assertUnique(teachings, (item) => item.youtubeId, "YouTube ID");
  const validTopics = new Set(topics.map((item) => item.slug));
  for (const teaching of teachings) {
    for (const topic of teaching.topics) if (!validTopics.has(topic)) throw new Error(`unknown topic: ${topic}`);
  }
  if (input.site.canonicalOrigin !== "https://www.thelioncompany.org") throw new Error("canonical origin drifted");
  return true;
}

export function getDestination(key: DestinationKey) {
  const destination = destinationRegistry.find((item) => item.key === key && item.visible);
  if (!destination) throw new Error(`destination unavailable: ${key}`);
  return destination;
}

export function getTopicBySlug(slug: TopicSlug): TopicDefinition {
  const topic = topicDefinitions.find((item) => item.slug === slug);
  if (!topic) throw new Error(`topic unavailable: ${slug}`);
  return topic;
}

export function isTeachingEmbeddable(teaching: Teaching) {
  return teaching.captionsVerified && teaching.transcriptUrl !== null && new URL(teaching.transcriptUrl).origin === "https://www.thelioncompany.org";
}

export { type DestinationKey, type Destination, type TopicSlug, type TopicDefinition, type Teaching, type LiveSchedule, type RecentReplay, type PodcastEpisode, type SiteContent } from "./types";
