import Link from "next/link";
import { siteContent } from "@/content/site";
import { getDestination } from "@/lib/content";

export function SiteHeader() {
  return (
    <header>
      <div className="shell cluster">
        <Link href="/" aria-label="The Lion Company home">The Lion Company</Link>
        <nav aria-label="Primary navigation">
          <ul className="cluster">
            {siteContent.navigation.map((item) => <li key={item.href}><Link href={item.href}>{item.label}</Link></li>)}
          </ul>
        </nav>
        <a className="button" href={getDestination("subsplash").href} rel="noreferrer">Give</a>
      </div>
    </header>
  );
}
