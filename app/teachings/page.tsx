import { TeachingLibrary } from "@/components/client/teaching-library";
import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { teachings } from "@/content/teachings";
import { topicDefinitions } from "@/content/topics";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";

const description = "Search practical, Jesus-centered teachings for faith, relationships, purpose, unity, and courage.";

export const metadata = createPageMetadata({
  title: "Teachings",
  description,
  path: "/teachings",
});

export default function TeachingsPage() {
  return (
    <>
      <JsonLd id="teachings-schema" data={[webPageSchema({ path: "/teachings", title: "Teachings", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Teachings", path: "/teachings" }])]} />
      <PageIntro eyebrow="The living archive" title="Teaching for what you are carrying." description="Search the archive or begin with the question closest to your life today." />
      <TeachingLibrary teachings={teachings} topics={topicDefinitions} />
    </>
  );
}
