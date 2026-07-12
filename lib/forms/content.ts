import "server-only";
import { createHmac } from "node:crypto";
import type { FormEndpoint } from "./contracts";

export function normalizeMultiline(value: string): string {
  return value.replace(/\0/g, "").replace(/\r\n?/g, "\n").trim();
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export function assertSafeHeader(value: string): string {
  if (/[\r\n\0]/.test(value)) throw new Error("header controls are not allowed");
  return value;
}

export function deriveRequestIdentifier(
  endpoint: Extract<FormEndpoint, "prayer" | "contact">,
  submissionId: string,
  secret: string,
): string {
  const prefix = endpoint === "prayer" ? "P" : "C";
  const digest = createHmac("sha256", secret)
    .update(`${endpoint}:${submissionId}`)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();
  return `${prefix}-${digest}`;
}
