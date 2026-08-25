import Aurora from "@/components/landing/Aurora";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Servicios from "@/components/landing/Servicios";
import Nosotros from "@/components/landing/Nosotros";
import PorQueTechPlace from "@/components/landing/PorQueTechPlace";
import Portafolio from "@/components/landing/Portafolio";
import Contacto from "@/components/landing/Contacto";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";

export default function Home() {
  return (
    <div className="text-white font-sans">
      <Aurora />
      <Navbar />
      <Hero />
      <Servicios />
      <Nosotros />
      <PorQueTechPlace />
      <Portafolio />
      <Contacto />
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
