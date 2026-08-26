"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogIn, Menu, PenSquare, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const NAV_LINKS = [
  { href: "/#home", label: "Inicio" },
  { href: "/#servicios", label: "Servicios" },
  { href: "/#nosotros", label: "Nosotros" },
  { href: "/#portafolio", label: "Portafolio" },
  {
    href: "/blog",
    label: "Blog",
    children: [
      { href: "/blog", label: "Ver blog" },
      { href: "/blog/login", label: "Portal de redacción" },
    ],
  },
  { href: "/#contacto", label: "Contacto" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("home");
  const [blogMenuOpen, setBlogMenuOpen] = useState(false);
  const blogMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    NAV_LINKS.forEach((link) => {
      const id = link.href.split("#")[1];
      const el = id ? document.getElementById(id) : null;
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const isActive = (href: string) => {
    const id = href.split("#")[1];
    if (id) return pathname === "/" && active === id;
    return pathname.startsWith(href);
  };

  useEffect(() => {
    if (!blogMenuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (blogMenuRef.current && !blogMenuRef.current.contains(e.target as Node)) {
        setBlogMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBlogMenuOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [blogMenuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const toggleMenu = () => setMenuOpen((open) => !open);

  return (
    <nav className="fixed z-50 top-0 inset-x-0 md:top-4 md:inset-x-6 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-full lg:max-w-6xl">
      <div
        className={`relative z-50 shadow-lg backdrop-blur-md transition-all duration-300 md:rounded-full ${
          scrolled ? "tp-navbar-bg-dark" : "tp-navbar-bg-light"
        }`}
      >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        <Link href="/#home" className="flex items-center gap-3">
          <Image
            src="/img/logos/techplace-icon.webp"
            alt="Logo TechPlace"
            width={40}
            height={40}
            priority
            className="h-10 w-10 rounded-full drop-shadow-[0_0_10px_rgba(144,205,221,0.5)]"
          />
          <Image
            src="/img/logos/techplace-wordmark.webp"
            alt="TechPlace"
            width={109}
            height={40}
            priority
            className="h-8 sm:h-10 w-auto object-contain"
          />
        </Link>

        <div className="hidden md:flex items-center gap-8 text-lg font-semibold">
          {NAV_LINKS.map((link) =>
            link.children ? (
              <div key={link.href} className="relative" ref={blogMenuRef}>
                <button
                  type="button"
                  onClick={() => setBlogMenuOpen((open) => !open)}
                  aria-haspopup="true"
                  aria-expanded={blogMenuOpen}
                  className={`tp-nav-link-underline${isActive(link.href) ? " active" : ""}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {link.label}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${blogMenuOpen ? "rotate-180" : ""}`}
                    />
                  </span>
                </button>

                <AnimatePresence>
                  {blogMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                      className="tp-dropdown-glass absolute left-1/2 top-full mt-3 w-56 -translate-x-1/2 rounded-2xl p-2 text-base"
                    >
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setBlogMenuOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2.5 font-medium text-gray-200 hover:bg-white/10 hover:text-brand-blue transition-colors"
                        >
                          {child.href === "/blog/login" ? (
                            <PenSquare className="h-4 w-4 text-purple-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 -rotate-90 text-purple-400" />
                          )}
                          {child.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={`tp-nav-link-underline${isActive(link.href) ? " active" : ""}`}
              >
                {link.label}
              </Link>
            )
          )}
          <Link
            href="/login"
            className="tp-btn-animated inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-base font-bold text-white shadow-lg shadow-blue-900/30 transition-transform hover:scale-105"
          >
            <LogIn className="h-4 w-4" />
            Entrar
          </Link>
        </div>

        <button
          onClick={toggleMenu}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          className="md:hidden relative z-50 flex items-center justify-center w-12 h-12 rounded-full text-purple-200 hover:text-brand-blue hover:bg-brand-blue/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
        >
          <AnimatePresence mode="wait" initial={false}>
            {menuOpen ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-6 w-6" />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu className="h-6 w-6" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 md:hidden flex flex-col items-center justify-center gap-7 text-xl font-semibold bg-[#0a0a18]/90 backdrop-blur-md"
          >
            {NAV_LINKS.map((link, i) => (
              <div key={link.href} className="flex flex-col items-center gap-4">
                <motion.a
                  href={link.href}
                  onClick={toggleMenu}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * i }}
                  className={`tp-nav-link-underline tp-mobile-nav-link${isActive(link.href) ? " active" : ""}`}
                >
                  {link.label}
                </motion.a>
                {link.children?.map((child) => (
                  <motion.a
                    key={child.href}
                    href={child.href}
                    onClick={toggleMenu}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 * i }}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-base font-normal text-gray-400 hover:text-brand-blue transition-colors"
                  >
                    {child.href === "/blog/login" && <PenSquare className="h-3.5 w-3.5" />}
                    {child.label}
                  </motion.a>
                ))}
              </div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * NAV_LINKS.length }}
            >
              <Link
                href="/login"
                onClick={toggleMenu}
                className="tp-btn-animated inline-flex items-center gap-1.5 rounded-full px-6 py-3 text-lg font-bold text-white shadow-lg transition-transform active:scale-95"
              >
                <LogIn className="h-5 w-5" />
                Entrar
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
