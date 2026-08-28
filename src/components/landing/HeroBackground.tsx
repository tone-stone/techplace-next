"use client";

import { useEffect, useState } from "react";

/**
 * Background layer for the hero section.
 *
 * The looping `bg.mp4` is multi-megabyte and buys nothing on a phone, so we
 * only attach the <video> on wider viewports and when the browser isn't
 * asking us to save data. Everywhere else the (tiny) poster image stands in
 * — visually it's the video's first frame, just static. Same `.tp-video-bg`
 * class either way, so the brightness/blur treatment is identical.
 */
export default function HeroBackground() {
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const conn = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    if (conn?.saveData) return;

    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setShowVideo(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  if (!showVideo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- full-bleed decorative background, not content
      <img src="/img/backup-dark-bg.webp" alt="" aria-hidden className="tp-video-bg" />
    );
  }

  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      className="tp-video-bg"
      poster="/img/backup-dark-bg.webp"
    >
      <source src="/video/bg.mp4" type="video/mp4" />
    </video>
  );
}
