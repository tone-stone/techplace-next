import { ImageResponse } from "next/og";

/**
 * Generated 1200×630 social card for link shares (WhatsApp, LinkedIn, X, etc.).
 * Replaces the old square brand logo that was being used as the OG image.
 * Typographic on purpose: `next/og` ships a default font, so no asset load,
 * and Satori's <img> support for .webp (the format the brand logos use) is
 * unreliable. Colors match the site: dark #0a0a18 with the purple/brand-blue
 * accents from globals.css.
 */
export const alt =
  "TechPlace — Desarrollo web, apps, IA y ciberseguridad en Tijuana";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "90px",
          background:
            "radial-gradient(circle at 18% 12%, rgba(168,85,247,0.30) 0, transparent 55%), radial-gradient(circle at 92% 92%, rgba(144,205,221,0.20) 0, transparent 50%), #0a0a18",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 32,
            letterSpacing: 10,
            textTransform: "uppercase",
            color: "#90cddd",
          }}
        >
          Ingeniería digital
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 132,
            fontWeight: 800,
            marginTop: 12,
            lineHeight: 1,
          }}
        >
          TechPlace
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 46,
            marginTop: 30,
            color: "rgba(255,255,255,0.88)",
          }}
        >
          Desarrollo web · Apps · IA · Ciberseguridad
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            marginTop: 52,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          Tijuana, Baja California · techplacetj.com
        </div>
      </div>
    ),
    { ...size },
  );
}
