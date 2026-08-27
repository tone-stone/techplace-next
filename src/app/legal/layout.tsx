import Aurora from "@/components/landing/Aurora";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import WhatsAppButton from "@/components/landing/WhatsAppButton";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
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
