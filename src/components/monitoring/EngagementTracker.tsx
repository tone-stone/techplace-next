"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEngagement, trackInteraction } from "@/lib/monitoring/engagement";

/**
 * Site-wide behaviour analytics collector, mounted once in the root layout
 * next to `MonitoringClient`. Renders nothing; wires three passive listeners:
 *
 *  1. Delegated `[data-track]` clicks (every page) — CTAs, nav links, the
 *     floating WhatsApp button. Fires an `interaction` / `click` event.
 *  2. Per-section dwell time (landing page only) — an IntersectionObserver
 *     accumulates how long each `<section id>` is at least half in view, and
 *     flushes the totals as `engagement` / `section_time` events on tab-hide
 *     and route change. Time spent with the tab backgrounded is not counted.
 *  3. Scroll depth (landing page only) — one `engagement` / `scroll_depth`
 *     event the first time each of 25/50/75/100 % is reached.
 *
 * The contact-form funnel is tracked separately, inside `Contacto.tsx`.
 */

const SECTION_VIEW_RATIO = 0.5;
const MIN_SECTION_MS = 1000;
const SCROLL_MARKS = [25, 50, 75, 100] as const;

export default function EngagementTracker() {
  const pathname = usePathname();

  // 1. Delegated CTA clicks — all routes, set up once.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const el = target?.closest?.("[data-track]");
      if (!el) return;
      const track = el.getAttribute("data-track");
      if (!track) return;
      trackInteraction("click", {
        track,
        text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60) || undefined,
        href: el instanceof HTMLAnchorElement && el.href ? el.href : undefined,
      });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  // 2 + 3. Section dwell time and scroll depth — landing page only, re-armed
  // on navigation so a client-side route change starts clean.
  useEffect(() => {
    if (pathname !== "/") return;

    const sections = Array.from(document.querySelectorAll<HTMLElement>("section[id]"));
    if (sections.length === 0) return;

    /** Accumulated (not yet reported) visible time per section id, in ms. */
    const acc = new Map<string, number>();
    let lastTick = performance.now();

    /** True when at least half the section — or half the viewport — shows it. */
    const isViewing = (el: HTMLElement): boolean => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const r = el.getBoundingClientRect();
      const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
      if (visible <= 0 || vh <= 0) return false;
      return visible / r.height >= SECTION_VIEW_RATIO || visible / vh >= SECTION_VIEW_RATIO;
    };

    /** Add the time since the previous tick to every currently-viewed section. */
    const tick = () => {
      const now = performance.now();
      const delta = now - lastTick;
      lastTick = now;
      if (document.hidden || delta <= 0 || delta > 5 * MIN_SECTION_MS) return;
      for (const el of sections) {
        if (el.id && isViewing(el)) acc.set(el.id, (acc.get(el.id) ?? 0) + delta);
      }
    };

    /** Emit one section_time event per section with meaningful dwell, then zero it. */
    const flush = () => {
      tick();
      for (const [id, ms] of acc) {
        if (ms >= MIN_SECTION_MS) {
          trackEngagement("section_time", Math.round(ms), { section: id });
          acc.set(id, 0);
        }
      }
    };

    const onVisibility = () => {
      if (document.hidden) flush();
      else lastTick = performance.now();
    };
    const onPageHide = () => flush();

    // Scroll depth — one event per 25/50/75/100 % threshold, first time reached.
    const sent = new Set<number>();
    let scrollQueued = false;
    const measureDepth = () => {
      scrollQueued = false;
      const scrollHeight = document.documentElement.scrollHeight;
      const depth =
        scrollHeight <= 0 ? 100 : ((window.scrollY + window.innerHeight) / scrollHeight) * 100;
      for (const mark of SCROLL_MARKS) {
        if (depth >= mark - 0.5 && !sent.has(mark)) {
          sent.add(mark);
          trackEngagement("scroll_depth", mark);
        }
      }
    };
    const onScroll = () => {
      if (scrollQueued) return;
      scrollQueued = true;
      requestAnimationFrame(measureDepth);
    };

    const interval = window.setInterval(tick, 1000);
    measureDepth();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      flush();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  return null;
}
