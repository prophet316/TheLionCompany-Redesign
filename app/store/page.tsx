import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { getDestination } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";

const description = "Explore The Lion Company merchandise and continue to the ministry's complete Printify catalog.";
export const metadata = createPageMetadata({ title: "Store", description, path: "/store" });
export default function StorePage() { const store = getDestination("printify"); return <><JsonLd id="store-schema" data={[webPageSchema({ path: "/store", title: "Store", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Store", path: "/store" }])]} /><PageIntro eyebrow="Wear the vision" title="Objects that carry the conversation."><p>Merchandise is presented in its approved context. Purchases support the ministry without an unverified allocation claim.</p><a className="button" href={store.href}>View the complete Printify catalog</a></PageIntro></>; }
