"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
};

// Plain CSS + IntersectionObserver fade-in — used to render scroll-triggered
// motion.div all over the site (up to a dozen times on the blog list alone),
// which pulled the whole Framer Motion library into every page's JS bundle
// just for an opacity+translateY transition. This does the same visual thing
// with zero extra JS shipped to the browser.
export default function Reveal({ children, className, delay = 0, y = 28, once = true }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
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
