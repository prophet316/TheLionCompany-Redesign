"use client";

import { useEffect } from "react";
import { markNewsletterConfirmed } from "../../../lib/prompts/storage";

export function NewsletterOutcomeMarker(): null {
  useEffect(() => {
    markNewsletterConfirmed();
  }, []);
  return null;
}
