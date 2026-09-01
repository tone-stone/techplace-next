"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Google Analytics 4 + Meta (Facebook) Pixel, loaded from the root layout.
 *
 * Each tag renders only when its id is configured, via the build-time public
 * env vars `NEXT_PUBLIC_GA_ID` (e.g. `G-XXXXXXXXXX`) and
 * `NEXT_PUBLIC_META_PIXEL_ID` (numeric) — so local/preview builds without the
 * ids ship nothing, and the CSP in `next.config.ts` widens to allow these
 * hosts only when the ids are set.
 *
 * The inline bootstraps fire the first page view on hard load; the effect
 * below fires one more on every client-side route change (both tags need
 * this — GA4's history-based tracking is unreliable and Meta Pixel has none).
 *
 * Note: no consent gate. This matches the site's existing first-party
 * analytics; if a consent banner is added later, wrap these in it and switch
 * GA4 to Consent Mode.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export default function ThirdPartyAnalytics() {
  const pathname = usePathname();
  const firstRun = useRef(true);

  useEffect(() => {
    // The bootstrap scripts already counted the initial load.
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (GA_ID && typeof window.gtag === "function") {
      window.gtag("event", "page_view", {
        page_location: window.location.href,
        page_title: document.title,
      });
    }
    if (PIXEL_ID && typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [pathname]);

  if (!GA_ID && !PIXEL_ID) return null;

  return (
    <>
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','${GA_ID}');`}
          </Script>
        </>
      )}

      {PIXEL_ID && (
        <>
          <Script id="meta-pixel-init" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,
'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${PIXEL_ID}');fbq('track','PageView');`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}
    </>
  );
}
