"use client";

import dynamic from "next/dynamic";
import type { SocialPost } from "@/lib/social/meta";

// Keeps Swiper's JS/CSS out of the homepage's initial bundle — it's fetched
// as its own chunk after hydration, same as PortafolioCarousel.
const RedesCarouselSwiper = dynamic(() => import("./RedesCarouselSwiper"), {
  ssr: false,
  loading: () => (
    <div className="tp-swiper flex gap-6 overflow-hidden">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="tp-blog-card h-80 w-full max-w-sm shrink-0 animate-pulse rounded-2xl"
        />
      ))}
    </div>
  ),
});

export default function RedesCarousel({ posts }: { posts: SocialPost[] }) {
  return <RedesCarouselSwiper posts={posts} />;
}
