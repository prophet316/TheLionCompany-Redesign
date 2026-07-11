"use client";

import { useAnalytics } from "./analytics-provider";
import styles from "./consent-controls.module.css";

export function ConsentControls() {
  const analytics = useAnalytics();
  const visible = analytics.consent === "unknown" || analytics.settingsOpen;
  if (!visible) return null;

  return (
    <section className={styles.card} data-consent-active="true" aria-labelledby="analytics-consent-title">
      <div>
        <p className={styles.kicker}>Your choice</p>
        <h2 id="analytics-consent-title">Help us understand what serves visitors</h2>
        <p>
          Optional analytics never receives form content. The site works fully when
          analytics is declined.
        </p>
      </div>
      <div className={styles.actions}>
        <button type="button" onClick={() => analytics.setConsent("denied")}>
          Decline analytics
        </button>
        <button
          className={styles.accept}
          type="button"
          onClick={() => analytics.setConsent("analytics-granted")}
        >
          Allow analytics
        </button>
        {analytics.settingsOpen && analytics.consent !== "unknown" ? (
          <button type="button" onClick={analytics.closeSettings}>
            Keep current choice
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function ConsentSettingsButton() {
  const analytics = useAnalytics();
  return (
    <button type="button" onClick={analytics.openSettings}>
      Analytics settings
    </button>
  );
}
