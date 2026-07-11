import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { liveSchedule, recentReplay } from "@/content/live";
import { getDestination } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";

const description = "Find The Lion Company's daily TikTok teaching and the honest current or next live state when a schedule has been verified.";
export const metadata = createPageMetadata({ title: "Daily live teaching", description, path: "/live" });

export default function LivePage() {
  const tiktok = getDestination("tiktok");
  return <><JsonLd id="live-schema" data={[webPageSchema({ path: "/live", title: "Daily live teaching", description }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Live", path: "/live" }])]} /><PageIntro eyebrow="Daily discipleship" title="Live daily on TikTok"><p>The ministry has not published a verified exact time for today, so this page will not invent a countdown or claim to be live.</p><a className="button" href={tiktok.href}>See today&apos;s live on TikTok</a></PageIntro><section className="section shell" aria-live="polite"><h2>Current schedule</h2>{liveSchedule ? <p>A verified schedule record is available and the client status island will derive its display state from that record.</p> : <p>Follow the verified TikTok profile for the current start time and notification controls.</p>}{recentReplay ? <p><a href={recentReplay.url}>{recentReplay.title}</a></p> : <p>No unexpired replay has been verified for this page.</p>}</section></>;
}
