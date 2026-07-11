import { legacyRouteLedger, type LegacyRoute } from "../config/redirects";

export function toNextRedirects(ledger: readonly LegacyRoute[]) {
  return ledger.flatMap((rule) => rule.kind === "redirect"
    ? [{ source: rule.source, destination: rule.destination, permanent: true as const }]
    : []);
}

export function getLegacyOutcome(pathname: string, ledger: readonly LegacyRoute[] = legacyRouteLedger) {
  return ledger.find((rule) => rule.source === pathname);
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function renderGoneHtml(pathname: string) {
  const path = escapeHtml(pathname);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex"><title>Content retired | The Lion Company</title><style>body{margin:0;background:#f3e9d7;color:#24151f;font:1rem/1.6 system-ui,sans-serif}main{width:min(42rem,calc(100% - 2rem));margin:15vh auto}h1{font:400 clamp(3rem,10vw,6rem)/1 Georgia,serif}a{color:#964532;font-weight:700}</style></head><body><main><p>The Lion Company</p><h1>That file has been retired.</h1><p>This retired source artifact is no longer published: <code>${path}</code>.</p><p><a href="/">Return home</a> or <a href="/teachings">explore teachings</a>.</p></main></body></html>`;
}
