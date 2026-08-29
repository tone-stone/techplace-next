import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;
const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

const nextConfig: NextConfig = {
  // Don't advertise the framework in a response header.
  poweredByHeader: false,
  experimental: {
    // Ship route CSS as inline <style> instead of a render-blocking
    // <link>. The CSS is Tailwind (atomic, ~20 KiB) and this is a
    // landing site where first-load LCP/FCP matter more than letting
    // repeat visitors reuse a cached stylesheet.
    inlineCss: true,
    serverActions: {
      // Covers the worst case for one article submission: a 500MB video,
      // a 50MB cover image, and up to 6 gallery images at 50MB each.
      bodySizeLimit: "900mb",
    },
  },
  images: {
    // next/image now rejects any `quality` prop not enumerated here (default
    // is [75]). The portfolio grid ships at 75, its carousel thumbnails at 70.
    qualities: [70, 75],
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
    // but script-src DOES need 'unsafe-inline': Next.js itself injects inline
    // <script> tags to stream RSC payload data for hydration (independent of
    // whether the app's own code has inline scripts), and without a nonce
    // (which forces every page into dynamic rendering, killing static
    // generation/ISR — a real cost not worth it for this site) Next's own
    // docs list 'unsafe-inline' as the required default. Confirmed the hard
    // way: blocking it silently broke hydration in production (dead navbar,
    // dead hamburger menu, React error #412) even though the build and every
    // curl-level check looked fine. style-src needs 'unsafe-inline' too, for
    // the inline style={{...}} props used across the UI.
    //
    // CSP only applies to the production build: `next dev`/Turbopack's HMR
    // client relies on `eval()` to run updated chunks, which a `script-src`
    // without 'unsafe-eval' silently blocks — the whole app stops hydrating
    // (dead navbar, no client-side content) with no error beyond the
    // browser console. Not worth relaxing script-src in prod just to cover
    // a dev-only need.
    const headers: { key: string; value: string }[] = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    ];

    if (process.env.NODE_ENV === "production") {
      const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
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
      headers.unshift({ key: "Content-Security-Policy", value: csp });
    }

    return [{ source: "/:path*", headers }];
  },
};

export default nextConfig;
