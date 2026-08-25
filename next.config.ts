import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Covers the worst case for one article submission: a 500MB video,
      // a 50MB cover image, and up to 6 gallery images at 50MB each.
      bodySizeLimit: "900mb",
    },
  },
};

export default nextConfig;
