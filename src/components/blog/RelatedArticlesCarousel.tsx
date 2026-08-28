"use client";

/**
 * "More articles" section shown at the bottom of a blog post — a Swiper
 * carousel of other published articles with tabs to filter by same category,
 * same author, or show everything.
 */

import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

type RelatedArticleItem = {
  slug: string;
  category: string;
  authorName: string;
  node: ReactNode;
};

type Filter = "todos" | "similares" | "redactor";

/**
 * Renders the filter tabs and the Swiper carousel of related article cards.
 *
 * @param items - Candidate related articles (already excluding the current
 * one), each carrying the metadata needed for the "similares"/"redactor"
 * filters plus its pre-rendered card node.
 * @param currentCategory - Category of the article being viewed, used by
 * the "Noticias parecidas" filter.
 * @param currentAuthor - Author of the article being viewed, used by the
 * "Mismo redactor" filter.
 */
export default function RelatedArticlesCarousel({
  items,
  currentCategory,
  currentAuthor,
}: {
  items: RelatedArticleItem[];
  currentCategory: string;
  currentAuthor: string;
}) {
  const [filter, setFilter] = useState<Filter>("todos");

  const filtered = useMemo(() => {
    if (filter === "similares") return items.filter((item) => item.category === currentCategory);
    if (filter === "redactor") return items.filter((item) => item.authorName === currentAuthor);
    return items;
  }, [items, filter, currentCategory, currentAuthor]);

  const tabs: { id: Filter; label: string }[] = [
    { id: "todos", label: "Todos" },
    { id: "similares", label: "Noticias parecidas" },
    { id: "redactor", label: "Mismo redactor" },
  ];

  return (
    <div className="mt-16">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading text-2xl font-bold">Más artículos</h2>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                filter === tab.id
                  ? "border-indigo-400 bg-indigo-500/20 text-white"
                  : "border-white/10 bg-white/5 text-gray-300 hover:border-indigo-400/40 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-400">No hay artículos que coincidan con este filtro todavía.</p>
      ) : (
        <div className="relative px-8 sm:px-12">
          <Swiper
            modules={[Navigation, Pagination]}
            slidesPerView={1.1}
            spaceBetween={20}
            navigation={{ nextEl: ".related-next", prevEl: ".related-prev" }}
            pagination={{ clickable: true }}
            breakpoints={{
              640: { slidesPerView: 1.6 },
              1024: { slidesPerView: 2.4 },
            }}
            className="tp-swiper pb-12!"
          >
            {filtered.map((item) => (
              <SwiperSlide key={item.slug} className="h-auto">
                {item.node}
              </SwiperSlide>
            ))}
          </Swiper>

          <button
            type="button"
            aria-label="Anterior"
            className="related-prev absolute left-0 top-20 z-10 -translate-y-1/2 cursor-pointer rounded-full border border-purple-400/30 bg-black/50 p-2 text-purple-200 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            className="related-next absolute right-0 top-20 z-10 -translate-y-1/2 cursor-pointer rounded-full border border-purple-400/30 bg-black/50 p-2 text-purple-200 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
