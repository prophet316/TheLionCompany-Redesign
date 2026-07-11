import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { TeachingCard } from "@/components/server/teaching-card";
import { teachings } from "@/content/teachings";
import { getDestination } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";

const description = "Explore The Lion Company's crawlable teaching archive by relationships, purpose, prayer, trust, church reform, and courageous truth.";
export const metadata = createPageMetadata({ title: "Teachings", description, path: "/teachings" });
export default function TeachingsPage() { return <><JsonLd id="teachings-schema" data={[webPageSchema({ path: "/teachings", title: "Teachings", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Teachings", path: "/teachings" }])]} /><PageIntro eyebrow="What are you carrying today?" title="A teaching path for the life in front of you."><p>Browse 32 verified archive entries here, or continue to the channel for hundreds of public teachings and Shorts.</p><a href={getDestination("youtube").href}>Explore hundreds of teachings on YouTube</a></PageIntro><section className="section shell" aria-label="Teaching library">{teachings.map((teaching) => <TeachingCard key={teaching.slug} teaching={teaching} />)}</section></>; }
