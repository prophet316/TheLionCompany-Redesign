import Image from "next/image";
import { LiveStatus } from "@/components/client/live-status";
import { ActionLink } from "@/components/ui/action-link";
import type { LiveSchedule, RecentReplay } from "@/lib/content/types";
import styles from "./home.module.css";

export function Hero({ schedule, replay }: { readonly schedule: LiveSchedule | null; readonly replay: RecentReplay | null }) {
  return (
    <section className={styles.hero} aria-labelledby="home-title" data-gathering-stage="mane">
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}>Unity through Christ</p>
        <h1 id="home-title">&ldquo;Whatever doesn&apos;t cause you to look like Jesus isn&apos;t of Jesus.&rdquo;</h1>
        <p>You were not made to watch faith from the edge. Come be seen, gathered, formed, and sent.</p>
        <div className={styles.actions}>
          <ActionLink href="/live" tone="clay" tracking={{ target: "live", placement: "home-hero" }}>Join today’s live</ActionLink>
          <ActionLink href="/start-here" tone="quiet" tracking={{ target: "start-here", placement: "home-hero" }}>Start here</ActionLink>
        </div>
      </div>
      <div className={styles.heroVisual} data-parallax>
        <Image src="/images/brand/lion-portrait.jpg" alt="" width={1024} height={573} sizes="(max-width: 64rem) 100vw, 38vw" priority />
        <LiveStatus schedule={schedule} replay={replay} placement="hero" />
      </div>
    </section>
  );
}
