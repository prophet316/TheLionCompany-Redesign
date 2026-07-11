import Link from "next/link";
import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { siteContent } from "@/content/site";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";

const description = "Meet The Lion Company and understand its Jesus-centered mission, practices, public teaching, and call to relationship.";
export const metadata = createPageMetadata({ title: "Start here", description, path: "/start-here" });

export default function StartHerePage() {
  return (
    <>
      <JsonLd id="start-here-schema" data={[webPageSchema({ path: "/start-here", title: "Start here", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Start here", path: "/start-here" }])]} />
      <PageIntro eyebrow="The gathering" title="A ministry centered on becoming like Jesus."><p>{siteContent.missionStatement}</p></PageIntro>
      <section className="section shell" aria-labelledby="story-title"><h2 id="story-title">How this work took shape</h2><p>{siteContent.story}</p><p>This first release does not invent a founding date, founder biography, or private milestone history. Those details are added only when an owner-approved source is recorded with the content evidence.</p></section>
      <section className="section shell" aria-labelledby="practices-title"><h2 id="practices-title">Love. Relationship. Discipleship. Education.</h2>{siteContent.pillars.map((pillar) => <article key={pillar.title}><h3>{pillar.title}</h3><p>{pillar.body}</p></article>)}</section>
      <section className="section shell" aria-labelledby="leadership-title"><h2 id="leadership-title">Leadership and public voices</h2><p>The current production record names Jonathan Gibson as the ministry&apos;s public contact. Jonathan and Gina host public Lion Company podcast conversations. No board role, staff title, biography, or governance claim is published until the owner supplies an authoritative source and approves the exact copy.</p><div className="cluster"><Link href="/podcast">Hear the public conversations</Link><Link href="/connect">Contact the ministry</Link></div></section>
      <section className="section shell" aria-labelledby="transparency-title"><h2 id="transparency-title">How the ministry is supported and held accountable</h2><p>The Lion Company is {siteContent.location.toLowerCase()} and is sustained by voluntary givers. Giving is optional, teaching and prayer remain available without pressure, and Subsplash handles payment and receipt details outside this website.</p><p>The public teaching archive lets visitors examine ministry content directly. The privacy policy names processors, retention, and data rights; the terms explain use of the site. Legal and tax-status details are published only after an authorized reviewer records the legal name and current authoritative verification source. No EIN, board list, allocation percentage, or financial claim is guessed.</p><div className="cluster"><Link href="/teachings">Examine public teachings</Link><Link href="/privacy">Read the privacy policy</Link><Link href="/terms">Read the terms</Link><Link href="/give">Learn about voluntary giving</Link><Link href="/connect">Request organizational information</Link></div></section>
    </>
  );
}
