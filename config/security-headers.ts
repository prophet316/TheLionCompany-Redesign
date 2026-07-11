type Header = { key: string; value: string };

export type CspHashManifest = {
  readonly version: 1;
  readonly routes: Readonly<Record<string, readonly string[]>>;
  readonly fallback: readonly string[];
};

type HeaderRule = { source: string; headers: Header[] };

function csp(hashes: readonly string[]): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src 'self' ${hashes.join(" ")} https://www.googletagmanager.com https://challenges.cloudflare.com`,
    "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://challenges.cloudflare.com",
    "img-src 'self' data: blob: https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "frame-src https://www.youtube-nocookie.com https://challenges.cloudflare.com",
    "media-src 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function securityHeaders(input: {
  production: boolean;
  hashes: readonly string[];
}): Header[] {
  if (input.production && input.hashes.length === 0) {
    throw new Error("production CSP hashes are required");
  }
  const headers: Header[] = [
    {
      key: input.production
        ? "Content-Security-Policy"
        : "Content-Security-Policy-Report-Only",
      value: csp(input.hashes),
    },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    },
    { key: "X-Frame-Options", value: "DENY" },
  ];
  if (input.production) {
    headers.push({ key: "Strict-Transport-Security", value: "max-age=31536000" });
  }
  return headers;
}

export function parseCspHashManifest(value: unknown): CspHashManifest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Partial<CspHashManifest>;
  if (
    candidate.version !== 1 ||
    !candidate.routes ||
    typeof candidate.routes !== "object" ||
    !Array.isArray(candidate.fallback)
  ) {
    return null;
  }
  for (const [route, hashes] of Object.entries(candidate.routes)) {
    if (
      !route.startsWith("/") ||
      !Array.isArray(hashes) ||
      hashes.some((hash) => typeof hash !== "string")
    ) {
      return null;
    }
  }
  if (candidate.fallback.some((hash) => typeof hash !== "string")) return null;
  return candidate as CspHashManifest;
}

export function securityHeaderRules(input: {
  production: boolean;
  manifest: CspHashManifest | null;
}): HeaderRule[] {
  if (input.production && !input.manifest) {
    throw new Error("production CSP hash manifest is required");
  }
  const rules: HeaderRule[] = [
    {
      source: "/(.*)",
      headers: securityHeaders({
        production: input.production,
        hashes: input.manifest?.fallback ?? [],
      }),
    },
  ];
  for (const [source, hashes] of Object.entries(input.manifest?.routes ?? {}).sort(
    ([left], [right]) => left.localeCompare(right),
  )) {
    rules.push({
      source,
      headers: securityHeaders({ production: input.production, hashes }),
    });
  }
  return rules;
}
