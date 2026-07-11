import { TrackedLink } from "@/components/client/tracked-link";
import styles from "./home.module.css";

export function FinalInvitation() {
  return (
    <section className={"section " + styles.final} aria-labelledby="final-title">
      <p className={styles.eyebrow}>Sent</p>
      <h2 id="final-title">Take the next faithful step.</h2>
      <nav aria-label="Final invitations">
        <TrackedLink href="/teachings" eventName="cta_click" eventProperties={{ target: "teachings", placement: "home-final" }}>Begin with a teaching</TrackedLink>
        <TrackedLink href="/prayer" eventName="cta_click" eventProperties={{ target: "prayer", placement: "home-final" }}>Submit a prayer request</TrackedLink>
        <TrackedLink href="/connect#newsletter" eventName="cta_click" eventProperties={{ target: "newsletter", placement: "home-final" }}>Join the monthly letter</TrackedLink>
        <TrackedLink href="/give" eventName="cta_click" eventProperties={{ target: "give", placement: "home-final" }}>Give to support the mission</TrackedLink>
      </nav>
    </section>
  );
}
