import Link from "next/link";
import { destinationRegistry } from "@/content/destinations";
import { siteContent } from "@/content/site";

export function SiteFooter() {
  const publicDestinations = destinationRegistry.filter((item) => item.visible && item.kind !== "feed");
  return (
    <footer className="section">
      <div className="shell">
        <p className="eyebrow">{siteContent.location}</p>
        <p>{siteContent.missionStatement}</p>
        <nav aria-label="External channels"><ul>{publicDestinations.map((item) => <li key={item.key}><a href={item.href} rel="noreferrer">{item.label}: {item.purpose}</a></li>)}</ul></nav>
        <nav aria-label="Policies"><ul className="cluster"><li><Link href="/privacy">Privacy</Link></li><li><Link href="/terms">Terms</Link></li><li><Link href="/accessibility">Accessibility</Link></li><li><Link href="/connect">Contact</Link></li></ul></nav>
      </div>
    </footer>
  );
}
