import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
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
    images: ["/img/logos/techplace-brand.webp"],
    url: "https://techplacetj.com/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TechPlace | Desarrollo web, apps y ciberseguridad en Tijuana",
    description:
      "Desarrollo web, aplicaciones móviles, inteligencia artificial y ciberseguridad para empresas. Tijuana, Baja California y toda la República.",
    images: ["/img/logos/techplace-brand.webp"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
