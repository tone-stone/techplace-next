import Aurora from "@/components/landing/Aurora";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import TechStack from "@/components/landing/TechStack";
import Servicios from "@/components/landing/Servicios";
import CasosDeUso from "@/components/landing/CasosDeUso";
import PlataformaIntegral from "@/components/landing/PlataformaIntegral";
import Nosotros from "@/components/landing/Nosotros";
import PorQueTechPlace from "@/components/landing/PorQueTechPlace";
import Portafolio from "@/components/landing/Portafolio";
import RedesSociales from "@/components/landing/RedesSociales";
import Contacto from "@/components/landing/Contacto";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";

/**
 * The site's homepage (`/`). Assembles the full one-page landing experience
 * by stacking each marketing section in scroll order — hero, services,
 * about, reasons to choose TechPlace, use cases, portfolio, social feed, and
 * contact — with the persistent nav, background aurora, footer, and WhatsApp
 * button wrapped around them.
 */
export default function Home() {
  return (
    <div className="text-white font-sans">
      <Aurora />
      <Navbar />
      <Hero />
      <TechStack />
      <Servicios />
      <PlataformaIntegral />
      <Nosotros />
      <PorQueTechPlace />
      <CasosDeUso />
      <Portafolio />
      <RedesSociales />
      <Contacto />
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
