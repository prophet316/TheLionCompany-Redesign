import type { Metadata } from "next";
import { siteContent } from "@/content/site";

export function canonicalUrl(path: string) {
  const url = new URL(path, siteContent.canonicalOrigin);
  url.search = "";
  url.hash = "";
  if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/$/, "");
  return url.toString();
}

export function createPageMetadata(input: {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const canonical = canonicalUrl(input.path);
  const socialTitle = input.title === siteContent.homeTitle ? input.title : `${input.title} | ${siteContent.name}`;
  const image = canonicalUrl(input.image ?? "/opengraph-image");
  const index = !input.noIndex && process.env.VERCEL_ENV === "production";
  return {
    title: input.title === siteContent.homeTitle ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: { canonical },
    robots: index ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type: "website",
      locale: siteContent.locale,
      siteName: siteContent.name,
      title: socialTitle,
      description: input.description,
      url: canonical,
      images: [{ url: image, width: 1200, height: 630, alt: `${siteContent.name} — The Gathering` }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: input.description,
      images: [image],
    },
  };
}
