"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { canShowNewsletter, canShowStore, type PromptKind, type PromptRecord } from "@/lib/prompts/model";
import { subscribePromptChanges } from "@/lib/prompts/channel";
import {
  claimPrompt,
  dismissPrompt,
  markNewsletterRequestAccepted,
  openVisit,
  recordPromptActivity,
  readPromptRecord,
} from "@/lib/prompts/storage";
import { PromptInvitation } from "./prompt-invitations";

const EXCLUDED = new Set(["/prayer", "/connect", "/store"]);

function interactionBlocksPrompt() {
  const active = document.activeElement as HTMLElement | null;
  const selection = window.getSelection()?.toString().trim();
  const mediaPlaying = [...document.querySelectorAll<HTMLMediaElement>("audio, video")].some(
    (media) => !media.paused && !media.ended,
  );
  return Boolean(
    document.body.dataset.scrollLock === "true" ||
    document.querySelector('[data-consent-active="true"], [role="alert"], [aria-expanded="true"], iframe[src*="youtube-nocookie.com"]') ||
    active?.closest("form") ||
    mediaPlaying ||
    selection
  );
}

export function PromptController() {
  const pathname = usePathname();
  const [record, setRecord] = useState<PromptRecord | null>(null);
  const [visibleMs, setVisibleMs] = useState(0);
  const [progress, setProgress] = useState(0);
  const [inactiveMs, setInactiveMs] = useState(0);
  const [sectionVisibleMs, setSectionVisibleMs] = useState(0);
  const [exitIntent, setExitIntent] = useState(false);
  const [shown, setShown] = useState<PromptKind | null>(null);
  const lastActivity = useRef(0);
  const lastPersistedActivity = useRef(0);

  useEffect(() => {
    try {
      lastActivity.current = Date.now();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate visit state after mount
      setRecord(openVisit());
      const subscription = subscribePromptChanges(() => setRecord(readPromptRecord()));
      return () => subscription.close();
    } catch {
      setRecord(null);
    }
  }, []);

  useEffect(() => {
    if (!record || EXCLUDED.has(pathname)) return;
    const activity = () => {
      const now = Date.now();
      lastActivity.current = now;
      setInactiveMs(0);
      if (now - lastPersistedActivity.current >= 5_000) {
        try {
          recordPromptActivity(now);
          lastPersistedActivity.current = now;
        } catch {
          setRecord(null);
        }
      }
    };
    const tick = () => {
      if (document.visibilityState === "visible") setVisibleMs((value) => value + 1_000);
      setInactiveMs(Date.now() - lastActivity.current);
    };
    const scroll = () => {
      activity();
      const denominator = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      setProgress(Math.min(1, scrollY / denominator));
    };
    const leave = (event: MouseEvent) => {
      if (event.clientY <= 0 && innerWidth >= 768) setExitIntent(true);
    };
    const timer = setInterval(tick, 1_000);
    document.addEventListener("pointerdown", activity, { passive: true });
    document.addEventListener("keydown", activity);
    document.addEventListener("touchstart", activity, { passive: true });
    document.addEventListener("focusin", activity);
    document.addEventListener("input", activity);
    document.addEventListener("selectionchange", activity);
    document.addEventListener("mouseleave", leave);
    window.addEventListener("scroll", scroll, { passive: true });
    scroll();
    return () => {
      clearInterval(timer);
      document.removeEventListener("pointerdown", activity);
      document.removeEventListener("keydown", activity);
      document.removeEventListener("touchstart", activity);
      document.removeEventListener("focusin", activity);
      document.removeEventListener("input", activity);
      document.removeEventListener("selectionchange", activity);
      document.removeEventListener("mouseleave", leave);
      window.removeEventListener("scroll", scroll);
    };
  }, [pathname, record]);

  useEffect(() => {
    const store = document.getElementById("store");
    if (!store) return;
    let visibleSince = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        if (!visibleSince) visibleSince = Date.now();
      } else {
        visibleSince = 0;
        setSectionVisibleMs(0);
      }
    }, { threshold: [0.5] });
    observer.observe(store);
    const timer = setInterval(() => {
      if (visibleSince) setSectionVisibleMs(Date.now() - visibleSince);
    }, 1_000);
    return () => { clearInterval(timer); observer.disconnect(); };
  }, [pathname]);

  useEffect(() => {
    if (!record || shown || EXCLUDED.has(pathname) || interactionBlocksPrompt()) return;
    const now = Date.now();
    const desired = canShowNewsletter(record, now, { visibleMs, progress, inactiveMs })
      ? "newsletter"
      : canShowStore(record, now, { sectionVisibleMs, exitIntent, progress })
        ? "store"
        : null;
    if (!desired) return;
    void claimPrompt(desired, now).then((claimed) => {
      if (claimed) {
        setRecord(readPromptRecord());
        setShown(desired);
      }
    }).catch(() => setShown(null));
  }, [exitIntent, inactiveMs, pathname, progress, record, sectionVisibleMs, shown, visibleMs]);

  if (!shown) return null;
  return (
    <PromptInvitation
      kind={shown}
      onDismiss={() => { dismissPrompt(shown); setShown(null); }}
      onNewsletterAccepted={() => {
        markNewsletterRequestAccepted();
        setRecord(readPromptRecord());
      }}
      onComplete={() => setShown(null)}
    />
  );
}
