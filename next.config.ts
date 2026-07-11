import type { NextConfig } from "next";
import { legacyRouteLedger } from "./config/redirects";
import { toNextRedirects } from "./lib/redirects";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    sri: { algorithm: "sha256" },
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return toNextRedirects(legacyRouteLedger);
  },
};

export default nextConfig;
