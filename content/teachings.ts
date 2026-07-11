import { teachingSchema } from "@/lib/content/schemas";
import type { Teaching, TopicSlug } from "@/lib/content/types";

type TeachingSeed = {
  slug: string;
  title: string;
  youtubeId: string;
  topics: readonly TopicSlug[];
  series?: string;
  featured?: boolean;
};

const seeds: readonly TeachingSeed[] = [
  { slug: "when-gods-will-doesnt-go-your-way", title: "When God's Will Doesn't Go Your Way", youtubeId: "TOj6tefx3rI", topics: ["fear-and-trust", "prayer-and-spiritual-growth"], series: "The Lion Company Podcast", featured: true },
  { slug: "confessions-of-a-truth-teller", title: "Confessions of a Truth Teller", youtubeId: "x8s5DPF68kQ", topics: ["truth-conflict-and-courage", "relationships-and-family"], series: "The Lion Company Podcast", featured: true },
  { slug: "miracle-or-madness", title: "Miracle or Madness?", youtubeId: "Z0AtNFd13-A", topics: ["prayer-and-spiritual-growth", "fear-and-trust"], series: "The Lion Company Podcast" },
  { slug: "unlocking-the-dream-realm", title: "Unlocking the Dream Realm: What's Really Possible?", youtubeId: "gfzoFvDlWTc", topics: ["purpose-and-calling", "prayer-and-spiritual-growth"], featured: true },
  { slug: "heart-over-hammer", title: "Heart over Hammer", youtubeId: "zP4ZiKek3Lg", topics: ["relationships-and-family", "truth-conflict-and-courage"] },
  { slug: "fathers-of-faith-volume-four", title: "Fathers of Faith Vol. 4", youtubeId: "M1tQvPOg3vk", topics: ["relationships-and-family", "church-reform-and-unity"], series: "Fathers of Faith" },
  { slug: "mothers", title: "Mothers", youtubeId: "p3UUJ5f6kEM", topics: ["relationships-and-family"] },
  { slug: "family-equals-reform", title: "Family = Reform", youtubeId: "L2HBzHQYrt8", topics: ["relationships-and-family", "church-reform-and-unity"] },
  { slug: "jesus-stories-episode-one", title: "Jesus Stories Ep. 1", youtubeId: "goD2b5TgBtE", topics: ["prayer-and-spiritual-growth"], series: "Jesus Stories" },
  { slug: "gideon-gods-agenda-part-one", title: "Gideon: God's Agenda Part 1", youtubeId: "tWKxz7YrnA0", topics: ["purpose-and-calling", "fear-and-trust"], series: "Gideon: God's Agenda" },
  { slug: "gideon-gods-agenda-part-two", title: "Gideon: God's Agenda Part 2", youtubeId: "0jeOgbfl1vk", topics: ["purpose-and-calling", "fear-and-trust"], series: "Gideon: God's Agenda" },
  { slug: "gideon-gods-agenda-part-three", title: "Gideon: God's Agenda Part 3", youtubeId: "njO21uBJxMM", topics: ["purpose-and-calling", "fear-and-trust"], series: "Gideon: God's Agenda" },
  { slug: "gideon-gods-agenda-part-four", title: "Gideon: God's Agenda Part 4", youtubeId: "CaV9NyMAfMY", topics: ["purpose-and-calling", "fear-and-trust"], series: "Gideon: God's Agenda" },
  { slug: "gideon-gods-agenda-part-five", title: "Gideon: God's Agenda Part 5", youtubeId: "ru7dI3HSKIQ", topics: ["purpose-and-calling", "fear-and-trust"], series: "Gideon: God's Agenda" },
  { slug: "context-perspective-and-revival", title: "Context, Perspective & Revival", youtubeId: "lPRvDRofqkQ", topics: ["church-reform-and-unity", "prayer-and-spiritual-growth"] },
  { slug: "obedience-and-sacrifice", title: "Obedience & Sacrifice", youtubeId: "H3k4iw_6fj0", topics: ["prayer-and-spiritual-growth", "purpose-and-calling"] },
  { slug: "significance", title: "Significance", youtubeId: "x2pT7uYkvlA", topics: ["purpose-and-calling"] },
  { slug: "the-blame-game", title: "The Blame Game", youtubeId: "s8FewMKaHSM", topics: ["truth-conflict-and-courage", "relationships-and-family"] },
  { slug: "jesus-and-memory-maps", title: "Jesus & Memory Maps", youtubeId: "PWU_VB0qfUU", topics: ["fear-and-trust", "prayer-and-spiritual-growth"] },
  { slug: "loving-jesus-loving-people", title: "Loving Jesus, Loving People", youtubeId: "jb0JRyF07Yk", topics: ["relationships-and-family", "church-reform-and-unity"] },
  { slug: "jesus-and-the-thirteenth-disciple", title: "Jesus & the 13th Disciple", youtubeId: "PxlLRWjycZg", topics: ["church-reform-and-unity", "prayer-and-spiritual-growth"] },
  { slug: "prophets-corner-episode-one", title: "Prophet's Corner Ep. 1", youtubeId: "kD28pst1hpU", topics: ["purpose-and-calling", "prayer-and-spiritual-growth"], series: "Prophet's Corner" },
  { slug: "cry-holy", title: "Cry Holy", youtubeId: "Nl6JIlKUbQE", topics: ["prayer-and-spiritual-growth"] },
  { slug: "behold", title: "Behold", youtubeId: "xiLXewFUWAM", topics: ["prayer-and-spiritual-growth"] },
  { slug: "revival-police", title: "Revival Police", youtubeId: "C8alBDDqBNw", topics: ["church-reform-and-unity", "truth-conflict-and-courage"] },
  { slug: "heart-over-hand", title: "Heart over Hand", youtubeId: "OiGtroG7uHE", topics: ["relationships-and-family", "truth-conflict-and-courage"] },
  { slug: "heart", title: "Heart", youtubeId: "yeAIXEAdvTU", topics: ["relationships-and-family", "prayer-and-spiritual-growth"] },
  { slug: "overcoming-the-past-redefining-success", title: "Overcoming the Past, Redefining Success, and Finding God's Purpose", youtubeId: "OfyCpxqYamE", topics: ["fear-and-trust", "purpose-and-calling"], series: "The Lion Company Podcast" },
  { slug: "relationships-part-one", title: "Relationships: Part 1", youtubeId: "ml1tCKumJNw", topics: ["relationships-and-family"], series: "Relationships" },
  { slug: "relationships-part-two", title: "Relationships: Part 2", youtubeId: "lAn92FsttOM", topics: ["relationships-and-family"], series: "Relationships" },
  { slug: "relationships-part-three", title: "Relationships: Part 3", youtubeId: "P7FnRJ0lq2E", topics: ["relationships-and-family"], series: "Relationships" },
  { slug: "relationships-part-four", title: "Relationships: Part 4", youtubeId: "QhzS_keuuT4", topics: ["relationships-and-family"], series: "Relationships" },
];

export const teachings: readonly Teaching[] = seeds.map((seed) => teachingSchema.parse({
  ...seed,
  posterPath: `/images/teachings/${seed.slug}.jpg`,
  summary: `Explore “${seed.title},” a verified archive entry from The Lion Company connected to ${seed.topics.join(" and ").replaceAll("-", " ")}.`,
  publishedAt: null,
  series: seed.series ?? null,
  captionsVerified: false,
  transcriptUrl: null,
  featured: seed.featured ?? false,
}));
