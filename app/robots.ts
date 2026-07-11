import type { MetadataRoute } from "next";
import { siteContent } from "@/content/site";

export function createRobots(production: boolean): MetadataRoute.Robots {
  if (!production) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/newsletter/"] },
    sitemap: `${siteContent.canonicalOrigin}/sitemap.xml`,
    host: siteContent.canonicalOrigin,
  };
}

export default function robots(): MetadataRoute.Robots {
  return createRobots(process.env.VERCEL_ENV === "production");
}
