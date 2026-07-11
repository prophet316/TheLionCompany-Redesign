import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    sri: { algorithm: "sha256" },
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
