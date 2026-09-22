import type { Metadata } from "next";
import Aurora from "@/components/landing/Aurora";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import CotizacionWizard from "@/components/cotizacion/CotizacionWizard";

export const metadata: Metadata = {
  title: "Solicita tu cotización | TechPlace",
  description:
    "Cuéntanos sobre tu proyecto de sitio web o app: alcance, funcionalidades, diseño y presupuesto. Te contactaremos con una cotización a la medida.",
};

export default function CotizacionPage() {
  return (
    <div className="text-white font-sans">
      <Aurora />
      <Navbar />
      <section className="relative pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <h1 className="tp-heading font-heading text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">
              Cuéntanos sobre tu proyecto
            </h1>
            <p className="text-gray-300 max-w-xl mx-auto">
              Entre mejor conozcamos tu proyecto, más precisa será tu cotización. Toma unos minutos
              en responder y te contactaremos con una propuesta a la medida.
            </p>
          </div>
          <CotizacionWizard />
        </div>
      </section>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
