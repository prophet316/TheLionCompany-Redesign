import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { getDestination } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";

const description = "Support The Lion Company's ministry through its existing secure Subsplash giving destination.";
export const metadata = createPageMetadata({ title: "Give", description, path: "/give" });
export default function GivePage() { const giving = getDestination("subsplash"); return <><JsonLd id="give-schema" data={[webPageSchema({ path: "/give", title: "Give", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Give", path: "/give" }])]} /><PageIntro eyebrow="Support the mission" title="Help make room for teaching, prayer, and connection."><p>Giving continues through the ministry&apos;s existing secure Subsplash page. The website does not replace that provider or make an allocation promise it cannot verify.</p><a className="button" href={giving.href}>Continue to secure giving</a></PageIntro></>; }
