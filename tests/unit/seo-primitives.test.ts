import { teachings } from "@/content/teachings";
import { activeSameAs } from "@/content/destinations";
import { canonicalUrl, createPageMetadata } from "@/lib/seo/metadata";
import { organizationSchema, videoSchema } from "@/lib/seo/schema";
import { describe, expect, it } from "vitest";

describe("SEO primitives", () => {
  it("creates a clean www canonical and absolute social image", () => {
    const metadata = createPageMetadata({
      title: "Start here",
      description: "Meet The Lion Company and understand its mission, practices, and Jesus-centered call to relationship.",
      path: "/start-here?utm_source=test",
    });
    expect(canonicalUrl("/start-here?utm_source=test")).toBe("https://www.thelioncompany.org/start-here");
    expect(metadata.alternates?.canonical).toBe("https://www.thelioncompany.org/start-here");
    expect(metadata.openGraph?.images).toEqual(expect.arrayContaining([expect.objectContaining({ width: 1200, height: 630 })]));
  });

  it("uses only centralized active profiles for Organization sameAs", () => {
    expect(organizationSchema().sameAs).toEqual(activeSameAs);
  });

  it("omits VideoObject until visible accessibility evidence exists", () => {
    expect(videoSchema(teachings[0])).toBeNull();
  });
});
