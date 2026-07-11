import Image from "next/image";
import { TrackedLink } from "@/components/client/tracked-link";
import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { getDestination } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import styles from "../participation.module.css";

const description = "Wear The Lion Company vision and continue to the verified Printify catalog.";

export const metadata = createPageMetadata({
  title: "Store",
  description,
  path: "/store",
});

export default function StorePage() {
  const store = getDestination("printify");
  return (
    <>
      <JsonLd id="store-schema" data={[webPageSchema({ path: "/store", title: "Store", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Store", path: "/store" }])]} />
      <PageIntro eyebrow="Wear the vision" title="A visible reminder of unity." description="Merchandise rooted in the ministry’s lion identity and the call to look like Jesus together." />
      <section className={styles.storeStory} aria-labelledby="store-story">
        <Image src="/images/merch/apparel-collage.jpg" alt="A selection of The Lion Company apparel from the official collection" width={1024} height={559} sizes="(max-width: 768px) 100vw, 55vw" priority />
        <div><p>Official collection</p><h2 id="store-story">Carry the conversation into ordinary places.</h2><p>Purchases support the ministry’s work without making a claim about a fixed allocation. Printify operates the catalog, checkout, fulfillment, and customer service journey.</p>
          <TrackedLink href={store.href} eventName="store_click" eventProperties={{ placement: "store-page" }}>Open the complete Printify catalog</TrackedLink>
        </div>
      </section>
    </>
  );
}
