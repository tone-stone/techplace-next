"use client";

/**
 * Swiper carousel that renders a Facebook post per slide for the "Síguenos
 * en redes" landing section. Split out of `RedesSociales.tsx` and loaded
 * through `RedesCarousel.tsx`'s `next/dynamic({ ssr: false })` wrapper (see
 * that file) to keep Swiper out of the homepage's initial bundle.
 */

import { ExternalLink } from "lucide-react";
import { FaFacebookF } from "react-icons/fa6";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import type { SocialPost } from "@/lib/social/meta";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

/** Formats an ISO timestamp as a long-form Spanish (es-MX) date. */
function formatPostDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Truncates post text to `max` characters, appending an ellipsis if cut. */
function excerpt(text: string | null, max = 140): string {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

// Meta's CDN serves media from many rotating, signed-URL hostnames
// (scontent-*.fbcdn.net), so allowlisting them for next/image isn't practical
// — Meta already serves these pre-optimized, so a plain <img> is the right
// call here rather than double-processing them.
/** Single Facebook post rendered as a clickable card linking to the post. */
function PostCard({ post }: { post: SocialPost }) {
  return (
    <a
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="tp-blog-card group flex h-full w-full flex-col overflow-hidden rounded-2xl transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="relative h-48 w-full overflow-hidden bg-black/30">
        {post.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <span className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-lg">
          <FaFacebookF className="h-4 w-4" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="mb-3 flex-1 text-sm text-gray-300 text-justify">{excerpt(post.message)}</p>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{formatPostDate(post.timestamp)}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-brand-blue group-hover:underline">
            Ver publicación <ExternalLink className="h-3 w-3" />
          </span>
        </div>
      </div>
    </a>
  );
}

// Split out of RedesSociales.tsx and loaded via next/dynamic({ ssr: false })
// from RedesCarousel.tsx so Swiper's JS/CSS isn't part of the homepage's
// initial bundle — same treatment as PortafolioCarousel.
/**
 * Renders one `PostCard` slide per Facebook post. Loops only when there are
 * enough posts (>2) for Swiper's loop mode to work correctly.
 *
 * @param posts - Facebook posts to render as slides.
 */
export default function RedesCarouselSwiper({ posts }: { posts: SocialPost[] }) {
  return (
    <div className="relative">
      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        slidesPerView={1.1}
        centeredSlides
        spaceBetween={24}
        loop={posts.length > 2}
        autoplay={{ delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }}
        pagination={{ el: ".redes-pagination", clickable: true }}
        navigation={{ nextEl: ".redes-next", prevEl: ".redes-prev" }}
        breakpoints={{
          640: { slidesPerView: 1.6, centeredSlides: true },
          768: { slidesPerView: 2, centeredSlides: false, spaceBetween: 28 },
          1200: { slidesPerView: 3, centeredSlides: false },
        }}
        className="tp-swiper pb-14!"
      >
        {posts.map((post) => (
          <SwiperSlide key={post.id}>
            <PostCard post={post} />
          </SwiperSlide>
        ))}
        <div className="swiper-pagination redes-pagination" />
        <div className="swiper-button-next redes-next" />
        <div className="swiper-button-prev redes-prev" />
      </Swiper>
    </div>
  );
}
