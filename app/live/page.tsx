import { LiveStatus } from "@/components/client/live-status";
import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { liveSchedule, recentReplay } from "@/content/live";
import { activeReplayAt } from "@/lib/live/status";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";

const description = "Find the current verified TikTok teaching state, recent replay, and an honest daily-live fallback.";

export const metadata = createPageMetadata({ title: "Daily live teaching", description, path: "/live" });

export default function LivePage() {
  const buildActiveReplay = activeReplayAt(recentReplay);
  return (
    <>
      <JsonLd
        id="live-schema"
        data={[
          webPageSchema({ path: "/live", title: "Daily live teaching", description }),
          breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Live", path: "/live" }]),
        ]}
      />
      <PageIntro
        eyebrow="Daily discipleship"
        title="Live daily on TikTok"
        description="The page begins with the evergreen truth and upgrades only from a validated schedule record."
      />
      <section className="section shell" aria-labelledby="live-status-title">
        <h2 id="live-status-title">Today’s verified state</h2>
        <LiveStatus schedule={liveSchedule} replay={buildActiveReplay} placement="live-page" />
      </section>
      <section className="section shell" aria-labelledby="live-reminder-title">
        <h2 id="live-reminder-title">Get a reminder from TikTok</h2>
        <p>This site does not send live-alert notifications. Follow <a href="https://www.tiktok.com/@thelioncompanytx">@thelioncompanytx on TikTok</a>, then use TikTok’s Following settings to enable LIVE notifications. TikTok controls delivery and may change the exact setting label.</p>
      </section>
    </>
  );
}
