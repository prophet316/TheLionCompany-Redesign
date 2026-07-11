"use client";

import { useEffect, useId, useState } from "react";
import { NewsletterForm } from "@/components/client/forms/newsletter-form";
import { useAnalytics } from "./analytics-provider";
import { Dialog } from "./dialog";
import { TrackedLink } from "./tracked-link";
import styles from "./prompt-invitations.module.css";

export function PromptInvitation({
  kind,
  onDismiss,
  onNewsletterAccepted,
  onComplete,
}: {
  readonly kind: "newsletter" | "store";
  readonly onDismiss: () => void;
  readonly onNewsletterAccepted: () => void;
  readonly onComplete: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newsletterAccepted, setNewsletterAccepted] = useState(false);
  const dialogTitleId = useId();
  const { track } = useAnalytics();
  const newsletter = kind === "newsletter";
  const title = newsletter ? "Monthly field notes" : "Wear the vision";
  useEffect(() => {
    if (!newsletter) track("store_prompt_view", { placement: "home-edge" });
  }, [newsletter, track]);
  return (
    <>
      <aside className={styles.invitation} role="complementary" aria-label={title}>
        <p>{newsletter ? "One thoughtful letter each month." : "Carry a visible reminder of unity."}</p>
        <div>
          <button type="button" onClick={() => setDialogOpen(true)}>Open</button>
          <button type="button" onClick={() => {
            onDismiss();
            if (!newsletter) track("store_prompt_dismiss", { placement: "home-edge" });
          }}>Dismiss</button>
        </div>
      </aside>
      <Dialog open={dialogOpen} title={title} titleId={dialogTitleId} onClose={() => {
        setDialogOpen(false);
        if (newsletterAccepted) {
          requestAnimationFrame(() => requestAnimationFrame(onComplete));
        }
      }}>
        {newsletter ? (
          <>
            <p>Teaching, live guidance, resources, podcasts, and ministry updates. Confirm by email to join.</p>
            <NewsletterForm placement="prompt" headingId={dialogTitleId} onAccepted={() => {
              setNewsletterAccepted(true);
              onNewsletterAccepted();
            }} />
          </>
        ) : (
          <>
            <p>Meet the story behind the collection, then continue to the complete Printify catalog.</p>
            <TrackedLink href="/store" eventName="store_click" eventProperties={{ placement: "prompt-dialog" }}>Explore the store story</TrackedLink>
          </>
        )}
      </Dialog>
    </>
  );
}
