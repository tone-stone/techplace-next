import Image from "next/image";
import Link from "next/link";
import { Clock4, Mail, MapPin, Phone } from "lucide-react";
import { FaFacebookF, FaGithub, FaLinkedinIn, FaWhatsapp } from "react-icons/fa6";
import Reveal from "./Reveal";

const NAV_LINKS = [
  { href: "/#home", label: "Inicio" },
  { href: "/#servicios", label: "Servicios" },
  { href: "/#nosotros", label: "Nosotros" },
  { href: "/#portafolio", label: "Portafolio" },
  { href: "/blog", label: "Blog" },
  { href: "/#contacto", label: "Contacto" },
];

const SOCIAL_LINKS = [
  { href: "https://facebook.com/techplacetijuana", icon: FaFacebookF, label: "Facebook" },
  { href: "https://wa.me/526643425615", icon: FaWhatsapp, label: "WhatsApp" },
  { href: "https://www.linkedin.com/company/techplacetj", icon: FaLinkedinIn, label: "LinkedIn" },
  { href: "https://github.com/tone-stone", icon: FaGithub, label: "GitHub" },
];

/* Both waves start and end at the same y so the duplicated tile loops with no seam. */
const WATER_BACK = "M0,80C240,130,480,130,720,80C960,30,1200,30,1440,80V150H0Z";
const WATER_FRONT = "M0,100C240,60,480,60,720,100C960,140,1200,140,1440,100V150H0Z";

export default function Footer() {
  return (
    <footer
      id="footer"
      className="relative overflow-hidden bg-linear-to-b from-purple-950/50 via-black/60 to-black pt-16 pb-28 text-gray-300 border-t border-white/10"
    >
      {/* Water simulation at the very bottom of the page */}
      <div className="absolute bottom-0 left-0 w-full h-28 overflow-hidden pointer-events-none" aria-hidden>
        <svg
          className="absolute bottom-0 left-0 h-full w-[200%] animate-[tp-wave_19s_linear_infinite_reverse]"
          viewBox="0 0 2880 150"
          preserveAspectRatio="none"
        >
          <path d={WATER_BACK} fill="#a855f7" fillOpacity="0.18" />
          <path d={WATER_BACK} fill="#a855f7" fillOpacity="0.18" transform="translate(1440,0)" />
        </svg>
        <svg
          className="absolute bottom-0 left-0 h-full w-[200%] animate-[tp-wave_12s_linear_infinite]"
          viewBox="0 0 2880 150"
          preserveAspectRatio="none"
        >
          <path d={WATER_FRONT} fill="#0a0a18" />
          <path d={WATER_FRONT} fill="#0a0a18" transform="translate(1440,0)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <Reveal className="tp-glass rounded-3xl p-8 sm:p-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="flex flex-col items-start">
              <Image
                src="/img/logos/techplace-wordmark.webp"
                alt="TechPlace logo"
                width={218}
                height={80}
                className="h-16 w-auto mb-3 drop-shadow-[0_0_16px_rgba(144,205,221,0.35)]"
              />
              <p className="text-sm leading-relaxed">
                Desarrollo Web &nbsp;|&nbsp; Apps Móviles &nbsp;|&nbsp; Cyberseguridad <br />
                Innovación que protege tu futuro digital.
              </p>
            </div>

            <div>
              <h4 className="font-heading text-purple-400 font-bold mb-4 text-sm tracking-wide uppercase">
                Navegación
              </h4>
              <ul className="space-y-2 text-sm">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="-my-1.5 block py-1.5 hover:text-brand-blue hover:pl-1 transition-all"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-heading text-purple-400 font-bold mb-4 text-sm tracking-wide uppercase">
                Contacto
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="tel:6643425615"
                    className="-my-1.5 flex items-center gap-2 py-1.5 hover:text-brand-blue transition"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-brand-blue" />
                    664 342 56 15
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:info@techplacetj.com"
                    className="-my-1.5 flex items-center gap-2 py-1.5 hover:text-brand-blue transition"
                  >
                    <Mail className="h-4 w-4 shrink-0 text-brand-blue" />
                    info@techplacetj.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-purple-400" />
                  <span>Tijuana, B.C.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock4 className="h-4 w-4 text-purple-400" />
                  <span>Lun-Vie 10 am – 4 pm</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-4">
              <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13421.5729!2d-117.041!3d32.511!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80d94987f0e7bf3f%3A0x8d0ffb!2sLas%20Brisas%2C%20Tijuana%2C%20B.C.!5e0!3m2!1ses-419!2smx!4v0000000000000"
                  style={{ border: 0, width: "100%", height: "140px" }}
                  allowFullScreen
                  loading="lazy"
                  title="mapa"
                />
              </div>

              <div className="flex gap-4 justify-center lg:justify-start">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tp-social-btn"
                    aria-label={social.label}
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} TechPlace – Todos los derechos reservados. ·{" "}
            <Link href="/legal" className="hover:text-brand-blue transition-colors">
              Legal
            </Link>
          </div>
        </Reveal>
      </div>

      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(147,51,234,0.10)_0,transparent_40%),radial-gradient(circle_at_90%_80%,rgba(76,29,149,0.15)_0,transparent_40%)]" />
    </footer>
  );
}
