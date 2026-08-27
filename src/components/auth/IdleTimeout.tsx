"use client";

import { useEffect, useRef } from "react";
import { logout } from "@/lib/auth/actions";
import { IDLE_TIMEOUT_MS } from "@/lib/auth/session";

// Signs the user out after IDLE_TIMEOUT_MS with no interaction. proxy.ts and
// requireAdmin() enforce the same window server-side; this is the piece that
// reacts while the user is just sitting on a dashboard without navigating.
export default function IdleTimeout({ redirectTo }: { redirectTo: string }) {
  const lastActive = useRef(0);
  const fired = useRef(false);

  useEffect(() => {
    lastActive.current = Date.now();

    const bump = () => {
      lastActive.current = Date.now();
    };
    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));

    const check = async () => {
      if (fired.current) return;
      if (Date.now() - lastActive.current < IDLE_TIMEOUT_MS) return;
      fired.current = true;
      const fd = new FormData();
      fd.set("redirectTo", `${redirectTo}?expired=1`);
      try {
        await logout(fd);
      } catch {
        // redirect() inside the action navigates us away; nothing to handle
      }
    };

    const interval = window.setInterval(check, 30_000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [redirectTo]);

  return null;
}
