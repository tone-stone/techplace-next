"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Fixed, floating pill navbar shown on every page. Tracks scroll position to
 * swap its light/dark background and to auto-hide on mobile while scrolling,
 * highlights the in-view landing section via IntersectionObserver, and hosts
 * a desktop dropdown / full-screen mobile menu for the Blog submenu.
 */
const NAV_LINKS = [
  { href: "/#home", label: "Inicio" },
  { href: "/#servicios", label: "Servicios" },
  { href: "/#nosotros", label: "Nosotros" },
  { href: "/#portafolio", label: "Portafolio" },
  { href: "/blog", label: "Blog" },
  { href: "/#contacto", label: "Contacto" },
];

/** Site-wide navigation bar: logo, section links, Blog dropdown, and mobile menu. */
export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("home");
  // Mobile / tablet only (forced back to visible at lg: — see the nav's className):
  // hidden while actively scrolling in either direction, shown again once
  // scrolling settles. Keeps the bar out of the way while reading/scrolling
  // through a long page on a small screen, without permanently losing it.
  const [navHidden, setNavHidden] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 30);

      if (!menuOpen) {
        setNavHidden(y > 30);
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = setTimeout(() => setNavHidden(false), 350);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [menuOpen]);

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

  // No JS body-scroll lock here on purpose: this menu is a `fixed inset-0`
  // panel that fully covers the viewport, so it already intercepts every
  // touch — the body underneath can't receive scroll gestures regardless.
  // An earlier version pinned <body> to `position: fixed` (and before that,
  // `overflow: hidden` on <html>/<body>) to belt-and-suspenders the lock, but
  // both techniques raced with iOS Safari's touch/hit-testing pipeline and
  // could leave the whole viewport unresponsive to taps until the next
  // reflow — the toggle button (and every link) going dead on open.

  const toggleMenu = () => setMenuOpen((open) => !open);
  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="fixed z-50 top-2 inset-x-2 sm:top-3 sm:inset-x-3 lg:top-4 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-full lg:max-w-6xl">
      {/* The hide-on-scroll transform lives on this pill, not on <nav> itself:
          any element with a `transform` becomes the containing block for its
          `position: fixed` descendants — putting it on <nav> shrank the
          full-screen mobile menu overlay down to the pill's own box instead
          of the viewport, since the overlay is a fixed-position child of nav. */}
      <div
        className={`relative z-50 shadow-lg rounded-2xl lg:rounded-full lg:backdrop-blur-md transition-all duration-300 ease-out lg:translate-y-0! ${
          navHidden ? "-translate-y-24" : "translate-y-0"
        } ${scrolled ? "tp-navbar-bg-dark" : "tp-navbar-bg-light"}`}
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

        <div className="hidden lg:flex items-center gap-8 text-lg font-semibold">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-track={`nav_${link.label.toLowerCase()}`}
              className={`tp-nav-link-underline${isActive(link.href) ? " active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            data-track="nav_entrar"
            className="tp-btn-animated inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-base font-bold text-white shadow-lg shadow-blue-900/30 transition-transform hover:scale-105"
          >
            <LogIn className="h-4 w-4" />
            Entrar
          </Link>
        </div>

        <button
          type="button"
          onClick={toggleMenu}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          className="touch-manipulation lg:hidden relative z-50 flex items-center justify-center w-12 h-12 rounded-full text-purple-200 hover:text-brand-blue hover:bg-brand-blue/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
        >
          <span className="relative block h-6 w-6">
            <Menu
              className={`tp-menu-icon absolute inset-0 h-6 w-6 ${
                menuOpen ? "rotate-90 opacity-0" : "rotate-0 opacity-100"
              }`}
            />
            <X
              className={`tp-menu-icon absolute inset-0 h-6 w-6 ${
                menuOpen ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
              }`}
            />
          </span>
        </button>
      </div>
      </div>

      {menuOpen && (
        <div
          className="tp-menu-overlay-in fixed inset-0 z-40 lg:hidden overflow-y-auto overscroll-contain bg-[#0a0a18]/95"
        >
          {/* `min-h-full` (not the outer div's own `flex justify-center`) does
              the centering: a flex container with `justify-content: center`
              can't be scrolled to reach content that overflows past its
              start edge — with enough links open (6 + the Blog submenu +
              Entrar) that's exactly what happened, some links became
              unreachable. This still centers short content but lets tall
              content scroll normally from the top instead. */}
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) closeMenu();
            }}
            className="flex min-h-full w-full flex-col items-center justify-center gap-7 py-10 text-xl font-semibold"
          >
            {NAV_LINKS.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                data-track={`navmobile_${link.label.toLowerCase()}`}
                style={{ animationDelay: `${0.05 * i}s` }}
                className={`touch-manipulation tp-menu-link-in tp-nav-link-underline tp-mobile-nav-link${
                  isActive(link.href) ? " active" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div
              style={{ animationDelay: `${0.05 * NAV_LINKS.length}s` }}
              className="tp-menu-link-in"
            >
              <Link
                href="/login"
                onClick={closeMenu}
                data-track="navmobile_entrar"
                className="tp-btn-animated inline-flex items-center gap-1.5 rounded-full px-6 py-3 text-lg font-bold text-white shadow-lg transition-transform active:scale-95"
              >
                <LogIn className="h-5 w-5" />
                Entrar
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
