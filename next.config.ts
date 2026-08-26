import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;
const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Covers the worst case for one article submission: a 500MB video,
      // a 50MB cover image, and up to 6 gallery images at 50MB each.
      bodySizeLimit: "900mb",
    },
  },
  images: {
    // Lets next/image resize + re-encode blog photos (Cloudinary covers/gallery,
    // plus legacy uploads still hosted on Supabase Storage from before the
    // Cloudinary migration) instead of shipping full-resolution originals.
    remotePatterns: [
      ...(cloudinaryCloudName
        ? [
            {
              protocol: "https" as const,
              hostname: "res.cloudinary.com",
              pathname: `/${cloudinaryCloudName}/**`,
            },
          ]
        : []),
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
