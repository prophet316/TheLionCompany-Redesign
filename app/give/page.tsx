import { TrackedLink } from "@/components/client/tracked-link";
import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { getDestination } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import styles from "../participation.module.css";

const description = "Give to sustain The Lion Company's teaching, prayer, discipleship, and Christian-unity work through its verified Subsplash destination.";

export const metadata = createPageMetadata({
  title: "Give",
  description,
  path: "/give",
});

export default function GivePage() {
  const giving = getDestination("subsplash");
  return (
    <>
      <JsonLd id="give-schema" data={[webPageSchema({ path: "/give", title: "Give", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Give", path: "/give" }])]} />
      <PageIntro eyebrow="Give" title="Help carry the work forward." description="The Lion Company’s ministry work is sustained by voluntary givers who choose to support teaching, prayer, discipleship, and Christian unity.">
        <TrackedLink className={styles.givePrimary} href={giving.href} eventName="give_click" eventProperties={{ target: "subsplash", placement: "give-page-primary" }}>Give securely through Subsplash</TrackedLink>
      </PageIntro>
      <section className={styles.give} aria-labelledby="give-title">
        <div><p>Why giving matters</p><h2 id="give-title">A simple way to sustain the ministry.</h2><p>Voluntary gifts are the ministry’s operating support. Subsplash securely handles the gift, receipt, and payment details; The Lion Company website never receives your card or bank information.</p></div>
        <p>Give when and as you choose. Teaching, prayer, and every other ministry path remain available without pressure.</p>
      </section>
    </>
  );
}
