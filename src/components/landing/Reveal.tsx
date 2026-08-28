"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
};

/**
 * Plain CSS + IntersectionObserver fade-in — used to render scroll-triggered
 * motion.div all over the site (up to a dozen times on the blog list alone),
 * which pulled the whole Framer Motion library into every page's JS bundle
 * just for an opacity+translateY transition. This does the same visual thing
 * with zero extra JS shipped to the browser.
 *
 * @param delay - Transition delay in seconds, used to stagger a group of
 * Reveal-wrapped siblings so they don't all animate in at once.
 * @param y - Vertical offset (px) the content starts translated from before
 * it settles into place.
 * @param once - When true (default) the reveal fires only the first time the
 * element enters the viewport; when false it re-triggers on every entry/exit.
 */
export default function Reveal({ children, className, delay = 0, y = 28, once = true }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const isNearViewport = () => {
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      return rect.top < viewportHeight * 0.8 && rect.bottom > 0;
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) cleanup();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.2 }
    );

    // Fallback safety net: an instant/very fast scroll jump (an anchor-link
    // navigation with `prefers-reduced-motion` forcing `scroll-behavior:
    // auto`, or a fast programmatic jump) can move an element across the
    // whole viewport between two animation frames, so the browser never
    // reports it as intersecting at all — IntersectionObserver only sees
    // "not visible" before and after, with nothing in between. Without this,
    // that content stays at opacity:0 forever. `once` elements stop
    // rechecking as soon as they're first revealed.
    let rafId: number | null = null;
    const scheduleCheck = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (isNearViewport()) {
          setVisible(true);
          if (once) cleanup();
        } else if (!once) {
          setVisible(false);
        }
      });
    };

    function cleanup() {
      observer.disconnect();
      window.removeEventListener("scroll", scheduleCheck);
      window.removeEventListener("resize", scheduleCheck);
      if (rafId !== null) cancelAnimationFrame(rafId);
    }

    observer.observe(el);
    window.addEventListener("scroll", scheduleCheck, { passive: true });
    window.addEventListener("resize", scheduleCheck);
    scheduleCheck();

    return cleanup;
  }, [once]);

  const style: CSSProperties = {
    "--tp-reveal-y": `${y}px`,
    transitionDelay: `${delay}s`,
  } as CSSProperties;

  return (
    <div
      ref={ref}
      style={style}
      className={`tp-reveal${visible ? " tp-reveal-visible" : ""}${className ? ` ${className}` : ""}`}
    >
      {children}
    </div>
  );
}
