import { destinationSchema } from "@/lib/content/schemas";
import type { Destination } from "@/lib/content/types";

const records = [
  { key: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@thelioncompanytx", purpose: "Daily live teaching and discipleship", kind: "social", required: true, visible: true, verifiedAt: "2026-07-11" },
  { key: "youtube", label: "YouTube", href: "https://www.youtube.com/@TheLionCompany", purpose: "Long-form teaching archive", kind: "social", required: true, visible: true, verifiedAt: "2026-07-11" },
  { key: "applePodcasts", label: "Apple Podcasts", href: "https://podcasts.apple.com/us/podcast/the-lion-company-podcast/id1783214612", purpose: "Listen on Apple Podcasts", kind: "podcast", required: true, visible: true, verifiedAt: "2026-07-11" },
  { key: "spotify", label: "Spotify", href: "https://open.spotify.com/show/2zvyq6wVX8sAf7qXd9KQg5", purpose: "Listen on Spotify", kind: "podcast", required: true, visible: true, verifiedAt: "2026-07-11" },
  { key: "podbean", label: "Podbean", href: "https://thelioncompany.podbean.com", purpose: "Podcast home and episode source", kind: "podcast", required: true, visible: true, verifiedAt: "2026-07-11" },
  { key: "podcastRss", label: "Podcast RSS", href: "https://feed.podbean.com/thelioncompany/feed.xml", purpose: "Subscribe with an RSS reader", kind: "feed", required: true, visible: true, verifiedAt: "2026-07-11" },
  { key: "instagram", label: "Instagram", href: "https://www.instagram.com/thelioncompanyglobal/", purpose: "Visual ministry updates", kind: "social", required: false, visible: true, verifiedAt: "2026-07-11" },
  { key: "facebook", label: "Facebook", href: "https://www.facebook.com/lioncompanytx", purpose: "Community and updates", kind: "social", required: false, visible: true, verifiedAt: "2026-07-11" },
  { key: "threads", label: "Threads", href: "https://www.threads.com/@thelioncompanyglobal/", purpose: "Short-form conversation", kind: "social", required: false, visible: true, verifiedAt: "2026-07-11" },
  { key: "x", label: "X", href: "https://x.com/lioncompanyusa", purpose: "Short-form conversation", kind: "social", required: false, visible: true, verifiedAt: "2026-07-11" },
  { key: "printify", label: "The Lion Company Store", href: "https://the-lion-company.printify.me/", purpose: "View the complete merchandise catalog", kind: "commerce", required: true, visible: true, verifiedAt: "2026-07-11" },
  { key: "subsplash", label: "Give through Subsplash", href: "https://secure.subsplash.com/ui/access/RM87PQ/", purpose: "Support the ministry", kind: "giving", required: true, visible: true, verifiedAt: "2026-07-11" },
] as const;

export const destinationRegistry: readonly Destination[] = records.map((record) => destinationSchema.parse(record));
const identityKeys = new Set(["tiktok", "youtube", "applePodcasts", "spotify", "podbean", "instagram", "facebook", "threads", "x"]);
export const activeSameAs = destinationRegistry
  .filter((record) => record.visible && identityKeys.has(record.key))
  .map((record) => record.href);
