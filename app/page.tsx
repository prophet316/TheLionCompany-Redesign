import Link from "next/link";
import { JsonLd } from "@/components/server/json-ld";
import { podcastFallback } from "@/content/podcast-fallback";
import { siteContent } from "@/content/site";
import { teachings } from "@/content/teachings";
import { getDestination } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo/metadata";
import { organizationSchema, webPageSchema, websiteSchema } from "@/lib/seo/schema";

export const metadata = createPageMetadata({ title: siteContent.homeTitle, description: siteContent.homeDescription, path: "/" });

export default function HomePage() {
  const featured = teachings.filter((item) => item.featured);
  const latestPodcast = podcastFallback[0];
  return (
    <>
      <JsonLd id="home-identity" data={[organizationSchema(), websiteSchema(), webPageSchema({ path: "/", title: siteContent.homeTitle, description: siteContent.homeDescription })]} />
      <section className="section shell" aria-labelledby="home-title">
        <p className="eyebrow">Seen → Gathered → Formed → Sent</p>
        <h1 id="home-title">{siteContent.foundationalQuote}</h1>
        <p>Many lives. One center: Jesus. Come participate, not merely consume.</p>
        <div className="cluster"><a className="button" href={getDestination("tiktok").href}>Join today&apos;s live</a><Link className="button" data-variant="quiet" href="/start-here">Start here</Link></div>
      </section>

      <section className="section shell" aria-labelledby="participate-title">
        <p className="eyebrow">A place to participate</p><h2 id="participate-title">Bring your whole life toward Jesus.</h2>
        <ul><li><Link href="/teachings">Watch a teaching</Link></li><li><Link href="/prayer">Ask for prayer</Link></li><li><Link href="/start-here">Grow in relationship</Link></li><li><Link href="/give">Support the mission</Link></li></ul>
      </section>

      <section id="mission" className="section shell" aria-labelledby="mission-title">
        <p className="eyebrow">Gathered around Jesus</p><h2 id="mission-title">{siteContent.missionHeading}</h2><p>{siteContent.missionStatement}</p>
        {siteContent.pillars.map((pillar) => <article key={pillar.title}><h3>{pillar.title}</h3><p>{pillar.body}</p></article>)}
        <Link href="/start-here">Read the story and practices</Link>
      </section>

      <section id="podcast" className="section shell" aria-labelledby="podcast-title">
        <p className="eyebrow">Listen</p><h2 id="podcast-title">The Lion Company Podcast</h2><h3>{latestPodcast.title}</h3><p>{latestPodcast.description}</p>
        <div className="cluster"><Link href={`/podcast/${latestPodcast.slug}`}>Read episode notes</Link><Link href="/podcast">Explore every episode</Link></div>
      </section>

      <section id="media" className="section shell" aria-labelledby="media-title">
        <p className="eyebrow">Watch and learn</p><h2 id="media-title">Teachings for what you are carrying</h2>
        {featured.map((teaching) => <article key={teaching.slug}><h3><Link href={`/teachings/${teaching.slug}`}>{teaching.title}</Link></h3><p>{teaching.summary}</p></article>)}
        <div className="cluster"><Link href="/teachings">Browse the teaching library</Link><a href={getDestination("youtube").href}>Explore hundreds of teachings on YouTube</a></div>
      </section>

      <section id="prayer" className="section shell" aria-labelledby="prayer-title">
        <p className="eyebrow">You do not have to carry it alone</p><h2 id="prayer-title">How can we pray with you?</h2><p>Your request can be anonymous. The dedicated prayer page explains who receives it, how it is handled, and how to request follow-up separately.</p><Link href="/prayer">Share a private prayer request</Link>
      </section>

      <section id="store" className="section shell" aria-labelledby="store-title">
        <p className="eyebrow">Wear the vision</p><h2 id="store-title">Carry the conversation into everyday life.</h2><p>Explore real Lion Company merchandise and the complete catalog through the ministry&apos;s Printify store.</p><Link href="/store">Visit the store story</Link>
      </section>

      <section id="contact" className="section shell" aria-labelledby="contact-title">
        <p className="eyebrow">Connection network</p><h2 id="contact-title">Choose the channel that fits the conversation.</h2><p>Find daily live teaching, long-form video, podcast listening, ministry updates, speaking and partnership inquiries, and a general contact path.</p><Link href="/connect">See every way to connect</Link>
      </section>

      <section id="newsletter" className="section shell" aria-labelledby="newsletter-title">
        <p className="eyebrow">Monthly field notes</p><h2 id="newsletter-title">One thoughtful letter each month.</h2><p>Receive one monthly teaching, the current live schedule, new resources and podcast releases, ministry updates, and occasional store or support news.</p><Link href="/connect#newsletter">Join with double opt-in</Link>
      </section>

      <section className="section shell" aria-labelledby="final-title">
        <h2 id="final-title">What is your next faithful step?</h2><div className="cluster"><Link href="/teachings">Begin with a teaching</Link><Link href="/prayer">Submit a prayer request</Link><Link href="/connect#newsletter">Join the monthly letter</Link><Link href="/give">Support the mission</Link></div>
      </section>
    </>
  );
}
