export type LegacyRoute =
  | { kind: "redirect"; source: string; destination: string; statusCode: 308; caseBehavior: "exact" | "recorded-variant"; preserveQuery: true; evidence: string; verifiedAt: string }
  | { kind: "gone"; source: string; statusCode: 410; caseBehavior: "exact"; preserveQuery: false; evidence: string; verifiedAt: string };

const redirect = (source: string, destination: string, caseBehavior: "exact" | "recorded-variant" = "exact"): LegacyRoute => ({
  kind: "redirect", source, destination, statusCode: 308, caseBehavior, preserveQuery: true,
  evidence: "verified production source and approved redesign specification", verifiedAt: "2026-07-11",
});
const gone = (source: string): LegacyRoute => ({
  kind: "gone", source, statusCode: 410, caseBehavior: "exact", preserveQuery: false,
  evidence: "public source or scraper artifact with no user-facing successor", verifiedAt: "2026-07-11",
});

export const legacyRouteLedger = [
  redirect("/index.html", "/"),
  redirect("/index.htm", "/"),
  redirect("/INDEX.HTML", "/", "recorded-variant"),
  redirect("/INDEX.HTM", "/", "recorded-variant"),
  redirect("/media.html", "/teachings"),
  redirect("/media", "/teachings"),
  redirect("/Media.html", "/teachings", "recorded-variant"),
  redirect("/MEDIA.HTML", "/teachings", "recorded-variant"),
  redirect("/Media", "/teachings", "recorded-variant"),
  redirect("/MEDIA", "/teachings", "recorded-variant"),
  redirect("/product-page/the-lion-company-t-shirt", "/store"),
  gone("/p1.html"),
  gone("/p2.html"),
  gone("/p3.html"),
  gone("/playlists_grid.html"),
  gone("/all_playlists.txt"),
  gone("/feed.xml"),
  gone("/generate_html.py"),
  gone("/get_yt.py"),
  gone("/parse_playlists.py"),
  gone("/parse_yt.py"),
  gone("/app.js"),
  gone("/styles.css"),
  gone("/lion_bg.jpg"),
  gone("/apparel_bg.jpg"),
] as const satisfies readonly LegacyRoute[];
