"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEngagement, trackInteraction } from "@/lib/monitoring/engagement";

/**
 * Site-wide behaviour analytics collector, mounted once in the root layout
 * next to `MonitoringClient`. Renders nothing; wires three passive listeners:
 *
 *  0. One `engagement` / `session` event per tab session — device class,
 *     viewport, referrer source, and new-vs-returning visitor (audience
 *     breakdown in the monitoring report).
 *  1. Delegated `[data-track]` clicks (every page) — CTAs, nav links, the
 *     floating WhatsApp button. Fires an `interaction` / `click` event. The
 *     same listener also fires `interaction` / `outbound` for any click on a
 *     link to another origin.
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

  // 0. One session event per tab — device / viewport / referrer / returning.
  useEffect(() => {
    try {
      if (sessionStorage.getItem("tp_session_pinged")) return;
      sessionStorage.setItem("tp_session_pinged", "1");
    } catch {
      // no sessionStorage → still send once per mount
    }

    const w = window.innerWidth;
    const device = w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop";

    let visitor: "new" | "returning" = "new";
    try {
      visitor = localStorage.getItem("tp_returning") ? "returning" : "new";
      localStorage.setItem("tp_returning", "1");
    } catch {
      // ignore
    }

    let referrer = "(direct)";
    try {
      if (document.referrer) {
        const host = new URL(document.referrer).hostname.replace(/^www\./, "");
        if (host === window.location.hostname) referrer = "(internal)";
        else if (/google\./.test(host)) referrer = "google";
        else if (/(facebook|fb)\./.test(host)) referrer = "facebook";
        else if (/instagram\./.test(host)) referrer = "instagram";
        else if (/bing\./.test(host)) referrer = "bing";
        else if (/(t\.co|twitter\.|x\.com)/.test(host)) referrer = "twitter";
        else referrer = host;
      }
    } catch {
      // ignore
    }

    trackEngagement("session", 1, {
      device,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      referrer,
      visitor,
      landing: window.location.pathname,
    });
  }, []);

  // 1. Delegated CTA + outbound clicks — all routes, set up once.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;

      const tagged = target?.closest?.("[data-track]");
      const track = tagged?.getAttribute("data-track");
      if (track) {
        trackInteraction("click", {
          track,
          text: (tagged!.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60) || undefined,
          href: tagged instanceof HTMLAnchorElement && tagged.href ? tagged.href : undefined,
        });
      }

      const link = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (link?.href) {
        try {
          const u = new URL(link.href, window.location.href);
          if (
            (u.protocol === "http:" || u.protocol === "https:") &&
            u.host !== window.location.host
          ) {
            trackInteraction("outbound", {
              host: u.host.replace(/^www\./, ""),
              href: u.href.slice(0, 200),
            });
          }
        } catch {
          // not a parseable URL — ignore
        }
      }
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
