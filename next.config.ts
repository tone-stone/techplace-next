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
  async headers() {
    // Origins mapped by hand against actual usage (see git history for the
    // audit): Cloudinary + Supabase Storage for images (next-cloudinary is a
    // dependency but unused — uploads go through the server-side SDK in
    // src/lib/cloudinary.ts), Supabase for auth/API, Facebook's CDN for the
    // social carousel's plain <img> posts (no live FB/IG iframe embed), and
    // a Google Maps iframe in the footer. No third-party scripts, no eval —
    // script-src doesn't need 'unsafe-inline'/'unsafe-eval'. style-src does,
    // for the inline style={{...}} props used across the UI (animation
    // delays, hand-rolled SVG charts).
    const csp = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: https://res.cloudinary.com https://*.fbcdn.net${
        supabaseHostname ? ` https://${supabaseHostname}` : ""
      }`,
      "media-src 'self' https://res.cloudinary.com",
      "font-src 'self'",
      `connect-src 'self'${supabaseHostname ? ` https://${supabaseHostname}` : ""}`,
      "frame-src https://www.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
