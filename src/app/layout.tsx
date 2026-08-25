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
  title: "TechPlace | Desarrollo Web, Apps y Cyberseguridad en Tijuana",
  description:
    "TechPlace: expertos en desarrollo web, apps móviles multiplataforma con React Native y soluciones en ciberseguridad en Tijuana. Tu aliado tecnológico para negocios modernos y seguros.",
  keywords: [
    "Desarrollo web",
    "Desarrollo móvil",
    "React Native",
    "Apps multiplataforma",
    "Cyberseguridad",
    "Tijuana",
    "Software",
    "Páginas web",
    "Seguridad informática",
    "Diseño web",
    "IT",
    "Soluciones tecnológicas",
    "TechPlace",
  ],
  authors: [{ name: "TechPlace" }],
  icons: {
    icon: "/img/logos/techplace-icon.webp",
  },
  openGraph: {
    title: "TechPlace | Desarrollo Web, Apps y Cyberseguridad en Tijuana",
    description:
      "Impulsa tu negocio con sitios web, apps móviles multiplataforma y servicios de ciberseguridad a la medida.",
    images: ["/img/logos/techplace-brand.webp"],
    url: "https://techplacetj.com/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TechPlace | Desarrollo Web, Apps y Cyberseguridad en Tijuana",
    description: "Desarrollamos tu página web y app móvil, aseguramos tu empresa. Conoce TechPlace.",
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
