import Link from "next/link";
import { JsonLd } from "@/components/server/json-ld";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import { accessibilitySections, legalEffectiveDate } from "../../content/legal";

const description = "The Lion Company's accessibility commitment and feedback path.";
export const metadata = createPageMetadata({ title: "Accessibility", description, path: "/accessibility" });

export default function AccessibilityPage() {
  return <><JsonLd id="accessibility-schema" data={[webPageSchema({ path: "/accessibility", title: "Accessibility", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Accessibility", path: "/accessibility" }])]} /><article className="section shell"><h1>Accessibility</h1><p>Reviewed {legalEffectiveDate}</p>{accessibilitySections.map(([heading, paragraph]) => <section key={heading}><h2>{heading}</h2><p>{paragraph}</p></section>)}<Link href="/connect">Report an accessibility barrier</Link></article></>;
}
