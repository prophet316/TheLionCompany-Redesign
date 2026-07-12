import type { TopicDefinition } from "@/lib/content/types";

export const topicDefinitions = [
  { slug: "fear-and-trust", label: "Fear and trust", prompt: "When fear is shaping the next step", description: "Teachings about trust, hope, obedience, and moving beyond the past." },
  { slug: "purpose-and-calling", label: "Purpose and calling", prompt: "When purpose feels difficult to name", description: "Teachings about significance, calling, dreams, and faithful action." },
  { slug: "relationships-and-family", label: "Relationships and family", prompt: "When connection needs care", description: "Teachings about family, friendship, boundaries, love, and reconciliation." },
  { slug: "prayer-and-spiritual-growth", label: "Prayer and spiritual growth", prompt: "When you want to grow closer to Jesus", description: "Teachings about prayer, holiness, revival, obedience, and formation." },
  { slug: "church-reform-and-unity", label: "Church reform and unity", prompt: "When the church needs honest renewal", description: "Teachings about unity, reform, discipleship, and the life of the church." },
  { slug: "truth-conflict-and-courage", label: "Truth, conflict, and courage", prompt: "When truth carries a cost", description: "Teachings about honesty, blame, conflict, courage, and speaking truth in love." },
] as const satisfies readonly TopicDefinition[];
