/**
 * Root layout for the whole site. Loads the Geist/Geist Mono/Orbitron fonts
 * and the base site metadata (title, description, keywords, Open Graph and
 * Twitter cards), then mounts `MonitoringClient` inside `<body>` so
 * site-wide error and Web Vitals reporting is active on every route before
 * `children` renders. Vercel's `<Analytics />` is mounted after `children`
 * for privacy-friendly page-view traffic stats (script + beacons are
 * same-origin under `/_vercel/insights`, so the CSP needs no change).
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import MonitoringClient from "@/components/monitoring/MonitoringClient";
import EngagementTracker from "@/components/monitoring/EngagementTracker";
import ThirdPartyAnalytics from "@/components/analytics/ThirdPartyAnalytics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["500", "700", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://techplacetj.com"),
  alternates: { canonical: "/" },
  title: "TechPlace | Desarrollo web, apps y ciberseguridad en Tijuana",
  description:
    "Desarrollo de software, aplicaciones móviles, inteligencia artificial y ciberseguridad para empresas. Construimos productos digitales escalables con IA integrada en todo el proceso, desde Tijuana, Baja California, con cobertura remota en toda la República.",
  keywords: [
    "desarrollo web Tijuana",
    "diseño de páginas web Tijuana",
    "desarrollo de apps Tijuana",
    "aplicaciones móviles React Native",
    "desarrollo de software con inteligencia artificial",
    "integración de IA en negocios",
    "asistentes y chatbots con IA",
    "ciberseguridad Tijuana",
    "pentesting México",
    "auditoría de seguridad informática",
    "desarrollo de software Baja California",
    "CRM y CMS a la medida",
    "hosting y correo empresarial",
    "consultoría IT",
    "automatización con inteligencia artificial",
    "TechPlace",
  ],
  authors: [{ name: "TechPlace" }],
  icons: {
    icon: "/img/logos/techplace-icon.webp",
  },
  openGraph: {
    title: "TechPlace | Desarrollo web, apps y ciberseguridad en Tijuana",
    description:
      "Desarrollo web, aplicaciones móviles, inteligencia artificial y ciberseguridad para empresas. Tijuana, Baja California y toda la República.",
    // og:image is supplied by src/app/opengraph-image.tsx (generated 1200×630 card).
    url: "https://techplacetj.com",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TechPlace | Desarrollo web, apps y ciberseguridad en Tijuana",
    description:
      "Desarrollo web, aplicaciones móviles, inteligencia artificial y ciberseguridad para empresas. Tijuana, Baja California y toda la República.",
    // twitter:image is supplied by src/app/twitter-image.tsx.
  },
};

const SITE_URL = "https://techplacetj.com";

/**
 * Site-wide structured data: a single linked graph (Organization + WebSite +
 * ProfessionalService) so search engines resolve one business entity across
 * every route. Per-page schema (BlogPosting, etc.) references `#organization`.
 */
const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "TechPlace",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/img/logos/techplace-icon.webp`,
      },
      image: `${SITE_URL}/img/logos/techplace-brand.webp`,
      email: "info@techplacetj.com",
      telephone: "+526643425615",
      sameAs: [
        "https://facebook.com/techplacetijuana",
        "https://www.linkedin.com/company/techplacetj",
        "https://github.com/tone-stone",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "TechPlace",
      inLanguage: "es-MX",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#localbusiness`,
      name: "TechPlace",
      url: SITE_URL,
      image: `${SITE_URL}/img/logos/techplace-brand.webp`,
      email: "info@techplacetj.com",
      telephone: "+526643425615",
      priceRange: "$$",
      parentOrganization: { "@id": `${SITE_URL}/#organization` },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Tijuana",
        addressRegion: "Baja California",
        addressCountry: "MX",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 32.511,
        longitude: -117.041,
      },
      areaServed: [
        { "@type": "AdministrativeArea", name: "Baja California" },
        { "@type": "Country", name: "México" },
      ],
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "10:00",
          closes: "16:00",
        },
      ],
      knowsAbout: [
        "Desarrollo web",
        "Aplicaciones móviles",
        "Inteligencia artificial",
        "Ciberseguridad",
        "Pentesting",
        "Consultoría IT",
      ],
    },
  ],
};

/** Wraps every page with the shared `<html>`/`<body>` shell, site fonts, and the monitoring client. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        <MonitoringClient />
        <EngagementTracker />
        <ThirdPartyAnalytics />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
