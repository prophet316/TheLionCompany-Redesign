import { PrayerForm } from "@/components/client/forms/prayer-form";
import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";

const description = "Share a private prayer request with The Lion Company's restricted ministry response team.";

export const metadata = createPageMetadata({
  title: "Prayer",
  description,
  path: "/prayer",
});

export default function PrayerPage() {
  return (
    <>
      <JsonLd id="prayer-schema" data={[webPageSchema({ path: "/prayer", title: "Prayer", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Prayer", path: "/prayer" }])]} />
      <PageIntro
        eyebrow="Prayer"
        title="You do not have to carry this alone."
        description="Share only what you choose. You may remain anonymous, and follow-up is always optional."
      />
      <section className="section shell" aria-labelledby="prayer-form-title">
        <h2 id="prayer-form-title">Send a private prayer request</h2>
        <p>Your request goes to a restricted ministry mailbox and is handled under the published retention schedule.</p>
        <PrayerForm placement="prayer" />
      </section>
    </>
  );
}
