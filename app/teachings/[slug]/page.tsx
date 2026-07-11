import Link from "next/link";
import { notFound } from "next/navigation";
import { VideoFacade } from "@/components/client/video-facade";
import { JsonLd } from "@/components/server/json-ld";
import { TeachingCard } from "@/components/server/teaching-card";
import { teachings } from "@/content/teachings";
import { getTeachingBySlug, getTeachingSlugs, getTopicBySlug } from "@/lib/content";
import { getTeachingReviewBundle } from "@/lib/media/transcripts.server";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, videoSchema, webPageSchema } from "@/lib/seo/schema";

export const dynamicParams = false;
export function generateStaticParams() {
  return getTeachingSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const teaching = getTeachingBySlug((await params).slug);
  if (!teaching) return {};
  return createPageMetadata({
    title: teaching.title,
    description: teaching.summary,
    path: "/teachings/" + teaching.slug,
  });
}

export default async function TeachingDetail({ params }: { params: Promise<{ slug: string }> }) {
  const baseTeaching = getTeachingBySlug((await params).slug);
  if (!baseTeaching) notFound();
  const reviewed = getTeachingReviewBundle(baseTeaching);
  const teaching = reviewed.teaching;
  const related = teachings
    .filter((item) => item.slug !== teaching.slug && item.topics.some((topic) => teaching.topics.includes(topic)))
    .slice(0, 3);
  const video = videoSchema(teaching);
  return (
    <>
      <JsonLd id="teaching-schema" data={[webPageSchema({ path: "/teachings/" + teaching.slug, title: teaching.title, description: teaching.summary }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Teachings", path: "/teachings" }, { name: teaching.title, path: "/teachings/" + teaching.slug }]), ...(video ? [video] : [])]} />
      <article className="container section">
        <p>Teaching</p>
        <h1>{teaching.title}</h1>
        <p>{teaching.summary}</p>
        <nav aria-label="Teaching topics">
          {teaching.topics.map((topic) => <Link href={"/teachings?topic=" + topic} key={topic}>{getTopicBySlug(topic).label}</Link>)}
        </nav>
        <VideoFacade teaching={teaching} placement="teaching-detail" />
        {reviewed.transcript ? (
          <section id="transcript" aria-labelledby="transcript-title">
            <h2 id="transcript-title">Complete transcript</h2>
            {reviewed.transcript.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </section>
        ) : null}
        <section aria-labelledby="related-teachings">
          <h2 id="related-teachings">Continue exploring</h2>
          {related.map((item) => <TeachingCard teaching={item} key={item.slug} />)}
        </section>
      </article>
    </>
  );
}
