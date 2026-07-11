import { JsonLd } from "@/components/server/json-ld";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import { legalEffectiveDate, termsSections } from "../../content/legal";

const description = "Terms for using The Lion Company website and ministry forms.";
export const metadata = createPageMetadata({ title: "Website terms", description, path: "/terms" });

export default function TermsPage() {
  return <><JsonLd id="terms-schema" data={[webPageSchema({ path: "/terms", title: "Website terms", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Terms", path: "/terms" }])]} /><article className="section shell"><h1>Website terms</h1><p>Effective {legalEffectiveDate}</p>{termsSections.map(([heading, paragraph]) => <section key={heading}><h2>{heading}</h2><p>{paragraph}</p></section>)}</article></>;
}
