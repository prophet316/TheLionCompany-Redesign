export type SiteCheckMode = "preview" | "staged-production" | "production";
export type PublicDocumentResult = { canonical: string; title: string; description: string; h1: string; robots: string; schemaTypes: string[]; anchors: string[] };
export function assertCanonicalDocument(html: string, expectedCanonical: string): PublicDocumentResult;
export function extractSitemapUrls(xml: string): string[];
export function assertSecurityHeaders(headers: Headers, mode: SiteCheckMode): void;
export function checkPublicContracts(options: {
  baseURL: string;
  mode: SiteCheckMode;
  deploymentId: string;
  commitSha: string;
  staticRoutes: readonly string[];
  podcastSlugs: readonly string[];
  legacyRouteLedger: readonly (
    | { kind: "redirect"; source: string; destination: string; statusCode: 308; preserveQuery: true }
    | { kind: "gone"; source: string; statusCode: 410; preserveQuery: false }
  )[];
  destinations: readonly { key: string; href: string; required: boolean; visible: boolean }[];
  protectionSecret?: string;
  checkExternal: boolean;
  evidenceDir?: string;
}): Promise<{
  schemaVersion: 1;
  gate: string;
  status: "pass";
  recordedAt: string;
  deploymentScope: "preview-qa" | "staged-production" | "production";
  deploymentId: string;
  commitSha: string;
  assertions: string[];
  metrics: { sitemapRoutes: number; podcastStaticRoutes: number; redirects: number; goneRoutes: number; visibleDestinations: number; requiredDestinations: number; optionalDestinations: number; manualChallenges: number };
  manualChallenges: { key: string; hostname: string; required: boolean }[];
}>;
