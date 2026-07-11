import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/server/json-ld";
import { PageIntro } from "@/components/server/page-intro";
import { getTeachingBySlug, getTeachingSlugs, isTeachingEmbeddable } from "@/lib/content";
import { getTeachingReviewBundle } from "@/lib/media/transcripts.server";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, videoSchema, webPageSchema } from "@/lib/seo/schema";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return getTeachingSlugs().map((slug) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { slug } = await params; const teaching = getTeachingBySlug(slug); if (!teaching) return {}; return createPageMetadata({ title: teaching.title, description: teaching.summary, path: `/teachings/${slug}` }); }

export default async function TeachingDetailPage({ params }: Props) {
  const { slug } = await params; const baseTeaching = getTeachingBySlug(slug); if (!baseTeaching) notFound();
  const reviewed = getTeachingReviewBundle(baseTeaching); const teaching = reviewed.teaching;
  const video = videoSchema(teaching);
  return <><JsonLd id="teaching-schema" data={[webPageSchema({ path: `/teachings/${slug}`, title: teaching.title, description: teaching.summary }), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Teachings", path: "/teachings" }, { name: teaching.title, path: `/teachings/${slug}` }]), ...(video ? [video] : [])]} /><PageIntro eyebrow={teaching.series ?? "Teaching"} title={teaching.title}><p>{teaching.summary}</p></PageIntro><section className="section shell"><h2>Watch and continue</h2>{isTeachingEmbeddable(teaching) ? <p>Captions and a complete transcript are verified for this teaching.</p> : <p>This archive record does not yet have verified captions and a complete transcript path, so the site does not load an embedded player.</p>}<div className="cluster"><a className="button" href={`https://www.youtube.com/watch?v=${teaching.youtubeId}`}>Watch directly on YouTube</a><Link href="/teachings">Back to all teachings</Link></div></section>{reviewed.transcript ? <section className="section shell" id="transcript" aria-labelledby="transcript-title"><h2 id="transcript-title">Complete transcript</h2>{reviewed.transcript.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</section> : null}</>;
}
