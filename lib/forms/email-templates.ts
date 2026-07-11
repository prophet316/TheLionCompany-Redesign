import "server-only";
import { assertSafeHeader, escapeHtml, normalizeMultiline } from "./content";
import type { ContactDeliveryInput, PrayerDeliveryInput } from "./provider";

type Message = { subject: string; textContent: string; htmlContent: string };

function paragraph(value: string): string {
  return escapeHtml(normalizeMultiline(value)).replace(/\n/g, "<br>");
}

export function renderPrayerEmail(
  input: Omit<PrayerDeliveryInput, "submissionId" | "email">,
): Message {
  const subject = assertSafeHeader(`Prayer request ${input.requestIdentifier}`);
  const name = input.displayName ?? "Anonymous";
  const followUp = input.followUpRequested ? "Yes" : "No";
  return {
    subject,
    textContent: [
      `Request: ${input.requestIdentifier}`,
      `Name: ${name}`,
      `Follow-up requested: ${followUp}`,
      "",
      normalizeMultiline(input.request),
    ].join("\n"),
    htmlContent: [
      "<!doctype html><html><body>",
      `<p><strong>Request:</strong> ${escapeHtml(input.requestIdentifier)}</p>`,
      `<p><strong>Name:</strong> ${escapeHtml(name)}</p>`,
      `<p><strong>Follow-up requested:</strong> ${followUp}</p>`,
      `<p>${paragraph(input.request)}</p>`,
      "</body></html>",
    ].join(""),
  };
}

export function renderContactEmail(
  input: Omit<ContactDeliveryInput, "submissionId" | "email">,
): Message {
  const subject = assertSafeHeader(`Contact request ${input.requestIdentifier}`);
  return {
    subject,
    textContent: [
      `Request: ${input.requestIdentifier}`,
      `Name: ${input.name}`,
      `Reason: ${input.reason}`,
      "",
      normalizeMultiline(input.message),
    ].join("\n"),
    htmlContent: [
      "<!doctype html><html><body>",
      `<p><strong>Request:</strong> ${escapeHtml(input.requestIdentifier)}</p>`,
      `<p><strong>Name:</strong> ${escapeHtml(input.name)}</p>`,
      `<p><strong>Reason:</strong> ${escapeHtml(input.reason)}</p>`,
      `<p>${paragraph(input.message)}</p>`,
      "</body></html>",
    ].join(""),
  };
}
