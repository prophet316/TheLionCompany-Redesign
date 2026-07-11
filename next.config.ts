import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { NextConfig } from "next";
import { parseCspHashManifest, securityHeaderRules } from "./config/security-headers";
import { legacyRouteLedger } from "./config/redirects";
import { toNextRedirects } from "./lib/redirects";

const hashFile = resolve("config/.generated-csp-hashes.json");
const hashManifest = existsSync(hashFile)
  ? parseCspHashManifest(JSON.parse(readFileSync(hashFile, "utf8")))
  : null;
const finalProductionBuild =
  process.env.VERCEL_ENV === "production" && process.env.CSP_PHASE === "final";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  outputFileTracingRoot: process.cwd(),
  experimental: {
    sri: { algorithm: "sha256" },
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  generateBuildId: async () =>
    process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.NEXT_BUILD_ID ?? "local-csp-build",
  async headers() {
    return securityHeaderRules({ production: finalProductionBuild, manifest: hashManifest });
  },
  async redirects() {
    return toNextRedirects(legacyRouteLedger);
  },
};

export default nextConfig;
