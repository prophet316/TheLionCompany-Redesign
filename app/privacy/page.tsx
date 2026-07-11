import { JsonLd } from "@/components/server/json-ld";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import { legalEffectiveDate, mailboxProviderDisclosure, privacySections, providerDeletionDisclosures } from "../../content/legal";

const description = "How The Lion Company handles website, prayer, contact, newsletter, and analytics data.";
export const metadata = createPageMetadata({ title: "Privacy", description, path: "/privacy" });

export default function PrivacyPage() {
  const sections = privacySections(mailboxProviderDisclosure(), providerDeletionDisclosures());
  return <><JsonLd id="privacy-schema" data={[webPageSchema({ path: "/privacy", title: "Privacy", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Privacy", path: "/privacy" }])]} /><article className="section shell"><h1>Privacy</h1><p>Effective {legalEffectiveDate}</p>{sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}</article></>;
}
