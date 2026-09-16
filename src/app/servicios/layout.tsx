/**
 * Layout for the `/servicios` route group. Wraps the services index and
 * each `/servicios/[slug]` detail page with the same landing-page chrome
 * (Aurora background, Navbar, Footer, WhatsApp button) so these pages feel
 * consistent with the rest of the site.
 */
import Aurora from "@/components/landing/Aurora";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";

export default function ServiciosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-white font-sans">
      <Aurora />
      <Navbar />
      <main className="relative pt-32 pb-24">{children}</main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
