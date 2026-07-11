"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AnalyticsEventName,
  AnalyticsProperties,
} from "@/lib/analytics/contracts";
import { safeProperties } from "@/lib/analytics/contracts";
import {
  CONSENT_KEY,
  readConsent,
  removeGaCookies,
  writeConsent,
  type ConsentState,
} from "@/lib/analytics/consent";

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

interface AnalyticsContextValue {
  readonly consent: ConsentState;
  readonly settingsOpen: boolean;
  readonly setConsent: (state: Exclude<ConsentState, "unknown">) => void;
  readonly openSettings: () => void;
  readonly closeSettings: () => void;
  readonly track: <Event extends AnalyticsEventName>(event: Event, properties: AnalyticsProperties<Event>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);
const MEASUREMENT_ID = "G-MNK2G065ES";

function ensureGtag() {
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = window.gtag ?? ((...args: unknown[]) => {
    window.dataLayer?.push(args);
  });
}

function loadGa4() {
  ensureGtag();
  window.gtag!("consent", "update", { analytics_storage: "granted" });
  if (document.querySelector("script[data-ga4]")) return;
  window.gtag!("js", new Date());
  window.gtag!("config", MEASUREMENT_ID, {
    anonymize_ip: true,
    allow_google_signals: false,
    send_page_view: true,
  });
  const script = document.createElement("script");
  script.async = true;
  script.dataset.ga4 = "true";
  script.src =
    "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(MEASUREMENT_ID);
  document.head.append(script);
}

export function AnalyticsProvider({
  children,
  enabled,
}: {
  readonly children: ReactNode;
  readonly enabled: boolean;
}) {
  const [consent, setConsentState] = useState<ConsentState>("unknown");
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    // Hydrate after mount so SSR and the first client paint stay denied-by-default.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is client-only
      setConsentState(readConsent(localStorage.getItem(CONSENT_KEY)));
    } catch {
      setConsentState("unknown");
    }
  }, []);

  useEffect(() => {
    const synchronize = (event: StorageEvent) => {
      if (event.key !== CONSENT_KEY) return;
      const next = readConsent(event.newValue);
      setConsentState(next);
      if (next !== "analytics-granted") {
        window.gtag?.("consent", "update", { analytics_storage: "denied" });
        removeGaCookies(document);
      }
    };
    window.addEventListener("storage", synchronize);
    return () => window.removeEventListener("storage", synchronize);
  }, []);

  useEffect(() => {
    if (enabled && consent === "analytics-granted") loadGa4();
  }, [consent, enabled]);

  const setConsent = useCallback((state: "denied" | "analytics-granted") => {
    try {
      localStorage.setItem(CONSENT_KEY, writeConsent(state));
    } catch {
      state = "denied";
    }
    setConsentState(state);
    if (state === "denied") {
      window.gtag?.("consent", "update", { analytics_storage: "denied" });
      removeGaCookies(document);
    }
    setSettingsOpen(false);
  }, []);

  const track = useCallback(
    function track<Event extends AnalyticsEventName>(event: Event, properties: AnalyticsProperties<Event>) {
      if (!enabled || consent !== "analytics-granted" || !window.gtag) return;
      const safe = safeProperties(event, properties);
      if (!safe) return;
      window.gtag("event", event, {
        ...safe,
        transport_type: "beacon",
      });
    },
    [consent, enabled],
  );

  useEffect(() => {
    const onError = () => track("client_error", { component: "window", code: "runtime_error" });
    const onUnhandledRejection = () => track("client_error", { component: "window", code: "unhandled_rejection" });
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, [track]);

  const value = useMemo<AnalyticsContextValue>(
    () => ({
      consent,
      settingsOpen,
      setConsent,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
      track,
    }),
    [consent, setConsent, settingsOpen, track],
  );

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics() {
  const value = useContext(AnalyticsContext);
  if (!value) throw new Error("useAnalytics must be used inside AnalyticsProvider");
  return value;
}
