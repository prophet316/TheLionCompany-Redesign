const internalTargets = ["start-here", "live", "teachings", "podcast", "prayer", "connect", "store", "give", "newsletter"] as const;
const formErrorCodes = ["invalid_origin", "invalid_content_type", "body_too_large", "invalid_json", "invalid_fields", "bot_rejected", "turnstile_failed", "turnstile_expired", "already_processing", "provider_unavailable", "configuration_error", "network_error"] as const;
const contactReasons = ["speaking", "partnership", "media", "testimony", "general"] as const;

export const analyticsPropertyValues = {
  nav_click: { target: internalTargets, placement: ["header", "mobile", "footer"] as const },
  cta_click: { target: internalTargets, placement: ["header", "mobile", "footer", "home-hero", "home-final"] as const },
  social_click: { target: ["tiktok", "youtube", "instagram", "facebook", "threads", "x"] as const, placement: ["footer", "home-network", "connect"] as const },
  tiktok_live_click: { state: ["evergreen", "next", "live", "ended"] as const, placement: ["hero", "live-page"] as const },
  podcast_platform_click: { target: ["applePodcasts", "spotify", "podbean", "podcastRss", "youtube"] as const, placement: ["footer", "home-network", "podcast-index", "podcast-detail", "connect"] as const },
  video_start: { placement: ["home", "teaching-detail"] as const },
  store_prompt_view: { placement: ["home-edge"] as const },
  store_prompt_dismiss: { placement: ["home-edge"] as const },
  store_click: { placement: ["prompt-dialog", "store-page"] as const },
  give_click: { target: ["subsplash"] as const, placement: ["give-page-primary", "test"] as const },
  newsletter_form_start: { placement: ["inline", "prompt", "connect"] as const },
  newsletter_submit: { placement: ["inline", "prompt", "connect"] as const },
  newsletter_request_accepted: { placement: ["inline", "prompt", "connect"] as const },
  newsletter_error: { placement: ["inline", "prompt", "connect"] as const, code: formErrorCodes },
  contact_form_start: { reason: contactReasons },
  contact_submit: { reason: contactReasons },
  contact_success: { reason: contactReasons },
  contact_error: { reason: contactReasons, code: formErrorCodes },
  client_error: { component: ["window", "media", "prompt", "navigation"] as const, code: ["runtime_error", "unhandled_rejection", "resource_load"] as const },
} as const;

export type AnalyticsEventName = keyof typeof analyticsPropertyValues | "web_vital";
type ValueOf<T> = T extends readonly (infer Value)[] ? Value : never;
export type AnalyticsProperties<Event extends AnalyticsEventName> = Event extends "web_vital"
  ? Readonly<{ metric_name: "INP"; metric_value_ms: number; metric_rating: "good" | "needs-improvement" | "poor"; page_group: "home" }>
  : Event extends keyof typeof analyticsPropertyValues
    ? Readonly<{ [Key in keyof (typeof analyticsPropertyValues)[Event]]: ValueOf<(typeof analyticsPropertyValues)[Event][Key]> }>
    : never;

export type SocialAnalyticsTarget = AnalyticsProperties<"social_click">["target"];
export type PodcastAnalyticsTarget = AnalyticsProperties<"podcast_platform_click">["target"];
export function isSocialAnalyticsTarget(value: string): value is SocialAnalyticsTarget {
  return (analyticsPropertyValues.social_click.target as readonly string[]).includes(value);
}
export function isPodcastAnalyticsTarget(value: string): value is PodcastAnalyticsTarget {
  return (analyticsPropertyValues.podcast_platform_click.target as readonly string[]).includes(value);
}

export function safeProperties<Event extends AnalyticsEventName>(
  event: Event,
  properties: unknown,
): AnalyticsProperties<Event> | null {
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) return null;
  const record = properties as Record<string, unknown>;
  if (event === "web_vital") {
    const keys = Object.keys(record).sort().join(",");
    if (
      keys !== "metric_name,metric_rating,metric_value_ms,page_group" ||
      record.metric_name !== "INP" ||
      !Number.isInteger(record.metric_value_ms) ||
      (record.metric_value_ms as number) < 0 ||
      (record.metric_value_ms as number) > 60_000 ||
      !["good", "needs-improvement", "poor"].includes(String(record.metric_rating)) ||
      record.page_group !== "home"
    ) return null;
    return record as unknown as AnalyticsProperties<Event>;
  }
  if (!(event in analyticsPropertyValues)) return null;
  const schema = analyticsPropertyValues[event as keyof typeof analyticsPropertyValues] as unknown as Record<string, readonly unknown[]>;
  const expectedKeys = Object.keys(schema);
  if (Object.keys(record).length !== expectedKeys.length) return null;
  for (const key of expectedKeys) {
    if (!schema[key].includes(record[key])) return null;
  }
  return record as unknown as AnalyticsProperties<Event>;
}
