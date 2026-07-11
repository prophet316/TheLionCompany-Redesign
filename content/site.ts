import type { SiteContent } from "@/lib/content/types";

export const siteContent = {
  name: "The Lion Company",
  shortName: "Lion Company",
  canonicalOrigin: "https://www.thelioncompany.org",
  locale: "en_US",
  homeTitle: "The Lion Company — Unity Through Christ",
  homeDescription: "The Lion Company is a ministry pursuing Christian unity, authentic discipleship, church reform, and relationship centered on Jesus.",
  location: "Texas-based, serving globally",
  foundationalQuote: "Whatever doesn't cause you to look like Jesus isn't of Jesus.",
  missionHeading: "Bringing unity among Christians worldwide",
  missionStatement: "We invite people beyond passive consumption into love, relationship, discipleship, and education centered on Jesus himself.",
  story: "The public work grew from a conviction repeated throughout The Lion Company’s existing ministry: Christians are called to look like Jesus together. That conviction now takes visible form through daily live teaching, a public teaching archive, honest long-form conversations, private prayer, discipleship resources, and invitations to relationship rather than passive viewing.",
  navigation: [
    { label: "Start here", href: "/start-here" },
    { label: "Live", href: "/live" },
    { label: "Teachings", href: "/teachings" },
    { label: "Podcast", href: "/podcast" },
    { label: "Prayer", href: "/prayer" },
    { label: "Connect", href: "/connect" },
  ],
  pillars: [
    { title: "Love", body: "Let love for Jesus shape how we see and serve one another." },
    { title: "Relationship", body: "Choose honest connection over performance, distance, and isolation." },
    { title: "Discipleship", body: "Become more like Jesus through practiced truth, courage, and community." },
    { title: "Education", body: "Learn with humility, test what we inherit, and carry wisdom into daily life." },
  ],
} as const satisfies SiteContent;
